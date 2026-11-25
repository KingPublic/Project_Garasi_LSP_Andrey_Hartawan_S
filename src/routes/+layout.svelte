<script lang="ts">
	import './layout.css';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import {
		CarIcon,
		BuildingIcon,
		ShieldCheckIcon,
		ClockIcon,
		DollarSignIcon,
		FileTextIcon,
		PlusIcon,
		ArrowRightIcon,
		LogOutIcon,
		UserIcon
	} from '$lib/components/icons';

	let { data, children }: LayoutProps = $props();
	let mobileMenuOpen = $state(false);

	let currentPath = $derived(page.url.pathname);
	let isDashboardRoute = $derived(
		Boolean(data.user && (currentPath.startsWith('/admin') || currentPath.startsWith('/penyewa')))
	);

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function isActive(path: string) {
		return currentPath === path;
	}

	// Breadcrumb navigasi halaman
	let breadcrumbText = $derived.by(() => {
		if (currentPath === '/admin/garasi') return 'Admin / Unit Garasi';
		if (currentPath === '/admin/verifikasi') return 'Admin / Verifikasi Calon';
		if (currentPath === '/admin/pembayaran') return 'Admin / Verifikasi Pembayaran';
		if (currentPath === '/admin/perpanjang') return 'Admin / Perpanjangan Sewa';
		if (currentPath === '/admin/laporan') return 'Admin / Laporan';
		if (currentPath === '/penyewa') return 'Penyewa / Dashboard';
		if (currentPath === '/penyewa/sewa-baru') return 'Penyewa / Sewa Garasi Baru';
		return 'Dashboard';
	});
</script>

<svelte:head>
	<title>Garasi Ta - Sistem Persewaan Garasi Kendaraan</title>
	<meta name="description" content="Aplikasi web manajemen dan persewaan garasi kendaraan resmi" />
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
	{#if isDashboardRoute && data.user}
		<!-- Layout Dashboard dengan Sidebar -->
		<div class="min-h-screen flex flex-col md:flex-row bg-[#f8f9fa]">
			<!-- Desktop Left Sidebar -->
			<aside class="hidden md:flex flex-col w-64 lg:w-72 bg-carbon-black text-white shrink-0 min-h-screen sticky top-0 h-screen border-r border-gunmetal/40 select-none z-30">
				<!-- Brand Logo -->
				<div class="p-6 border-b border-gunmetal/30">
					<a href={data.user.role === 'ADMIN' ? '/admin/garasi' : '/penyewa'} class="flex items-center gap-3 group">
						<div class="w-10 h-10 rounded-xl bg-garage-orange text-carbon-black flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
							<CarIcon size={22} strokeWidth={2.5} />
						</div>
						<div class="flex flex-col">
							<span class="text-lg font-black tracking-tight text-white flex items-center gap-1 leading-none">
								GARASI<span class="text-garage-orange"> TA</span>
							</span>
							<span class="text-[10px] tracking-widest uppercase text-slate-400 font-bold mt-1">
								{data.user.role === 'ADMIN' ? 'Panel Admin' : 'Portal Penyewa'}
							</span>
						</div>
					</a>
				</div>

				<!-- Navigation Menu List -->
				<div class="flex-1 overflow-y-auto px-4 py-6 space-y-6">
					<!-- Group: Utama -->
					<div>
						<p class="text-[10px] font-bold tracking-widest uppercase text-slate-400 px-3 mb-2.5">
							Menu Utama
						</p>
						<nav class="space-y-1">
							{#if data.user.role === 'ADMIN'}
								<a
									href="/admin/garasi"
									class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all {isActive('/admin/garasi') ? 'bg-white/15 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
								>
									<BuildingIcon size={18} class={isActive('/admin/garasi') ? 'text-garage-orange' : 'text-slate-400'} />
									<span>Unit Garasi</span>
								</a>

								<a
									href="/admin/verifikasi"
									class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all {isActive('/admin/verifikasi') ? 'bg-white/15 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
								>
									<ShieldCheckIcon size={18} class={isActive('/admin/verifikasi') ? 'text-garage-orange' : 'text-slate-400'} />
									<span>Verifikasi Calon</span>
								</a>

								<!-- Menu verifikasi pembayaran di-keep jika dibutuhkan di masa mendatang
								<a
									href="/admin/pembayaran"
									class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all {isActive('/admin/pembayaran') ? 'bg-white/15 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
								>
									<DollarSignIcon size={18} class={isActive('/admin/pembayaran') ? 'text-garage-orange' : 'text-slate-400'} />
									<span>Verifikasi Pembayaran</span>
								</a>
								-->

								<a
									href="/admin/perpanjang"
									class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all {isActive('/admin/perpanjang') ? 'bg-white/15 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
								>
									<ClockIcon size={18} class={isActive('/admin/perpanjang') ? 'text-garage-orange' : 'text-slate-400'} />
									<span>Perpanjangan Sewa</span>
								</a>

								<a
									href="/admin/laporan"
									class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all {isActive('/admin/laporan') ? 'bg-white/15 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
								>
									<FileTextIcon size={18} class={isActive('/admin/laporan') ? 'text-garage-orange' : 'text-slate-400'} />
									<span>Laporan & Keuangan</span>
								</a>
							{:else}
								<a
									href="/penyewa"
									class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all {isActive('/penyewa') && !isActive('/penyewa/sewa-baru') ? 'bg-white/15 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
								>
									<BuildingIcon size={18} class={isActive('/penyewa') ? 'text-garage-orange' : 'text-slate-400'} />
									<span>Dashboard Saya</span>
								</a>

								<a
									href="/penyewa/sewa-baru"
									class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all {isActive('/penyewa/sewa-baru') ? 'bg-garage-orange text-carbon-black font-bold shadow-xs' : 'text-garage-orange hover:bg-garage-orange/10'}"
								>
									<PlusIcon size={18} />
									<span>Sewa Garasi Baru</span>
								</a>
							{/if}
						</nav>
					</div>

					<!-- Group: Lainnya -->
					<div class="pt-4 border-t border-gunmetal/30">
						<p class="text-[10px] font-bold tracking-widest uppercase text-slate-400 px-3 mb-2.5">
							Lainnya
						</p>
						<a
							href="/"
							class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
						>
							<span class="flex items-center gap-3">
								<CarIcon size={18} class="text-slate-400" />
								<span>Lihat Website</span>
							</span>
							<ArrowRightIcon size={14} class="text-slate-500" />
						</a>
					</div>
				</div>

				<!-- Sidebar Footer Profile & Logout -->
				<div class="p-4 border-t border-gunmetal/30 bg-carbon-black/60">
					<div class="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 mb-3">
						<div class="w-9 h-9 rounded-xl bg-garage-orange/20 text-garage-orange border border-garage-orange/30 flex items-center justify-center font-bold text-sm shrink-0">
							{data.user.namaLengkap ? data.user.namaLengkap[0].toUpperCase() : 'U'}
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-xs font-bold text-white truncate leading-tight">{data.user.namaLengkap}</p>
							<p class="text-[11px] text-slate-400 truncate mt-0.5">
								{#if data.user.role === 'ADMIN'}
									Administrator
								{:else if data.user.statusVerifikasi === 'APPROVED'}
									Penyewa Terverifikasi
								{:else if data.user.statusVerifikasi === 'PENDING'}
									Menunggu Verifikasi
								{:else}
									Akun Ditolak
								{/if}
							</p>
						</div>
					</div>

					<form action="/logout" method="POST">
						<button
							type="submit"
							class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-950/30 transition-all cursor-pointer"
						>
							<LogOutIcon size={15} />
							<span>Keluar Akun</span>
						</button>
					</form>
				</div>
			</aside>

			<!-- Mobile Dashboard Topbar -->
			<div class="md:hidden sticky top-0 z-40 bg-carbon-black text-white px-4 py-3 border-b border-gunmetal/40 flex items-center justify-between shadow-sm">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-garage-orange text-carbon-black flex items-center justify-center font-black">
						<CarIcon size={18} strokeWidth={2.5} />
					</div>
					<span class="text-base font-black tracking-tight text-white">
						GARASI<span class="text-garage-orange"> TA</span>
					</span>
				</div>

				<button
					type="button"
					onclick={toggleMobileMenu}
					class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-gunmetal focus:outline-none"
					aria-label="Toggle Menu"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
			</div>

			<!-- Mobile Drawer -->
			{#if mobileMenuOpen}
				<div class="md:hidden fixed inset-0 z-50 flex">
					<button
						type="button"
						aria-label="Tutup Menu Navigasi"
						tabindex="-1"
						class="fixed inset-0 bg-carbon-black/70 backdrop-blur-xs cursor-default border-0"
						onclick={closeMobileMenu}
					></button>
					<div class="relative w-72 max-w-[80%] bg-carbon-black text-white flex flex-col justify-between p-5 z-10 shadow-2xl">
						<div class="space-y-6">
							<div class="flex items-center justify-between pb-4 border-b border-gunmetal/40">
								<div class="flex items-center gap-2">
									<div class="w-8 h-8 rounded-lg bg-garage-orange text-carbon-black flex items-center justify-center font-black">
										<CarIcon size={18} strokeWidth={2.5} />
									</div>
									<span class="text-sm font-black text-white">GARASI TA</span>
								</div>
								<button type="button" onclick={closeMobileMenu} aria-label="Tutup Menu" class="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">✕</button>
							</div>

							<nav class="space-y-1">
								{#if data.user.role === 'ADMIN'}
									<a href="/admin/garasi" onclick={closeMobileMenu} class="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-gunmetal">Unit Garasi</a>
									<a href="/admin/verifikasi" onclick={closeMobileMenu} class="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-gunmetal">Verifikasi Calon</a>
									<!-- <a href="/admin/pembayaran" onclick={closeMobileMenu} class="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-gunmetal">Verifikasi Pembayaran</a> -->
									<a href="/admin/perpanjang" onclick={closeMobileMenu} class="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-gunmetal">Perpanjangan Sewa</a>
									<a href="/admin/laporan" onclick={closeMobileMenu} class="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-gunmetal">Laporan & Keuangan</a>
								{:else}
									<a href="/penyewa" onclick={closeMobileMenu} class="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-gunmetal">Dashboard Saya</a>
									<a href="/penyewa/sewa-baru" onclick={closeMobileMenu} class="block px-3 py-2 rounded-xl text-xs font-bold text-garage-orange hover:bg-gunmetal">Sewa Garasi Baru</a>
								{/if}
								<a href="/" onclick={closeMobileMenu} class="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-gunmetal">Lihat Website</a>
							</nav>
						</div>

						<form action="/logout" method="POST" class="pt-4 border-t border-gunmetal/40">
							<button type="submit" class="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40">
								Keluar Akun
							</button>
						</form>
					</div>
				</div>
			{/if}

			<!-- Right Main Content Area -->
			<div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
				<!-- Desktop Topbar -->
				<header class="hidden md:flex h-14 bg-white border-b border-slate-200 px-8 items-center justify-between sticky top-0 z-20">
					<div class="flex items-center gap-2 text-xs text-slate-600 font-semibold">
						<span>{breadcrumbText}</span>
					</div>

					<div class="text-xs text-slate-500">
						{data.user.email}
					</div>
				</header>

				<!-- Page Body -->
				<main class="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
					{@render children()}
				</main>
			</div>
		</div>
	{:else}
		<!-- PUBLIC / GUEST LAYOUT (Clean Topbar + Footer) -->
		<header class="sticky top-0 z-40 bg-carbon-black text-white shadow-md border-b border-gunmetal/40">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between h-16">
					<!-- Brand Logo -->
					<div class="flex items-center gap-3">
						<a href="/" class="flex items-center gap-2.5 group">
							<div class="w-10 h-10 rounded-xl bg-garage-orange flex items-center justify-center text-carbon-black shadow-sm group-hover:scale-105 transition-transform">
								<CarIcon size={22} strokeWidth={2.5} />
							</div>
							<div class="flex flex-col">
								<span class="text-lg font-black tracking-tight text-white flex items-center gap-1">
									GARASI<span class="text-garage-orange"> TA</span>
								</span>
								<span class="text-[10px] tracking-widest uppercase text-slate-400 font-semibold">
									Sistem Sewa Garasi
								</span>
							</div>
						</a>
					</div>

					<!-- Far Right Actions -->
					<div class="flex items-center gap-3">
						{#if data.user}
							<a
								href={data.user.role === 'ADMIN' ? '/admin/garasi' : '/penyewa'}
								class="px-4 py-2 rounded-xl text-xs font-bold bg-garage-orange text-carbon-black hover:bg-garage-orange-hover shadow-sm transition-all"
							>
								Dashboard
							</a>
						{:else}
							<a
								href="/login"
								class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-gunmetal transition-colors"
							>
								Masuk
							</a>
							<a
								href="/register"
								class="px-4 py-2 rounded-xl text-xs font-bold bg-garage-orange text-carbon-black hover:bg-garage-orange-hover shadow-sm transition-all"
							>
								Daftar Akun
							</a>
						{/if}
					</div>
				</div>
			</div>
		</header>

		<!-- Main Public Body -->
		<main class="flex-1">
			{@render children()}
		</main>

		<!-- Clean Footer -->
		<footer class="bg-carbon-black text-slate-400 border-t border-gunmetal/40 py-6 text-xs">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 text-slate-400">
				<p>&copy; 2026 Garasi Ta</p>
			</div>
		</footer>
	{/if}
</div>
