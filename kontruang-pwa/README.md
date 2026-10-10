# Paket situs Kontruang PWA (GitHub Pages)

Folder ini berisi hasil build Kontruang v0.2 PWA (build dengan base `/Autograph_101/`)
yang dikemas sebagai ZIP lalu di-encode base64 dan dipecah jadi potongan teks
`site.zip.b64.part*` — karena konektor GitHub Muse hanya bisa mengunggah file teks.

Workflow `.github/workflows/kontruang-pages.yml` merakitnya kembali
(`cat site.zip.b64.part* | base64 -d`), mengekstrak, dan menerbitkan ke GitHub Pages:

**https://aliceskyfahriz-cyber.github.io/Autograph_101/**

Untuk memperbarui: bangun ulang dist dengan `VITE_BASE=/Autograph_101/`,
zip isinya, ganti potongan base64-nya, lalu push — deploy berjalan otomatis.

Terakhir diterbitkan ulang: 10 Okt 2026 ±18:15 WIB (setelah Pages diaktifkan: Source = GitHub Actions).
