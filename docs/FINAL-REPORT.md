# Laporan implementasi Sthana Kampus

Tanggal pembaruan: 11 Oktober 2026. Sumber utama: kode repository, [aturan bisnis](./BUSINESS-RULES.md), dan [laporan pengujian](./TEST-REPORT.md). Laporan Google Docs tetap menjadi artefak kelompok; halaman ini merangkum perubahan teknis tanpa menyalin kredensial.

## 1. Studi kasus dan ruang lingkup

Sthana menyatukan katalog fasilitas, pengajuan reservasi, keputusan petugas, dan pelaporan kerusakan. Pengunjung melihat jadwal tanpa identitas pemohon. Pengguna melihat data milik sendiri; petugas memproses antrean; admin mengelola akun/fasilitas dan rekap. Admin Studio tidak termasuk pekerjaan ini.

Masalah operasional bukan hanya bentrok booking. Pengajuan dapat melewati waktu mulai, pekerjaan perbaikan dapat tetap aman atau berbahaya, dan dua laporan pada ruang yang sama tidak boleh saling membuka penutupan secara keliru. Aturan baru memastikan UI dan server menyatakan keadaan yang sama.

## 2. Asumsi dan aturan

WIB, jam 07.00–20.00, interval 30 menit, dan satu hari berlaku untuk reservasi. Pengajuan baru minimal 48 jam sebelum mulai; tepat batas diterima. Pending adalah pengajuan, bukan janji pemakaian. Approved mengunci jadwal. Expired tidak bisa disetujui walaupun job penyimpanan status terlambat.

Pembatalan biasa pengguna minimal satu jam sebelum mulai. Gangguan/penutupan aktif memberi pengecualian sebelum kegiatan berjalan. Perubahan jadwal memerlukan keputusan: slot lama tetap berlaku sampai jadwal pengganti disetujui. Tidak ditambahkan kuota/durasi/horizon maksimum, prioritas otomatis, atau biaya. Batas 48 jam untuk perubahan jadwal belum diputuskan.

## 3. Arsitektur dan ERD

![Arsitektur sistem](/docs-assets/architecture.png)

Browser memakai Next.js App Router dan komponen React. `/api/auth` mem-proxy Better Auth yang berjalan melalui Convex; sesi cookie dan JWT menghubungkan akses UI ke fungsi domain. Backend memeriksa identity, status profil, dan role pada setiap fungsi terlindungi. Indexed query dan mutation atomik menjaga keputusan approval/penutupan. Foto berada di Convex storage.

![ERD domain](/docs-assets/erd.png)

Better Auth menyimpan user/session terpisah dari profil domain. Profil terkait reservasi, laporan, audit, dan notifikasi. Fasilitas terkait booking, laporan, maintenanceWindows, facilityIssues, dan emergencyClosures. ReservationChanges menyimpan jadwal asal dan usulan; notifikasi mempunyai dedupKey serta referensi domain. [ERD sumber](./DATA-AND-API.md) mengikuti schema aktual, bukan asumsi database SQL.

## 4. Implementasi antarmuka

Screenshot UI berikut diambil dari [production](https://sthana.myudak.com) pada 11 Oktober 2026. Gambar arsitektur, ERD, dan alur penanganan merupakan diagram berdasarkan kode.

![Login production](/docs-assets/login-production.png)

Login memakai email dan password. Pengunjung tidak perlu akun; mahasiswa/dosen mendaftar dan menunggu persetujuan admin. Petugas dibuat admin. Akun pengujian tiga peran tercantum pada bagian Informasi Login di laporan Google Docs kelompok.

![Katalog fasilitas production](/docs-assets/facilities-production.png)

Katalog menyediakan pencarian, filter, foto, dan slot publik. Status pengajuan tidak mengungkap nama/tujuan. Slot lewat/kurang 48 jam nonaktif dengan alasan. Skeleton, empty state Sthani, serta tema terang/gelap memakai komponen bersama.

![Form reservasi production](/docs-assets/reservation-form-production.png)

Form memilih fasilitas dan waktu, memeriksa batas/overlap, lalu konfirmasi. Server menghitung ulang pada submit; state browser bukan izin final. Retry identik mengembalikan ID yang sama.

![Form laporan production](/docs-assets/report-form-production.png)

Laporan menyimpan kategori/deskripsi dan foto opsional. Deskripsi privat tidak otomatis dipublikasikan. Petugas memasukkan keterangan yang aman untuk ditampilkan ketika mulai pekerjaan.

![Dialog dampak penanganan production](/docs-assets/handling-production.png)

Usable memulai pekerjaan dan gangguan tanpa menutup booking. Closed menutup segera, preview menghitung affected pending/approved/ongoing, dan konfirmasi menjalankan pembatalan serta notifikasi. Completion closed membutuhkan catatan dan konfirmasi aman. Dua laporan closed pada satu ruang menahan penutupan sampai yang terakhir selesai; closure manual tetap terpisah.

![Ringkasan admin production](/docs-assets/admin-summary-production.png)

Admin melihat rekap akun, fasilitas, reservasi, dan laporan. Ekspor rekap per fasilitas/lokasi memuat jumlah reservasi disetujui, total menit terjadwal, dan jumlah laporan sepanjang periode pencatatan.

### Dampak pekerjaan dan keselamatan

![Alur penanganan dan pembukaan fasilitas](/docs-assets/handling-flow.png)

Estimasi tidak membuka fasilitas otomatis. Jika closure berasal dari penutupan manual, pembukaan tetap menjadi tindakan manual; booking yang sudah batal tidak dipulihkan.

## 5. Edge case dan hasil pengujian

[EC-01–EC-30](./EDGE-CASES.md) memetakan keadaan batas ke US-01–US-17. Test lokal mencakup tepat 48 jam, retry setelah cutoff, expiry sebelum cron, notifikasi booking baru saat gangguan, penutupan kegiatan berlangsung, dua laporan satu fasilitas, closure manual, riwayat notifikasi, serta histori fasilitas saat arsip.

Bukti eksekusi, jumlah test, dan perintah ada di [Test Report](./TEST-REPORT.md). Screenshot antarmuka berasal dari production; form diisi sebagai contoh tanpa mengirim booking/laporan baru atau menutup fasilitas. Unit test dan screenshot tidak menggantikan persetujuan UAT.

## 6. Keamanan dan privasi

Route guard tidak menggantikan role check mutation. Owner berasal dari sesi; publik tidak membaca tujuan/identitas/foto privat. URL foto hanya di query pemilik/petugas. Input waktu, foto, transisi, dan CSV divalidasi di backend. Fasilitas diarsipkan agar booking dan audit tidak terputus. Secret server tidak masuk screenshot atau laporan; kredensial akun presentasi hanya tercantum pada Google Docs kelompok sesuai izin pemilik, tidak disalin ke repo publik.

Notifikasi in-app bukan email/push; aplikasi bukan prosedur evakuasi atau jaminan pelayanan. Retensi data dan penghapusan permanen belum ditetapkan; proyek ini tidak mengklaim SLA atau sertifikasi kepatuhan. [Catatan keamanan](./SECURITY-PRIVACY.md).

## 7. Setup, rilis, dan operasi

Gunakan `pnpm install --frozen-lockfile`, isi env lokal sesuai `.env.example`, `pnpm dev:backend` untuk Convex development dan `pnpm dev` untuk frontend. Mode statis memakai `NEXT_PUBLIC_DATA_MODE=static`; tidak untuk production auth.

Rilis harus membawa backend/frontend kompatibel. Backend lebih dahulu, preview dengan QA beda peran, lalu frontend jika alur lulus. Backup sebelum migrasi/perapian; tidak menjalankan cleanup pending production tanpa preview dan persetujuan. Rollback frontend/backend harus menjaga schema opsional dan kontrak baru. [Runbook](./OPERATIONS.md).

## 8. Kesimpulan dan batas bukti

Perubahan menyatukan kebijakan waktu dan keselamatan di UI, backend, demo, test, dan dokumen. Backend production dan frontend commit defd77d telah dirilis pada 11 Oktober 2026; rincian deployment serta smoke check ada di Test Report. Penerimaan kelompok tetap memerlukan hasil aktual dan sign-off. Google Sheet adalah log temuan QA, bukan keputusan penerimaan otomatis.
