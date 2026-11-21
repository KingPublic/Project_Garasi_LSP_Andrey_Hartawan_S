/**
 * @file KendaraanRepository.ts
 * @description Implementasi repository akses basis data untuk model Kendaraan menggunakan Prisma.
 */

import { db } from '../server/db';
import type { Kendaraan } from '../generated/prisma/client';
import type { KendaraanDTO } from '../models/types';
import type { IKendaraanRepository } from './interfaces';

/**
 * Repository untuk operasi CRUD data Kendaraan penyewa.
 *
 * @class KendaraanRepository
 * @implements {IKendaraanRepository}
 */
export class KendaraanRepository implements IKendaraanRepository {
	/**
	 * Mencari kendaraan berdasarkan ID unik.
	 *
	 * @param {number} id - ID kendaraan.
	 * @returns {Promise<Kendaraan | null>} Objek Kendaraan atau null.
	 */
	public async findById(id: number): Promise<Kendaraan | null> {
		return db.kendaraan.findUnique({
			where: { id }
		});
	}

	/**
	 * Mengambil semua daftar kendaraan milik seorang penyewa.
	 *
	 * @param {number} penyewaId - ID pengguna penyewa.
	 * @returns {Promise<Kendaraan[]>} Daftar kendaraan milik penyewa.
	 */
	public async findByPenyewaId(penyewaId: number): Promise<Kendaraan[]> {
		return db.kendaraan.findMany({
			where: { penyewaId },
			orderBy: { createdAt: 'desc' }
		});
	}

	/**
	 * Menyimpan data kendaraan baru ke basis data.
	 *
	 * @param {Omit<KendaraanDTO, 'id' | 'createdAt'>} data - Data kendaraan.
	 * @returns {Promise<Kendaraan>} Objek Kendaraan yang berhasil dibuat.
	 */
	public async create(data: Omit<KendaraanDTO, 'id' | 'createdAt'>): Promise<Kendaraan> {
		return db.kendaraan.create({
			data: {
				penyewaId: data.penyewaId,
				tipeKendaraan: data.tipeKendaraan,
				nomorPlat: data.nomorPlat,
				merekTipe: data.merekTipe,
				kapasitasBateraiKwh: data.kapasitasBateraiKwh
			}
		});
	}
}

export const kendaraanRepository = new KendaraanRepository();
