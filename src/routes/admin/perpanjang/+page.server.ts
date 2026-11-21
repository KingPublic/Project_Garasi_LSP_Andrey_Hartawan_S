import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { sewaService } from '$lib/services/SewaService';
import { sewaRepository } from '$lib/repositories/SewaRepository';
import { saveUploadFile } from '$lib/server/upload';
import { formatDateIso, getTodayUtcDate } from '$lib/utils/date';

export const load: PageServerLoad = async ({ cookies }) => {
	requireAuth(cookies, ['ADMIN']);

	const today = getTodayUtcDate();
	const sewaAktifList = await sewaRepository.findSewaAktifHariIni(today);

	return {
		sewaAktifList,
		todayStr: formatDateIso(today)
	};
};

export const actions: Actions = {
	perpanjang: async ({ request, cookies }) => {
		requireAuth(cookies, ['ADMIN']);

		const formData = await request.formData();
		const sewaId = parseInt(formData.get('sewaId')?.toString() || '0', 10);
		const tanggalSelesaiBaru = formData.get('tanggalSelesaiBaru')?.toString() || '';
		const buktiBayarFile = formData.get('buktiBayar') as File | null;

		if (!sewaId || isNaN(sewaId)) {
			return fail(400, { error: 'ID transaksi sewa tidak valid.' });
		}

		if (!tanggalSelesaiBaru) {
			return fail(400, { error: 'Tanggal selesai baru wajib ditentukan.' });
		}

		if (!buktiBayarFile || buktiBayarFile.size === 0) {
			return fail(400, { error: 'File bukti pembayaran biaya perpanjangan wajib diunggah.' });
		}

		try {
			const buktiBayarPath = await saveUploadFile(buktiBayarFile);

			const hasil = await sewaService.perpanjangSewa({
				sewaId,
				tanggalSelesaiBaru,
				buktiBayarPath
			});

			return {
				success: true,
				message: `Berhasil memperpanjang sewa garasi ${hasil.sewa.garasiId} selama ${hasil.perpanjangan.tambahanHari} hari (Biaya tambahan: Rp ${hasil.perpanjangan.biayaTambahan.toLocaleString('id-ID')}).`
			};
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Gagal memperpanjang masa sewa.';
			return fail(400, { error: errorMessage });
		}
	}
};
