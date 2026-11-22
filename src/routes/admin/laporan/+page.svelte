<script lang="ts">
	import type { PageData } from './$types';
	import { formatRupiah, formatDateIndo } from '$lib/utils/format';
	import {
		FileTextIcon,
		PrinterIcon,
		DollarSignIcon,
		BuildingIcon,
		ShieldCheckIcon,
		ClockIcon,
		InfoIcon
	} from '$lib/components/icons';

	let { data }: { data: PageData } = $props();

	const daftarBulan = [
		{ no: 1, nama: 'Januari' },
		{ no: 2, nama: 'Februari' },
		{ no: 3, nama: 'Maret' },
		{ no: 4, nama: 'April' },
		{ no: 5, nama: 'Mei' },
		{ no: 6, nama: 'Juni' },
		{ no: 7, nama: 'Juli' },
		{ no: 8, nama: 'Agustus' },
		{ no: 9, nama: 'September' },
		{ no: 10, nama: 'Oktober' },
		{ no: 11, nama: 'November' },
		{ no: 12, nama: 'Desember' }
	];

	function printReport() {
		window.print();
	}
</script>

<svelte:head>
	<title>Laporan Persewaan & Keuangan - Admin Garasi Ta</title>
</svelte:head>

<div class="space-y-6">
	<!-- Hero Welcome Banner with Print Button -->
	<div class="rounded-2xl bg-gradient-to-r from-carbon-black via-gunmetal to-carbon-black text-white p-6 shadow-sm border border-gunmetal/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 text-garage-orange text-xs font-bold mb-2">
				<span class="w-1.5 h-1.5 rounded-full bg-garage-orange"></span>
				<span>Laporan Keuangan & Performa</span>
			</div>
			<h1 class="text-xl sm:text-2xl font-black text-white tracking-tight">
				Laporan Persewaan & Keuangan
			</h1>
			<p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
				Rekapitulasi omzet dan rincian transaksi persewaan garasi dengan 4 dimensi filter komprehensif.
			</p>
		</div>

		<button
			type="button"
			onclick={printReport}
			class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white text-carbon-black hover:bg-slate-100 shadow-sm transition-all cursor-pointer print:hidden shrink-0"
		>
			<PrinterIcon size={15} />
			<span>Cetak / Simpan PDF</span>
		</button>
	</div>

	<!-- Ringkasan Statistik Dashboard -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
		<!-- Omzet Bulan Ini -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Omzet Bulan Ini</p>
				<div class="w-8 h-8 rounded-xl bg-amber-50 text-garage-orange flex items-center justify-center">
					<DollarSignIcon size={16} />
				</div>
			</div>
			<p class="text-xl sm:text-2xl font-black text-carbon-black mt-2">
				{formatRupiah(data.ringkasanDashboard.totalOmzetBulanIni)}
			</p>
			<p class="text-[11px] text-slate-400 mt-1">
				{data.ringkasanDashboard.totalTransaksiBulanIni} Transaksi sukses
			</p>
		</div>

		<!-- Okupansi Unit -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Okupansi Unit</p>
				<div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
					<BuildingIcon size={16} />
				</div>
			</div>
			<p class="text-xl sm:text-2xl font-black text-slate-800 mt-2">
				{data.ringkasanDashboard.garasiUsed} / {data.ringkasanDashboard.totalGarasi} <span class="text-xs font-normal text-slate-400">Unit</span>
			</p>
			<p class="text-[11px] text-emerald-600 mt-1 font-medium">
				{data.ringkasanDashboard.garasiAvailable} Unit siap disewa
			</p>
		</div>

		<!-- Penyewa Aktif -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penyewa Aktif</p>
				<div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
					<ShieldCheckIcon size={16} />
				</div>
			</div>
			<p class="text-xl sm:text-2xl font-black text-emerald-600 mt-2">
				{data.ringkasanDashboard.totalPenyewaApproved} <span class="text-xs font-normal text-slate-400">Orang</span>
			</p>
			<p class="text-[11px] text-emerald-600 mt-1 font-medium">Status Approved</p>
		</div>

		<!-- Antrean NIK -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Antrean Review</p>
				<div class="w-8 h-8 rounded-xl bg-amber-50 text-garage-orange flex items-center justify-center">
					<ClockIcon size={16} />
				</div>
			</div>
			<p class="text-xl sm:text-2xl font-black text-garage-orange mt-2">
				{data.ringkasanDashboard.totalCalonPenyewaPending} <span class="text-xs font-normal text-slate-400">Orang</span>
			</p>
			<p class="text-[11px] text-amber-700 mt-1 font-medium">Menunggu verifikasi</p>
		</div>
	</div>

	<!-- 4 Dimensi Filter Tabs (print:hidden) -->
	<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 print:hidden">
		<div class="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
			<a
				href="/admin/laporan?mode=bulan&tahun={data.filter.tahun}&bulan={data.filter.bulan}"
				class="px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 {data.filter.mode === 'bulan' ? 'bg-prussian text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
			>
				1. Laporan Per Bulan
			</a>
			<a
				href="/admin/laporan?mode=hari&tanggal={data.filter.tanggal}"
				class="px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 {data.filter.mode === 'hari' ? 'bg-prussian text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
			>
				2. Laporan Per Hari
			</a>
			<a
				href="/admin/laporan?mode=tipe&tipeGarasi={data.filter.tipeGarasi}"
				class="px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 {data.filter.mode === 'tipe' ? 'bg-prussian text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
			>
				3. Laporan Per Tipe Garasi
			</a>
			<a
				href="/admin/laporan?mode=penyewa&penyewaId={data.filter.penyewaId}"
				class="px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 {data.filter.mode === 'penyewa' ? 'bg-prussian text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
			>
				4. Laporan Per Penyewa
			</a>
		</div>

		<!-- Filter Inputs Form -->
		<form method="GET" action="/admin/laporan" class="flex flex-wrap items-end gap-3">
			<input type="hidden" name="mode" value={data.filter.mode} />

			{#if data.filter.mode === 'bulan'}
				<div>
					<label for="bulan" class="block text-xs font-semibold text-slate-600 uppercase mb-1">Pilih Bulan</label>
					<select
						id="bulan"
						name="bulan"
						value={data.filter.bulan}
						class="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
					>
						{#each daftarBulan as b}
							<option value={b.no}>{b.nama}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="tahun" class="block text-xs font-semibold text-slate-600 uppercase mb-1">Tahun</label>
					<input
						type="number"
						id="tahun"
						name="tahun"
						value={data.filter.tahun}
						class="w-24 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
					/>
				</div>
			{:else if data.filter.mode === 'hari'}
				<div>
					<label for="tanggal" class="block text-xs font-semibold text-slate-600 uppercase mb-1">Pilih Tanggal</label>
					<input
						type="date"
						id="tanggal"
						name="tanggal"
						value={data.filter.tanggal}
						class="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
					/>
				</div>
			{:else if data.filter.mode === 'tipe'}
				<div>
					<label for="tipeGarasi" class="block text-xs font-semibold text-slate-600 uppercase mb-1">Kategori Garasi</label>
					<select
						id="tipeGarasi"
						name="tipeGarasi"
						value={data.filter.tipeGarasi}
						class="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
					>
						<option value="SEPEDA">Sepeda & Sepeda Motor (S)</option>
						<option value="MOBIL">Mobil Konvensional (C)</option>
						<option value="MOBIL_LISTRIK">Mobil Listrik EV (E)</option>
					</select>
				</div>
			{:else if data.filter.mode === 'penyewa'}
				<div class="min-w-64">
					<label for="penyewaId" class="block text-xs font-semibold text-slate-600 uppercase mb-1">Pilih Penyewa</label>
					<select
						id="penyewaId"
						name="penyewaId"
						value={data.filter.penyewaId}
						class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
					>
						{#each data.calonPenyewaList as p}
							<option value={p.id}>
								{p.namaLengkap} (NIK: {p.nik})
							</option>
						{/each}
					</select>
				</div>
			{/if}

			<button
				type="submit"
				class="px-4 py-2 rounded-xl text-xs font-bold text-prussian bg-garage-orange hover:bg-garage-orange-hover shadow-sm transition-all cursor-pointer"
			>
				Terapkan Filter
			</button>
		</form>
	</div>

	<!-- Hasil Laporan Data Table Card -->
	<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
		<!-- Summary Header -->
		<div class="p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<div>
				<h2 class="text-base font-extrabold text-prussian">
					Hasil Laporan Persewaan
				</h2>
				<p class="text-xs text-slate-500 mt-0.5">
					Kriteria: <span class="font-bold text-prussian uppercase">{data.filter.mode}</span>
					{#if data.filter.mode === 'bulan'}
						({daftarBulan.find((b) => b.no === data.filter.bulan)?.nama} {data.filter.tahun})
					{:else if data.filter.mode === 'hari'}
						({formatDateIndo(data.filter.tanggal)})
					{:else if data.filter.mode === 'tipe'}
						({data.filter.tipeGarasi})
					{:else if data.filter.mode === 'penyewa'}
						(ID Penyewa #{data.filter.penyewaId})
					{/if}
				</p>
			</div>

			<div class="flex items-center gap-4 text-xs font-semibold">
				<div class="px-3 py-1.5 rounded-xl bg-white border border-slate-200">
					Transaksi: <span class="text-prussian font-bold">{data.laporan.totalTransaksi}</span>
				</div>
				<div class="px-3 py-1.5 rounded-xl bg-garage-orange/20 border border-garage-orange/40 text-prussian">
					Total Omzet: <span class="font-black text-sm">{formatRupiah(data.laporan.totalPendapatan)}</span>
				</div>
			</div>
		</div>

		<!-- Table -->
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
					<tr>
						<th class="py-3.5 px-4">Garasi</th>
						<th class="py-3.5 px-4">Penyewa</th>
						<th class="py-3.5 px-4">Kendaraan</th>
						<th class="py-3.5 px-4">Periode & Durasi</th>
						<th class="py-3.5 px-4">Tipe Paket</th>
						<th class="py-3.5 px-4">Rincian & Total Biaya</th>
						<th class="py-3.5 px-4">Bukti</th>
						<th class="py-3.5 px-4">Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 font-normal text-slate-800">
					{#if data.laporan.daftarTransaksi.length === 0}
						<tr>
							<td colspan="8" class="text-center py-12 text-slate-400">
								<div class="flex flex-col items-center justify-center gap-2">
									<InfoIcon size={32} class="text-slate-300" />
									<p class="font-medium text-sm">Tidak ada transaksi sewa yang sesuai dengan filter ini.</p>
								</div>
							</td>
						</tr>
					{:else}
						{#each data.laporan.daftarTransaksi as sewa (sewa.id)}
							<tr class="hover:bg-slate-50/80 transition-colors">
								<!-- Garasi with S/C/E badge -->
								<td class="py-3.5 px-4">
									<div class="flex items-center gap-1.5">
										{#if sewa.garasi.tipeGarasi === 'SEPEDA'}
											<span class="px-2 py-0.5 rounded text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
												{sewa.garasi.id}
											</span>
										{:else if sewa.garasi.tipeGarasi === 'MOBIL'}
											<span class="px-2 py-0.5 rounded text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
												{sewa.garasi.id}
											</span>
										{:else}
											<span class="px-2 py-0.5 rounded text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
												{sewa.garasi.id}
											</span>
										{/if}
									</div>
								</td>

								<!-- Penyewa -->
								<td class="py-3.5 px-4 text-xs">
									<p class="font-semibold text-slate-900">{sewa.penyewa.namaLengkap}</p>
									<p class="text-slate-500 font-mono">NIK: {sewa.penyewa.nik}</p>
								</td>

								<!-- Kendaraan -->
								<td class="py-3.5 px-4 text-xs">
									<p class="font-semibold text-slate-800">{sewa.kendaraan.merekTipe}</p>
									<p class="text-slate-500">
										{sewa.kendaraan.nomorPlat ? `Plat: ${sewa.kendaraan.nomorPlat}` : 'Tanpa Plat'}
									</p>
								</td>

								<!-- Periode & Durasi -->
								<td class="py-3.5 px-4 text-xs">
									<p class="font-semibold text-slate-900">
										{formatDateIndo(sewa.tanggalMulai)} - {formatDateIndo(sewa.tanggalSelesai)}
									</p>
									<p class="text-slate-500">
										Durasi: <span class="font-bold text-prussian">{sewa.jumlahHari} Hari</span>
									</p>
								</td>

								<!-- Tipe Paket -->
								<td class="py-3.5 px-4">
									<span class="px-2 py-0.5 rounded text-xs font-semibold {sewa.tipeSewa === 'BULANAN' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}">
										{sewa.tipeSewa}
									</span>
								</td>

								<!-- Rincian & Total Biaya -->
								<td class="py-3.5 px-4">
									<p class="font-extrabold text-prussian">{formatRupiah(sewa.totalBiaya)}</p>
									{#if sewa.biayaListrik && sewa.biayaListrik > 0}
										<p class="text-[11px] text-emerald-700">
											(Garasi: {formatRupiah(sewa.biayaSewa)} + Listrik: {formatRupiah(sewa.biayaListrik)})
										</p>
									{/if}
								</td>

								<!-- Bukti Bayar -->
								<td class="py-3.5 px-4 text-xs">
									<a
										href={sewa.buktiBayarPath}
										target="_blank"
										rel="noreferrer"
										class="text-prussian hover:text-garage-orange underline font-semibold"
									>
										Lihat Bukti
									</a>
								</td>

								<!-- Status Sewa -->
								<td class="py-3.5 px-4">
									{#if sewa.statusSewa === 'MENUNGGU_VERIFIKASI'}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
											<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Verifikasi
										</span>
									{:else if sewa.statusSewa === 'AKTIF'}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
											<span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Aktif
										</span>
									{:else if sewa.statusSewa === 'DITOLAK'}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
											<span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Ditolak
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
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
</div>
