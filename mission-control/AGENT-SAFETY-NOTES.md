# Catatan Keamanan Agent — dari Nvidia Open Agent Safety Platform

Disusun 7 Okt 2026 (WIB) sebagai tindak lanjut kabar Feed tentang platform
keamanan agent Nvidia (diumumkan 28 Sep 2026). Ini ringkasan dan pemetaan ke
setup kita sendiri, bukan salinan artikel.

## Isi platformnya (dua lapis)

1. **OpenShell** — runtime sandbox open-source (Apache 2.0, di GitHub:
   github.com/NVIDIA/OpenShell). Idenya: batas keamanan ditegakkan *di luar*
   model, jadi agent tidak bisa melampaui kebijakan operator meskipun
   perilakunya menyimpang. Mekanismenya isolasi tingkat kernel: filter
   syscall (seccomp), pembatasan filesystem (Landlock), namespace jaringan,
   diatur lewat kebijakan YAML deklaratif yang bisa di-version-control.
   Agent coding yang sudah ada bisa dijalankan di dalamnya tanpa modifikasi.
   Statusnya masih **alpha** ("single-player mode"), butuh Docker/Podman
   atau virtualisasi MicroVM di host Linux/macOS/Windows-WSL2.
2. **Sentry** — desain referensi pengawas di perangkat keras DPU
   BlueField-4: memantau telemetri di luar lingkungan software agent dan
   mengarantina agent yang keluar batas dalam hitungan milidetik.

## Yang relevan / tidak relevan untuk fleet kita

- **Sentry: lewati.** Butuh DPU BlueField-4; host kita container di atas
  AMD EPYC tanpa perangkat itu. Tidak ada jalur praktis ke sana.
- **OpenShell: layak dicoba nanti, bukan sekarang di container ini.**
  Fleet kita (muse, aris, udin, vision-agent-03, research-agent-01,
  coding-agent-02) saat ini berjalan tanpa sandbox per-agent. Kandidat
  pertama yang masuk akal: `coding-agent-02`, karena ia yang paling sering
  mengeksekusi kode.
- Catatan lingkungan: container ini saja sudah membatasi TCP keluar
  non-HTTP (itu sebabnya tunnel bore gagal) — sebagian "jaring pengaman"
  kita hari ini justru datang dari batas itu, bukan dari desain.

## Celah yang sudah terlihat di setup kita sekarang

- Ledger `data/tasks.jsonl` bersifat append-by-trust: proses apa pun yang
  bisa menulis file itu bisa mencatat event atas nama agent mana pun.
- `POST /api/queue` menerima prompt tanpa autentikasi — aman hanya karena
  server bind ke `127.0.0.1`. Kalau nanti dibuka via LAN (`HOST=0.0.0.0`)
  atau tunnel publik, ini jadi pintu masuk nyata.
- Tombol PAUSE dispatch yang sudah ada pada dasarnya kill-switch kasar —
  itu fondasi yang benar, tinggal diperhalus per-agent.

## Tiga langkah praktis (berurutan, dari murah ke besar)

1. **Kebijakan per-agent versi sederhana dulu** — daftar tulis yang boleh
   diakses tiap agent (folder + perintah), dicatat sebagai file YAML di
   proyek ini, sebelum memasang runtime apa pun.
2. **Uji OpenShell di mesin terpisah** (komputer/VPS milik sendiri, bukan
   container ini) untuk satu agent coding, dengan kebijakan YAML dari
   langkah 1. Alpha = ekspektasikan kasar; jangan jadikan fondasi dulu.
3. **Tambahkan event kebijakan ke ledger** — status baru misalnya
   `blocked` di `tasks.jsonl`, supaya Mission Control bisa *menampilkan*
   pelanggaran batas agent, sejalan dengan prinsip dashboard: pantau dulu,
   tegakkan kemudian.

## Keputusan yang menunggu user

- Cukup simpan sebagai catatan (status sekarang), atau
- Jadikan langkah 1 tugas nyata berikutnya: susun draf kebijakan per-agent
  untuk keenam agent di roster.
