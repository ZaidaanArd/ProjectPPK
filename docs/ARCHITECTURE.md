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

## Route ownership

| Area | URL | Owner |
| --- | --- | --- |
| Public | `/`, `/facilities`, `/tentang` | Anggota 2 |
| Auth/user | `/login`, `/register`, `/app/**` | Anggota 3 |
| Staff/admin | `/staff/**`, `/admin/**` | Anggota 4 |
| Backend/integration | `convex/**`, `src/app/api/**`, `src/lib/auth-*` | Tech Lead |

## Invariants

1. Seluruh Convex function mendeklarasikan validator argumen dan return value.
2. Query operasional memakai index; public availability hanya mengirim waktu yang terblokir.
3. Hanya reservasi `approved` yang memblokir slot. Approval membaca slot yang sama dalam mutation atomik sehingga concurrent approval akan conflict/retry.
4. Waktu disimpan sebagai Unix milliseconds dan divalidasi terhadap 07.00–20.00 WIB, satu hari, kelipatan 30 menit.
5. Foto maksimum 5 MB dan hanya JPEG, PNG, atau WebP; signed URL dibuat setelah authorization.
6. Data historis tidak dihapus secara destruktif. Akun/fasilitas dinonaktifkan dan aksi penting masuk `auditEvents`.

## Deployment

- Source of truth: `ZaidaanArd/ProjectPPK`.
- `myudak/Sthana-ProjectPPK` hanya mirror deployment.
- Next.js dapat dideploy di Vercel; production memakai deployment Convex production yang terpisah dari development.
- Jangan menjalankan `convex deploy` dari branch fitur sebelum review dan environment production siap.
