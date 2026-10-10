# Engineering Case Study: Sthana Kampus

## Masalah

Peminjaman ruang dan pelaporan kerusakan kampus melibatkan pengunjung, pemohon, petugas, dan admin. Tanpa satu alur, ketersediaan sulit diperiksa, dua persetujuan bisa berbenturan, dan status penanganan tidak mudah dipantau.

## Keputusan desain

Tim memisahkan halaman publik dari portal berbasis peran. Next.js menangani halaman dan proxy auth; Convex menyimpan data, menjalankan validasi/transaksi, dan mendorong pembaruan real-time; Better Auth mengelola identitas serta sesi. Keputusan dan trade-off dicatat di [ADR](./adr/README.md).

Reservasi dibuat sebagai ajuan Menunggu, minimal 48 jam sebelum mulai. Hanya Disetujui memblokir slot; mutation memeriksa waktu, akun, fasilitas, dan bentrok pada keputusan terbaru. Waktu 07.00–20.00 WIB, kelipatan 30 menit, satu hari. Pending kedaluwarsa tidak dapat disetujui meski cron terlambat; perubahan jadwal mempertahankan slot asal sampai approval.

Mulai tangani memisahkan pekerjaan usable dari penutupan keselamatan. Usable mempertahankan booking dan memberi informasi gangguan. Closed menutup tanpa auto-open, membatalkan booking terdampak, dan wajib konfirmasi aman pada completion. Dua laporan tidak saling membuka penutupan; closure manual tetap perlu keputusan terpisah. Long repair yang awalnya mempertahankan booking dieskalasi bila pekerjaan kemudian dinyatakan berbahaya.

## Implementasi dan QA

Schema domain dan index ada di convex/schema.ts; aturan akses di convex/lib/authz.ts; workflow reservasi/laporan di convex/reservations.ts dan convex/reports.ts. UI pengguna, petugas, dan admin berada di src/components. Halaman publik memakai katalog tanpa membocorkan detail pemohon. Demo statis lokal memungkinkan uji UI tanpa mengubah Convex, tetapi tidak menggantikan uji backend dinamis.

Snapshot lokal 11 Oktober 2026: **112 test di 23 file** Vitest dan **11 skenario browser terarah** lulus, beserta format, lint, typecheck, dan build. Ini bukan bukti deployment atau transaksi dua perangkat nyata. Rincian/perintah ada di [Test Report](./TEST-REPORT.md), screenshot/ERD di [laporan implementasi](./FINAL-REPORT.md), dan keputusan batas di [aturan bisnis](./BUSINESS-RULES.md). [UAT](./UAT.md) tetap belum disetujui.

## Trade-off dan langkah berikutnya

Multi-akun dan otorisasi lintas peran memperbesar matriks pengujian. Mode demo cepat untuk UI, tetapi state browser bukan bukti perilaku Convex production. Katalog memakai foto ilustratif, bukan bukti kondisi fasilitas nyata. Sebelum menyebut aplikasi siap dipakai institusi, tim perlu menyelesaikan UAT end-to-end, kebijakan privasi/retensi, backup/restore, dan penanggung jawab operasional.
