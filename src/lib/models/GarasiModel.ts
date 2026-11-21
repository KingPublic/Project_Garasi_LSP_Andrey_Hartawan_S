import { BaseModel } from './BaseModel';
import type { GarasiDTO, StatusGarasi, TipeGarasi, TipeKendaraan } from './types';

/**
 * Menyimpan data dan aturan unit garasi (kode S, C, E serta tarifnya).
 * Satu unit garasi bisa dipakai di banyak transaksi Sewa.
 *
 * @author Andrey Hartawan Suwardi
 * @version 1.0
 */
export class GarasiModel extends BaseModel<GarasiDTO> {
	public static readonly MAX_KAPASITAS_PER_TIPE = 999; // batas maksimal unit per tipe garasi

	public static readonly PREFIX_MAP: Record<TipeGarasi, string> = {
		SEPEDA: 'S',
		MOBIL: 'C',
		MOBIL_LISTRIK: 'E'
	};

	public readonly id: string;
	public readonly tipeGarasi: TipeGarasi;
	public readonly nomorUrut: number;
	public readonly hargaHarian: number;                 // tarif sewa per hari (Rupiah)
	public readonly hargaListrikPerKwh: number | null;   // tarif cas per kWh, khusus mobil listrik
	private _status: StatusGarasi;                       // AVAILABLE atau USED
	public readonly createdAt?: Date;

	/**
	 * Membuat instance GarasiModel baru dengan validasi data.
	 *
	 * @param data data transfer objek garasi
	 */
	constructor(data: GarasiDTO) {
		super();
		GarasiModel.validateTipeGarasi(data.tipeGarasi);
		GarasiModel.validateNomorUrut(data.nomorUrut);
		GarasiModel.validateHargaHarian(data.hargaHarian);
		GarasiModel.validateHargaListrik(data.tipeGarasi, data.hargaListrikPerKwh);

		const expectedId = GarasiModel.generateKode(data.tipeGarasi, data.nomorUrut);
		if (data.id && data.id !== expectedId) {
			throw new Error(`ID garasi tidak konsisten. Diterima: '${data.id}', diharapkan: '${expectedId}'.`);
		}

		this.id = expectedId;
		this.tipeGarasi = data.tipeGarasi;
		this.nomorUrut = data.nomorUrut;
		this.hargaHarian = data.hargaHarian;
		this.hargaListrikPerKwh =
			data.tipeGarasi === 'MOBIL_LISTRIK' ? (data.hargaListrikPerKwh ?? null) : null;
		this._status = data.status ?? 'AVAILABLE';
		this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
	}

	/**
	 * Memvalidasi tipe garasi.
	 *
	 * @static
	 * @param {TipeGarasi} tipe - Tipe garasi yang akan divalidasi.
	 * @throws {Error} Jika tipe garasi tidak valid.
	 */
	public static validateTipeGarasi(tipe: TipeGarasi): void {
		const validTypes: TipeGarasi[] = ['SEPEDA', 'MOBIL', 'MOBIL_LISTRIK'];
		if (!validTypes.includes(tipe)) {
			throw new Error(`Tipe garasi tidak valid: '${tipe}'.`);
		}
	}

	/**
	 * Mendapatkan kode prefix 1 karakter berdasarkan tipe garasi.
	 *
	 * @static
	 * @param {TipeGarasi} tipe - Tipe garasi ('SEPEDA' -> 'S', 'MOBIL' -> 'C', 'MOBIL_LISTRIK' -> 'E').
	 * @returns {string} Karakter prefix.
	 * @throws {Error} Jika tipe garasi tidak dikenal.
	 */
	public static getPrefix(tipe: TipeGarasi): string {
		const prefix = GarasiModel.PREFIX_MAP[tipe];
		if (!prefix) {
			throw new Error(`Tipe garasi tidak dikenal: '${tipe}'.`);
		}
		return prefix;
	}

	/**
	 * Memvalidasi nomor urut garasi (harus bilangan bulat antara 1 dan 999).
	 *
	 * @static
	 * @param {number} nomorUrut - Nomor urut garasi.
	 * @throws {Error} Jika nomor urut di luar rentang 1..999 atau bukan integer.
	 */
	public static validateNomorUrut(nomorUrut: number): void {
		if (
			typeof nomorUrut !== 'number' ||
			!Number.isInteger(nomorUrut) ||
			nomorUrut < 1 ||
			nomorUrut > GarasiModel.MAX_KAPASITAS_PER_TIPE
		) {
			throw new Error(
				`Nomor urut garasi harus berupa bilangan bulat antara 1 dan 999. Diterima: ${nomorUrut}.`
			);
		}
	}

	/**
	 * Menghasilkan ID unik garasi 3 digit berurutan sesuai tipe (contoh: S001, C010, E999).
	 *
	 * @static
	 * @param {TipeGarasi} tipe - Tipe garasi.
	 * @param {number} nomorUrut - Nomor urut 1..999.
	 * @returns {string} Kode garasi terformat.
	 * @throws {Error} Jika nomor urut di luar batas 1..999.
	 */
	public static generateKode(tipe: TipeGarasi, nomorUrut: number): string {
		GarasiModel.validateNomorUrut(nomorUrut);
		const prefix = GarasiModel.getPrefix(tipe);
		return `${prefix}${String(nomorUrut).padStart(3, '0')}`;
	}

	/**
	 * Memvalidasi batas pembuatan unit garasi baru secara kumulatif.
	 * Memastikan total unit per tipe tidak pernah melebihi batas 999.
	 *
	 * @static
	 * @param {number} nomorUrutTerakhir - Nomor urut tertinggi saat ini untuk tipe garasi terkait.
	 * @param {number} jumlahBaru - Jumlah unit garasi baru yang ingin ditambahkan.
	 * @throws {Error} Jika jumlah baru <= 0 atau akumulasi melebihi 999.
	 */
	public static validasiPembuatanKelompok(nomorUrutTerakhir: number, jumlahBaru: number): void {
		if (typeof jumlahBaru !== 'number' || !Number.isInteger(jumlahBaru) || jumlahBaru < 1) {
			throw new Error(`Jumlah unit baru harus bilangan bulat positif minimal 1. Diterima: ${jumlahBaru}.`);
		}

		if (typeof nomorUrutTerakhir !== 'number' || !Number.isInteger(nomorUrutTerakhir) || nomorUrutTerakhir < 0) {
			throw new Error(`Nomor urut terakhir tidak boleh negatif. Diterima: ${nomorUrutTerakhir}.`);
		}

		const totalKumulatif = nomorUrutTerakhir + jumlahBaru;
		if (totalKumulatif > GarasiModel.MAX_KAPASITAS_PER_TIPE) {
			throw new Error(
				`Kapasitas garasi melebihi batas maksimal 999 unit per tipe. Total kumulatif: ${totalKumulatif} (${nomorUrutTerakhir} + ${jumlahBaru}).`
			);
		}
	}

	/**
	 * Memvalidasi harga sewa harian (harus > 0).
	 *
	 * @static
	 * @param {number} harga - Harga sewa harian dalam Rupiah.
	 * @throws {Error} Jika harga harian <= 0 atau bukan bilangan.
	 */
	public static validateHargaHarian(harga: number): void {
		if (typeof harga !== 'number' || isNaN(harga) || harga <= 0) {
			throw new Error(`Harga sewa harian wajib bernilai positif (> 0). Diterima: ${harga}.`);
		}
	}

	/**
	 * Memvalidasi tarif listrik per kWh.
	 * Wajib diisi (> 0) khusus garasi tipe MOBIL_LISTRIK.
	 *
	 * @static
	 * @param {TipeGarasi} tipe - Tipe garasi.
	 * @param {number | null | undefined} hargaListrik - Tarif listrik per kWh.
	 * @throws {Error} Jika tipe MOBIL_LISTRIK tetapi tarif listrik kosong atau <= 0.
	 */
	public static validateHargaListrik(tipe: TipeGarasi, hargaListrik: number | null | undefined): void {
		if (tipe === 'MOBIL_LISTRIK') {
			if (typeof hargaListrik !== 'number' || isNaN(hargaListrik) || hargaListrik <= 0) {
				throw new Error('Tarif listrik per kWh wajib diisi dan bernilai positif (> 0) untuk garasi tipe MOBIL_LISTRIK.');
			}
		}
	}

	/**
	 * Membuat sekumpulan instance GarasiModel berurutan secara massal (bulk creation).
	 *
	 * @static
	 * @param {TipeGarasi} tipe - Tipe garasi yang dibuat.
	 * @param {number} nomorUrutTerakhir - Nomor urut terakhir yang ada di database (0 jika belum ada).
	 * @param {number} jumlahBaru - Jumlah unit yang ingin dibuat.
	 * @param {number} hargaHarian - Tarif sewa harian per unit.
	 * @param {number | null} [hargaListrikPerKwh] - Tarif listrik per kWh (khusus MOBIL_LISTRIK).
	 * @returns {GarasiModel[]} Array berisi instance GarasiModel yang telah divalidasi.
	 */
	public static generateKelompok(
		tipe: TipeGarasi,
		nomorUrutTerakhir: number,
		jumlahBaru: number,
		hargaHarian: number,
		hargaListrikPerKwh?: number | null
	): GarasiModel[] {
		GarasiModel.validasiPembuatanKelompok(nomorUrutTerakhir, jumlahBaru);
		GarasiModel.validateHargaHarian(hargaHarian);
		GarasiModel.validateHargaListrik(tipe, hargaListrikPerKwh);

		const result: GarasiModel[] = [];
		for (let i = 1; i <= jumlahBaru; i++) {
			const nomor = nomorUrutTerakhir + i;
			const id = GarasiModel.generateKode(tipe, nomor);
			result.push(
				new GarasiModel({
					id,
					tipeGarasi: tipe,
					nomorUrut: nomor,
					hargaHarian,
					hargaListrikPerKwh: tipe === 'MOBIL_LISTRIK' ? (hargaListrikPerKwh ?? null) : null,
					status: 'AVAILABLE'
				})
			);
		}
		return result;
	}

	public get status(): StatusGarasi {
		return this._status;
	}

	public tandaiUsed(): void {
		this._status = 'USED';
	}

	public tandaiAvailable(): void {
		this._status = 'AVAILABLE';
	}

	/**
	 * Menghitung harga sewa bulanan flat (25x tarif harian).
	 */
	public hitungHargaBulanan(): number {
		return 25 * this.hargaHarian;
	}

	/**
	 * Menghitung biaya cas mobil listrik sampai penuh.
	 * Rumus: (kapasitasPenuh - sisaBaterai) * hargaListrikPerKwh.
	 *
	 * @param kapasitasPenuhKwh kapasitas penuh baterai dalam kWh (harus > 0)
	 * @param sisaBateraiKwh sisa baterai saat masuk dalam kWh (0 sampai kapasitas penuh)
	 * @returns biaya listrik dalam Rupiah (dibulatkan)
	 * @throws Error jika kapasitas <= 0, sisa negatif, atau sisa melebihi kapasitas
	 */
	public hitungBiayaListrik(kapasitasPenuhKwh: number, sisaBateraiKwh: number): number {
		if (this.tipeGarasi !== 'MOBIL_LISTRIK') {
			return 0;
		}

		if (typeof kapasitasPenuhKwh !== 'number' || isNaN(kapasitasPenuhKwh) || kapasitasPenuhKwh <= 0) {
			throw new Error(`Kapasitas baterai penuh wajib bernilai positif (> 0). Diterima: ${kapasitasPenuhKwh}.`);
		}

		if (typeof sisaBateraiKwh !== 'number' || isNaN(sisaBateraiKwh) || sisaBateraiKwh < 0) {
			throw new Error(`Sisa baterai tidak boleh bernilai negatif. Diterima: ${sisaBateraiKwh}.`);
		}

		if (sisaBateraiKwh > kapasitasPenuhKwh) {
			throw new Error(
				`Sisa baterai (${sisaBateraiKwh} kWh) tidak boleh melebihi kapasitas baterai penuh (${kapasitasPenuhKwh} kWh).`
			);
		}

		const tarif = this.hargaListrikPerKwh ?? 0;
		const konsumsiKwh = kapasitasPenuhKwh - sisaBateraiKwh;
		return Math.round(konsumsiKwh * tarif);
	}

	/**
	 * Memeriksa apakah unit garasi ini cocok dan diizinkan untuk tipe kendaraan tertentu:
	 * - SEPEDA / SEPEDA_MOTOR: hanya garasi SEPEDA
	 * - MOBIL: hanya garasi MOBIL
	 * - MOBIL_LISTRIK: boleh garasi MOBIL atau MOBIL_LISTRIK
	 *
	 * @param {TipeKendaraan} tipeKendaraan - Tipe kendaraan penyewa.
	 * @returns {boolean} True jika cocok, false jika tidak cocok.
	 */
	public cocokDenganKendaraan(tipeKendaraan: TipeKendaraan): boolean {
		switch (tipeKendaraan) {
			case 'SEPEDA':
			case 'SEPEDA_MOTOR':
				return this.tipeGarasi === 'SEPEDA';
			case 'MOBIL':
				return this.tipeGarasi === 'MOBIL';
			case 'MOBIL_LISTRIK':
				return this.tipeGarasi === 'MOBIL' || this.tipeGarasi === 'MOBIL_LISTRIK';
			default:
				return false;
		}
	}

	/**
	 * Mengonversi model ke bentuk DTO polos.
	 *
	 * @returns {GarasiDTO} Objek DTO.
	 */
	public toDTO(): GarasiDTO {
		return {
			id: this.id,
			tipeGarasi: this.tipeGarasi,
			nomorUrut: this.nomorUrut,
			hargaHarian: this.hargaHarian,
			hargaListrikPerKwh: this.hargaListrikPerKwh,
			status: this._status,
			createdAt: this.createdAt
		};
	}
}
