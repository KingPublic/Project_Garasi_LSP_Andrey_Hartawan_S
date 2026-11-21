/**
 * @file seed.ts
 * @description Seeder untuk menginisialisasi akun Admin default ke dalam basis data PostgreSQL.
 * Menggunakan operasi upsert berbasis kolom email unik agar aman dieksekusi berulang kali.
 */

import 'dotenv/config';
import { db } from './db';
import { hashPassword } from './password';

/**
 * Seeder untuk menginisialisasi akun Admin default ke dalam basis data PostgreSQL.
 *
 * @async
 * @function seedAdmin
 * @returns {Promise<void>}
 */
export async function seedAdmin(): Promise<void> {
	console.log('[SEED] Menjalankan database seeder...');

	const adminEmail = 'admin@garasi.com';
	const adminPasswordRaw = 'admin123';
	const passwordHash = await hashPassword(adminPasswordRaw);

	const admin = await db.user.upsert({
		where: { email: adminEmail },
		update: {
			namaLengkap: 'Administrator Garasi',
			noTelepon: '081234567890',
			passwordHash,
			role: 'ADMIN',
			statusVerifikasi: 'APPROVED'
		},
		create: {
			email: adminEmail,
			nik: null,
			namaLengkap: 'Administrator Garasi',
			noTelepon: '081234567890',
			passwordHash,
			role: 'ADMIN',
			statusVerifikasi: 'APPROVED'
		}
	});

	console.log(`[OK] Admin berhasil di-seed: ${admin.email} (ID: ${admin.id}, Role: ${admin.role})`);
}

// Eksekusi langsung jika file dipanggil melalui command line (`bun src/lib/server/seed.ts`)
if (import.meta.main) {
	seedAdmin()
		.catch((err) => {
			console.error('[ERROR] Gagal menjalankan database seeder:', err);
			process.exit(1);
		})
		.finally(async () => {
			await db.$disconnect();
		});
}
