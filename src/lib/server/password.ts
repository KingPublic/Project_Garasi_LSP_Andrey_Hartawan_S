/**
 * @file password.ts
 * @description Modul hashing dan verifikasi kata sandi.
 * Menggunakan Bun.password.hash & Bun.password.verify secara native saat runtime Bun,
 * dan menyediakan fallback berbasis crypto SHA-256 saat runtime Node.js (misalnya saat pengujian Vitest).
 */

import crypto from 'node:crypto';

/**
 * Melakukan hashing kata sandi.
 *
 * @function hashPassword
 * @param {string} password - Kata sandi mentah.
 * @returns {Promise<string>} Hash kata sandi.
 */
export async function hashPassword(password: string): Promise<string> {
	if (typeof Bun !== 'undefined' && Bun?.password) {
		return Bun.password.hash(password);
	}

	const salt = crypto.randomBytes(16).toString('hex');
	const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
	return `$fallback_sha256$${salt}$${hash}`;
}

/**
 * Memverifikasi kata sandi mentah terhadap hash yang tersimpan.
 *
 * @function verifyPassword
 * @param {string} password - Kata sandi mentah yang diinput.
 * @param {string} storedHash - Hash yang tersimpan di basis data.
 * @returns {Promise<boolean>} True jika kata sandi cocok.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	if (storedHash.startsWith('$fallback_sha256$')) {
		const parts = storedHash.split('$');
		const salt = parts[2];
		const originalHash = parts[3];
		const testHash = crypto.createHash('sha256').update(password + salt).digest('hex');
		return testHash === originalHash;
	}

	if (typeof Bun !== 'undefined' && Bun?.password) {
		return Bun.password.verify(password, storedHash);
	}

	return false;
}
