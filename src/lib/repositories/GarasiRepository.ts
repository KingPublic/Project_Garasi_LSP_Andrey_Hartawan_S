/**
 * @file GarasiRepository.ts
 * @description Implementasi repository akses basis data untuk model Garasi menggunakan Prisma.
 */

import { db } from '../server/db';
import type { Garasi } from '../generated/prisma/client';
import type { GarasiDTO, StatusGarasi, TipeGarasi } from '../models/types';
import type { IGarasiRepository } from './interfaces';

/**
 * Repository untuk operasi data unit garasi di database.
 *
 * @author Andrey Hartawan Suwardi
 * @version 1.0
 */
export class GarasiRepository implements IGarasiRepository {
	/**
	 * Mencari unit garasi berdasarkan ID kode unit (misalnya S001, C010, E999).
	 *
	 * @param id - Kode unit garasi.
	 */
	public async findById(id: string): Promise<Garasi | null> {
		return db.garasi.findUnique({
			where: { id }
		});
	}

	/**
	 * Mengambil seluruh unit garasi terurut berdasarkan tipe dan nomor urut.
	 */
	public async findAll(): Promise<Garasi[]> {
		return db.garasi.findMany({
			orderBy: [{ tipeGarasi: 'asc' }, { nomorUrut: 'asc' }]
		});
	}

	/**
	 * Mengambil daftar unit garasi berdasarkan tipe (SEPEDA, MOBIL, MOBIL_LISTRIK).
	 *
	 * @param tipe - Tipe garasi.
	 */
	public async findByTipe(tipe: TipeGarasi): Promise<Garasi[]> {
		return db.garasi.findMany({
			where: { tipeGarasi: tipe },
			orderBy: { nomorUrut: 'asc' }
		});
	}

	/**
	 * Mengambil nomor urut tertinggi untuk tipe garasi tertentu (0 jika belum ada).
	 *
	 * @param tipe - Tipe garasi.
	 */
	public async getNomorUrutTerakhir(tipe: TipeGarasi): Promise<number> {
		const garasiTerakhir = await db.garasi.findFirst({
			where: { tipeGarasi: tipe },
			orderBy: { nomorUrut: 'desc' }
		});

		return garasiTerakhir ? garasiTerakhir.nomorUrut : 0;
	}

	/**
	 * Menyimpan banyak unit garasi sekaligus ke database.
	 *
	 * @param garasiList - Daftar DTO garasi baru.
	 */
	public async createMany(garasiList: GarasiDTO[]): Promise<number> {
		const result = await db.garasi.createMany({
			data: garasiList.map((g) => ({
				id: g.id,
				tipeGarasi: g.tipeGarasi,
				nomorUrut: g.nomorUrut,
				hargaHarian: g.hargaHarian,
				hargaListrikPerKwh: g.hargaListrikPerKwh,
				status: g.status ?? 'AVAILABLE'
			})),
			skipDuplicates: true
		});

		return result.count;
	}

	/**
	 * Memperbarui status ketersediaan unit garasi (AVAILABLE atau USED).
	 *
	 * @param id - Kode unit garasi.
	 * @param status - Status baru.
	 */
	public async updateStatus(id: string, status: StatusGarasi): Promise<Garasi> {
		return db.garasi.update({
			where: { id },
			data: { status }
		});
	}
}

export const garasiRepository = new GarasiRepository();
