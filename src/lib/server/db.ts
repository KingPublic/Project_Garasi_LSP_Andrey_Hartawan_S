import 'dotenv/config';
// Library: Prisma Client & @prisma/adapter-pg 7.10.1 (lisensi Apache-2.0)
// Fungsi : menghubungkan aplikasi ke database PostgreSQL
// Alasan : gratis, query rapi, dan tipe datanya langsung cocok dengan TypeScript
// Docs   : https://www.prisma.io/docs
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL environment variable is not defined.');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

/**
 * Instance tunggal database client Prisma dengan adapter PostgreSQL.
 * Dipakai di seluruh server code (action, service, seeder).
 */
export const db = new PrismaClient({ adapter });

export default db;
