/**
 * Modul hashing dan verifikasi kata sandi memakai crypto.scryptSync bawaan node:crypto.
 */

import crypto from 'node:crypto';

/**
 * Hashing kata sandi memakai scrypt dengan salt acak 16 byte.
 *
 * @param password kata sandi mentah
 * @returns hash berformat $scrypt$<salt>$<hash>
 */
export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.randomBytes(16).toString('hex');
	const hash = crypto.scryptSync(password, salt, 64).toString('hex');
	return `$scrypt$${salt}$${hash}`;
}

/**
 * Memverifikasi kecocokan kata sandi mentah dengan hash tersimpan.
 *
 * @param password kata sandi yang diinput
 * @param storedHash hash yang tersimpan di database
 * @returns true jika kata sandi cocok
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	if (!password || !storedHash) {
		return false;
	}

	if (storedHash.startsWith('$scrypt$')) {
		const parts = storedHash.split('$');
		const salt = parts[2];
		const expectedHex = parts[3];

		const derived = crypto.scryptSync(password, salt, 64).toString('hex');
		const bufA = Buffer.from(derived, 'hex');
		const bufB = Buffer.from(expectedHex, 'hex');

		if (bufA.length !== bufB.length) return false;
		// Memakai timingSafeEqual agar waktu eksekusi konstan dan aman dari timing attack
		return crypto.timingSafeEqual(bufA, bufB);
	}

	if (storedHash.startsWith('$fallback_sha256$')) {
		const parts = storedHash.split('$');
		const salt = parts[2];
		const originalHash = parts[3];
		const testHash = crypto.createHash('sha256').update(password + salt).digest('hex');
		return testHash === originalHash;
	}

	if (typeof Bun !== 'undefined' && Bun?.password) {
		try {
			return await Bun.password.verify(password, storedHash);
		} catch {
			// fallthrough
		}
	}

	return false;
}
