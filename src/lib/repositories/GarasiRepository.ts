/**
 * @file GarasiRepository.ts
 * @description Implementasi repository akses basis data untuk model Garasi menggunakan Prisma.
 */

import { db } from '../server/db';
import type { Garasi } from '../generated/prisma/client';
import type { GarasiDTO, StatusGarasi, TipeGarasi } from '../models/types';
import type { IGarasiRepository } from './interfaces';

/**
 * Repository untuk operasi inventaris unit Garasi.
 *
 * @class GarasiRepository
 * @implements {IGarasiRepository}
 */
export class GarasiRepository implements IGarasiRepository {
	/**
	 * Mencari unit garasi berdasarkan ID kode unit (contoh: 'S001', 'C010', 'E999').
	 *
	 * @param {string} id - Kode unit garasi.
	 * @returns {Promise<Garasi | null>} Objek Garasi atau null.
	 */
	public async findById(id: string): Promise<Garasi | null> {
		return db.garasi.findUnique({
			where: { id }
		});
	}

	/**
	 * Mengambil seluruh unit garasi terurut berdasarkan ID.
	 *
	 * @returns {Promise<Garasi[]>} Daftar seluruh garasi.
	 */
	public async findAll(): Promise<Garasi[]> {
		return db.garasi.findMany({
			orderBy: [{ tipeGarasi: 'asc' }, { nomorUrut: 'asc' }]
		});
	}

	/**
	 * Mengambil daftar unit garasi berdasarkan tipenya ('SEPEDA', 'MOBIL', 'MOBIL_LISTRIK').
	 *
	 * @param {TipeGarasi} tipe - Tipe garasi.
	 * @returns {Promise<Garasi[]>} Daftar unit garasi terurut nomor urut.
	 */
	public async findByTipe(tipe: TipeGarasi): Promise<Garasi[]> {
		return db.garasi.findMany({
			where: { tipeGarasi: tipe },
			orderBy: { nomorUrut: 'asc' }
		});
	}

	/**
	 * Mendapatkan nomor urut tertinggi saat ini untuk tipe garasi tertentu.
	 * Menghasilkan 0 jika belum ada unit yang terdaftar untuk tipe tersebut.
	 *
	 * @param {TipeGarasi} tipe - Tipe garasi.
	 * @returns {Promise<number>} Nomor urut tertinggi (0..999).
	 */
	public async getNomorUrutTerakhir(tipe: TipeGarasi): Promise<number> {
		const garasiTerakhir = await db.garasi.findFirst({
			where: { tipeGarasi: tipe },
			orderBy: { nomorUrut: 'desc' }
		});

		return garasiTerakhir ? garasiTerakhir.nomorUrut : 0;
	}

	/**
	 * Menyimpan sejumlah unit garasi baru secara massal (bulk insert).
	 *
	 * @param {GarasiDTO[]} garasiList - Daftar unit garasi yang telah dibuat oleh model generator.
	 * @returns {Promise<number>} Jumlah unit yang berhasil disimpan.
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
	 * Memperbarui status ketersediaan operasional unit garasi ('AVAILABLE' atau 'USED').
	 *
	 * @param {string} id - Kode unit garasi.
	 * @param {StatusGarasi} status - Status baru.
	 * @returns {Promise<Garasi>} Objek Garasi yang telah diperbarui.
	 */
	public async updateStatus(id: string, status: StatusGarasi): Promise<Garasi> {
		return db.garasi.update({
			where: { id },
			data: { status }
		});
	}
}

export const garasiRepository = new GarasiRepository();
