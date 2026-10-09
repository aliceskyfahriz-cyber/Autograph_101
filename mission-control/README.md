# Mission Control — Dashboard Tim AI Agent

Pusat kendali untuk memantau AI agent bekerja secara real-time.
Semua angka berasal dari data nyata (file ledger, `/proc`, file cron) — tidak ada data simulasi.

## Cara Menjalankan

```bash
cd ~/workspace/mission-control
node server.js
# buka http://127.0.0.1:3001
```

Sudah terpasang juga sebagai layanan systemd (auto-start + auto-restart):

```bash
systemctl status mission-control.service      # server dashboard
systemctl status mission-control-watchdog.timer  # watchdog tiap 5 menit
journalctl -u mission-control.service -f      # log server
```

Unit systemd tersimpan di folder `systemd/` proyek ini; salinan aktif ada di `/etc/systemd/system/`.

## Struktur

| Path | Isi |
|---|---|
| `server.js` | Backend Node.js murni (modul bawaan saja), API + static server di `127.0.0.1:3001` |
| `index.html` | Frontend satu file (HTML/CSS/JS inline), polling `/api/state` tiap 3 detik |
| `vendor/three.min.js` | Three.js r128 lokal (tanpa CDN) |
| `data/tasks.jsonl` | **Ledger kerja agent** (sumber kebenaran status agent) |
| `data/queue.jsonl` | Antrean quick task |
| `data/dispatch.json` | `{"paused": false}` — diubah tombol PAUSE/RESUME di dashboard |
| `data/agents-paused.json` | Status pause per agent (klik robot di Virtual Office) |
| `data/watchdog-history.jsonl` | Riwayat event watchdog/tunnel |
| `data/watchdog-last.json` | Waktu + status watchdog terakhir jalan |
| `data/server.log`, `data/bore.log` | Log server & tunnel |
| `PUBLIC_URL.txt` | URL publik tunnel aktif (hanya ditulis setelah lolos cek HTTP 200) |
| `watchdog.sh` | Cek server + tunnel tiap 5 menit, restart bila mati, perbarui URL |
| `log-task.sh` | Helper mencatat event ke ledger |
| `bin/bore` | Binary bore v0.6.0 |

## Mencatat Kerja Agent ke Ledger (PENTING)

Dashboard hidup dari `data/tasks.jsonl`. Aturannya:

- Setiap delegasi kerja → append event `started` dengan `task_id` yang **stabil**.
- Ada kemajuan → append `progress` (task_id sama).
- Selesai → append `done`. Gagal → append `failed` (task_id sama).
- Field `agent` HARUS id roster: `muse`, `aris`, `udin`, `vision-agent-03`, `research-agent-01`, `coding-agent-02`.
- Status agent di dashboard diturunkan dari event terakhir per `task_id`:
  agent tampil **working** (duduk di meja) bila task terakhirnya masih `started`/`progress`,
  dan kembali **idle** (berdiri di barisan belakang) setelah `done`/`failed`.

Format satu baris JSON:

```json
{"ts":"2026-10-04T15:25:00+07:00","task_id":"slug-stabil","agent":"muse","subagent":"<uuid>","title":"Judul singkat","status":"started","detail":"..."}
```

Cara cepat dengan helper:

```bash
./log-task.sh <task_id> <agent> <status> "<judul>" "<detail>"
# contoh:
./log-task.sh desain-logo-kopi aris started "Desain logo kopi" "mulai sketsa"
./log-task.sh desain-logo-kopi aris done    "Desain logo kopi" "3 varian selesai"
```

## API

| Endpoint | Fungsi |
|---|---|
| `GET /api/state` | Seluruh state: `agents`, `queue`, `tasks`, `system`, `vps`, `schedules`, `dispatch_paused`, `log`, `token` |
| `POST /api/queue` | Body `{prompt, agent}` → append `queue.jsonl` status `queued` |
| `POST /api/dispatch` | Body `{paused:true\|false}` → tulis `data/dispatch.json` |
| `POST /api/agent-pause` | Body `{agent, paused}` → pause/resume satu agent |

## Sumber Data Lain

- **System/VPS**: `/proc/loadavg`, `/proc/uptime`, `/proc/cpuinfo`, `/proc/meminfo`, `statfs /`.
  Kartu **MEMORY (CONTAINER)** = jumlah RSS semua proses dari `/proc/<pid>/statm` × page size
  (bukan memory host, karena `/proc/meminfo` di container menampilkan seluruh host).
- **Tugas Terjadwal**: file `.md` ber-frontmatter YAML dibaca rekursif dari
  `~/workspace/cron.d/`, `~/workspace/system-cron.d/` (ditandai sistem), dan `~/workspace/goals/*/crons/`.
  Folder berawalan `_` (arsip/invalid) dilewati; file rusak di-skip.
- **Token Status**: output perintah `subscription-status status` (di-cache 60 detik di backend).

## Akses Publik (Tunnel) + Watchdog

```bash
./bin/bore local 3001 --to bore.pub   # manual: URL tampil di log sebagai bore.pub:<port>
./watchdog.sh                          # manual: cek & perbaiki server/tunnel sekarang
```

`mission-control-watchdog.timer` menjalankan `watchdog.sh` tiap 5 menit:
cek API lokal → restart server bila mati → cek proses bore + HTTP 200 ke URL publik →
bila mati/berubah, bore di-restart, URL baru **ditulis hanya setelah lolos cek HTTP 200**,
event dicatat ke `data/watchdog-history.jsonl`, dan baris `NEW_PUBLIC_URL <url>` dicetak untuk dilaporkan.

**Aturan main**: selalu baca `PUBLIC_URL.txt` dan live-check HTTP 200 sebelum membagikan link —
URL tunnel bisa berganti setiap restart.

> Catatan lingkungan saat ini (7 Okt 2026): container ini memblokir koneksi TCP keluar non-HTTP
> (egress hanya lewat HTTP proxy), sehingga bore ke `bore.pub:7835` *timeout* dan URL publik belum bisa terbit dari sini.
> Watchdog mencatat kegagalan itu apa adanya (`tunnel_start_failed`) dan akan otomatis menerbitkan URL
> begitu dashboard ini berjalan di host/VPS dengan akses TCP keluar yang terbuka.
