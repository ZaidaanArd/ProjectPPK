# RuangKampus — Project PPK 2026

Scaffold full-stack satu aplikasi untuk sistem reservasi dan pelaporan fasilitas kampus. Pengunjung dapat melihat fasilitas tanpa login, sedangkan route pengguna, petugas, dan admin telah disiapkan untuk milestone fitur berikutnya.

## Stack

- Next.js 16 App Router, React 19, dan TypeScript
- Tailwind CSS v4 dan shadcn/ui preset `b7Br7GOGm` (Maia, emerald/mist, Hugeicons)
- Next.js Route Handlers, Zod, dan database-backed cookie session
- PostgreSQL 17 dan Drizzle ORM
- pnpm workspace dan Turborepo
- Vitest, Testing Library, Playwright, dan GitHub Actions

## Mulai lokal

Prasyarat: Node.js 20.9+, pnpm 11+, Docker Desktop, dan Git.

```bash
cp .env.example .env
pnpm install --frozen-lockfile
docker compose up -d db
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Di PowerShell, gunakan `Copy-Item .env.example .env` untuk menyalin environment file.

- Aplikasi: <http://localhost:3000>
- Health endpoint: <http://localhost:3000/health>
- PostgreSQL: `localhost:5432`

## Perintah penting

```bash
pnpm dev          # Next.js pada port 3000
pnpm check        # lint + typecheck + unit test + production build
pnpm test:e2e     # browser smoke test desktop dan mobile
pnpm db:generate  # buat migration setelah schema berubah
pnpm db:migrate   # jalankan migration
pnpm db:seed      # masukkan data demo
```

## Status scaffold

Sudah tersedia:

- satu Next.js app dengan public, auth, user, staff, dan admin route groups;
- schema, migration, seed, serta constraint bentrok reservasi approved;
- signed opaque session cookie, role guard server-side, health/session endpoint, dan REST error envelope;
- shared contracts dan shared shadcn component package;
- client-side form validation, unit test, integration smoke test, E2E, serta CI;
- konfigurasi monorepo yang siap dihubungkan ke Vercel.

Belum termasuk fitur bisnis penuh: register/login/logout, CRUD, upload foto, keputusan petugas, dan export. Form saat ini memvalidasi data lalu menampilkan status scaffold.

Dokumentasi lanjutan:

- [Arsitektur](docs/ARCHITECTURE.md)
- [Pembagian tim](docs/TEAM-WORK.md)
- [Deployment Vercel](docs/DEPLOYMENT.md)
- [Panduan kontribusi](CONTRIBUTING.md)
