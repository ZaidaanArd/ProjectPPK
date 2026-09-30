# Test Report

## Snapshot lokal — 27 September 2026

Basis checkout: HEAD 17f02f9. Working copy saat pengujian memiliki perubahan konfigurasi/video yang tidak terkait dan belum di-commit; hasil ini **bukan** bukti bahwa production atau commit bersih telah lulus.

| Pemeriksaan                           | Hasil                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| pnpm test                             | **Lulus:** 10 file, 35 test Vitest                                              |
| pnpm exec playwright test --list      | **Terdaftar:** 7 test dalam 4 file; ini hanya enumerasi, bukan eksekusi browser |
| Playwright lokal/production           | **Belum dijalankan pada snapshot ini**                                          |
| UAT manual dan persetujuan            | **Belum dijalankan/ditetapkan**                                                 |
| Oxfmt pada 17 file dokumentasi/README | **Lulus:** seluruh file sesuai format                                           |
| Build, lint, typecheck                | Tidak dijalankan untuk perubahan dokumentasi ini; tidak diklaim lulus           |

Test unit mencakup aturan waktu reservasi, workflow/status, data statis, CSV dan route ekspor, routing akun, sesi perangkat, onboarding, serta mutation reservasi/laporan Convex. Test browser yang tersedia mencakup smoke publik/login, registrasi pending lokal, dan US-09/10/11/12/17 pada demo statis lokal. Empat test core-story sengaja skip kecuali PLAYWRIGHT_STATIC_MODE=1 dan URL localhost; test registrasi pending juga mensyaratkan localhost dengan Convex development.

## Cara mengulang secara aman

    pnpm install --frozen-lockfile
    pnpm test
    pnpm exec playwright test --list

Untuk browser demo statis, jalankan server lokal dengan NEXT_PUBLIC_DATA_MODE=static, lalu di PowerShell:

    $env:PLAYWRIGHT_BASE_URL = "http://localhost:3000"
    $env:PLAYWRIGHT_STATIC_MODE = "1"
    pnpm exec playwright test tests/e2e/core-stories.spec.ts tests/e2e/user-stories.spec.ts

`tests/e2e/user-stories.spec.ts` berisi satu walkthrough untuk setiap US-01–US-17. Tambahkan `PLAYWRIGHT_SAVE_VIDEOS=1` untuk merekam ulang video di [docs/videos](./videos/README.md).

Untuk registrasi pending, gunakan frontend localhost yang terhubung **hanya** ke Convex development, tanpa PLAYWRIGHT_STATIC_MODE, lalu jalankan tests/e2e/auth-pending.spec.ts. Jangan arahkan test yang membuat akun/data ke production. Konfigurasi lengkap: [panduan Playwright](../tests/e2e/README.md).

## Gap sebelum klaim rilis

Belum ada hasil UAT untuk US-01–US-17 pada deployment target. Belum ada hasil browser end-to-end dinamis untuk persetujuan admin, dua akun beda peran, refresh/switch/logout, isolasi data Convex, atau rekap CSV production. Catat eksekusi tersebut di [UAT](./UAT.md), termasuk commit frontend/backend dan akun QA, sebelum menyebut rilis diterima.
