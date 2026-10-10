# UAT / Acceptance Report

Dokumen ini adalah daftar uji penerimaan, **bukan berita acara yang sudah disetujui**. Pelaksana mengisi kolom hasil setelah menjalankan alur pada deployment, commit, akun QA, dan tanggal yang dicatat. Status unit test tidak menggantikan UAT.

## Identitas pelaksanaan

| Field                                | Nilai                                |
| ------------------------------------ | ------------------------------------ |
| Deployment / URL                     | Belum dicatat                        |
| Commit frontend dan backend          | Belum dicatat                        |
| Tanggal, penguji, browser            | Belum dicatat                        |
| Akun QA peran pengguna/petugas/admin | Belum dicatat; jangan tulis password |
| Keputusan penerimaan                 | **Belum ditetapkan**                 |

Prasyarat: gunakan fasilitas QA, dua akun pengguna yang berbeda, satu petugas, dan satu admin. Simpan bukti screenshot/trace di lokasi privat dan tautkan ke issue; hindari data pribadi nyata. Uji mutasi di development/preview kecuali tim secara eksplisit menyetujui data production.

## Skenario penerimaan

| ID    | Langkah inti                                                            | Hasil yang diharapkan                                                           | Hasil aktual |
| ----- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------ |
| US-01 | Tanpa login buka fasilitas dan slot                                     | Status/slot terlihat; identitas dan tujuan pemohon tidak terlihat               | Belum diuji  |
| US-02 | Cari menurut tipe/lokasi/kapasitas                                      | Daftar menyaring fasilitas yang sesuai                                          | Belum diuji  |
| US-03 | Pengguna ajukan slot valid dan slot tidak valid                         | Valid menjadi Menunggu; waktu di luar aturan ditolak                            | Belum diuji  |
| US-04 | Pengguna batalkan miliknya sebelum dan sesudah batas satu jam           | Hanya kasus yang memenuhi aturan dapat dibatalkan                               | Belum diuji  |
| US-05 | Buka riwayat/detail dua akun berbeda                                    | Status terbaru muncul; data akun lain tidak terbaca                             | Belum diuji  |
| US-06 | Buat laporan dengan/tanpa foto; coba file salah/terlalu besar           | Input valid tersimpan; file tidak valid ditolak                                 | Belum diuji  |
| US-07 | Buka laporan setelah petugas memperbarui status                         | Pemilik melihat status terkini; akun lain tidak melihatnya                      | Belum diuji  |
| US-08 | Petugas buka antrean dan filter                                         | Reservasi/laporan yang relevan tampil sesuai filter                             | Belum diuji  |
| US-09 | Dua petugas menyetujui slot sama                                        | Maksimal satu reservasi disetujui; yang lain mendapat error jelas               | Belum diuji  |
| US-10 | Petugas batalkan reservasi disetujui tanpa/dengan alasan                | Form memfokuskan alasan kosong; alasan valid tersimpan                          | Belum diuji  |
| US-11 | Mulai laporan tanpa catatan; selesaikan/tolak tanpa lalu dengan catatan | Mulai berhasil; status akhir wajib catatan                                      | Belum diuji  |
| US-12 | Jadwalkan perbaikan di slot yang bentrok, lalu di slot kosong           | Bentrok ditolak; slot perbaikan tertutup bagi reservasi, jam lain tetap terbuka | Belum diuji  |
| US-13 | Admin buat akun petugas                                                 | Akun aktif dengan peran petugas; tidak masuk area admin                         | Belum diuji  |
| US-14 | Admin buat akun pengguna                                                | Akun aktif dengan peran pengguna; password sementara wajib diganti bila diminta | Belum diuji  |
| US-15 | Registrasi mandiri lalu admin setujui/tolak                             | Pending tidak mendapat sesi; hanya akun disetujui dapat login                   | Belum diuji  |
| US-16 | Admin tambah, ubah, nonaktifkan fasilitas                               | Perubahan muncul di area terkait; yang nonaktif tidak bisa disetujui            | Belum diuji  |
| US-17 | Admin lihat rekap dan unduh CSV; coba sebagai anonim/pengguna           | Angka per fasilitas/lokasi sesuai data; CSV aman; akses 401/403 sesuai sesi     | Belum diuji  |

Uji lintas cerita yang wajib: tambah dua akun berbeda peran dalam satu browser, switch bolak-balik, refresh, keluar satu akun, dan keluar semua akun. Pastikan data serta izin tidak terbawa antarakun. Catat juga mode terang/gelap dan viewport mobile untuk alur utama.

## Pencatatan temuan dan sign-off

Untuk setiap kegagalan, catat ID US, langkah, hasil aktual, hasil yang diharapkan, URL, commit/deployment, tingkat dampak, dan tautan bukti. Setelah perbaikan, lakukan retest serta regresi; ubah hasil menjadi **Lulus** hanya berdasarkan eksekusi ulang. Penerimaan akhir membutuhkan nama/tanggal penyetuju dan daftar pengecualian yang disepakati.
