import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { garasiService } from '$lib/services/GarasiService';
import type { TipeKendaraan } from '$lib/models/types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const tipeKendaraan = url.searchParams.get('tipeKendaraan') as TipeKendaraan;
	const tanggalMulai = url.searchParams.get('tanggalMulai');
	const tanggalSelesai = url.searchParams.get('tanggalSelesai');

	if (!tipeKendaraan || !tanggalMulai || !tanggalSelesai) {
		return json(
			{ error: 'Parameter tipeKendaraan, tanggalMulai, dan tanggalSelesai wajib disertakan.' },
			{ status: 400 }
		);
	}

	try {
		const garasiTersedia = await garasiService.getGarasiTersedia(
			tipeKendaraan,
			tanggalMulai,
			tanggalSelesai
		);

		return json({
			success: true,
			data: garasiTersedia
		});
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'Gagal mencari ketersediaan garasi.';
		return json({ error: errorMessage }, { status: 400 });
	}
};
