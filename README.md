# RuangKampus — Initial Scaffold

Repository awal untuk project sistem reservasi dan pelaporan fasilitas kampus.

> Status saat ini: **scaffold only**. Belum ada desain final, autentikasi, database, API, CRUD, approval, upload, export, atau business logic.

## Stack awal

- Next.js App Router, React, dan TypeScript
- Tailwind CSS v4 dan shadcn/ui preset `b7Br7GOGm`
- pnpm sebagai package manager

## Menjalankan project

```bash
pnpm install
pnpm dev
```

Buka <http://localhost:3000>. Database dan Docker belum dibutuhkan pada tahap ini.

Health check tersedia di <http://localhost:3000/api/health>.

## Struktur

```text
src/
  app/
    (public)/       halaman umum
    (auth)/         login dan registrasi
    (user)/         portal pengguna
    (staff)/        portal petugas
    (admin)/        portal admin
    api/health/     contoh backend Route Handler
  components/ui/    komponen dasar shadcn
  lib/              helper dan type/schema bersama nanti
```

Semua route saat ini hanya menampilkan placeholder. Folder dibuat lebih awal untuk membagi ownership dan mengurangi konflik ketika implementasi dimulai.

## Quality check

```bash
pnpm check
```

Pembagian kerja ada di [docs/TEAM-WORK.md](docs/TEAM-WORK.md).
