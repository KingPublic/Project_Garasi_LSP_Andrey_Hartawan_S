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
 * Service untuk operasi autentikasi dan registrasi akun.
 *
 * @author Andrey Hartawan Suwardi
 * @version 1.0
 */
export class AuthService {
	private userRepo: IUserRepository;

	/**
	 * Konstruktor AuthService dengan dependency injection repository user.
	 *
	 * @param userRepo - Implementasi repository user.
	 */
	constructor(userRepo: IUserRepository = userRepository) {
		this.userRepo = userRepo;
	}

	/**
	 * Mendaftarkan akun penyewa baru ke sistem:
	 * 1. Validasi NIK (wajib 16 digit), nama lengkap, nomor telepon, format email, dan password minimal 6 karakter.
	 * 2. Cek keunikan email dan NIK di database.
	 * 3. Hash password memakai scrypt (src/lib/server/password.ts).
	 * 4. Simpan dengan statusVerifikasi awal 'PENDING'.
	 *
	 * @param params - Data registrasi calon penyewa.
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
	 * Memverifikasi email dan password pengguna saat login.
	 *
	 * @param email - Alamat email pengguna.
	 * @param passwordRaw - Password mentah.
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
	 * Admin memverifikasi akun calon penyewa (APPROVED atau REJECTED).
	 *
	 * @param penyewaId - ID calon penyewa.
	 * @param status - Keputusan verifikasi.
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
	 */
	public async getDaftarCalonPenyewa(): Promise<User[]> {
		return this.userRepo.findAllCalonPenyewa();
	}
}

export const authService = new AuthService();
