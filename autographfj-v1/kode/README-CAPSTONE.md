# TechnicianPoint — Capstone Prototype

## Menjalankan aplikasi
1. Ekstrak ZIP ke folder baru.
2. Buka folder yang berisi `package.json` di VS Code.
3. Jalankan `npm install`.
4. Jalankan `npm run dev`.
5. Buka alamat lokal yang ditampilkan Vite di terminal.

## Akun demo
- SPV/Admin: `admin` / `admin123`
- Teknisi: `fahriz` / `teknisi123`
- Teknisi: `budi` / `teknisi123`

Ganti password setelah masuk jika menggunakan data pribadi. Akun dan data demo disimpan di `localStorage` browser, sehingga versi ini masih prototype lokal dan belum menyinkronkan data antar-komputer.

## Penyesuaian terhadap ruang lingkup capstone
- Teknisi dapat mencatat tanggal, nomor tiket, Service ID, segment, jenis pekerjaan, jumlah, dan partner opsional.
- Sistem menghitung poin dari bobot master pekerjaan. Pekerjaan mandiri mendapat poin penuh; pekerjaan dengan satu partner membagi poin menjadi dua dan membuat catatan terkait pada akun kedua teknisi.
- Kombinasi nomor tiket dan Service ID yang sama ditolak untuk mengurangi duplikasi.
- Penghapusan pekerjaan bersama menghapus catatan pada kedua akun.
- Master pekerjaan hanya ditampilkan untuk Admin dan perubahannya diselaraskan ke seluruh data teknisi.
- Teknisi tidak dapat mengubah target poin atau mereset data demo melalui menu Pengaturan.
- Laporan XLSX mencakup nomor tiket, Service ID, segment, partner, bobot poin, dan poin yang diterima.

## Batasan prototype
- Penyimpanan masih menggunakan `localStorage`; data tidak terpusat antar-browser/komputer.
- Autentikasi masih berupa simulasi frontend, bukan pengamanan produksi.
- Segment saat ini berupa isian teks karena daftar nilai segment resmi belum dikonfirmasi.
- Poin adalah estimasi kinerja, bukan perhitungan gaji. Tidak ada alur persetujuan pekerjaan, integrasi sistem pusat, atau rekonsiliasi otomatis.
