import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { userRepository } from '$lib/repositories/UserRepository';
import { kendaraanRepository } from '$lib/repositories/KendaraanRepository';
import { sewaService } from '$lib/services/SewaService';
import { saveUploadFile } from '$lib/server/upload';
import type { TipeKendaraan, TipeSewa } from '$lib/models/types';
import { formatDateIso, getTodayUtcDate } from '$lib/utils/date';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionUser = requireAuth(cookies, ['PENYEWA']);

	const dbUser = await userRepository.findById(sessionUser.id);
	if (!dbUser || dbUser.statusVerifikasi !== 'APPROVED') {
		throw redirect(303, '/penyewa');
	}

	const kendaraanList = await kendaraanRepository.findByPenyewaId(sessionUser.id);
	const todayStr = formatDateIso(getTodayUtcDate());

	return {
		user: dbUser,
		kendaraanList,
		todayStr
	};
};

export const actions: Actions = {
	buatSewa: async ({ request, cookies }) => {
		const user = requireAuth(cookies, ['PENYEWA']);

		const dbUser = await userRepository.findById(user.id);
		if (!dbUser || dbUser.statusVerifikasi !== 'APPROVED') {
			return fail(403, { error: 'Akun Anda belum disetujui (APPROVED) oleh Admin untuk melakukan sewa.' });
		}

		const formData = await request.formData();
		const modeKendaraan = formData.get('modeKendaraan')?.toString() || 'new';
		const garasiId = formData.get('garasiId')?.toString() || '';
		const tipeSewa = formData.get('tipeSewa')?.toString() as TipeSewa;
		const tanggalMulai = formData.get('tanggalMulai')?.toString() || '';
		const jumlahHariRaw = formData.get('jumlahHari')?.toString();
		const jumlahHari = tipeSewa === 'HARIAN' && jumlahHariRaw ? parseInt(jumlahHariRaw, 10) : undefined;

		const sisaBateraiRaw = formData.get('sisaBateraiKwh')?.toString();
		const sisaBateraiKwh = sisaBateraiRaw !== undefined && sisaBateraiRaw !== '' ? parseFloat(sisaBateraiRaw) : null;

		const buktiBayarFile = formData.get('buktiBayar') as File | null;
		if (!buktiBayarFile || buktiBayarFile.size === 0) {
			return fail(400, { error: 'File bukti pembayaran wajib diunggah.' });
		}

		let kendaraanId: number | undefined;
		let tipeKendaraan: TipeKendaraan;
		let nomorPlat: string | null = null;
		let merekTipe: string = '';
		let kapasitasBateraiKwh: number | null = null;

		if (modeKendaraan === 'existing') {
			const kId = parseInt(formData.get('kendaraanId')?.toString() || '0', 10);
			if (!kId) {
				return fail(400, { error: 'Silakan pilih kendaraan yang terdaftar.' });
			}
			const existingK = await kendaraanRepository.findById(kId);
			if (!existingK || existingK.penyewaId !== user.id) {
				return fail(400, { error: 'Kendaraan yang dipilih tidak valid atau bukan milik Anda.' });
			}
			kendaraanId = existingK.id;
			tipeKendaraan = existingK.tipeKendaraan as TipeKendaraan;
			nomorPlat = existingK.nomorPlat;
			merekTipe = existingK.merekTipe;
			kapasitasBateraiKwh = existingK.kapasitasBateraiKwh;
		} else {
			tipeKendaraan = formData.get('tipeKendaraan')?.toString() as TipeKendaraan;
			nomorPlat = formData.get('nomorPlat')?.toString() || null;
			merekTipe = formData.get('merekTipe')?.toString() || '';
			const kapRaw = formData.get('kapasitasBateraiKwh')?.toString();
			kapasitasBateraiKwh = kapRaw ? parseFloat(kapRaw) : null;

			if (!tipeKendaraan || !merekTipe.trim()) {
				return fail(400, { error: 'Tipe dan merek kendaraan wajib diisi.' });
			}
		}

		try {
			// Simpan file bukti transfer ke static/uploads/
			const buktiBayarPath = await saveUploadFile(buktiBayarFile);

			// Buat sewa melalui SewaService (termasuk validasi anti-bentrok & pra-validasi kendaraan)
			await sewaService.buatSewaBaru({
				penyewaId: user.id,
				garasiId,
				kendaraanId,
				tipeKendaraan,
				nomorPlat,
				merekTipe,
				kapasitasBateraiKwh,
				tipeSewa,
				tanggalMulai,
				jumlahHari,
				sisaBateraiKwh,
				buktiBayarPath
			});

			throw redirect(303, '/penyewa');
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 303) {
				throw err;
			}
			const errorMessage = err instanceof Error ? err.message : 'Gagal memproses transaksi sewa garasi.';
			return fail(400, { error: errorMessage });
		}
	}
};
