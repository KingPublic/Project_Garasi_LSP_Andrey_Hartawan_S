import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSession, getSession } from '$lib/server/auth';
import { authService } from '$lib/services/AuthService';
import type { Role, StatusVerifikasi } from '$lib/models/types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = getSession(cookies);

	if (user) {
		if (user.role === 'ADMIN') {
			throw redirect(303, '/admin/garasi');
		} else {
			throw redirect(303, '/penyewa');
		}
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString() || '';
		const password = formData.get('password')?.toString() || '';

		if (!email.trim() || !password) {
			return fail(400, {
				email,
				error: 'Email dan password wajib diisi.'
			});
		}

		try {
			const user = await authService.login(email, password);

			createSession(cookies, {
				id: user.id,
				email: user.email,
				namaLengkap: user.namaLengkap,
				role: user.role as Role,
				statusVerifikasi: user.statusVerifikasi as StatusVerifikasi
			});

			if (user.role === 'ADMIN') {
				throw redirect(303, '/admin/garasi');
			} else {
				throw redirect(303, '/penyewa');
			}
		} catch (err: unknown) {
			// SvelteKit redirect dilempar sebagai Response, jangan ditangkap sebagai form failure
			if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 303) {
				throw err;
			}

			const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat login.';
			return fail(400, {
				email,
				error: errorMessage
			});
		}
	}
};
