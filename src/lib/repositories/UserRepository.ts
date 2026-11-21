/**
 * @file UserRepository.ts
 * @description Implementasi repository akses basis data untuk model User menggunakan Prisma.
 */

import { db } from '../server/db';
import type { User } from '../generated/prisma/client';
import type { StatusVerifikasi, UserDTO } from '../models/types';
import type { IUserRepository } from './interfaces';

/**
 * Repository untuk operasi CRUD User.
 *
 * @class UserRepository
 * @implements {IUserRepository}
 */
export class UserRepository implements IUserRepository {
	/**
	 * Mencari pengguna berdasarkan ID unik.
	 *
	 * @param {number} id - ID pengguna.
	 * @returns {Promise<User | null>} Objek User atau null jika tidak ditemukan.
	 */
	public async findById(id: number): Promise<User | null> {
		return db.user.findUnique({
			where: { id }
		});
	}

	/**
	 * Mencari pengguna berdasarkan alamat email.
	 *
	 * @param {string} email - Email pengguna.
	 * @returns {Promise<User | null>} Objek User atau null jika tidak ditemukan.
	 */
	public async findByEmail(email: string): Promise<User | null> {
		return db.user.findUnique({
			where: { email: email.trim().toLowerCase() }
		});
	}

	/**
	 * Mencari pengguna berdasarkan NIK (KTP).
	 *
	 * @param {string} nik - NIK 16 digit.
	 * @returns {Promise<User | null>} Objek User atau null jika tidak ditemukan.
	 */
	public async findByNik(nik: string): Promise<User | null> {
		return db.user.findUnique({
			where: { nik: nik.trim() }
		});
	}

	/**
	 * Menyimpan data pengguna baru ke basis data.
	 *
	 * @param {Omit<UserDTO, 'id' | 'createdAt'>} data - Data pengguna baru.
	 * @returns {Promise<User>} Objek User yang berhasil dibuat.
	 */
	public async create(data: Omit<UserDTO, 'id' | 'createdAt'>): Promise<User> {
		return db.user.create({
			data: {
				nik: data.nik ? data.nik.trim() : null,
				namaLengkap: data.namaLengkap.trim(),
				noTelepon: data.noTelepon.trim(),
				email: data.email.trim().toLowerCase(),
				passwordHash: data.passwordHash ?? '',
				role: data.role,
				statusVerifikasi: data.statusVerifikasi
			}
		});
	}

	/**
	 * Memperbarui status verifikasi calon penyewa (APPROVED atau REJECTED).
	 *
	 * @param {number} id - ID pengguna.
	 * @param {StatusVerifikasi} status - Status verifikasi baru.
	 * @returns {Promise<User>} Objek User yang telah diperbarui.
	 */
	public async updateStatusVerifikasi(id: number, status: StatusVerifikasi): Promise<User> {
		return db.user.update({
			where: { id },
			data: { statusVerifikasi: status }
		});
	}

	/**
	 * Mengambil semua daftar calon penyewa (role PENYEWA) yang terdaftar.
	 *
	 * @returns {Promise<User[]>} Daftar calon penyewa terurut berdasarkan tanggal pendaftaran terbaru.
	 */
	public async findAllCalonPenyewa(): Promise<User[]> {
		return db.user.findMany({
			where: { role: 'PENYEWA' },
			orderBy: { createdAt: 'desc' }
		});
	}
}

export const userRepository = new UserRepository();
