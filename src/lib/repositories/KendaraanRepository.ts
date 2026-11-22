/**
 * @file KendaraanRepository.ts
 * @description Implementasi repository akses basis data untuk model Kendaraan menggunakan Prisma.
 */

import { db } from '../server/db';
import type { Kendaraan } from '../generated/prisma/client';
import type { KendaraanDTO } from '../models/types';
import type { IKendaraanRepository } from './interfaces';

/**
 * Repository untuk operasi data kendaraan penyewa di database.
 *
 * @author Andrey Hartawan Suwardi
 * @version 1.0
 */
export class KendaraanRepository implements IKendaraanRepository {
	/**
	 * Mencari kendaraan berdasarkan ID.
	 *
	 * @param id - ID kendaraan.
	 */
	public async findById(id: number): Promise<Kendaraan | null> {
		return db.kendaraan.findUnique({
			where: { id }
		});
	}

	/**
	 * Mengambil semua kendaraan milik seorang penyewa.
	 *
	 * @param penyewaId - ID akun penyewa.
	 */
	public async findByPenyewaId(penyewaId: number): Promise<Kendaraan[]> {
		return db.kendaraan.findMany({
			where: { penyewaId },
			orderBy: { createdAt: 'desc' }
		});
	}

	/**
	 * Menyimpan data kendaraan baru ke database.
	 *
	 * @param data - Data kendaraan tanpa ID.
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
