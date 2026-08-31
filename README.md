# RuangKampus — Project PPK 2026

Scaffold full-stack untuk sistem reservasi dan pelaporan fasilitas kampus. Pengunjung dapat melihat fasilitas dan ketersediaan tanpa login; pengguna terverifikasi mengajukan reservasi/laporan; petugas dan admin memproses antrean melalui portal berbasis peran.

## Stack

- Vite, React 19, TypeScript, React Router, TanStack Query
- shadcn/ui preset `b7Br7GOGm` (Maia, emerald/mist, Hugeicons)
- Fastify, Zod, cookie session
- PostgreSQL 17, Drizzle ORM
- pnpm workspace, Turborepo
- Vitest, Testing Library, Playwright, GitHub Actions

## Mulai lokal

Prasyarat: Node.js 20+, pnpm 11+, Docker Desktop, dan Git.

```bash
cp .env.example .env
pnpm install --frozen-lockfile
docker compose up -d db
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Web: <http://localhost:5173>
- API health: <http://localhost:3000/health>
- PostgreSQL: `localhost:5432`

Di PowerShell, gunakan `Copy-Item .env.example .env` untuk menyalin environment file.

## Perintah penting

```bash
pnpm dev          # web + API
pnpm check        # lint + typecheck + unit test + build
pnpm test:e2e     # smoke test browser
pnpm db:generate  # buat migration setelah schema berubah
pnpm db:migrate   # jalankan migration
pnpm db:seed      # masukkan data demo
```

## Status scaffold

Sudah tersedia:

- workspace web/API/UI/contracts;
- schema database, migration, seed, dan constraint bentrok approved;
- session store PostgreSQL, role guard, error envelope, health/session endpoint;
- route dan layout publik, pengguna, petugas, admin;
- client-side form validation yang memakai schema bersama;
- unit/integration/e2e test dan CI.

Belum termasuk implementasi fitur bisnis penuh: register/login/logout, CRUD, upload foto, proses keputusan, dan export. Form saat ini memvalidasi data lalu menampilkan status scaffold.

Dokumentasi lanjutan:

- [Arsitektur](docs/ARCHITECTURE.md)
- [Pembagian tim](docs/TEAM-WORK.md)
- [Panduan kontribusi](CONTRIBUTING.md)
