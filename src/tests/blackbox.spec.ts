/**
 * Pengujian unit sistem penyewaan garasi GARASI TA dengan pendekatan Black-box Testing.
 * Menggunakan teknik Boundary Value Analysis (BVA) dan Equivalence Partitioning (EP)
 * untuk menguji nilai batas dan kelompok input aturan bisnis.
 *
 * @author Andrey Hartawan Suwardi
 * @version 1.0
 */

import { describe, expect, it } from 'vitest';
import {
	createUtcDate,
	diffDays,
	getDaysInMonth,
	normalizeToUtcDate
} from '../lib/utils/date';
import {
	GarasiModel,
	KendaraanModel,
	SewaModel,
	UserModel
} from '../lib/models';
import type { TipeGarasi, TipeKendaraan } from '../lib/models/types';

describe('Black-box Testing - Equivalence Partitioning & Boundary Value Analysis', () => {

	// =========================================================================
	// 1. VALIDASI NIK USER
	// Teknik: BVA (panjang digit: 15, 16, 17) & EP (karakter numerik vs non-numerik)
	// Aturan: Calon penyewa wajib mengisi NIK tepat 16 digit angka. Admin boleh null.
	// =========================================================================

	describe('UserModel - Validasi NIK Calon Penyewa', () => {
		it('BVA: Menolak NIK dengan panjang 15 digit (di bawah batas minimum)', () => {
			expect.assertions(1);
			expect(() => {
				new UserModel({
					nik: '123456789012345', // 15 digit
					namaLengkap: 'Budi Santoso',
					noTelepon: '081234567890',
					email: 'budi15@test.com',
					role: 'PENYEWA',
					statusVerifikasi: 'PENDING'
				});
			}).toThrow(/16 digit angka/i);
		});

		it('BVA: Menerima NIK tepat 16 digit angka (nilai batas valid)', () => {
			expect.assertions(2);
			const user = new UserModel({
				nik: '3201012345670001', // 16 digit tepat
				namaLengkap: 'Budi Santoso',
				noTelepon: '081234567890',
				email: 'budi16@test.com',
				role: 'PENYEWA',
				statusVerifikasi: 'PENDING'
			});
			expect(user.nik).toBe('3201012345670001');
			expect(user.statusVerifikasi).toBe('PENDING');
		});

		it('BVA: Menolak NIK dengan panjang 17 digit (di atas batas maksimum)', () => {
			expect.assertions(1);
			expect(() => {
				new UserModel({
					nik: '12345678901234567', // 17 digit
					namaLengkap: 'Budi Santoso',
					noTelepon: '081234567890',
					email: 'budi17@test.com',
					role: 'PENYEWA',
					statusVerifikasi: 'PENDING'
				});
			}).toThrow(/16 digit angka/i);
		});

		it('EP: Menolak NIK 16 karakter tetapi mengandung huruf/karakter non-numerik', () => {
			expect.assertions(1);
			expect(() => {
				new UserModel({
					nik: '320101234567000A', // 16 karakter non-numerik
					namaLengkap: 'Budi Santoso',
					noTelepon: '081234567890',
					email: 'budi_alpha@test.com',
					role: 'PENYEWA',
					statusVerifikasi: 'PENDING'
				});
			}).toThrow(/16 digit angka/i);
		});

		it('EP: Mengizinkan NIK bernilai null khusus untuk peran ADMIN', () => {
			expect.assertions(2);
			const admin = new UserModel({
				nik: null,
				namaLengkap: 'Super Administrator',
				noTelepon: '081234567890',
				email: 'admin@garasi.com',
				role: 'ADMIN',
				statusVerifikasi: 'APPROVED'
			});
			expect(admin.nik).toBeNull();
			expect(admin.role).toBe('ADMIN');
		});
	});

	// =========================================================================
	// 2. BATAS KAPASITAS KUMULATIF GARASI & FORMAT KODE 3 DIGIT
	// Teknik: BVA (nomor urut: 0, 1, 999, 1000) & EP (prefix S, C, E)
	// Aturan: Maksimal 999 unit per tipe garasi. Kode berformat 1 huruf + 3 digit.
	// =========================================================================
	describe('GarasiModel - Batas Kumulatif 999 Unit & Generator Kode 3 Digit', () => {
		it('BVA: Menerima pembuatan unit tepat mencapai kumulatif 999 (998 + 1 = 999)', () => {
			expect.assertions(1);
			expect(() => {
				GarasiModel.validasiPembuatanKelompok(998, 1);
			}).not.toThrow();
		});

		it('BVA: Menolak pembuatan unit yang menyebabkan kumulatif menjadi 1000 (998 + 2 = 1000)', () => {
			expect.assertions(1);
			expect(() => {
				GarasiModel.validasiPembuatanKelompok(998, 2);
			}).toThrow(/melebihi batas maksimal 999/i);
		});

		it('BVA: Menolak penambahan dengan jumlahBaru = 0 (nilai batas bawah tidak valid)', () => {
			expect.assertions(1);
			expect(() => {
				GarasiModel.validasiPembuatanKelompok(10, 0);
			}).toThrow(/minimal 1/i);
		});

		it('BVA: Menolak penambahan dengan jumlahBaru negatif', () => {
			expect.assertions(1);
			expect(() => {
				GarasiModel.validasiPembuatanKelompok(10, -5);
			}).toThrow(/minimal 1/i);
		});

		it('EP & BVA: Menghasilkan kode garasi 3 digit terformat (1 -> S001, 10 -> C010, 999 -> E999)', () => {
			expect.assertions(3);
			expect(GarasiModel.generateKode('SEPEDA', 1)).toBe('S001');
			expect(GarasiModel.generateKode('MOBIL', 10)).toBe('C010');
			expect(GarasiModel.generateKode('MOBIL_LISTRIK', 999)).toBe('E999');
		});

		it('BVA: Menolak pembuatan nomor urut 1000 pada generateKode', () => {
			expect.assertions(1);
			expect(() => {
				GarasiModel.generateKode('MOBIL', 1000);
			}).toThrow(/antara 1 dan 999/i);
		});
	});

	// =========================================================================
	// 3. MATRIKS KECOCOKAN KENDARAAN VS TIPE GARASI
	// Teknik: Equivalence Partitioning (EP)
	// Aturan:
	// - Sepeda & Motor hanya boleh di garasi SEPEDA.
	// - Mobil konvensional hanya boleh di garasi MOBIL.
	// - Mobil listrik (EV) boleh di garasi MOBIL atau MOBIL_LISTRIK.
	// =========================================================================
	describe('KendaraanModel & GarasiModel - Matriks Kompatibilitas', () => {
		const garasiSepeda = new GarasiModel({
			id: 'S001',
			tipeGarasi: 'SEPEDA',
			nomorUrut: 1,
			hargaHarian: 5000,
			hargaListrikPerKwh: null,
			status: 'AVAILABLE'
		});

		const garasiMobil = new GarasiModel({
			id: 'C001',
			tipeGarasi: 'MOBIL',
			nomorUrut: 1,
			hargaHarian: 20000,
			hargaListrikPerKwh: null,
			status: 'AVAILABLE'
		});

		const garasiListrik = new GarasiModel({
			id: 'E001',
			tipeGarasi: 'MOBIL_LISTRIK',
			nomorUrut: 1,
			hargaHarian: 35000,
			hargaListrikPerKwh: 2500,
			status: 'AVAILABLE'
		});

		it('EP Matriks: SEPEDA hanya kompatibel dengan garasi SEPEDA', () => {
			expect.assertions(3);
			const sepeda = new KendaraanModel({
				penyewaId: 1,
				tipeKendaraan: 'SEPEDA',
				nomorPlat: null,
				merekTipe: 'Polygon Heist'
			});

			expect(sepeda.bisaMasukGarasi('SEPEDA')).toBe(true);
			expect(sepeda.bisaMasukGarasi('MOBIL')).toBe(false);
			expect(sepeda.bisaMasukGarasi('MOBIL_LISTRIK')).toBe(false);
		});

		it('EP Matriks: SEPEDA_MOTOR hanya kompatibel dengan garasi SEPEDA', () => {
			expect.assertions(3);
			const motor = new KendaraanModel({
				penyewaId: 1,
				tipeKendaraan: 'SEPEDA_MOTOR',
				nomorPlat: 'DK 1234 AB',
				merekTipe: 'Honda Vario 160'
			});

			expect(motor.bisaMasukGarasi('SEPEDA')).toBe(true);
			expect(motor.bisaMasukGarasi('MOBIL')).toBe(false);
			expect(motor.bisaMasukGarasi('MOBIL_LISTRIK')).toBe(false);
		});

		it('EP Matriks: MOBIL konvensional hanya kompatibel dengan garasi MOBIL', () => {
			expect.assertions(3);
			const mobil = new KendaraanModel({
				penyewaId: 1,
				tipeKendaraan: 'MOBIL',
				nomorPlat: 'DK 5678 CD',
				merekTipe: 'Toyota Avanza'
			});

			expect(mobil.bisaMasukGarasi('SEPEDA')).toBe(false);
			expect(mobil.bisaMasukGarasi('MOBIL')).toBe(true);
			expect(mobil.bisaMasukGarasi('MOBIL_LISTRIK')).toBe(false);
		});

		it('EP Matriks: MOBIL_LISTRIK kompatibel dengan garasi MOBIL dan MOBIL_LISTRIK', () => {
			expect.assertions(3);
			const molis = new KendaraanModel({
				penyewaId: 1,
				tipeKendaraan: 'MOBIL_LISTRIK',
				nomorPlat: 'DK 9999 EV',
				merekTipe: 'Hyundai Ioniq 5',
				kapasitasBateraiKwh: 72.6
			});

			expect(molis.bisaMasukGarasi('SEPEDA')).toBe(false);
			expect(molis.bisaMasukGarasi('MOBIL')).toBe(true);
			expect(molis.bisaMasukGarasi('MOBIL_LISTRIK')).toBe(true);
		});
	});

	// =========================================================================
	// 4. VALIDASI PLAT NOMOR & BATAS BATERAI MOBIL LISTRIK
	// Teknik: EP (sepeda tanpa plat vs kendaraan bermotor wajib plat) & BVA (kapasitas baterai)
	// Aturan: Mobil listrik wajib isi kapasitas baterai > 0 dan sisa baterai tidak boleh melebihi kapasitas.
	// =========================================================================
	describe('KendaraanModel - Validasi Plat Nomor & Batas Baterai Molis', () => {
		it('EP: SEPEDA boleh tanpa plat nomor (otomatis null)', () => {
			expect.assertions(2);
			const sepeda = new KendaraanModel({
				penyewaId: 1,
				tipeKendaraan: 'SEPEDA',
				nomorPlat: '',
				merekTipe: 'United Mountain Bike'
			});
			expect(sepeda.nomorPlat).toBeNull();
			expect(sepeda.kapasitasBateraiKwh).toBeNull();
		});

		it('EP: SEPEDA_MOTOR, MOBIL, dan MOBIL_LISTRIK wajib mengisi plat nomor', () => {
			expect.assertions(2);
			expect(() => {
				new KendaraanModel({
					penyewaId: 1,
					tipeKendaraan: 'SEPEDA_MOTOR',
					nomorPlat: '', // kosong tidak boleh
					merekTipe: 'Yamaha NMAX'
				});
			}).toThrow(/nomor plat kendaraan wajib diisi/i);

			expect(() => {
				new KendaraanModel({
					penyewaId: 1,
					tipeKendaraan: 'MOBIL',
					nomorPlat: null, // null tidak boleh
					merekTipe: 'Honda Brio'
				});
			}).toThrow(/nomor plat kendaraan wajib diisi/i);
		});

		it('BVA Baterai: Menolak kapasitas baterai <= 0 untuk MOBIL_LISTRIK', () => {
			expect.assertions(2);
			expect(() => {
				new KendaraanModel({
					penyewaId: 1,
					tipeKendaraan: 'MOBIL_LISTRIK',
					nomorPlat: 'B 1234 EV',
					merekTipe: 'Wuling Air EV',
					kapasitasBateraiKwh: 0 // 0 tidak valid
				});
			}).toThrow(/kapasitas baterai penuh.*positif/i);

			expect(() => {
				new KendaraanModel({
					penyewaId: 1,
					tipeKendaraan: 'MOBIL_LISTRIK',
					nomorPlat: 'B 1234 EV',
					merekTipe: 'Wuling Air EV',
					kapasitasBateraiKwh: -10 // negatif tidak valid
				});
			}).toThrow(/kapasitas baterai penuh.*positif/i);
		});

		it('BVA Baterai Sewa: Menolak sisa baterai < 0 atau sisa baterai > kapasitas', () => {
			expect.assertions(2);
			expect(() => {
				SewaModel.hitungBiayaListrik('MOBIL_LISTRIK', 'MOBIL_LISTRIK', 50, -5, 2500);
			}).toThrow(/tidak boleh negatif/i);

			expect(() => {
				SewaModel.hitungBiayaListrik('MOBIL_LISTRIK', 'MOBIL_LISTRIK', 50, 55, 2500);
			}).toThrow(/tidak boleh melebihi kapasitas/i);
		});
	});

	// =========================================================================
	// 5. BATAS DURASI SEWA HARIAN PER BULAN KALENDER (TERMASUK KABISAT)
	// Teknik: Boundary Value Analysis (BVA)
	// Aturan: Durasi sewa harian dibatasi maksimal (jumlah hari bulan berjalan - 1).
	// Jika durasi mencapai 1 bulan penuh, penyewa diarahkan memakai paket tarif bulanan.
	// =========================================================================
	describe('SewaModel - Batas Durasi Sewa Harian per Bulan Dinamis', () => {
		it('BVA Februari 2026 (non-kabisat, 28 hari): 27 valid, 28 gagal (wajib bulanan), 0 gagal', () => {
			expect.assertions(4);
			const tglFeb2026 = createUtcDate(2026, 2, 1);
			const days = getDaysInMonth(tglFeb2026);
			expect(days).toBe(28);

			// 27 hari valid
			const sewaValid = SewaModel.buatSewaBaru({
				penyewaId: 1,
				garasiId: 'C001',
				kendaraanId: 1,
				tipeSewa: 'HARIAN',
				jumlahHari: 27,
				tanggalMulai: tglFeb2026,
				hargaHarian: 10000,
				tipeGarasi: 'MOBIL',
				tipeKendaraan: 'MOBIL',
				buktiBayarPath: '/uploads/bukti.png',
				referenceDateToday: tglFeb2026
			});
			expect(sewaValid.jumlahHari).toBe(27);

			// 28 hari gagal untuk harian (harus sewa bulanan)
			expect(() => {
				SewaModel.buatSewaBaru({
					penyewaId: 1,
					garasiId: 'C001',
					kendaraanId: 1,
					tipeSewa: 'HARIAN',
					jumlahHari: 28,
					tanggalMulai: tglFeb2026,
					hargaHarian: 10000,
					tipeGarasi: 'MOBIL',
					tipeKendaraan: 'MOBIL',
					buktiBayarPath: '/uploads/bukti.png',
					referenceDateToday: tglFeb2026
				});
			}).toThrow(/antara 1 dan 27 hari/i);

			// 0 hari gagal
			expect(() => {
				SewaModel.buatSewaBaru({
					penyewaId: 1,
					garasiId: 'C001',
					kendaraanId: 1,
					tipeSewa: 'HARIAN',
					jumlahHari: 0,
					tanggalMulai: tglFeb2026,
					hargaHarian: 10000,
					tipeGarasi: 'MOBIL',
					tipeKendaraan: 'MOBIL',
					buktiBayarPath: '/uploads/bukti.png',
					referenceDateToday: tglFeb2026
				});
			}).toThrow(/antara 1 dan 27 hari/i);
		});

		it('BVA Februari 2028 (kabisat, 29 hari): 28 valid, 29 gagal, 30 gagal', () => {
			expect.assertions(3);
			const tglFeb2028 = createUtcDate(2028, 2, 1);
			const days = getDaysInMonth(tglFeb2028);
			expect(days).toBe(29);

			// 28 hari valid
			const sewaValid = SewaModel.buatSewaBaru({
				penyewaId: 1,
				garasiId: 'C001',
				kendaraanId: 1,
				tipeSewa: 'HARIAN',
				jumlahHari: 28,
				tanggalMulai: tglFeb2028,
				hargaHarian: 10000,
				tipeGarasi: 'MOBIL',
				tipeKendaraan: 'MOBIL',
				buktiBayarPath: '/uploads/bukti.png',
				referenceDateToday: tglFeb2028
			});
			expect(sewaValid.jumlahHari).toBe(28);

			// 29 hari gagal untuk harian
			expect(() => {
				SewaModel.buatSewaBaru({
					penyewaId: 1,
					garasiId: 'C001',
					kendaraanId: 1,
					tipeSewa: 'HARIAN',
					jumlahHari: 29,
					tanggalMulai: tglFeb2028,
					hargaHarian: 10000,
					tipeGarasi: 'MOBIL',
					tipeKendaraan: 'MOBIL',
					buktiBayarPath: '/uploads/bukti.png',
					referenceDateToday: tglFeb2028
				});
			}).toThrow(/antara 1 dan 28 hari/i);
		});

		it('BVA November 2026 (30 hari): 29 valid, 30 gagal, 31 gagal', () => {
			expect.assertions(3);
			const tglNov2026 = createUtcDate(2026, 11, 1);
			expect(getDaysInMonth(tglNov2026)).toBe(30);

			// 29 hari valid
			const sewa = SewaModel.buatSewaBaru({
				penyewaId: 1,
				garasiId: 'C001',
				kendaraanId: 1,
				tipeSewa: 'HARIAN',
				jumlahHari: 29,
				tanggalMulai: tglNov2026,
				hargaHarian: 10000,
				tipeGarasi: 'MOBIL',
				tipeKendaraan: 'MOBIL',
				buktiBayarPath: '/uploads/bukti.png',
				referenceDateToday: tglNov2026
			});
			expect(sewa.jumlahHari).toBe(29);

			// 30 hari gagal untuk harian
			expect(() => {
				SewaModel.buatSewaBaru({
					penyewaId: 1,
					garasiId: 'C001',
					kendaraanId: 1,
					tipeSewa: 'HARIAN',
					jumlahHari: 30,
					tanggalMulai: tglNov2026,
					hargaHarian: 10000,
					tipeGarasi: 'MOBIL',
					tipeKendaraan: 'MOBIL',
					buktiBayarPath: '/uploads/bukti.png',
					referenceDateToday: tglNov2026
				});
			}).toThrow(/antara 1 dan 29 hari/i);
		});

		it('BVA Desember 2026 (31 hari): 30 valid, 31 gagal', () => {
			expect.assertions(3);
			const tglDes2026 = createUtcDate(2026, 12, 1);
			expect(getDaysInMonth(tglDes2026)).toBe(31);

			// 30 hari valid
			const sewa = SewaModel.buatSewaBaru({
				penyewaId: 1,
				garasiId: 'C001',
				kendaraanId: 1,
				tipeSewa: 'HARIAN',
				jumlahHari: 30,
				tanggalMulai: tglDes2026,
				hargaHarian: 10000,
				tipeGarasi: 'MOBIL',
				tipeKendaraan: 'MOBIL',
				buktiBayarPath: '/uploads/bukti.png',
				referenceDateToday: tglDes2026
			});
			expect(sewa.jumlahHari).toBe(30);

			// 31 hari gagal untuk harian
			expect(() => {
				SewaModel.buatSewaBaru({
					penyewaId: 1,
					garasiId: 'C001',
					kendaraanId: 1,
					tipeSewa: 'HARIAN',
					jumlahHari: 31,
					tanggalMulai: tglDes2026,
					hargaHarian: 10000,
					tipeGarasi: 'MOBIL',
					tipeKendaraan: 'MOBIL',
					buktiBayarPath: '/uploads/bukti.png',
					referenceDateToday: tglDes2026
				});
			}).toThrow(/antara 1 dan 30 hari/i);
		});
	});

	// =========================================================================
	// 6. VALIDASI TANGGAL MULAI SEWA
	// Teknik: Boundary Value Analysis (BVA: kemarin, hari ini, masa depan)
	// Aturan: Tanggal kemarin dilarang (masa lalu). Hari ini dan masa depan diperbolehkan.
	// =========================================================================
	describe('SewaModel - Validasi Tanggal Mulai Sewa', () => {
		const todayFixed = createUtcDate(2026, 11, 21);

		it('BVA: Menolak tanggal mulai sewa kemarin (tanggal masa lalu)', () => {
			expect.assertions(1);
			const yesterday = createUtcDate(2026, 11, 20);
			expect(() => {
				SewaModel.buatSewaBaru({
					penyewaId: 1,
					garasiId: 'C001',
					kendaraanId: 1,
					tipeSewa: 'HARIAN',
					jumlahHari: 3,
					tanggalMulai: yesterday,
					hargaHarian: 10000,
					tipeGarasi: 'MOBIL',
					tipeKendaraan: 'MOBIL',
					buktiBayarPath: '/uploads/bukti.png',
					referenceDateToday: todayFixed
				});
			}).toThrow(/dilarang memilih tanggal kemarin/i);
		});

		it('BVA: Menerima tanggal mulai sewa hari ini', () => {
			expect.assertions(2);
			const sewa = SewaModel.buatSewaBaru({
				penyewaId: 1,
				garasiId: 'C001',
				kendaraanId: 1,
				tipeSewa: 'HARIAN',
				jumlahHari: 3,
				tanggalMulai: todayFixed,
				hargaHarian: 10000,
				tipeGarasi: 'MOBIL',
				tipeKendaraan: 'MOBIL',
				buktiBayarPath: '/uploads/bukti.png',
				referenceDateToday: todayFixed
			});
			expect(sewa.tanggalMulai.toISOString()).toBe(todayFixed.toISOString());
			expect(sewa.jumlahHari).toBe(3);
		});

		it('BVA: Menerima tanggal mulai sewa di masa depan (booking minggu depan)', () => {
			expect.assertions(2);
			const nextWeek = createUtcDate(2026, 11, 28);
			const sewa = SewaModel.buatSewaBaru({
				penyewaId: 1,
				garasiId: 'C001',
				kendaraanId: 1,
				tipeSewa: 'HARIAN',
				jumlahHari: 2,
				tanggalMulai: nextWeek,
				hargaHarian: 10000,
				tipeGarasi: 'MOBIL',
				tipeKendaraan: 'MOBIL',
				buktiBayarPath: '/uploads/bukti.png',
				referenceDateToday: todayFixed
			});
			expect(sewa.tanggalMulai.toISOString()).toBe(nextWeek.toISOString());
			expect(sewa.jumlahHari).toBe(2);
		});
	});

	// =========================================================================
	// 7. KALKULASI TARIF SEWA, BIAYA LISTRIK, DAN TOTAL PEMBAYARAN
	// Teknik: EP (pengujian nilai eksak sesuai rumus bisnis murni)
	// Aturan:
	// - Harian: jumlah hari x tarif harian
	// - Bulanan: diskon flat 25x tarif harian
	// - Listrik EV: (kapasitas penuh - sisa baterai) x tarif listrik per kWh
	// =========================================================================
	describe('SewaModel - Angka Eksak Biaya Murni Tanpa Biaya Tersembunyi', () => {
		it('Eksak: Sewa harian 3 hari * Rp 10.000 = tepat Rp 30.000', () => {
			expect.assertions(3);
			const biayaSewa = SewaModel.hitungBiayaSewa('HARIAN', 3, 10000);
			const totalBiaya = SewaModel.hitungTotalBiaya(biayaSewa, 0);

			expect(biayaSewa).toBe(30000);
			expect(totalBiaya).toBe(30000);
			expect(totalBiaya).toEqual(3 * 10000);
		});

		it('Eksak: Sewa bulanan (tarif 25x) * Rp 10.000 = tepat Rp 250.000', () => {
			expect.assertions(3);
			const biayaSewa = SewaModel.hitungBiayaSewa('BULANAN', 30, 10000);
			const totalBiaya = SewaModel.hitungTotalBiaya(biayaSewa, 0);

			expect(biayaSewa).toBe(250000);
			expect(totalBiaya).toBe(250000);
			expect(totalBiaya).toEqual(25 * 10000);
		});

		it('Eksak: Mobil Listrik cas penuh (50 kWh - 5 kWh = 45 kWh) * Rp 2.500 = tepat Rp 112.500', () => {
			expect.assertions(2);
			const biayaListrik = SewaModel.hitungBiayaListrik(
				'MOBIL_LISTRIK',
				'MOBIL_LISTRIK',
				50,
				5,
				2500
			);
			expect(biayaListrik).toBe(112500);
			expect(biayaListrik).toEqual((50 - 5) * 2500);
		});

		it('Eksak: Total biaya sewa bulanan + listrik = tepat Rp 250.000 + Rp 112.500 = Rp 362.500 murni', () => {
			expect.assertions(4);
			const sewa = SewaModel.buatSewaBaru({
				penyewaId: 1,
				garasiId: 'E001',
				kendaraanId: 1,
				tipeSewa: 'BULANAN',
				tanggalMulai: createUtcDate(2026, 11, 1),
				hargaHarian: 10000,
				tipeGarasi: 'MOBIL_LISTRIK',
				tipeKendaraan: 'MOBIL_LISTRIK',
				kapasitasBateraiKwh: 50,
				sisaBateraiKwh: 5,
				hargaListrikPerKwh: 2500,
				buktiBayarPath: '/uploads/bukti_lunas.jpg',
				referenceDateToday: createUtcDate(2026, 11, 1)
			});

			expect(sewa.biayaSewa).toBe(250000);
			expect(sewa.biayaListrik).toBe(112500);
			expect(sewa.totalBiaya).toBe(362500);
			expect(sewa.totalBiaya).toBe(sewa.biayaSewa + sewa.biayaListrik);
		});

		it('Eksak: Biaya perpanjangan sewa 5 hari * Rp 10.000 = tepat positif Rp 50.000', () => {
			expect.assertions(4);
			const tglLama = createUtcDate(2026, 11, 10);
			const tglBaru = createUtcDate(2026, 11, 15);
			const hasil = SewaModel.hitungBiayaPerpanjangan(tglLama, tglBaru, 10000);

			expect(hasil.tambahanHari).toBe(5);
			expect(hasil.jumlahBulan).toBe(0);
			expect(hasil.sisaHari).toBe(5);
			expect(hasil.biayaTambahan).toBe(50000);
		});
	});
});
