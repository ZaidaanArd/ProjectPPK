# Pembagian Tim

## Ownership

| Pemilik          | Porsi | Scaffold                                                            | Lanjutan                                               |
| ---------------- | ----: | ------------------------------------------------------------------- | ------------------------------------------------------ |
| Kamu / Tech Lead |   50% | Next.js, Route Handlers, Drizzle, session, contracts, CI, integrasi | Auth, service layer, conflict engine, analytics/export |
| Anggota 2        |   17% | Shared UI, public layout, fasilitas, responsive shell               | US 1–2, fasilitas admin, okupansi/export UI            |
| Anggota 3        |   17% | Auth dan user routes, form dengan client validation                 | US 3–7, UI reservasi dan laporan pengguna              |
| Anggota 4        |   16% | Staff/admin routes, tabel antrean, status                           | US 8–15, proses petugas dan verifikasi akun            |

## Batas file agar minim konflik

- Lead: `apps/web/src/server`, `apps/web/src/app/api`, `packages/contracts`, root config, CI, dan integrasi route.
- Anggota 2: `packages/ui`, `apps/web/src/app/(public)`, komponen fasilitas.
- Anggota 3: `apps/web/src/app/(auth)`, `apps/web/src/app/(user)`, form pengguna.
- Anggota 4: `apps/web/src/app/(staff)`, `apps/web/src/app/(admin)`, tabel/status operasional.

Perubahan lintas ownership dibicarakan terlebih dahulu. Komponen reusable masuk ke `packages/ui` melalui PR anggota 2 atau review anggota 2.

## Urutan kerja

1. Merge bootstrap dan migrasi Next.js milik lead.
2. Anggota 2 menstabilkan primitives dan public shell.
3. Anggota 3 dan 4 bekerja paralel di route group masing-masing.
4. Lead menghubungkan Route Handlers, contracts, database, dan quality gate.
5. Semua anggota melakukan review silang dan mengambil screenshot bagiannya.

Setiap anggota membuat minimal tiga commit bermakna: struktur, implementasi, lalu test/dokumentasi. Pertahankan author commit ketika merge; jangan squash seluruh pekerjaan menjadi commit milik lead.
