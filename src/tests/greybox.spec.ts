/**
 * @file greybox.spec.ts
 * @description Pengujian Unit Grey-box Testing untuk layer Services dan orkestrasi alur transaksi bisnis
 * menggunakan Mock / In-Memory Repositories, mencakup proteksi IDOR, pencegahan data sampah, dan HMAC session cookie.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { Garasi, Kendaraan, PerpanjanganSewa, Sewa, User } from '../lib/generated/prisma/client';
import {
	AuthService,
	GarasiService,
	LaporanService,
	SewaService
} from '../lib/services';
import type {
	IGarasiRepository,
	IKendaraanRepository,
	ISewaRepository,
	IUserRepository,
	LaporanData,
	LaporanFilterInput,
	SewaDetail
} from '../lib/repositories/interfaces';
import type {
	GarasiDTO,
	KendaraanDTO,
	PerpanjanganSewaDTO,
	SewaDTO,
	StatusGarasi,
	StatusVerifikasi,
	TipeGarasi,
	UserDTO
} from '../lib/models/types';
import { createUtcDate, normalizeToUtcDate } from '../lib/utils/date';
import { createSession, getSession, SESSION_COOKIE_NAME, type SessionUser } from '../lib/server/auth';
import type { Cookies } from '@sveltejs/kit';

// =============================================================================
// MOCK / IN-MEMORY REPOSITORIES UNTUK GREY-BOX TESTING
// =============================================================================

class MockUserRepository implements IUserRepository {
	public users: User[] = [];
	private nextId = 1;

	async findById(id: number): Promise<User | null> {
		return this.users.find((u) => u.id === id) ?? null;
	}

	async findByEmail(email: string): Promise<User | null> {
		return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
	}

	async findByNik(nik: string): Promise<User | null> {
		return this.users.find((u) => u.nik === nik) ?? null;
	}

	async create(data: Omit<UserDTO, 'id' | 'createdAt'>): Promise<User> {
		const user: User = {
			id: this.nextId++,
			nik: data.nik,
			namaLengkap: data.namaLengkap,
			noTelepon: data.noTelepon,
			email: data.email,
			passwordHash: data.passwordHash ?? '',
			role: data.role,
			statusVerifikasi: data.statusVerifikasi,
			createdAt: new Date()
		};
		this.users.push(user);
		return user;
	}

	async updateStatusVerifikasi(id: number, status: StatusVerifikasi): Promise<User> {
		const user = this.users.find((u) => u.id === id);
		if (!user) throw new Error('User not found');
		user.statusVerifikasi = status;
		return user;
	}

	async findAllCalonPenyewa(): Promise<User[]> {
		return this.users.filter((u) => u.role === 'PENYEWA');
	}
}

class MockGarasiRepository implements IGarasiRepository {
	public garasis: Garasi[] = [];

	async findById(id: string): Promise<Garasi | null> {
		return this.garasis.find((g) => g.id === id) ?? null;
	}

	async findAll(): Promise<Garasi[]> {
		return [...this.garasis];
	}

	async findByTipe(tipe: TipeGarasi): Promise<Garasi[]> {
		return this.garasis.filter((g) => g.tipeGarasi === tipe);
	}

	async getNomorUrutTerakhir(tipe: TipeGarasi): Promise<number> {
		const matching = this.garasis.filter((g) => g.tipeGarasi === tipe);
		if (matching.length === 0) return 0;
		return Math.max(...matching.map((g) => g.nomorUrut));
	}

	async createMany(garasiList: GarasiDTO[]): Promise<number> {
		for (const g of garasiList) {
			this.garasis.push({
				id: g.id,
				tipeGarasi: g.tipeGarasi,
				nomorUrut: g.nomorUrut,
				hargaHarian: g.hargaHarian,
				hargaListrikPerKwh: g.hargaListrikPerKwh,
				status: g.status ?? 'AVAILABLE',
				createdAt: new Date()
			});
		}
		return garasiList.length;
	}

	async updateStatus(id: string, status: StatusGarasi): Promise<Garasi> {
		const garasi = this.garasis.find((g) => g.id === id);
		if (!garasi) throw new Error('Garasi not found');
		garasi.status = status;
		return garasi;
	}
}

class MockKendaraanRepository implements IKendaraanRepository {
	public kendaraans: Kendaraan[] = [];
	private nextId = 1;

	async findById(id: number): Promise<Kendaraan | null> {
		return this.kendaraans.find((k) => k.id === id) ?? null;
	}

	async findByPenyewaId(penyewaId: number): Promise<Kendaraan[]> {
		return this.kendaraans.filter((k) => k.penyewaId === penyewaId);
	}

	async create(data: Omit<KendaraanDTO, 'id' | 'createdAt'>): Promise<Kendaraan> {
		const kendaraan: Kendaraan = {
			id: this.nextId++,
			penyewaId: data.penyewaId,
			tipeKendaraan: data.tipeKendaraan,
			nomorPlat: data.nomorPlat,
			merekTipe: data.merekTipe,
			kapasitasBateraiKwh: data.kapasitasBateraiKwh ?? null,
			createdAt: new Date()
		};
		this.kendaraans.push(kendaraan);
		return kendaraan;
	}
}

class MockSewaRepository implements ISewaRepository {
	public sewas: Sewa[] = [];
	public perpanjangans: PerpanjanganSewa[] = [];
	private nextSewaId = 1;
	private nextPerpanjanganId = 1;

	constructor(
		private userRepo: MockUserRepository,
		private garasiRepo: MockGarasiRepository,
		private kendaraanRepo: MockKendaraanRepository
	) {}

	async findById(id: number): Promise<SewaDetail | null> {
		const sewa = this.sewas.find((s) => s.id === id);
		if (!sewa) return null;
		const garasi = (await this.garasiRepo.findById(sewa.garasiId))!;
		const kendaraan = (await this.kendaraanRepo.findById(sewa.kendaraanId))!;
		const penyewa = (await this.userRepo.findById(sewa.penyewaId))!;
		const perpanjangan = this.perpanjangans.filter((p) => p.sewaId === id);

		return {
			...sewa,
			garasi,
			kendaraan,
			penyewa,
			perpanjangan
		};
	}

	async findByPenyewaId(
		penyewaId: number
	): Promise<Array<Sewa & { garasi: Garasi; kendaraan: Kendaraan }>> {
		const list = this.sewas.filter((s) => s.penyewaId === penyewaId);
		const result: Array<Sewa & { garasi: Garasi; kendaraan: Kendaraan }> = [];
		for (const s of list) {
			const garasi = (await this.garasiRepo.findById(s.garasiId))!;
			const kendaraan = (await this.kendaraanRepo.findById(s.kendaraanId))!;
			result.push({ ...s, garasi, kendaraan });
		}
		return result;
	}

	async findActiveSewaByGarasiId(garasiId: string): Promise<Sewa[]> {
		return this.sewas.filter((s) => s.garasiId === garasiId && s.statusSewa === 'AKTIF');
	}

	async findAllActiveSewa(): Promise<Sewa[]> {
		return this.sewas.filter((s) => s.statusSewa === 'AKTIF');
	}

	async findSewaAktifHariIni(today: Date): Promise<SewaDetail[]> {
		const target = normalizeToUtcDate(today).getTime();
		const list = this.sewas.filter(
			(s) =>
				s.statusSewa === 'AKTIF' &&
				s.tanggalMulai.getTime() <= target &&
				s.tanggalSelesai.getTime() > target
		);

		const result: SewaDetail[] = [];
		for (const s of list) {
			const detail = await this.findById(s.id);
			if (detail) result.push(detail);
		}
		return result;
	}

	async create(data: Omit<SewaDTO, 'id' | 'createdAt'>): Promise<Sewa> {
		const sewa: Sewa = {
			id: this.nextSewaId++,
			penyewaId: data.penyewaId,
			garasiId: data.garasiId,
			kendaraanId: data.kendaraanId,
			tipeSewa: data.tipeSewa,
			jumlahHari: data.jumlahHari,
			tanggalMulai: normalizeToUtcDate(data.tanggalMulai),
			tanggalSelesai: normalizeToUtcDate(data.tanggalSelesai),
			sisaBateraiKwh: data.sisaBateraiKwh ?? null,
			biayaSewa: data.biayaSewa,
			biayaListrik: data.biayaListrik,
			totalBiaya: data.totalBiaya,
			buktiBayarPath: data.buktiBayarPath,
			statusSewa: data.statusSewa ?? 'AKTIF',
			createdAt: new Date()
		};
		this.sewas.push(sewa);
		return sewa;
	}

	async updateTanggalSelesaiDanBiaya(
		sewaId: number,
		tanggalSelesaiBaru: Date,
		tambahanBiaya: number,
		tambahanHari: number
	): Promise<Sewa> {
		const sewa = this.sewas.find((s) => s.id === sewaId);
		if (!sewa) throw new Error('Sewa not found');
		sewa.tanggalSelesai = normalizeToUtcDate(tanggalSelesaiBaru);
		sewa.totalBiaya += tambahanBiaya;
		sewa.jumlahHari += tambahanHari;
		return sewa;
	}

	async createPerpanjangan(
		data: Omit<PerpanjanganSewaDTO, 'id' | 'createdAt'>
	): Promise<PerpanjanganSewa> {
		const perpanjangan: PerpanjanganSewa = {
			id: this.nextPerpanjanganId++,
			sewaId: data.sewaId,
			tanggalSelesaiLama: normalizeToUtcDate(data.tanggalSelesaiLama),
			tanggalSelesaiBaru: normalizeToUtcDate(data.tanggalSelesaiBaru),
			tambahanHari: data.tambahanHari,
			biayaTambahan: data.biayaTambahan,
			buktiBayarPath: data.buktiBayarPath,
			createdAt: new Date()
		};
		this.perpanjangans.push(perpanjangan);
		return perpanjangan;
	}

	async getLaporan(filter: LaporanFilterInput): Promise<LaporanData> {
		let list = [...this.sewas];

		if (filter.tipeGarasi) {
			const garasis = await this.garasiRepo.findByTipe(filter.tipeGarasi);
			const garasiIds = new Set(garasis.map((g) => g.id));
			list = list.filter((s) => garasiIds.has(s.garasiId));
		}

		if (filter.penyewaId) {
			list = list.filter((s) => s.penyewaId === filter.penyewaId);
		}

		const daftarTransaksi: SewaDetail[] = [];
		for (const s of list) {
			const detail = await this.findById(s.id);
			if (detail) daftarTransaksi.push(detail);
		}

		const totalPendapatan = daftarTransaksi.reduce((acc, curr) => acc + curr.totalBiaya, 0);

		return {
			totalTransaksi: daftarTransaksi.length,
			totalPendapatan,
			daftarTransaksi
		};
	}
}

// =============================================================================
// TEST SUITE: GREY-BOX TESTING
// =============================================================================

describe('Grey-box Testing - Layer Services & Orchestration', () => {
	let userRepo: MockUserRepository;
	let garasiRepo: MockGarasiRepository;
	let kendaraanRepo: MockKendaraanRepository;
	let sewaRepo: MockSewaRepository;

	let authService: AuthService;
	let garasiService: GarasiService;
	let sewaService: SewaService;
	let laporanService: LaporanService;

	const todayFixed = createUtcDate(2026, 11, 21);

	beforeEach(async () => {
		userRepo = new MockUserRepository();
		garasiRepo = new MockGarasiRepository();
		kendaraanRepo = new MockKendaraanRepository();
		sewaRepo = new MockSewaRepository(userRepo, garasiRepo, kendaraanRepo);

		authService = new AuthService(userRepo);
		garasiService = new GarasiService(garasiRepo, sewaRepo);
		sewaService = new SewaService(userRepo, garasiRepo, kendaraanRepo, sewaRepo);
		laporanService = new LaporanService(sewaRepo, garasiRepo, userRepo);

		// Seed garasi
		await garasiService.buatGarasiMassal('SEPEDA', 2, 5000);
		await garasiService.buatGarasiMassal('MOBIL', 2, 20000);
		await garasiService.buatGarasiMassal('MOBIL_LISTRIK', 2, 35000, 2500);
	});

	// =========================================================================
	// 1. AUTH SERVICE & HMAC SESSION COOKIE TESTING
	// =========================================================================
	describe('AuthService & HMAC Security Integration', () => {
		it('Registrasi penyewa baru berhasil dengan status default PENDING', async () => {
			expect.assertions(3);
			const user = await authService.registerPenyewa({
				nik: '3201012345670001',
				namaLengkap: 'Budi Santoso',
				noTelepon: '081234567890',
				email: 'budi@test.com',
				password: 'password123'
			});

			expect(user.id).toBeDefined();
			expect(user.statusVerifikasi).toBe('PENDING');
			expect(user.role).toBe('PENYEWA');
		});

		it('Menolak registrasi jika email atau NIK sudah terdaftar', async () => {
			expect.assertions(2);
			await authService.registerPenyewa({
				nik: '3201012345670001',
				namaLengkap: 'Budi Santoso',
				noTelepon: '081234567890',
				email: 'budi@test.com',
				password: 'password123'
			});

			// Email kembar
			await expect(
				authService.registerPenyewa({
					nik: '3201012345670002',
					namaLengkap: 'Budi Santoso 2',
					noTelepon: '081234567891',
					email: 'budi@test.com',
					password: 'password123'
				})
			).rejects.toThrow(/sudah terdaftar/i);

			// NIK kembar
			await expect(
				authService.registerPenyewa({
					nik: '3201012345670001',
					namaLengkap: 'Budi Santoso 3',
					noTelepon: '081234567892',
					email: 'budi3@test.com',
					password: 'password123'
				})
			).rejects.toThrow(/sudah terdaftar/i);
		});

		it('Login berhasil dengan kredensial benar dan gagal jika password salah', async () => {
			expect.assertions(2);
			await authService.registerPenyewa({
				nik: '3201012345670001',
				namaLengkap: 'Budi Santoso',
				noTelepon: '081234567890',
				email: 'budi@test.com',
				password: 'password123'
			});

			const loginOk = await authService.login('budi@test.com', 'password123');
			expect(loginOk.email).toBe('budi@test.com');

			await expect(authService.login('budi@test.com', 'passwordsalah')).rejects.toThrow(
				/email atau password/i
			);
		});

		it('Admin dapat memverifikasi calon penyewa (APPROVED atau REJECTED)', async () => {
			expect.assertions(2);
			const user = await authService.registerPenyewa({
				nik: '3201012345670001',
				namaLengkap: 'Budi Santoso',
				noTelepon: '081234567890',
				email: 'budi@test.com',
				password: 'password123'
			});

			const approved = await authService.verifikasiPenyewa(user.id, 'APPROVED');
			expect(approved.statusVerifikasi).toBe('APPROVED');

			const rejected = await authService.verifikasiPenyewa(user.id, 'REJECTED');
			expect(rejected.statusVerifikasi).toBe('REJECTED');
		});

		it('HMAC Session: Menolak cookie yang dimodifikasi (tampered payload/signature)', () => {
			expect.assertions(4);
			const store: Record<string, string> = {};
			const mockCookies = {
				set: (name: string, val: string) => {
					store[name] = val;
				},
				get: (name: string) => store[name],
				delete: (name: string) => {
					delete store[name];
				}
			} as unknown as Cookies;

			const sessionUser: SessionUser = {
				id: 1,
				email: 'penyewa@test.com',
				namaLengkap: 'Penyewa Asli',
				role: 'PENYEWA',
				statusVerifikasi: 'APPROVED'
			};

			createSession(mockCookies, sessionUser);
			const validSession = getSession(mockCookies);
			expect(validSession?.email).toBe('penyewa@test.com');
			expect(validSession?.role).toBe('PENYEWA');

			// Tamper payload base64 (mengubah role menjadi ADMIN)
			const originalCookie = store[SESSION_COOKIE_NAME];
			const [payload, hmac] = originalCookie.split('.');
			const tamperedPayload = Buffer.from(
				JSON.stringify({ ...sessionUser, role: 'ADMIN' })
			).toString('base64');
			store[SESSION_COOKIE_NAME] = `${tamperedPayload}.${hmac}`;

			// getSession wajib mengembalikan null karena signature HMAC tidak cocok
			const tamperedSession = getSession(mockCookies);
			expect(tamperedSession).toBeNull();

			// Format rusak tanpa titik pembatas
			store[SESSION_COOKIE_NAME] = 'formatrusaktanpatitik';
			expect(getSession(mockCookies)).toBeNull();
		});
	});

	// =========================================================================
	// 2. SEWA SERVICE TESTING (ALUR SEWA BARU, ANTI-BENTROK, STATUS GARASI, IDOR)
	// =========================================================================
	describe('SewaService - Alur Sewa Baru & Anti-Bentrok', () => {
		it('Menolak transaksi sewa baru jika penyewa berstatus PENDING atau REJECTED', async () => {
			expect.assertions(2);
			const userPending = await authService.registerPenyewa({
				nik: '3201012345670001',
				namaLengkap: 'Budi Santoso',
				noTelepon: '081234567890',
				email: 'budi@test.com',
				password: 'password123'
			});

			// Coba sewa saat PENDING
			await expect(
				sewaService.buatSewaBaru({
					penyewaId: userPending.id,
					garasiId: 'C001',
					tipeKendaraan: 'MOBIL',
					nomorPlat: 'DK 1234 AB',
					merekTipe: 'Avanza',
					tipeSewa: 'HARIAN',
					jumlahHari: 3,
					tanggalMulai: todayFixed,
					buktiBayarPath: '/uploads/bukti.png',
					referenceDateToday: todayFixed
				})
			).rejects.toThrow(/belum disetujui.*PENDING/i);

			// Admin menolak (REJECTED)
			await authService.verifikasiPenyewa(userPending.id, 'REJECTED');

			// Coba sewa saat REJECTED
			await expect(
				sewaService.buatSewaBaru({
					penyewaId: userPending.id,
					garasiId: 'C001',
					tipeKendaraan: 'MOBIL',
					nomorPlat: 'DK 1234 AB',
					merekTipe: 'Avanza',
					tipeSewa: 'HARIAN',
					jumlahHari: 3,
					tanggalMulai: todayFixed,
					buktiBayarPath: '/uploads/bukti.png',
					referenceDateToday: todayFixed
				})
			).rejects.toThrow(/belum disetujui.*REJECTED/i);
		});

		it('Berhasil membuat sewa baru saat penyewa APPROVED, dan garasi.status berubah menjadi USED', async () => {
			expect.assertions(4);
			const user = await authService.registerPenyewa({
				nik: '3201012345670001',
				namaLengkap: 'Budi Santoso',
				noTelepon: '081234567890',
				email: 'budi@test.com',
				password: 'password123'
			});
			await authService.verifikasiPenyewa(user.id, 'APPROVED');

			const sewa = await sewaService.buatSewaBaru({
				penyewaId: user.id,
				garasiId: 'C001',
				tipeKendaraan: 'MOBIL',
				nomorPlat: 'DK 1234 AB',
				merekTipe: 'Avanza',
				tipeSewa: 'HARIAN',
				jumlahHari: 3,
				tanggalMulai: todayFixed,
				buktiBayarPath: '/uploads/bukti.png',
				referenceDateToday: todayFixed
			});

			expect(sewa.id).toBeDefined();
			expect(sewa.biayaSewa).toBe(3 * 20000); // 60.000
			expect(sewa.totalBiaya).toBe(60000);

			// Status garasi otomatis menjadi USED karena tanggal mulai adalah hari ini
			const garasi = await garasiRepo.findById('C001');
			expect(garasi?.status).toBe('USED');
		});

		it('Menolak booking yang bertabrakan (anti-bentrok) dengan jadwal sewa yang sudah ada', async () => {
			expect.assertions(2);
			const user1 = await authService.registerPenyewa({
				nik: '3201012345670001',
				namaLengkap: 'Budi 1',
				noTelepon: '081234567891',
				email: 'budi1@test.com',
				password: 'password123'
			});
			const user2 = await authService.registerPenyewa({
				nik: '3201012345670002',
				namaLengkap: 'Budi 2',
				noTelepon: '081234567892',
				email: 'budi2@test.com',
				password: 'password123'
			});
			await authService.verifikasiPenyewa(user1.id, 'APPROVED');
			await authService.verifikasiPenyewa(user2.id, 'APPROVED');

			// User 1 sewa garasi C001 dari 21 Nov s.d. 26 Nov (+5 hari)
			await sewaService.buatSewaBaru({
				penyewaId: user1.id,
				garasiId: 'C001',
				tipeKendaraan: 'MOBIL',
				nomorPlat: 'DK 1111 AA',
				merekTipe: 'Innova',
				tipeSewa: 'HARIAN',
				jumlahHari: 5,
				tanggalMulai: todayFixed,
				buktiBayarPath: '/uploads/bukti1.png',
				referenceDateToday: todayFixed
			});

			// User 2 mencoba booking garasi C001 pada 23 Nov s.d. 27 Nov (bentrok)
			await expect(
				sewaService.buatSewaBaru({
					penyewaId: user2.id,
					garasiId: 'C001',
					tipeKendaraan: 'MOBIL',
					nomorPlat: 'DK 2222 BB',
					merekTipe: 'Fortuner',
					tipeSewa: 'HARIAN',
					jumlahHari: 4,
					tanggalMulai: createUtcDate(2026, 11, 23),
					buktiBayarPath: '/uploads/bukti2.png',
					referenceDateToday: todayFixed
				})
			).rejects.toThrow(/bentrok/i);

			// User 2 booking garasi C001 di luar tanggal bentrok (mulai 26 Nov) -> BERHASIL
			const sewa2 = await sewaService.buatSewaBaru({
				penyewaId: user2.id,
				garasiId: 'C001',
				tipeKendaraan: 'MOBIL',
				nomorPlat: 'DK 2222 BB',
				merekTipe: 'Fortuner',
				tipeSewa: 'HARIAN',
				jumlahHari: 3,
				tanggalMulai: createUtcDate(2026, 11, 26),
				buktiBayarPath: '/uploads/bukti2.png',
				referenceDateToday: todayFixed
			});
			expect(sewa2.id).toBeDefined();
		});

		it('Kendaraan TIDAK tersimpan ke repository jika transaksi sewa gagal akibat bentrok jadwal', async () => {
			expect.assertions(3);
			const user = await authService.registerPenyewa({
				nik: '3201012345670001',
				namaLengkap: 'Budi Santoso',
				noTelepon: '081234567890',
				email: 'budi@test.com',
				password: 'password123'
			});
			await authService.verifikasiPenyewa(user.id, 'APPROVED');

			// Sewa pertama: 21 Nov s.d. 26 Nov (+5 hari)
			await sewaService.buatSewaBaru({
				penyewaId: user.id,
				garasiId: 'C001',
				tipeKendaraan: 'MOBIL',
				nomorPlat: 'DK 1111 AA',
				merekTipe: 'Avanza',
				tipeSewa: 'HARIAN',
				jumlahHari: 5,
				tanggalMulai: todayFixed,
				buktiBayarPath: '/uploads/b1.png',
				referenceDateToday: todayFixed
			});
			expect(kendaraanRepo.kendaraans.length).toBe(1);

			// Transaksi sewa kedua mencoba booking tanggal yang bentrok (23 Nov s.d. 27 Nov) dengan data kendaraan baru
			await expect(
				sewaService.buatSewaBaru({
					penyewaId: user.id,
					garasiId: 'C001',
					tipeKendaraan: 'MOBIL',
					nomorPlat: 'DK 9999 ZZ',
					merekTipe: 'Xpander Baru',
					tipeSewa: 'HARIAN',
					jumlahHari: 4,
					tanggalMulai: createUtcDate(2026, 11, 23),
					buktiBayarPath: '/uploads/b2.png',
					referenceDateToday: todayFixed
				})
			).rejects.toThrow(/bentrok/i);

			// Pastikan kendaraan baru TIDAK pernah disimpan ke basis data (mencegah data sampah)
			expect(kendaraanRepo.kendaraans.length).toBe(1);
		});

		it('Proteksi IDOR: Menolak sewa jika kendaraanId yang diinput milik penyewa lain', async () => {
			expect.assertions(1);
			const user1 = await authService.registerPenyewa({
				nik: '3201012345670001',
				namaLengkap: 'Budi 1',
				noTelepon: '081234567891',
				email: 'budi1@test.com',
				password: 'password123'
			});
			const user2 = await authService.registerPenyewa({
				nik: '3201012345670002',
				namaLengkap: 'Budi 2',
				noTelepon: '081234567892',
				email: 'budi2@test.com',
				password: 'password123'
			});
			await authService.verifikasiPenyewa(user1.id, 'APPROVED');
			await authService.verifikasiPenyewa(user2.id, 'APPROVED');

			// User 1 mendaftarkan kendaraan miliknya
			const kendaraanUser1 = await kendaraanRepo.create({
				penyewaId: user1.id,
				tipeKendaraan: 'MOBIL',
				nomorPlat: 'DK 1111 AA',
				merekTipe: 'Honda Civic'
			});

			// User 2 mencoba menyewa dengan menyusupkan ID kendaraan milik User 1
			await expect(
				sewaService.buatSewaBaru({
					penyewaId: user2.id,
					garasiId: 'C001',
					kendaraanId: kendaraanUser1.id,
					tipeKendaraan: 'MOBIL',
					merekTipe: 'Honda Civic',
					tipeSewa: 'HARIAN',
					jumlahHari: 2,
					tanggalMulai: todayFixed,
					buktiBayarPath: '/uploads/b.png',
					referenceDateToday: todayFixed
				})
			).rejects.toThrow(/bukan milik penyewa terkait/i);
		});
	});

	// =========================================================================
	// 3. SEWA SERVICE TESTING (PERPANJANGAN SEWA OLEH ADMIN)
	// =========================================================================
	describe('SewaService - Perpanjangan Masa Sewa oleh Admin', () => {
		it('Admin berhasil memperpanjang sewa aktif dan mencatat riwayat perpanjangan', async () => {
			expect.assertions(6);
			const user = await authService.registerPenyewa({
				nik: '3201012345670001',
				namaLengkap: 'Budi Santoso',
				noTelepon: '081234567890',
				email: 'budi@test.com',
				password: 'password123'
			});
			await authService.verifikasiPenyewa(user.id, 'APPROVED');

			// Sewa harian awal: 21 Nov s.d. 24 Nov (3 hari * Rp 20.000 = Rp 60.000)
			const sewaAwal = await sewaService.buatSewaBaru({
				penyewaId: user.id,
				garasiId: 'C001',
				tipeKendaraan: 'MOBIL',
				nomorPlat: 'DK 1234 AB',
				merekTipe: 'Avanza',
				tipeSewa: 'HARIAN',
				jumlahHari: 3,
				tanggalMulai: todayFixed,
				buktiBayarPath: '/uploads/bukti.png',
				referenceDateToday: todayFixed
			});

			// Admin memperpanjang hingga 28 Nov (+4 hari * Rp 20.000 = Rp 80.000)
			const tglBaru = createUtcDate(2026, 11, 28);
			const hasil = await sewaService.perpanjangSewa({
				sewaId: sewaAwal.id,
				tanggalSelesaiBaru: tglBaru,
				buktiBayarPath: '/uploads/bukti_perpanjang.png'
			});

			expect(hasil.perpanjangan.tambahanHari).toBe(4);
			expect(hasil.perpanjangan.biayaTambahan).toBe(80000);
			// Total biaya sewa menjadi 60.000 + 80.000 = 140.000
			expect(hasil.sewa.totalBiaya).toBe(140000);
			expect(hasil.sewa.jumlahHari).toBe(7); // 3 + 4 hari terakumulasi
			expect(hasil.sewa.tanggalSelesai.toISOString()).toBe(tglBaru.toISOString());
			expect(sewaRepo.perpanjangans.length).toBe(1);
		});

		it('Menolak perpanjangan jika menabrak jadwal booking penyewa lain', async () => {
			expect.assertions(1);
			const user1 = await authService.registerPenyewa({
				nik: '3201012345670001',
				namaLengkap: 'Budi 1',
				noTelepon: '081234567891',
				email: 'budi1@test.com',
				password: 'password123'
			});
			const user2 = await authService.registerPenyewa({
				nik: '3201012345670002',
				namaLengkap: 'Budi 2',
				noTelepon: '081234567892',
				email: 'budi2@test.com',
				password: 'password123'
			});
			await authService.verifikasiPenyewa(user1.id, 'APPROVED');
			await authService.verifikasiPenyewa(user2.id, 'APPROVED');

			// User 1 sewa C001 dari 21 Nov s.d. 24 Nov
			const sewaUser1 = await sewaService.buatSewaBaru({
				penyewaId: user1.id,
				garasiId: 'C001',
				tipeKendaraan: 'MOBIL',
				nomorPlat: 'DK 1111 AA',
				merekTipe: 'Innova',
				tipeSewa: 'HARIAN',
				jumlahHari: 3,
				tanggalMulai: todayFixed,
				buktiBayarPath: '/uploads/bukti1.png',
				referenceDateToday: todayFixed
			});

			// User 2 sudah booking C001 dari 25 Nov s.d. 28 Nov
			await sewaService.buatSewaBaru({
				penyewaId: user2.id,
				garasiId: 'C001',
				tipeKendaraan: 'MOBIL',
				nomorPlat: 'DK 2222 BB',
				merekTipe: 'Fortuner',
				tipeSewa: 'HARIAN',
				jumlahHari: 3,
				tanggalMulai: createUtcDate(2026, 11, 25),
				buktiBayarPath: '/uploads/bukti2.png',
				referenceDateToday: todayFixed
			});

			// Admin mencoba memperpanjang sewa User 1 hingga 27 Nov (menabrak jadwal User 2)
			await expect(
				sewaService.perpanjangSewa({
					sewaId: sewaUser1.id,
					tanggalSelesaiBaru: createUtcDate(2026, 11, 27),
					buktiBayarPath: '/uploads/bukti_perpanjang.png'
				})
			).rejects.toThrow(/bentrok/i);
		});
	});

	// =========================================================================
	// 4. LAPORAN SERVICE & OPTIMASI N+1 GARASI SERVICE
	// =========================================================================
	describe('LaporanService & GarasiService Integration', () => {
		it('Agregasi laporan menghasilkan total omzet dan total transaksi yang tepat', async () => {
			expect.assertions(3);
			const user = await authService.registerPenyewa({
				nik: '3201012345670001',
				namaLengkap: 'Budi Santoso',
				noTelepon: '081234567890',
				email: 'budi@test.com',
				password: 'password123'
			});
			await authService.verifikasiPenyewa(user.id, 'APPROVED');

			// Transaksi 1: Sewa garasi sepeda (3 hari * Rp 5.000 = Rp 15.000)
			await sewaService.buatSewaBaru({
				penyewaId: user.id,
				garasiId: 'S001',
				tipeKendaraan: 'SEPEDA',
				nomorPlat: null,
				merekTipe: 'Polygon',
				tipeSewa: 'HARIAN',
				jumlahHari: 3,
				tanggalMulai: todayFixed,
				buktiBayarPath: '/uploads/b1.png',
				referenceDateToday: todayFixed
			});

			// Transaksi 2: Sewa garasi mobil (2 hari * Rp 20.000 = Rp 40.000)
			await sewaService.buatSewaBaru({
				penyewaId: user.id,
				garasiId: 'C001',
				tipeKendaraan: 'MOBIL',
				nomorPlat: 'DK 1234 AB',
				merekTipe: 'Brio',
				tipeSewa: 'HARIAN',
				jumlahHari: 2,
				tanggalMulai: todayFixed,
				buktiBayarPath: '/uploads/b2.png',
				referenceDateToday: todayFixed
			});

			// Laporan filter per tipe garasi MOBIL
			const laporanMobil = await laporanService.getLaporan({ tipeGarasi: 'MOBIL' });
			expect(laporanMobil.totalTransaksi).toBe(1);
			expect(laporanMobil.totalPendapatan).toBe(40000);

			// Laporan keseluruhan bulan ini
			const laporanBulanIni = await laporanService.getLaporan({});
			expect(laporanBulanIni.totalPendapatan).toBe(15000 + 40000);
		});

		it('GarasiService.getGarasiTersedia mengembalikan unit yang bebas bentrok tanpa query N+1', async () => {
			expect.assertions(2);
			const user = await authService.registerPenyewa({
				nik: '3201012345670001',
				namaLengkap: 'Budi Santoso',
				noTelepon: '081234567890',
				email: 'budi@test.com',
				password: 'password123'
			});
			await authService.verifikasiPenyewa(user.id, 'APPROVED');

			// Sewa C001 dari 21 Nov s.d. 25 Nov
			await sewaService.buatSewaBaru({
				penyewaId: user.id,
				garasiId: 'C001',
				tipeKendaraan: 'MOBIL',
				nomorPlat: 'DK 1234 AB',
				merekTipe: 'Avanza',
				tipeSewa: 'HARIAN',
				jumlahHari: 4,
				tanggalMulai: todayFixed,
				buktiBayarPath: '/uploads/b.png',
				referenceDateToday: todayFixed
			});

			// Cek ketersediaan mobil untuk rentang yang bertabrakan dengan C001 (hanya C002 yang tersedia)
			const garasiTersedia = await garasiService.getGarasiTersedia(
				'MOBIL',
				createUtcDate(2026, 11, 22),
				createUtcDate(2026, 11, 24)
			);

			expect(garasiTersedia.some((g) => g.id === 'C001')).toBe(false);
			expect(garasiTersedia.some((g) => g.id === 'C002')).toBe(true);
		});
	});
});
