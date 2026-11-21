/**
 * @file upload.ts
 * @description Modul helper untuk menangani penyimpanan file gambar bukti pelunasan bayar
 * ke direktori static/uploads/ dan menghasilkan path relatif untuk disimpan di basis data.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const UPLOAD_DIR = join(process.cwd(), 'static', 'uploads');
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Megabytes
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Menyimpan file gambar bukti bayar ke direktori static/uploads/.
 *
 * @function saveUploadFile
 * @param {File | Blob} file - Objek file yang diunggah dari form HTML.
 * @returns {Promise<string>} Path publik file relatif terhadap web root, e.g. "/uploads/abc-123.jpg".
 * @throws {Error} Jika file kosong, melebihi ukuran batas, atau ekstensinya tidak diizinkan.
 */
export async function saveUploadFile(file: File | Blob): Promise<string> {
	if (!file || !(file instanceof Blob) || file.size === 0) {
		throw new Error('File bukti bayar tidak boleh kosong.');
	}

	if (file.size > MAX_FILE_SIZE_BYTES) {
		throw new Error(
			`Ukuran file bukti bayar melebihi batas maksimal 5MB. Ukuran saat ini: ${(file.size / 1024 / 1024).toFixed(2)}MB.`
		);
	}

	const originalName = file instanceof File ? file.name : 'bukti.jpg';
	const ext = extname(originalName).toLowerCase() || '.jpg';

	if (!ALLOWED_EXTENSIONS.includes(ext)) {
		throw new Error(
			`Format file tidak didukung: '${ext}'. Hanya format ${ALLOWED_EXTENSIONS.join(', ')} yang diperbolehkan.`
		);
	}

	if (!existsSync(UPLOAD_DIR)) {
		mkdirSync(UPLOAD_DIR, { recursive: true });
	}

	const uniqueFileName = `${randomUUID()}${ext}`;
	const targetFilePath = join(UPLOAD_DIR, uniqueFileName);

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	writeFileSync(targetFilePath, buffer);

	return `/uploads/${uniqueFileName}`;
}
