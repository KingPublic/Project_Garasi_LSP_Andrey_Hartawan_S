<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { formatRupiah, formatDateIndo } from '$lib/utils/format';
	import {
		CheckCircleIcon,
		XCircleIcon,
		AlertTriangleIcon,
		ClockIcon,
		FileTextIcon,
		DollarSignIcon,
		InfoIcon,
		CarIcon,
		BikeIcon,
		ZapIcon
	} from '$lib/components/icons';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let selectedBukti = $state<{ url: string; sewaId: number; nama: string; total: number } | null>(null);
	let isProcessingId = $state<number | null>(null);
</script>

<svelte:head>
	<title>Verifikasi Pembayaran Sewa - Garasi Ta</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
		<div>
			<div class="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
				<span>Admin</span>
				<span>/</span>
				<span class="text-carbon-black font-bold">Verifikasi Pembayaran</span>
			</div>
			<h1 class="text-2xl font-black text-carbon-black tracking-tight">
				Verifikasi Pembayaran Sewa
			</h1>
			<p class="text-xs text-slate-500 mt-0.5">
				Tinjau bukti pelunasan transfer bank sebelum masa sewa unit garasi resmi dinyatakan aktif.
			</p>
		</div>
	</div>

	<!-- Alerts -->
	{#if form?.error}
		<div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
			<AlertTriangleIcon size={18} class="text-rose-500 shrink-0 mt-0.5" />
			<div>
				<p class="font-bold">Gagal Memproses Verifikasi</p>
				<p class="text-rose-700 mt-0.5">{form.error}</p>
			</div>
		</div>
	{/if}

	{#if form?.success}
		<div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
			<CheckCircleIcon size={18} class="text-emerald-600 shrink-0 mt-0.5" />
			<div>
				<p class="font-bold">Verifikasi Berhasil</p>
				<p class="text-emerald-700 mt-0.5">{form.message}</p>
			</div>
		</div>
	{/if}

	<!-- Statistics KPI Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<!-- Menunggu Verifikasi -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menunggu Verifikasi</p>
				<div class="w-8 h-8 rounded-xl bg-amber-50 text-garage-orange flex items-center justify-center">
					<ClockIcon size={16} />
				</div>
			</div>
			<p class="text-2xl font-black text-carbon-black mt-2">
				{data.stats.totalPending} <span class="text-xs font-normal text-slate-400">Transaksi</span>
			</p>
			<p class="text-[11px] text-amber-700 mt-1 font-medium">Memerlukan persetujuan Admin</p>
		</div>

		<!-- Nominal Menunggu -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Akumulasi Nominal Pending</p>
				<div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
					<DollarSignIcon size={16} />
				</div>
			</div>
			<p class="text-2xl font-black text-emerald-600 mt-2">
				{formatRupiah(data.stats.totalNominal)}
			</p>
			<p class="text-[11px] text-slate-400 mt-1">Total transfer yang menunggu approval</p>
		</div>

		<!-- Info Ketentuan -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ketentuan Operasional</p>
				<div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
					<InfoIcon size={16} />
				</div>
			</div>
			<p class="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
				Setelah disetujui, status transaksi menjadi <span class="font-bold text-emerald-700">AKTIF</span> dan status garasi disinkronkan otomatis.
			</p>
			<p class="text-[11px] text-slate-400 mt-1">Jika ditolak, jadwal garasi otomatis dibebaskan</p>
		</div>
	</div>

	<!-- Tabel Transaksi Menunggu Verifikasi -->
	<div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
		<div class="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
			<div>
				<h2 class="text-sm font-bold text-carbon-black flex items-center gap-2">
					<FileTextIcon size={16} class="text-garage-orange" />
					<span>Daftar Transaksi Menunggu Verifikasi Pembayaran</span>
				</h2>
				<p class="text-[11px] text-slate-400 mt-0.5">
					Silakan periksa keaslian bukti bayar sebelum menyetujui transaksi.
				</p>
			</div>
			<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
				{data.sewaMenungguList.length} Antrean
			</span>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs text-slate-600">
				<thead class="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
					<tr>
						<th class="py-3 px-5">ID & Garasi</th>
						<th class="py-3 px-5">Data Penyewa</th>
						<th class="py-3 px-5">Kendaraan</th>
						<th class="py-3 px-5">Periode & Durasi</th>
						<th class="py-3 px-5">Total Biaya</th>
						<th class="py-3 px-5 text-center">Bukti Transfer</th>
						<th class="py-3 px-5 text-right">Aksi Keputusan</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 font-normal text-slate-800">
					{#if data.sewaMenungguList.length === 0}
						<tr>
							<td colspan="7" class="text-center py-12 text-slate-400">
								<div class="flex flex-col items-center justify-center gap-2">
									<CheckCircleIcon size={32} class="text-emerald-500" />
									<p class="font-bold text-sm text-slate-700">Semua Pembayaran Telah Terverifikasi</p>
									<p class="text-xs text-slate-400">Saat ini tidak ada antrean transaksi sewa yang menunggu verifikasi.</p>
								</div>
							</td>
						</tr>
					{:else}
						{#each data.sewaMenungguList as sewa (sewa.id)}
							<tr class="hover:bg-slate-50/80 transition-colors">
								<!-- ID & Garasi -->
								<td class="py-3 px-5">
									<div class="flex items-center gap-2">
										<span class="font-mono text-xs text-slate-400 font-bold">#{sewa.id}</span>
										{#if sewa.garasi.tipeGarasi === 'SEPEDA'}
											<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
												{sewa.garasiId}
											</span>
										{:else if sewa.garasi.tipeGarasi === 'MOBIL'}
											<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
												{sewa.garasiId}
											</span>
										{:else}
											<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
												{sewa.garasiId}
											</span>
										{/if}
									</div>
									<p class="text-[10px] text-slate-400 mt-1 capitalize">{sewa.garasi.tipeGarasi.toLowerCase()}</p>
								</td>

								<!-- Data Penyewa -->
								<td class="py-3 px-5">
									<p class="font-bold text-carbon-black text-xs">{sewa.penyewa.namaLengkap}</p>
									<p class="text-[11px] font-mono text-slate-500 mt-0.5">NIK: {sewa.penyewa.nik || '-'}</p>
									<p class="text-[10px] text-slate-400">{sewa.penyewa.noTelepon}</p>
								</td>

								<!-- Kendaraan -->
								<td class="py-3 px-5">
									<div class="flex items-center gap-1.5">
										{#if sewa.kendaraan.tipeKendaraan === 'SEPEDA'}
											<span class="text-sky-600"><BikeIcon size={14} /></span>
										{:else if sewa.kendaraan.tipeKendaraan === 'SEPEDA_MOTOR'}
											<span class="text-sky-600"><BikeIcon size={14} /></span>
										{:else if sewa.kendaraan.tipeKendaraan === 'MOBIL'}
											<span class="text-amber-600"><CarIcon size={14} /></span>
										{:else}
											<span class="text-emerald-600"><ZapIcon size={14} /></span>
										{/if}
										<span class="font-semibold text-slate-900">{sewa.kendaraan.merekTipe}</span>
									</div>
									<p class="text-[11px] font-mono text-slate-500 mt-0.5">
										Plat: {sewa.kendaraan.nomorPlat || '(Tanpa Plat)'}
									</p>
									{#if sewa.kendaraan.kapasitasBateraiKwh}
										<p class="text-[10px] text-emerald-700 font-medium">
											Baterai: {sewa.kendaraan.kapasitasBateraiKwh} kWh
										</p>
									{/if}
								</td>

								<!-- Periode & Durasi -->
								<td class="py-3 px-5">
									<p class="font-semibold text-slate-900">
										{formatDateIndo(sewa.tanggalMulai)} - {formatDateIndo(sewa.tanggalSelesai)}
									</p>
									<p class="text-[11px] text-slate-500 mt-0.5">
										Durasi: <span class="font-bold text-carbon-black">{sewa.jumlahHari} Hari</span>
										<span class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold {sewa.tipeSewa === 'BULANAN' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}">
											{sewa.tipeSewa}
										</span>
									</p>
								</td>

								<!-- Total Biaya -->
								<td class="py-3 px-5">
									<p class="font-black text-carbon-black text-sm">{formatRupiah(sewa.totalBiaya)}</p>
									{#if sewa.biayaListrik > 0}
										<p class="text-[10px] text-emerald-700 mt-0.5">
											(Sewa: {formatRupiah(sewa.biayaSewa)} + Listrik: {formatRupiah(sewa.biayaListrik)})
										</p>
									{/if}
								</td>

								<!-- Bukti Transfer -->
								<td class="py-3 px-5 text-center">
									{#if sewa.buktiBayarPath}
										<button
											type="button"
											onclick={() =>
												(selectedBukti = {
													url: sewa.buktiBayarPath,
													sewaId: sewa.id,
													nama: sewa.penyewa.namaLengkap,
													total: sewa.totalBiaya
												})}
											class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer border border-slate-200"
										>
											<FileTextIcon size={13} class="text-garage-orange" />
											<span>Tinjau Bukti</span>
										</button>
									{:else}
										<span class="text-slate-400 italic text-[11px]">Tidak Ada Bukti</span>
									{/if}
								</td>

								<!-- Aksi Keputusan -->
								<td class="py-3 px-5 text-right">
									<div class="flex items-center justify-end gap-2">
										<!-- Form Setujui -->
										<form method="POST" action="?/setujui" onsubmit={() => (isProcessingId = sewa.id)}>
											<input type="hidden" name="sewaId" value={sewa.id} />
											<button
												type="submit"
												disabled={isProcessingId === sewa.id}
												class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all cursor-pointer disabled:opacity-60"
											>
												<CheckCircleIcon size={14} />
												<span>Setujui</span>
											</button>
										</form>

										<!-- Form Tolak -->
										<form
											method="POST"
											action="?/tolak"
											onsubmit={(e) => {
												if (!confirm(`Yakin ingin menolak pembayaran sewa #${sewa.id} milik ${sewa.penyewa.namaLengkap}? Unit garasi ${sewa.garasiId} akan langsung dibebaskan.`)) {
													e.preventDefault();
												} else {
													isProcessingId = sewa.id;
												}
											}}
										>
											<input type="hidden" name="sewaId" value={sewa.id} />
											<button
												type="submit"
												disabled={isProcessingId === sewa.id}
												class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer disabled:opacity-60"
											>
												<XCircleIcon size={14} />
												<span>Tolak</span>
											</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Modal Pratinjau Bukti Pembayaran -->
{#if selectedBukti}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<div>
					<h3 class="text-sm font-bold text-carbon-black">
						Bukti Pembayaran Sewa #{selectedBukti.sewaId}
					</h3>
					<p class="text-[11px] text-slate-500">
						Penyewa: {selectedBukti.nama} • Tagihan: <span class="font-bold text-emerald-600">{formatRupiah(selectedBukti.total)}</span>
					</p>
				</div>
				<button
					type="button"
					onclick={() => (selectedBukti = null)}
					class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
					aria-label="Tutup Pratinjau"
				>
					<XCircleIcon size={20} />
				</button>
			</div>

			<div class="flex items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-200/80 max-h-[60vh] overflow-auto">
				{#if selectedBukti.url.toLowerCase().endsWith('.pdf')}
					<div class="text-center py-8">
						<FileTextIcon size={48} class="text-slate-400 mx-auto mb-2" />
						<p class="text-xs text-slate-600 font-medium">Dokumen Bukti Transfer PDF</p>
						<a
							href={selectedBukti.url}
							target="_blank"
							rel="noreferrer"
							class="mt-3 inline-block px-4 py-2 rounded-xl text-xs font-bold text-white bg-prussian hover:bg-prussian-light"
						>
							Buka Dokumen PDF di Tab Baru
						</a>
					</div>
				{:else}
					<img
						src={selectedBukti.url}
						alt="Bukti Transfer Sewa"
						class="max-h-[50vh] w-auto object-contain rounded-lg shadow-xs"
					/>
				{/if}
			</div>

			<div class="flex items-center justify-between pt-2">
				<a
					href={selectedBukti.url}
					target="_blank"
					rel="noreferrer"
					class="text-xs font-semibold text-garage-orange hover:underline inline-flex items-center gap-1"
				>
					Buka File Asli di Tab Baru
				</a>
				<button
					type="button"
					onclick={() => (selectedBukti = null)}
					class="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}
