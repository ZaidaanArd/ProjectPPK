# Release Notes / Changelog

Repository ini belum memakai tag versi semantik. Catatan berikut diringkas dari riwayat Git di main sampai commit 17f02f9; **merge ke main tidak membuktikan bahwa deployment production telah diperbarui**. Untuk status production, catat SHA Vercel dan Convex saat rilis.

## 10 Oktober 2026 — belum dirilis

- Jadwal perbaikan per rentang waktu menggantikan status "Dalam perbaikan" yang menutup fasilitas seharian. Perbaikan hanya boleh di slot kosong; reservasi yang sudah ada tetap berjalan.
- Halaman petugas **Jadwal perbaikan** dengan jadwalkan, perpanjang, selesai, dan batalkan; tombol **Jadwalkan perbaikan** di kartu laporan.
- Pengguna dan katalog publik melihat jadwal perbaikan; hanya slot di rentang itu yang terkunci.
- Dokumen [Alur dan logika sistem](./FLOWS.md) dan tab **Alur logika** di halaman Tentang; diagram Mermaid di dokumentasi kini dirender sebagai grafik.
- Migrasi: tabel baru `maintenanceWindows`. Fasilitas yang masih berstatus lama `maintenance` tetap tertutup penuh sampai admin mengaktifkannya.

## 26 September 2026 — main 17f02f9

- Halaman Tentang menampilkan badge sosial tim dengan pratinjau yang dapat diklik, termasuk penyesuaian ukuran.
- Scaffold test login untuk user story 1 diberi nama yang lebih jelas.

## 24 September 2026

- Katalog publik /facilities menggunakan desain kartu fasilitas baru.
- Sesi akun nonaktif diarahkan ke halaman status akun.
- Cakupan browser bertambah untuk alur reservasi, laporan, CSV, dan pendaftaran pending.
- Perbaikan alur core story dan integrasi PR reservasi, filter antrean, laporan, serta FAQ masuk ke main.

## Catatan rilis berikutnya

Isi tanggal rilis, commit frontend, revisi Convex, perubahan yang terlihat, migrasi/perawatan data, hasil QA/UAT, masalah yang diketahui, dan target rollback. Jangan menyebut sebuah perubahan “sudah di production” sebelum kedua deployment dan smoke test diverifikasi.
