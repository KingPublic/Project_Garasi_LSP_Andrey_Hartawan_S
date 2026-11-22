# GARASI TA — Sistem Manajemen & Penyewaan Garasi Kendaraan Modern

**GARASI TA** adalah platform web modern untuk manajemen dan penyewaan unit garasi kendaraan bermotor, sepeda, dan mobil listrik (*Electric Vehicle* / EV). Sistem ini dibangun dengan arsitektur bersih (*Clean Architecture*), prinsip *Object-Oriented Programming* (OOP) yang ketat, dan optimasi query basis data bebas masalah performa *N+1 query*.

---

## Daftar Isi
1. [Fitur Utama](#fitur-utama)
2. [Teknologi & Dependensi](#teknologi--dependensi)
3. [Arsitektur Perangkat Lunak](#arsitektur-perangkat-lunak)
4. [Aturan Bisnis & Formula Perhitungan](#aturan-bisnis--formula-perhitungan)
5. [Panduan Instalasi & Setup Basis Data](#panduan-instalasi--setup-basis-data)
6. [Database Seeder & Akun Demo Pengujian](#database-seeder--akun-demo-pengujian)
7. [Pengujian Otomatis & Verifikasi](#pengujian-otomatis--verifikasi)
8. [Struktur Direktori Proyek](#struktur-direktori-proyek)

---

## Fitur Utama

- **Multi-Kategori Kendaraan & Garasi**:
  - **Sepeda & Motor (Kode `S001`–`S999`)**: Khusus kendaraan roda dua (sepeda manual dan sepeda motor).
  - **Mobil Konvensional (Kode `C001`–`C999`)**: Untuk mobil bensin/diesel keluarga dan niaga.
  - **Mobil Listrik / EV (Kode `E001`–`E999`)**: Dilengkapi fasilitas *charging station* terintegrasi.
- **Kalkulasi Biaya Pengisian Daya EV Otomatis**:
  - Menghitung konsumsi energi baterai secara instan: `(Kapasitas Baterai - Sisa Baterai) × Tarif Listrik per kWh`.
- **Anti-Bentrok Jadwal Booking (*Anti-Overlap Scheduling*)**:
  - Mencegah *double booking* pada garasi yang sama dengan validasi rentang tanggal kalender `[tanggalMulai, tanggalSelesai)`.
- **Verifikasi Identitas KTP/NIK 16 Digit**:
  - Proteksi registrasi dengan validasi ketat NIK 16 digit numerik. Calon penyewa berstatus `PENDING` wajib diverifikasi oleh Administrator sebelum diizinkan menyewa.
- **Verifikasi Pembayaran & Anti-Bentrok Kendaraan**:
  - Transaksi sewa baru langsung berstatus `AKTIF` setelah penyewa mengunggah bukti transfer pembayaran dan status fisik garasi otomatis tersinkronisasi, serta sistem secara ketat mencegah satu kendaraan disewa di lebih dari satu garasi pada tanggal yang bertabrakan.
- **Perpanjangan Masa Sewa Dinamis**:
  - Administrator dapat memperpanjang sewa aktif dengan perhitungan biaya otomatis (pemecahan paket bulanan 25x + sisa hari).
- **Laporan Finansial Multi-Filter**:
  - Filter laporan pendapatan berdasarkan Bulan/Tahun, Tanggal Harian, Tipe Garasi, serta Riwayat Transaksi per Penyewa.
- **Antarmuka Modern Bebas Emoticon**:
  - Desain *dashboard* bernuansa gelap monokromatik dengan tata letak profesional, menggunakan ikon SVG murni dan *palette* berstandar kontras tinggi.

---

## Teknologi & Dependensi

| Library / Alat | Versi | Lisensi | Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **SvelteKit 3 & Svelte 5** | `^3.2.0` / `^5.57.3` | MIT | Framework full-stack dengan routing berbasis folder dan state reaktif yang ringan |
| **Tailwind CSS v4 & @tailwindcss/forms** | `^4.3.5` | MIT | Styling utility-first yang konsisten dan cepat dikembangkan |
| **Prisma ORM & @prisma/adapter-pg + pg** | `7.10.1` / `^8.23.1` | Apache-2.0 / MIT | Akses PostgreSQL yang aman secara tipe bersama TypeScript |
| **Vitest** | `^5.1.0` | MIT | Framework unit testing yang cepat dan langsung kompatibel dengan Vite/TypeScript |
| **TypeScript & Bun** | `^6.0.3` / `1.4.0` | Apache-2.0 / MIT | Pengecekan tipe statis ketat dan runtime yang cepat |
| **dotenv** | `^18.0.10` | BSD-2-Clause | Membaca konfigurasi koneksi database dari file `.env` |

---

## Arsitektur Perangkat Lunak

Aplikasi menerapkan pola **Clean Architecture** berlapis untuk memisahkan domain logika bisnis dari antarmuka web dan infrastruktur basis data:

```
[ Presentation Layer: SvelteKit Pages & Server Routes ]
                        ↓
[ Application Service Layer: GarasiService, SewaService, AuthService, LaporanService ]
                        ↓
[ Domain Model Layer (OOP): GarasiModel, SewaModel, UserModel, KendaraanModel ]
                        ↓
[ Repository Layer (Prisma ORM): GarasiRepository, SewaRepository, UserRepository ]
                        ↓
[ Database Layer: PostgreSQL ]
```

### Keunggulan Arsitektur
1. **Model Domain OOP Murni**: Logika perhitungan tarif, validasi status, dan anti-bentrok jadwal dienkapsulasi di dalam kelas domain (`SewaModel`, `GarasiModel`, dsb.) tanpa dependensi basis data luar.
2. **Bebas N+1 Query**: Pengecekan ketersediaan unit garasi menggunakan satu query agregasi aktif yang dipetakan ke memori `Map<string, Sewa[]>` dengan kompleksitas lookup $O(1)$.
3. **Pencegahan Celah IDOR**: `SewaService` memverifikasi kepemilikan kendaraan penyewa secara ketat sebelum transaksi disimpan ke basis data.
4. **Konsistensi Zona Waktu WITA/UTC**: Seluruh kalkulasi tanggal dinormalisasi ke *UTC Date-Only* (`00:00:00.000Z`) untuk mencegah bug pergeseran tanggal (*off-by-one day*).

---

## Aturan Bisnis & Formula Perhitungan

1. **Format Identitas Garasi**:
   - Awalan huruf (`S`, `C`, `E`) diikuti nomor urut terformat 3 digit (`001`–`999`). Batas kumulatif maksimal 999 unit per tipe.
2. **Skema Tarif Sewa**:
   - **Harian**: `jumlahHari × hargaHarian`.
   - **Bulanan**: Tepat sejumlah hari dinamis dalam bulan kalender berjalan (28/29 hari di Feb, 30 hari di Apr/Jun/Sep/Nov, 31 hari di bulan lainnya). Tarif diskon bulanan = `25 × hargaHarian`.
3. **Biaya Listrik EV**:
   $$\text{Biaya Listrik} = (\text{Kapasitas Baterai} - \text{Sisa Baterai}) \times \text{Tarif Listrik per kWh}$$
   *(Jika sisa baterai sama dengan kapasitas atau baterai sudah 100% penuh, biaya listrik bernilai 0).*
4. **Total Pembayaran Sewa**:
   $$\text{Total Biaya} = \text{Biaya Sewa} + \text{Biaya Listrik}$$

---

## Panduan Instalasi & Setup Basis Data

### 1. Kebutuhan Sistem
- [Bun](https://bun.sh/) versi 1.2.0 atau lebih baru.
- PostgreSQL versi 14 atau lebih baru yang sedang berjalan di `localhost:5432`.

### 2. Instalasi Dependensi
```bash
bun install
```

### 3. Konfigurasi Environment (`.env`)
Pastikan file `.env` di root direktori memiliki koneksi PostgreSQL yang sesuai:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/db_lsp_garasi?schema=public"
```

### 4. Sinkronisasi Skema Basis Data
```bash
bun run db:generate
bun run db:push
```

### 5. Jalankan Seeder Basis Data
Jalankan seeder terpadu untuk mengisi akun Admin, unit garasi starter, dan pengguna demo:
```bash
bun run seed all
```

### 6. Jalankan Server Pengembangan
```bash
bun run dev
```
Buka peramban di `http://localhost:5173`.

---

## Database Seeder & Akun Demo Pengujian

Sistem menyediakan seeder fleksibel yang dapat dijalankan secara terpisah sesuai kebutuhan:

| Perintah | Deskripsi |
| :--- | :--- |
| `bun run seed all` | Menginisialisasi Admin, 15 unit garasi awal, dan 5 akun Penyewa demo |
| `bun run seed user` | Menginisialisasi akun-akun demo Penyewa beserta kendaraan terdaftar |
| `bun run seed garasi` | Menginisialisasi unit garasi awal (S001–S005, C001–C005, E001–E005) jika kosong |
| `bun run seed` | Menginisialisasi akun Administrator default |

### Akun Administrator Default
- **Email**: `admin@garasi.com`
- **Password**: `admin123`
- **Peran**: `ADMIN`

### Akun Demo Penyewa (`Password: user123`)

| Nama Pengguna | Email | NIK (16-Digit) | Status | Kendaraan Terdaftar | Skenario Pengujian |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Muhammad Fadli Akbar** | `fadli.akbar@gmail.com` | `7371011405940003` | **APPROVED** | Honda HR-V (`DD 1428 FA`) | Uji coba langsung sewa garasi Mobil (C001–C999) |
| **Nurul Mutmainnah** | `nurul.mutmainnah@gmail.com` | `7371026108970001` | **PENDING** | Toyota Veloz (`DD 1789 NM`) | Uji coba verifikasi KTP/NIK di menu Admin |
| **Fikri Haikal Daeng Rate** | `fikri.haikal@gmail.com` | `7371031911960002` | **REJECTED** | Honda Vario 160 (`DD 2941 FH`) | Uji coba tampilan akun ditolak di dashboard |
| **Rahmat Hidayatullah** | `rahmat.hidayat@gmail.com` | `7371040803920005` | **APPROVED** | Hyundai Ioniq 5 (`DD 8055 RH`, 72.6 kWh) | Uji coba sewa garasi EV & hitung kWh listrik |
| **Syahrul Gunawan Daeng Bella** | `syahrul.bella@gmail.com` | `7371052507980004` | **APPROVED** | Yamaha NMAX (`DD 3314 SB`) | Uji coba sewa garasi Sepeda/Motor (S001–S999) |

---

## Pengujian Otomatis & Verifikasi

Proyek ini menggunakan unit testing berbasis **Black-box Testing** (31 skenario pengujian dengan Vitest):
- **Boundary Value Analysis (BVA)**: Menguji batas validasi NIK 16 digit (15, 16, 17 digit), batas kumulatif 999 unit garasi, batas durasi sewa harian per bulan kalender, dan batas kapasitas baterai EV.
- **Equivalence Partitioning (EP)**: Menguji kelompok tipe sewa, matriks kecocokan 4 tipe kendaraan vs 3 tipe garasi, validasi plat nomor, dan perhitungan tarif murni.

*(Catatan: Pengujian lanjutan berbasis White-box dan Grey-box diarsipkan di folder `tests_legacy/`).*

### Menjalankan Unit Tests:
```bash
bunx vitest run
```
Hasil: **1 test suite passed (31 tests passed, 0 failed)**.

### Menjalankan Diagnostik TypeScript / SvelteKit:
```bash
bun run check
```
Hasil: **0 errors, 0 warnings**.

---

## Struktur Direktori Proyek

```
Project_Garasi_LSP/
├── prisma/
│   └── schema.prisma              # Skema basis data PostgreSQL
├── src/
│   ├── lib/
│   │   ├── components/            # Komponen UI (Navbar, Sidebar, Icons SVG murni)
│   │   ├── models/                # Domain Model OOP (GarasiModel, SewaModel, UserModel, KendaraanModel)
│   │   ├── repositories/          # Data Access Object berbasis Prisma Client
│   │   ├── services/              # Logika orkestrasi bisnis aplikasi
│   │   ├── server/                # Modul server (Auth sesi, Password scrypt, Seeder, Upload)
│   │   └── utils/                 # Utilitas tanggal UTC date-only & format Rupiah
│   ├── routes/
│   │   ├── +layout.svelte         # Layout utama dengan sidebar dashboard
│   │   ├── +page.svelte           # Landing page publik GARASI TA
│   │   ├── login/                 # Portal autentikasi masuk
│   │   ├── register/              # Pendaftaran akun calon penyewa
│   │   ├── admin/                 # Panel Administrator (Garasi, Verifikasi Calon, Pembayaran, Perpanjang, Laporan)
│   │   ├── penyewa/               # Panel Penyewa (Dashboard, Sewa Baru)
│   │   └── api/                   # REST Endpoints (Pengecekan Ketersediaan Garasi)
│   └── tests/                     # Test Suite Utama (blackbox.spec.ts)
├── tests_legacy/                  # Arsip Pengujian Lanjutan (whitebox, greybox)
├── package.json
└── README.md
```
