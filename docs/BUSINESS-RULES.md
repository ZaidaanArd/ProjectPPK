# Aturan bisnis dan asumsi

Snapshot perubahan lokal: 11 Oktober 2026. Ini adalah aturan implementasi, bukan bukti bahwa deployment production sudah memakai versi ini. [Pengujian](./TEST-REPORT.md) dan [UAT](./UAT.md) mencatat bukti secara terpisah.

## Reservasi

| ID    | Aturan                                                           | Perlakuan sistem                                                                                                                           |
| ----- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| BR-01 | Semua tampilan memakai WIB; database menyimpan Unix milliseconds | Zona waktu perangkat tidak mengubah waktu pemakaian                                                                                        |
| BR-02 | Jam operasional 07.00–20.00, satu hari, interval 30 menit        | Client dan server memeriksa mulai, selesai, dan durasi                                                                                     |
| BR-03 | Pengajuan baru minimal **48 jam sebelum mulai**                  | Tepat 48 jam diterima; kurang dari 48 jam ditolak berdasarkan waktu server saat submit                                                     |
| BR-04 | Pengajuan Menunggu tidak menjamin slot                           | Publik melihat “Ada pengajuan”, tanpa identitas; orang lain tetap boleh mengajukan                                                         |
| BR-05 | Hanya reservasi Disetujui mengunci slot                          | Rentang `[mulai, selesai)`; dua kegiatan yang bersambung tidak bentrok                                                                     |
| BR-06 | Keputusan approval atomik                                        | Fasilitas dan akun pemohon harus aktif, tidak bentrok booking/perbaikan/penutupan; pengajuan bentrok ditolak dengan alasan                 |
| BR-07 | Menunggu kedaluwarsa saat waktu mulai tercapai                   | Query menampilkan status efektif segera; cron menyimpan status dan notifikasi. Petugas tidak boleh menyetujui walaupun cron belum berjalan |
| BR-08 | Pembatalan biasa pengguna minimal satu jam sebelum mulai         | Pemilik saja; pembatalan karena gangguan/penutupan aktif mendapat pengecualian sebelum kegiatan mulai                                      |
| BR-09 | Perubahan jadwal adalah permintaan, bukan langsung pindah        | Jadwal lama tetap berlaku sampai petugas menyetujui; jadwal baru diperiksa ulang; proposal berakhir pada waktu mulai yang lebih awal       |
| BR-10 | Retry pengajuan identik tidak membuat dua booking                | Akun, fasilitas, mulai, selesai sama dan masih pending/approved mengembalikan ID yang sama                                                 |

48 jam adalah **selisih waktu**, bukan “dua tanggal kalender”. Contoh: Minggu 15.30 → Selasa 15.30 memenuhi; Selasa 07.00 belum memenuhi. Tidak ada prioritas FIFO otomatis: petugas menentukan keputusan yang sah.

## Penanganan dan keselamatan

| ID    | Aturan                                                               | Perlakuan sistem                                                                                                                                                                      |
| ----- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-11 | “Mulai tangani” berarti pekerjaan mulai sekarang                     | Dialog wajib memilih **Masih bisa digunakan** atau **Harus ditutup** dan mengisi keterangan publik                                                                                    |
| BR-12 | Gangguan yang masih layak digunakan tidak mengunci slot              | Reservasi tetap berlaku; pengguna terdampak mendapat notifikasi dan pilihan perubahan/pembatalan                                                                                      |
| BR-13 | Harus ditutup adalah tindakan keselamatan langsung                   | Tutup fasilitas tanpa tanggal auto-open; batalkan reservasi pending/approved terdampak, termasuk kegiatan yang sedang berjalan; batalkan proposal perubahan terkait; kirim notifikasi |
| BR-14 | Estimasi bukan izin membuka                                          | Penutupan tetap aktif hingga petugas memastikan aman. Jadwal perbaikan terencana berbeda: memiliki rentang waktu dan perlu perpanjangan jika belum selesai                            |
| BR-15 | Menutup laporan wajib catatan; dampak tertutup wajib konfirmasi aman | Penutupan dari penanganan dibuka setelah **seluruh** laporan berdampak tertutup selesai. Penutupan manual tidak otomatis dibuka oleh laporan                                          |
| BR-16 | Buka kembali tidak menghidupkan booking lama                         | Reservasi yang telah dibatalkan tetap riwayat; pengguna mengajukan ulang sesuai BR-03                                                                                                 |
| BR-17 | Keterangan publik terpisah dari deskripsi laporan privat             | Jangan menyalin nama, kontak, atau foto pelapor ke banner/notifikasi publik                                                                                                           |

“Perbaikan besar” manual yang mempertahankan booking sambil menunggu adalah alur berbeda dari penutupan keselamatan. Status approved selama penutupan **tidak** berarti fasilitas boleh digunakan. Pengguna harus menghubungi petugas bila jadwal tiba sementara fasilitas belum aman.

Jika pekerjaan berikutnya menyatakan **Harus ditutup**, closure perbaikan besar yang sudah ada dieskalasi ke keselamatan: booking yang tadinya dipertahankan ikut dibatalkan dan mendapat pemberitahuan baru. Closure tetap milik penutupan manual, sehingga penyelesaian laporan tidak otomatis membukanya.

## Akun, data, dan batas cakupan

- Mahasiswa/dosen mendaftar mandiri dan menunggu persetujuan admin; petugas dibuat admin. Profil pending/ditolak/nonaktif tidak memperoleh sesi baru setelah login ditolak.
- Satu profil mempunyai satu peran. Admin juga diizinkan menjalankan fungsi petugas yang dinyatakan demikian oleh backend.
- Multi-account maksimal lima sesi tersimpan. Switch memakai navigasi dokumen penuh agar token/data akun lama tidak terbawa.
- Fasilitas diarsipkan (nonaktif), bukan dihapus bersama riwayat. Nonaktifkan dengan booking aktif ditolak; gunakan penutupan agar dampak ditangani.
- Foto laporan JPEG/PNG/WebP maksimal 5 MB. Rekap seluruh periode menghitung reservasi approved, menit terjadwal, dan laporan; bukan persentase okupansi atau jam pemakaian aktual.
- Notifikasi berada di aplikasi, bukan SMS/email/push. Riwayat berpaginasi dibatasi ke pemilik sesi.
- Mode statis adalah demo di browser, bukan backend aman atau bukti operasi production; tidak memiliki cron tanpa browser terbuka atau transaksi lintas perangkat.

## Kebijakan yang belum ditetapkan

Jangan mengarang batas maksimal hari ke depan, kuota/durasi per pengguna, prioritas organisasi, biaya/refund, waktu minimum untuk **perubahan** jadwal, kebijakan no-show, atau retensi/hapus data permanen. Picker publik saat ini menampilkan jendela 30 hari; itu batas tampilan, bukan kebijakan server maksimal H+30. Permintaan perubahan tetap mengikuti aturan saat ini (masa depan + sebelum jadwal asal dimulai), belum diwajibkan 48 jam.

Keputusan tambahan harus diperbarui serentak di aturan ini, UI, mutation, test, dan laporan; lihat [ADR-0004](./adr/0004-reservation-and-handling-policy.md).
