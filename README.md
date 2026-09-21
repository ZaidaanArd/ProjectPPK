# Sthana Kampus — Project PPK 2026

Sthana Kampus adalah aplikasi reservasi dan pelaporan fasilitas kampus. Aplikasi memakai Next.js App Router untuk web, Convex untuk data real-time/functions/storage, dan Better Auth untuk email/password session.

## Fitur

- Daftar fasilitas dan ketersediaan slot publik tanpa membocorkan pemohon atau tujuan.
- Registrasi mandiri dengan verifikasi admin, login, logout, role guard, dan ganti password sementara.
- Pengajuan, riwayat, dan pembatalan reservasi pengguna.
- Approval/rejection/cancellation petugas dengan pencegahan bentrok atomik.
- Laporan fasilitas dengan foto, status penanganan, catatan resolusi, dan sinkronisasi status perawatan.
- Pengelolaan akun/fasilitas, rekap, dan export CSV untuk admin.

## Menjalankan lokal

Prasyarat: Node.js 24 LTS, pnpm, dan akun Convex. pnpm memakai runtime
Node.js 24.19.0 yang dipin oleh project agar local auth sama dengan Vercel.

```bash
pnpm install
pnpm convex dev
```

CLI membuat atau memperbarui `.env.local`. Pada terminal kedua:

```bash
pnpm dev
```

Buka <http://localhost:3000>. Health check tersedia di <http://localhost:3000/api/health>.

Environment yang diperlukan:

```dotenv
CONVEX_DEPLOYMENT=dev:...
NEXT_PUBLIC_CONVEX_URL=https://....convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://....convex.site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Set environment di deployment Convex:

```bash
pnpm convex env set BETTER_AUTH_SECRET <random-32-byte-secret>
pnpm convex env set SITE_URL http://localhost:3000
pnpm convex env set BOOTSTRAP_SECRET <one-time-bootstrap-secret>
```

## Bootstrap admin dan data demo

1. Daftarkan akun pertama melalui `/register`.
2. Promosikan akun sekali saja dengan function `admin:bootstrapFirstAdmin`, memakai nilai `BOOTSTRAP_SECRET`.
3. Jalankan `seed:demo` dengan secret yang sama bila membutuhkan enam fasilitas demo.

Kedua function menolak secret salah. Bootstrap admin berhenti bekerja setelah admin pertama tersedia; seed bersifat idempotent.

## Quality gate

```bash
pnpm check
```

`pnpm check` menjalankan Oxfmt, Oxlint, aturan khusus Convex, TypeScript,
Vitest, peer-dependency validation, React Doctor, lalu production build.
Gunakan `pnpm doctor` untuk audit React interaktif yang lebih lengkap.

## Struktur

```text
convex/
  schema.ts             schema dan index domain
  auth.ts               Better Auth + profile trigger
  facilities.ts         query publik dan administrasi fasilitas
  reservations.ts       lifecycle reservasi
  reports.ts            lifecycle laporan dan storage foto
  admin.ts              akun, analytics, export data, bootstrap
src/
  app/                  halaman dan Route Handlers Next.js
  components/           UI publik dan portal per role
  lib/                  auth client/server dan shared helpers
```

Dokumentasi kebutuhan, arsitektur, kontrak data, dan pembagian anggota berada di folder [`docs`](docs).
