# Kontruang — Kontrol Uang (Prototype Website v0.1)

Aplikasi pencatat keuangan pribadi: pantau **uang masuk & keluar**, **anggaran**, **dompet**, **tagihan berulang**, dan **laporan** — terinspirasi fitur Money Lover, dengan gaya khas Kontruang: **monokrom + abu-abu + yellow glow**.

- **Fase 1 (sekarang):** website untuk pribadi, data lokal di browser.
- **Fase 2 (nanti):** aplikasi mobile yang bisa diinstal di HP (basis kode ini mobile-first + PWA-ready).

## Cara menjalankan di VS Code

Syarat: Node.js terinstal (cek dengan `node --version`).

```bash
npm install
npm run dev
```

Lalu buka **http://localhost:5173** di browser.

Perintah lain:

```bash
npm run build     # build untuk produksi (folder dist/)
npm run preview   # pratinjau hasil build
```

## Fitur prototype ini

- **Dashboard** — total saldo semua dompet, pemasukan vs pengeluaran bulan ini (+rasio), grafik arus kas 6 bulan, dompet ringkas, transaksi terakhir, tagihan bulan ini, peringatan anggaran hampir habis.
- **Transaksi** — tambah / ubah / hapus pemasukan & pengeluaran, cari + saring per jenis dan bulan, ringkasan masuk-keluar-selisih.
- **Anggaran** — batas bulanan per kategori dengan progress bar; ubah batas, tambah, hapus; indikator lewat anggaran.
- **Dompet & Tagihan** — banyak dompet (tunai, bank, e-wallet, tabungan…), saldo otomatis dari transaksi; tagihan berulang dengan tombol **Bayar** (otomatis tercatat sebagai pengeluaran).
- **Laporan** — pengeluaran per kategori, arus kas 6 bulan, **ekspor CSV**, dan pengaturan data (kembalikan data contoh / hapus semua data).

## Data

- Tersimpan di **localStorage** browser (`kontruang-data-v1`) — belum ada akun/backend di fase pribadi ini.
- Data bawaan adalah **data contoh (demo)** bertanda "(contoh)". Mulai dari nol lewat **Laporan → Pengaturan Data → Hapus semua data**.

## Struktur folder

```
kontruang-web/
├─ index.html
├─ public/            # icon + manifest PWA
└─ src/
   ├─ main.js
   ├─ App.vue         # kerangka: sidebar / bottom-nav mobile + modal transaksi
   ├─ styles.css      # tema monokrom + yellow glow
   ├─ store.js        # state + localStorage + hitungan (saldo, total, anggaran)
   ├─ data/seed.js    # kategori + data contoh
   ├─ utils/format.js # format rupiah / tanggal
   ├─ components/     # ChartBars, TransactionModal
   └─ views/          # Dashboard, Transactions, Budgets, Wallets, Reports
```

## Roadmap

1. Website pribadi (versi ini) ✔
2. Penyempurnaan fitur v1 dari pemakaian sehari-hari
3. Akun + backend + sinkronisasi antarperangkat (fondasi fase publik)
4. Aplikasi mobile: PWA installable / dibungkus Capacitor jadi APK Android
5. Versi publik: fitur dirombak untuk semua orang
