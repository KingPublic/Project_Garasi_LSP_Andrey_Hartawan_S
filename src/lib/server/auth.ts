/**
 * Helper autentikasi dan sesi cookie HTTP-only bertanda tangan HMAC-SHA256.
 */

import crypto from 'node:crypto';
import { redirect, type Cookies } from '@sveltejs/kit';
import type { Role, StatusVerifikasi } from '../models/types';

export const SESSION_COOKIE_NAME = 'garasi_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-lsp-garasi-secret-key';

/**
 * Data pengguna yang tersimpan di dalam sesi cookie.
 */
export interface SessionUser {
	id: number;
	email: string;
	namaLengkap: string;
	role: Role;
	statusVerifikasi: StatusVerifikasi;
	nik?: string | null;
}

/**
 * Menandatangani payload dengan format <base64Payload>.<hmacHex>.
 */
function signPayload(payload: string): string {
	const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
	return `${payload}.${hmac}`;
}

/**
 * Memverifikasi tanda tangan HMAC dan mengekstrak payload sesi.
 */
function verifyAndExtractPayload(signedValue: string): string | null {
	const parts = signedValue.split('.');
	if (parts.length !== 2) {
		return null;
	}

	const [payload, hmacHex] = parts;
	const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

	const hmacBuffer = Buffer.from(hmacHex, 'hex');
	const expectedBuffer = Buffer.from(expectedHmac, 'hex');

	if (hmacBuffer.length !== expectedBuffer.length) {
		return null;
	}

	// Memakai timingSafeEqual agar waktu perbandingan konstan dan aman dari timing attack
	if (!crypto.timingSafeEqual(hmacBuffer, expectedBuffer)) {
		return null;
	}

	return payload;
}

/**
 * Menetapkan cookie sesi HTTP-only yang ditandatangani HMAC-SHA256 ke browser.
 */
export function createSession(cookies: Cookies, user: SessionUser): void {
	const payload = Buffer.from(JSON.stringify(user)).toString('base64');
	const sessionValue = signPayload(payload);

	cookies.set(SESSION_COOKIE_NAME, sessionValue, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 7 // berlaku 7 hari
	});
}

/**
 * Membaca dan memvalidasi sesi pengguna dari cookie browser.
 */
export function getSession(cookies: Cookies): SessionUser | null {
	const rawCookie = cookies.get(SESSION_COOKIE_NAME);
	if (!rawCookie) {
		return null;
	}

	try {
		const payload = verifyAndExtractPayload(rawCookie);
		if (!payload) {
			return null;
		}

		const decoded = Buffer.from(payload, 'base64').toString('utf-8');
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
 * Menghapus cookie sesi saat pengguna keluar akun (logout).
 */
export function clearSession(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

/**
 * Memastikan pengguna sudah login dan memiliki role yang diizinkan.
 * Melempar redirect jika belum login atau role tidak sesuai.
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
