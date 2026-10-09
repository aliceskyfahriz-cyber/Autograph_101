# Mission Control di PC Kamu — Panduan Cepat

Urutan ini mengikuti 2 video yang sudah dikirim (WSL/Ubuntu dulu, lalu Node.js).
Setiap tahap ada **cek berhasil** — jangan lanjut kalau ceknya belum lolos.

## Tahap 1 — WSL + Ubuntu (ikut Video 1)
1. PowerShell (Run as Administrator): `wsl --install` lalu restart PC.
2. Buka Ubuntu dari Start Menu, buat username + password pertama kali.
- Cek berhasil: di terminal Ubuntu, `lsb_release -a` menampilkan Ubuntu (mis. 24.04).

## Tahap 2 — Node.js (ikut Video 2)
Di terminal Ubuntu:
```
sudo apt update && sudo apt install -y nodejs
```
- Cek berhasil: `node -v` menampilkan v18 atau lebih baru.
- Catatan: cara di Video 2 memasang Node 22 secara manual — itu juga valid, hasil akhirnya sama: `node -v` terbaca.

## Tahap 3 — Salin & ekstrak paket Mission Control
File paket ada di Downloads Windows (ganti NAMA_KAMU dengan username Windows kamu):
```
cp /mnt/c/Users/NAMA_KAMU/Downloads/mission-control-2026-10-08.tar.gz ~
tar -xzf mission-control-2026-10-08.tar.gz
cd mission-control
```
- Cek berhasil: `ls` menampilkan `server.js`, `index.html`, `data/`, `README.md`.

## Tahap 4 — Jalankan
```
node server.js
```
- Cek berhasil: terminal menampilkan server jalan di port 3001 dan TIDAK kembali ke prompt.
- Biarkan terminal tetap terbuka selama memakai dashboard. Berhenti: `Ctrl+C`.

## Tahap 5 — Buka dashboard
Browser Windows (Chrome/Edge): **http://localhost:3001**

## Tahap 6 — Buka di HP (WiFi yang sama)

Server bawaan hanya mendengarkan di `127.0.0.1`, jadi perlu dua penyesuaian:

1. Jalankan server di Ubuntu dengan: `HOST=0.0.0.0 node server.js`
2. Di Windows, jalankan script **`jalankan-di-hp.ps1`** (klik kanan → Run with PowerShell, sebagai Administrator). Script ini membuat jembatan port ke WSL + membuka firewall, lalu menampilkan alamatnya.
3. Di HP (WiFi sama dengan PC), buka alamat yang ditampilkan script, bentuknya `http://192.168.x.x:3001`.

Catatan: IP WSL berubah tiap Ubuntu direstart — jalankan ulang script-nya (langkah 2) setiap habis restart, alamat HP bisa ikut berubah.

Alternatif dari luar rumah (internet mana pun): pakai Cloudflare Tunnel di Windows — `cloudflared tunnel --url http://localhost:3001` — dapat alamat `https://acak.trycloudflare.com` (berubah tiap dijalankan ulang; jangan sebarkan alamatnya karena dashboard bisa mengendalikan agent).

## Kalau macet — 4 error paling umum
- `node: command not found` → Node belum terpasang; ulangi Tahap 2, lalu cek `node -v`.
- `EADDRINUSE ... port 3001` → server sudah jalan di terminal lain; pakai yang itu saja, atau tutup terminal lamanya dulu.
- `No such file or directory` saat `cp` → nama file/username Windows salah; cek isi Downloads dari Ubuntu: `ls /mnt/c/Users/NAMA_KAMU/Downloads`
- Dashboard terbuka tapi kartu System kosong → kamu menjalankan di Windows langsung, bukan di Ubuntu/WSL. Ulangi dari terminal Ubuntu.

## Yang perlu diingat
- Bukan XAMPP (tidak ada PHP/database di proyek ini), bukan VS Code sebagai server.
- VS Code = opsional, hanya untuk melihat/mengedit kode. Yang menjalankan = Node.js di terminal Ubuntu. Yang menampilkan = browser.
- Paket ini snapshot data per 8 Okt 2026 — tampilannya sama dengan versi live, datanya tidak tersinkron otomatis.
