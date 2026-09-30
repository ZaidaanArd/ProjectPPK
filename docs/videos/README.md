# Video User Story

Rekaman Playwright untuk setiap user story di [requirements](../REQUIREMENTS.md). Setiap video menampilkan judul cerita di bagian bawah layar dan notifikasi toast untuk hasil tindakan.

Video direkam pada **demo statis lokal** (`NEXT_PUBLIC_DATA_MODE=static`) di viewport 1280×720, zona waktu Asia/Jakarta. Data demo hanya ada di browser, jadi tidak ada data production yang berubah. Rekaman ini membuktikan alur antarmuka, bukan UAT pada deployment Convex; hasil UAT tetap dicatat di [UAT](../UAT.md).

| ID    | Alur yang direkam                                                                        | Video                    |
| ----- | ---------------------------------------------------------------------------------------- | ------------------------ |
| US-01 | Pengunjung membuka slot Aula; slot terisi nonaktif tanpa nama/tujuan pemohon             | [US-01.webm](US-01.webm) |
| US-02 | Filter chip tipe, pencarian lokasi, dan urutan kapasitas terbesar                        | [US-02.webm](US-02.webm) |
| US-03 | Pengguna memilih slot, mengisi tujuan, konfirmasi, lalu reservasi muncul di tab Menunggu | [US-03.webm](US-03.webm) |
| US-04 | Pengguna membatalkan reservasi sendiri; reservasi pindah ke Riwayat                      | [US-04.webm](US-04.webm) |
| US-05 | Tab Menunggu, Disetujui, dan Riwayat beserta detail waktu dan tujuan                     | [US-05.webm](US-05.webm) |
| US-06 | Laporan dengan kategori, deskripsi, file salah ditolak, lalu foto PNG valid terkirim     | [US-06.webm](US-06.webm) |
| US-07 | Petugas mulai menangani laporan; pengguna melihat status Ditangani                       | [US-07.webm](US-07.webm) |
| US-08 | Dashboard petugas: reservasi menunggu, laporan baru, jadwal hari ini, lalu antrean       | [US-08.webm](US-08.webm) |
| US-09 | Petugas menyetujui reservasi; slot yang sama tampil Terisi bagi pengguna                 | [US-09.webm](US-09.webm) |
| US-10 | Pembatalan oleh petugas meminta alasan, konfirmasi, lalu masuk Riwayat                   | [US-10.webm](US-10.webm) |
| US-11 | Laporan dimulai tanpa catatan, lalu diselesaikan dengan catatan penanganan               | [US-11.webm](US-11.webm) |
| US-12 | Fasilitas ditandai Dalam Perbaikan di katalog publik, lalu Aktif kembali setelah selesai | [US-12.webm](US-12.webm) |
| US-13 | Admin membuat akun petugas yang langsung aktif                                           | [US-13.webm](US-13.webm) |
| US-14 | Admin membuat akun pengguna yang langsung aktif                                          | [US-14.webm](US-14.webm) |
| US-15 | Registrasi mandiri tanpa NIM/NIP, admin menyetujui satu akun dan menolak akun lain       | [US-15.webm](US-15.webm) |
| US-16 | Admin menambah fasilitas, mengubah kapasitas, lalu menyembunyikannya                     | [US-16.webm](US-16.webm) |
| US-17 | Admin melihat rekap per fasilitas/lokasi dan mengunduh CSV                               | [US-17.webm](US-17.webm) |

## Merekam ulang

Jalankan demo statis di satu terminal:

    NEXT_PUBLIC_DATA_MODE=static pnpm dev

Lalu di terminal lain:

    PLAYWRIGHT_BASE_URL=http://localhost:3000 PLAYWRIGHT_STATIC_MODE=1 PLAYWRIGHT_SAVE_VIDEOS=1 pnpm exec playwright test tests/e2e/user-stories.spec.ts

Tanpa `PLAYWRIGHT_SAVE_VIDEOS=1`, spesifikasi yang sama berjalan sebagai test biasa tanpa jeda dan tanpa menulis video.
