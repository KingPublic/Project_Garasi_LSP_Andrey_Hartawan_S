import { BaseModel } from './BaseModel';
import type { KendaraanDTO, TipeGarasi, TipeKendaraan } from './types';

/**
 * Menyimpan data dan aturan kendaraan milik penyewa.
 *
 * @author Andrey Hartawan Suwardi
 * @version 1.0
 */
export class KendaraanModel extends BaseModel<KendaraanDTO> {
	public readonly id?: number;
	public readonly penyewaId: number;
	public readonly tipeKendaraan: TipeKendaraan;
	public readonly nomorPlat: string | null;            // null khusus sepeda manual
	public readonly merekTipe: string;
	public readonly kapasitasBateraiKwh: number | null;   // kapasitas dalam kWh, khusus mobil listrik
	public readonly createdAt?: Date;

	/**
	 * Membuat instance KendaraanModel baru dengan validasi.
	 *
	 * @param data data transfer objek kendaraan
	 */
	constructor(data: KendaraanDTO) {
		super();
		KendaraanModel.validateTipeKendaraan(data.tipeKendaraan);
		KendaraanModel.validatePenyewaId(data.penyewaId);
		KendaraanModel.validateMerekTipe(data.merekTipe);
		KendaraanModel.validateNomorPlat(data.tipeKendaraan, data.nomorPlat);
		KendaraanModel.validateKapasitasBaterai(data.tipeKendaraan, data.kapasitasBateraiKwh);

		this.id = data.id;
		this.penyewaId = data.penyewaId;
		this.tipeKendaraan = data.tipeKendaraan;
		this.nomorPlat =
			data.tipeKendaraan === 'SEPEDA'
				? null
				: (data.nomorPlat?.trim().toUpperCase() ?? null);
		this.merekTipe = data.merekTipe.trim();
		this.kapasitasBateraiKwh =
			data.tipeKendaraan === 'MOBIL_LISTRIK' ? (data.kapasitasBateraiKwh ?? null) : null;
		this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
	}

	/**
	 * Memvalidasi tipe kendaraan.
	 *
	 * @param tipe - Tipe kendaraan.
	 */
	public static validateTipeKendaraan(tipe: TipeKendaraan): void {
		const validTypes: TipeKendaraan[] = ['SEPEDA', 'SEPEDA_MOTOR', 'MOBIL', 'MOBIL_LISTRIK'];
		if (!validTypes.includes(tipe)) {
			throw new Error(`Tipe kendaraan tidak valid: '${tipe}'.`);
		}
	}

	/**
	 * Memvalidasi ID penyewa pemilik kendaraan.
	 *
	 * @param penyewaId - ID pengguna penyewa.
	 */
	public static validatePenyewaId(penyewaId: number): void {
		if (typeof penyewaId !== 'number' || !Number.isInteger(penyewaId) || penyewaId <= 0) {
			throw new Error(`ID penyewa tidak valid: ${penyewaId}.`);
		}
	}

	/**
	 * Memvalidasi input merek dan tipe kendaraan (wajib diisi).
	 *
	 * @param merekTipe - Merek dan tipe kendaraan (e.g. "Toyota Avanza", "Polygon Xtrada").
	 */
	public static validateMerekTipe(merekTipe: string): void {
		if (!merekTipe || typeof merekTipe !== 'string' || merekTipe.trim().length === 0) {
			throw new Error('Merek dan tipe kendaraan wajib diisi.');
		}
	}

	/**
	 * Memvalidasi nomor plat kendaraan.
	 * Nomor plat wajib diisi untuk 'SEPEDA_MOTOR', 'MOBIL', dan 'MOBIL_LISTRIK'.
	 * Untuk tipe 'SEPEDA', nomor plat boleh kosong (dikelola sebagai null).
	 *
	 * @param tipe - Tipe kendaraan.
	 * @param nomorPlat - String nomor plat.
	 */
	public static validateNomorPlat(tipe: TipeKendaraan, nomorPlat: string | null | undefined): void {
		if (tipe === 'SEPEDA') {
			return;
		}

		if (!nomorPlat || typeof nomorPlat !== 'string' || nomorPlat.trim().length === 0) {
			throw new Error(`Nomor plat kendaraan wajib diisi untuk kendaraan tipe '${tipe}'.`);
		}
	}

	/**
	 * Memvalidasi kapasitas baterai kendaraan dalam satuan kWh.
	 * Wajib bernilai > 0 khusus untuk kendaraan tipe 'MOBIL_LISTRIK'.
	 *
	 * @param tipe - Tipe kendaraan.
	 * @param kapasitasKwh - Kapasitas baterai dalam kWh.
	 */
	public static validateKapasitasBaterai(
		tipe: TipeKendaraan,
		kapasitasKwh: number | null | undefined
	): void {
		if (tipe === 'MOBIL_LISTRIK') {
			if (typeof kapasitasKwh !== 'number' || isNaN(kapasitasKwh) || kapasitasKwh <= 0) {
				throw new Error('Kapasitas baterai penuh (kWh) wajib diisi dan bernilai positif (> 0) untuk mobil listrik.');
			}
		}
	}

	/**
	 * Memeriksa apakah kendaraan ini diizinkan untuk menyewa garasi dengan tipe tertentu:
	 * - SEPEDA: hanya garasi SEPEDA
	 * - SEPEDA_MOTOR: hanya garasi SEPEDA
	 * - MOBIL: hanya garasi MOBIL
	 * - MOBIL_LISTRIK: boleh garasi MOBIL atau MOBIL_LISTRIK
	 *
	 * @param tipeGarasi - Tipe garasi tujuan.
	 * @returns True jika cocok, false jika tidak cocok.
	 */
	public bisaMasukGarasi(tipeGarasi: TipeGarasi): boolean {
		switch (this.tipeKendaraan) {
			case 'SEPEDA':
			case 'SEPEDA_MOTOR':
				return tipeGarasi === 'SEPEDA';
			case 'MOBIL':
				return tipeGarasi === 'MOBIL';
			case 'MOBIL_LISTRIK':
				return tipeGarasi === 'MOBIL' || tipeGarasi === 'MOBIL_LISTRIK';
			default:
				return false;
		}
	}

	/**
	 * Memvalidasi kecocokan kendaraan dengan garasi, melemparkan Error jika tidak kompatibel.
	 *
	 * @param tipeGarasi - Tipe garasi yang dipilih.
	 */
	public validasiKesesuaianGarasi(tipeGarasi: TipeGarasi): void {
		if (!this.bisaMasukGarasi(tipeGarasi)) {
			throw new Error(
				`Kendaraan tipe '${this.tipeKendaraan}' tidak kompatibel dengan garasi tipe '${tipeGarasi}'.`
			);
		}
	}

	/**
	 * Mengonversi model ke bentuk DTO polos.
	 */
	public toDTO(): KendaraanDTO {
		return {
			id: this.id,
			penyewaId: this.penyewaId,
			tipeKendaraan: this.tipeKendaraan,
			nomorPlat: this.nomorPlat,
			merekTipe: this.merekTipe,
			kapasitasBateraiKwh: this.kapasitasBateraiKwh,
			createdAt: this.createdAt
		};
	}
}
