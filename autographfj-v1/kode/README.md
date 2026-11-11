# Technician Point Monitoring

Capstone Project — sistem monitoring poin kinerja teknisi IndiHome.
Dibangun dengan **Vue 3 + Vite** (frontend), **Supabase** (auth + database),
dan **ExcelJS** (ekspor laporan). Demo online:
https://techniciant-monitoring.vercel.app/

## Cara kerja singkat

1. **Login** memakai email dan password (**Supabase Auth**). Peran
   Admin atau Teknisi dibaca dari tabel `profiles` setelah login.
2. **Teknisi mencatat pekerjaan**: tanggal, nomor tiket, Service ID,
   segmen (B2C / B2B / EXBISS), lalu jenis pekerjaan. Poin dihitung
   otomatis mengikuti bobot segmen dan jenis pekerjaan. Satu nomor
   tiket + Service ID hanya dapat dicatat satu kali.
3. **Partner (opsional)**: kalau satu pekerjaan dikerjakan berdua,
   poin dibagi dua dan tercatat untuk kedua teknisi.
4. **Data tersimpan di Supabase**, bukan di browser: `profiles`,
   `job_types`, `tickets`, `ticket_workers`. Riwayat dimuat ulang
   dari database setelah login, setelah input, dan setelah hapus.
5. **Admin** melihat dashboard semua teknisi, mengelola akun lewat
   menu **Kelola Teknisi**, mengatur **Master Pekerjaan** (bobot poin,
   tersinkron ke semua teknisi), serta mengunduh **laporan XLSX**.

## Menjalankan di komputer sendiri

```bash
npm install
npm run dev
```

Buka http://localhost:5173/

Sebelum `npm run dev`, buat file `.env.local` di root proyek:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Lalu jalankan `SUPABASE-POLICIES-TICKETS.sql` **satu kali** di
Supabase SQL Editor. Tanpa `.env.local`, aplikasi tidak tampil sama
sekali (`supabaseUrl is required`).

> Akun demo untuk presentasi disiapkan terpisah dan kredensialnya
> tidak ditulis di repo ini. `.env.local` tidak boleh di-commit.

## Struktur folder

```
index.html                  — entry Vite
vite.config.js              — konfigurasi Vite + plugin Vue
package.json                — dependensi (vue, @supabase/supabase-js, exceljs)
src/main.js                 — bootstrap aplikasi
src/App.vue                 — shell aplikasi + seluruh logika (auth, muat data,
                              input/hapus tiket, master, pengaturan)
src/lib/supabase.js         — klien Supabase (URL + key dari .env.local)
src/pages/Login.vue         — form login email + password
src/pages/Dashboard.vue     — total poin, target, progres, ringkasan
src/pages/Jobs.vue          — form input pekerjaan + riwayat tiket
src/pages/MasterJobs.vue    — master jenis pekerjaan + bobot poin (admin)
src/pages/Reports.vue       — laporan + ekspor XLSX (3 sheet)
src/pages/Settings.vue      — profil, target, ganti password
src/pages/AdminTeknisi.vue  — kelola akun teknisi (admin)
src/components/             — Navbar, Sidebar, StatCard, ProgressRing, Toast
src/styles/global.css       — tema merah-putih
SUPABASE-POLICIES-TICKETS.sql — kebijakan RLS + helper akses tiket
README-SUPABASE-DATA.md     — catatan tahap integrasi Supabase
```

## Bobot poin (data contoh)

| Pekerjaan   | B2C | B2B | EXBISS |
|-------------|-----|-----|--------|
| Pasang Baru | 5   | 7   | 10     |
| Maintenance | 2   | 4   | 8      |
| Upgrade     | 1   | 2   | 4      |

## Laporan XLSX

Tombol ekspor di menu Laporan menghasilkan
`rekap-technician-point.xlsx` (3 sheet):

1. **Rekap** — 10 kolom: Tanggal, Nomor Tiket, Service ID, Segment,
   Kode, Pekerjaan, Partner, Qty, Poin Dasar, Poin Diterima.
2. **Per Jenis Pekerjaan** — rekap qty dan total poin per jenis.
3. **Ringkasan** — total, target, dan pencapaian.

## Keamanan dan batasan (dicatat jujur)

- Akses data dijaga **Row Level Security (RLS)** Supabase —
  lihat `SUPABASE-POLICIES-TICKETS.sql`. Tiket hanya dapat dibaca
  oleh pembuatnya, teknisi yang ditugaskan, atau Admin; hapus tiket
  hanya oleh pembuat atau Admin.
- URL dan key Supabase **tidak ada di repo ini**; baca dari
  `.env.local` yang tidak di-commit.
- Pengelolaan akun Auth (tambah akun, reset password pengguna lain,
  suspend, hapus akun) membutuhkan backend tepercaya (misalnya
  Supabase Edge Function `manage-users`) dan **belum tersedia** —
  tombol hapus akun sengaja tidak ada di versi ini.
- Versi ini adalah jalur frontend + Supabase. Jalur backend Level 2
  (`server.js` + MySQL dengan integrasi token, disebut STEP 6E)
  masih rencana pengembangan, lalu lanjut ke versi mobile.

## Catatan data

Bobot poin dan data contoh pada aplikasi adalah **data contoh**
untuk keperluan Capstone, bukan angka penggajian resmi. Ubah bobot
melalui menu Master Pekerjaan sesuai data yang memang boleh
digunakan.
