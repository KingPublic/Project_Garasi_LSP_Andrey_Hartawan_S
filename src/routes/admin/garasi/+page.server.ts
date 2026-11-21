import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { garasiService } from '$lib/services/GarasiService';
import type { TipeGarasi } from '$lib/models/types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = requireAuth(cookies, ['ADMIN']);

	await garasiService.sinkronisasiStatusGarasiHariIni();
	const daftarGarasi = await garasiService.getDaftarGarasi();

	const stats = {
		total: daftarGarasi.length,
		tersedia: daftarGarasi.filter((g) => g.status === 'AVAILABLE').length,
		terpakai: daftarGarasi.filter((g) => g.status === 'USED').length,
		sepeda: {
			total: daftarGarasi.filter((g) => g.tipeGarasi === 'SEPEDA').length,
			tersedia: daftarGarasi.filter((g) => g.tipeGarasi === 'SEPEDA' && g.status === 'AVAILABLE').length,
			terpakai: daftarGarasi.filter((g) => g.tipeGarasi === 'SEPEDA' && g.status === 'USED').length
		},
		mobil: {
			total: daftarGarasi.filter((g) => g.tipeGarasi === 'MOBIL').length,
			tersedia: daftarGarasi.filter((g) => g.tipeGarasi === 'MOBIL' && g.status === 'AVAILABLE').length,
			terpakai: daftarGarasi.filter((g) => g.tipeGarasi === 'MOBIL' && g.status === 'USED').length
		},
		listrik: {
			total: daftarGarasi.filter((g) => g.tipeGarasi === 'MOBIL_LISTRIK').length,
			tersedia: daftarGarasi.filter((g) => g.tipeGarasi === 'MOBIL_LISTRIK' && g.status === 'AVAILABLE').length,
			terpakai: daftarGarasi.filter((g) => g.tipeGarasi === 'MOBIL_LISTRIK' && g.status === 'USED').length
		}
	};

	return {
		user,
		daftarGarasi,
		stats
	};
};

export const actions: Actions = {
	buatGarasi: async ({ request, cookies }) => {
		requireAuth(cookies, ['ADMIN']);

		const formData = await request.formData();
		const tipeGarasi = formData.get('tipeGarasi')?.toString() as TipeGarasi;
		const jumlahBaru = parseInt(formData.get('jumlahBaru')?.toString() || '0', 10);
		const hargaHarian = parseInt(formData.get('hargaHarian')?.toString() || '0', 10);
		const hargaListrikRaw = formData.get('hargaListrikPerKwh')?.toString();
		const hargaListrikPerKwh = hargaListrikRaw ? parseInt(hargaListrikRaw, 10) : null;

		if (!tipeGarasi || !['SEPEDA', 'MOBIL', 'MOBIL_LISTRIK'].includes(tipeGarasi)) {
			return fail(400, { error: 'Tipe garasi tidak valid.' });
		}

		if (isNaN(jumlahBaru) || jumlahBaru <= 0) {
			return fail(400, { error: 'Jumlah unit baru harus berupa angka positif minimal 1.' });
		}

		if (isNaN(hargaHarian) || hargaHarian <= 0) {
			return fail(400, { error: 'Tarif sewa harian harus berupa angka positif lebih dari 0.' });
		}

		if (tipeGarasi === 'MOBIL_LISTRIK' && (hargaListrikPerKwh === null || isNaN(hargaListrikPerKwh) || hargaListrikPerKwh <= 0)) {
			return fail(400, { error: 'Tarif listrik per kWh wajib diisi (> 0) untuk Garasi Mobil Listrik (EV).' });
		}

		try {
			const count = await garasiService.buatGarasiMassal(
				tipeGarasi,
				jumlahBaru,
				hargaHarian,
				hargaListrikPerKwh
			);

			return {
				success: true,
				message: `Berhasil menambahkan ${count} unit garasi tipe ${tipeGarasi}.`
			};
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Gagal membuat unit garasi.';
			return fail(400, { error: errorMessage });
		}
	}
};
