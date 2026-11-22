<script lang="ts">
	import { BikeIcon, CarIcon, ZapIcon, ArrowRightIcon } from '$lib/components/icons';
</script>

<div class="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-white to-slate-50/60">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Hero Section -->
		<div class="text-center max-w-3xl mx-auto">
			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-prussian tracking-tight leading-tight">
				Solusi Penitipan Kendaraan <br class="hidden sm:inline" />
				<span class="text-prussian">Aman, Terstruktur, &</span> <span class="text-garage-orange">Transparan</span>
			</h1>

			<p class="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
				Kelola dan sewa unit garasi untuk sepeda, sepeda motor, mobil konvensional, serta mobil listrik dengan fasilitas pengisian daya baterai kWh otomatis tanpa biaya tersembunyi.
			</p>

			<!-- Action Buttons -->
			<div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
				<a
					href="/login"
					class="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-prussian text-white hover:bg-prussian-light shadow-md hover:shadow-lg transition-all text-center flex items-center justify-center gap-2.5 text-sm"
				>
					<span>Masuk ke Akun</span>
					<ArrowRightIcon size={16} />
				</a>
				<a
					href="/register"
					class="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-garage-orange text-prussian hover:bg-garage-orange-hover shadow-md hover:shadow-lg transition-all text-center text-sm"
				>
					Daftar Akun Penyewa
				</a>
			</div>
		</div>

		<!-- Feature Cards (3 Tipe Kendaraan/Garasi) -->
		<div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Sepeda & Motor -->
			<div class="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all">
				<div class="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center mb-5">
					<BikeIcon size={24} />
				</div>
				<div class="flex items-center gap-2 mb-2">
					<h3 class="text-base font-bold text-slate-900">Sepeda & Motor</h3>
					<span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
						Kode S001-S999
					</span>
				</div>
				<p class="text-xs text-slate-600 leading-relaxed">
					Garasi khusus kendaraan roda dua (sepeda manual dan sepeda motor) dengan proteksi cuaca dan keamanan gembok ganda.
				</p>
			</div>

			<!-- Mobil Konvensional -->
			<div class="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all">
				<div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center mb-5">
					<CarIcon size={24} />
				</div>
				<div class="flex items-center gap-2 mb-2">
					<h3 class="text-base font-bold text-slate-900">Mobil Konvensional</h3>
					<span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
						Kode C001-C999
					</span>
				</div>
				<p class="text-xs text-slate-600 leading-relaxed">
					Unit luas untuk mobil bensin/diesel keluarga dan niaga dengan tarif sewa harian flat atau paket bulanan hemat 25x tarif.
				</p>
			</div>

			<!-- Mobil Listrik EV -->
			<div class="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
				<div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-5">
					<ZapIcon size={24} />
				</div>
				<div class="flex items-center gap-2 mb-2">
					<h3 class="text-base font-bold text-slate-900">Mobil Listrik (EV)</h3>
					<span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
						Kode E001-E999
					</span>
				</div>
				<p class="text-xs text-slate-600 leading-relaxed">
					Dilengkapi stasiun pengisian daya listrik dedicated. Perhitungan biaya cas baterai hingga 100% penuh otomatis per kWh tanpa markup.
				</p>
			</div>
		</div>
	</div>
</div>
