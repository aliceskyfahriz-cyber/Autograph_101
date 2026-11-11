# TechnicianPoint Login Admin — versi perbaikan

## Cara menjalankan di Windows / VS Code
1. Ekstrak ZIP ini ke folder baru.
2. Di VS Code pilih **File > Open Folder** lalu pilih folder hasil ekstrak ini (folder yang langsung berisi `package.json`, `src`, `index.html`, dan `vite.config.js`).
3. Buka Terminal > New Terminal. Pastikan terminal berada di folder yang berisi `package.json`.
4. Jalankan:

   ```powershell
   npm install
   npm run dev
   ```

5. Buka alamat yang tampil di terminal, biasanya `http://127.0.0.1:5173/`.

Jika muncul `Missing script: "dev"`, terminal kemungkinan berada satu folder terlalu atas/bawah. Jalankan `dir` dan pastikan `package.json` terlihat pada daftar file. Jangan membuka folder `node_modules` sebagai workspace.

Folder `node_modules` tidak disertakan; `npm install` akan memasang dependensi yang sesuai dengan komputer Anda.
