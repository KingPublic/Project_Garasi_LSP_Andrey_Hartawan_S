<script lang="ts">
	import type { ActionData } from './$types';
	import {
		LockIcon,
		AlertTriangleIcon,
		ArrowRightIcon,
		CheckIcon,
		InfoIcon
	} from '$lib/components/icons';

	let { form }: { form: ActionData } = $props();

	let emailInput = $state('');
	let passwordInput = $state('');
	let isSubmitting = $state(false);

	let touched = $state({
		email: false,
		password: false
	});

	$effect(() => {
		if (form?.email) {
			emailInput = form.email;
		}
		if (form) {
			isSubmitting = false;
		}
	});

	let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	let isEmailValid = $derived(emailRegex.test(emailInput.trim()));
	let emailFeedback = $derived.by(() => {
		if (!touched.email) {
			return { type: 'neutral', message: '' };
		}
		if (!emailInput) {
			return { type: 'error', message: 'Alamat email wajib diisi.' };
		}
		if (!emailInput.includes('@') || !isEmailValid) {
			return { type: 'warning', message: 'Format email belum valid (contoh: nama@garasi.com).' };
		}
		return { type: 'success', message: '' };
	});

	let isPasswordValid = $derived(passwordInput.length > 0);
	let passwordFeedback = $derived.by(() => {
		if (!touched.password) {
			return { type: 'neutral', message: '' };
		}
		if (!passwordInput) {
			return { type: 'error', message: 'Kata sandi wajib diisi.' };
		}
		return { type: 'neutral', message: '' };
	});

	function handleSubmit(e: SubmitEvent) {
		touched.email = true;
		touched.password = true;

		if (!isEmailValid || !isPasswordValid) {
			e.preventDefault();
			return;
		}

		isSubmitting = true;
	}
</script>

<svelte:head>
	<title>Masuk - Garasi Ta</title>
</svelte:head>

<div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
	<div class="max-w-md w-full space-y-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl">
		<!-- Header -->
		<div class="text-center">
			<div class="mx-auto w-14 h-14 rounded-2xl bg-prussian text-garage-orange flex items-center justify-center shadow-md mb-4">
				<LockIcon size={26} />
			</div>
			<h2 class="text-2xl font-black text-prussian tracking-tight">
				Masuk
			</h2>
			<p class="mt-1.5 text-xs text-slate-500">
				Masukkan email dan kata sandi akun Anda.
			</p>
		</div>

		<!-- Error Alert -->
		{#if form?.error}
			<div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
				<AlertTriangleIcon size={18} class="text-rose-500 shrink-0 mt-0.5" />
				<div>
					<p class="font-bold text-rose-900">Login Gagal</p>
					<p class="text-rose-700 mt-0.5 leading-relaxed">{form.error}</p>
				</div>
			</div>
		{/if}

		<!-- Login Form -->
		<form method="POST" onsubmit={handleSubmit} novalidate class="space-y-4">
			<!-- Email Input -->
			<div>
				<label for="email" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
					Alamat Email <span class="text-rose-500">*</span>
				</label>
				<div class="relative">
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						bind:value={emailInput}
						oninput={() => (touched.email = true)}
						onblur={() => (touched.email = true)}
						placeholder="nama@email.com"
						class="w-full px-4 py-2.5 rounded-xl border text-sm bg-white transition-all focus:outline-none placeholder:text-slate-400 {emailFeedback.type === 'error'
							? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
							: emailFeedback.type === 'warning'
								? 'border-amber-400 bg-amber-50/20 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
								: emailFeedback.type === 'success'
									? 'border-emerald-400 bg-emerald-50/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
									: 'border-slate-300 focus:ring-2 focus:ring-prussian focus:border-prussian'}"
					/>
					{#if emailFeedback.type === 'success'}
						<span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
							<CheckIcon size={16} />
						</span>
					{/if}
				</div>
				{#if emailFeedback.message}
					<div class="mt-1 flex items-center gap-1.5 text-xs {emailFeedback.type === 'error'
						? 'text-rose-600 font-medium'
						: 'text-amber-700 font-medium'}">
						{#if emailFeedback.type === 'error'}
							<AlertTriangleIcon size={13} class="shrink-0" />
						{:else if emailFeedback.type === 'warning'}
							<InfoIcon size={13} class="shrink-0" />
						{/if}
						<span>{emailFeedback.message}</span>
					</div>
				{/if}
			</div>

			<!-- Password Input -->
			<div>
				<label for="password" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
					Kata Sandi <span class="text-rose-500">*</span>
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					bind:value={passwordInput}
					oninput={() => (touched.password = true)}
					onblur={() => (touched.password = true)}
					placeholder="••••••••"
					class="w-full px-4 py-2.5 rounded-xl border text-sm bg-white transition-all focus:outline-none placeholder:text-slate-400 {passwordFeedback.type === 'error'
						? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
						: 'border-slate-300 focus:ring-2 focus:ring-prussian focus:border-prussian'}"
				/>
				{#if passwordFeedback.message}
					<div class="mt-1 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
						<AlertTriangleIcon size={13} class="shrink-0" />
						<span>{passwordFeedback.message}</span>
					</div>
				{/if}
			</div>

			<!-- Tombol Submit -->
			<div class="pt-2">
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-prussian hover:bg-prussian-light shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-prussian flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
						</svg>
						<span>Memverifikasi...</span>
					{:else}
						<span>Masuk ke Akun</span>
						<ArrowRightIcon size={16} />
					{/if}
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
