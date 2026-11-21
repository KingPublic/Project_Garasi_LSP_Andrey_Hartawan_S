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
 * Service untuk penyajian laporan dan ringkasan statistik dashboard admin.
 *
 * @author Andrey Hartawan Suwardi
 * @version 1.0
 */
export class LaporanService {
	private sewaRepo: ISewaRepository;
	private garasiRepo: IGarasiRepository;
	private userRepo: IUserRepository;

	/**
	 * Konstruktor LaporanService dengan dependency injection.
	 *
	 * @param sewaRepo - Repository sewa.
	 * @param garasiRepo - Repository garasi.
	 * @param userRepo - Repository user.
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
	 * Mengambil data laporan sewa dan pendapatan dengan filter (bulan/tahun, tanggal, tipe garasi, penyewa).
	 *
	 * @param filter - Parameter filter laporan.
	 */
	public async getLaporan(filter: LaporanFilterInput): Promise<LaporanData> {
		return this.sewaRepo.getLaporan(filter);
	}

	/**
	 * Mengambil ringkasan statistik operasional untuk dashboard admin.
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
