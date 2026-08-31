# Deployment Vercel

Scaffold ini menyiapkan aplikasi Next.js untuk Vercel, tetapi belum membuat project cloud atau memilih provider PostgreSQL.

## Pengaturan project

- Import repository Git ke Vercel.
- Pilih framework preset `Next.js`.
- Set Root Directory ke `apps/web`.
- Gunakan install command `pnpm install --frozen-lockfile`.
- Gunakan build command `cd ../.. && pnpm turbo build --filter=web`.
- Output directory tetap `.next`.

## Environment

Atur minimal:

- `DATABASE_URL` — connection string PostgreSQL production.
- `SESSION_SECRET` — random secret minimal 32 karakter dan berbeda dari local/CI.

Jangan memakai nilai `.env.example` di production. Provider database dapat dipilih kemudian selama menyediakan PostgreSQL connection string yang kompatibel.

## Sebelum deployment

1. Jalankan migration terhadap database production melalui job terkontrol.
2. Jalankan `pnpm check` dan `pnpm test:e2e`.
3. Verifikasi `/health` dan `/api/v1/auth/session` setelah deployment.
4. Jangan menjalankan seed demo pada production tanpa keputusan tim.
