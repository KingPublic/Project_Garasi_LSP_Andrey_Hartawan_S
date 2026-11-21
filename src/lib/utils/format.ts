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
