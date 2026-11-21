/**
 * @file auth.ts
 * @description Helper autentikasi dan manajemen session cookie HTTP-only berbasis peran (Role).
 */

import { redirect, type Cookies } from '@sveltejs/kit';
import type { Role, StatusVerifikasi } from '../models/types';

export const SESSION_COOKIE_NAME = 'garasi_session';

/**
 * Data pengguna yang tersimpan di dalam session.
 */
export interface SessionUser {
	id: number;
	email: string;
	namaLengkap: string;
	role: Role;
	statusVerifikasi: StatusVerifikasi;
}

/**
 * Membuat dan menetapkan cookie sesi HTTP-only yang aman di browser pengguna.
 *
 * @function createSession
 * @param {Cookies} cookies - Objek Cookies dari event SvelteKit.
 * @param {SessionUser} user - Data pengguna yang login.
 * @returns {void}
 */
export function createSession(cookies: Cookies, user: SessionUser): void {
	const sessionValue = Buffer.from(JSON.stringify(user)).toString('base64');

	cookies.set(SESSION_COOKIE_NAME, sessionValue, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 7 // 7 hari
	});
}

/**
 * Mengambil dan mendekode data pengguna dari session cookie HTTP-only.
 *
 * @function getSession
 * @param {Cookies} cookies - Objek Cookies dari event SvelteKit.
 * @returns {SessionUser | null} Data pengguna jika session valid, atau null jika tidak ada/rusak.
 */
export function getSession(cookies: Cookies): SessionUser | null {
	const rawCookie = cookies.get(SESSION_COOKIE_NAME);
	if (!rawCookie) {
		return null;
	}

	try {
		const decoded = Buffer.from(rawCookie, 'base64').toString('utf-8');
		const user = JSON.parse(decoded) as SessionUser;

		if (!user || typeof user.id !== 'number' || !user.role || !user.email) {
			return null;
		}

		return user;
	} catch {
		return null;
	}
}

/**
 * Menghapus cookie sesi HTTP-only saat pengguna melakukan logout.
 *
 * @function clearSession
 * @param {Cookies} cookies - Objek Cookies dari event SvelteKit.
 * @returns {void}
 */
export function clearSession(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

/**
 * Guard proteksi rute untuk memastikan pengguna telah login dan memiliki peran yang diizinkan.
 * Otomatis melempar redirect ke halaman login atau dashboard jika tidak berwenang.
 *
 * @function requireAuth
 * @param {Cookies} cookies - Objek Cookies dari event SvelteKit.
 * @param {Role[]} [allowedRoles] - Daftar role yang diizinkan mengakses rute (opsional).
 * @returns {SessionUser} Data session pengguna yang terverifikasi.
 * @throws {Redirect} Redirect ke /login jika belum login, atau ke dashboard sesuai role jika salah hak akses.
 */
export function requireAuth(cookies: Cookies, allowedRoles?: Role[]): SessionUser {
	const user = getSession(cookies);

	if (!user) {
		throw redirect(303, '/login');
	}

	if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
		if (user.role === 'ADMIN') {
			throw redirect(303, '/admin/garasi');
		} else {
			throw redirect(303, '/penyewa');
		}
	}

	return user;
}
