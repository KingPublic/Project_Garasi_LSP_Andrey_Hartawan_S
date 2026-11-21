<script lang="ts">
	import type { ActionData } from './$types';
	import { LockIcon, AlertTriangleIcon, ArrowRightIcon } from '$lib/components/icons';

	let { form }: { form: ActionData } = $props();

	let emailInput = $state('');
	let passwordInput = $state('');

	$effect(() => {
		if (form?.email) {
			emailInput = form.email;
		}
	});
</script>

<svelte:head>
	<title>Masuk - Garasi Ta</title>
</svelte:head>

<div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
		<!-- Header -->
		<div class="text-center">
			<div class="mx-auto w-12 h-12 rounded-2xl bg-prussian text-white flex items-center justify-center shadow-md mb-4">
				<LockIcon size={22} />
			</div>
			<h2 class="text-2xl font-black text-prussian tracking-tight">
				Masuk ke Akun
			</h2>
			<p class="mt-1.5 text-xs text-slate-500">
				Masukkan email dan kata sandi untuk mengakses portal
			</p>
		</div>

		<!-- Error Alert -->
		{#if form?.error}
			<div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
				<AlertTriangleIcon size={18} class="text-rose-500 shrink-0 mt-0.5" />
				<div class="flex-1 font-medium">{form.error}</div>
			</div>
		{/if}

		<!-- Login Form -->
		<form method="POST" class="space-y-4">
			<div>
				<label for="email" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
					Alamat Email
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					bind:value={emailInput}
					placeholder="nama@email.com"
					class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-prussian focus:border-prussian text-sm bg-white transition-all placeholder:text-slate-400"
				/>
			</div>

			<div>
				<label for="password" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
					Kata Sandi
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					bind:value={passwordInput}
					placeholder="••••••••"
					class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-prussian focus:border-prussian text-sm bg-white transition-all placeholder:text-slate-400"
				/>
			</div>

			<!-- Tombol Submit -->
			<div class="pt-2">
				<button
					type="submit"
					class="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-prussian hover:bg-prussian-light shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-prussian flex items-center justify-center gap-2 cursor-pointer"
				>
					<span>Masuk</span>
					<ArrowRightIcon size={16} />
				</button>
			</div>
		</form>

		<!-- Link ke Pendaftaran -->
		<div class="pt-4 border-t border-slate-100 text-center">
			<p class="text-xs text-slate-600">
				Belum memiliki akun terdaftar?
				<a href="/register" class="font-bold text-prussian hover:text-garage-orange hover:underline ml-1">
					Daftar Akun Baru
				</a>
			</p>
		</div>
	</div>
</div>
