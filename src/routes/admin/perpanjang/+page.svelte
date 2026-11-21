<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { formatRupiah, formatDateIndo } from '$lib/utils/format';
	import type { SewaDetail } from '$lib/repositories/interfaces';
	import {
		ClockIcon,
		SearchIcon,
		InfoIcon,
		PhoneIcon,
		PlusIcon,
		XCircleIcon,
		AlertTriangleIcon,
		CheckCircleIcon,
		ArrowRightIcon
	} from '$lib/components/icons';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let searchQuery = $state<string>('');
	let selectedSewa = $state<SewaDetail | null>(null);
	let tanggalSelesaiBaru = $state<string>('');
	let filePreviewUrl = $state<string | null>(null);
	let isSubmitting = $state<boolean>(false);

	let filteredSewa = $derived(
		data.sewaAktifList.filter((s) => {
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				s.garasiId.toLowerCase().includes(q) ||
				s.penyewa.namaLengkap.toLowerCase().includes(q) ||
				s.kendaraan.merekTipe.toLowerCase().includes(q) ||
				(s.kendaraan.nomorPlat && s.kendaraan.nomorPlat.toLowerCase().includes(q))
			);
		})
	);

	function openModal(sewa: SewaDetail) {
		selectedSewa = sewa;
		filePreviewUrl = null;

		// Default tanggal selesai baru: 7 hari setelah tanggal selesai lama
		const curEnd = new Date(sewa.tanggalSelesai);
		const y = curEnd.getUTCFullYear();
		const m = curEnd.getUTCMonth();
		const d = curEnd.getUTCDate();

		const nextWeek = new Date(Date.UTC(y, m, d + 7, 0, 0, 0, 0));
		tanggalSelesaiBaru = nextWeek.toISOString().slice(0, 10);
	}

	function closeModal() {
		selectedSewa = null;
		filePreviewUrl = null;
	}

	function tambahSatuBulan() {
		if (!selectedSewa) return;
		const curEnd = new Date(selectedSewa.tanggalSelesai);
		const y = curEnd.getUTCFullYear();
		const m = curEnd.getUTCMonth();
		const d = curEnd.getUTCDate();

		// Menambahkan 1 bulan penuh secara dinamis
		const nextMonth = new Date(Date.UTC(y, m + 1, d, 0, 0, 0, 0));
		tanggalSelesaiBaru = nextMonth.toISOString().slice(0, 10);
	}

	// Live estimation of tambahan hari & biaya tambahan
	let kalkulasiTambahan = $derived.by(() => {
		if (!selectedSewa || !tanggalSelesaiBaru) {
			return { tambahanHari: 0, estimasiBiaya: 0, isValid: false };
		}

		const curEnd = new Date(selectedSewa.tanggalSelesai);
		const parts = tanggalSelesaiBaru.split('-').map(Number);
		if (parts.length !== 3) return { tambahanHari: 0, estimasiBiaya: 0, isValid: false };

		const [y, m, d] = parts;
		const newEnd = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

		const diffMs = newEnd.getTime() - curEnd.getTime();
		const tambahanHari = Math.round(diffMs / 86_400_000);

		if (tambahanHari <= 0) {
			return { tambahanHari: 0, estimasiBiaya: 0, isValid: false };
		}

		// Hitung biaya tambahan (aturan blok bulan 25x + sisa hari)
		const hargaHarian = selectedSewa.garasi.hargaHarian;
		let totalBiaya = 0;
		let sisaHari = tambahanHari;

		let ptr = new Date(curEnd.getTime());
		while (sisaHari > 0) {
			const daysInCurMonth = new Date(Date.UTC(ptr.getUTCFullYear(), ptr.getUTCMonth() + 1, 0, 0, 0, 0, 0)).getUTCDate();
			if (sisaHari >= daysInCurMonth) {
				totalBiaya += 25 * hargaHarian;
				sisaHari -= daysInCurMonth;
				ptr = new Date(Date.UTC(ptr.getUTCFullYear(), ptr.getUTCMonth() + 1, ptr.getUTCDate(), 0, 0, 0, 0));
			} else {
				totalBiaya += sisaHari * hargaHarian;
				sisaHari = 0;
			}
		}

		return {
			tambahanHari,
			estimasiBiaya: totalBiaya,
			isValid: true
		};
	});

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			filePreviewUrl = URL.createObjectURL(file);
		} else {
			filePreviewUrl = null;
		}
	}
</script>

<svelte:head>
	<title>Perpanjangan Sewa - Admin Garasi Ta</title>
</svelte:head>

<div class="space-y-6">
	<!-- Hero Welcome Banner -->
	<div class="rounded-2xl bg-gradient-to-r from-carbon-black via-gunmetal to-carbon-black text-white p-6 shadow-sm border border-gunmetal/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 text-garage-orange text-xs font-bold mb-2">
				<span class="w-1.5 h-1.5 rounded-full bg-garage-orange"></span>
				<span>Layanan Durasi Fleksibel</span>
			</div>
			<h1 class="text-xl sm:text-2xl font-black text-white tracking-tight">
				Perpanjangan Masa Sewa Aktif
			</h1>
			<p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
				Perpanjang durasi sewa pelanggan secara cepat dengan kalkulasi tarif dinamis (paket blok bulanan 25x + tarif harian).
			</p>
		</div>
	</div>

	<!-- Alert Feedback -->
	{#if form?.error}
		<div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
			<AlertTriangleIcon size={18} class="text-rose-500 shrink-0 mt-0.5" />
			<div>
				<p class="font-bold">Gagal Memperpanjang Sewa</p>
				<p class="text-rose-700 mt-0.5">{form.error}</p>
			</div>
		</div>
	{/if}

	{#if form?.success}
		<div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
			<CheckCircleIcon size={18} class="text-emerald-600 shrink-0 mt-0.5" />
			<div>
				<p class="font-bold">Perpanjangan Berhasil</p>
				<p class="text-emerald-700 mt-0.5">{form.message}</p>
			</div>
		</div>
	{/if}

	<!-- Active Rentals Table Card -->
	<div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
		<!-- Search Bar -->
		<div class="p-4 bg-slate-50/60 border-b border-slate-200/80 flex items-center justify-between gap-4">
			<div class="relative w-full max-w-sm">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari kode garasi, nama penyewa, plat..."
					class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-garage-orange focus:ring-1 focus:ring-garage-orange"
				/>
				<span class="absolute left-3 top-2.5 text-slate-400">
					<SearchIcon size={14} />
				</span>
			</div>
			<div class="text-xs text-slate-500 font-semibold">
				{filteredSewa.length} Transaksi Aktif
			</div>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead class="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200/80">
					<tr>
						<th class="py-3 px-5">Garasi</th>
						<th class="py-3 px-5">Penyewa</th>
						<th class="py-3 px-5">Kendaraan</th>
						<th class="py-3 px-5">Periode Berjalan</th>
						<th class="py-3 px-5">Total Biaya</th>
						<th class="py-3 px-5 text-center">Tindakan</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 font-normal text-slate-800">
					{#if filteredSewa.length === 0}
						<tr>
							<td colspan="6" class="text-center py-12 text-slate-400">
								<div class="flex flex-col items-center justify-center gap-2">
									<InfoIcon size={28} class="text-slate-300" />
									<p class="font-medium text-xs">Tidak ada transaksi sewa aktif hari ini yang ditemukan.</p>
								</div>
							</td>
						</tr>
					{:else}
						{#each filteredSewa as sewa (sewa.id)}
							<tr class="hover:bg-slate-50/80 transition-colors">
								<!-- Garasi Badge -->
								<td class="py-3 px-5">
									<div class="flex items-center gap-2">
										{#if sewa.garasi.tipeGarasi === 'SEPEDA'}
											<span class="px-2 py-0.5 rounded-md text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
												{sewa.garasi.id}
											</span>
										{:else if sewa.garasi.tipeGarasi === 'MOBIL'}
											<span class="px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
												{sewa.garasi.id}
											</span>
										{:else}
											<span class="px-2 py-0.5 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
												{sewa.garasi.id}
											</span>
										{/if}
										<span class="text-[11px] text-slate-500 font-medium">{formatRupiah(sewa.garasi.hargaHarian)}/hari</span>
									</div>
								</td>

								<!-- Penyewa -->
								<td class="py-3 px-5">
									<p class="font-semibold text-slate-900">{sewa.penyewa.namaLengkap}</p>
									<p class="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
										<PhoneIcon size={11} class="text-slate-400" />
										<span>{sewa.penyewa.noTelepon}</span>
									</p>
								</td>

								<!-- Kendaraan -->
								<td class="py-3 px-5 text-xs">
									<p class="font-semibold text-slate-800">{sewa.kendaraan.merekTipe}</p>
									<p class="text-slate-400 text-[11px]">
										{sewa.kendaraan.nomorPlat ? `Plat: ${sewa.kendaraan.nomorPlat}` : 'Tanpa Plat'}
									</p>
								</td>

								<!-- Periode Berjalan -->
								<td class="py-3 px-5 text-xs">
									<p class="font-semibold text-slate-900">
										{formatDateIndo(sewa.tanggalMulai)} - <span class="text-rose-600 font-bold">{formatDateIndo(sewa.tanggalSelesai)}</span>
									</p>
									<p class="text-slate-400 text-[11px] mt-0.5">
										Durasi: <span class="font-bold text-carbon-black">{sewa.jumlahHari} Hari</span>
										{#if sewa.perpanjangan && sewa.perpanjangan.length > 0}
											<span class="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold ml-1">
												+{sewa.perpanjangan.length}x Perpanjang
											</span>
										{/if}
									</p>
								</td>

								<!-- Total Biaya -->
								<td class="py-3 px-5 font-bold text-carbon-black">
									{formatRupiah(sewa.totalBiaya)}
								</td>

								<!-- Aksi Button -->
								<td class="py-3 px-5 text-center">
									<button
										type="button"
										onclick={() => openModal(sewa)}
										class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-garage-orange text-carbon-black hover:bg-garage-orange-hover shadow-xs transition-all cursor-pointer"
									>
										<PlusIcon size={12} />
										<span>Perpanjang</span>
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Modal Perpanjangan Sewa -->
	{#if selectedSewa}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-prussian/60 backdrop-blur-xs">
			<div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
				<div class="flex items-center justify-between pb-3 border-b border-slate-100">
					<div>
						<h2 class="text-lg font-extrabold text-prussian flex items-center gap-2">
							<ClockIcon size={20} class="text-garage-orange" />
							<span>Perpanjang Masa Sewa</span>
						</h2>
						<p class="text-xs text-slate-500 mt-0.5">
							Garasi <span class="font-bold text-prussian">{selectedSewa.garasiId}</span> • Penyewa: <span class="font-bold text-prussian">{selectedSewa.penyewa.namaLengkap}</span>
						</p>
					</div>
					<button
						type="button"
						onclick={closeModal}
						class="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
					>
						<XCircleIcon size={18} />
					</button>
				</div>

				<form
					method="POST"
					action="?/perpanjang"
					enctype="multipart/form-data"
					onsubmit={() => (isSubmitting = true)}
					class="space-y-4"
				>
					<input type="hidden" name="sewaId" value={selectedSewa.id} />

					<!-- Current Expiration Info -->
					<div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
						<div>
							<p class="text-slate-500">Tanggal Selesai Saat Ini:</p>
							<p class="font-bold text-slate-900 text-sm mt-0.5">{formatDateIndo(selectedSewa.tanggalSelesai)}</p>
						</div>
						<div class="text-right">
							<p class="text-slate-500">Tarif Dasar:</p>
							<p class="font-bold text-prussian text-sm mt-0.5">{formatRupiah(selectedSewa.garasi.hargaHarian)} / hari</p>
						</div>
					</div>

					<!-- New End Date Input & Shortcut -->
					<div>
						<div class="flex items-center justify-between mb-1">
							<label for="tanggalSelesaiBaru" class="text-xs font-semibold text-slate-700 uppercase tracking-wider">
								Tanggal Selesai Baru <span class="text-rose-500">*</span>
							</label>
							<button
								type="button"
								onclick={tambahSatuBulan}
								class="text-xs font-bold text-garage-orange-hover hover:underline"
							>
								+1 Bulan Penuh
							</button>
						</div>
						<input
							type="date"
							id="tanggalSelesaiBaru"
							name="tanggalSelesaiBaru"
							bind:value={tanggalSelesaiBaru}
							required
							class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
						/>
					</div>

					<!-- Live Cost Calculation Card -->
					{#if kalkulasiTambahan.isValid}
						<div class="p-4 rounded-2xl bg-prussian text-white space-y-2">
							<div class="flex items-center justify-between text-xs text-slate-300">
								<span>Durasi Tambahan:</span>
								<span class="font-bold text-white text-sm">+{kalkulasiTambahan.tambahanHari} Hari</span>
							</div>
							<div class="pt-2 border-t border-prussian-light flex items-center justify-between">
								<span class="text-xs font-bold text-slate-200">Biaya Tambahan Yang Harus Dibayar:</span>
								<span class="text-xl font-black text-garage-orange">
									{formatRupiah(kalkulasiTambahan.estimasiBiaya)}
								</span>
							</div>
						</div>
					{:else}
						<p class="text-xs text-rose-600 font-medium">
							Tanggal selesai baru harus lebih lambat dari tanggal selesai saat ini ({formatDateIndo(selectedSewa.tanggalSelesai)}).
						</p>
					{/if}

					<!-- File Upload Bukti Bayar -->
					<div>
						<label for="buktiBayar" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
							Bukti Pelunasan Biaya Perpanjangan <span class="text-rose-500">*</span>
						</label>
						<input
							type="file"
							id="buktiBayar"
							name="buktiBayar"
							accept="image/jpeg,image/png,image/webp"
							onchange={handleFileChange}
							required
							class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-prussian file:text-white hover:file:bg-prussian-light cursor-pointer"
						/>

						{#if filePreviewUrl}
							<div class="mt-2">
								<img src={filePreviewUrl} alt="Preview Bukti" class="h-28 rounded-xl border border-slate-200 object-cover" />
							</div>
						{/if}
					</div>

					<!-- Previous Extension History if any -->
					{#if selectedSewa.perpanjangan && selectedSewa.perpanjangan.length > 0}
						<div class="pt-2 border-t border-slate-100">
							<p class="text-xs font-bold text-slate-700 mb-2">Riwayat Perpanjangan Sebelumnya:</p>
							<div class="space-y-1 max-h-24 overflow-y-auto text-xs text-slate-600">
								{#each selectedSewa.perpanjangan as p (p.id)}
									<div class="flex items-center justify-between p-2 rounded bg-slate-50">
										<span>+{p.tambahanHari} hari ({formatDateIndo(p.tanggalSelesaiBaru)})</span>
										<span class="font-semibold text-prussian">{formatRupiah(p.biayaTambahan)}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Action Buttons -->
					<div class="flex items-center justify-end gap-3 pt-3">
						<button
							type="button"
							onclick={closeModal}
							class="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={isSubmitting || !kalkulasiTambahan.isValid}
							class="px-5 py-2.5 rounded-xl text-sm font-bold text-prussian bg-garage-orange hover:bg-garage-orange-hover shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? 'Menyimpan...' : 'Simpan Perpanjangan Sewa'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
