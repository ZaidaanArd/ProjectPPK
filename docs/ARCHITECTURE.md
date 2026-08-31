# Arsitektur RuangKampus

## Struktur workspace

```text
apps/
  web/
    public/                 aset statis
    src/app/                router, provider, layout
    src/config/             konfigurasi frontend
    src/views/              public/auth/user/staff/admin
  api/
    src/app/controllers/    translasi HTTP
    src/app/services/       aturan bisnis dan guard
    src/app/models/         schema, koneksi, session store
    src/app/routes/         registrasi endpoint
    src/config/             environment tervalidasi
packages/
  contracts/                schema Zod + type client/server
  ui/                       komponen shadcn + design tokens
```

Struktur ini memetakan ketentuan tugas `/public`, `/app (model/controller)`, `/views`, dan `/config` tanpa mencampur frontend dengan koneksi database.

## Aliran data

```text
React view
  → TanStack Query/API client
  → Fastify route
  → validasi Zod di server
  → controller/service
  → Drizzle ORM
  → PostgreSQL
```

Validasi di client membantu UX, tetapi server selalu memvalidasi ulang. Type dan schema umum tinggal di `@workspace/contracts`; model database hanya tinggal di API.

## Autentikasi

- Browser menerima cookie `ppk.sid` yang `HttpOnly`, `SameSite=Lax`, dan `Secure` di production.
- Isi session disimpan pada tabel `sessions`, bukan di browser.
- Request mutasi `/api/*` harus berasal dari `WEB_ORIGIN`.
- `ProtectedLayout` mengatur redirect UI; Fastify role guard tetap menjadi sumber otorisasi utama.
- Registrasi mandiri nantinya menghasilkan akun `pending`; hanya akun `active` dapat login.

## Reservasi

- Waktu disimpan sebagai UTC dan ditampilkan dalam `Asia/Jakarta`.
- Rentang harus berada pada 07.00–20.00 WIB, pada hari yang sama, dan tepat pada slot 30 menit.
- Reservasi `pending` boleh beririsan.
- Saat approval, service wajib memakai transaksi database.
- Constraint PostgreSQL `reservations_no_approved_overlap` menjadi lapisan terakhir untuk mencegah race condition pada approval bersamaan.

## Kontrak API scaffold

- `GET /health` — status service dan request ID.
- `GET /api/v1/auth/session` — `{ user: UserSession | null }`.
- Error envelope — `{ code, message, fieldErrors?, requestId }`.

Namespace berikut sudah dicadangkan untuk milestone fitur: `/api/v1/auth`, `/facilities`, `/reservations`, `/reports`, `/staff`, dan `/admin`.
