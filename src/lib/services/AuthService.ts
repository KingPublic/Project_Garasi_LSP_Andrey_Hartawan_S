/**
 * @file AuthService.ts
 * @description Service orkestrasi autentikasi, registrasi penyewa, verifikasi NIK, dan login.
 */

import type { User } from '../generated/prisma/client';
import { UserModel } from '../models/UserModel';
import type { StatusVerifikasi } from '../models/types';
import type { IUserRepository } from '../repositories/interfaces';
import { userRepository } from '../repositories/UserRepository';
import { hashPassword, verifyPassword } from '../server/password';

export interface RegisterPenyewaParams {
	nik: string;
	namaLengkap: string;
	noTelepon: string;
	email: string;
	password: string;
}

/**
 * Service untuk operasi autentikasi dan verifikasi pengguna.
 *
 * @class AuthService
 */
export class AuthService {
	private userRepo: IUserRepository;

	/**
	 * Konstruktor AuthService dengan dependency injection.
	 *
	 * @constructor
	 * @param {IUserRepository} [userRepo=userRepository] - Repository user.
	 */
	constructor(userRepo: IUserRepository = userRepository) {
		this.userRepo = userRepo;
	}

	/**
	 * Mendaftarkan akun Penyewa baru ke dalam sistem:
	 * 1. Validasi NIK (wajib 16 digit angka), nama lengkap, telepon, email, password minimal 6 karakter.
	 * 2. Cek keunikan email dan NIK di database.
	 * 3. Hash password dengan Bun.password.hash (atau fallback secure crypto).
	 * 4. Simpan dengan statusVerifikasi awal 'PENDING'.
	 *
	 * @param {RegisterPenyewaParams} params - Data registrasi calon penyewa.
	 * @returns {Promise<User>} Objek User yang berhasil dibuat.
	 * @throws {Error} Jika validasi gagal atau email/NIK telah terdaftar.
	 */
	public async registerPenyewa(params: RegisterPenyewaParams): Promise<User> {
		UserModel.validateNik(params.nik, 'PENYEWA');
		UserModel.validateNamaLengkap(params.namaLengkap);
		UserModel.validateNoTelepon(params.noTelepon);
		UserModel.validateEmail(params.email);
		UserModel.validateRawPassword(params.password);

		const emailClean = params.email.trim().toLowerCase();
		const nikClean = params.nik.trim();

		const existingByEmail = await this.userRepo.findByEmail(emailClean);
		if (existingByEmail) {
			throw new Error(`Email '${emailClean}' sudah terdaftar. Silakan gunakan email lain atau login.`);
		}

		const existingByNik = await this.userRepo.findByNik(nikClean);
		if (existingByNik) {
			throw new Error(`NIK '${nikClean}' sudah terdaftar dalam sistem.`);
		}

		const passwordHash = await hashPassword(params.password);

		return this.userRepo.create({
			nik: nikClean,
			namaLengkap: params.namaLengkap.trim(),
			noTelepon: params.noTelepon.trim(),
			email: emailClean,
			passwordHash,
			role: 'PENYEWA',
			statusVerifikasi: 'PENDING'
		});
	}

	/**
	 * Memverifikasi kredensial login pengguna (Admin maupun Penyewa).
	 *
	 * @param {string} email - Alamat email pengguna.
	 * @param {string} passwordRaw - Kata sandi mentah.
	 * @returns {Promise<User>} Objek User jika berhasil diautentikasi.
	 * @throws {Error} Jika email atau password salah.
	 */
	public async login(email: string, passwordRaw: string): Promise<User> {
		if (!email || !passwordRaw) {
			throw new Error('Email dan password wajib diisi.');
		}

		const emailClean = email.trim().toLowerCase();
		const user = await this.userRepo.findByEmail(emailClean);

		if (!user) {
			throw new Error('Email atau password yang Anda masukkan salah.');
		}

		const isPasswordValid = await verifyPassword(passwordRaw, user.passwordHash);
		if (!isPasswordValid) {
			throw new Error('Email atau password yang Anda masukkan salah.');
		}

		return user;
	}

	/**
	 * Admin memverifikasi status calon penyewa (Terima 'APPROVED' atau Tolak 'REJECTED').
	 *
	 * @param {number} penyewaId - ID penyewa yang diverifikasi.
	 * @param {StatusVerifikasi} status - Status keputusan ('APPROVED' | 'REJECTED').
	 * @returns {Promise<User>} Objek User yang diperbarui.
	 * @throws {Error} Jika status tidak valid atau penyewa tidak ditemukan.
	 */
	public async verifikasiPenyewa(penyewaId: number, status: StatusVerifikasi): Promise<User> {
		if (status !== 'APPROVED' && status !== 'REJECTED') {
			throw new Error("Status verifikasi hanya boleh 'APPROVED' atau 'REJECTED'.");
		}

		const penyewa = await this.userRepo.findById(penyewaId);
		if (!penyewa) {
			throw new Error(`Calon penyewa dengan ID ${penyewaId} tidak ditemukan.`);
		}

		return this.userRepo.updateStatusVerifikasi(penyewaId, status);
	}

	/**
	 * Mengambil seluruh daftar calon penyewa yang terdaftar untuk ditampilkan di tabel Admin.
	 *
	 * @returns {Promise<User[]>} Daftar calon penyewa.
	 */
	public async getDaftarCalonPenyewa(): Promise<User[]> {
		return this.userRepo.findAllCalonPenyewa();
	}
}

export const authService = new AuthService();
