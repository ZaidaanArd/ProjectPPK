# RuangKampus — Project PPK 2026

Scaffold awal sistem reservasi dan pelaporan fasilitas kampus untuk project Pengembangan Platform Khusus sebelum UTS.

> **Status:** baru setup project dan dokumentasi. Belum ada autentikasi, database, CRUD, approval, upload, export, atau UI final.

## Yang sudah tersedia

- Single Next.js App Router project dengan React dan TypeScript.
- Tailwind CSS v4 dan komponen dasar shadcn preset `b7Br7GOGm`.
- Placeholder route untuk area public, auth, user, staff, dan admin.
- Contoh backend Route Handler: `GET /api/health`.
- ESLint, Prettier, typecheck, production build, dan CI.

## Menjalankan project

```bash
pnpm install
pnpm dev
```

Buka <http://localhost:3000>. Health check tersedia di <http://localhost:3000/api/health>.

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm check
```

## Struktur awal

```text
src/
  app/
    (public)/       halaman umum
    (auth)/         login dan registrasi
    (user)/         portal pengguna
    (staff)/        portal petugas
    (admin)/        portal admin
    api/             backend Route Handlers
  components/
    ui/              primitives shadcn
  lib/               helper, schema, dan type bersama nanti
```

Folder route dibuat untuk membagi ownership. Placeholder bukan implementasi fitur dan tidak boleh dicatat sebagai user story yang selesai.

## Dokumentasi tim

| Dokumen                              | Isi                                                              |
| ------------------------------------ | ---------------------------------------------------------------- |
| [Requirements](docs/REQUIREMENTS.md) | Ketentuan tugas, aktor, dan user story 1–17                      |
| [Architecture](docs/ARCHITECTURE.md) | Diagram sistem, request flow, route map, dan aturan arsitektur   |
| [Data & API](docs/DATA-AND-API.md)   | Rancangan ERD, status, validasi, dan endpoint yang direncanakan  |
| [Team Work](docs/TEAM-WORK.md)       | Porsi, ownership folder, pembagian user story, dan review silang |
| [Roadmap](docs/ROADMAP.md)           | Urutan milestone dan daftar pekerjaan atomic                     |

## Aturan singkat kontribusi

1. Satu branch untuk satu pekerjaan kecil.
2. Jangan mengubah folder milik anggota lain tanpa koordinasi.
3. Setiap anggota membuat minimal tiga commit bermakna.
4. Jalankan `pnpm check` sebelum merge.
5. Setiap pull request mendapat minimal satu review silang.
