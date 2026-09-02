# Pembagian Tim RuangKampus

## Kondisi awal

Project baru berisi satu aplikasi Next.js, komponen dasar shadcn, placeholder route, dan satu health endpoint. Belum ada fitur yang dianggap selesai.

| Anggota          | Porsi | Ownership implementasi berikutnya                                                         |
| ---------------- | ----: | ----------------------------------------------------------------------------------------- |
| Kamu / Tech Lead |   50% | Arsitektur, database, API/service, auth/session, contracts, integrasi, CI, dan deployment |
| Anggota 2        |   17% | Komponen UI, public layout, daftar/detail fasilitas, dan responsive UI                    |
| Anggota 3        |   17% | Auth, portal pengguna, reservasi, laporan, dan validasi form                              |
| Anggota 4        |   16% | Portal petugas/admin, antrean approval, fasilitas, dan pengguna                           |

## Batas folder

- Lead: konfigurasi root, `src/lib`, serta backend yang nanti dibuat di `src/server` dan `src/app/api`.
- Anggota 2: `src/components/ui` dan `src/app/(public)`.
- Anggota 3: `src/app/(auth)` dan `src/app/(user)`.
- Anggota 4: `src/app/(staff)` dan `src/app/(admin)`.

## Aturan mulai kerja

1. Ambil satu user story dan buat branch sendiri.
2. Jangan menganggap placeholder sebagai implementasi fitur.
3. Buat minimal tiga commit bermakna: struktur, implementasi, dan perbaikan/test.
4. Mintakan satu review silang sebelum merge ke `main`.
