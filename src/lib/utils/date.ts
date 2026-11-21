/**
 * Utilitas tanggal berbasis UTC date-only.
 * Menyamakan zona waktu lokal (WITA UTC+8) dengan PostgreSQL (UTC) agar tanggal tidak bergeser 1 hari.
 */

/**
 * Mengonversi tanggal ke Date UTC pukul 00:00:00.000Z.
 * Menghilangkan komponen jam untuk mencegah selisih tanggal antar zona waktu.
 *
 * @param date objek Date atau string tanggal (misal '2026-11-21')
 * @returns objek Date pada pukul 00:00:00.000 UTC
 */
export function normalizeToUtcDate(date: Date | string): Date {
	if (typeof date === 'string') {
		const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
		if (match) {
			const year = parseInt(match[1], 10);
			const month = parseInt(match[2], 10) - 1;
			const day = parseInt(match[3], 10);
			return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
		}
		const parsed = new Date(date);
		if (isNaN(parsed.getTime())) {
			throw new Error(`Format tanggal string tidak valid: ${date}`);
		}
		return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 0, 0, 0, 0));
	}

	if (isNaN(date.getTime())) {
		throw new Error('Objek Date tidak valid (Invalid Date).');
	}

	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Membuat objek Date UTC date-only dari tahun, bulan (1-12), dan hari.
 *
 * @param year tahun (misal: 2026)
 * @param month bulan 1-12 (1 untuk Januari)
 * @param day tanggal (1-31)
 * @returns objek Date pukul 00:00:00.000 UTC
 */
export function createUtcDate(year: number, month: number, day: number): Date {
	if (month < 1 || month > 12) {
		throw new Error(`Bulan harus antara 1 dan 12, diterima: ${month}`);
	}
	return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Mendapatkan tanggal hari ini dalam format UTC date-only (00:00:00.000Z).
 */
export function getTodayUtcDate(): Date {
	const now = new Date();
	return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
}

/**
 * Menghitung jumlah hari dalam bulan kalender (28, 29, 30, atau 31).
 * Mengisi tanggal 0 di bulan berikutnya otomatis mundur ke tanggal terakhir bulan berjalan,
 * sehingga langsung menangani tahun kabisat tanpa if-else manual.
 *
 * @param date tanggal acuan
 * @returns jumlah hari dalam bulan tersebut
 */
export function getDaysInMonth(date: Date | string): number {
	const utc = normalizeToUtcDate(date);
	// Tanggal 0 di bulan berikutnya otomatis menghasilkan hari terakhir bulan berjalan
	return new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth() + 1, 0, 0, 0, 0, 0)).getUTCDate();
}

/**
 * Menambahkan sejumlah hari ke tanggal acuan berbasis UTC.
 *
 * @param date tanggal awal
 * @param days jumlah hari yang ditambahkan
 * @returns tanggal baru
 */
export function addDays(date: Date | string, days: number): Date {
	const utc = normalizeToUtcDate(date);
	return new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate() + days, 0, 0, 0, 0));
}

/**
 * Menambahkan sejumlah bulan ke tanggal acuan berbasis UTC.
 *
 * @param date tanggal awal
 * @param months jumlah bulan yang ditambahkan
 * @returns tanggal baru
 */
export function addMonths(date: Date | string, months: number): Date {
	const utc = normalizeToUtcDate(date);
	return new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth() + months, utc.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Menghitung selisih hari antara dua tanggal.
 *
 * @param startDate tanggal awal
 * @param endDate tanggal akhir
 * @returns selisih hari (positif jika endDate > startDate)
 */
export function diffDays(startDate: Date | string, endDate: Date | string): number {
	const start = normalizeToUtcDate(startDate);
	const end = normalizeToUtcDate(endDate);
	const diffMs = end.getTime() - start.getTime();
	return Math.round(diffMs / 86_400_000);
}

/**
 * Memeriksa apakah tanggal berada di masa lalu dibanding tanggal acuan.
 *
 * @param date tanggal yang diperiksa
 * @param referenceDate tanggal acuan (default: hari ini UTC)
 * @returns true jika tanggal berada di masa lalu
 */
export function isPastDate(date: Date | string, referenceDate?: Date | string): boolean {
	const target = normalizeToUtcDate(date);
	const ref = referenceDate ? normalizeToUtcDate(referenceDate) : getTodayUtcDate();
	return target.getTime() < ref.getTime();
}

/**
 * Memformat tanggal ke string standar ISO 'YYYY-MM-DD'.
 */
export function formatDateIso(date: Date | string): string {
	const utc = normalizeToUtcDate(date);
	return utc.toISOString().slice(0, 10);
}
