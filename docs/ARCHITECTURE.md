# Arsitektur RuangKampus

> Diagram dengan garis putus-putus atau label **planned** menggambarkan target implementasi, bukan fitur yang sudah tersedia.

## System context

```mermaid
flowchart LR
  visitor[Pengunjung]
  user[Pengguna]
  staff[Petugas]
  admin[Admin]
  app["RuangKampus<br/>Next.js App"]
  db[("PostgreSQL<br/>planned")]
  files["Photo Storage<br/>planned"]

  visitor --> app
  user --> app
  staff --> app
  admin --> app
  app -. planned .-> db
  app -. planned .-> files
```

Satu deployment Next.js menangani halaman dan backend Route Handlers. Tidak ada server API terpisah.

## Status arsitektur

| Area    | Sekarang                                 | Target                                           |
| ------- | ---------------------------------------- | ------------------------------------------------ |
| UI      | Placeholder routes dan primitives shadcn | UI responsive per aktor                          |
| Backend | `GET /api/health`                        | Route Handlers untuk auth dan fitur bisnis       |
| Data    | Belum ada database                       | PostgreSQL melalui data-access layer             |
| Auth    | Belum ada                                | Session server-side, cookie aman, dan role guard |
| File    | Belum ada                                | Upload foto laporan melalui storage terpilih     |
| Testing | Lint, typecheck, build                   | Unit, integration, dan browser test              |

## Struktur target

```text
src/
  app/
    (public)/          public pages
    (auth)/            authentication pages
    (user)/            user portal
    (staff)/           staff portal
    (admin)/           admin portal
    api/               external HTTP boundary
  components/
    ui/                shadcn primitives
    public/            planned public components
    user/              planned user components
    staff/             planned staff components
    admin/             planned admin components
  lib/                 shared schema, type, and helpers
  server/              planned server-only code
    auth/
    db/
    services/
```

Route groups membagi ownership tanpa muncul pada URL. Contoh: file di `(user)/app/reservations/page.tsx` tetap menghasilkan `/app/reservations`.

## Route map

```mermaid
flowchart TB
  root["Next.js App Router"]
  public["(public)<br/>Anggota 2"]
  auth["(auth)<br/>Anggota 3"]
  user["(user)<br/>Anggota 3"]
  staff["(staff)<br/>Anggota 4"]
  admin["(admin)<br/>Anggota 4"]
  api["api<br/>Tech Lead"]

  root --> public
  root --> auth
  root --> user
  root --> staff
  root --> admin
  root --> api

  public --> p1["/"]
  public --> p2["/facilities"]
  public --> p3["/forbidden"]
  auth --> a1["/login"]
  auth --> a2["/register"]
  user --> u1["/app"]
  user --> u2["/app/reservations"]
  user --> u3["/app/reports"]
  staff --> s1["/staff"]
  staff --> s2["/staff/reservations"]
  staff --> s3["/staff/reports"]
  admin --> m1["/admin"]
  admin --> m2["/admin/facilities"]
  admin --> m3["/admin/users"]
  api --> h1["/api/health"]
```

## Planned request flow

```mermaid
sequenceDiagram
  actor Browser
  participant Page as Server/Client Component
  participant API as Route Handler
  participant Service as Server Service
  participant DB as PostgreSQL

  Browser->>Page: Open page
  Page->>Service: Read data directly on server
  Service->>DB: Query
  DB-->>Service: Result
  Service-->>Page: Typed result
  Page-->>Browser: Render HTML

  Browser->>API: Submit mutation
  API->>API: Validate input, session, and role
  API->>Service: Execute use case
  Service->>DB: Transaction/query
  DB-->>Service: Result
  Service-->>API: Typed result
  API-->>Browser: JSON response
```

Server Components nantinya membaca service/data layer langsung. Mereka tidak memanggil Route Handler aplikasi sendiri melalui HTTP. Route Handler digunakan untuk input browser, mutasi, dan integrasi eksternal.

## Aturan arsitektur

1. Komponen client tidak boleh mengimpor modul dari `src/server`.
2. Route Handler hanya menangani HTTP, validasi boundary, dan pemetaan response; business rules berada di service.
3. Semua input eksternal divalidasi ulang di server meskipun sudah divalidasi di client.
4. Pemeriksaan session dan role dilakukan pada setiap operasi sensitif.
5. Mutasi reservasi/approval yang saling bergantung memakai transaksi database.
6. Type/schema bersama berada di `src/lib`; jangan menduplikasi status string di banyak fitur.
7. Gunakan Server Components secara default dan tambahkan `"use client"` hanya saat membutuhkan state, event, atau browser API.

## Dependency direction

```mermaid
flowchart LR
  pages[Pages and Components] --> contracts[Shared Schemas and Types]
  routes[Route Handlers] --> contracts
  pages --> services[Server Services]
  routes --> services
  services --> dal[Data Access]
  dal --> database[(PostgreSQL)]

  classDef planned stroke-dasharray: 5 5
  class services,dal,database planned
```

UI tidak mengakses database secara langsung. Data-access layer tidak mengimpor komponen atau kode HTTP.
