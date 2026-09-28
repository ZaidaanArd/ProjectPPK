# Engineering Case Study: Sthana Kampus

## Masalah

Peminjaman ruang dan pelaporan kerusakan kampus melibatkan pengunjung, pemohon, petugas, dan admin. Tanpa satu alur, ketersediaan sulit diperiksa, dua persetujuan bisa berbenturan, dan status penanganan tidak mudah dipantau.

## Keputusan desain

Tim memisahkan halaman publik dari portal berbasis peran. Next.js menangani halaman dan proxy auth; Convex menyimpan data, menjalankan validasi/transaksi, dan mendorong pembaruan real-time; Better Auth mengelola identitas serta sesi. Keputusan dan trade-off dicatat di [ADR](./adr/README.md).

Reservasi dibuat sebagai ajuan Menunggu. Hanya reservasi Disetujui memblokir slot; keputusan petugas memeriksa bentrok dalam mutation backend agar dua persetujuan serentak tidak menghasilkan dua pemakaian pada waktu yang sama. Waktu dibatasi 07.00–20.00 WIB, kelipatan 30 menit, satu hari. Laporan kerusakan memiliki antrean dan catatan resolusi; petugas dapat menandai fasilitas dalam perbaikan hingga aktif kembali.

## Implementasi dan QA

Schema domain dan index ada di convex/schema.ts; aturan akses di convex/lib/authz.ts; workflow reservasi/laporan di convex/reservations.ts dan convex/reports.ts. UI pengguna, petugas, dan admin berada di src/components. Halaman publik memakai katalog tanpa membocorkan detail pemohon. Demo statis lokal memungkinkan uji UI tanpa mengubah Convex, tetapi tidak menggantikan uji backend dinamis.

Pada snapshot lokal 27 September 2026, pnpm test lulus **35 test di 10 file**. Playwright mendaftarkan tujuh test browser, tetapi tidak dijalankan pada snapshot tersebut. Rincian, batasan, dan cara mengulang ada di [Test Report](./TEST-REPORT.md); penerimaan pengguna dicatat terpisah di [UAT](./UAT.md).

## Trade-off dan langkah berikutnya

Multi-akun dan otorisasi lintas peran memperbesar matriks pengujian. Mode demo cepat untuk UI, tetapi state browser bukan bukti perilaku Convex production. Katalog memakai foto ilustratif, bukan bukti kondisi fasilitas nyata. Sebelum menyebut aplikasi siap dipakai institusi, tim perlu menyelesaikan UAT end-to-end, kebijakan privasi/retensi, backup/restore, dan penanggung jawab operasional.
