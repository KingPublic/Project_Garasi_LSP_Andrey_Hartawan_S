/**
 * Utilitas format angka dan mata uang rupiah.
 */

/**
 * Memformat angka menjadi format Rupiah Indonesia, misalnya "Rp 250.000".
 *
 * @param amount nominal angka
 * @returns teks berformat Rupiah
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
 * Memformat tanggal ke format lokal Indonesia, misalnya "21 Nov 2026".
 *
 * @param date objek Date atau string tanggal
 * @returns teks tanggal Indonesia
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
