# Edge case dan matriks regresi

Rujukan kebijakan: [Aturan bisnis](./BUSINESS-RULES.md). Kolom bukti menyebut test yang tersedia; **tersedia tidak sama dengan telah lulus pada production**. Hasil eksekusi ada di [Test Report](./TEST-REPORT.md).

## Waktu, jadwal, dan keputusan

| ID / US          | Kondisi                                                    | Hasil yang wajib                                                              | Bukti                                     |
| ---------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------- |
| EC-01 / US-03    | Tepat 48 jam; satu ms kurang; beda tanggal WIB             | Tepat batas valid; kurang ditolak; tidak berbasis tanggal saja                | reservation-policy, edgeCases             |
| EC-02 / US-03    | Form terbuka melewati batas 48 jam                         | Submit menghitung ulang; server tetap menolak                                 | policy + validasi mutation                |
| EC-03 / US-01/03 | Slot lewat atau kurang 48 jam                              | Abu-abu/nonaktif, alasan jelas; tidak dapat dipilih via keyboard              | Playwright edge-cases                     |
| EC-04 / US-03/09 | Ada pengajuan pending                                      | Informasi saja; tetap boleh mengajukan jika aturan waktu terpenuhi            | reservations                              |
| EC-05 / US-09    | Dua petugas approve rentang bertabrakan                    | Maksimal satu approved; keputusan kedua mendapat hasil sesuai keadaan terbaru | reservations (Convex transaction fixture) |
| EC-06 / US-09    | Selesai booking A sama dengan mulai B                      | Tidak dianggap overlap                                                        | reservation-time                          |
| EC-07 / US-03    | Double-click/retry setelah response hilang                 | ID sama, bukan booking ganda; retry setelah batas 48 jam juga aman            | edgeCases                                 |
| EC-08 / US-08/09 | Pending melewati waktu mulai, cron belum berjalan          | Status efektif expired; approval ditolak; tidak ikut dampak penutupan         | reservations, edgeCases                   |
| EC-09 / US-04/10 | Batalkan tanpa alasan / akun orang lain                    | Form fokus input; server menolak; pemilik/peran diverifikasi                  | core-stories, authz                       |
| EC-10 / US-05    | Perubahan jadwal belum disetujui/ditolak/expired           | Jadwal lama tetap approved; proposal tidak mengunci jadwal baru               | reservations, static-data                 |
| EC-11 / US-09    | Jadwal baru ditempati saat proposal menunggu               | Approval perubahan ditolak; jadwal lama tidak hilang                          | reservations                              |
| EC-12 / US-09    | Akun pemohon atau fasilitas dinonaktifkan sebelum approval | Keputusan ditolak, bukan memakai status saat form dibuka                      | validasi mutation                         |

## Gangguan, pekerjaan, dan penutupan

| ID / US          | Kondisi                                                         | Hasil yang wajib                                                                                            | Bukti                        |
| ---------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------- |
| EC-13 / US-11    | Klik mulai tanpa dampak/keterangan publik                       | Tidak memulai pekerjaan; validasi client dan server                                                         | edgeCases + dialog           |
| EC-14 / US-11/12 | Perbaikan kecil, fasilitas masih aman                           | Work starts; jadwal tetap terbuka; booking lama/baru mendapat info gangguan                                 | edgeCases, facilityIssues    |
| EC-15 / US-11/12 | Kerusakan berbahaya dengan pending, approved, kegiatan berjalan | Preview baca saja; konfirmasi membatalkan data terdampak dalam satu mutation dan mengirim pesan             | edgeCases, emergencyClosures |
| EC-16 / US-12    | Estimasi berlalu / refresh / browser ditutup                    | Penutupan tidak otomatis dibuka                                                                             | edgeCases                    |
| EC-17 / US-11    | Selesai tanpa catatan atau tanpa memastikan aman                | Ditolak; status dan closure tetap                                                                           | reports, edgeCases           |
| EC-18 / US-12    | Dua laporan menutup fasilitas yang sama                         | Menyelesaikan satu tidak membuka selama yang lain masih berjalan                                            | edgeCases                    |
| EC-19 / US-12    | Penutupan manual + laporan berbahaya/selesai                    | Long repair dieskalasi ke safety dan booking ditarik; closure manual tetap tertutup setelah laporan selesai | edgeCases, static-data       |
| EC-20 / US-12    | Buka kembali setelah booking dibatalkan                         | Booking tidak hidup kembali; kirim pemberitahuan buka                                                       | edgeCases                    |
| EC-21 / US-12    | Jadwal perbaikan terencana bentrok booking/pending              | Tidak boleh menimpa; cari slot kosong. Pending expired tidak memblokir                                      | maintenance                  |
| EC-22 / US-12    | Gangguan masa depan / selesai                                   | Banner hanya relevan pada tanggal/rentang; tidak dianggap gangguan sekarang                                 | filter UI + facilityIssues   |
| EC-23 / US-11    | Retry mulai/selesai atau perubahan bersamaan                    | Retry status sama idempotent; tidak menggandakan issue/closure                                              | edgeCases                    |

## Data, akses, dan operasi

| ID / US           | Kondisi                                             | Hasil yang wajib                                                                    | Bukti                                                      |
| ----------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| EC-24 / US-05/07  | Akses ID reservasi/laporan akun lain                | Backend owner check; tidak membocorkan nama/tujuan/foto                             | authz, notifications                                       |
| EC-25 / US-16     | Arsip fasilitas yang pernah digunakan               | Histori dan foreign references tetap; sembunyikan katalog, dapat diaktifkan kembali | facilities                                                 |
| EC-26 / US-16     | Nonaktifkan fasilitas dengan kegiatan aktif         | Tolak; gunakan penutupan beralasan dan notifikasi                                   | fasilitas + closure tests                                  |
| EC-27 / US-05     | Lebih 50 notifikasi / ganti akun                    | Semua histori lewat pagination milik akun; klik menuju reservasi terkait            | edgeCases, Playwright                                      |
| EC-28 / US-17     | CSV dengan formula, anonim, non-admin, server error | Escape formula; bedakan 401, 403, 500; angka periode sesuai definisi                | csv, admin-export                                          |
| EC-29 / US-15     | Pending sign-up saat akun admin masih aktif         | Tidak memberi sesi pending dan tidak signOut semua akun                             | auth tests; dynamic E2E belum diverifikasi untuk rilis ini |
| EC-30 / lintas US | Refresh/tab lain/mobile/dark mode/jaringan gagal    | State server sumber utama; error mempertahankan input; pending mencegah kirim ulang | static browser + follow-up dynamic UAT                     |

## Pengujian yang tetap membutuhkan deployment

Convex-test bukan browser dengan cookie Better Auth nyata. Race dua perangkat, cron produksi, putus-sambung websocket, persetujuan akun, multi-session beda peran, dan pemulihan insiden perlu QA development/preview. Jangan menyebutnya lulus hanya karena fixture mutation lulus.

Asumsi yang belum ditetapkan (no-show, durasi/kuota, retensi, blackout kampus, horizon pemesanan) dicatat sebagai pertanyaan kebijakan, bukan disamarkan sebagai fitur. Pesan aplikasi bukan prosedur evakuasi: petugas tetap menghubungi pengguna yang sedang berada di fasilitas berbahaya.
