import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL environment variable is not defined.');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

/**
 * Singleton database client instance menggunakan Prisma 7 dengan PostgreSQL adapter.
 * Digunakan di seluruh server-side code (actions, endpoints, services, seeder).
 */
export const db = new PrismaClient({ adapter });

export default db;
