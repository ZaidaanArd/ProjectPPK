# ADR-0003: Halaman publik dan mode demo statis

Tanggal: 27 September 2026

Status: Accepted (mendokumentasikan implementasi saat ini)

## Konteks

Halaman publik perlu dapat ditemukan mesin pencari, sementara CTA akun dapat menyesuaikan sesi browser. Tim juga memerlukan demo alur UI tanpa memodifikasi backend.

## Keputusan

Konten/metadata publik dirender tanpa membaca cookie pada layout publik; bagian akun memeriksa auth di client. /portal menjadi gerbang ke dashboard sesuai peran. NEXT_PUBLIC_DATA_MODE=static menyediakan data demo di browser untuk development; dynamic adalah default dan build production menolak mode static.

## Konsekuensi

Katalog publik dan metadata tidak bergantung pada sesi, sedangkan tombol akun dapat berubah setelah hydration. Demo statis cocok untuk eksplorasi antarmuka dan sebagian test browser, tetapi data localStorage/IndexedDB tidak mencerminkan otorisasi atau transaksi Convex. Test rilis tetap membutuhkan environment dinamis.

Rujukan kode: src/app/(public), src/components/public-account-links.tsx, src/lib/data-mode.ts, src/lib/static-data.ts, src/app/portal/page.tsx.
