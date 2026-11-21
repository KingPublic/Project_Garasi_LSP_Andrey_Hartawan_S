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
		const nik = formData.get('nik')?.toString() || '';
		const namaLengkap = formData.get('namaLengkap')?.toString() || '';
		const noTelepon = formData.get('noTelepon')?.toString() || '';
		const email = formData.get('email')?.toString() || '';
		const password = formData.get('password')?.toString() || '';
		const confirmPassword = formData.get('confirmPassword')?.toString() || '';

		if (password !== confirmPassword) {
			return fail(400, {
				nik,
				namaLengkap,
				noTelepon,
				email,
				error: 'Konfirmasi kata sandi tidak cocok dengan kata sandi.'
			});
		}

		try {
			const user = await authService.registerPenyewa({
				nik,
				namaLengkap,
				noTelepon,
				email,
				password
			});

			createSession(cookies, {
				id: user.id,
				email: user.email,
				namaLengkap: user.namaLengkap,
				role: user.role as Role,
				statusVerifikasi: user.statusVerifikasi as StatusVerifikasi
			});

			throw redirect(303, '/penyewa');
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 303) {
				throw err;
			}

			const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat pendaftaran akun.';
			return fail(400, {
				nik,
				namaLengkap,
				noTelepon,
				email,
				error: errorMessage
			});
		}
	}
};
