<script lang="ts">
	import type { ActionData, PageData } from "./$types";
	import { formatRupiah } from "$lib/utils/format";
	import type { Garasi, Kendaraan } from "$lib/generated/prisma/client";
	import type { TipeKendaraan, TipeSewa } from "$lib/models/types";
	import {
		CarIcon,
		AlertTriangleIcon,
		InfoIcon,
		ArrowRightIcon,
		CheckIcon,
	} from "$lib/components/icons";

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Form states
	let modeKendaraan = $state<"existing" | "new">("new");
	let selectedKendaraanId = $state<number>(0);

	// New vehicle inputs
	let tipeKendaraan = $state<TipeKendaraan>("MOBIL");
	let nomorPlat = $state<string>("");
	let merekTipe = $state<string>("");
	let kapasitasBateraiKwh = $state<number>(60);

	// Sewa settings
	let tipeSewa = $state<TipeSewa>("HARIAN");
	let tanggalMulai = $state<string>("");
	let jumlahHari = $state<number>(3);
	let sisaBateraiKwh = $state<number>(20);

	$effect(() => {
		if (data.kendaraanList.length > 0 && selectedKendaraanId === 0) {
			modeKendaraan = "existing";
			selectedKendaraanId = data.kendaraanList[0].id;
		}
		if (!tanggalMulai && data.todayStr) {
			tanggalMulai = data.todayStr;
		}
	});

	// Garage selection & fetcher
	let selectedGarasiId = $state<string>("");
	let availableGarages = $state<Garasi[]>([]);
	let isLoadingGarasi = $state<boolean>(false);
	let garasiFetchError = $state<string>("");

	// File preview
	let filePreviewUrl = $state<string | null>(null);
	let isSubmitting = $state<boolean>(false);

	// Reactive derivation for active vehicle properties
	let activeVehicle = $derived.by(() => {
		if (modeKendaraan === "existing") {
			const found = data.kendaraanList.find(
				(k: Kendaraan) => k.id === selectedKendaraanId,
			);
			if (found) {
				return {
					tipeKendaraan: found.tipeKendaraan as TipeKendaraan,
					nomorPlat: found.nomorPlat,
					merekTipe: found.merekTipe,
					kapasitasBateraiKwh: found.kapasitasBateraiKwh,
				};
			}
		}
		return {
			tipeKendaraan,
			nomorPlat: tipeKendaraan === "SEPEDA" ? null : nomorPlat,
			merekTipe,
			kapasitasBateraiKwh:
				tipeKendaraan === "MOBIL_LISTRIK" ? kapasitasBateraiKwh : null,
		};
	});

	// Compute end date string reactively
	let calculatedEndDate = $derived.by(() => {
		if (!tanggalMulai) return "";
		const parts = tanggalMulai.split("-").map(Number);
		if (parts.length !== 3) return "";
		const [year, month, day] = parts;
		const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

		let effectiveDays = jumlahHari;
		if (tipeSewa === "BULANAN") {
			effectiveDays = new Date(
				Date.UTC(year, month, 0, 0, 0, 0, 0),
			).getUTCDate();
		}

		const end = new Date(
			Date.UTC(year, month - 1, day + effectiveDays, 0, 0, 0, 0),
		);
		return end.toISOString().slice(0, 10);
	});

	// Fetch available garages whenever dates or vehicle type changes
	$effect(() => {
		const vType = activeVehicle.tipeKendaraan;
		const tMulai = tanggalMulai;
		const tSelesai = calculatedEndDate;

		if (!vType || !tMulai || !tSelesai) {
			availableGarages = [];
			return;
		}

		isLoadingGarasi = true;
		garasiFetchError = "";

		const query = new URLSearchParams({
			tipeKendaraan: vType,
			tanggalMulai: tMulai,
			tanggalSelesai: tSelesai,
		});

		fetch(`/api/garasi-tersedia?${query.toString()}`)
			.then((res) => res.json())
			.then((res) => {
				isLoadingGarasi = false;
				if (res.error) {
					garasiFetchError = res.error;
					availableGarages = [];
				} else {
					availableGarages = res.data ?? [];
					if (
						!availableGarages.some((g) => g.id === selectedGarasiId)
					) {
						selectedGarasiId =
							availableGarages.length > 0
								? availableGarages[0].id
								: "";
					}
				}
			})
			.catch(() => {
				isLoadingGarasi = false;
				garasiFetchError = "Gagal memuat ketersediaan garasi.";
			});
	});

	// Currently selected garage object
	let selectedGarasi = $derived(
		availableGarages.find((g) => g.id === selectedGarasiId),
	);

	// Cost calculation derivation
	let costCalculation = $derived.by(() => {
		if (!selectedGarasi) {
			return {
				biayaGarasi: 0,
				biayaListrik: 0,
				totalBiaya: 0,
				kwhDibutuhkan: 0,
			};
		}

		const hargaHarian = selectedGarasi.hargaHarian;
		let biayaGarasi = 0;

		if (tipeSewa === "BULANAN") {
			biayaGarasi = hargaHarian * 25; // Aturan sertifikasi LSP: bulanan flat 25x tarif harian
			biayaGarasi = hargaHarian * 25; // Paket bulanan: hemat flat 25x tarif harian
		} else {
			biayaGarasi = hargaHarian * (jumlahHari || 1);
		}

		let biayaListrik = 0;
		let kwhDibutuhkan = 0;

		if (
			activeVehicle.tipeKendaraan === "MOBIL_LISTRIK" &&
			selectedGarasi.hargaListrikPerKwh
		) {
			const kapasitas = activeVehicle.kapasitasBateraiKwh || 0;
			const sisa = sisaBateraiKwh || 0;
			if (kapasitas > sisa) {
				kwhDibutuhkan = kapasitas - sisa;
				biayaListrik =
					kwhDibutuhkan * selectedGarasi.hargaListrikPerKwh;
			}
		}

		return {
			biayaGarasi,
			biayaListrik,
			totalBiaya: biayaGarasi + biayaListrik,
			kwhDibutuhkan,
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
	<title>Sewa Garasi Baru - Garasi Ta</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Page Header -->
	<div class="rounded-2xl bg-gradient-to-r from-carbon-black via-gunmetal to-carbon-black text-white p-6 shadow-sm border border-gunmetal/60 flex items-center justify-between">
		<div>
			<a href="/penyewa" class="text-xs font-semibold text-garage-orange hover:underline mb-1 inline-flex items-center gap-1">
				&larr; Kembali ke Dashboard
			</a>
			<h1 class="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
				<span>Formulir Sewa Garasi Baru</span>
			</h1>
			<p class="text-xs text-slate-300 mt-0.5">
				Pilih unit garasi bebas bentrok jadwal, transparan tanpa markup atau biaya tersembunyi.
			</p>
		</div>
	</div>

	<!-- Error Alert -->
	{#if form?.error}
		<div
			class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3"
		>
			<AlertTriangleIcon
				size={20}
				class="text-rose-500 shrink-0 mt-0.5"
			/>
			<div>
				<p class="font-bold">Transaksi Sewa Gagal Diproses</p>
				<p class="text-rose-700 mt-0.5">{form.error}</p>
			</div>
		</div>
	{/if}

	<form
		method="POST"
		action="?/buatSewa"
		enctype="multipart/form-data"
		onsubmit={() => (isSubmitting = true)}
		class="space-y-6"
	>
		<!-- Step 1: Data Kendaraan -->
		<div
			class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
		>
			<div
				class="flex items-center justify-between pb-3 border-b border-slate-100"
			>
				<h2
					class="text-base font-bold text-prussian flex items-center gap-2"
				>
					<span
						class="w-6 h-6 rounded-full bg-prussian text-white text-xs flex items-center justify-center font-bold"
						>1</span
					>
					Identitas Kendaraan
				</h2>

				{#if data.kendaraanList.length > 0}
					<div class="flex items-center gap-2 text-xs">
						<button
							type="button"
							onclick={() => (modeKendaraan = "existing")}
							class="px-3 py-1.5 rounded-lg font-semibold transition-all {modeKendaraan ===
							'existing'
								? 'bg-prussian text-white'
								: 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
						>
							Pilih Yang Ada
						</button>
						<button
							type="button"
							onclick={() => (modeKendaraan = "new")}
							class="px-3 py-1.5 rounded-lg font-semibold transition-all {modeKendaraan ===
							'new'
								? 'bg-garage-orange text-prussian'
								: 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
						>
							+ Kendaraan Baru
						</button>
					</div>
				{/if}
			</div>

			<input type="hidden" name="modeKendaraan" value={modeKendaraan} />

			{#if modeKendaraan === "existing" && data.kendaraanList.length > 0}
				<div>
					<label
						for="kendaraanId"
						class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
					>
						Pilih Kendaraan Terdaftar Milik Anda <span
							class="text-rose-500">*</span
						>
					</label>
					<select
						id="kendaraanId"
						name="kendaraanId"
						bind:value={selectedKendaraanId}
						class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
					>
						{#each data.kendaraanList as k (k.id)}
							<option value={k.id}>
								{k.tipeKendaraan} - {k.merekTipe}
								{k.nomorPlat ? `(Plat: ${k.nomorPlat})` : ""}
								{k.kapasitasBateraiKwh
									? `[Baterai: ${k.kapasitasBateraiKwh} kWh]`
									: ""}
							</option>
						{/each}
					</select>
				</div>
			{:else}
				<div
					class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
				>
					<div>
						<label
							for="tipeKendaraan"
							class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
						>
							Tipe Kendaraan <span class="text-rose-500">*</span>
						</label>
						<select
							id="tipeKendaraan"
							name="tipeKendaraan"
							bind:value={tipeKendaraan}
							class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
						>
							<option value="SEPEDA">Sepeda Manual</option>
							<option value="SEPEDA_MOTOR">Sepeda Motor</option>
							<option value="MOBIL"
								>Mobil Konvensional (Bensin/Diesel)</option
							>
							<option value="MOBIL_LISTRIK"
								>Mobil Listrik (EV)</option
							>
						</select>
					</div>

					<div>
						<label
							for="merekTipe"
							class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
						>
							Merek & Model Kendaraan <span class="text-rose-500"
								>*</span
							>
						</label>
						<input
							type="text"
							id="merekTipe"
							name="merekTipe"
							bind:value={merekTipe}
							placeholder="Contoh: Honda HR-V / Toyota Veloz"
							required
							class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20"
						/>
						<p class="text-[11px] text-slate-500 mt-1">Merek dan model unit kendaraan.</p>
					</div>

					{#if tipeKendaraan !== "SEPEDA"}
						<div>
							<label
								for="nomorPlat"
								class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
							>
								Nomor Plat Polisi <span class="text-rose-500"
									>*</span
								>
							</label>
							<input
								type="text"
								id="nomorPlat"
								name="nomorPlat"
								bind:value={nomorPlat}
								placeholder="Contoh: DD 1234 TA"
								required
								class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm uppercase focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20"
							/>
							<p class="text-[11px] text-slate-500 mt-1">Wajib plat polisi resmi (huruf kapital).</p>
						</div>
					{/if}

					{#if tipeKendaraan === "MOBIL_LISTRIK"}
						<div>
							<label
								for="kapasitasBateraiKwh"
								class="block text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1"
							>
								Kapasitas Baterai (kWh) <span
									class="text-rose-500">*</span
								>
							</label>
							<input
								type="number"
								id="kapasitasBateraiKwh"
								name="kapasitasBateraiKwh"
								bind:value={kapasitasBateraiKwh}
								min="1"
								step="0.5"
								required
								class="w-full px-3.5 py-2.5 rounded-xl border border-emerald-400 bg-emerald-50/20 text-sm"
							/>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Step 2: Durasi & Periode Sewa -->
		<div
			class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
		>
			<div class="pb-3 border-b border-slate-100">
				<h2
					class="text-base font-bold text-prussian flex items-center gap-2"
				>
					<span
						class="w-6 h-6 rounded-full bg-prussian text-white text-xs flex items-center justify-center font-bold"
						>2</span
					>
					Paket Durasi & Tanggal Mulai Sewa
				</h2>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div>
					<label
						for="tipeSewa"
						class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
					>
						Pilihan Paket Sewa <span class="text-rose-500">*</span>
					</label>
					<select
						id="tipeSewa"
						name="tipeSewa"
						bind:value={tipeSewa}
						class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
					>
						<option value="HARIAN">Sewa Harian</option>
						<option value="BULANAN"
							>Sewa Bulanan (Hemat 25x Tarif Harian)</option
						>
					</select>
				</div>

				<div>
					<label
						for="tanggalMulai"
						class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
					>
						Tanggal Mulai Sewa <span class="text-rose-500">*</span>
					</label>
					<input
						type="date"
						id="tanggalMulai"
						name="tanggalMulai"
						bind:value={tanggalMulai}
						min={data.todayStr}
						required
						class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
					/>
				</div>

				{#if tipeSewa === "HARIAN"}
					<div>
						<label
							for="jumlahHari"
							class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
						>
							Jumlah Hari Sewa <span class="text-rose-500">*</span
							>
						</label>
						<input
							type="number"
							id="jumlahHari"
							name="jumlahHari"
							bind:value={jumlahHari}
							min="1"
							max="30"
							required
							class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
						/>
						<p class="text-[11px] text-slate-400 mt-1">
							Minimal 1 hari (di bawah 1 bulan)
						</p>
					</div>
				{:else}
					<div class="flex flex-col justify-end">
						<div
							class="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900"
						>
							<p class="font-bold">Paket Hemat Bulanan</p>
							<p class="text-[11px] text-purple-700">
								Durasi otomatis 1 bulan penuh, dihitung setara
								flat 25 hari tarif harian.
							</p>
						</div>
					</div>
				{/if}
			</div>

			<div
				class="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-center justify-between"
			>
				<span>Periode Sewa Yang Dihitung:</span>
				<span class="font-bold text-prussian"
					>{tanggalMulai} s.d {calculatedEndDate}</span
				>
			</div>
		</div>

		<!-- Step 3: Pilih Unit Garasi Bebas Bentrok -->
		<div
			class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
		>
			<div
				class="pb-3 border-b border-slate-100 flex items-center justify-between"
			>
				<h2
					class="text-base font-bold text-prussian flex items-center gap-2"
				>
					<span
						class="w-6 h-6 rounded-full bg-prussian text-white text-xs flex items-center justify-center font-bold"
						>3</span
					>
					Pilih Unit Garasi Yang Tersedia
				</h2>
				{#if isLoadingGarasi}
					<span
						class="text-xs text-garage-orange flex items-center gap-1 font-medium"
					>
						<svg
							class="animate-spin h-3.5 w-3.5"
							viewBox="0 0 24 24"
							fill="none"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8v8H4z"
							></path>
						</svg>
						Mengecek ketersediaan...
					</span>
				{/if}
			</div>

			{#if garasiFetchError}
				<div class="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">
					{garasiFetchError}
				</div>
			{/if}

			{#if availableGarages.length === 0 && !isLoadingGarasi}
				<div
					class="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300"
				>
					<InfoIcon size={32} class="text-slate-400 mx-auto" />
					<p class="text-sm font-bold text-slate-700 mt-2">
						Tidak Ada Unit Garasi Yang Tersedia
					</p>
					<p class="text-xs text-slate-500 mt-1">
						Seluruh unit garasi yang cocok dengan {activeVehicle.tipeKendaraan}
						telah terisi atau memiliki jadwal sewa pada rentang tanggal
						tersebut. Silakan pilih tanggal lain.
					</p>
				</div>
			{:else}
				<div
					class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
				>
					{#each availableGarages as g (g.id)}
						<label
							class="relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all {selectedGarasiId ===
							g.id
								? 'border-garage-orange bg-amber-50/40 shadow-md'
								: 'border-slate-200 hover:border-slate-300 bg-white'}"
						>
							<input
								type="radio"
								name="garasiId"
								value={g.id}
								bind:group={selectedGarasiId}
								required
								class="sr-only"
							/>
							<div class="flex items-center justify-between">
								<span
									class="text-sm font-extrabold px-2 py-0.5 rounded {g.tipeGarasi ===
									'SEPEDA'
										? 'bg-sky-100 text-sky-800'
										: g.tipeGarasi === 'MOBIL'
											? 'bg-amber-100 text-amber-900'
											: 'bg-emerald-100 text-emerald-800'}"
								>
									{g.id}
								</span>
								{#if selectedGarasiId === g.id}
									<span
										class="inline-flex items-center gap-1 text-xs font-bold text-garage-orange"
									>
										<CheckIcon size={14} /> Terpilih
									</span>
								{/if}
							</div>
							<p class="text-xs text-slate-500 mt-2">
								{g.tipeGarasi}
							</p>
							<p
								class="text-sm font-extrabold text-prussian mt-1"
							>
								{formatRupiah(g.hargaHarian)}
								<span
									class="text-[11px] font-normal text-slate-500"
									>/ hari</span
								>
							</p>
							{#if g.hargaListrikPerKwh}
								<p
									class="text-[11px] text-emerald-700 font-medium mt-0.5"
								>
									Listrik: {formatRupiah(
										g.hargaListrikPerKwh,
									)} / kWh
								</p>
							{/if}
						</label>
					{/each}
				</div>
			{/if}

			{#if activeVehicle.tipeKendaraan === "MOBIL_LISTRIK" && selectedGarasi?.hargaListrikPerKwh}
				<div class="pt-3 border-t border-slate-100">
					<label
						for="sisaBateraiKwh"
						class="block text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1"
					>
						Sisa Baterai Saat Kendaraan Masuk (kWh) <span
							class="text-rose-500">*</span
						>
					</label>
					<input
						type="number"
						id="sisaBateraiKwh"
						name="sisaBateraiKwh"
						bind:value={sisaBateraiKwh}
						min="0"
						max={activeVehicle.kapasitasBateraiKwh || 100}
						step="0.5"
						required
						class="w-full max-w-xs px-3.5 py-2.5 rounded-xl border text-sm {sisaBateraiKwh > (activeVehicle.kapasitasBateraiKwh || 100) || sisaBateraiKwh < 0
							? 'border-rose-400 bg-rose-50/30'
							: 'border-emerald-400 bg-emerald-50/20'}"
					/>
					{#if sisaBateraiKwh > (activeVehicle.kapasitasBateraiKwh || 100)}
						<p class="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
							<AlertTriangleIcon size={14} class="shrink-0" />
							Sisa baterai ({sisaBateraiKwh} kWh) tidak boleh melebihi kapasitas total ({activeVehicle.kapasitasBateraiKwh} kWh).
						</p>
					{:else if sisaBateraiKwh < 0}
						<p class="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
							<AlertTriangleIcon size={14} class="shrink-0" />
							Sisa baterai tidak boleh bernilai negatif.
						</p>
					{:else}
						<p class="text-[11px] text-emerald-700 mt-1">
							Kapasitas total: {activeVehicle.kapasitasBateraiKwh} kWh • Pengisian dibutuhkan:
							<span class="font-bold">{costCalculation.kwhDibutuhkan.toFixed(1)} kWh</span>
						</p>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Step 4: Rincian Biaya & Bukti Bayar -->
		<div
			class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
		>
			<div class="pb-3 border-b border-slate-100">
				<h2
					class="text-base font-bold text-prussian flex items-center gap-2"
				>
					<span
						class="w-6 h-6 rounded-full bg-prussian text-white text-xs flex items-center justify-center font-bold"
						>4</span
					>
					Rincian Pembayaran & Bukti Transfer
				</h2>
			</div>

			<!-- Live Cost Summary Box -->
			<div
				class="p-5 rounded-2xl bg-prussian text-white shadow-md space-y-3"
			>
				<div
					class="flex items-center justify-between text-xs text-slate-300"
				>
					<span
						>Biaya Sewa Unit Garasi ({tipeSewa === "BULANAN"
							? "Paket 1 Bulan Flat 25 Hari"
							: `${jumlahHari} Hari`}):</span
					>
					<span class="font-bold text-white text-sm"
						>{formatRupiah(costCalculation.biayaGarasi)}</span
					>
				</div>

				{#if costCalculation.biayaListrik > 0}
					<div
						class="flex items-center justify-between text-xs text-emerald-300"
					>
						<span
							>Biaya Listrik EV ({costCalculation.kwhDibutuhkan.toFixed(
								1,
							)} kWh × {formatRupiah(
								selectedGarasi?.hargaListrikPerKwh || 0,
							)}):</span
						>
						<span class="font-bold text-emerald-400 text-sm"
							>+{formatRupiah(costCalculation.biayaListrik)}</span
						>
					</div>
				{/if}

				<div
					class="pt-3 border-t border-prussian-light flex items-center justify-between"
				>
					<span class="text-sm font-bold text-slate-200"
						>Total Yang Harus Dibayar:</span
					>
					<span class="text-2xl font-black text-garage-orange">
						{formatRupiah(costCalculation.totalBiaya)}
					</span>
				</div>
			</div>

			<!-- Transfer Destination Info -->
			<div
				class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600"
			>
				<p class="font-bold text-slate-800">
					Nomor Rekening Pengelola GarasiPro:
				</p>
				<p class="mt-0.5">
					Bank BCA: <span class="font-mono font-bold text-prussian"
						>123-456-7890</span
					> a.n. GarasiPro LSP
				</p>
				<p class="font-bold text-slate-800">
					Nomor Rekening Pengelola Garasi Ta:
				</p>
				<p class="mt-0.5">
					Bank BCA: <span class="font-mono font-bold text-prussian"
						>123-456-7890</span
					> a.n. Garasi Ta
				</p>
			</div>

			<!-- File Upload -->
			<div>
				<label
					for="buktiBayar"
					class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
				>
					Unggah Bukti Pelunasan Transfer <span class="text-rose-500"
						>*</span
					>
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
				<p class="text-[11px] text-slate-400 mt-1">
					Format: JPG, PNG, atau WEBP. Maksimal ukuran 5MB.
				</p>

				{#if filePreviewUrl}
					<div class="mt-3">
						<p
							class="text-[11px] font-semibold text-slate-500 mb-1"
						>
							Pratinjau Bukti:
						</p>
						<img
							src={filePreviewUrl}
							alt="Preview Bukti Bayar"
							class="h-36 rounded-xl border border-slate-200 object-cover"
						/>
					</div>
				{/if}
			</div>
		</div>

		<!-- Submit Button -->
		<div class="pt-2">
			<button
				type="submit"
				disabled={isSubmitting ||
					!selectedGarasiId ||
					availableGarages.length === 0}
				class="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-extrabold text-prussian bg-garage-orange hover:bg-garage-orange-hover shadow-lg shadow-garage-orange/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-base"
			>
				{#if isSubmitting}
					<svg
						class="animate-spin -ml-1 mr-2 h-5 w-5 text-prussian"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8v8H4z"
						></path>
					</svg>
					<span>Memproses Transaksi Sewa...</span>
				{:else}
					<span>Konfirmasi & Bayar Sewa Sekarang</span>
					<ArrowRightIcon size={18} />
				{/if}
			</button>
		</div>
	</form>
</div>
