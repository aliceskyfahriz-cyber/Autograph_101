# AutographFJ — Ringkasan Percakapan ChatGPT #1

Sumber: share link ChatGPT pertama (diberikan Fahriz 7 Okt 2026, dibaca Muse read-only).
Judul percakapan: **"Membuat Website dan Domain"**.
Catatan: banyak pesan Fahriz berupa screenshot yang di halaman share hanya berlabel "Gambar/File sudah diunggah", jadi ringkasan ini berdasarkan teks yang tampil.

## Perjalanan projek

1. **Awal — website pribadi "AutoGraph FJ"**: personal branding, portofolio, blog teknologi, galeri desain/video, kontak, dokumentasi belajar. Tema awal monokrom gelap (hitam/abu, aksen neon kuning), dark mode, glassmorphism, responsif.
2. **Pivot ke Capstone**: Fahriz adalah teknisi IndiHome. Masalah: total poin pekerjaan satu periode (tangal 26 bulan sebelumnya s/d 25 bulan berjalan; hasil resmi baru muncul ~tanggal 15 bulan berikutnya) tidak diketahui real-time, jadi pencapaian & estimasi insentif tidak terpantau.
3. **Solusi yang dibangun**: aplikasi monitoring poin teknisi — teknisi mencatat pekerjaan sendiri; sistem menghitung qty × bobot poin dari master pekerjaan; menampilkan total poin, pencapaian target, sisa target, persentase, riwayat, grafik harian, laporan. Nama aplikasi mengarah ke **AutoGraph FJ Technician Point / Point Monitoring**.
4. **Data demo (BUKAN resmi)**: bobot poin & contoh hitungan gaji hanya ilustrasi, wajib validasi ke ketentuan resmi. Contoh master demo: Pasang Baru PB01 = 10, Upgrade UP01 = 7, Gangguan GS01 = 5, Maintenance MT01 = 8 poin.

## Teknologi & cara jalan (prototype)

- Vue 3 + Vite, JavaScript, CSS modern (Tailwind disebut sebagai opsi), VS Code, Node.js.
- Penyimpanan prototype: **localStorage** browser (belum backend/database; rencana naik kelas: Vue → API/backend → database).
- Jalan lokal: `npm install` → `npm run dev` → `http://localhost:5173`.

## Fitur yang sudah dibangun (prototype)

Login sederhana (nama teknisi), Dashboard, Input Pekerjaan, Riwayat Pekerjaan, Master Pekerjaan, Laporan & Rekap + Export CSV, Pengaturan (nama, target poin, periode), grafik Poin Harian, progress ring pencapaian, komponen UI: modal, toast, badge/status, sidebar, navbar.

## Struktur file (nama persis dari percakapan)

`AutoGraph-FJ/` — `index.html`, `package.json`, `vite.config.js`, `public/favicon.ico`,
`src/main.js`, `src/App.vue`, `src/router/index.js`, `src/styles/global.css`,
`src/assets/logo/autograph-fj.png` + `.svg`, `src/assets/images/profile.jpg`, `project-1.jpg`, `hero-bg.jpg`,
`src/data/defaultData.js`, `src/utils/storage.js`, `src/utils/points.js`, `src/utils/exportCsv.js`,
`src/components/layout/Sidebar.vue`, `Navbar.vue`, `AppLayout.vue`,
`src/components/ui/StatCard.vue`, `ProgressRing.vue`, `Modal.vue`, `Toast.vue`, `EmptyState.vue`,
`src/pages/Login.vue`, `Dashboard.vue`, `InputPekerjaan.vue`, `MasterPekerjaan.vue`, `Laporan.vue`, `Pengaturan.vue`.

Kandidat domain (belum dibeli): autographfj.com, autographfj.id, fahrizalicesky.com, fahrizalicesky.id.
ZIP yang pernah dihasilkan: AutoGraph-FJ.zip, AutoGraph-FJ-Assets.zip, AutoGraph-FJ-Technician-Point.zip, terakhir **"AutoGraph FJ Technician Point – Red White.zip"**.

## Status terakhir di percakapan #1

- Prototype Vue bisa jalan lokal; halaman & fitur dasar ada. Troubleshooting logo/layout lewat screenshot berulang kali; masalah teks ganda di sidebar (perbaikan spesifik di `Sidebar.vue`: hapus duplikasi teks brand di baris 27, pertahankan blok brand yang benar) dinyatakan "done" oleh Fahriz.
- Keputusan desain terakhir: **HANYA ganti warna** — dari hitam/abu/kuning menjadi **merah-putih khas manajemen IndiHome/Telkom**, tanpa mengubah fungsi/fitur. Perubahan hanya di layer CSS (`src/styles/global.css`: login, sidebar, navbar, dashboard, tombol, menu aktif, progress, grafik, tabel, modal, toast, logo).
- Catatan dari sisi ChatGPT: build ZIP Red-White tidak bisa dijalankan penuh di lingkungannya (dependency Rollup dari node_modules bawaan ZIP tidak lengkap); file yang diubah hanya global.css.
- **Belum tuntas**: uji end-to-end menyeluruh (skenario: Login → Dashboard → Master Pekerjaan → Input Pekerjaan → Riwayat → Dashboard → grafik Poin Harian → Laporan/Export CSV → Pengaturan; 8 test case termasuk hitung poin, hapus pekerjaan, ubah target, export CSV, refresh data persisten). Langkah berikutnya di percakapan: Fahriz ekstrak ZIP Red-White, jalankan lokal, kirim screenshot Login + Dashboard + Input Pekerjaan untuk penilaian tema merah-putih.

## Hal penting untuk lanjut

- Basis lanjut = ZIP Red-White terakhir + hasil uji lokal Fahriz, BUKAN versi hitam-kuning.
- Nama belum konsisten (AutoGraph FJ portofolio vs Point Monitoring vs Technician Point) — perlu diputuskan nama final aplikasi Capstone.
- Domain & deployment adalah tahap setelah website selesai.
