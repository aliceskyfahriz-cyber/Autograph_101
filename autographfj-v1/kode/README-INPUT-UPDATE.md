# Update Form Input Capstone

Perubahan:
- Segment berupa dropdown: B2C, B2B, EXBISS.
- Jenis pekerjaan disesuaikan dengan segment yang dipilih:
  - Pasang Baru: B2C 5 poin, B2B 7 poin, EXBISS 10 poin.
  - Maintenance: B2C 2 poin, B2B 4 poin, EXBISS 8 poin.
  - Upgrade: B2C 1 poin, B2B 2 poin, EXBISS 4 poin.
- Input jumlah pekerjaan dihapus. Setiap penyimpanan merepresentasikan satu tiket/Service ID dan qty internal selalu 1.
- Nomor tiket tidak boleh dicatat lebih dari satu kali di seluruh data teknisi.
- Riwayat lama tetap dipertahankan. Master pekerjaan lama dinonaktifkan dan disimpan untuk menjaga riwayat lama tetap terbaca.

Jalankan dengan `npm install`, lalu `npm run dev`.
