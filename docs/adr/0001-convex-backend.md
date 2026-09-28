# ADR-0001: Convex untuk data operasional

Tanggal: 27 September 2026

Status: Accepted (mendokumentasikan implementasi saat ini)

## Konteks

Reservasi dan laporan membutuhkan status yang cepat terlihat oleh pengguna/petugas, pemeriksaan bentrok saat persetujuan, serta penyimpanan foto. Roadmap awal masih menyebut Drizzle/PostgreSQL, tetapi implementasi yang berjalan sekarang memakai Convex.

## Keputusan

Gunakan Convex untuk schema, index, query/mutation, audit event, dan file storage. Next.js menangani halaman, auth proxy, serta download CSV. Otorisasi dan aturan domain diulang di function Convex, bukan hanya di komponen UI.

## Konsekuensi

Subscription memudahkan status real-time dan mutation menangani perubahan atomik. Sebaliknya, frontend harus terhubung ke deployment Convex yang tepat; rilis backend/frontend harus kompatibel, dan rollback kode tidak otomatis mengembalikan data. Demo statis lokal tidak membuktikan perilaku transaksi Convex.

Rujukan kode: convex/schema.ts, convex/reservations.ts, convex/reports.ts, src/app/api/admin/export/route.ts.
