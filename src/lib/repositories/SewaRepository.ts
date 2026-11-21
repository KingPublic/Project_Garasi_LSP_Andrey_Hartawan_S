/**
 * @file SewaRepository.ts
 * @description Implementasi repository akses basis data untuk transaksi Sewa dan PerpanjanganSewa menggunakan Prisma.
 */

import { db } from '../server/db';
import type { Garasi, Kendaraan, PerpanjanganSewa, Prisma, Sewa } from '../generated/prisma/client';
import {
	addDays,
	createUtcDate,
	getDaysInMonth,
	normalizeToUtcDate
} from '../utils/date';
import type { PerpanjanganSewaDTO, SewaDTO, StatusSewa } from '../models/types';
import type {
	ISewaRepository,
	LaporanData,
	LaporanFilterInput,
	SewaDetail
} from './interfaces';

/**
 * Repository untuk operasi transaksi sewa dan perpanjangan di database.
 *
 * @author Andrey Hartawan Suwardi
 * @version 1.0
 */
export class SewaRepository implements ISewaRepository {
	/**
	 * Mencari detail transaksi sewa lengkap dengan relasi garasi, kendaraan, penyewa, dan riwayat perpanjangan.
	 *
	 * @param id - ID transaksi sewa.
	 */
	public async findById(id: number): Promise<SewaDetail | null> {
		return db.sewa.findUnique({
			where: { id },
			include: {
				garasi: true,
				kendaraan: true,
				penyewa: true,
				perpanjangan: {
					orderBy: { createdAt: 'desc' }
				}
			}
		});
	}

	/**
	 * Mengambil riwayat sewa milik seorang penyewa.
	 *
	 * @param penyewaId - ID akun penyewa.
	 */
	public async findByPenyewaId(
		penyewaId: number
	): Promise<Array<Sewa & { garasi: Garasi; kendaraan: Kendaraan }>> {
		return db.sewa.findMany({
			where: { penyewaId },
			include: {
				garasi: true,
				kendaraan: true
			},
			orderBy: { createdAt: 'desc' }
		});
	}

	/**
	 * Mengambil transaksi sewa aktif/menunggu verifikasi pada satu unit garasi untuk cek anti-bentrok.
	 *
	 * @param garasiId - Kode unit garasi.
	 */
	public async findActiveSewaByGarasiId(garasiId: string): Promise<Sewa[]> {
		return db.sewa.findMany({
			where: {
				garasiId,
				statusSewa: { in: ['AKTIF', 'MENUNGGU_VERIFIKASI'] }
			},
			orderBy: { tanggalMulai: 'asc' }
		});
	}

	/**
	 * Mengambil transaksi sewa aktif/menunggu verifikasi untuk satu kendaraan terdaftar.
	 *
	 * @param kendaraanId - ID kendaraan.
	 */
	public async findActiveSewaByKendaraanId(kendaraanId: number): Promise<Sewa[]> {
		return db.sewa.findMany({
			where: {
				kendaraanId,
				statusSewa: { in: ['AKTIF', 'MENUNGGU_VERIFIKASI'] }
			},
			orderBy: { tanggalMulai: 'asc' }
		});
	}

	/**
	 * Mengambil transaksi sewa aktif/menunggu verifikasi untuk nomor plat kendaraan tertentu milik penyewa.
	 *
	 * @param penyewaId - ID akun penyewa.
	 * @param nomorPlat - Nomor plat kendaraan.
	 */
	public async findActiveSewaByNomorPlat(penyewaId: number, nomorPlat: string): Promise<Sewa[]> {
		return db.sewa.findMany({
			where: {
				penyewaId,
				kendaraan: {
					nomorPlat: {
						equals: nomorPlat.trim(),
						mode: 'insensitive'
					}
				},
				statusSewa: { in: ['AKTIF', 'MENUNGGU_VERIFIKASI'] }
			},
			orderBy: { tanggalMulai: 'asc' }
		});
	}

	/**
	 * Mengambil seluruh transaksi sewa yang sedang aktif atau menunggu verifikasi di sistem.
	 */
	public async findAllActiveSewa(): Promise<Sewa[]> {
		return db.sewa.findMany({
			where: {
				statusSewa: { in: ['AKTIF', 'MENUNGGU_VERIFIKASI'] }
			},
			orderBy: { tanggalMulai: 'asc' }
		});
	}

	/**
	 * Mengambil transaksi sewa yang sedang menunggu verifikasi pembayaran oleh Admin.
	 */
	public async findSewaMenungguVerifikasi(): Promise<SewaDetail[]> {
		return db.sewa.findMany({
			where: {
				statusSewa: 'MENUNGGU_VERIFIKASI'
			},
			include: {
				garasi: true,
				kendaraan: true,
				penyewa: true,
				perpanjangan: true
			},
			orderBy: { createdAt: 'desc' }
		});
	}

	/**
	 * Memperbarui status transaksi sewa (misalnya AKTIF atau DITOLAK).
	 *
	 * @param sewaId - ID transaksi sewa.
	 * @param status - Status baru.
	 */
	public async updateStatusSewa(sewaId: number, status: StatusSewa): Promise<Sewa> {
		return db.sewa.update({
			where: { id: sewaId },
			data: { statusSewa: status }
		});
	}

	/**
	 * Mengambil daftar transaksi sewa yang sedang aktif pada hari tertentu.
	 *
	 * @param today - Tanggal acuan.
	 */
	public async findSewaAktifHariIni(today: Date): Promise<SewaDetail[]> {
		const targetDate = normalizeToUtcDate(today);

		return db.sewa.findMany({
			where: {
				statusSewa: 'AKTIF',
				tanggalMulai: { lte: targetDate },
				tanggalSelesai: { gt: targetDate }
			},
			include: {
				garasi: true,
				kendaraan: true,
				penyewa: true,
				perpanjangan: true
			},
			orderBy: { tanggalSelesai: 'asc' }
		});
	}

	/**
	 * Menyimpan transaksi sewa baru ke database.
	 *
	 * @param data - Data transaksi sewa baru.
	 */
	public async create(data: Omit<SewaDTO, 'id' | 'createdAt'>): Promise<Sewa> {
		return db.sewa.create({
			data: {
				penyewaId: data.penyewaId,
				garasiId: data.garasiId,
				kendaraanId: data.kendaraanId,
				tipeSewa: data.tipeSewa,
				jumlahHari: data.jumlahHari,
				tanggalMulai: normalizeToUtcDate(data.tanggalMulai),
				tanggalSelesai: normalizeToUtcDate(data.tanggalSelesai),
				sisaBateraiKwh: data.sisaBateraiKwh,
				biayaSewa: data.biayaSewa,
				biayaListrik: data.biayaListrik,
				totalBiaya: data.totalBiaya,
				buktiBayarPath: data.buktiBayarPath,
				statusSewa: data.statusSewa ?? 'AKTIF'
			}
		});
	}

	/**
	 * Memperbarui tanggal selesai, menambah biaya, dan menambah durasi hari sewa saat perpanjangan.
	 *
	 * @param sewaId - ID transaksi sewa.
	 * @param tanggalSelesaiBaru - Tanggal selesai baru.
	 * @param tambahanBiaya - Nominal biaya tambahan.
	 * @param tambahanHari - Durasi hari perpanjangan.
	 */
	public async updateTanggalSelesaiDanBiaya(
		sewaId: number,
		tanggalSelesaiBaru: Date,
		tambahanBiaya: number,
		tambahanHari: number
	): Promise<Sewa> {
		return db.sewa.update({
			where: { id: sewaId },
			data: {
				tanggalSelesai: normalizeToUtcDate(tanggalSelesaiBaru),
				biayaSewa: {
					increment: tambahanBiaya
				},
				totalBiaya: {
					increment: tambahanBiaya
				},
				jumlahHari: {
					increment: tambahanHari
				}
			}
		});
	}

	/**
	 * Menyimpan catatan riwayat perpanjangan sewa ke tabel PerpanjanganSewa.
	 *
	 * @param data - Data perpanjangan sewa.
	 */
	public async createPerpanjangan(
		data: Omit<PerpanjanganSewaDTO, 'id' | 'createdAt'>
	): Promise<PerpanjanganSewa> {
		return db.perpanjanganSewa.create({
			data: {
				sewaId: data.sewaId,
				tanggalSelesaiLama: normalizeToUtcDate(data.tanggalSelesaiLama),
				tanggalSelesaiBaru: normalizeToUtcDate(data.tanggalSelesaiBaru),
				tambahanHari: data.tambahanHari,
				biayaTambahan: data.biayaTambahan,
				buktiBayarPath: data.buktiBayarPath
			}
		});
	}

	/**
	 * Mengambil data laporan sewa dengan filter dinamis (bulan/tahun, tanggal harian, tipe garasi, penyewa).
	 *
	 * @param filter - Parameter filter laporan.
	 */
	public async getLaporan(filter: LaporanFilterInput): Promise<LaporanData> {
		const whereClause: Prisma.SewaWhereInput = {};

		// Filter 1: Per bulan dalam tahun tertentu
		if (filter.bulan && filter.tahun) {
			const startOfMonth = createUtcDate(filter.tahun, filter.bulan, 1);
			const totalDays = getDaysInMonth(startOfMonth);
			const endOfMonth = addDays(startOfMonth, totalDays);

			whereClause.tanggalMulai = {
				gte: startOfMonth,
				lt: endOfMonth
			};
		}
		// Filter 2: Per hari dalam bulan tertentu
		else if (filter.tanggal) {
			const startOfDay = normalizeToUtcDate(filter.tanggal);
			const endOfDay = addDays(startOfDay, 1);

			whereClause.tanggalMulai = {
				gte: startOfDay,
				lt: endOfDay
			};
		}

		// Filter 3: Per Tipe Garasi
		if (filter.tipeGarasi) {
			whereClause.garasi = {
				tipeGarasi: filter.tipeGarasi
			};
		}

		// Filter 4: Per Penyewa
		if (filter.penyewaId) {
			whereClause.penyewaId = filter.penyewaId;
		}

		const daftarTransaksi = await db.sewa.findMany({
			where: whereClause,
			include: {
				garasi: true,
				kendaraan: true,
				penyewa: true,
				perpanjangan: true
			},
			orderBy: { tanggalMulai: 'desc' }
		});

		const totalPendapatan = daftarTransaksi
			.filter((t) => t.statusSewa === 'AKTIF' || t.statusSewa === 'SELESAI')
			.reduce((acc, curr) => acc + curr.totalBiaya, 0);

		return {
			totalTransaksi: daftarTransaksi.length,
			totalPendapatan,
			daftarTransaksi
		};
	}
}

export const sewaRepository = new SewaRepository();
