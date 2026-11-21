/**
 * @file seed.ts
 * @description Seeder basis data PostgreSQL untuk GARASI TA.
 * Menyediakan inisialisasi akun Admin, Garasi default, dan Akun Demo Penyewa (User).
 *
 * Cara menjalankan:
 * - `bun run seed`               : Hanya inisialisasi akun Admin default (aman & cepat)
 * - `bun run seed user`          : Inisialisasi akun-akun penyewa demo (Approved, Pending, Rejected, EV, Motor)
 * - `bun run seed:user`          : Alias untuk seed akun penyewa demo
 * - `bun run seed garasi`        : Inisialisasi unit garasi starter (S001-S005, C001-C005, E001-E005)
 * - `bun run seed all`           : Inisialisasi seluruh data (Admin, Garasi, Penyewa)
 */

import 'dotenv/config';
import { db } from './db';
import { hashPassword } from './password';
import { garasiService } from '../services/GarasiService';
import type { TipeKendaraan } from '../models/types';

/**
 * Interface data seeding untuk akun penyewa demo.
 */
interface DemoUserData {
	email: string;
	passwordRaw: string;
	nik: string;
	namaLengkap: string;
	noTelepon: string;
	role: 'PENYEWA';
	statusVerifikasi: 'APPROVED' | 'PENDING' | 'REJECTED';
	kendaraan?: {
		tipeKendaraan: TipeKendaraan;
		merekTipe: string;
		nomorPlat: string;
		kapasitasBateraiKwh?: number;
	};
}

/**
 * Daftar akun demo penyewa yang mewakili berbagai use case aplikasi:
 * 1. Muhammad Fadli Akbar - APPROVED (Mobil Konvensional) -> Siap sewa garasi C
 * 2. Nurul Mutmainnah - PENDING (Mobil Konvensional) -> Untuk demo verifikasi admin KTP/NIK
 * 3. Fikri Haikal Daeng Rate - REJECTED (Sepeda Motor) -> Untuk demo tampilan akun ditolak
 * 4. Rahmat Hidayatullah - APPROVED (Mobil Listrik EV) -> Untuk demo kalkulasi kWh pengisian listrik di garasi E
 * 5. Syahrul Gunawan Daeng Bella - APPROVED (Sepeda Motor) -> Untuk demo sewa garasi roda dua S
 */
const DEMO_USERS: DemoUserData[] = [
	{
		email: 'fadli.akbar@gmail.com',
		passwordRaw: 'user123',
		nik: '7371011405940003',
		namaLengkap: 'Muhammad Fadli Akbar',
		noTelepon: '081141928374',
		role: 'PENYEWA',
		statusVerifikasi: 'APPROVED',
		kendaraan: {
			tipeKendaraan: 'MOBIL',
			merekTipe: 'Honda HR-V 1.5 SE',
			nomorPlat: 'DD 1428 FA'
		}
	},
	{
		email: 'nurul.mutmainnah@gmail.com',
		passwordRaw: 'user123',
		nik: '7371026108970001',
		namaLengkap: 'Nurul Mutmainnah',
		noTelepon: '085299481230',
		role: 'PENYEWA',
		statusVerifikasi: 'PENDING',
		kendaraan: {
			tipeKendaraan: 'MOBIL',
			merekTipe: 'Toyota Veloz 1.5 Q',
			nomorPlat: 'DD 1789 NM'
		}
	},
	{
		email: 'fikri.haikal@gmail.com',
		passwordRaw: 'user123',
		nik: '7371031911960002',
		namaLengkap: 'Fikri Haikal Daeng Rate',
		noTelepon: '081342617892',
		role: 'PENYEWA',
		statusVerifikasi: 'REJECTED',
		kendaraan: {
			tipeKendaraan: 'SEPEDA_MOTOR',
			merekTipe: 'Honda Vario 160 ABS',
			nomorPlat: 'DD 2941 FH'
		}
	},
	{
		email: 'rahmat.hidayat@gmail.com',
		passwordRaw: 'user123',
		nik: '7371040803920005',
		namaLengkap: 'Rahmat Hidayatullah',
		noTelepon: '082188471923',
		role: 'PENYEWA',
		statusVerifikasi: 'APPROVED',
		kendaraan: {
			tipeKendaraan: 'MOBIL_LISTRIK',
			merekTipe: 'Hyundai Ioniq 5 Signature Long Range',
			nomorPlat: 'DD 8055 RH',
			kapasitasBateraiKwh: 72.6
		}
	},
	{
		email: 'syahrul.bella@gmail.com',
		passwordRaw: 'user123',
		nik: '7371052507980004',
		namaLengkap: 'Syahrul Gunawan Daeng Bella',
		noTelepon: '085341209845',
		role: 'PENYEWA',
		statusVerifikasi: 'APPROVED',
		kendaraan: {
			tipeKendaraan: 'SEPEDA_MOTOR',
			merekTipe: 'Yamaha NMAX 155 Connected',
			nomorPlat: 'DD 3314 SB'
		}
	}
];

/**
 * Seeder untuk menginisialisasi akun Admin default ke dalam basis data PostgreSQL.
 *
 * @async
 * @function seedAdmin
 * @returns {Promise<void>}
 */
export async function seedAdmin(): Promise<void> {
	console.log('\n[SEED:ADMIN] Menginisialisasi akun Admin...');

	const adminEmail = 'admin@garasi.com';
	const adminPasswordRaw = 'admin123';
	const passwordHash = await hashPassword(adminPasswordRaw);

	const admin = await db.user.upsert({
		where: { email: adminEmail },
		update: {
			namaLengkap: 'Administrator Garasi Ta',
			noTelepon: '081234567890',
			passwordHash,
			role: 'ADMIN',
			statusVerifikasi: 'APPROVED'
		},
		create: {
			email: adminEmail,
			nik: null,
			namaLengkap: 'Administrator Garasi Ta',
			noTelepon: '081234567890',
			passwordHash,
			role: 'ADMIN',
			statusVerifikasi: 'APPROVED'
		}
	});

	console.log(`[OK] Admin siap: ${admin.email} (Password: ${adminPasswordRaw}, Status: ${admin.statusVerifikasi})`);
}

/**
 * Seeder untuk menginisialisasi akun-akun Penyewa (User) demo ke dalam basis data.
 * Dilengkapi dengan kendaraan yang siap digunakan untuk simulasi sewa garasi.
 *
 * @async
 * @function seedUsers
 * @returns {Promise<void>}
 */
export async function seedUsers(): Promise<void> {
	console.log('\n[SEED:USER] Menginisialisasi akun-akun demo Penyewa...');

	// Bersihkan akun placeholder lama jika ada di database
	const oldPlaceholderEmails = [
		'budi@gmail.com',
		'siti@gmail.com',
		'andi@gmail.com',
		'daeng@gmail.com',
		'ikhsan@gmail.com'
	];
	for (const oldEmail of oldPlaceholderEmails) {
		const oldUser = await db.user.findUnique({ where: { email: oldEmail } });
		if (oldUser) {
			await db.kendaraan.deleteMany({ where: { penyewaId: oldUser.id } });
			await db.user.delete({ where: { id: oldUser.id } });
		}
	}

	for (const item of DEMO_USERS) {
		const passwordHash = await hashPassword(item.passwordRaw);

		const user = await db.user.upsert({
			where: { email: item.email },
			update: {
				nik: item.nik,
				namaLengkap: item.namaLengkap,
				noTelepon: item.noTelepon,
				passwordHash,
				role: item.role,
				statusVerifikasi: item.statusVerifikasi
			},
			create: {
				email: item.email,
				nik: item.nik,
				namaLengkap: item.namaLengkap,
				noTelepon: item.noTelepon,
				passwordHash,
				role: item.role,
				statusVerifikasi: item.statusVerifikasi
			}
		});

		let kendaraanInfo = '-';
		if (item.kendaraan) {
			const existing = await db.kendaraan.findFirst({
				where: {
					penyewaId: user.id,
					nomorPlat: item.kendaraan.nomorPlat
				}
			});

			if (existing) {
				await db.kendaraan.update({
					where: { id: existing.id },
					data: {
						tipeKendaraan: item.kendaraan.tipeKendaraan,
						merekTipe: item.kendaraan.merekTipe,
						kapasitasBateraiKwh: item.kendaraan.kapasitasBateraiKwh ?? null
					}
				});
				kendaraanInfo = `${item.kendaraan.merekTipe} (${item.kendaraan.nomorPlat})`;
			} else {
				await db.kendaraan.create({
					data: {
						penyewaId: user.id,
						tipeKendaraan: item.kendaraan.tipeKendaraan,
						merekTipe: item.kendaraan.merekTipe,
						nomorPlat: item.kendaraan.nomorPlat,
						kapasitasBateraiKwh: item.kendaraan.kapasitasBateraiKwh ?? null
					}
				});
				kendaraanInfo = `${item.kendaraan.merekTipe} (${item.kendaraan.nomorPlat})`;
			}
		}

		console.log(
			`[OK] User: ${user.email} | NIK: ${user.nik} | Status: [${user.statusVerifikasi}] | Kendaraan: ${kendaraanInfo}`
		);
	}

	console.log(`[OK] Sukses menginisialisasi ${DEMO_USERS.length} akun demo Penyewa (Password default: 'user123').`);
}

/**
 * Seeder untuk menginisialisasi unit Garasi awal jika belum terdapat unit di database.
 * - S001..S005 : Sepeda & Motor (Rp 10.000 / hari)
 * - C001..C005 : Mobil Konvensional (Rp 50.000 / hari)
 * - E001..E005 : Mobil Listrik EV (Rp 75.000 / hari, Rp 2.500 / kWh)
 *
 * @async
 * @function seedGarasi
 * @returns {Promise<void>}
 */
export async function seedGarasi(): Promise<void> {
	console.log('\n[SEED:GARASI] Memeriksa data unit Garasi...');

	const existingCount = await db.garasi.count();
	if (existingCount > 0) {
		console.log(`[INFO] Database sudah memiliki ${existingCount} unit garasi. Seeder dilewati.`);
		return;
	}

	console.log('[SEED:GARASI] Menginisialisasi unit garasi awal (S001-S005, C001-C005, E001-E005)...');
	await garasiService.buatGarasiMassal('SEPEDA', 5, 10000);
	await garasiService.buatGarasiMassal('MOBIL', 5, 50000);
	await garasiService.buatGarasiMassal('MOBIL_LISTRIK', 5, 75000, 2500);

	console.log('[OK] 15 unit garasi awal berhasil dibuat.');
}

/**
 * Fungsi entrypoint runner seeder database.
 */
async function main(): Promise<void> {
	const rawArgs = process.argv.slice(2);
	const args = rawArgs.map((a) => a.toLowerCase().replace(/^--?/, ''));

	const isUserSeed = args.includes('user') || args.includes('users');
	const isGarasiSeed = args.includes('garasi') || args.includes('garage');
	const isAllSeed = args.includes('all');

	console.log('====================================================');
	console.log('         GARASI TA - DATABASE SEEDER RUNNER         ');
	console.log('====================================================');

	if (isAllSeed) {
		console.log('[MODE] Menjalankan SEMUA seeder (Admin, Garasi, Users)...');
		await seedAdmin();
		await seedGarasi();
		await seedUsers();
	} else if (isUserSeed) {
		console.log('[MODE] Menjalankan SEED USER (Akun Demo Penyewa)...');
		await seedUsers();
	} else if (isGarasiSeed) {
		console.log('[MODE] Menjalankan SEED GARASI (Unit Garasi Awal)...');
		await seedGarasi();
	} else {
		// Default mode: hanya jalankan seed admin
		console.log('[MODE] Menjalankan DEFAULT SEED (Hanya Akun Admin)...');
		await seedAdmin();

		console.log('\n----------------------------------------------------');
		console.log('[PETUNJUK PENGGUNAAN]');
		console.log('Ingin melakukan seed akun demo Penyewa? Jalankan:');
		console.log('  bun run seed user       (atau: bun run seed:user)');
		console.log('\nIngin melakukan seed unit Garasi awal? Jalankan:');
		console.log('  bun run seed garasi     (atau: bun run seed:garasi)');
		console.log('\nIngin melakukan seed SEMUA data sekaligus? Jalankan:');
		console.log('  bun run seed all        (atau: bun run seed:all)');
		console.log('----------------------------------------------------');
	}

	console.log('\n[SELESAI] Eksekusi seeder selesai dengan sukses.');
}

// Eksekusi langsung jika dipanggil via CLI
if (import.meta.main) {
	main()
		.catch((err) => {
			console.error('\n[ERROR] Seeder gagal dijalankan:', err);
			process.exit(1);
		})
		.finally(async () => {
			await db.$disconnect();
		});
}
