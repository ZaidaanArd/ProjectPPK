# Panduan Kontribusi

## Branch dan commit

- Gunakan branch pendek: `feat/public-facilities`, `feat/user-reservation-form`, `feat/staff-queue`.
- Format commit: `type(scope): ringkasan`, misalnya `feat(user): add reservation form shell`.
- Satu commit berisi satu tujuan yang bisa direview.
- Jangan commit `.env`, password, hasil build, atau `node_modules`.

## Sebelum membuka PR

```bash
pnpm format
pnpm check
```

PR wajib berisi ringkasan, area ownership, cara pengujian, dan screenshot bila mengubah UI. Minimal satu anggota lain mereview sebelum merge.

## Perubahan database

1. Ubah `apps/api/src/app/models/schema.ts`.
2. Jalankan `pnpm db:generate`.
3. Review SQL yang dihasilkan.
4. Jalankan `pnpm db:migrate` pada database lokal kosong dan berisi data.

Migration yang sudah dibagikan tidak boleh diedit sembarangan; buat migration baru untuk perubahan berikutnya.
