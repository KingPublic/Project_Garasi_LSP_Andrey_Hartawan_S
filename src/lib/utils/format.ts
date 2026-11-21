/**
 * @file format.ts
 * @description Modul utilitas untuk formatting angka dan mata uang rupiah.
 */

/**
 * Memformat angka nominal menjadi representasi string Rupiah standar Indonesia.
 *
 * @function formatRupiah
 * @param {number} amount - Nominal angka yang ingin diformat.
 * @returns {string} String berformat Rupiah, e.g. "Rp 250.000".
 */
export function formatRupiah(amount: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

/**
 * Memformat objek Date atau string tanggal menjadi format tanggal lokal Indonesia (e.g. "21 Nov 2026").
 *
 * @function formatDateIndo
 * @param {Date | string} date - Tanggal yang ingin diformat.
 * @returns {string} String representasi tanggal lokal Indonesia.
 */
export function formatDateIndo(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(d.getTime())) return '-';
	return new Intl.DateTimeFormat('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(d);
}
