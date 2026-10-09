# Catatan index.html & vendor

`index.html` Mission Control (246 KB) disimpan terbagi menjadi
`index.html.part1` s.d. `index.html.part5` karena batas ukuran sekali unggah
pada konektor GitHub. Untuk memakai kembali, gabungkan berurutan:

```
cat index.html.part1 index.html.part2 index.html.part3 index.html.part4 index.html.part5 > index.html
```

Folder `vendor/` (three.min.js — Three.js r128, 592 KB) tidak ikut terunggah
karena batas yang sama dan sifatnya biner besar. File itu pustaka publik
standar dan salinan lokalnya sudah ada di PC Fahriz bersama paket Mission
Control; bila perlu, unduh Three.js r128 (three.min.js) dari threejs.org lalu
simpan sebagai `vendor/three.min.js`.

Folder `data/` (log & state runtime), `bin/bore`, dan `tools/cloudflared`
sengaja tidak diunggah.
