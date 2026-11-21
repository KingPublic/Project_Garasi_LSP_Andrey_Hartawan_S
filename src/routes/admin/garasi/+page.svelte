<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { formatRupiah, formatDateIndo } from '$lib/utils/format';
	import {
		BuildingIcon,
		PlusIcon,
		XCircleIcon,
		SearchIcon,
		CheckCircleIcon,
		ClockIcon,
		BikeIcon,
		CarIcon,
		ZapIcon,
		InfoIcon,
		AlertTriangleIcon
	} from '$lib/components/icons';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let selectedTipe = $state<'SEPEDA' | 'MOBIL' | 'MOBIL_LISTRIK'>('MOBIL');
	let jumlahBaru = $state<number>(5);
	let hargaHarian = $state<number>(75000);
	let hargaListrikPerKwh = $state<number>(2500);
	let showForm = $state(false);
	let isSubmitting = $state(false);

	// Filters
	let filterTipe = $state<string>('ALL');
	let filterStatus = $state<string>('ALL');
	let searchQuery = $state<string>('');

	// Update default prices based on selected type
	function handleTipeChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value as 'SEPEDA' | 'MOBIL' | 'MOBIL_LISTRIK';
		selectedTipe = val;
		if (val === 'SEPEDA') {
			hargaHarian = 25000;
		} else if (val === 'MOBIL') {
			hargaHarian = 75000;
		} else if (val === 'MOBIL_LISTRIK') {
			hargaHarian = 100000;
			hargaListrikPerKwh = 2500;
		}
	}

	let filteredGarasi = $derived(
		data.daftarGarasi.filter((g) => {
			if (filterTipe !== 'ALL' && g.tipeGarasi !== filterTipe) return false;
			if (filterStatus !== 'ALL' && g.status !== filterStatus) return false;
			if (searchQuery.trim() && !g.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
			return true;
		})
	);
</script>

<svelte:head>
	<title>Kelola Unit Garasi - Admin Garasi Ta</title>
</svelte:head>

<div class="space-y-6">
	<!-- Hero Welcome Banner (Rumany-Style Dark Card) -->
	<div class="rounded-2xl bg-gradient-to-r from-carbon-black via-gunmetal to-carbon-black text-white p-6 shadow-sm border border-gunmetal/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 text-garage-orange text-xs font-bold mb-2">
				<span class="w-1.5 h-1.5 rounded-full bg-garage-orange"></span>
				<span>Panel Inventaris Garasi</span>
			</div>
			<h1 class="text-xl sm:text-2xl font-black text-white tracking-tight">
				Selamat Datang di Manajemen Garasi Ta!
			</h1>
			<p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
				Pantau ketersediaan unit sewa, kelola kapasitas garasi, tarif harian, serta stasiun pengisian daya EV secara real-time.
			</p>
		</div>
		<button
			type="button"
			onclick={() => (showForm = !showForm)}
			class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs bg-garage-orange text-carbon-black hover:bg-garage-orange-hover shadow-md shadow-garage-orange/20 transition-all cursor-pointer shrink-0"
		>
			{#if showForm}
				<XCircleIcon size={16} />
				<span>Tutup Form</span>
			{:else}
				<PlusIcon size={16} />
				<span>+ Tambah Garasi Massal</span>
			{/if}
		</button>
	</div>

	<!-- Alert Feedback -->
	{#if form?.error}
		<div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
			<AlertTriangleIcon size={18} class="text-rose-500 shrink-0 mt-0.5" />
			<div>
				<p class="font-bold">Gagal Membuat Unit Garasi</p>
				<p class="text-rose-700 mt-0.5">{form.error}</p>
			</div>
		</div>
	{/if}

	{#if form?.success}
		<div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
			<CheckCircleIcon size={18} class="text-emerald-600 shrink-0 mt-0.5" />
			<div>
				<p class="font-bold">Operasi Berhasil</p>
				<p class="text-emerald-700 mt-0.5">{form.message}</p>
			</div>
		</div>
	{/if}

	<!-- Statistics KPI Cards (Refined Clean Pastel Style) -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Total Unit -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Kapasitas</p>
				<div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
					<BuildingIcon size={16} />
				</div>
			</div>
			<p class="text-2xl font-black text-carbon-black mt-2">
				{data.stats.total} <span class="text-xs font-normal text-slate-400">Unit</span>
			</p>
			<p class="text-[11px] text-slate-400 mt-1">Maks. 999 unit per kategori</p>
		</div>

		<!-- Unit Tersedia -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Garasi Tersedia</p>
				<div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
					<CheckCircleIcon size={16} />
				</div>
			</div>
			<p class="text-2xl font-black text-emerald-600 mt-2">
				{data.stats.tersedia} <span class="text-xs font-normal text-slate-400">Unit</span>
			</p>
			<p class="text-[11px] text-emerald-600 mt-1 font-medium">Siap disewa hari ini</p>
		</div>

		<!-- Unit Terpakai -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sedang Terisi</p>
				<div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
					<ClockIcon size={16} />
				</div>
			</div>
			<p class="text-2xl font-black text-rose-600 mt-2">
				{data.stats.terpakai} <span class="text-xs font-normal text-slate-400">Unit</span>
			</p>
			<p class="text-[11px] text-rose-600 mt-1 font-medium">Unit aktif berjalan</p>
		</div>

		<!-- Rincian Per Tipe -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distribusi Unit</p>
			<div class="space-y-1.5 mt-2">
				<div class="flex items-center justify-between text-xs">
					<span class="inline-flex items-center gap-1.5 text-sky-700 font-medium">
						<span class="w-2 h-2 rounded-full bg-sky-500"></span> Sepeda (S)
					</span>
					<span class="font-bold text-slate-800">{data.stats.sepeda.tersedia}/{data.stats.sepeda.total}</span>
				</div>
				<div class="flex items-center justify-between text-xs">
					<span class="inline-flex items-center gap-1.5 text-garage-orange font-medium">
						<span class="w-2 h-2 rounded-full bg-garage-orange"></span> Mobil (C)
					</span>
					<span class="font-bold text-slate-800">{data.stats.mobil.tersedia}/{data.stats.mobil.total}</span>
				</div>
				<div class="flex items-center justify-between text-xs">
					<span class="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
						<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Listrik (E)
					</span>
					<span class="font-bold text-slate-800">{data.stats.listrik.tersedia}/{data.stats.listrik.total}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Form Tambah Unit Garasi Massal (Collapsible) -->
	{#if showForm}
		<div class="bg-white rounded-2xl p-6 border-2 border-garage-orange/40 shadow-sm animate-in fade-in duration-150">
			<div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
				<div>
					<h2 class="text-base font-bold text-carbon-black flex items-center gap-2">
						<PlusIcon size={18} class="text-garage-orange" />
						<span>Pembuatan Unit Garasi Massal Berkelompok</span>
					</h2>
					<p class="text-xs text-slate-500 mt-0.5">
						Sistem akan secara otomatis melanjutkan penomoran urut (3 digit: S001-S999, C001-C999, E001-E999).
					</p>
				</div>
			</div>

			<form method="POST" action="?/buatGarasi" onsubmit={() => (isSubmitting = true)} class="space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<div>
						<label for="tipeGarasi" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
							Tipe Garasi <span class="text-rose-500">*</span>
						</label>
						<select
							id="tipeGarasi"
							name="tipeGarasi"
							bind:value={selectedTipe}
							onchange={handleTipeChange}
							class="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20 text-xs font-medium"
						>
							<option value="SEPEDA">Sepeda & Motor (Kode S)</option>
							<option value="MOBIL">Mobil Konvensional (Kode C)</option>
							<option value="MOBIL_LISTRIK">Mobil Listrik / EV (Kode E)</option>
						</select>
					</div>

					<div>
						<label for="jumlahBaru" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
							Jumlah Unit Baru <span class="text-rose-500">*</span>
						</label>
						<input
							type="number"
							id="jumlahBaru"
							name="jumlahBaru"
							bind:value={jumlahBaru}
							min="1"
							max="999"
							required
							class="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20 text-xs"
						/>
						<p class="text-[10px] text-slate-400 mt-1">Maks. 999 unit kumulatif per tipe</p>
					</div>

					<div>
						<label for="hargaHarian" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
							Tarif Sewa Harian (Rp) <span class="text-rose-500">*</span>
						</label>
						<input
							type="number"
							id="hargaHarian"
							name="hargaHarian"
							bind:value={hargaHarian}
							min="1000"
							step="1000"
							required
							class="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20 text-xs"
						/>
						<p class="text-[10px] text-slate-400 mt-1">Tarif dasar harian garasi</p>
					</div>

					{#if selectedTipe === 'MOBIL_LISTRIK'}
						<div>
							<label for="hargaListrikPerKwh" class="block text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
								Tarif Listrik / kWh (Rp) <span class="text-rose-500">*</span>
							</label>
							<input
								type="number"
								id="hargaListrikPerKwh"
								name="hargaListrikPerKwh"
								bind:value={hargaListrikPerKwh}
								min="100"
								step="100"
								required
								class="w-full px-3.5 py-2 rounded-xl border border-emerald-400 bg-emerald-50/30 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs"
							/>
							<p class="text-[10px] text-emerald-700 mt-1">Biaya pengisian daya baterai EV (wajib &gt; Rp 0)</p>
						</div>
					{/if}
				</div>

				<div class="flex items-center justify-end gap-3 pt-2">
					<button
						type="button"
						onclick={() => (showForm = false)}
						class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="px-5 py-2 rounded-xl text-xs font-bold text-carbon-black bg-garage-orange hover:bg-garage-orange-hover shadow-sm transition-all cursor-pointer disabled:opacity-60"
					>
						{isSubmitting ? 'Memproses...' : 'Simpan & Generate Unit'}
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Table Card with Search & Filters -->
	<div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
		<!-- Filter Bar -->
		<div class="p-4 bg-slate-50/60 border-b border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-3">
			<div class="relative w-full md:w-64">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari kode (e.g. C001)..."
					class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-garage-orange focus:ring-1 focus:ring-garage-orange"
				/>
				<span class="absolute left-3 top-2.5 text-slate-400">
					<SearchIcon size={14} />
				</span>
			</div>

			<div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
				<!-- Filter Tipe -->
				<select
					bind:value={filterTipe}
					class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white"
				>
					<option value="ALL">Semua Tipe</option>
					<option value="SEPEDA">Sepeda & Motor (S)</option>
					<option value="MOBIL">Mobil (C)</option>
					<option value="MOBIL_LISTRIK">Mobil Listrik (E)</option>
				</select>

				<!-- Filter Status -->
				<select
					bind:value={filterStatus}
					class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white"
				>
					<option value="ALL">Semua Status</option>
					<option value="AVAILABLE">Tersedia (Available)</option>
					<option value="USED">Terisi (Used)</option>
				</select>

				<span class="text-xs text-slate-500 font-medium px-2">
					{filteredGarasi.length} Unit
				</span>
			</div>
		</div>

		<!-- Table -->
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead class="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200/80">
					<tr>
						<th class="py-3 px-5">Kode Unit</th>
						<th class="py-3 px-5">Kategori Garasi</th>
						<th class="py-3 px-5">Tarif Harian</th>
						<th class="py-3 px-5">Tarif Listrik (EV)</th>
						<th class="py-3 px-5">Status Hari Ini</th>
						<th class="py-3 px-5">Terdaftar</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 font-normal text-slate-800">
					{#if filteredGarasi.length === 0}
						<tr>
							<td colspan="6" class="text-center py-12 text-slate-400">
								<div class="flex flex-col items-center justify-center gap-2">
									<InfoIcon size={28} class="text-slate-300" />
									<p class="font-medium text-xs">Tidak ada data unit garasi yang cocok dengan filter.</p>
								</div>
							</td>
						</tr>
					{:else}
						{#each filteredGarasi as garasi (garasi.id)}
							<tr class="hover:bg-slate-50/80 transition-colors">
								<!-- Kode Garasi -->
								<td class="py-3 px-5">
									{#if garasi.tipeGarasi === 'SEPEDA'}
										<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
											{garasi.id}
										</span>
									{:else if garasi.tipeGarasi === 'MOBIL'}
										<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
											{garasi.id}
										</span>
									{:else}
										<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
											{garasi.id}
										</span>
									{/if}
								</td>

								<!-- Kategori & Icon -->
								<td class="py-3 px-5">
									<div class="flex items-center gap-2">
										{#if garasi.tipeGarasi === 'SEPEDA'}
											<span class="text-sky-600"><BikeIcon size={16} /></span>
											<span class="font-medium text-slate-900">Sepeda & Sepeda Motor</span>
										{:else if garasi.tipeGarasi === 'MOBIL'}
											<span class="text-amber-600"><CarIcon size={16} /></span>
											<span class="font-medium text-slate-900">Mobil Konvensional</span>
										{:else}
											<span class="text-emerald-600"><ZapIcon size={16} /></span>
											<span class="font-medium text-slate-900">Mobil Listrik (EV Charger)</span>
										{/if}
									</div>
								</td>

								<!-- Tarif Harian -->
								<td class="py-3 px-5 font-semibold text-slate-900">
									{formatRupiah(garasi.hargaHarian)} <span class="text-[11px] font-normal text-slate-500">/ hari</span>
								</td>

								<!-- Tarif Listrik -->
								<td class="py-3 px-5 text-xs">
									{#if garasi.hargaListrikPerKwh !== null && garasi.hargaListrikPerKwh !== undefined}
										<span class="font-semibold text-emerald-700">{formatRupiah(garasi.hargaListrikPerKwh)}</span>
										<span class="text-slate-500"> / kWh</span>
									{:else}
										<span class="text-slate-400 italic">- (Tidak Ada)</span>
									{/if}
								</td>

								<!-- Status -->
								<td class="py-3 px-5">
									{#if garasi.status === 'AVAILABLE'}
										<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
											<span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Tersedia
										</span>
									{:else}
										<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
											<span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Sedang Terisi
										</span>
									{/if}
								</td>

								<!-- Created At -->
								<td class="py-3 px-5 text-xs text-slate-500">
									{formatDateIndo(garasi.createdAt)}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
