# Arsitektur Sthana Kampus

## System context

```mermaid
flowchart LR
  visitor[Pengunjung]
  user[Pengguna]
  officer[Petugas]
  admin[Admin]
  next[Next.js App Router]
  convex[Convex functions + realtime database]
  storage[Convex file storage]
  auth[Better Auth component]

  visitor --> next
  user --> next
  officer --> next
  admin --> next
  next <--> convex
  convex --> storage
  convex --> auth
```

Next.js menangani halaman, auth proxy, dan download CSV. Data domain, authorization, validasi server, transaksi approval, dan storage foto berada di Convex. Browser memakai subscription Convex sehingga antrean dan status berubah real-time.

## Request flow

```mermaid
sequenceDiagram
  actor Browser
  participant Next as Next.js
  participant Auth as Better Auth
  participant Fn as Convex function
  participant DB as Convex database

  Browser->>Next: POST /api/auth/sign-in/email
  Next->>Auth: Proxy ke Convex HTTP action
  Auth-->>Browser: HttpOnly session cookie
  Browser->>Fn: Query/mutation + JWT
  Fn->>Fn: Validasi identity, status akun, dan role
  Fn->>DB: Indexed query / atomic mutation
  DB-->>Browser: Reactive result
```

Server layouts memakai token dari cookie untuk guard `/app`, `/staff`, dan `/admin`. Function tetap memeriksa role; route guard bukan satu-satunya pengamanan.

## Struktur file program

Struktur berikut mengikuti repository Sthana Kampus. Route group dalam tanda kurung mengatur layout dan peran, bukan segmen URL. Daftar diringkas pada folder/file utama; bukan seluruh file.

```text
project-ppk/
|-- src/                       # Frontend Next.js dan helper client/server
|   |-- app/                   # Route, layout, halaman dan metadata
|   |   |-- (public)/          # Beranda, fasilitas, Tentang dan docs
|   |   |-- (auth)/            # Login, tambah akun dan pendaftaran
|   |   |-- (user)/            # Portal pengguna: reservasi/laporan
|   |   |-- (staff)/           # Antrean dan penanganan petugas
|   |   |-- (admin)/           # Akun, fasilitas dan rekap admin
|   |   |-- account/           # Status akun yang belum aktif
|   |   |-- portal/            # Pengarah portal sesuai peran
|   |   `-- api/               # Auth proxy, CSV admin dan health
|   |-- components/            # UI dan fitur portal yang digunakan ulang
|   |   `-- ui/                # Primitif tombol, dialog, sidebar, dll.
|   |-- hooks/                 # Hook interaksi antarmuka
|   `-- lib/                   # Auth, data hooks, slot, CSV, docs, demo
|-- convex/                    # Backend realtime, database dan storage
|   |-- schema.ts              # Tabel, relasi dan index domain
|   |-- auth.ts / http.ts      # Better Auth dan endpoint HTTP
|   |-- reservations.ts        # Booking, perubahan jadwal, approval
|   |-- reports.ts             # Laporan dan transisi penanganan
|   |-- facilities.ts          # Katalog, ketersediaan dan arsip
|   |-- maintenance.ts         # Pekerjaan dengan rentang jadwal
|   |-- emergencyClosures.ts   # Penutupan langsung dan pembukaan
|   |-- facilityIssues.ts      # Gangguan yang masih aman dipakai
|   |-- notifications.ts       # Riwayat notifikasi milik pengguna
|   |-- lib/                   # Otorisasi dan aturan bersama
|   `-- _generated/            # Binding/type hasil Convex codegen
|-- docs/                      # Panduan, UAT, ADR, runbook dan laporan
|-- public/                    # Aset publik; docs-assets/ untuk bukti
|-- tests/                     # Unit test; e2e/ dan onlineTest/ browser
|-- .github/workflows/         # CI untuk pemeriksaan kualitas
|-- .env.example               # Template env, tanpa secret asli
|-- package.json               # Dependency dan perintah pnpm
`-- pnpm-lock.yaml             # Versi dependency terkunci
```

Validasi dan otorisasi final berada di convex/, bukan hanya form frontend. Folder _generated/ dibuat Convex dan tidak diedit manual. Unit test backend juga berada di convex/*.test.ts. node_modules/, .next/, test-results/, serta file environment lokal merupakan hasil instalasi/build atau konfigurasi pribadi, bukan sumber aplikasi.

## Route ownership

| Area                | URL                                             | Owner     |
| ------------------- | ----------------------------------------------- | --------- |
| Public              | `/`, `/facilities`, `/tentang`                  | Anggota 2 |
| Auth/user           | `/login`, `/register`, `/app/**`                | Anggota 3 |
| Staff/admin         | `/staff/**`, `/admin/**`                        | Anggota 4 |
| Backend/integration | `convex/**`, `src/app/api/**`, `src/lib/auth-*` | Tech Lead |

## Invariants

1. Seluruh Convex function mendeklarasikan validator argumen dan return value.
2. Query operasional memakai index; public availability hanya mengirim waktu yang terblokir.
3. Hanya reservasi `approved` yang memblokir slot. Approval membaca slot yang sama dalam mutation atomik sehingga concurrent approval akan conflict/retry.
4. Reservasi hanya dapat disetujui ketika fasilitas masih berstatus `active`.
5. Laporan mengikuti lifecycle `pending → in_progress → resolved`, dengan penolakan hanya dari status nonterminal.
6. Waktu disimpan sebagai Unix milliseconds dan divalidasi terhadap 07.00–20.00 WIB, satu hari, kelipatan 30 menit; pengajuan baru minimal 48 jam sebelum mulai.
7. Foto maksimum 5 MB dan hanya JPEG, PNG, atau WebP; signed URL dibuat setelah authorization.
8. Data historis tidak dihapus secara destruktif. Akun/fasilitas dinonaktifkan dan aksi penting masuk `auditEvents`.

## Keputusan pekerjaan dan transaksi

```mermaid
flowchart TD
  A[Mulai tangani] --> B{Dampak pekerjaan}
  B -->|Masih bisa digunakan| C[Gangguan publik + notifikasi]
  C --> D[Booking tetap berlaku]
  B -->|Harus ditutup| E[Penutupan keselamatan sekarang]
  E --> F[Batalkan booking dan proposal terdampak]
  F --> G[Notifikasi + audit]
  G --> H[Catatan selesai + konfirmasi aman]
  H --> I{Masih ada laporan menutup?}
  I -->|Ya| E
  I -->|Tidak| J[Buka closure penanganan]
  J --> K[Booking lama tidak dipulihkan]
```

Laporan, issue/closure, pembatalan, notifikasi, dan audit disimpan dalam satu mutation atomik. Preview UI read-only; transaksi memeriksa ulang keadaan terbaru. Closure manual tidak ikut dibuka oleh completion laporan. [ERD](./DATA-AND-API.md), [aturan](./BUSINESS-RULES.md), dan [ADR-0004](./adr/0004-reservation-and-handling-policy.md) menjelaskan detail.

## Deployment

- Source of truth: `ZaidaanArd/ProjectPPK`.
- `myudak/Sthana-ProjectPPK` hanya mirror deployment.
- Next.js dapat dideploy di Vercel; production memakai deployment Convex production yang terpisah dari development.
- Jangan menjalankan `convex deploy` dari branch fitur sebelum review dan environment production siap.
