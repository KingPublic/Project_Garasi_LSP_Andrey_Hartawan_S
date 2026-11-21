/**
 * @file SewaService.ts
 * @description Service orkestrasi transaksi sewa garasi baru, pencegahan IDOR kendaraan,
 * validasi anti-bentrok, perhitungan biaya murni, dan perpanjangan masa sewa oleh Admin.
 */

import type { Garasi, Kendaraan, PerpanjanganSewa, Sewa } from '../generated/prisma/client';
import { KendaraanModel } from '../models/KendaraanModel';
import { SewaModel } from '../models/SewaModel';
import { UserModel } from '../models/UserModel';
import type { Role, StatusSewa, StatusVerifikasi, TipeGarasi, TipeKendaraan, TipeSewa } from '../models/types';
import { getTodayUtcDate, normalizeToUtcDate } from '../utils/date';
import type {
	IGarasiRepository,
	IKendaraanRepository,
	ISewaRepository,
	IUserRepository,
	SewaDetail
} from '../repositories/interfaces';
import { garasiRepository } from '../repositories/GarasiRepository';
import { kendaraanRepository } from '../repositories/KendaraanRepository';
import { sewaRepository } from '../repositories/SewaRepository';
import { userRepository } from '../repositories/UserRepository';

export interface BuatSewaServiceParams {
	penyewaId: number;
	garasiId: string;
	kendaraanId?: number;
	tipeKendaraan: TipeKendaraan;
	nomorPlat?: string | null;
	merekTipe: string;
	kapasitasBateraiKwh?: number | null;
	tipeSewa: TipeSewa;
	tanggalMulai: Date | string;
	jumlahHari?: number;
	sisaBateraiKwh?: number | null;
	buktiBayarPath: string;
	statusSewa?: StatusSewa;
	referenceDateToday?: Date | string;
}

export interface PerpanjangSewaServiceParams {
	sewaId: number;
	tanggalSelesaiBaru: Date | string;
	buktiBayarPath: string;
}

/**
 * Service untuk menangani transaksi penyewaan dan perpanjangan garasi.
 *
 * @class SewaService
 */
export class SewaService {
	private userRepo: IUserRepository;
	private garasiRepo: IGarasiRepository;
	private kendaraanRepo: IKendaraanRepository;
	private sewaRepo: ISewaRepository;

	/**
	 * Konstruktor SewaService dengan dependency injection.
	 *
	 * @constructor
	 * @param {IUserRepository} [userRepo=userRepository] - Repository user.
	 * @param {IGarasiRepository} [garasiRepo=garasiRepository] - Repository garasi.
	 * @param {IKendaraanRepository} [kendaraanRepo=kendaraanRepository] - Repository kendaraan.
	 * @param {ISewaRepository} [sewaRepo=sewaRepository] - Repository sewa.
	 */
	constructor(
		userRepo: IUserRepository = userRepository,
		garasiRepo: IGarasiRepository = garasiRepository,
		kendaraanRepo: IKendaraanRepository = kendaraanRepository,
		sewaRepo: ISewaRepository = sewaRepository
	) {
		this.userRepo = userRepo;
		this.garasiRepo = garasiRepo;
		this.kendaraanRepo = kendaraanRepo;
		this.sewaRepo = sewaRepo;
	}

	/**
	 * Memproses transaksi Sewa Baru:
	 * 1. Validasi penyewa terdaftar dan berstatus 'APPROVED' (hanya APPROVED yang boleh menyewa).
	 * 2. Validasi unit garasi ada.
	 * 3. Validasi kepemilikan kendaraan (pencegahan celah IDOR jika kendaraanId diberikan).
	 * 4. Pra-validasi model sewa dan anti-bentrok SEBELUM membuat entitas baru di basis data (mencegah data sampah).
	 * 5. Simpan transaksi ke database & ubah status garasi menjadi 'USED' jika tanggalMulai mencakup hari ini.
	 *
	 * @param {BuatSewaServiceParams} params - Parameter transaksi sewa.
	 * @returns {Promise<Sewa>} Transaksi sewa yang tersimpan.
	 * @throws {Error} Jika validasi status penyewa, kepemilikan kendaraan, kecocokan garasi, atau bentrok tanggal gagal.
	 */
	public async buatSewaBaru(params: BuatSewaServiceParams): Promise<Sewa> {
		// 1. Validasi status verifikasi penyewa
		const penyewa = await this.userRepo.findById(params.penyewaId);
		if (!penyewa) {
			throw new Error(`Penyewa dengan ID ${params.penyewaId} tidak ditemukan.`);
		}

		const userModel = new UserModel({
			id: penyewa.id,
			nik: penyewa.nik,
			namaLengkap: penyewa.namaLengkap,
			noTelepon: penyewa.noTelepon,
			email: penyewa.email,
			role: penyewa.role as Role,
			statusVerifikasi: penyewa.statusVerifikasi as StatusVerifikasi
		});
		userModel.validasiBisaMenyewa();

		// 2. Validasi garasi
		const garasi = await this.garasiRepo.findById(params.garasiId);
		if (!garasi) {
			throw new Error(`Unit garasi '${params.garasiId}' tidak ditemukan.`);
		}

		// 3. Penanganan Data Kendaraan & Pencegahan IDOR
		let kendaraanId: number;
		let tipeKendaraanFinal: TipeKendaraan;
		let nomorPlatFinal: string | null;
		let merekTipeFinal: string;
		let kapasitasBateraiFinal: number | null;
		let kendaraanBaruModel: KendaraanModel | null = null;

		if (params.kendaraanId) {
			const existingKendaraan = await this.kendaraanRepo.findById(params.kendaraanId);
			if (!existingKendaraan) {
				throw new Error(`Kendaraan dengan ID ${params.kendaraanId} tidak ditemukan.`);
			}

			// Proteksi IDOR: Pastikan kendaraan benar-benar milik penyewa yang sedang menyewa
			if (existingKendaraan.penyewaId !== params.penyewaId) {
				throw new Error(`Kendaraan dengan ID ${params.kendaraanId} bukan milik penyewa terkait.`);
			}

			kendaraanId = existingKendaraan.id;
			tipeKendaraanFinal = existingKendaraan.tipeKendaraan as TipeKendaraan;
			nomorPlatFinal = existingKendaraan.nomorPlat;
			merekTipeFinal = existingKendaraan.merekTipe;
			kapasitasBateraiFinal = existingKendaraan.kapasitasBateraiKwh;
		} else {
			// Pra-validasi KendaraanModel baru di memori terlebih dahulu tanpa menyimpan ke DB
			kendaraanBaruModel = new KendaraanModel({
				penyewaId: params.penyewaId,
				tipeKendaraan: params.tipeKendaraan,
				nomorPlat: params.nomorPlat ?? null,
				merekTipe: params.merekTipe,
				kapasitasBateraiKwh: params.kapasitasBateraiKwh ?? null
			});

			tipeKendaraanFinal = kendaraanBaruModel.tipeKendaraan;
			nomorPlatFinal = kendaraanBaruModel.nomorPlat;
			merekTipeFinal = kendaraanBaruModel.merekTipe;
			kapasitasBateraiFinal = kendaraanBaruModel.kapasitasBateraiKwh;
			kendaraanId = 0; // Placeholder sementara sebelum validasi sewa lulus
		}

		// 4. Validasi kesesuaian tipe kendaraan dengan tipe garasi
		const validatorKendaraan = new KendaraanModel({
			penyewaId: params.penyewaId,
			tipeKendaraan: tipeKendaraanFinal,
			nomorPlat: nomorPlatFinal,
			merekTipe: merekTipeFinal,
			kapasitasBateraiKwh: kapasitasBateraiFinal
		});
		validatorKendaraan.validasiKesesuaianGarasi(garasi.tipeGarasi as TipeGarasi);

		// 5. Ambil jadwal aktif pada garasi untuk pengecekan anti-bentrok garasi
		const jadwalAktif = await this.sewaRepo.findActiveSewaByGarasiId(garasi.id);

		// Ambil jadwal sewa aktif pada kendaraan (mencegah 1 kendaraan menyewa 2 garasi di waktu yang sama)
		let jadwalAktifKendaraan: Sewa[] = [];
		if (params.kendaraanId) {
			jadwalAktifKendaraan = await this.sewaRepo.findActiveSewaByKendaraanId(params.kendaraanId);
		} else if (nomorPlatFinal) {
			jadwalAktifKendaraan = await this.sewaRepo.findActiveSewaByNomorPlat(params.penyewaId, nomorPlatFinal);
		}

		// 6. Instansiasi dan validasi SewaModel secara ketat sebelum mutasi basis data
		const sewaModel = SewaModel.buatSewaBaru({
			penyewaId: params.penyewaId,
			garasiId: garasi.id,
			kendaraanId,
			tipeSewa: params.tipeSewa,
			tanggalMulai: params.tanggalMulai,
			jumlahHari: params.jumlahHari,
			hargaHarian: garasi.hargaHarian,
			tipeGarasi: garasi.tipeGarasi as TipeGarasi,
			tipeKendaraan: tipeKendaraanFinal,
			kapasitasBateraiKwh: kapasitasBateraiFinal,
			sisaBateraiKwh: params.sisaBateraiKwh,
			hargaListrikPerKwh: garasi.hargaListrikPerKwh,
			buktiBayarPath: params.buktiBayarPath,
			statusSewa: params.statusSewa ?? 'AKTIF',
			referenceDateToday: params.referenceDateToday,
			daftarJadwalAktif: jadwalAktif.map((j) => ({
				tanggalMulai: j.tanggalMulai,
				tanggalSelesai: j.tanggalSelesai
			})),
			daftarJadwalKendaraanAktif: jadwalAktifKendaraan.map((j) => ({
				tanggalMulai: j.tanggalMulai,
				tanggalSelesai: j.tanggalSelesai
			}))
		});

		// 7. Jika menggunakan kendaraan baru dan seluruh validasi sewa telah lulus, baru simpan kendaraan
		if (kendaraanBaruModel) {
			const savedKendaraan = await this.kendaraanRepo.create(kendaraanBaruModel.toDTO());
			kendaraanId = savedKendaraan.id;
		}

		// 8. Simpan transaksi sewa ke basis data dengan ID kendaraan definitif
		const sewaDTO = sewaModel.toDTO();
		sewaDTO.kendaraanId = kendaraanId;
		const savedSewa = await this.sewaRepo.create(sewaDTO);

		// 9. Update status garasi menjadi USED HANYA jika sewa berstatus AKTIF dan mencakup hari ini
		const todayUtc = params.referenceDateToday
			? normalizeToUtcDate(params.referenceDateToday)
			: getTodayUtcDate();
		if (
			savedSewa.statusSewa === 'AKTIF' &&
			sewaModel.tanggalMulai.getTime() <= todayUtc.getTime() &&
			sewaModel.tanggalSelesai.getTime() > todayUtc.getTime()
		) {
			await this.garasiRepo.updateStatus(garasi.id, 'USED');
		}

		return savedSewa;
	}

	/**
	 * Memproses perpanjangan masa sewa aktif oleh Admin:
	 * 1. Validasi transaksi sewa aktif ada.
	 * 2. Validasi anti-bentrok terhadap jadwal booking sewa lain pada garasi yang sama.
	 * 3. Perhitungan biaya tambahan positif dengan pemecahan blok bulan dinamis (25x) + sisa hari.
	 * 4. Simpan riwayat ke tabel PerpanjanganSewa.
	 * 5. Perbarui tanggal selesai, akumulasi total biaya, dan total jumlah hari pada tabel Sewa.
	 *
	 * @param {PerpanjangSewaServiceParams} params - Parameter perpanjangan sewa.
	 * @returns {Promise<{ sewa: Sewa; perpanjangan: PerpanjanganSewa }>} Hasil sewa yang diperpanjang dan riwayatnya.
	 * @throws {Error} Jika transaksi tidak aktif, tanggal baru tidak valid, atau jadwal bentrok.
	 */
	public async perpanjangSewa(
		params: PerpanjangSewaServiceParams
	): Promise<{ sewa: Sewa; perpanjangan: PerpanjanganSewa }> {
		if (!params.buktiBayarPath || params.buktiBayarPath.trim().length === 0) {
			throw new Error('Bukti pembayaran biaya perpanjangan wajib diunggah.');
		}

		const sewa = await this.sewaRepo.findById(params.sewaId);
		if (!sewa) {
			throw new Error(`Transaksi sewa dengan ID ${params.sewaId} tidak ditemukan.`);
		}

		if (sewa.statusSewa !== 'AKTIF') {
			throw new Error('Hanya transaksi sewa dengan status AKTIF yang dapat diperpanjang.');
		}

		const garasi = await this.garasiRepo.findById(sewa.garasiId);
		if (!garasi) {
			throw new Error(`Garasi '${sewa.garasiId}' tidak ditemukan.`);
		}

		// Ambil jadwal sewa aktif lain pada garasi yang sama (kecuali transaksi sewa yang sedang diperpanjang)
		const jadwalAktifLain = await this.sewaRepo.findActiveSewaByGarasiId(garasi.id);
		const filteredJadwalLain = jadwalAktifLain
			.filter((s) => s.id !== sewa.id)
			.map((s) => ({
				tanggalMulai: s.tanggalMulai,
				tanggalSelesai: s.tanggalSelesai
			}));

		// Hitung biaya tambahan dan validasi anti-bentrok
		const hasilPerpanjangan = SewaModel.hitungBiayaPerpanjangan(
			sewa.tanggalSelesai,
			params.tanggalSelesaiBaru,
			garasi.hargaHarian,
			filteredJadwalLain
		);

		// Simpan riwayat perpanjangan
		const perpanjangan = await this.sewaRepo.createPerpanjangan({
			sewaId: sewa.id,
			tanggalSelesaiLama: sewa.tanggalSelesai,
			tanggalSelesaiBaru: hasilPerpanjangan.tanggalSelesaiBaru,
			tambahanHari: hasilPerpanjangan.tambahanHari,
			biayaTambahan: hasilPerpanjangan.biayaTambahan,
			buktiBayarPath: params.buktiBayarPath.trim()
		});

		// Update tanggal selesai, akumulasi total biaya, dan akumulasi jumlah hari pada tabel sewa
		const updatedSewa = await this.sewaRepo.updateTanggalSelesaiDanBiaya(
			sewa.id,
			hasilPerpanjangan.tanggalSelesaiBaru,
			hasilPerpanjangan.biayaTambahan,
			hasilPerpanjangan.tambahanHari
		);

		return {
			sewa: updatedSewa,
			perpanjangan
		};
	}

	/**
	 * Mengambil seluruh riwayat sewa milik seorang penyewa tertentu.
	 *
	 * @param {number} penyewaId - ID penyewa.
	 * @returns {Promise<Array<Sewa & { garasi: Garasi; kendaraan: Kendaraan }>>} Daftar riwayat sewa penyewa.
	 */
	public async getRiwayatSewaPenyewa(
		penyewaId: number
	): Promise<Array<Sewa & { garasi: Garasi; kendaraan: Kendaraan }>> {
		return this.sewaRepo.findByPenyewaId(penyewaId);
	}

	/**
	 * Mengambil daftar seluruh unit sewa yang sedang aktif pada hari ini untuk ditampilkan di halaman Admin.
	 *
	 * @param {Date} [today=getTodayUtcDate()] - Tanggal hari ini.
	 * @returns {Promise<SewaDetail[]>} Daftar sewa aktif hari ini.
	 */
	public async getSewaAktifHariIni(today: Date = getTodayUtcDate()): Promise<SewaDetail[]> {
		return this.sewaRepo.findSewaAktifHariIni(today);
	}

	/**
	 * Mengambil daftar seluruh transaksi sewa yang sedang menunggu verifikasi pembayaran oleh Admin.
	 *
	 * @returns {Promise<SewaDetail[]>} Daftar transaksi sewa berstatus MENUNGGU_VERIFIKASI.
	 */
	public async getDaftarSewaMenungguVerifikasi(): Promise<SewaDetail[]> {
		return this.sewaRepo.findSewaMenungguVerifikasi();
	}

	/**
	 * Admin memverifikasi bukti pembayaran transaksi sewa ('AKTIF' untuk setuju, 'DITOLAK' untuk tolak).
	 *
	 * @param {number} sewaId - ID transaksi sewa.
	 * @param {'AKTIF' | 'DITOLAK'} status - Status keputusan verifikasi.
	 * @returns {Promise<Sewa>} Transaksi sewa yang telah diperbarui.
	 */
	public async verifikasiPembayaran(sewaId: number, status: 'AKTIF' | 'DITOLAK'): Promise<Sewa> {
		const sewa = await this.sewaRepo.findById(sewaId);
		if (!sewa) {
			throw new Error(`Transaksi sewa #${sewaId} tidak ditemukan.`);
		}

		if (sewa.statusSewa !== 'MENUNGGU_VERIFIKASI') {
			throw new Error(`Transaksi sewa #${sewaId} saat ini berstatus '${sewa.statusSewa}', bukan 'MENUNGGU_VERIFIKASI'.`);
		}

		const updatedSewa = await this.sewaRepo.updateStatusSewa(sewaId, status);

		// Jika disetujui (AKTIF) dan periode sewa mencakup hari ini, sinkronkan status garasi menjadi USED
		if (status === 'AKTIF') {
			const todayUtc = getTodayUtcDate();
			if (
				updatedSewa.tanggalMulai.getTime() <= todayUtc.getTime() &&
				updatedSewa.tanggalSelesai.getTime() > todayUtc.getTime()
			) {
				await this.garasiRepo.updateStatus(updatedSewa.garasiId, 'USED');
			}
		}

		return updatedSewa;
	}
}

export const sewaService = new SewaService();
