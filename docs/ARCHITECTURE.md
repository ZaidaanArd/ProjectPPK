# Arsitektur RuangKampus

## Struktur workspace

```text
apps/
  web/
    src/app/                 App Router pages, layouts, dan Route Handlers
    src/server/auth/         pembacaan dan validasi session
    src/server/db/           schema, database client, dan seed
    src/server/http/         REST response helpers
    drizzle/                 SQL migrations dan metadata
packages/
  contracts/                 schema Zod dan type lintas boundary
  ui/                        komponen shadcn dan design tokens
```

Route groups `(public)`, `(auth)`, `(user)`, `(staff)`, dan `(admin)` membagi ownership tanpa mengubah URL. Folder `src/server` menggantikan model/controller Fastify dan tidak boleh diimpor oleh Client Components.

## Aliran data

```text
Server Component → DAL/service → Drizzle → PostgreSQL
Client Component → Route Handler → validasi/service → Drizzle → PostgreSQL
```

Server Components tidak melakukan HTTP request ke Route Handlers milik aplikasi sendiri. Keduanya memakai DAL/service yang sama. Validasi client membantu UX, tetapi setiap endpoint mutasi wajib memvalidasi ulang input, session, dan role di server.

## Autentikasi

- Cookie `ppk.sid` berisi opaque session ID dan signature HMAC-SHA256.
- Isi session dan expiry tetap berada di tabel `sessions`.
- Cookie produksi wajib `HttpOnly`, `SameSite=Lax`, `Secure`, path `/`, dan maksimal tujuh hari.
- Layout protected memanggil `requireUser`; tidak ada session mengarah ke `/login`, role yang salah ke `/forbidden`.
- Setiap Route Handler sensitif tetap harus mengulangi pemeriksaan session/role.
- Registrasi dan login nyata belum termasuk scaffold ini.

## Reservasi

- Waktu disimpan dalam UTC dan ditampilkan sebagai `Asia/Jakarta`.
- Rentang harus berada pada 07.00–20.00 WIB, di hari yang sama, dan sejajar slot 30 menit.
- Reservasi `pending` boleh beririsan.
- Approval nantinya wajib memakai transaksi database.
- Constraint PostgreSQL `reservations_no_approved_overlap` mencegah race condition saat approval bersamaan.

## Kontrak REST scaffold

- `GET /health` — status runtime, versi, uptime, dan request ID.
- `GET /api/v1/auth/session` — `{ user: UserSession | null }`.
- Endpoint `/api/v1/*` yang belum tersedia — `{ code, message, requestId }` dengan status 404.
- Error lain memakai `{ code, message, fieldErrors?, requestId }`.

Namespace fitur berikut sudah dicadangkan: `/api/v1/auth`, `/facilities`, `/reservations`, `/reports`, `/staff`, dan `/admin`.
