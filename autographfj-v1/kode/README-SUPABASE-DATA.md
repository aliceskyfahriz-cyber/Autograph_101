# TechnicianPoint Monitoring — tahap integrasi data Supabase

## Yang terhubung dalam versi ini
- Login email/password menggunakan Supabase Auth.
- Membaca profil dan jenis pekerjaan dari Supabase.
- Menyimpan tiket baru ke `public.tickets`.
- Menyimpan teknisi dan poin per teknisi ke `public.ticket_workers`.
- Memuat riwayat tiket dari Supabase setelah login dan setelah input/hapus.
- Pengaturan nama dan target menyimpan ke `public.profiles`.
- Data demo lokal tidak dipakai sebagai sumber data setelah login; daftar pekerjaan dimuat dari database.

## Sebelum mencoba
1. Cadangkan folder proyek yang sekarang.
2. Pastikan `.env.local` berada di root proyek dan berisi `VITE_SUPABASE_URL` serta `VITE_SUPABASE_PUBLISHABLE_KEY`. Jangan masukkan `.env.local` ke ZIP atau Git.
3. Di Supabase SQL Editor, jalankan isi `SUPABASE-POLICIES-TICKETS.sql` satu kali. Script ini menambahkan kebijakan bernama khusus dan helper akses tiket; tidak menghapus kebijakan lama.
4. Salin folder `src` dari ZIP ini ke proyek, mengganti file yang diminta. Pertahankan `.env.local` yang sudah ada.
5. Jalankan `npm install`, lalu `npm run dev`.
6. Uji login sebagai Teknisi, masukkan satu tiket uji, lalu cek tabel `tickets` dan `ticket_workers`. Login Admin dan pastikan tiket dapat dibaca.

## Catatan batasan tahap ini
- Ini integrasi awal untuk input/riwayat tiket dan poin teknisi. Uji RLS di proyek sendiri sebelum penggunaan nyata.
- Membuat akun Auth baru, reset password pengguna lain, suspend, dan hapus akun memerlukan backend tepercaya (misalnya Supabase Edge Function); tombol pengelolaan akun terkait belum menjalankan operasi admin di Auth.
- Penghapusan tiket hanya diizinkan bagi pembuat tiket atau Admin.
- Jangan gunakan data produksi sebelum alur tiket, partner, dan hak akses diuji.
