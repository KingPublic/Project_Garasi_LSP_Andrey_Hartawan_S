/**
 * @file UserModel.ts
 * @description Model domain OOP untuk pengguna (User) sistem penyewaan garasi.
 * Menerapkan enkapsulasi data, validasi registrasi penyewa, dan aturan otorisasi status verifikasi.
 */

import { BaseModel } from './BaseModel';
import type { Role, StatusVerifikasi, UserDTO } from './types';

/**
 * Representasi domain pengguna (Admin atau Penyewa).
 *
 * @class UserModel
 * @extends {BaseModel<UserDTO>}
 */
export class UserModel extends BaseModel<UserDTO> {
	public readonly id?: number;
	public readonly nik: string | null;
	private _namaLengkap: string;
	private _noTelepon: string;
	public readonly email: string;
	public readonly role: Role;
	private _statusVerifikasi: StatusVerifikasi;
	public readonly passwordHash?: string;
	public readonly createdAt?: Date;

	/**
	 * Membuat instance baru dari UserModel dengan validasi integritas data.
	 *
	 * @constructor
	 * @param {UserDTO} data - Objek data transfer pengguna.
	 * @throws {Error} Jika validasi NIK, email, nomor telepon, atau nama lengkap gagal.
	 */
	constructor(data: UserDTO) {
		super();
		UserModel.validateRole(data.role);
		UserModel.validateNik(data.nik, data.role);
		UserModel.validateNamaLengkap(data.namaLengkap);
		UserModel.validateNoTelepon(data.noTelepon);
		UserModel.validateEmail(data.email);
		UserModel.validateStatusVerifikasi(data.statusVerifikasi);

		this.id = data.id;
		this.nik = data.nik ? data.nik.trim() : null;
		this._namaLengkap = data.namaLengkap.trim();
		this._noTelepon = data.noTelepon.trim();
		this.email = data.email.trim().toLowerCase();
		this.role = data.role;
		this._statusVerifikasi = data.statusVerifikasi;
		this.passwordHash = data.passwordHash;
		this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
	}

	/**
	 * Memvalidasi apakah role pengguna valid ('ADMIN' atau 'PENYEWA').
	 *
	 * @static
	 * @param {Role} role - Role pengguna.
	 * @throws {Error} Jika role tidak dikenal.
	 */
	public static validateRole(role: Role): void {
		if (role !== 'ADMIN' && role !== 'PENYEWA') {
			throw new Error(`Role tidak valid: '${role}'. Harus 'ADMIN' atau 'PENYEWA'.`);
		}
	}

	/**
	 * Memvalidasi Nomor Induk Kependudukan (NIK).
	 * Untuk peran 'PENYEWA', NIK wajib tepat 16 digit angka.
	 * Untuk peran 'ADMIN', NIK diperbolehkan bernilai null.
	 *
	 * @static
	 * @param {string | null} nik - Nomor NIK calon penyewa.
	 * @param {Role} role - Role pengguna.
	 * @throws {Error} Jika NIK tidak memenuhi kriteria 16 digit angka untuk penyewa.
	 */
	public static validateNik(nik: string | null, role: Role): void {
		if (role === 'ADMIN') {
			return;
		}

		if (!nik || typeof nik !== 'string') {
			throw new Error('NIK wajib diisi untuk peran Penyewa.');
		}

		const trimmed = nik.trim();
		if (!/^\d{16}$/.test(trimmed)) {
			throw new Error(`NIK harus tepat terdiri dari 16 digit angka. Panjang saat ini: ${trimmed.length} digit.`);
		}
	}

	/**
	 * Memvalidasi nama lengkap (minimal 3 karakter non-kosong).
	 *
	 * @static
	 * @param {string} namaLengkap - Nama lengkap pengguna.
	 * @throws {Error} Jika nama terlalu pendek atau kosong.
	 */
	public static validateNamaLengkap(namaLengkap: string): void {
		if (!namaLengkap || typeof namaLengkap !== 'string' || namaLengkap.trim().length < 3) {
			throw new Error('Nama lengkap wajib diisi dan memiliki panjang minimal 3 karakter.');
		}
	}

	/**
	 * Memvalidasi nomor telepon (10 s.d. 15 digit angka, opsional awalan +).
	 *
	 * @static
	 * @param {string} noTelepon - Nomor kontak telepon.
	 * @throws {Error} Jika format nomor telepon tidak valid.
	 */
	public static validateNoTelepon(noTelepon: string): void {
		if (!noTelepon || typeof noTelepon !== 'string') {
			throw new Error('Nomor telepon wajib diisi.');
		}
		const cleaned = noTelepon.replace(/[\s-]/g, '');
		if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
			throw new Error('Nomor telepon tidak valid. Harus terdiri dari 10 hingga 15 digit angka.');
		}
	}

	/**
	 * Memvalidasi alamat email menggunakan pola regex standar.
	 *
	 * @static
	 * @param {string} email - Alamat email pengguna.
	 * @throws {Error} Jika format email tidak valid.
	 */
	public static validateEmail(email: string): void {
		if (!email || typeof email !== 'string') {
			throw new Error('Email wajib diisi.');
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email.trim())) {
			throw new Error(`Format email tidak valid: '${email}'.`);
		}
	}

	/**
	 * Memvalidasi status verifikasi.
	 *
	 * @static
	 * @param {StatusVerifikasi} status - Status verifikasi.
	 * @throws {Error} Jika status tidak valid.
	 */
	public static validateStatusVerifikasi(status: StatusVerifikasi): void {
		const validStatuses: StatusVerifikasi[] = ['PENDING', 'APPROVED', 'REJECTED'];
		if (!validStatuses.includes(status)) {
			throw new Error(`Status verifikasi tidak valid: '${status}'.`);
		}
	}

	/**
	 * Memvalidasi kata sandi mentah pada saat pendaftaran (minimal 6 karakter).
	 *
	 * @static
	 * @param {string} password - Password mentah pengguna.
	 * @throws {Error} Jika password kurang dari 6 karakter.
	 */
	public static validateRawPassword(password: string): void {
		if (!password || typeof password !== 'string' || password.length < 6) {
			throw new Error('Password wajib diisi dan minimal memiliki panjang 6 karakter.');
		}
	}

	/**
	 * Mendapatkan nama lengkap pengguna.
	 *
	 * @returns {string} Nama lengkap.
	 */
	public get namaLengkap(): string {
		return this._namaLengkap;
	}

	/**
	 * Mengubah nama lengkap pengguna dengan validasi.
	 *
	 * @param {string} value - Nama baru.
	 */
	public set namaLengkap(value: string) {
		UserModel.validateNamaLengkap(value);
		this._namaLengkap = value.trim();
	}

	/**
	 * Mendapatkan nomor telepon pengguna.
	 *
	 * @returns {string} Nomor telepon.
	 */
	public get noTelepon(): string {
		return this._noTelepon;
	}

	/**
	 * Mengubah nomor telepon pengguna dengan validasi.
	 *
	 * @param {string} value - Nomor telepon baru.
	 */
	public set noTelepon(value: string) {
		UserModel.validateNoTelepon(value);
		this._noTelepon = value.trim();
	}

	/**
	 * Mendapatkan status verifikasi pengguna saat ini.
	 *
	 * @returns {StatusVerifikasi} Status verifikasi ('PENDING' | 'APPROVED' | 'REJECTED').
	 */
	public get statusVerifikasi(): StatusVerifikasi {
		return this._statusVerifikasi;
	}

	/**
	 * Menyetujui pendaftaran penyewa (status menjadi 'APPROVED').
	 *
	 * @returns {void}
	 */
	public approve(): void {
		this._statusVerifikasi = 'APPROVED';
	}

	/**
	 * Menolak pendaftaran penyewa (status menjadi 'REJECTED').
	 *
	 * @returns {void}
	 */
	public reject(): void {
		this._statusVerifikasi = 'REJECTED';
	}

	/**
	 * Memeriksa apakah penyewa memiliki hak akses untuk melakukan sewa garasi.
	 * Hanya pengguna dengan status verifikasi 'APPROVED' yang diizinkan menyewa.
	 *
	 * @returns {boolean} True jika berstatus 'APPROVED', false jika 'PENDING' atau 'REJECTED'.
	 */
	public bisaMenyewa(): boolean {
		return this._statusVerifikasi === 'APPROVED';
	}

	/**
	 * Memvalidasi apakah pengguna diizinkan menyewa, melemparkan Error jika tidak berhak.
	 *
	 * @returns {void}
	 * @throws {Error} Jika status verifikasi belum 'APPROVED'.
	 */
	public validasiBisaMenyewa(): void {
		if (!this.bisaMenyewa()) {
			throw new Error(
				`Penyewa belum disetujui untuk melakukan transaksi sewa (status saat ini: '${this._statusVerifikasi}').`
			);
		}
	}

	/**
	 * Mengonversi model ke bentuk DTO polos.
	 *
	 * @returns {UserDTO} Objek DTO.
	 */
	public toDTO(): UserDTO {
		return {
			id: this.id,
			nik: this.nik,
			namaLengkap: this._namaLengkap,
			noTelepon: this._noTelepon,
			email: this.email,
			passwordHash: this.passwordHash,
			role: this.role,
			statusVerifikasi: this._statusVerifikasi,
			createdAt: this.createdAt
		};
	}
}
