/**
 * @file types.ts
 * @description Definisi tipe domain, enum union types, dan interface DTO
 * untuk sistem penyewaan garasi kendaraan (bebas dependensi framework/database).
 */

/**
 * Peran pengguna dalam sistem:
 * - ADMIN: Pengelola operasional garasi & verifikasi.
 * - PENYEWA: Pelanggan penyewa garasi.
 */
export type Role = 'ADMIN' | 'PENYEWA';

/**
 * Status verifikasi KTP/NIK calon penyewa:
 * - PENDING: Menunggu verifikasi dari admin.
 * - APPROVED: Disetujui, diizinkan membuat sewa baru.
 * - REJECTED: Ditolak oleh admin.
 */
export type StatusVerifikasi = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Tipe unit garasi yang tersedia:
 * - SEPEDA: Untuk sepeda kayuh dan sepeda motor (kode S001..S999).
 * - MOBIL: Untuk mobil konvensional dan mobil listrik (kode C001..C999).
 * - MOBIL_LISTRIK: Khusus mobil listrik dengan fasilitas charging (kode E001..E999).
 */
export type TipeGarasi = 'SEPEDA' | 'MOBIL' | 'MOBIL_LISTRIK';

/**
 * Tipe kendaraan yang didaftarkan oleh penyewa:
 * - SEPEDA: Sepeda manual/kayuh (tanpa plat nomor).
 * - SEPEDA_MOTOR: Sepeda motor bensin/listrik (wajib plat nomor).
 * - MOBIL: Mobil penumpang bensin/diesel (wajib plat nomor).
 * - MOBIL_LISTRIK: Mobil listrik (wajib plat nomor & kapasitas baterai kWh).
 */
export type TipeKendaraan = 'SEPEDA' | 'SEPEDA_MOTOR' | 'MOBIL' | 'MOBIL_LISTRIK';

/**
 * Durasi/jenis skema penyewaan:
 * - HARIAN: 1 s.d. (daysInMonth - 1) hari.
 * - BULANAN: Tepat sejumlah hari dinamis dalam bulan berjalan (tarif 25x harga harian).
 */
export type TipeSewa = 'HARIAN' | 'BULANAN';

/**
 * Status operasional garasi pada hari ini:
 * - AVAILABLE: Sedang kosong dan dapat disewa.
 * - USED: Sedang terisi sewa aktif pada hari ini.
 */
export type StatusGarasi = 'AVAILABLE' | 'USED';

/**
 * Status transaksi sewa:
 * - MENUNGGU_VERIFIKASI: Penyewa telah mengunggah bukti bayar, menunggu verifikasi Admin.
 * - AKTIF: Pembayaran telah diverifikasi Admin dan masa sewa sedang berjalan.
 * - SELESAI: Masa sewa telah berakhir.
 * - DITOLAK: Bukti pembayaran ditolak oleh Admin.
 */
export type StatusSewa = 'MENUNGGU_VERIFIKASI' | 'AKTIF' | 'SELESAI' | 'DITOLAK';

/**
 * Representasi rentang jadwal untuk validasi anti-bentrok (anti-overlap).
 */
export interface JadwalRentang {
	tanggalMulai: Date;
	tanggalSelesai: Date;
}

/**
 * Hasil perhitungan biaya perpanjangan masa sewa garasi.
 */
export interface PerpanjanganResult {
	jumlahBulan: number;
	sisaHari: number;
	tambahanHari: number;
	biayaTambahan: number;
	tanggalSelesaiBaru: Date;
}

/**
 * Data Transfer Object untuk User.
 */
export interface UserDTO {
	id?: number;
	nik: string | null;
	namaLengkap: string;
	noTelepon: string;
	email: string;
	passwordHash?: string;
	role: Role;
	statusVerifikasi: StatusVerifikasi;
	createdAt?: Date;
}

/**
 * Data Transfer Object untuk Garasi.
 */
export interface GarasiDTO {
	id: string;
	tipeGarasi: TipeGarasi;
	nomorUrut: number;
	hargaHarian: number;
	hargaListrikPerKwh: number | null;
	status: StatusGarasi;
	createdAt?: Date;
}

/**
 * Data Transfer Object untuk Kendaraan.
 */
export interface KendaraanDTO {
	id?: number;
	penyewaId: number;
	tipeKendaraan: TipeKendaraan;
	nomorPlat: string | null;
	merekTipe: string;
	kapasitasBateraiKwh?: number | null;
	createdAt?: Date;
}

/**
 * Data Transfer Object untuk Sewa.
 */
export interface SewaDTO {
	id?: number;
	penyewaId: number;
	garasiId: string;
	kendaraanId: number;
	tipeSewa: TipeSewa;
	jumlahHari: number;
	tanggalMulai: Date;
	tanggalSelesai: Date;
	sisaBateraiKwh: number | null;
	biayaSewa: number;
	biayaListrik: number;
	totalBiaya: number;
	buktiBayarPath: string;
	statusSewa: StatusSewa;
	createdAt?: Date;
}

/**
 * Data Transfer Object untuk Perpanjangan Sewa.
 */
export interface PerpanjanganSewaDTO {
	id?: number;
	sewaId: number;
	tanggalSelesaiLama: Date;
	tanggalSelesaiBaru: Date;
	tambahanHari: number;
	biayaTambahan: number;
	buktiBayarPath: string;
	createdAt?: Date;
}
