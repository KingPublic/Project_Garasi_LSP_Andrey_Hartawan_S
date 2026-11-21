import type { PageServerLoad } from './$types';
import { requireAuth, createSession } from '$lib/server/auth';
import { userRepository } from '$lib/repositories/UserRepository';
import { sewaService } from '$lib/services/SewaService';
import { kendaraanRepository } from '$lib/repositories/KendaraanRepository';
import type { Role, StatusVerifikasi } from '$lib/models/types';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionUser = requireAuth(cookies, ['PENYEWA']);

	// Ambil data user paling baru dari basis data untuk memastikan status verifikasi sinkron real-time
	const dbUser = await userRepository.findById(sessionUser.id);
	const user = dbUser
		? {
				id: dbUser.id,
				email: dbUser.email,
				namaLengkap: dbUser.namaLengkap,
				nik: dbUser.nik,
				noTelepon: dbUser.noTelepon,
				role: dbUser.role as Role,
				statusVerifikasi: dbUser.statusVerifikasi as StatusVerifikasi
			}
		: sessionUser;

	// Perbarui cookie jika status verifikasi telah berubah oleh Admin
	if (dbUser && (dbUser.statusVerifikasi !== sessionUser.statusVerifikasi || dbUser.nik !== sessionUser.nik)) {
		createSession(cookies, {
			id: dbUser.id,
			email: dbUser.email,
			namaLengkap: dbUser.namaLengkap,
			role: dbUser.role as Role,
			statusVerifikasi: dbUser.statusVerifikasi as StatusVerifikasi,
			nik: dbUser.nik
		});
	}

	const riwayatSewa = await sewaService.getRiwayatSewaPenyewa(user.id);
	const kendaraanList = await kendaraanRepository.findByPenyewaId(user.id);

	return {
		penyewaUser: user,
		riwayatSewa,
		kendaraanList
	};
};
