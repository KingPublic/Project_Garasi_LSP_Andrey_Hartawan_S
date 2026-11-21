import type { LayoutServerLoad } from './$types';
import { getSession } from '$lib/server/auth';

/**
 * Server load function untuk layout root.
 * Mengambil data sesi pengguna dari cookie HTTP-only yang telah diverifikasi HMAC.
 */
export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const user = getSession(cookies);

	return {
		user,
		pathname: url.pathname
	};
};
