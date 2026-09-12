# Requirements RuangKampus

Dokumen ini merangkum brief tugas. Status implementasi harus diperbarui ketika pull request fitur sudah di-merge, bukan ketika placeholder dibuat.

## Status

| Simbol | Arti                            |
| ------ | ------------------------------- |
| ⬜     | Belum dikerjakan                |
| 🟨     | Sedang dikerjakan               |
| ✅     | Sudah di-merge dan diverifikasi |

Saat ini seluruh user story masih ⬜.

## Ketentuan umum

- Project dikerjakan sampai Ujian Tengah Semester oleh satu tim berisi 4–5 mahasiswa.
- Setiap anggota wajib berkontribusi aktif dan melakukan commit dengan pesan yang jelas.
- Repository GitHub/GitLab bersama wajib digunakan.
- Struktur harus memisahkan koneksi/data, tampilan, konfigurasi, dan logika proses secara jelas dalam pola Next.js yang disepakati tim.
- Autentikasi akhir harus mencakup registrasi, login, dan logout.
- Form penting wajib divalidasi di client dan server.
- UI/UX harus dapat digunakan pada desktop dan mobile.
- Bila rancangan data perlu atribut tambahan, tim boleh menambahkannya dan mendokumentasikan alasannya.

## Batas operasional reservasi

- Jam operasional: 07.00–20.00 WIB.
- Slot waktu selalu kelipatan 30 menit.
- `start_time` dan `end_time` harus berada di hari yang sama dan dalam jam operasional.
- Validasi aturan waktu dilakukan di server; validasi client hanya membantu pengalaman pengguna.

## Aktor

| Aktor      | Kemampuan utama                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------- |
| Pengunjung | Melihat daftar fasilitas dan ketersediaan tanpa detail pemohon atau tujuan                        |
| Pengguna   | Mengajukan/membatalkan reservasi, melihat riwayat, membuat laporan kerusakan, dan memantau status |
| Petugas    | Memproses reservasi/laporan, mencatat alasan atau resolusi, dan memperbarui status fasilitas      |
| Admin      | Mengelola fasilitas dan akun, memverifikasi pendaftaran, serta melihat/export rekap               |

## User stories

|    ID | Status | User story ringkas                                                                                                  |
| ----: | :----: | ------------------------------------------------------------------------------------------------------------------- |
| US-01 |   ⬜   | Pengunjung/pengguna melihat fasilitas dan status tersedia/tidak tersedia per slot tanpa detail pemohon/tujuan.      |
| US-02 |   ⬜   | Pengunjung/pengguna mencari fasilitas berdasarkan tipe, lokasi, atau kapasitas.                                     |
| US-03 |   ⬜   | Pengguna mengajukan reservasi pada rentang waktu tertentu dengan tujuan penggunaan.                                 |
| US-04 |   ⬜   | Pengguna membatalkan reservasinya sendiri sebelum batas waktu.                                                      |
| US-05 |   ⬜   | Pengguna melihat riwayat, status terbaru, dan detail lengkap reservasinya.                                          |
| US-06 |   ⬜   | Pengguna melaporkan kerusakan/masalah dengan kategori, deskripsi, dan foto.                                         |
| US-07 |   ⬜   | Pengguna melihat status laporan miliknya.                                                                           |
| US-08 |   ⬜   | Petugas melihat dashboard/antrean reservasi dan laporan yang menunggu atau sedang diproses.                         |
| US-09 |   ⬜   | Petugas menyetujui/menolak reservasi; sistem mencegah dua reservasi approved pada fasilitas dan jadwal yang sama.   |
| US-10 |   ⬜   | Petugas membatalkan reservasi approved dalam kondisi mendesak dengan alasan pembatalan.                             |
| US-11 |   ⬜   | Petugas memproses laporan, memperbarui status, dan menambahkan catatan resolusi ketika ditutup.                     |
| US-12 |   ⬜   | Petugas menandai fasilitas dalam perbaikan lalu mengaktifkannya kembali setelah selesai.                            |
| US-13 |   ⬜   | Admin mendaftarkan akun petugas secara langsung.                                                                    |
| US-14 |   ⬜   | Admin mendaftarkan akun pengguna secara langsung tanpa registrasi mandiri.                                          |
| US-15 |   ⬜   | Admin memverifikasi atau menolak akun hasil registrasi mandiri sebelum dapat login.                                 |
| US-16 |   ⬜   | Admin menambah, mengubah, dan menonaktifkan fasilitas.                                                              |
| US-17 |   ⬜   | Admin melihat dan mengekspor rekap okupansi serta frekuensi kerusakan per fasilitas/lokasi ke CSV, Excel, atau PDF. |

## Artefak pengumpulan

Satu dokumen kelompok nantinya berisi:

- nama dan NIM anggota;
- pembagian tugas;
- tautan source code dan file pendukung;
- konfigurasi untuk menjalankan program;
- informasi login setiap aktor/pengguna;
- screenshot dan penjelasan singkat setiap fitur.

Deadline pada brief: **11 Oktober 2026 pukul 12.00 WIB melalui Kulon**. Presentasi mencakup latar belakang, fitur utama, demo, dan kendala; alokasi 10 menit presentasi serta 10–15 menit tanya jawab.
