# Pembagian Tim

## Ownership

| Pemilik          | Porsi | Scaffold                                                       | Lanjutan                                                |
| ---------------- | ----: | -------------------------------------------------------------- | ------------------------------------------------------- |
| Kamu / Tech Lead |   50% | Workspace, Fastify, Drizzle, session, contracts, CI, integrasi | Backend, autentikasi, conflict engine, analytics/export |
| Anggota 2        |   17% | UI package, public layout, facility card, availability shell   | US 1–2, fasilitas/admin facility, okupansi/export UI    |
| Anggota 3        |   17% | Auth/user layout dan form dengan validasi client               | US 3–7, seluruh UI reservasi dan laporan pengguna       |
| Anggota 4        |   16% | Staff/admin layout, tabel antrean, status, keputusan           | US 8–15, seluruh UI petugas dan verifikasi akun         |

## Batas file agar minim konflik

- Lead: `apps/api`, `packages/contracts`, root config, integrasi router.
- Anggota 2: `packages/ui`, `views/public`, komponen fasilitas.
- Anggota 3: `views/auth`, `views/user`, form pengguna.
- Anggota 4: `views/staff`, `views/admin`, tabel/status operasional.

Perubahan lintas ownership dibicarakan terlebih dahulu. Komponen baru yang reusable masuk ke `packages/ui` melalui PR anggota 2 atau dengan review anggota 2.

## Urutan kerja scaffold

1. Merge `chore/bootstrap-workspace` milik lead.
2. Anggota 2 menstabilkan primitives dan public shell.
3. Anggota 3 dan 4 bekerja paralel pada view domain masing-masing.
4. Lead menghubungkan route, contracts, dan quality gate.
5. Semua anggota melakukan review silang dan mengambil screenshot bagiannya.

Setiap anggota membuat minimal tiga commit bermakna: struktur, implementasi, lalu test/dokumentasi. Merge harus mempertahankan author commit; hindari squash seluruh pekerjaan menjadi commit milik lead.
