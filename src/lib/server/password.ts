/**
 * @file password.ts
 * @description Modul hashing dan verifikasi kata sandi yang konsisten di semua runtime (Node.js dan Bun).
 * Menggunakan crypto.scryptSync dari standard library node:crypto dengan salt unik dan timingSafeEqual.
 */

import crypto from 'node:crypto';

/**
 * Melakukan hashing kata sandi dengan crypto.scryptSync.
 *
 * @function hashPassword
 * @param {string} password - Kata sandi mentah.
 * @returns {Promise<string>} Hash kata sandi format $scrypt$<salt>$<hash>.
 */
export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.randomBytes(16).toString('hex');
	const hash = crypto.scryptSync(password, salt, 64).toString('hex');
	return `$scrypt$${salt}$${hash}`;
}

/**
 * Memverifikasi kata sandi mentah terhadap hash yang tersimpan.
 * Mendukung format $scrypt$, $fallback_sha256$, Bun Argon2/bcrypt.
 *
 * @function verifyPassword
 * @param {string} password - Kata sandi mentah yang diinput.
 * @param {string} storedHash - Hash yang tersimpan di basis data.
 * @returns {Promise<boolean>} True jika kata sandi cocok.
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
