/**
 * @file SewaModel.ts
 * @description Model domain OOP untuk transaksi penyewaan garasi dan perpanjangan masa sewa.
 * Mengimplementasikan rumus murni tanpa biaya siluman, algoritma anti-bentrok jadwal (anti-overlap),
 * durasi dinamis bulan kabisat, serta algoritma pemecahan blok bulan pada perpanjangan sewa.
 */

import { BaseModel } from './BaseModel';
import {
	addDays,
	diffDays,
	getDaysInMonth,
	isPastDate,
	normalizeToUtcDate
} from '../utils/date';
import type {
	JadwalRentang,
	PerpanjanganResult,
	SewaDTO,
	StatusSewa,
	TipeGarasi,
	TipeKendaraan,
	TipeSewa
} from './types';

/**
 * Parameter masukan untuk pembuatan transaksi sewa baru.
 */
export interface BuatSewaParams {
	id?: number;
	penyewaId: number;
	garasiId: string;
	kendaraanId: number;
	tipeSewa: TipeSewa;
	tanggalMulai: Date | string;
	jumlahHari?: number;
	hargaHarian: number;
	tipeGarasi: TipeGarasi;
	tipeKendaraan: TipeKendaraan;
	kapasitasBateraiKwh?: number | null;
	sisaBateraiKwh?: number | null;
	hargaListrikPerKwh?: number | null;
	buktiBayarPath: string;
	statusSewa?: StatusSewa;
	referenceDateToday?: Date | string;
	daftarJadwalAktif?: JadwalRentang[];
}

/**
 * Representasi domain Transaksi Sewa Garasi.
 *
 * @class SewaModel
 * @extends {BaseModel<SewaDTO>}
 */
export class SewaModel extends BaseModel<SewaDTO> {
	public readonly id?: number;
	public readonly penyewaId: number;
	public readonly garasiId: string;
	public readonly kendaraanId: number;
	public readonly tipeSewa: TipeSewa;
	public readonly jumlahHari: number;
	public readonly tanggalMulai: Date;
	public readonly tanggalSelesai: Date;
	public readonly sisaBateraiKwh: number | null;
	public readonly biayaSewa: number;
	public readonly biayaListrik: number;
	public readonly totalBiaya: number;
	public readonly buktiBayarPath: string;
	private _statusSewa: StatusSewa;
	public readonly createdAt?: Date;

	/**
	 * Konstruktor SewaModel. Menginisialisasi instance dengan data sewa yang telah divalidasi.
	 *
	 * @constructor
	 * @param {SewaDTO} data - Objek data transfer sewa.
	 */
	constructor(data: SewaDTO) {
		super();
		SewaModel.validateTipeSewa(data.tipeSewa);

		this.id = data.id;
		this.penyewaId = data.penyewaId;
		this.garasiId = data.garasiId;
		this.kendaraanId = data.kendaraanId;
		this.tipeSewa = data.tipeSewa;
		this.jumlahHari = data.jumlahHari;
		this.tanggalMulai = normalizeToUtcDate(data.tanggalMulai);
		this.tanggalSelesai = normalizeToUtcDate(data.tanggalSelesai);
		this.sisaBateraiKwh = data.sisaBateraiKwh ?? null;
		this.biayaSewa = data.biayaSewa;
		this.biayaListrik = data.biayaListrik;
		this.totalBiaya = data.totalBiaya;
		this.buktiBayarPath = data.buktiBayarPath;
		this._statusSewa = data.statusSewa ?? 'AKTIF';
		this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
	}

	/**
	 * Factory method untuk membuat dan memvalidasi transaksi Sewa Baru dari parameter pengguna.
	 * Menghitung otomatis tanggal selesai, biaya sewa, biaya listrik, dan total biaya.
	 *
	 * @static
	 * @param {BuatSewaParams} params - Parameter transaksi sewa baru.
	 * @returns {SewaModel} Instance SewaModel yang valid.
	 * @throws {Error} Jika validasi tanggal, durasi, anti-bentrok, baterai, atau bukti bayar gagal.
	 */
	public static buatSewaBaru(params: BuatSewaParams): SewaModel {
		SewaModel.validateTipeSewa(params.tipeSewa);

		const tanggalMulaiUtc = normalizeToUtcDate(params.tanggalMulai);

		// Validasi dilarang memilih tanggal masa lalu
		if (isPastDate(tanggalMulaiUtc, params.referenceDateToday)) {
			throw new Error('Tanggal mulai sewa dilarang memilih tanggal kemarin / masa lalu.');
		}

		const daysInMonth = SewaModel.getJumlahHariBulan(tanggalMulaiUtc);
		let durasiHari: number;
		let tanggalSelesaiUtc: Date;

		if (params.tipeSewa === 'BULANAN') {
			durasiHari = daysInMonth;
			tanggalSelesaiUtc = addDays(tanggalMulaiUtc, daysInMonth);
		} else {
			const requestedHari = params.jumlahHari;
			if (
				typeof requestedHari !== 'number' ||
				!Number.isInteger(requestedHari) ||
				requestedHari < 1 ||
				requestedHari > daysInMonth - 1
			) {
				throw new Error(
					`Durasi sewa harian harus antara 1 dan ${daysInMonth - 1} hari untuk bulan berjalan. Diterima: ${requestedHari}.`
				);
			}
			durasiHari = requestedHari;
			tanggalSelesaiUtc = addDays(tanggalMulaiUtc, durasiHari);
		}

		// Validasi Anti-Bentrok Jadwal jika ada daftar jadwal aktif lain
		if (params.daftarJadwalAktif && params.daftarJadwalAktif.length > 0) {
			SewaModel.validasiAntiBentrok(tanggalMulaiUtc, tanggalSelesaiUtc, params.daftarJadwalAktif);
		}

		// Validasi baterai khusus mobil listrik di garasi mobil listrik
		if (params.tipeKendaraan === 'MOBIL_LISTRIK' && params.tipeGarasi === 'MOBIL_LISTRIK') {
			if (
				typeof params.sisaBateraiKwh !== 'number' ||
				isNaN(params.sisaBateraiKwh) ||
				params.sisaBateraiKwh < 0
			) {
				throw new Error('Sisa baterai saat masuk garasi wajib diisi dan tidak boleh negatif.');
			}
			const kapasitasPenuh = params.kapasitasBateraiKwh ?? 0;
			if (params.sisaBateraiKwh > kapasitasPenuh) {
				throw new Error(
					`Sisa baterai (${params.sisaBateraiKwh} kWh) tidak boleh melebihi kapasitas baterai penuh (${kapasitasPenuh} kWh).`
				);
			}
		}

		// Validasi Bukti Bayar Path
		if (!params.buktiBayarPath || typeof params.buktiBayarPath !== 'string' || params.buktiBayarPath.trim().length === 0) {
			throw new Error('Bukti pelunasan pembayaran wajib diunggah.');
		}

		const biayaSewa = SewaModel.hitungBiayaSewa(params.tipeSewa, durasiHari, params.hargaHarian);
		const biayaListrik = SewaModel.hitungBiayaListrik(
			params.tipeKendaraan,
			params.tipeGarasi,
			params.kapasitasBateraiKwh ?? null,
			params.sisaBateraiKwh ?? null,
			params.hargaListrikPerKwh ?? null
		);
		const totalBiaya = SewaModel.hitungTotalBiaya(biayaSewa, biayaListrik);

		return new SewaModel({
			id: params.id,
			penyewaId: params.penyewaId,
			garasiId: params.garasiId,
			kendaraanId: params.kendaraanId,
			tipeSewa: params.tipeSewa,
			jumlahHari: durasiHari,
			tanggalMulai: tanggalMulaiUtc,
			tanggalSelesai: tanggalSelesaiUtc,
			sisaBateraiKwh: params.tipeKendaraan === 'MOBIL_LISTRIK' ? (params.sisaBateraiKwh ?? null) : null,
			biayaSewa,
			biayaListrik,
			totalBiaya,
			buktiBayarPath: params.buktiBayarPath.trim(),
			statusSewa: params.statusSewa ?? 'AKTIF'
		});
	}

	/**
	 * Memvalidasi tipe sewa ('HARIAN' atau 'BULANAN').
	 *
	 * @static
	 * @param {TipeSewa} tipeSewa - Tipe sewa.
	 * @throws {Error} Jika tipe sewa tidak valid.
	 */
	public static validateTipeSewa(tipeSewa: TipeSewa): void {
		if (tipeSewa !== 'HARIAN' && tipeSewa !== 'BULANAN') {
			throw new Error(`Tipe sewa tidak valid: '${tipeSewa}'. Harus 'HARIAN' atau 'BULANAN'.`);
		}
	}

	/**
	 * Mendapatkan jumlah hari dinamis dalam bulan dari tanggal yang diberikan.
	 *
	 * @static
	 * @param {Date | string} tanggal - Tanggal acuan.
	 * @returns {number} Jumlah hari (28/29/30/31).
	 */
	public static getJumlahHariBulan(tanggal: Date | string): number {
		return getDaysInMonth(tanggal);
	}

	/**
	 * Memeriksa apakah dua interval rentang jadwal [mulaiA, selesaiA] dan [mulaiB, selesaiB] saling bertabrakan (bentrok).
	 * Rumus: mulaiA < selesaiB && selesaiA > mulaiB.
	 * Batas yang persis bersinggungan (contoh: selesaiA === mulaiB) dinyatakan TIDAK bentrok (false).
	 *
	 * @static
	 * @param {Date | string} mulaiA - Awal jadwal A.
	 * @param {Date | string} selesaiA - Akhir jadwal A.
	 * @param {Date | string} mulaiB - Awal jadwal B.
	 * @param {Date | string} selesaiB - Akhir jadwal B.
	 * @returns {boolean} True jika jadwal bentrok, false jika tidak bentrok.
	 */
	public static cekBentrokJadwal(
		mulaiA: Date | string,
		selesaiA: Date | string,
		mulaiB: Date | string,
		selesaiB: Date | string
	): boolean {
		const mA = normalizeToUtcDate(mulaiA).getTime();
		const sA = normalizeToUtcDate(selesaiA).getTime();
		const mB = normalizeToUtcDate(mulaiB).getTime();
		const sB = normalizeToUtcDate(selesaiB).getTime();

		return mA < sB && sA > mB;
	}

	/**
	 * Memvalidasi rentang tanggal baru terhadap sekumpulan jadwal aktif yang sudah ada.
	 * Melemparkan Error jika terdeteksi jadwal yang bertabrakan.
	 *
	 * @static
	 * @param {Date | string} mulaiBaru - Tanggal mulai baru.
	 * @param {Date | string} selesaiBaru - Tanggal selesai baru.
	 * @param {JadwalRentang[]} daftarJadwalAktif - Daftar jadwal sewa aktif pada unit garasi terkait.
	 * @throws {Error} Jika rentang tanggal bertabrakan dengan jadwal yang ada.
	 */
	public static validasiAntiBentrok(
		mulaiBaru: Date | string,
		selesaiBaru: Date | string,
		daftarJadwalAktif: JadwalRentang[]
	): void {
		for (const jadwal of daftarJadwalAktif) {
			if (SewaModel.cekBentrokJadwal(mulaiBaru, selesaiBaru, jadwal.tanggalMulai, jadwal.tanggalSelesai)) {
				throw new Error(
					'Jadwal penyewaan garasi bentrok dengan jadwal sewa lain yang sudah ada pada periode tersebut.'
				);
			}
		}
	}

	/**
	 * Menghitung biaya murni sewa garasi:
	 * - HARIAN: jumlahHari * hargaHarian
	 * - BULANAN: 25 * hargaHarian
	 *
	 * @static
	 * @param {TipeSewa} tipeSewa - Tipe sewa.
	 * @param {number} jumlahHari - Jumlah hari durasi sewa.
	 * @param {number} hargaHarian - Tarif sewa harian unit garasi.
	 * @returns {number} Nominal biaya sewa garasi.
	 */
	public static hitungBiayaSewa(
		tipeSewa: TipeSewa,
		jumlahHari: number,
		hargaHarian: number
	): number {
		if (tipeSewa === 'BULANAN') {
			return 25 * hargaHarian;
		}
		return jumlahHari * hargaHarian;
	}

	/**
	 * Menghitung biaya pengisian daya listrik mobil listrik hingga penuh:
	 * biayaListrik = (kapasitasPenuh - sisaBaterai) * hargaListrikPerKwh
	 * Hanya berlaku jika kendaraan MOBIL_LISTRIK ditempatkan di garasi MOBIL_LISTRIK.
	 * Untuk kombinasi lainnya menghasilkan 0.
	 *
	 * @static
	 * @param {TipeKendaraan} tipeKendaraan - Tipe kendaraan penyewa.
	 * @param {TipeGarasi} tipeGarasi - Tipe garasi yang disewa.
	 * @param {number | null} kapasitasPenuhKwh - Kapasitas baterai penuh kendaraan (kWh).
	 * @param {number | null} sisaBateraiKwh - Sisa baterai saat masuk garasi (kWh).
	 * @param {number | null} hargaListrikPerKwh - Tarif listrik per kWh pada unit garasi.
	 * @returns {number} Biaya listrik terhitung (pembulatan Math.round).
	 * @throws {Error} Jika nilai baterai tidak logis (kapasitas <= 0, sisa < 0, sisa > kapasitas).
	 */
	public static hitungBiayaListrik(
		tipeKendaraan: TipeKendaraan,
		tipeGarasi: TipeGarasi,
		kapasitasPenuhKwh: number | null,
		sisaBateraiKwh: number | null,
		hargaListrikPerKwh: number | null
	): number {
		if (tipeKendaraan !== 'MOBIL_LISTRIK' || tipeGarasi !== 'MOBIL_LISTRIK') {
			return 0;
		}

		if (typeof kapasitasPenuhKwh !== 'number' || isNaN(kapasitasPenuhKwh) || kapasitasPenuhKwh <= 0) {
			throw new Error('Kapasitas baterai penuh (kWh) harus bernilai positif (> 0).');
		}

		if (typeof sisaBateraiKwh !== 'number' || isNaN(sisaBateraiKwh) || sisaBateraiKwh < 0) {
			throw new Error('Sisa baterai saat masuk tidak boleh negatif.');
		}

		if (sisaBateraiKwh > kapasitasPenuhKwh) {
			throw new Error(
				`Sisa baterai (${sisaBateraiKwh} kWh) tidak boleh melebihi kapasitas penuh (${kapasitasPenuhKwh} kWh).`
			);
		}

		const tarif = hargaListrikPerKwh ?? 0;
		const konsumsi = kapasitasPenuhKwh - sisaBateraiKwh;
		return Math.round(konsumsi * tarif);
	}

	/**
	 * Menghitung total biaya transaksi secara murni: totalBiaya = biayaSewa + biayaListrik.
	 * Tidak ada tambahan pajak, markup, atau persentase apa pun.
	 *
	 * @static
	 * @param {number} biayaSewa - Biaya sewa garasi.
	 * @param {number} biayaListrik - Biaya pengisian listrik.
	 * @returns {number} Total biaya transaksi.
	 */
	public static hitungTotalBiaya(biayaSewa: number, biayaListrik: number): number {
		return biayaSewa + biayaListrik;
	}

	/**
	 * Menghitung rincian dan biaya perpanjangan sewa garasi:
	 * 1. Validasi tanggalSelesaiBaru > tanggalSelesaiLama.
	 * 2. Validasi anti-bentrok terhadap jadwal lain pada unit garasi yang sama.
	 * 3. Pemecahan durasi tambahan menjadi blok bulan dinamis (25x hargaHarian) + sisa hari (sisaHari * hargaHarian).
	 * 4. Nilai biayaTambahan selalu positif (> 0).
	 *
	 * @static
	 * @param {Date | string} tanggalSelesaiLama - Tanggal selesai transaksi saat ini.
	 * @param {Date | string} tanggalSelesaiBaru - Tanggal selesai baru yang diajukan oleh Admin.
	 * @param {number} hargaHarian - Tarif sewa harian unit garasi.
	 * @param {JadwalRentang[]} [jadwalBentrokLain] - Daftar jadwal sewa aktif lain pada garasi ini.
	 * @returns {PerpanjanganResult} Objek hasil rincian perpanjangan sewa.
	 * @throws {Error} Jika tanggal baru <= tanggal lama atau terjadi bentrok jadwal.
	 */
	public static hitungBiayaPerpanjangan(
		tanggalSelesaiLama: Date | string,
		tanggalSelesaiBaru: Date | string,
		hargaHarian: number,
		jadwalBentrokLain?: JadwalRentang[]
	): PerpanjanganResult {
		const lamaUtc = normalizeToUtcDate(tanggalSelesaiLama);
		const baruUtc = normalizeToUtcDate(tanggalSelesaiBaru);

		if (baruUtc.getTime() <= lamaUtc.getTime()) {
			throw new Error('Tanggal selesai baru harus lebih besar dari tanggal selesai lama.');
		}

		if (jadwalBentrokLain && jadwalBentrokLain.length > 0) {
			for (const jadwal of jadwalBentrokLain) {
				if (SewaModel.cekBentrokJadwal(lamaUtc, baruUtc, jadwal.tanggalMulai, jadwal.tanggalSelesai)) {
					throw new Error(
						'Perpanjangan sewa bentrok dengan jadwal sewa penyewa lain pada garasi yang sama.'
					);
				}
			}
		}

		let kursor = new Date(lamaUtc.getTime());
		let jumlahBulan = 0;

		while (true) {
			const daysInMonth = SewaModel.getJumlahHariBulan(kursor);
			const kandidat = addDays(kursor, daysInMonth);
			if (kandidat.getTime() <= baruUtc.getTime()) {
				jumlahBulan++;
				kursor = kandidat;
			} else {
				break;
			}
		}

		const sisaHari = diffDays(kursor, baruUtc);
		const tambahanHari = diffDays(lamaUtc, baruUtc);
		const biayaTambahan = jumlahBulan * 25 * hargaHarian + sisaHari * hargaHarian;

		if (biayaTambahan <= 0) {
			throw new Error('Biaya tambahan perpanjangan harus selalu bernilai positif (> 0).');
		}

		return {
			jumlahBulan,
			sisaHari,
			tambahanHari,
			biayaTambahan,
			tanggalSelesaiBaru: baruUtc
		};
	}

	/**
	 * Mendapatkan status transaksi sewa saat ini.
	 *
	 * @returns {StatusSewa} 'AKTIF' atau 'SELESAI'.
	 */
	public get statusSewa(): StatusSewa {
		return this._statusSewa;
	}

	/**
	 * Menandai transaksi sewa telah selesai.
	 *
	 * @returns {void}
	 */
	public selesaikanSewa(): void {
		this._statusSewa = 'SELESAI';
	}

	/**
	 * Mengonversi model ke bentuk DTO polos.
	 *
	 * @returns {SewaDTO} Objek DTO.
	 */
	public toDTO(): SewaDTO {
		return {
			id: this.id,
			penyewaId: this.penyewaId,
			garasiId: this.garasiId,
			kendaraanId: this.kendaraanId,
			tipeSewa: this.tipeSewa,
			jumlahHari: this.jumlahHari,
			tanggalMulai: this.tanggalMulai,
			tanggalSelesai: this.tanggalSelesai,
			sisaBateraiKwh: this.sisaBateraiKwh,
			biayaSewa: this.biayaSewa,
			biayaListrik: this.biayaListrik,
			totalBiaya: this.totalBiaya,
			buktiBayarPath: this.buktiBayarPath,
			statusSewa: this._statusSewa,
			createdAt: this.createdAt
		};
	}
}
