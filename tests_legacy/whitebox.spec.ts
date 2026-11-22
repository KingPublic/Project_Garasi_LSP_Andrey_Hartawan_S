/**
 * @file whitebox.spec.ts
 * @description Pengujian Unit White-box Testing berbasis Statement, Branch & Path Coverage
 * untuk seluruh logika internal bisnis sistem penyewaan garasi LSP Pemrogram.
 */

import { describe, expect, it } from 'vitest';
import {
	addDays,
	createUtcDate,
	diffDays,
	formatDateIso,
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

describe('White-box Testing - Branch & Path Coverage', () => {
	// =========================================================================
	// 1. GENERATOR ID & PERCABANGAN TIPE GARASI
	// =========================================================================
	describe('GarasiModel - Branch Coverage Generator ID', () => {
		it('Branch: Menghasilkan prefix "S" untuk tipe garasi SEPEDA', () => {
			expect.assertions(2);
			expect(GarasiModel.getPrefix('SEPEDA')).toBe('S');
			expect(GarasiModel.generateKode('SEPEDA', 5)).toBe('S005');
		});

		it('Branch: Menghasilkan prefix "C" untuk tipe garasi MOBIL', () => {
			expect.assertions(2);
			expect(GarasiModel.getPrefix('MOBIL')).toBe('C');
			expect(GarasiModel.generateKode('MOBIL', 42)).toBe('C042');
		});

		it('Branch: Menghasilkan prefix "E" untuk tipe garasi MOBIL_LISTRIK', () => {
			expect.assertions(2);
			expect(GarasiModel.getPrefix('MOBIL_LISTRIK')).toBe('E');
			expect(GarasiModel.generateKode('MOBIL_LISTRIK', 123)).toBe('E123');
		});

		it('Branch: Melemparkan error jika tipe garasi tidak dikenal pada getPrefix', () => {
			expect.assertions(1);
			expect(() => {
				// @ts-expect-error Pengujian cabang tipe tidak valid
				GarasiModel.getPrefix('TRUK');
			}).toThrow(/tidak dikenal/i);
		});

		it('Branch: Melemparkan error jika nomor urut bukan integer atau < 1', () => {
			expect.assertions(2);
			expect(() => {
				GarasiModel.generateKode('SEPEDA', 0);
			}).toThrow(/antara 1 dan 999/i);

			expect(() => {
				GarasiModel.generateKode('SEPEDA', 1.5);
			}).toThrow(/antara 1 dan 999/i);
		});

		it('Branch & Path: Pembuatan kelompok garasi (generateKelompok)', () => {
			expect.assertions(5);
			const units = GarasiModel.generateKelompok('MOBIL', 0, 3, 20000);
			expect(units.length).toBe(3);
			expect(units[0].id).toBe('C001');
			expect(units[1].id).toBe('C002');
			expect(units[2].id).toBe('C003');
			expect(units[0].status).toBe('AVAILABLE');
		});

		it('Branch: Garasi tipe MOBIL_LISTRIK wajib menyertakan tarif listrik > 0 pada generateKelompok', () => {
			expect.assertions(2);
			expect(() => {
				GarasiModel.generateKelompok('MOBIL_LISTRIK', 0, 2, 30000, 0);
			}).toThrow(/tarif listrik per kwh wajib diisi/i);

			expect(() => {
				GarasiModel.generateKelompok('MOBIL_LISTRIK', 0, 2, 30000, null);
			}).toThrow(/tarif listrik per kwh wajib diisi/i);
		});
	});

	// =========================================================================
	// 2. MATRIKS 12 KOMBINASI PERCABANGAN (4 TIPE KENDARAAN X 3 TIPE GARASI)
	// =========================================================================
	describe('GarasiModel & KendaraanModel - 12 Kombinasi Percabangan Kompatibilitas', () => {
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

		// 1. SEPEDA (3 cabang)
		it('Path 1-3: Kendaraan SEPEDA terhadap Garasi (SEPEDA=T, MOBIL=F, MOBIL_LISTRIK=F)', () => {
			expect.assertions(3);
			expect(garasiSepeda.cocokDenganKendaraan('SEPEDA')).toBe(true);
			expect(garasiMobil.cocokDenganKendaraan('SEPEDA')).toBe(false);
			expect(garasiListrik.cocokDenganKendaraan('SEPEDA')).toBe(false);
		});

		// 2. SEPEDA_MOTOR (3 cabang)
		it('Path 4-6: Kendaraan SEPEDA_MOTOR terhadap Garasi (SEPEDA=T, MOBIL=F, MOBIL_LISTRIK=F)', () => {
			expect.assertions(3);
			expect(garasiSepeda.cocokDenganKendaraan('SEPEDA_MOTOR')).toBe(true);
			expect(garasiMobil.cocokDenganKendaraan('SEPEDA_MOTOR')).toBe(false);
			expect(garasiListrik.cocokDenganKendaraan('SEPEDA_MOTOR')).toBe(false);
		});

		// 3. MOBIL (3 cabang)
		it('Path 7-9: Kendaraan MOBIL terhadap Garasi (SEPEDA=F, MOBIL=T, MOBIL_LISTRIK=F)', () => {
			expect.assertions(3);
			expect(garasiSepeda.cocokDenganKendaraan('MOBIL')).toBe(false);
			expect(garasiMobil.cocokDenganKendaraan('MOBIL')).toBe(true);
			expect(garasiListrik.cocokDenganKendaraan('MOBIL')).toBe(false);
		});

		// 4. MOBIL_LISTRIK (3 cabang)
		it('Path 10-12: Kendaraan MOBIL_LISTRIK terhadap Garasi (SEPEDA=F, MOBIL=T, MOBIL_LISTRIK=T)', () => {
			expect.assertions(3);
			expect(garasiSepeda.cocokDenganKendaraan('MOBIL_LISTRIK')).toBe(false);
			expect(garasiMobil.cocokDenganKendaraan('MOBIL_LISTRIK')).toBe(true);
			expect(garasiListrik.cocokDenganKendaraan('MOBIL_LISTRIK')).toBe(true);
		});

		it('Branch: Tipe kendaraan tidak dikenal pada cocokDenganKendaraan menghasilkan false', () => {
			expect.assertions(1);
			// @ts-expect-error Uji tipe abnormal
			expect(garasiMobil.cocokDenganKendaraan('PESAWAT')).toBe(false);
		});
	});

	// =========================================================================
	// 3. PERCABANGAN HITUNG BIAYA LISTRIK
	// =========================================================================
	describe('SewaModel - Branch Coverage hitungBiayaListrik', () => {
		it('Branch: Bukan garasi listrik (garasi MOBIL biasa) menghasilkan biayaListrik = 0', () => {
			expect.assertions(1);
			const biaya = SewaModel.hitungBiayaListrik('MOBIL_LISTRIK', 'MOBIL', 50, 10, 2500);
			expect(biaya).toBe(0);
		});

		it('Branch: Bukan kendaraan listrik (tipe MOBIL) di garasi listrik menghasilkan biayaListrik = 0', () => {
			expect.assertions(1);
			const biaya = SewaModel.hitungBiayaListrik('MOBIL', 'MOBIL_LISTRIK', 50, 10, 2500);
			expect(biaya).toBe(0);
		});

		it('Branch: Baterai saat masuk = 0 (kosong total) menghitung cas kapasitas penuh', () => {
			expect.assertions(1);
			const biaya = SewaModel.hitungBiayaListrik('MOBIL_LISTRIK', 'MOBIL_LISTRIK', 60, 0, 2000);
			expect(biaya).toBe(120000); // 60 * 2000
		});

		it('Branch: Baterai saat masuk = kapasitas (sudah 100% penuh) menghasilkan biayaListrik = 0', () => {
			expect.assertions(1);
			const biaya = SewaModel.hitungBiayaListrik('MOBIL_LISTRIK', 'MOBIL_LISTRIK', 60, 60, 2000);
			expect(biaya).toBe(0);
		});

		it('Branch: Tarif listrik per kWh bernilai null atau 0 menghasilkan biayaListrik = 0', () => {
			expect.assertions(2);
			expect(SewaModel.hitungBiayaListrik('MOBIL_LISTRIK', 'MOBIL_LISTRIK', 60, 20, null)).toBe(0);
			expect(SewaModel.hitungBiayaListrik('MOBIL_LISTRIK', 'MOBIL_LISTRIK', 60, 20, 0)).toBe(0);
		});

		it('Branch: Melemparkan error jika kapasitas baterai <= 0', () => {
			expect.assertions(1);
			expect(() => {
				SewaModel.hitungBiayaListrik('MOBIL_LISTRIK', 'MOBIL_LISTRIK', 0, 0, 2000);
			}).toThrow(/kapasitas baterai penuh.*positif/i);
		});

		it('Branch: Melemparkan error jika sisa baterai < 0', () => {
			expect.assertions(1);
			expect(() => {
				SewaModel.hitungBiayaListrik('MOBIL_LISTRIK', 'MOBIL_LISTRIK', 50, -1, 2000);
			}).toThrow(/tidak boleh negatif/i);
		});

		it('Branch: Melemparkan error jika sisa baterai > kapasitas baterai', () => {
			expect.assertions(1);
			expect(() => {
				SewaModel.hitungBiayaListrik('MOBIL_LISTRIK', 'MOBIL_LISTRIK', 50, 50.1, 2000);
			}).toThrow(/tidak boleh melebihi kapasitas penuh/i);
		});
	});

	// =========================================================================
	// 4. LOGIKA ANTI-BENTROK JADWAL (ANTI-OVERLAP) & BATAS BERSINGGUNGAN
	// =========================================================================
	describe('SewaModel - Path Coverage Anti-Bentrok Jadwal (cekBentrokJadwal)', () => {
		// Target Jadwal B: 5 Nov 2026 s.d. 10 Nov 2026
		const tglMulaiB = createUtcDate(2026, 11, 5);
		const tglSelesaiB = createUtcDate(2026, 11, 10);

		it('Path 1: Jadwal A berakhir sebelum B dimulai ([1, 4] vs [5, 10]) -> TIDAK BENTROK', () => {
			expect.assertions(1);
			const mA = createUtcDate(2026, 11, 1);
			const sA = createUtcDate(2026, 11, 4);
			expect(SewaModel.cekBentrokJadwal(mA, sA, tglMulaiB, tglSelesaiB)).toBe(false);
		});

		it('Path 2: Batas persis bersinggungan di awal ([1, 5] vs [5, 10]) -> TIDAK BENTROK', () => {
			expect.assertions(1);
			const mA = createUtcDate(2026, 11, 1);
			const sA = createUtcDate(2026, 11, 5); // sA === mB
			expect(SewaModel.cekBentrokJadwal(mA, sA, tglMulaiB, tglSelesaiB)).toBe(false);
		});

		it('Path 3: Overlap sebagian di awal / irisan kiri ([3, 7] vs [5, 10]) -> BENTROK', () => {
			expect.assertions(1);
			const mA = createUtcDate(2026, 11, 3);
			const sA = createUtcDate(2026, 11, 7);
			expect(SewaModel.cekBentrokJadwal(mA, sA, tglMulaiB, tglSelesaiB)).toBe(true);
		});

		it('Path 4: Jadwal A identik dengan Jadwal B ([5, 10] vs [5, 10]) -> BENTROK', () => {
			expect.assertions(1);
			const mA = createUtcDate(2026, 11, 5);
			const sA = createUtcDate(2026, 11, 10);
			expect(SewaModel.cekBentrokJadwal(mA, sA, tglMulaiB, tglSelesaiB)).toBe(true);
		});

		it('Path 5: Jadwal A berada sepenuhnya di dalam B ([6, 8] vs [5, 10]) -> BENTROK', () => {
			expect.assertions(1);
			const mA = createUtcDate(2026, 11, 6);
			const sA = createUtcDate(2026, 11, 8);
			expect(SewaModel.cekBentrokJadwal(mA, sA, tglMulaiB, tglSelesaiB)).toBe(true);
		});

		it('Path 6: Jadwal A melingkupi sepenuhnya Jadwal B ([3, 12] vs [5, 10]) -> BENTROK', () => {
			expect.assertions(1);
			const mA = createUtcDate(2026, 11, 3);
			const sA = createUtcDate(2026, 11, 12);
			expect(SewaModel.cekBentrokJadwal(mA, sA, tglMulaiB, tglSelesaiB)).toBe(true);
		});

		it('Path 7: Overlap sebagian di akhir / irisan kanan ([8, 12] vs [5, 10]) -> BENTROK', () => {
			expect.assertions(1);
			const mA = createUtcDate(2026, 11, 8);
			const sA = createUtcDate(2026, 11, 12);
			expect(SewaModel.cekBentrokJadwal(mA, sA, tglMulaiB, tglSelesaiB)).toBe(true);
		});

		it('Path 8: Batas persis bersinggungan di akhir ([10, 15] vs [5, 10]) -> TIDAK BENTROK', () => {
			expect.assertions(1);
			const mA = createUtcDate(2026, 11, 10); // mA === sB
			const sA = createUtcDate(2026, 11, 15);
			expect(SewaModel.cekBentrokJadwal(mA, sA, tglMulaiB, tglSelesaiB)).toBe(false);
		});

		it('Path 9: Jadwal A dimulai setelah B selesai ([11, 15] vs [5, 10]) -> TIDAK BENTROK', () => {
			expect.assertions(1);
			const mA = createUtcDate(2026, 11, 11);
			const sA = createUtcDate(2026, 11, 15);
			expect(SewaModel.cekBentrokJadwal(mA, sA, tglMulaiB, tglSelesaiB)).toBe(false);
		});

		it('Branch: validasiAntiBentrok melemparkan error jika jadwal bentrok', () => {
			expect.assertions(1);
			expect(() => {
				SewaModel.validasiAntiBentrok(createUtcDate(2026, 11, 8), createUtcDate(2026, 11, 12), [
					{ tanggalMulai: tglMulaiB, tanggalSelesai: tglSelesaiB }
				]);
			}).toThrow(/bentrok/i);
		});
	});

	// =========================================================================
	// 5. NORMALISASI TIMEZONE UTC DATE-ONLY
	// =========================================================================
	describe('Date Utility - Timezone UTC Date-Only Consistency', () => {
		it('Statement & Branch: Memastikan waktu selalu tepat 00:00:00.000 UTC', () => {
			expect.assertions(4);
			const normalized = normalizeToUtcDate('2026-11-21');
			expect(normalized.getUTCHours()).toBe(0);
			expect(normalized.getUTCMinutes()).toBe(0);
			expect(normalized.getUTCSeconds()).toBe(0);
			expect(normalized.getUTCMilliseconds()).toBe(0);
		});

		it('Branch: Objek Date dengan waktu lokal acak tetap dinormalisasi ke 00:00:00.000Z', () => {
			expect.assertions(3);
			const randomTimeDate = new Date('2026-11-21T15:45:30.123Z');
			const normalized = normalizeToUtcDate(randomTimeDate);

			expect(normalized.toISOString()).toBe('2026-11-21T00:00:00.000Z');
			expect(normalized.getUTCDate()).toBe(21);
			expect(formatDateIso(normalized)).toBe('2026-11-21');
		});

		it('Branch: diffDays menghitung selisih hari integer murni', () => {
			expect.assertions(2);
			const t1 = createUtcDate(2026, 11, 1);
			const t2 = createUtcDate(2026, 11, 15);
			expect(diffDays(t1, t2)).toBe(14);
			expect(diffDays(t2, t1)).toBe(-14);
		});
	});

	// =========================================================================
	// 6. PERHITUNGAN PERPANJANGAN SEWA LINTAS BULAN VS HARIAN
	// =========================================================================
	describe('SewaModel - Path Coverage hitungBiayaPerpanjangan', () => {
		it('Branch: Melemparkan error jika tanggalSelesaiBaru <= tanggalSelesaiLama', () => {
			expect.assertions(2);
			const tgl = createUtcDate(2026, 11, 10);
			expect(() => {
				SewaModel.hitungBiayaPerpanjangan(tgl, tgl, 10000); // sama
			}).toThrow(/harus lebih besar/i);

			expect(() => {
				SewaModel.hitungBiayaPerpanjangan(tgl, createUtcDate(2026, 11, 9), 10000); // lebih kecil
			}).toThrow(/harus lebih besar/i);
		});

		it('Branch: Melemparkan error jika perpanjangan bentrok dengan jadwal lain', () => {
			expect.assertions(1);
			const lama = createUtcDate(2026, 11, 10);
			const baru = createUtcDate(2026, 11, 20);
			const jadwalLain = [
				{
					tanggalMulai: createUtcDate(2026, 11, 15),
					tanggalSelesai: createUtcDate(2026, 11, 25)
				}
			];
			expect(() => {
				SewaModel.hitungBiayaPerpanjangan(lama, baru, 10000, jadwalLain);
			}).toThrow(/bentrok/i);
		});

		it('Path: Durasi tambahan < 1 bulan (hanya sisa hari harian)', () => {
			expect.assertions(4);
			const lama = createUtcDate(2026, 11, 1);
			const baru = createUtcDate(2026, 11, 8); // +7 hari
			const hasil = SewaModel.hitungBiayaPerpanjangan(lama, baru, 10000);

			expect(hasil.jumlahBulan).toBe(0);
			expect(hasil.sisaHari).toBe(7);
			expect(hasil.tambahanHari).toBe(7);
			expect(hasil.biayaTambahan).toBe(70000); // 7 * 10000
		});

		it('Path: Tepat 1 bulan di November 2026 (30 hari dinamis -> 1 bulan 0 hari)', () => {
			expect.assertions(4);
			const lama = createUtcDate(2026, 11, 1);
			const baru = addDays(lama, 30); // 1 Des 2026
			const hasil = SewaModel.hitungBiayaPerpanjangan(lama, baru, 10000);

			expect(hasil.jumlahBulan).toBe(1);
			expect(hasil.sisaHari).toBe(0);
			expect(hasil.tambahanHari).toBe(30);
			expect(hasil.biayaTambahan).toBe(250000); // 1 * 25 * 10000
		});

		it('Path: Tepat 1 bulan di Februari 2026 (28 hari dinamis -> 1 bulan 0 hari)', () => {
			expect.assertions(4);
			const lama = createUtcDate(2026, 2, 1);
			const baru = addDays(lama, 28); // 1 Maret 2026
			const hasil = SewaModel.hitungBiayaPerpanjangan(lama, baru, 10000);

			expect(hasil.jumlahBulan).toBe(1);
			expect(hasil.sisaHari).toBe(0);
			expect(hasil.tambahanHari).toBe(28);
			expect(hasil.biayaTambahan).toBe(250000); // 1 * 25 * 10000
		});

		it('Path: Lebih dari 1 bulan lintas bulan (1 bulan dinamis Nov + 5 hari Des)', () => {
			expect.assertions(4);
			const lama = createUtcDate(2026, 11, 1);
			const baru = addDays(lama, 35); // 30 hari Nov + 5 hari Des = 6 Des 2026
			const hasil = SewaModel.hitungBiayaPerpanjangan(lama, baru, 10000);

			expect(hasil.jumlahBulan).toBe(1);
			expect(hasil.sisaHari).toBe(5);
			expect(hasil.tambahanHari).toBe(35);
			// (1 * 25 * 10000) + (5 * 10000) = 250000 + 50000 = 300000
			expect(hasil.biayaTambahan).toBe(300000);
		});
	});

	// =========================================================================
	// 7. USERMODEL: TRANSISI STATUS & HAK AKSES SEWA
	// =========================================================================
	describe('UserModel - Transisi Status Verifikasi & Hak Akses Sewa', () => {
		it('Branch & Path: Siklus status PENDING -> REJECTED -> APPROVED', () => {
			expect.assertions(7);
			const user = new UserModel({
				nik: '3201012345670002',
				namaLengkap: 'Siti Rahma',
				noTelepon: '081398765432',
				email: 'siti@test.com',
				role: 'PENYEWA',
				statusVerifikasi: 'PENDING'
			});

			// Status awal PENDING
			expect(user.statusVerifikasi).toBe('PENDING');
			expect(user.bisaMenyewa()).toBe(false);
			expect(() => user.validasiBisaMenyewa()).toThrow(/belum disetujui/i);

			// Admin menolak
			user.reject();
			expect(user.statusVerifikasi).toBe('REJECTED');
			expect(user.bisaMenyewa()).toBe(false);

			// Admin menyetujui
			user.approve();
			expect(user.statusVerifikasi).toBe('APPROVED');
			expect(user.bisaMenyewa()).toBe(true);
		});

		it('Branch: Setter namaLengkap dan noTelepon dengan validasi', () => {
			expect.assertions(3);
			const user = new UserModel({
				nik: '3201012345670003',
				namaLengkap: 'Ahmad Fauzi',
				noTelepon: '081234567890',
				email: 'ahmad@test.com',
				role: 'PENYEWA',
				statusVerifikasi: 'APPROVED'
			});

			user.namaLengkap = 'Ahmad Fauzi Rahman';
			expect(user.namaLengkap).toBe('Ahmad Fauzi Rahman');

			user.noTelepon = '081299998888';
			expect(user.noTelepon).toBe('081299998888');

			expect(() => {
				user.namaLengkap = 'AB'; // < 3 karakter
			}).toThrow(/minimal 3 karakter/i);
		});
	});
});
