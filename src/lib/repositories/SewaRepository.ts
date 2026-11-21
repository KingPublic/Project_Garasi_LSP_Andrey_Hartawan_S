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
 * Repository untuk transaksi penyewaan garasi dan perpanjangan masa sewa.
 *
 * @class SewaRepository
 * @implements {ISewaRepository}
 */
export class SewaRepository implements ISewaRepository {
	/**
	 * Mencari detail transaksi sewa lengkap dengan relasi Garasi, Kendaraan, Penyewa, dan Perpanjangan.
	 *
	 * @param {number} id - ID transaksi sewa.
	 * @returns {Promise<SewaDetail | null>} Detail transaksi sewa atau null.
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
	 * Mengambil seluruh riwayat sewa milik seorang penyewa tertentu.
	 *
	 * @param {number} penyewaId - ID pengguna penyewa.
	 * @returns {Promise<Array<Sewa & { garasi: Garasi; kendaraan: Kendaraan }>>} Daftar riwayat sewa.
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
	 * Mengambil seluruh jadwal sewa aktif pada suatu unit garasi untuk pengecekan anti-bentrok.
	 * Mencakup sewa berstatus AKTIF dan MENUNGGU_VERIFIKASI agar tidak terjadi double-booking.
	 *
	 * @param {string} garasiId - Kode unit garasi.
	 * @returns {Promise<Sewa[]>} Daftar transaksi sewa aktif pada unit garasi.
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
	 * Mengambil jadwal sewa aktif untuk satu kendaraan tertentu berdasarkan kendaraanId.
	 * Mencegah satu kendaraan menyewa lebih dari satu garasi di rentang waktu yang sama.
	 *
	 * @param {number} kendaraanId - ID kendaraan terdaftar.
	 * @returns {Promise<Sewa[]>} Daftar transaksi sewa aktif untuk kendaraan tersebut.
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
	 * Mengambil jadwal sewa aktif untuk satu kendaraan berdasarkan nomor plat dan penyewaId.
	 * Digunakan saat pendaftaran kendaraan baru agar tidak bentrok dengan plat yang sama.
	 *
	 * @param {number} penyewaId - ID penyewa.
	 * @param {string} nomorPlat - Nomor plat polisi kendaraan.
	 * @returns {Promise<Sewa[]>} Daftar sewa aktif untuk plat tersebut.
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
	 * Mengambil seluruh transaksi sewa aktif / pending verifikasi di sistem (mencegah masalah N+1 query).
	 *
	 * @returns {Promise<Sewa[]>} Daftar seluruh sewa aktif.
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
	 * Mengambil daftar transaksi sewa yang sedang menunggu verifikasi pembayaran oleh Admin.
	 *
	 * @returns {Promise<SewaDetail[]>} Daftar sewa yang butuh verifikasi.
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
	 * Memperbarui status transaksi sewa ('AKTIF' atau 'DITOLAK').
	 *
	 * @param {number} sewaId - ID transaksi sewa.
	 * @param {StatusSewa} status - Status baru.
	 * @returns {Promise<Sewa>} Transaksi sewa yang diperbarui.
	 */
	public async updateStatusSewa(sewaId: number, status: StatusSewa): Promise<Sewa> {
		return db.sewa.update({
			where: { id: sewaId },
			data: { statusSewa: status }
		});
	}

	/**
	 * Mengambil daftar transaksi sewa yang sedang aktif pada hari ini (tanggalMulai <= today && tanggalSelesai > today).
	 * Digunakan pada form Admin Perpanjangan Sewa.
	 *
	 * @param {Date} today - Tanggal hari ini.
	 * @returns {Promise<SewaDetail[]>} Daftar transaksi sewa aktif hari ini.
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
	 * Menyimpan transaksi sewa baru ke dalam basis data.
	 *
	 * @param {Omit<SewaDTO, 'id' | 'createdAt'>} data - Data transaksi sewa baru.
	 * @returns {Promise<Sewa>} Transaksi sewa yang tersimpan.
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
	 * Memperbarui tanggal selesai, mengakumulasi total biaya, dan menambah jumlah hari saat perpanjangan berhasil.
	 *
	 * @param {number} sewaId - ID transaksi sewa.
	 * @param {Date} tanggalSelesaiBaru - Tanggal selesai baru.
	 * @param {number} tambahanBiaya - Tambahan biaya perpanjangan.
	 * @param {number} tambahanHari - Jumlah tambahan hari durasi perpanjangan.
	 * @returns {Promise<Sewa>} Transaksi sewa yang telah diperbarui.
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
	 * Menyimpan riwayat perpanjangan masa sewa ke tabel PerpanjanganSewa.
	 *
	 * @param {Omit<PerpanjanganSewaDTO, 'id' | 'createdAt'>} data - Data perpanjangan.
	 * @returns {Promise<PerpanjanganSewa>} Riwayat perpanjangan tersimpan.
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
	 * Mengambil data laporan persewaan dengan 4 dimensi filter dinamis (bulan, hari, tipe garasi, penyewa).
	 *
	 * @param {LaporanFilterInput} filter - Parameter filter.
	 * @returns {Promise<LaporanData>} Ringkasan total transaksi, total omzet, dan daftar transaksi.
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
