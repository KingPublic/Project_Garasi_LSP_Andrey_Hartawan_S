/**
 * @file interfaces.ts
 * @description Kontrak interface repository untuk abstraksi akses basis data relasional Prisma.
 */

import type {
	Garasi,
	Kendaraan,
	PerpanjanganSewa,
	Sewa,
	User
} from '../generated/prisma/client';
import type {
	GarasiDTO,
	KendaraanDTO,
	PerpanjanganSewaDTO,
	SewaDTO,
	StatusGarasi,
	StatusVerifikasi,
	TipeGarasi,
	UserDTO
} from '../models/types';

export interface LaporanFilterInput {
	bulan?: number;
	tahun?: number;
	tanggal?: Date | string;
	tipeGarasi?: TipeGarasi;
	penyewaId?: number;
}

export type SewaDetail = Sewa & {
	garasi: Garasi;
	kendaraan: Kendaraan;
	penyewa: User;
	perpanjangan?: PerpanjanganSewa[];
};

export interface LaporanData {
	totalTransaksi: number;
	totalPendapatan: number;
	daftarTransaksi: SewaDetail[];
}

export interface IUserRepository {
	findById(id: number): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	findByNik(nik: string): Promise<User | null>;
	create(data: Omit<UserDTO, 'id' | 'createdAt'>): Promise<User>;
	updateStatusVerifikasi(id: number, status: StatusVerifikasi): Promise<User>;
	findAllCalonPenyewa(): Promise<User[]>;
}

export interface IGarasiRepository {
	findById(id: string): Promise<Garasi | null>;
	findAll(): Promise<Garasi[]>;
	findByTipe(tipe: TipeGarasi): Promise<Garasi[]>;
	getNomorUrutTerakhir(tipe: TipeGarasi): Promise<number>;
	createMany(garasiList: GarasiDTO[]): Promise<number>;
	updateStatus(id: string, status: StatusGarasi): Promise<Garasi>;
}

export interface IKendaraanRepository {
	findById(id: number): Promise<Kendaraan | null>;
	findByPenyewaId(penyewaId: number): Promise<Kendaraan[]>;
	create(data: Omit<KendaraanDTO, 'id' | 'createdAt'>): Promise<Kendaraan>;
}

export interface ISewaRepository {
	findById(id: number): Promise<SewaDetail | null>;
	findByPenyewaId(penyewaId: number): Promise<Array<Sewa & { garasi: Garasi; kendaraan: Kendaraan }>>;
	findActiveSewaByGarasiId(garasiId: string): Promise<Sewa[]>;
	findSewaAktifHariIni(today: Date): Promise<SewaDetail[]>;
	create(data: Omit<SewaDTO, 'id' | 'createdAt'>): Promise<Sewa>;
	updateTanggalSelesaiDanBiaya(sewaId: number, tanggalSelesaiBaru: Date, tambahanBiaya: number): Promise<Sewa>;
	createPerpanjangan(data: Omit<PerpanjanganSewaDTO, 'id' | 'createdAt'>): Promise<PerpanjanganSewa>;
	getLaporan(filter: LaporanFilterInput): Promise<LaporanData>;
}
