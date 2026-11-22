/**
 * @file UserRepository.ts
 * @description Implementasi repository akses basis data untuk model User menggunakan Prisma.
 */

import { db } from '../server/db';
import type { User } from '../generated/prisma/client';
import type { StatusVerifikasi, UserDTO } from '../models/types';
import type { IUserRepository } from './interfaces';

/**
 * Repository untuk operasi data pengguna di database.
 *
 * @author Andrey Hartawan Suwardi
 * @version 1.0
 */
export class UserRepository implements IUserRepository {
	/**
	 * Mencari pengguna berdasarkan ID.
	 *
	 * @param id - ID pengguna.
	 */
	public async findById(id: number): Promise<User | null> {
		return db.user.findUnique({
			where: { id }
		});
	}

	/**
	 * Mencari pengguna berdasarkan alamat email.
	 *
	 * @param email - Email pengguna.
	 */
	public async findByEmail(email: string): Promise<User | null> {
		return db.user.findUnique({
			where: { email: email.trim().toLowerCase() }
		});
	}

	/**
	 * Mencari pengguna berdasarkan NIK KTP (16 digit).
	 *
	 * @param nik - NIK pengguna.
	 */
	public async findByNik(nik: string): Promise<User | null> {
		return db.user.findUnique({
			where: { nik: nik.trim() }
		});
	}

	/**
	 * Menyimpan pengguna baru ke database.
	 *
	 * @param data - Data akun pengguna baru.
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
	 * @param id - ID pengguna.
	 * @param status - Status verifikasi baru.
	 */
	public async updateStatusVerifikasi(id: number, status: StatusVerifikasi): Promise<User> {
		return db.user.update({
			where: { id },
			data: { statusVerifikasi: status }
		});
	}

	/**
	 * Mengambil seluruh daftar calon penyewa terdaftar.
	 */
	public async findAllCalonPenyewa(): Promise<User[]> {
		return db.user.findMany({
			where: { role: 'PENYEWA' },
			orderBy: { createdAt: 'desc' }
		});
	}
}

export const userRepository = new UserRepository();
