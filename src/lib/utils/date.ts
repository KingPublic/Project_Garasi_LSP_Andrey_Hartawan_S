/**
 * @file date.ts
 * @description Modul utilitas penanganan tanggal berbasis UTC date-only.
 * Mencegah bug pergeseran tanggal (off-by-one day) akibat perbedaan zona waktu (WITA UTC+8 vs PostgreSQL UTC).
 */

/**
 * Mengonversi objek Date atau string tanggal (YYYY-MM-DD / ISO) menjadi Date murni UTC pada pukul 00:00:00.000Z.
 *
 * @function normalizeToUtcDate
 * @param {Date | string} date - Objek Date atau representasi string tanggal (e.g. '2026-11-21').
 * @returns {Date} Objek Date dengan jam 00:00:00.000 dalam zona waktu UTC.
 * @throws {Error} Jika string tanggal tidak valid.
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
 * Membuat objek Date UTC date-only berdasarkan komponen tahun, bulan (1-indexed), dan hari.
 *
 * @function createUtcDate
 * @param {number} year - Tahun (misal: 2026).
 * @param {number} month - Bulan 1-indexed (1 untuk Januari, 12 untuk Desember).
 * @param {number} day - Hari/tanggal (1-31).
 * @returns {Date} Objek Date tepat pukul 00:00:00.000 UTC.
 */
export function createUtcDate(year: number, month: number, day: number): Date {
	if (month < 1 || month > 12) {
		throw new Error(`Bulan harus antara 1 dan 12, diterima: ${month}`);
	}
	return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Mendapatkan tanggal hari ini yang telah dinormalisasi ke UTC date-only pukul 00:00:00.000Z.
 *
 * @function getTodayUtcDate
 * @returns {Date} Tanggal hari ini dalam format UTC date-only.
 */
export function getTodayUtcDate(): Date {
	const now = new Date();
	return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
}

/**
 * Menghitung jumlah hari dinamis dalam bulan berjalan dari tanggal yang diberikan,
 * memperhitungkan tahun kabisat (misal: Feb 2026 = 28, Feb 2028 = 29, Nov = 30, Des = 31).
 *
 * @function getDaysInMonth
 * @param {Date | string} date - Tanggal acuan.
 * @returns {number} Jumlah hari aktual dalam bulan tersebut (28, 29, 30, atau 31).
 */
export function getDaysInMonth(date: Date | string): number {
	const utc = normalizeToUtcDate(date);
	// Day 0 pada bulan berikutnya mengembalikan hari terakhir bulan berjalan
	return new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth() + 1, 0, 0, 0, 0, 0)).getUTCDate();
}

/**
 * Menambahkan sejumlah hari ke tanggal acuan dalam basis UTC date-only.
 *
 * @function addDays
 * @param {Date | string} date - Tanggal awal.
 * @param {number} days - Jumlah hari yang ingin ditambahkan (bisa positif atau negatif).
 * @returns {Date} Tanggal baru hasil penambahan dalam UTC date-only.
 */
export function addDays(date: Date | string, days: number): Date {
	const utc = normalizeToUtcDate(date);
	return new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate() + days, 0, 0, 0, 0));
}

/**
 * Menambahkan sejumlah bulan ke tanggal acuan dalam basis UTC date-only.
 *
 * @function addMonths
 * @param {Date | string} date - Tanggal awal.
 * @param {number} months - Jumlah bulan yang ingin ditambahkan.
 * @returns {Date} Tanggal baru hasil penambahan dalam UTC date-only.
 */
export function addMonths(date: Date | string, months: number): Date {
	const utc = normalizeToUtcDate(date);
	return new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth() + months, utc.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Menghitung selisih hari murni (integer) antara dua tanggal.
 * Hasil bernilai positif jika endDate > startDate.
 *
 * @function diffDays
 * @param {Date | string} startDate - Tanggal awal.
 * @param {Date | string} endDate - Tanggal akhir.
 * @returns {number} Selisih jumlah hari.
 */
export function diffDays(startDate: Date | string, endDate: Date | string): number {
	const start = normalizeToUtcDate(startDate);
	const end = normalizeToUtcDate(endDate);
	const diffMs = end.getTime() - start.getTime();
	return Math.round(diffMs / 86_400_000);
}

/**
 * Mengecek apakah tanggal yang diberikan berada di masa lalu dibandingkan dengan tanggal acuan (default: hari ini).
 *
 * @function isPastDate
 * @param {Date | string} date - Tanggal yang akan diperiksa.
 * @param {Date | string} [referenceDate] - Tanggal acuan pembanding (opsional, bawaan: hari ini UTC).
 * @returns {boolean} True jika tanggal lebih awal dari tanggal acuan.
 */
export function isPastDate(date: Date | string, referenceDate?: Date | string): boolean {
	const target = normalizeToUtcDate(date);
	const ref = referenceDate ? normalizeToUtcDate(referenceDate) : getTodayUtcDate();
	return target.getTime() < ref.getTime();
}

/**
 * Memformat objek Date ke string standar ISO 'YYYY-MM-DD'.
 *
 * @function formatDateIso
 * @param {Date | string} date - Tanggal yang akan diformat.
 * @returns {string} String representasi tanggal 'YYYY-MM-DD'.
 */
export function formatDateIso(date: Date | string): string {
	const utc = normalizeToUtcDate(date);
	return utc.toISOString().slice(0, 10);
}
