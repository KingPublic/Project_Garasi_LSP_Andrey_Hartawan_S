<script lang="ts">
	import type { ActionData } from './$types';
	import {
		ShieldCheckIcon,
		InfoIcon,
		ArrowRightIcon,
		AlertTriangleIcon,
		CheckIcon,
		UserIcon,
		PhoneIcon,
		MailIcon,
		LockIcon
	} from '$lib/components/icons';

	let { form }: { form: ActionData } = $props();

	let nik = $state('');
	let namaLengkap = $state('');
	let noTelepon = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let isSubmitting = $state(false);

	// Status interaksi field (touched)
	let touched = $state({
		nik: false,
		namaLengkap: false,
		noTelepon: false,
		email: false,
		password: false,
		confirmPassword: false
	});

	$effect(() => {
		if (form) {
			if (form.nik) nik = form.nik;
			if (form.namaLengkap) namaLengkap = form.namaLengkap;
			if (form.noTelepon) noTelepon = form.noTelepon;
			if (form.email) email = form.email;
			isSubmitting = false;
		}
	});

	// 1. Validasi NIK (Tepat 16 digit angka)
	let hasNikLetters = $derived(/\D/.test(nik));
	let isNikValid = $derived(/^\d{16}$/.test(nik.trim()));
	let nikFeedback = $derived.by(() => {
		if (!nik && !touched.nik) {
			return { type: 'neutral', message: 'Wajib tepat 16 digit angka KTP resmi.' };
		}
		if (!nik && touched.nik) {
			return { type: 'error', message: 'NIK wajib diisi (16 digit angka).' };
		}
		if (hasNikLetters) {
			return { type: 'error', message: 'NIK hanya boleh berisi angka (0-9), tidak boleh mengandung huruf atau simbol.' };
		}
		if (nik.length < 16) {
			return {
				type: 'warning',
				message: `Kurang ${16 - nik.length} digit lagi (saat ini ${nik.length}/16 digit).`
			};
		}
		if (nik.length > 16) {
			return {
				type: 'error',
				message: `Panjang NIK melebihi 16 digit (saat ini ${nik.length} digit).`
			};
		}
		return { type: 'success', message: 'Format NIK valid (tepat 16 digit angka).' };
	});

	// 2. Validasi Nama Lengkap (Minimal 3 karakter)
	let isNamaValid = $derived(namaLengkap.trim().length >= 3);
	let namaFeedback = $derived.by(() => {
		if (!namaLengkap && !touched.namaLengkap) {
			return { type: 'neutral', message: 'Minimal 3 karakter sesuai KTP.' };
		}
		if (!namaLengkap && touched.namaLengkap) {
			return { type: 'error', message: 'Nama lengkap wajib diisi.' };
		}
		if (namaLengkap.trim().length < 3) {
			return {
				type: 'error',
				message: `Nama terlalu pendek, minimal 3 karakter (saat ini: ${namaLengkap.trim().length} karakter).`
			};
		}
		return { type: 'success', message: 'Nama lengkap memenuhi syarat.' };
	});

	// 3. Validasi Nomor Telepon (10 - 15 digit angka)
	let cleanPhone = $derived(noTelepon.replace(/[\s-]/g, ''));
	let phoneDigitsOnly = $derived(cleanPhone.replace(/\D/g, ''));
	let hasInvalidPhoneChars = $derived(!/^[+0-9\s-]*$/.test(noTelepon));
	let isPhoneValid = $derived(/^\+?[0-9]{10,15}$/.test(cleanPhone));
	let phoneFeedback = $derived.by(() => {
		if (!noTelepon && !touched.noTelepon) {
			return { type: 'neutral', message: 'Format 10 - 15 digit angka (contoh: 081234567890).' };
		}
		if (!noTelepon && touched.noTelepon) {
			return { type: 'error', message: 'Nomor HP / WhatsApp wajib diisi.' };
		}
		if (hasInvalidPhoneChars) {
			return { type: 'error', message: 'Hanya boleh berisi angka dan simbol + atau tanda hubung (-).' };
		}
		if (phoneDigitsOnly.length < 10) {
			return {
				type: 'warning',
				message: `Kurang ${10 - phoneDigitsOnly.length} digit lagi (minimal 10 digit, saat ini: ${phoneDigitsOnly.length} digit).`
			};
		}
		if (phoneDigitsOnly.length > 15) {
			return {
				type: 'error',
				message: `Nomor telepon melebihi batas maksimal 15 digit (saat ini: ${phoneDigitsOnly.length} digit).`
			};
		}
		return { type: 'success', message: 'Format nomor telepon valid.' };
	});

	// 4. Validasi Alamat Email
	let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	let isEmailValid = $derived(emailRegex.test(email.trim()));
	let emailFeedback = $derived.by(() => {
		if (!email && !touched.email) {
			return { type: 'neutral', message: 'Gunakan alamat email aktif (contoh: nama@domain.com).' };
		}
		if (!email && touched.email) {
			return { type: 'error', message: 'Alamat email wajib diisi.' };
		}
		if (!email.includes('@')) {
			return { type: 'warning', message: 'Format belum lengkap: harus menyertakan tanda "@" (contoh: nama@domain.com).' };
		}
		if (!isEmailValid) {
			return { type: 'warning', message: 'Format domain belum lengkap (contoh: nama@domain.com).' };
		}
		return { type: 'success', message: 'Format alamat email valid.' };
	});

	// 5. Validasi Kata Sandi (Minimal 6 karakter)
	let isPasswordValid = $derived(password.length >= 6);
	let passwordFeedback = $derived.by(() => {
		if (!password && !touched.password) {
			return { type: 'neutral', message: 'Minimal 6 karakter.' };
		}
		if (!password && touched.password) {
			return { type: 'error', message: 'Kata sandi wajib diisi.' };
		}
		if (password.length < 6) {
			return {
				type: 'warning',
				message: `Kurang ${6 - password.length} karakter lagi (minimal 6 karakter, saat ini: ${password.length}).`
			};
		}
		return { type: 'success', message: 'Panjang kata sandi memenuhi syarat.' };
	});

	// 6. Validasi Konfirmasi Kata Sandi
	let isConfirmValid = $derived(confirmPassword.length >= 6 && confirmPassword === password);
	let confirmFeedback = $derived.by(() => {
		if (!confirmPassword && !touched.confirmPassword) {
			return { type: 'neutral', message: 'Ulangi kata sandi yang sama persis.' };
		}
		if (!confirmPassword && touched.confirmPassword) {
			return { type: 'error', message: 'Konfirmasi kata sandi wajib diisi.' };
		}
		if (confirmPassword !== password) {
			return { type: 'error', message: 'Konfirmasi kata sandi tidak cocok dengan kata sandi di atas.' };
		}
		return { type: 'success', message: 'Konfirmasi kata sandi cocok.' };
	});

	// Status form keseluruhan
	let isFormValid = $derived(
		isNikValid && isNamaValid && isPhoneValid && isEmailValid && isPasswordValid && isConfirmValid
	);

	function handleSubmit(e: SubmitEvent) {
		touched.nik = true;
		touched.namaLengkap = true;
		touched.noTelepon = true;
		touched.email = true;
		touched.password = true;
		touched.confirmPassword = true;

		if (!isFormValid) {
			e.preventDefault();
			return;
		}

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
				Daftarkan identitas resmi Anda untuk mulai menyewa garasi aman dan terpercaya di Garasi Ta.
			</p>
		</div>

		<!-- Form Card -->
		<div class="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-10 backdrop-blur-sm">
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
						NIK wajib tepat 16 digit angka KTP. Setelah mendaftar, akun berstatus <span class="font-bold text-prussian">PENDING</span> dan akan diverifikasi oleh Admin sebelum Anda dapat melakukan transaksi penyewaan garasi.
					</p>
				</div>
			</div>

			<form method="POST" onsubmit={handleSubmit} novalidate class="space-y-4">
				<!-- NIK Input -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<label for="nik" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
							Nomor Induk Kependudukan (NIK) <span class="text-rose-500">*</span>
						</label>
						<span
							class="text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold {nik.length === 16 && !hasNikLetters
								? 'bg-emerald-100 text-emerald-800'
								: nik.length > 16 || hasNikLetters
									? 'bg-rose-100 text-rose-800'
									: 'bg-slate-100 text-slate-600'}"
						>
							{nik.length} / 16 Digit
						</span>
					</div>
					<div class="relative">
						<input
							type="text"
							id="nik"
							name="nik"
							bind:value={nik}
							oninput={() => (touched.nik = true)}
							onblur={() => (touched.nik = true)}
							maxlength="16"
							placeholder="Contoh: 7371012304950001 (16 digit angka)"
							class="w-full px-4 py-2.5 rounded-xl border text-slate-900 text-sm transition-all focus:outline-none {nikFeedback.type === 'error'
								? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
								: nikFeedback.type === 'warning'
									? 'border-amber-400 bg-amber-50/20 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
									: nikFeedback.type === 'success'
										? 'border-emerald-400 bg-emerald-50/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
										: 'border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20'}"
						/>
						{#if nikFeedback.type === 'success'}
							<span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
								<CheckIcon size={16} />
							</span>
						{/if}
					</div>
					<!-- Feedback message -->
					<div class="mt-1 flex items-center gap-1.5 text-xs {nikFeedback.type === 'error'
						? 'text-rose-600 font-medium'
						: nikFeedback.type === 'warning'
							? 'text-amber-700 font-medium'
							: nikFeedback.type === 'success'
								? 'text-emerald-700 font-medium'
								: 'text-slate-500'}">
						{#if nikFeedback.type === 'error'}
							<AlertTriangleIcon size={13} class="shrink-0" />
						{:else if nikFeedback.type === 'warning'}
							<InfoIcon size={13} class="shrink-0" />
						{:else if nikFeedback.type === 'success'}
							<CheckIcon size={13} class="shrink-0" />
						{/if}
						<span>{nikFeedback.message}</span>
					</div>
				</div>

				<!-- Nama Lengkap & No Telepon -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<!-- Nama Lengkap -->
					<div>
						<div class="flex items-center justify-between mb-1">
							<label for="namaLengkap" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
								Nama Lengkap <span class="text-rose-500">*</span>
							</label>
							{#if namaLengkap.length > 0}
								<span class="text-[10px] font-mono text-slate-400">{namaLengkap.trim().length} kar</span>
							{/if}
						</div>
						<div class="relative">
							<input
								type="text"
								id="namaLengkap"
								name="namaLengkap"
								bind:value={namaLengkap}
								oninput={() => (touched.namaLengkap = true)}
								onblur={() => (touched.namaLengkap = true)}
								placeholder="Nama sesuai KTP"
								class="w-full px-4 py-2.5 rounded-xl border text-slate-900 text-sm transition-all focus:outline-none {namaFeedback.type === 'error'
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
									: namaFeedback.type === 'success'
										? 'border-emerald-400 bg-emerald-50/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
										: 'border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20'}"
							/>
							{#if namaFeedback.type === 'success'}
								<span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
									<CheckIcon size={16} />
								</span>
							{/if}
						</div>
						<div class="mt-1 flex items-center gap-1.5 text-xs {namaFeedback.type === 'error'
							? 'text-rose-600 font-medium'
							: namaFeedback.type === 'success'
								? 'text-emerald-700 font-medium'
								: 'text-slate-500'}">
							{#if namaFeedback.type === 'error'}
								<AlertTriangleIcon size={13} class="shrink-0" />
							{:else if namaFeedback.type === 'success'}
								<CheckIcon size={13} class="shrink-0" />
							{/if}
							<span>{namaFeedback.message}</span>
						</div>
					</div>

					<!-- No Telepon -->
					<div>
						<div class="flex items-center justify-between mb-1">
							<label for="noTelepon" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
								Nomor HP / WA <span class="text-rose-500">*</span>
							</label>
							{#if phoneDigitsOnly.length > 0}
								<span class="text-[10px] font-mono text-slate-400">{phoneDigitsOnly.length} digit</span>
							{/if}
						</div>
						<div class="relative">
							<input
								type="tel"
								id="noTelepon"
								name="noTelepon"
								bind:value={noTelepon}
								oninput={() => (touched.noTelepon = true)}
								onblur={() => (touched.noTelepon = true)}
								placeholder="Contoh: 081234567890"
								class="w-full px-4 py-2.5 rounded-xl border text-slate-900 text-sm transition-all focus:outline-none {phoneFeedback.type === 'error'
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
									: phoneFeedback.type === 'warning'
										? 'border-amber-400 bg-amber-50/20 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
										: phoneFeedback.type === 'success'
											? 'border-emerald-400 bg-emerald-50/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
											: 'border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20'}"
							/>
							{#if phoneFeedback.type === 'success'}
								<span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
									<CheckIcon size={16} />
								</span>
							{/if}
						</div>
						<div class="mt-1 flex items-center gap-1.5 text-xs {phoneFeedback.type === 'error'
							? 'text-rose-600 font-medium'
							: phoneFeedback.type === 'warning'
								? 'text-amber-700 font-medium'
								: phoneFeedback.type === 'success'
									? 'text-emerald-700 font-medium'
									: 'text-slate-500'}">
							{#if phoneFeedback.type === 'error'}
								<AlertTriangleIcon size={13} class="shrink-0" />
							{:else if phoneFeedback.type === 'warning'}
								<InfoIcon size={13} class="shrink-0" />
							{:else if phoneFeedback.type === 'success'}
								<CheckIcon size={13} class="shrink-0" />
							{/if}
							<span>{phoneFeedback.message}</span>
						</div>
					</div>
				</div>

				<!-- Email Input -->
				<div>
					<label for="email" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
						Alamat Email <span class="text-rose-500">*</span>
					</label>
					<div class="relative">
						<input
							type="email"
							id="email"
							name="email"
							bind:value={email}
							oninput={() => (touched.email = true)}
							onblur={() => (touched.email = true)}
							placeholder="nama@email.com"
							class="w-full px-4 py-2.5 rounded-xl border text-slate-900 text-sm transition-all focus:outline-none {emailFeedback.type === 'error'
								? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
								: emailFeedback.type === 'warning'
									? 'border-amber-400 bg-amber-50/20 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
									: emailFeedback.type === 'success'
										? 'border-emerald-400 bg-emerald-50/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
										: 'border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20'}"
						/>
						{#if emailFeedback.type === 'success'}
							<span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
								<CheckIcon size={16} />
							</span>
						{/if}
					</div>
					<div class="mt-1 flex items-center gap-1.5 text-xs {emailFeedback.type === 'error'
						? 'text-rose-600 font-medium'
						: emailFeedback.type === 'warning'
							? 'text-amber-700 font-medium'
							: emailFeedback.type === 'success'
								? 'text-emerald-700 font-medium'
								: 'text-slate-500'}">
						{#if emailFeedback.type === 'error'}
							<AlertTriangleIcon size={13} class="shrink-0" />
						{:else if emailFeedback.type === 'warning'}
							<InfoIcon size={13} class="shrink-0" />
						{:else if emailFeedback.type === 'success'}
							<CheckIcon size={13} class="shrink-0" />
						{/if}
						<span>{emailFeedback.message}</span>
					</div>
				</div>

				<!-- Password & Konfirmasi Password -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<!-- Kata Sandi -->
					<div>
						<div class="flex items-center justify-between mb-1">
							<label for="password" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
								Kata Sandi <span class="text-rose-500">*</span>
							</label>
							{#if password.length > 0}
								<span class="text-[10px] font-mono text-slate-400">{password.length}/6 kar</span>
							{/if}
						</div>
						<div class="relative">
							<input
								type="password"
								id="password"
								name="password"
								bind:value={password}
								oninput={() => (touched.password = true)}
								onblur={() => (touched.password = true)}
								placeholder="Minimal 6 karakter"
								class="w-full px-4 py-2.5 rounded-xl border text-slate-900 text-sm transition-all focus:outline-none {passwordFeedback.type === 'error'
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
									: passwordFeedback.type === 'warning'
										? 'border-amber-400 bg-amber-50/20 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
										: passwordFeedback.type === 'success'
											? 'border-emerald-400 bg-emerald-50/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
											: 'border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20'}"
							/>
							{#if passwordFeedback.type === 'success'}
								<span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
									<CheckIcon size={16} />
								</span>
							{/if}
						</div>
						<div class="mt-1 flex items-center gap-1.5 text-xs {passwordFeedback.type === 'error'
							? 'text-rose-600 font-medium'
							: passwordFeedback.type === 'warning'
								? 'text-amber-700 font-medium'
								: passwordFeedback.type === 'success'
									? 'text-emerald-700 font-medium'
									: 'text-slate-500'}">
							{#if passwordFeedback.type === 'error'}
								<AlertTriangleIcon size={13} class="shrink-0" />
							{:else if passwordFeedback.type === 'warning'}
								<InfoIcon size={13} class="shrink-0" />
							{:else if passwordFeedback.type === 'success'}
								<CheckIcon size={13} class="shrink-0" />
							{/if}
							<span>{passwordFeedback.message}</span>
						</div>
					</div>

					<!-- Konfirmasi Kata Sandi -->
					<div>
						<div class="flex items-center justify-between mb-1">
							<label for="confirmPassword" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
								Konfirmasi Sandi <span class="text-rose-500">*</span>
							</label>
						</div>
						<div class="relative">
							<input
								type="password"
								id="confirmPassword"
								name="confirmPassword"
								bind:value={confirmPassword}
								oninput={() => (touched.confirmPassword = true)}
								onblur={() => (touched.confirmPassword = true)}
								placeholder="Ulangi kata sandi"
								class="w-full px-4 py-2.5 rounded-xl border text-slate-900 text-sm transition-all focus:outline-none {confirmFeedback.type === 'error'
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
									: confirmFeedback.type === 'success'
										? 'border-emerald-400 bg-emerald-50/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
										: 'border-slate-300 focus:border-garage-orange focus:ring-2 focus:ring-garage-orange/20'}"
							/>
							{#if confirmFeedback.type === 'success'}
								<span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
									<CheckIcon size={16} />
								</span>
							{/if}
						</div>
						<div class="mt-1 flex items-center gap-1.5 text-xs {confirmFeedback.type === 'error'
							? 'text-rose-600 font-medium'
							: confirmFeedback.type === 'success'
								? 'text-emerald-700 font-medium'
								: 'text-slate-500'}">
							{#if confirmFeedback.type === 'error'}
								<AlertTriangleIcon size={13} class="shrink-0" />
							{:else if confirmFeedback.type === 'success'}
								<CheckIcon size={13} class="shrink-0" />
							{/if}
							<span>{confirmFeedback.message}</span>
						</div>
					</div>
				</div>

				<!-- Tombol Daftar -->
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
