# Technician Point Monitoring System

Prototype Capstone berbasis Vue 3 + Vite.

Fitur: dashboard poin, input pekerjaan, master pekerjaan/bobot poin, target, riwayat, laporan, export XLSX (3 sheet: Rekap, Per Jenis Pekerjaan, Ringkasan — header merah, border, lebar kolom diatur), localStorage, responsive UI, **login username + password dengan 2 role (Teknisi & Admin)**.

> Bobot poin pada demo adalah DATA CONTOH. Ganti melalui Master Pekerjaan sesuai data yang memang boleh digunakan. Hasil aplikasi bukan angka penggajian resmi.

## Akun bawaan (demo)

| Role    | Username | Password    |
|---------|----------|-------------|
| Admin   | `admin`  | `admin123`  |
| Teknisi | `fahriz` | `teknisi123` |
| Teknisi | `budi`   | `teknisi123` |

- **Teknisi:** UI & semua fitur sama seperti versi sebelumnya; datanya terpisah per-teknisi (pekerjaan, master, target, laporan milik sendiri).
- **Admin:** semua fitur teknisi (atas data teknisi yang dipilih lewat tombol "Kelola Data") **plus** menu **Kelola Teknisi**: tambah akun, edit akun, reset password, suspend / aktifkan akun, hapus akun beserta datanya, dan mengubah target teknisi. Akun yang disuspend tidak bisa login.
- Ganti password sendiri: menu **Pengaturan → Ganti Password Saya**.

> Keamanan: ini prototype frontend-only — akun & password (tersimpan sebagai hash demo ringan) ada di localStorage browser, jadi bisa dibaca/diubah lewat DevTools. Untuk produksi gunakan backend + database seperti versi FINAL_SYSTEM (Level 2): password di-hash aman (bcrypt) di server dan sesi memakai token.

## Jalankan
```bash
npm install
npm run dev
```
Buka http://localhost:5173/
