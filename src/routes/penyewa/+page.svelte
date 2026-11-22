<script lang="ts">
	import type { PageData } from './$types';
	import { formatRupiah, formatDateIndo } from '$lib/utils/format';
	import {
		ShieldCheckIcon,
		ClockIcon,
		XCircleIcon,
		PlusIcon,
		CheckCircleIcon,
		FileTextIcon,
		CarIcon,
		BikeIcon,
		ZapIcon,
		InfoIcon
	} from '$lib/components/icons';

	let { data }: { data: PageData } = $props();

	const sewaAktifCount = $derived(
		data.riwayatSewa.filter((s) => s.statusSewa === 'AKTIF').length
	);

	const sewaPendingCount = $derived(
		data.riwayatSewa.filter((s) => s.statusSewa === 'MENUNGGU_VERIFIKASI').length
	);
</script>

<svelte:head>
	<title>Dashboard Penyewa - Garasi Ta</title>
</svelte:head>

<div class="space-y-6">
	<!-- Top Welcome & Verification Banner -->
	{#if data.penyewaUser.statusVerifikasi === 'APPROVED'}
		<div class="rounded-2xl bg-gradient-to-r from-carbon-black via-gunmetal to-carbon-black text-white p-6 shadow-sm border border-gunmetal/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div class="flex items-start gap-4">
				<div class="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
					<ShieldCheckIcon size={24} />
				</div>
				<div>
					<div class="flex items-center gap-2">
						<h1 class="text-xl sm:text-2xl font-black text-white">
							Halo, {data.penyewaUser.namaLengkap}!
						</h1>
						<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
							Terverifikasi
						</span>
					</div>
					<p class="text-xs sm:text-sm text-slate-300 mt-1">
						NIK: <span class="font-mono font-semibold text-white">{data.penyewaUser.nik}</span> • Akun Anda aktif dan siap melakukan transaksi sewa garasi kapan saja.
					</p>
				</div>
			</div>
			<div>
				<a
					href="/penyewa/sewa-baru"
					class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-garage-orange text-carbon-black hover:bg-garage-orange-hover shadow-md transition-all cursor-pointer shrink-0"
				>
					<PlusIcon size={15} />
					<span>Sewa Garasi Baru</span>
				</a>
			</div>
		</div>
	{:else if data.penyewaUser.statusVerifikasi === 'PENDING'}
		<div class="rounded-2xl bg-amber-500/10 border border-garage-orange/40 p-6 shadow-xs flex items-start gap-4">
			<div class="w-10 h-10 rounded-xl bg-amber-100 text-garage-orange flex items-center justify-center shrink-0">
				<ClockIcon size={22} />
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h1 class="text-lg sm:text-xl font-bold text-carbon-black">
						Halo, {data.penyewaUser.namaLengkap}
					</h1>
					<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
						Menunggu Verifikasi Admin
					</span>
				</div>
				<p class="text-xs text-slate-600 mt-1">
					Pendaftaran NIK <span class="font-mono font-semibold">{data.penyewaUser.nik}</span> sedang dalam proses verifikasi identitas. Anda dapat mulai menyewa garasi setelah akun disetujui (Approved).
				</p>
			</div>
		</div>
	{:else}
		<div class="rounded-2xl bg-rose-50 border border-rose-200 p-6 shadow-xs flex items-start gap-4">
			<div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
				<XCircleIcon size={22} />
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h1 class="text-lg sm:text-xl font-bold text-rose-900">
						Halo, {data.penyewaUser.namaLengkap}
					</h1>
					<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
						Verifikasi Ditolak
					</span>
				</div>
				<p class="text-xs text-rose-800 mt-1">
					Pendaftaran identitas Anda ditolak. Silakan hubungi administrator untuk pengecekan data NIK Anda.
				</p>
			</div>
		</div>
	{/if}

	<!-- Banner Notifikasi Menunggu Verifikasi Pembayaran -->
	{#if sewaPendingCount > 0}
		<div class="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-amber-900 flex items-center justify-between gap-3 shadow-xs">
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
					<ClockIcon size={18} />
				</div>
				<div>
					<p class="text-xs font-bold text-amber-950">
						{sewaPendingCount} Transaksi Sewa Menunggu Verifikasi Pembayaran
					</p>
					<p class="text-[11px] text-amber-800">
						Admin sedang memeriksa bukti transfer Anda. Status garasi akan otomatis aktif setelah pembayaran disetujui.
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Quick KPI Metrics -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sewa Aktif Saat Ini</p>
				<div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
					<CheckCircleIcon size={16} />
				</div>
			</div>
			<p class="text-2xl font-black text-carbon-black mt-2">
				{sewaAktifCount} <span class="text-xs font-normal text-slate-400">Unit</span>
			</p>
			<p class="text-[11px] text-emerald-600 mt-1 font-medium">Sedang digunakan</p>
		</div>

		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Transaksi Sewa</p>
				<div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
					<FileTextIcon size={16} />
				</div>
			</div>
			<p class="text-2xl font-black text-carbon-black mt-2">
				{data.riwayatSewa.length} <span class="text-xs font-normal text-slate-400">Riwayat</span>
			</p>
			<p class="text-[11px] text-slate-400 mt-1">Termasuk sewa yang selesai</p>
		</div>

		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kendaraan Terdaftar</p>
				<div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
					<CarIcon size={16} />
				</div>
			</div>
			<p class="text-2xl font-black text-carbon-black mt-2">
				{data.kendaraanList.length} <span class="text-xs font-normal text-slate-400">Unit</span>
			</p>
			<p class="text-[11px] text-slate-400 mt-1">Sepeda / Motor / Mobil / EV</p>
		</div>
	</div>

	<!-- Riwayat Transaksi Sewa -->
	<div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
		<div class="p-5 border-b border-slate-100 flex items-center justify-between">
			<div>
				<h2 class="text-base font-bold text-carbon-black flex items-center gap-2">
					<FileTextIcon size={18} class="text-carbon-black" />
					<span>Riwayat Transaksi Sewa Garasi Anda</span>
				</h2>
				<p class="text-xs text-slate-500 mt-0.5">
					Seluruh transaksi sewa garasi dan rincian biaya pengisian baterai transparan tanpa biaya tersembunyi.
				</p>
			</div>
			{#if data.penyewaUser.statusVerifikasi === 'APPROVED'}
				<a
					href="/penyewa/sewa-baru"
					class="text-xs font-bold text-garage-orange hover:underline flex items-center gap-1"
				>
					<span>+ Sewa Baru &rarr;</span>
				</a>
			{/if}
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead class="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200/80">
					<tr>
						<th class="py-3 px-5">Garasi</th>
						<th class="py-3 px-5">Kendaraan</th>
						<th class="py-3 px-5">Periode & Durasi</th>
						<th class="py-3 px-5">Paket</th>
						<th class="py-3 px-5">Total Biaya</th>
						<th class="py-3 px-5">Bukti</th>
						<th class="py-3 px-5">Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 font-normal text-slate-800">
					{#if data.riwayatSewa.length === 0}
						<tr>
							<td colspan="7" class="text-center py-12 text-slate-400">
								<div class="flex flex-col items-center justify-center gap-2">
									<CarIcon size={28} class="text-slate-300" />
									<p class="font-medium text-xs">Anda belum memiliki riwayat transaksi sewa garasi.</p>
									{#if data.penyewaUser.statusVerifikasi === 'APPROVED'}
										<a
											href="/penyewa/sewa-baru"
											class="mt-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-garage-orange text-carbon-black hover:bg-garage-orange-hover shadow-xs"
										>
											Mulai Sewa Sekarang
										</a>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						{#each data.riwayatSewa as sewa (sewa.id)}
							<tr class="hover:bg-slate-50/80 transition-colors">
								<!-- Garasi with Color Indicators -->
								<td class="py-3 px-5">
									<div class="flex items-center gap-2">
										{#if sewa.garasi.tipeGarasi === 'SEPEDA'}
											<span class="px-2 py-0.5 rounded-md text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
												{sewa.garasi.id}
											</span>
											<span class="text-[11px] text-slate-500">Sepeda</span>
										{:else if sewa.garasi.tipeGarasi === 'MOBIL'}
											<span class="px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
												{sewa.garasi.id}
											</span>
											<span class="text-[11px] text-slate-500">Mobil</span>
										{:else}
											<span class="px-2 py-0.5 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
												{sewa.garasi.id}
											</span>
											<span class="text-[11px] text-emerald-700 font-medium">EV Listrik</span>
										{/if}
									</div>
								</td>

								<!-- Kendaraan -->
								<td class="py-3 px-5">
									<p class="font-semibold text-slate-900">{sewa.kendaraan.merekTipe}</p>
									<p class="text-[11px] text-slate-400">
										{sewa.kendaraan.nomorPlat ? `Plat: ${sewa.kendaraan.nomorPlat}` : 'Tanpa Plat'}
										{#if sewa.kendaraan.kapasitasBateraiKwh}
											• {sewa.kendaraan.kapasitasBateraiKwh} kWh
										{/if}
									</p>
								</td>

								<!-- Periode & Durasi -->
								<td class="py-3 px-5 text-xs">
									<p class="font-semibold text-slate-800">
										{formatDateIndo(sewa.tanggalMulai)} - {formatDateIndo(sewa.tanggalSelesai)}
									</p>
									<p class="text-slate-400 text-[11px] mt-0.5">
										Durasi: <span class="font-bold text-carbon-black">{sewa.jumlahHari} Hari</span>
									</p>
								</td>

								<!-- Tipe Sewa -->
								<td class="py-3 px-5">
									<span class="px-2 py-0.5 rounded-md text-xs font-semibold {sewa.tipeSewa === 'BULANAN' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}">
										{sewa.tipeSewa}
									</span>
								</td>

								<!-- Total Biaya & Rincian -->
								<td class="py-3 px-5">
									<p class="font-extrabold text-carbon-black">{formatRupiah(sewa.totalBiaya)}</p>
									{#if sewa.biayaListrik && sewa.biayaListrik > 0}
										<p class="text-[10px] text-emerald-700 mt-0.5">
											(Sewa: {formatRupiah(sewa.biayaSewa)} + Listrik: {formatRupiah(sewa.biayaListrik)})
										</p>
									{/if}
								</td>

								<!-- Bukti Bayar -->
								<td class="py-3 px-5 text-xs">
									<a
										href={sewa.buktiBayarPath}
										target="_blank"
										rel="noreferrer"
										class="inline-flex items-center gap-1.5 text-carbon-black hover:text-garage-orange underline font-medium text-[11px]"
									>
										<FileTextIcon size={12} />
										<span>Lihat Bukti</span>
									</a>
								</td>

								<!-- Status Sewa -->
								<td class="py-3 px-5">
									{#if sewa.statusSewa === 'MENUNGGU_VERIFIKASI'}
										<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
											<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
											Menunggu Verifikasi
										</span>
									{:else if sewa.statusSewa === 'AKTIF'}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
											<span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Aktif
										</span>
									{:else if sewa.statusSewa === 'DITOLAK'}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
											<span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Ditolak
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
											Selesai
										</span>
									{/if}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Kendaraan Saya Section -->
	<div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
		<h2 class="text-base font-bold text-carbon-black flex items-center gap-2 mb-2">
			<CarIcon size={18} class="text-carbon-black" />
			<span>Kendaraan Terdaftar Milik Anda</span>
		</h2>
		<p class="text-xs text-slate-500 mb-4">
			Data kendaraan yang pernah Anda gunakan saat menyewa garasi. Anda dapat menggunakannya kembali saat membuat sewa baru.
		</p>

		{#if data.kendaraanList.length === 0}
			<p class="text-xs text-slate-400 italic">Belum ada kendaraan yang tersimpan di sistem.</p>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each data.kendaraanList as k (k.id)}
					<div class="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
						<div class="flex items-center justify-between">
							<span class="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700">
								{#if k.tipeKendaraan === 'SEPEDA'}
									<BikeIcon size={16} class="text-sky-600" />
								{:else if k.tipeKendaraan === 'SEPEDA_MOTOR'}
									<BikeIcon size={16} class="text-sky-700" />
								{:else if k.tipeKendaraan === 'MOBIL'}
									<CarIcon size={16} class="text-amber-600" />
								{:else}
									<ZapIcon size={16} class="text-emerald-600" />
								{/if}
							</span>
							<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
								{k.tipeKendaraan}
							</span>
						</div>
						<p class="font-bold text-slate-900 mt-2 text-xs">{k.merekTipe}</p>
						<p class="text-[11px] text-slate-500 font-mono mt-0.5">
							{k.nomorPlat ? `Plat: ${k.nomorPlat}` : 'Tanpa nomor plat'}
						</p>
						{#if k.kapasitasBateraiKwh}
							<p class="text-[10px] text-emerald-700 font-semibold mt-1">
								Baterai: {k.kapasitasBateraiKwh} kWh
							</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
