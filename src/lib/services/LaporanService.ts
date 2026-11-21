/**
 * @file LaporanService.ts
 * @description Service orkestrasi pelaporan persewaan garasi dan agregasi pendapatan dengan 4 dimensi filter.
 */

import type { IGarasiRepository, ISewaRepository, IUserRepository, LaporanData, LaporanFilterInput } from '../repositories/interfaces';
import { getTodayUtcDate } from '../utils/date';
import { garasiRepository } from '../repositories/GarasiRepository';
import { sewaRepository } from '../repositories/SewaRepository';
import { userRepository } from '../repositories/UserRepository';

export interface RingkasanDashboardAdmin {
	totalGarasi: number;
	garasiUsed: number;
	garasiAvailable: number;
	totalCalonPenyewaPending: number;
	totalPenyewaApproved: number;
	totalOmzetBulanIni: number;
	totalTransaksiBulanIni: number;
}

/**
 * Service untuk menyajikan laporan dan metrik analitik bisnis.
 *
 * @class LaporanService
 */
export class LaporanService {
	private sewaRepo: ISewaRepository;
	private garasiRepo: IGarasiRepository;
	private userRepo: IUserRepository;

	/**
	 * Konstruktor LaporanService dengan dependency injection.
	 *
	 * @constructor
	 * @param {ISewaRepository} [sewaRepo=sewaRepository] - Repository sewa.
	 * @param {IGarasiRepository} [garasiRepo=garasiRepository] - Repository garasi.
	 * @param {IUserRepository} [userRepo=userRepository] - Repository user.
	 */
	constructor(
		sewaRepo: ISewaRepository = sewaRepository,
		garasiRepo: IGarasiRepository = garasiRepository,
		userRepo: IUserRepository = userRepository
	) {
		this.sewaRepo = sewaRepo;
		this.garasiRepo = garasiRepo;
		this.userRepo = userRepo;
	}

	/**
	 * Mengambil data laporan sewa garasi dan ringkasan omzet dengan 4 filter dimensi:
	 * 1. Per bulan dalam tahun tertentu (e.g. bulan 11 tahun 2026).
	 * 2. Per hari dalam bulan tertentu (e.g. tanggal '2026-11-21').
	 * 3. Per Tipe Garasi ('SEPEDA', 'MOBIL', 'MOBIL_LISTRIK').
	 * 4. Per Penyewa.
	 *
	 * @param {LaporanFilterInput} filter - Parameter filter.
	 * @returns {Promise<LaporanData>} Ringkasan transaksi, omzet, dan daftar transaksi.
	 */
	public async getLaporan(filter: LaporanFilterInput): Promise<LaporanData> {
		return this.sewaRepo.getLaporan(filter);
	}

	/**
	 * Mengambil ringkasan metrik statistik operasional untuk dashboard Admin.
	 *
	 * @returns {Promise<RingkasanDashboardAdmin>} Ringkasan statistik operasional.
	 */
	public async getRingkasanDashboard(): Promise<RingkasanDashboardAdmin> {
		const garasiList = await this.garasiRepo.findAll();
		const totalGarasi = garasiList.length;
		const garasiUsed = garasiList.filter((g) => g.status === 'USED').length;
		const garasiAvailable = totalGarasi - garasiUsed;

		const userList = await this.userRepo.findAllCalonPenyewa();
		const totalCalonPenyewaPending = userList.filter((u) => u.statusVerifikasi === 'PENDING').length;
		const totalPenyewaApproved = userList.filter((u) => u.statusVerifikasi === 'APPROVED').length;

		const today = getTodayUtcDate();
		const laporanBulanIni = await this.sewaRepo.getLaporan({
			bulan: today.getUTCMonth() + 1,
			tahun: today.getUTCFullYear()
		});

		return {
			totalGarasi,
			garasiUsed,
			garasiAvailable,
			totalCalonPenyewaPending,
			totalPenyewaApproved,
			totalOmzetBulanIni: laporanBulanIni.totalPendapatan,
			totalTransaksiBulanIni: laporanBulanIni.totalTransaksi
		};
	}
}

export const laporanService = new LaporanService();
