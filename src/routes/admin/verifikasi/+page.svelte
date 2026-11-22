<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { formatDateIndo } from '$lib/utils/format';
	import {
		ShieldCheckIcon,
		UserIcon,
		ClockIcon,
		CheckCircleIcon,
		XCircleIcon,
		SearchIcon,
		InfoIcon,
		PhoneIcon,
		MailIcon,
		CheckIcon,
		AlertTriangleIcon
	} from '$lib/components/icons';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let filterStatus = $state<string>('ALL');
	let searchQuery = $state<string>('');
	let processingId = $state<number | null>(null);

	let filteredPenyewa = $derived(
		data.calonPenyewaList.filter((p) => {
			if (filterStatus !== 'ALL' && p.statusVerifikasi !== filterStatus) return false;
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase();
				const matchNik = p.nik ? p.nik.toLowerCase().includes(query) : false;
				const matchNama = p.namaLengkap.toLowerCase().includes(query);
				const matchEmail = p.email.toLowerCase().includes(query);
				if (!matchNik && !matchNama && !matchEmail) return false;
			}
			return true;
		})
	);
</script>

<svelte:head>
	<title>Verifikasi Calon Penyewa - Admin Garasi Ta</title>
</svelte:head>

<div class="space-y-6">
	<!-- Hero Welcome Banner -->
	<div class="rounded-2xl bg-gradient-to-r from-carbon-black via-gunmetal to-carbon-black text-white p-6 shadow-sm border border-gunmetal/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 text-garage-orange text-xs font-bold mb-2">
				<span class="w-1.5 h-1.5 rounded-full bg-garage-orange"></span>
				<span>Pusat Verifikasi Identitas</span>
			</div>
			<h1 class="text-xl sm:text-2xl font-black text-white tracking-tight">
				Verifikasi & Validasi Calon Penyewa
			</h1>
			<p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
				Tinjau data NIK 16 digit calon penyewa baru. Hanya akun yang disetujui (Approved) yang dapat melakukan reservasi garasi.
			</p>
		</div>
	</div>

	<!-- Alert Feedback -->
	{#if form?.error}
		<div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
			<AlertTriangleIcon size={18} class="text-rose-500 shrink-0 mt-0.5" />
			<div>
				<p class="font-bold">Gagal Verifikasi</p>
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
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Total Pendaftar -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pendaftar</p>
				<div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
					<UserIcon size={16} />
				</div>
			</div>
			<p class="text-2xl font-black text-carbon-black mt-2">
				{data.stats.total} <span class="text-xs font-normal text-slate-400">Orang</span>
			</p>
			<p class="text-[11px] text-slate-400 mt-1">Seluruh akun penyewa</p>
		</div>

		<!-- Menunggu Verifikasi (Pending) -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menunggu (Pending)</p>
				<div class="w-8 h-8 rounded-xl bg-amber-50 text-garage-orange flex items-center justify-center">
					<ClockIcon size={16} />
				</div>
			</div>
			<p class="text-2xl font-black text-garage-orange mt-2">
				{data.stats.pending} <span class="text-xs font-normal text-slate-400">Orang</span>
			</p>
			<p class="text-[11px] text-amber-700 mt-1 font-medium">Perlu review admin</p>
		</div>

		<!-- Disetujui (Approved) -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disetujui (Approved)</p>
				<div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
					<CheckCircleIcon size={16} />
				</div>
			</div>
			<p class="text-2xl font-black text-emerald-600 mt-2">
				{data.stats.approved} <span class="text-xs font-normal text-slate-400">Orang</span>
			</p>
			<p class="text-[11px] text-emerald-600 mt-1 font-medium">Dapat menyewa garasi</p>
		</div>

		<!-- Ditolak (Rejected) -->
		<div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ditolak (Rejected)</p>
				<div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
					<XCircleIcon size={16} />
				</div>
			</div>
			<p class="text-2xl font-black text-rose-600 mt-2">
				{data.stats.rejected} <span class="text-xs font-normal text-slate-400">Orang</span>
			</p>
			<p class="text-[11px] text-rose-600 mt-1 font-medium">Tidak diizinkan sewa</p>
		</div>
	</div>

	<!-- Table Card with Search & Filters -->
	<div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
		<!-- Filter Bar -->
		<div class="p-4 bg-slate-50/60 border-b border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-3">
			<div class="relative w-full md:w-80">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari NIK, Nama, atau Email..."
					class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-garage-orange focus:ring-1 focus:ring-garage-orange"
				/>
				<span class="absolute left-3 top-2.5 text-slate-400">
					<SearchIcon size={14} />
				</span>
			</div>

			<div class="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
				<!-- Status Filter Tabs -->
				<button
					type="button"
					onclick={() => (filterStatus = 'ALL')}
					class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all {filterStatus === 'ALL' ? 'bg-carbon-black text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
				>
					Semua ({data.stats.total})
				</button>
				<button
					type="button"
					onclick={() => (filterStatus = 'PENDING')}
					class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all {filterStatus === 'PENDING' ? 'bg-garage-orange text-carbon-black font-bold' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}"
				>
					Pending ({data.stats.pending})
				</button>
				<button
					type="button"
					onclick={() => (filterStatus = 'APPROVED')}
					class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all {filterStatus === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}"
				>
					Approved ({data.stats.approved})
				</button>
				<button
					type="button"
					onclick={() => (filterStatus = 'REJECTED')}
					class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all {filterStatus === 'REJECTED' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'}"
				>
					Rejected ({data.stats.rejected})
				</button>
			</div>
		</div>

		<!-- Table -->
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead class="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200/80">
					<tr>
						<th class="py-3 px-5">NIK (KTP)</th>
						<th class="py-3 px-5">Nama Lengkap</th>
						<th class="py-3 px-5">Kontak</th>
						<th class="py-3 px-5">Status Verifikasi</th>
						<th class="py-3 px-5">Terdaftar Sejak</th>
						<th class="py-3 px-5 text-center">Tindakan</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 font-normal text-slate-800">
					{#if filteredPenyewa.length === 0}
						<tr>
							<td colspan="6" class="text-center py-12 text-slate-400">
								<div class="flex flex-col items-center justify-center gap-2">
									<InfoIcon size={28} class="text-slate-300" />
									<p class="font-medium text-xs">Tidak ada pendaftar yang cocok dengan kriteria pencarian.</p>
								</div>
							</td>
						</tr>
					{:else}
						{#each filteredPenyewa as penyewa (penyewa.id)}
							<tr class="hover:bg-slate-50/80 transition-colors">
								<!-- NIK Badge -->
								<td class="py-3 px-5 font-mono text-xs font-bold text-carbon-black">
									<span class="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 tracking-wider">
										{penyewa.nik}
									</span>
								</td>

								<!-- Nama Lengkap -->
								<td class="py-3 px-5">
									<p class="font-semibold text-slate-900">{penyewa.namaLengkap}</p>
									<p class="text-[10px] text-slate-400">ID #{penyewa.id}</p>
								</td>

								<!-- Kontak -->
								<td class="py-3 px-5 text-xs">
									<p class="text-slate-800 flex items-center gap-1.5 font-medium">
										<PhoneIcon size={12} class="text-slate-400" />
										<span>{penyewa.noTelepon}</span>
									</p>
									<p class="text-slate-500 flex items-center gap-1.5 mt-0.5 text-[11px]">
										<MailIcon size={12} class="text-slate-400" />
										<span>{penyewa.email}</span>
									</p>
								</td>

								<!-- Status Badge -->
								<td class="py-3 px-5">
									{#if penyewa.statusVerifikasi === 'APPROVED'}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
											<span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Disetujui
										</span>
									{:else if penyewa.statusVerifikasi === 'PENDING'}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
											<span class="w-1.5 h-1.5 rounded-full bg-garage-orange"></span> Menunggu
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
											<span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Ditolak
										</span>
									{/if}
								</td>

								<!-- Terdaftar Sejak -->
								<td class="py-3 px-5 text-xs text-slate-500">
									{formatDateIndo(penyewa.createdAt)}
								</td>

								<!-- Aksi Verifikasi -->
								<td class="py-3 px-5">
									<div class="flex items-center justify-center gap-2">
										{#if penyewa.statusVerifikasi !== 'APPROVED'}
											<form method="POST" action="?/verifikasi" onsubmit={() => (processingId = penyewa.id)}>
												<input type="hidden" name="penyewaId" value={penyewa.id} />
												<input type="hidden" name="status" value="APPROVED" />
												<button
													type="submit"
													disabled={processingId === penyewa.id}
													class="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all cursor-pointer disabled:opacity-50"
												>
													<CheckIcon size={12} />
													<span>Setujui</span>
												</button>
											</form>
										{/if}

										{#if penyewa.statusVerifikasi !== 'REJECTED'}
											<form method="POST" action="?/verifikasi" onsubmit={() => (processingId = penyewa.id)}>
												<input type="hidden" name="penyewaId" value={penyewa.id} />
												<input type="hidden" name="status" value="REJECTED" />
												<button
													type="submit"
													disabled={processingId === penyewa.id}
													class="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-50"
												>
													<XCircleIcon size={12} />
													<span>Tolak</span>
												</button>
											</form>
										{/if}
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
