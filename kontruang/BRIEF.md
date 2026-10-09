# Kontruang — Brief Awal Projek

**Nama:** Kontruang (singkatan: kontrol uang)
**Jenis:** Aplikasi pengontrol keuangan milik Fahriz
**Dibuat:** 7 Oktober 2026
**Status:** Prototype website v0.1 SUDAH DIBUAT (7 Okt 2026, atas perintah Fahriz) — Vue 3 + Vite + localStorage di `~/workspace/projects/kontruang/kontruang-web/`, terverifikasi `npm install` + `npm run build` sukses dan dev server jalan di localhost:5173. ZIP untuk Fahriz: `~/workspace/projects/kontruang/kontruang.zip` (32 KB, tanpa node_modules/dist). Isi v0.1: Dashboard (saldo, masuk vs keluar bulan ini, grafik 6 bulan, tagihan, peringatan anggaran), Transaksi (CRUD + cari/saring), Anggaran per kategori, Dompet & tagihan berulang (tombol Bayar auto-catat), Laporan (per kategori, ekspor CSV, hapus/reset data). Data bawaan = data contoh bertanda "(contoh)". Menunggu penilaian Fahriz setelah ia jalankan di VS Code.

## Sasaran pengguna & visi (dari Fahriz, 7 Okt 2026)

- **Fase awal: pribadi dulu** — dipakai Fahriz sendiri.
- **Jangka panjang: publik** — dikembangkan agar semua orang bisa pakai, dengan merombak/mengubah semua fitur di dalamnya. Jadi versi publik bukan sekadar membuka versi pribadi apa adanya; fiturnya akan didesain ulang untuk umum.

## Garis besar fungsi (dari Fahriz, 7 Okt 2026)

- Melihat **uang keluar dan uang masuk**.
- **Tracking seberapa besar pemasukan dan pengeluaran** (perbandingan/ringkasan arus kas).

### Turunan fitur draf (usulan Muse dari garis besar di atas — menunggu konfirmasi Fahriz)

- Dashboard: saldo saat ini, total pemasukan, total pengeluaran (per periode: bulan berjalan sebagai default)
- Tambah transaksi: pemasukan / pengeluaran, nominal, tanggal, catatan, kategori
- Riwayat transaksi: daftar uang masuk-keluar yang bisa disaring per periode/kategori
- Visualisasi: grafik perbandingan pemasukan vs pengeluaran

## Aplikasi referensi / framework fitur (dari Fahriz, 7 Okt 2026)

Fahriz menetapkan aplikasi ini sebagai acuan fitur-fitur Kontruang:

- **Money Lover – Money Manager** — Play Store: https://play.google.com/store/apps/details?id=com.bookmark.money
- Rating saat dicek 7 Okt 2026: ±4,1 dari ±208 ribu ulasan; klaim 10 juta+ pengguna.

Fitur Money Lover (ringkasan dari halaman Play Store-nya, diparafrasekan):

- Pencatat pengeluaran/pemasukan, termasuk tagihan dan utang
- Perencana anggaran, termasuk prediksi pengeluaran dari riwayat
- Keamanan PIN / sidik jari
- Sinkronisasi antarperangkat
- Dompet tertaut: sinkronisasi otomatis ke rekening bank (berlangganan)
- Premium: banyak dompet terpisah (tunai, tabungan, kartu kredit, atau per keperluan), anggaran lanjutan per kategori, laporan beragam format, ekspor ke Google Sheets, tagihan & transaksi berulang dengan pengingat, tanpa iklan

### Pemetaan awal ke Kontruang (usulan Muse — menunggu konfirmasi Fahriz)

- **Masuk inti v1 pribadi:** pencatatan masuk/keluar + tagihan/utang, anggaran, banyak dompet, transaksi berulang + pengingat tagihan, laporan, ekspor
- **Fase lanjut / publik:** sinkronisasi antarperangkat (butuh akun + backend), keamanan PIN/sidik jari (paling relevan di fase mobile), sinkronisasi bank otomatis (paling kompleks — terakhir)

## Roadmap platform (dari Fahriz, 7 Okt 2026)

1. **Fase 1 — Website:** dibangun sebagai website dulu.
2. **Fase 2 — Mobile:** di-grow menjadi aplikasi mobile yang bisa diinstal di handphone.

### Implikasi teknis (catatan Muse, untuk diputuskan saat mulai bangun)

- Bangun website dengan pendekatan **mobile-first + PWA-ready** supaya transisi ke aplikasi instalabel mulus: dari basis kode yang sama bisa jadi PWA (installable, tanpa store) atau dibungkus **Capacitor** menjadi APK Android — jalur ini cocok dengan pengalaman Fahriz (Ionic Vue, Node.js, TypeScript).
- Hindari keputusan arsitektur yang mengunci ke desktop saja (layout responsif sejak awal, data terpisah dari tampilan lewat API/service layer).

## Identitas visual

- Logo huruf "K" kuning saat ini adalah placeholder bawaan prototype (teks di `src/App.vue`, class `brand-mark`; ikon tab/PWA di `public/icon.svg`). Pada 8 Okt 2026 Fahriz bertanya cara menggantinya dengan logonya sendiri — sudah dijelaskan jalurnya (taruh file logo di `public/`, ganti elemen brand di App.vue + rujukan ikon di `index.html`/`manifest.webmanifest`). File logo Fahriz belum dikirim; status: menunggu.
- Catatan QC dari screenshot Fahriz (8 Okt 2026): saldo demo dompet Tunai & E-Wallet tampil negatif karena total pengeluaran contoh 6 bulan melebihi saldo awal kedua dompet itu — perlu diseimbangkan ulang di seed versi berikutnya.

## Gaya UI (preferensi Fahriz, 7 Okt 2026)

- Dasar **monokrom**: hitam `#0A0A0A` / `#171717`, putih/off-white `#E5E5E5` / `#FAFAFA`
- Aksen **abu-abu**: `#262626`, `#737373`, `#A3A3A3`
- Aksen **yellow glow**: `#FFD60A` / `#FDE047` — hemat, untuk highlight, tombol utama, status penting, dan efek glow

## Yang belum ditentukan (menunggu konteks lanjutan dari Fahriz)

- ~~Pengguna: pribadi atau bersama keluarga~~ → **Sudah diputuskan 7 Okt 2026: pribadi dulu, publik kemudian.**
- Fitur tambahan di luar arus kas: acuan Money Lover sudah mencakup budget, utang, tagihan berulang, laporan & ekspor — tinggal Fahriz putuskan subset mana yang masuk v1, mana yang menyusul.
- Kategori transaksi: daftar kategorinya apa saja, atau bebas dibuat sendiri?
- Periode tracking utama: harian / mingguan / bulanan?
- Data: lokal dulu (localStorage) atau langsung backend + login? (untuk fase pribadi, lokal lebih cepat; fase publik pasti butuh akun + backend)
- Kaitan dengan investasi Bibit Fahriz (RD/SBN) — masuk pantauan atau terpisah?
