import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { authService } from '$lib/services/AuthService';
import type { StatusVerifikasi } from '$lib/models/types';

export const load: PageServerLoad = async ({ cookies }) => {
	requireAuth(cookies, ['ADMIN']);

	const calonPenyewaList = await authService.getDaftarCalonPenyewa();

	const stats = {
		total: calonPenyewaList.length,
		pending: calonPenyewaList.filter((u) => u.statusVerifikasi === 'PENDING').length,
		approved: calonPenyewaList.filter((u) => u.statusVerifikasi === 'APPROVED').length,
		rejected: calonPenyewaList.filter((u) => u.statusVerifikasi === 'REJECTED').length
	};

	return {
		calonPenyewaList,
		stats
	};
};

export const actions: Actions = {
	verifikasi: async ({ request, cookies }) => {
		requireAuth(cookies, ['ADMIN']);

		const formData = await request.formData();
		const penyewaId = parseInt(formData.get('penyewaId')?.toString() || '0', 10);
		const status = formData.get('status')?.toString() as StatusVerifikasi;

		if (!penyewaId || isNaN(penyewaId)) {
			return fail(400, { error: 'ID penyewa tidak valid.' });
		}

		if (status !== 'APPROVED' && status !== 'REJECTED') {
			return fail(400, { error: "Status verifikasi hanya boleh 'APPROVED' atau 'REJECTED'." });
		}

		try {
			const updatedUser = await authService.verifikasiPenyewa(penyewaId, status);
			const label = status === 'APPROVED' ? 'disetujui (APPROVED)' : 'ditolak (REJECTED)';
			return {
				success: true,
				message: `Status verifikasi untuk ${updatedUser.namaLengkap} (NIK: ${updatedUser.nik}) berhasil diubah menjadi ${label}.`
			};
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Gagal memperbarui status verifikasi.';
			return fail(400, { error: errorMessage });
		}
	}
};
