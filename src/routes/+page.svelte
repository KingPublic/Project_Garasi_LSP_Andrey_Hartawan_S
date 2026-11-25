<script lang="ts">
	import { BikeIcon, CarIcon, ZapIcon, ArrowRightIcon } from '$lib/components/icons';
</script>

<div class="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-white to-slate-50/60">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Hero Section -->
		<div class="text-center max-w-3xl mx-auto">
			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-prussian tracking-tight leading-tight">
				Sewa Garasi Kendaraan <br class="hidden sm:inline" />
				Harian &amp; <span class="text-garage-orange">Bulanan</span>
			</h1>

			<p class="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
				Layanan penitipan dan penyewaan unit garasi untuk sepeda, sepeda motor, mobil, serta mobil listrik dengan perhitungan tarif sewa dan pengisian daya baterai per kWh.
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
						S001–S999
					</span>
				</div>
				<p class="text-xs text-slate-600 leading-relaxed">
					Garasi khusus kendaraan roda dua untuk sepeda manual dan sepeda motor.
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
						C001–C999
					</span>
				</div>
				<p class="text-xs text-slate-600 leading-relaxed">
					Unit garasi mobil bensin atau diesel dengan pilihan sewa harian atau paket bulanan setara 25 hari tarif harian.
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
						E001–E999
					</span>
				</div>
				<p class="text-xs text-slate-600 leading-relaxed">
					Dilengkapi pengisian daya baterai hingga penuh dengan tarif dihitung berdasarkan selisih kWh baterai.
				</p>
			</div>
		</div>
	</div>
</div>
