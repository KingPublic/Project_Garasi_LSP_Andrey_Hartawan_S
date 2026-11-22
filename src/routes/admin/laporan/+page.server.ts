import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { laporanService } from '$lib/services/LaporanService';
import { authService } from '$lib/services/AuthService';
import { formatDateIso, getTodayUtcDate } from '$lib/utils/date';
import type { TipeGarasi } from '$lib/models/types';
import type { LaporanFilterInput } from '$lib/repositories/interfaces';

export const load: PageServerLoad = async ({ cookies, url }) => {
	requireAuth(cookies, ['ADMIN']);

	const today = getTodayUtcDate();
	const todayIso = formatDateIso(today);

	// Parameter filter dari URL
	const mode = url.searchParams.get('mode') || 'bulan'; // 'bulan' | 'hari' | 'tipe' | 'penyewa'
	const tahun = parseInt(url.searchParams.get('tahun') || today.getUTCFullYear().toString(), 10);
	const bulan = parseInt(url.searchParams.get('bulan') || (today.getUTCMonth() + 1).toString(), 10);
	const tanggal = url.searchParams.get('tanggal') || todayIso;
	const tipeGarasi = (url.searchParams.get('tipeGarasi') as TipeGarasi) || 'MOBIL';
	const penyewaIdRaw = url.searchParams.get('penyewaId');
	const penyewaId = penyewaIdRaw ? parseInt(penyewaIdRaw, 10) : undefined;

	// Ambil daftar penyewa terlebih dahulu untuk sinkronisasi filter awal mode penyewa
	const calonPenyewaList = await authService.getDaftarCalonPenyewa();
	const effectivePenyewaId = penyewaId ?? (calonPenyewaList.length > 0 ? calonPenyewaList[0].id : undefined);

	// Susun filter query
	const filterInput: LaporanFilterInput = {};

	if (mode === 'bulan') {
		filterInput.bulan = bulan;
		filterInput.tahun = tahun;
	} else if (mode === 'hari') {
		filterInput.tanggal = tanggal;
	} else if (mode === 'tipe') {
		filterInput.tipeGarasi = tipeGarasi;
	} else if (mode === 'penyewa' && effectivePenyewaId) {
		filterInput.penyewaId = effectivePenyewaId;
	}

	const ringkasanDashboard = await laporanService.getRingkasanDashboard();
	const laporan = await laporanService.getLaporan(filterInput);

	return {
		ringkasanDashboard,
		laporan,
		calonPenyewaList,
		filter: {
			mode,
			tahun,
			bulan,
			tanggal,
			tipeGarasi,
			penyewaId: effectivePenyewaId ?? 0
		},
		todayIso
	};
};
