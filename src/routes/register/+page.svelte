<script lang="ts">
	import type { ActionData } from './$types';
	import { ShieldCheckIcon, InfoIcon, ArrowRightIcon, AlertTriangleIcon } from '$lib/components/icons';

	let { form }: { form: ActionData } = $props();

	let nik = $state('');
	let namaLengkap = $state('');
	let noTelepon = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (form) {
			if (form.nik) nik = form.nik;
			if (form.namaLengkap) namaLengkap = form.namaLengkap;
			if (form.noTelepon) noTelepon = form.noTelepon;
			if (form.email) email = form.email;
			isSubmitting = false;
		}
	});

	function handleSubmit() {
		isSubmitting = true;
	}
</script>

<svelte:head>
	<title>Daftar Akun Penyewa - Garasi Ta</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
	<div class="max-w-xl w-full">
		<!-- Header Card -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-prussian text-garage-orange shadow-lg mb-4">
				<ShieldCheckIcon size={32} />
			</div>
			<h1 class="text-3xl font-extrabold text-prussian tracking-tight">
				Pendaftaran Calon Penyewa
			</h1>
			<p class="mt-2 text-sm text-slate-600">
				Daftarkan identitas NIK resmi Anda untuk mulai menyewa garasi aman dan terpercaya.
			</p>
		</div>

		<!-- Form Card -->
		<div class="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 sm:p-10 backdrop-blur-sm">
			{#if form?.error}
				<div class="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
					<AlertTriangleIcon size={20} class="text-rose-500 shrink-0 mt-0.5" />
					<div>
						<p class="font-semibold">Registrasi Gagal</p>
						<p class="text-rose-700 mt-0.5">{form.error}</p>
					</div>
				</div>
			{/if}

			<div class="mb-6 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
				<InfoIcon size={18} class="text-garage-orange shrink-0 mt-0.5" />
				<div>
					<p class="font-semibold">Ketentuan Verifikasi Akun:</p>
					<p class="text-amber-800 mt-0.5">
						NIK wajib 16 digit angka resmi KTP. Setelah mendaftar, status akun berstatus <span class="font-bold text-prussian">PENDING</span> dan akan diverifikasi oleh Admin sebelum Anda dapat melakukan transaksi penyewaan.
					</p>
				</div>
			</div>

			<form method="POST" onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="nik" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
						Nomor Induk Kependudukan (NIK) <span class="text-rose-500">*</span>
					</label>
					<input
						type="text"
						id="nik"
						name="nik"
						bind:value={nik}
						maxlength="16"
						pattern="[0-9]{16}"
						placeholder="Contoh: 3201012345678901 (16 digit angka)"
						required
						class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20 text-slate-900 text-sm transition-all"
					/>
					<p class="text-[11px] text-slate-500 mt-1">Wajib tepat 16 digit angka KTP.</p>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="namaLengkap" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
							Nama Lengkap <span class="text-rose-500">*</span>
						</label>
						<input
							type="text"
							id="namaLengkap"
							name="namaLengkap"
							bind:value={namaLengkap}
							placeholder="Nama sesuai KTP"
							required
							class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20 text-slate-900 text-sm transition-all"
						/>
					</div>

					<div>
						<label for="noTelepon" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
							Nomor HP / WhatsApp <span class="text-rose-500">*</span>
						</label>
						<input
							type="tel"
							id="noTelepon"
							name="noTelepon"
							bind:value={noTelepon}
							placeholder="081234567890"
							required
							class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20 text-slate-900 text-sm transition-all"
						/>
					</div>
				</div>

				<div>
					<label for="email" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
						Alamat Email <span class="text-rose-500">*</span>
					</label>
					<input
						type="email"
						id="email"
						name="email"
						bind:value={email}
						placeholder="nama@email.com"
						required
						class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20 text-slate-900 text-sm transition-all"
					/>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="password" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
							Kata Sandi <span class="text-rose-500">*</span>
						</label>
						<input
							type="password"
							id="password"
							name="password"
							bind:value={password}
							minlength="6"
							placeholder="Minimal 6 karakter"
							required
							class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20 text-slate-900 text-sm transition-all"
						/>
					</div>

					<div>
						<label for="confirmPassword" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
							Konfirmasi Kata Sandi <span class="text-rose-500">*</span>
						</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							bind:value={confirmPassword}
							minlength="6"
							placeholder="Ulangi kata sandi"
							required
							class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20 text-slate-900 text-sm transition-all"
						/>
					</div>
				</div>

				<div class="pt-4">
					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-prussian bg-garage-orange hover:bg-garage-orange-hover focus:outline-none focus:ring-4 focus:ring-garage-orange/30 shadow-lg shadow-garage-orange/20 transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed text-sm"
					>
						{#if isSubmitting}
							<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-prussian" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
							</svg>
							<span>Mendaftarkan Akun...</span>
						{:else}
							<span>Daftar Akun Sekarang</span>
							<ArrowRightIcon size={16} />
						{/if}
					</button>
				</div>
			</form>

			<div class="mt-6 pt-6 border-t border-slate-100 text-center">
				<p class="text-sm text-slate-600">
					Sudah memiliki akun terdaftar?
					<a href="/login" class="font-semibold text-prussian hover:text-garage-orange hover:underline transition-colors">
						Masuk ke Akun
					</a>
				</p>
			</div>
		</div>
	</div>
</div>
