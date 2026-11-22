import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { sewaService } from '$lib/services/SewaService';

export const load: PageServerLoad = async ({ cookies }) => {
	requireAuth(cookies, ['ADMIN']);

	const sewaMenungguList = await sewaService.getDaftarSewaMenungguVerifikasi();
	const totalNominal = sewaMenungguList.reduce((acc, s) => acc + s.totalBiaya, 0);

	return {
		sewaMenungguList,
		stats: {
			totalPending: sewaMenungguList.length,
			totalNominal
		}
	};
};

export const actions: Actions = {
	setujui: async ({ request, cookies }) => {
		requireAuth(cookies, ['ADMIN']);

		const formData = await request.formData();
		const sewaId = parseInt(formData.get('sewaId')?.toString() || '0', 10);

		if (!sewaId || isNaN(sewaId)) {
			return fail(400, { error: 'ID transaksi sewa tidak valid.' });
		}

		try {
			const updated = await sewaService.verifikasiPembayaran(sewaId, 'AKTIF');
			return {
				success: true,
				message: `Pembayaran transaksi sewa #${updated.id} untuk garasi ${updated.garasiId} berhasil diverifikasi. Status sewa kini AKTIF.`
			};
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Gagal memverifikasi pembayaran.';
			return fail(400, { error: errorMessage });
		}
	},

	tolak: async ({ request, cookies }) => {
		requireAuth(cookies, ['ADMIN']);

		const formData = await request.formData();
		const sewaId = parseInt(formData.get('sewaId')?.toString() || '0', 10);

		if (!sewaId || isNaN(sewaId)) {
			return fail(400, { error: 'ID transaksi sewa tidak valid.' });
		}

		try {
			const updated = await sewaService.verifikasiPembayaran(sewaId, 'DITOLAK');
			return {
				success: true,
				message: `Pembayaran transaksi sewa #${updated.id} telah ditolak. Unit garasi ${updated.garasiId} kini bebas untuk disewa kembali.`
			};
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Gagal menolak bukti pembayaran.';
			return fail(400, { error: errorMessage });
		}
	}
};
