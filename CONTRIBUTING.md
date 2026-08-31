# Panduan Kontribusi

## Branch dan commit

- Gunakan branch pendek: `feat/public-facilities`, `feat/user-reservation-form`, atau `feat/staff-queue`.
- Format commit: `type(scope): ringkasan`, misalnya `feat(user): add reservation form shell`.
- Satu commit berisi satu tujuan yang bisa direview.
- Jangan commit `.env`, password, hasil build, atau `node_modules`.

## Sebelum membuka PR

```bash
pnpm format
pnpm check
pnpm test:e2e
```

PR wajib berisi ringkasan, area ownership, cara pengujian, dan screenshot bila mengubah UI. Minimal satu anggota lain mereview sebelum merge.

## Server dan REST

- Module database/auth hanya boleh berada di `apps/web/src/server` dan wajib tetap server-only pada runtime.
- Server Components membaca data melalui DAL/service, bukan melakukan fetch ke API sendiri.
- Route Handler menerima input eksternal: validasi Zod, session, role, dan origin harus dilakukan di dalam handler/service.
- Jangan mengirim hash password, session data mentah, atau kolom internal lain ke Client Components.

## Perubahan database

1. Ubah `apps/web/src/server/db/schema.ts`.
2. Jalankan `pnpm db:generate`.
3. Review SQL yang dihasilkan.
4. Jalankan `pnpm db:migrate` pada database lokal kosong dan berisi data.
5. Jalankan `pnpm db:seed` untuk memverifikasi seed tetap idempotent.

Migration yang sudah dibagikan tidak boleh diedit sembarangan; buat migration baru untuk perubahan berikutnya.
