/**
 * @file GarasiService.ts
 * @description Service orkestrasi inventaris garasi, pembuatan massal berkelompok,
 * dan pengecekan ketersediaan unit anti-bentrok jadwal.
 */

import type { Garasi } from '../generated/prisma/client';
import { GarasiModel } from '../models/GarasiModel';
import { SewaModel } from '../models/SewaModel';
import type { TipeGarasi, TipeKendaraan } from '../models/types';
import { normalizeToUtcDate } from '../utils/date';
import type { IGarasiRepository, ISewaRepository } from '../repositories/interfaces';
import { garasiRepository } from '../repositories/GarasiRepository';
import { sewaRepository } from '../repositories/SewaRepository';

/**
 * Service untuk operasi dan ketersediaan unit Garasi.
 *
 * @class GarasiService
 */
export class GarasiService {
	private garasiRepo: IGarasiRepository;
	private sewaRepo: ISewaRepository;

	/**
	 * Konstruktor GarasiService dengan dependency injection.
	 *
	 * @constructor
	 * @param {IGarasiRepository} [garasiRepo=garasiRepository] - Repository garasi.
	 * @param {ISewaRepository} [sewaRepo=sewaRepository] - Repository sewa.
	 */
	constructor(
		garasiRepo: IGarasiRepository = garasiRepository,
		sewaRepo: ISewaRepository = sewaRepository
	) {
		this.garasiRepo = garasiRepo;
		this.sewaRepo = sewaRepo;
	}

	/**
	 * Menambahkan unit garasi baru secara berkelompok (massal) per tipe:
	 * 1. Mengambil nomor urut terakhir di database.
	 * 2. Memvalidasi batas kumulatif 999 unit per tipe agar tidak melebihi 3 digit.
	 * 3. Menghasilkan kode otomatis (S001..S999, C001..C999, E001..E999).
	 * 4. Menyimpan seluruh unit baru ke database.
	 *
	 * @param {TipeGarasi} tipe - Tipe garasi ('SEPEDA', 'MOBIL', 'MOBIL_LISTRIK').
	 * @param {number} jumlahBaru - Jumlah unit yang ingin dibuat.
	 * @param {number} hargaHarian - Tarif sewa harian.
	 * @param {number | null} [hargaListrikPerKwh] - Tarif listrik per kWh (khusus MOBIL_LISTRIK).
	 * @returns {Promise<number>} Jumlah unit yang berhasil dibuat.
	 */
	public async buatGarasiMassal(
		tipe: TipeGarasi,
		jumlahBaru: number,
		hargaHarian: number,
		hargaListrikPerKwh?: number | null
	): Promise<number> {
		const nomorUrutTerakhir = await this.garasiRepo.getNomorUrutTerakhir(tipe);
		const garasiModels = GarasiModel.generateKelompok(
			tipe,
			nomorUrutTerakhir,
			jumlahBaru,
			hargaHarian,
			hargaListrikPerKwh
		);

		const dtos = garasiModels.map((m) => m.toDTO());
		return this.garasiRepo.createMany(dtos);
	}

	/**
	 * Mengambil seluruh daftar unit garasi di sistem.
	 *
	 * @returns {Promise<Garasi[]>} Daftar seluruh garasi.
	 */
	public async getDaftarGarasi(): Promise<Garasi[]> {
		return this.garasiRepo.findAll();
	}

	/**
	 * Mencari unit-unit garasi yang kompatibel dengan jenis kendaraan dan
	 * TIDAK memiliki jadwal sewa aktif yang bertabrakan (anti-overlap) pada rentang tanggal yang dipilih.
	 *
	 * @param {TipeKendaraan} tipeKendaraan - Tipe kendaraan penyewa.
	 * @param {Date | string} tanggalMulai - Tanggal mulai sewa.
	 * @param {Date | string} tanggalSelesai - Tanggal selesai sewa.
	 * @returns {Promise<Garasi[]>} Daftar unit garasi yang siap disewa.
	 */
	public async getGarasiTersedia(
		tipeKendaraan: TipeKendaraan,
		tanggalMulai: Date | string,
		tanggalSelesai: Date | string
	): Promise<Garasi[]> {
		const tMulai = normalizeToUtcDate(tanggalMulai);
		const tSelesai = normalizeToUtcDate(tanggalSelesai);

		const semuaGarasi = await this.garasiRepo.findAll();
		const garasiTersedia: Garasi[] = [];

		for (const g of semuaGarasi) {
			const model = new GarasiModel({
				id: g.id,
				tipeGarasi: g.tipeGarasi as TipeGarasi,
				nomorUrut: g.nomorUrut,
				hargaHarian: g.hargaHarian,
				hargaListrikPerKwh: g.hargaListrikPerKwh,
				status: g.status as any
			});

			// Cek kecocokan tipe kendaraan dengan garasi
			if (!model.cocokDenganKendaraan(tipeKendaraan)) {
				continue;
			}

			// Cek bentrok jadwal dengan sewa aktif pada garasi ini
			const jadwalAktif = await this.sewaRepo.findActiveSewaByGarasiId(g.id);
			let isBentrok = false;

			for (const sewa of jadwalAktif) {
				if (SewaModel.cekBentrokJadwal(tMulai, tSelesai, sewa.tanggalMulai, sewa.tanggalSelesai)) {
					isBentrok = true;
					break;
				}
			}

			if (!isBentrok) {
				garasiTersedia.push(g);
			}
		}

		return garasiTersedia;
	}

	/**
	 * Melakukan sinkronisasi status kolom `Garasi.status` ('AVAILABLE' vs 'USED')
	 * secara real-time berdasarkan transaksi sewa aktif pada hari ini.
	 *
	 * @param {Date} [today=new Date()] - Tanggal acuan sinkronisasi.
	 * @returns {Promise<void>}
	 */
	public async sinkronisasiStatusGarasiHariIni(today: Date = new Date()): Promise<void> {
		const semuaGarasi = await this.garasiRepo.findAll();
		const sewaAktifHariIni = await this.sewaRepo.findSewaAktifHariIni(today);
		const garasiIdUsedSet = new Set(sewaAktifHariIni.map((s) => s.garasiId));

		for (const g of semuaGarasi) {
			const shouldBeUsed = garasiIdUsedSet.has(g.id);
			if (shouldBeUsed && g.status !== 'USED') {
				await this.garasiRepo.updateStatus(g.id, 'USED');
			} else if (!shouldBeUsed && g.status !== 'AVAILABLE') {
				await this.garasiRepo.updateStatus(g.id, 'AVAILABLE');
			}
		}
	}
}

export const garasiService = new GarasiService();
