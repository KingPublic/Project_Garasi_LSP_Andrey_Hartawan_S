import type { Garasi, Sewa } from '../generated/prisma/client';
import { GarasiModel } from '../models/GarasiModel';
import { SewaModel } from '../models/SewaModel';
import type { StatusGarasi, TipeGarasi, TipeKendaraan } from '../models/types';
import { getTodayUtcDate, normalizeToUtcDate } from '../utils/date';
import type { IGarasiRepository, ISewaRepository } from '../repositories/interfaces';
import { garasiRepository } from '../repositories/GarasiRepository';
import { sewaRepository } from '../repositories/SewaRepository';

/**
 * Service untuk operasi inventaris garasi dan pengecekan ketersediaan unit.
 *
 * @author Andrey Hartawan Suwardi
 * @version 1.0
 */
export class GarasiService {
	private garasiRepo: IGarasiRepository;
	private sewaRepo: ISewaRepository;

	/**
	 * Konstruktor GarasiService dengan dependency injection.
	 *
	 * @param garasiRepo - Repository garasi.
	 * @param sewaRepo - Repository sewa.
	 */
	constructor(
		garasiRepo: IGarasiRepository = garasiRepository,
		sewaRepo: ISewaRepository = sewaRepository
	) {
		this.garasiRepo = garasiRepo;
		this.sewaRepo = sewaRepo;
	}

	/**
	 * Menambahkan unit garasi baru secara massal per tipe:
	 * 1. Ambil nomor urut terakhir di database.
	 * 2. Validasi batas kumulatif 999 unit per tipe.
	 * 3. Hasilkan kode otomatis (S001..S999, C001..C999, E001..E999).
	 * 4. Simpan seluruh unit baru ke database.
	 *
	 * @param tipe - Tipe garasi (SEPEDA, MOBIL, MOBIL_LISTRIK).
	 * @param jumlahBaru - Jumlah unit baru yang ingin dibuat.
	 * @param hargaHarian - Tarif sewa harian.
	 * @param hargaListrikPerKwh - Tarif listrik per kWh (khusus MOBIL_LISTRIK).
	 */
	public async buatGarasiMassal(
		tipe: TipeGarasi,
		jumlahBaru: number,
		hargaHarian: number,
		hargaListrikPerKwh?: number | null
	): Promise<number> {
		const nomorUrutTerakhir = await this.garasiRepo.getNomorUrutTerakhir(tipe);
		const garasiModels = GarasiModel.generateKelompok(
			tipe,
			nomorUrutTerakhir,
			jumlahBaru,
			hargaHarian,
			hargaListrikPerKwh
		);

		const dtos = garasiModels.map((m) => m.toDTO());
		return this.garasiRepo.createMany(dtos);
	}

	/**
	 * Mengambil seluruh daftar unit garasi di sistem.
	 */
	public async getDaftarGarasi(): Promise<Garasi[]> {
		return this.garasiRepo.findAll();
	}

	/**
	 * Mencari unit garasi yang cocok dengan jenis kendaraan dan tidak bentrok pada rentang tanggal sewa.
	 *
	 * @param tipeKendaraan - Tipe kendaraan penyewa.
	 * @param tanggalMulai - Tanggal mulai sewa.
	 * @param tanggalSelesai - Tanggal selesai sewa.
	 */
	public async getGarasiTersedia(
		tipeKendaraan: TipeKendaraan,
		tanggalMulai: Date | string,
		tanggalSelesai: Date | string
	): Promise<Garasi[]> {
		const tMulai = normalizeToUtcDate(tanggalMulai);
		const tSelesai = normalizeToUtcDate(tanggalSelesai);

		const semuaGarasi = await this.garasiRepo.findAll();
		const semuaSewaAktif = await this.sewaRepo.findAllActiveSewa();

		// Kelompokkan jadwal sewa aktif per garasi di memori agar cek bentrok cukup dilakukan di memori tanpa query database berulang di dalam loop (mencegah N+1 query)
		const sewaPerGarasi = new Map<string, Sewa[]>();
		for (const sewa of semuaSewaAktif) {
			const list = sewaPerGarasi.get(sewa.garasiId) ?? [];
			list.push(sewa);
			sewaPerGarasi.set(sewa.garasiId, list);
		}

		const garasiTersedia: Garasi[] = [];

		for (const g of semuaGarasi) {
			const model = new GarasiModel({
				id: g.id,
				tipeGarasi: g.tipeGarasi as TipeGarasi,
				nomorUrut: g.nomorUrut,
				hargaHarian: g.hargaHarian,
				hargaListrikPerKwh: g.hargaListrikPerKwh,
				status: g.status as StatusGarasi
			});

			// Cek kecocokan tipe kendaraan dengan garasi
			if (!model.cocokDenganKendaraan(tipeKendaraan)) {
				continue;
			}

			// Cek bentrok jadwal dengan sewa aktif pada garasi ini
			const jadwalAktif = sewaPerGarasi.get(g.id) ?? [];
			let isBentrok = false;

			for (const sewa of jadwalAktif) {
				if (SewaModel.cekBentrokJadwal(tMulai, tSelesai, sewa.tanggalMulai, sewa.tanggalSelesai)) {
					isBentrok = true;
					break;
				}
			}

			if (!isBentrok) {
				garasiTersedia.push(g);
			}
		}

		return garasiTersedia;
	}

	/**
	 * Melakukan sinkronisasi status kolom `Garasi.status` ('AVAILABLE' vs 'USED')
	 * secara real-time berdasarkan transaksi sewa aktif pada hari ini.
	 *
	 * @param today - Tanggal acuan sinkronisasi.
	 */
	public async sinkronisasiStatusGarasiHariIni(today: Date = getTodayUtcDate()): Promise<void> {
		const semuaGarasi = await this.garasiRepo.findAll();
		const sewaAktifHariIni = await this.sewaRepo.findSewaAktifHariIni(today);
		const garasiIdUsedSet = new Set(sewaAktifHariIni.map((s) => s.garasiId));

		for (const g of semuaGarasi) {
			const shouldBeUsed = garasiIdUsedSet.has(g.id);
			if (shouldBeUsed && g.status !== 'USED') {
				await this.garasiRepo.updateStatus(g.id, 'USED');
			} else if (!shouldBeUsed && g.status !== 'AVAILABLE') {
				await this.garasiRepo.updateStatus(g.id, 'AVAILABLE');
			}
		}
	}
}

export const garasiService = new GarasiService();
