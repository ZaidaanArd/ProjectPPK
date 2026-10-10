# Test Report

## Snapshot lokal — 11 Oktober 2026

Basis checkout: `c3e5cb0` + perubahan kebijakan waktu, penanganan, dan dokumentasi lokal. Perubahan konfigurasi/video lain tidak termasuk pekerjaan ini. Hasil berikut **bukan** bukti deployment production atau penerimaan UAT.

Kode aplikasi/test yang diuji: `46d1945` (commit dokumentasi menyusul). Remote `origin/main` tetap `c3e5cb0`; tidak ada push/deploy.

| Pemeriksaan                  | Hasil                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Vitest                       | **Lulus:** 23 file, 112 test                                                                           |
| Playwright terarah           | **Lulus:** 11 skenario lokal: 10 pada run awal, EC-27 lulus pada retest setelah perbaikan trigger/menu |
| Capture dokumentasi          | **Lulus:** ulang EC-13/15/17 dan capture diagram/UI; screenshot dari demo lokal                        |
| Lint dan typecheck           | **Lulus:** Oxc, ESLint Convex, TypeScript                                                              |
| Format hasil integrasi       | **Lulus:** 57 file hasil integrasi sesuai Oxfmt                                                        |
| Build final                  | **Lulus:** satu build dynamic, 53 halaman; publik dan docs tetap statis                                |
| Browser dinamis / production | **Belum diverifikasi pada perubahan ini**                                                              |
| UAT dan sign-off             | **Belum disetujui**                                                                                    |

Test lokal mencakup tepat/kurang 48 jam, retry identik setelah cutoff, expiry sebelum cron, approval/rescheduling, gangguan untuk pemohon baru, penutupan booking yang sedang berjalan, dua laporan closed pada satu ruang, closure manual, konfirmasi aman, pagination owner, arsip historis, demo expiry, auth, dan CSV. Convex-test memeriksa mutation/otorisasi dalam fixture; bukan cookie Better Auth atau race dua perangkat nyata.

Build masih memberi peringatan `metadataBase` pada beberapa route yang sudah ada (fallback URL localhost); kompilasi dan prerender berhasil. Ini bukan bukti konfigurasi SEO deployment production. Halaman `/`, `/facilities`, `/tentang`, `/docs`, dan seluruh slug docs tetap statis/SSG. Ada dua eksekusi build: integrasi awal, lalu verifikasi final setelah review menemukan celah eskalasi long repair ke keselamatan; tidak ada build berulang per perubahan kecil.

Browser terarah mencakup US-09/10/11/12/16/17, EC-03 (slot <48 jam), EC-13/15/17 (dialog dampak dan safety completion), EC-27 (riwayat notifikasi), dan dokumentasi/diagram. Pemeriksaan visual manual menggunakan browser bawaan Codex. Pengujian demo hanya berjalan dengan `PLAYWRIGHT_STATIC_MODE=1` dan URL localhost; test registrasi pending terpisah memerlukan Convex development.

## Cara mengulang secara aman

    pnpm install --frozen-lockfile
    pnpm test

Untuk browser demo statis, jalankan server lokal dengan NEXT_PUBLIC_DATA_MODE=static, lalu di PowerShell:

    $env:PLAYWRIGHT_BASE_URL = "http://localhost:3000"
    $env:PLAYWRIGHT_STATIC_MODE = "1"
    pnpm exec playwright test tests/e2e/core-stories.spec.ts tests/e2e/edge-cases.spec.ts --grep "US-09|US-10|US-11|US-12|US-16|US-17|EC-"

Set `PLAYWRIGHT_DOC_SCREENSHOTS=1` untuk capture opsional diagram dan UI di `public/docs-assets`; gambar tidak memakai akun production. Test capture tambahan: `tests/e2e/edge-cases.spec.ts --grep "documentation screenshots"`.

`tests/e2e/user-stories.spec.ts` berisi satu walkthrough untuk setiap US-01–US-17. Tambahkan `PLAYWRIGHT_SAVE_VIDEOS=1` untuk merekam ulang video di [docs/videos](./videos/README.md).

Untuk registrasi pending, gunakan frontend localhost yang terhubung **hanya** ke Convex development, tanpa PLAYWRIGHT_STATIC_MODE, lalu jalankan tests/e2e/auth-pending.spec.ts. Jangan arahkan test yang membuat akun/data ke production. Konfigurasi lengkap: [panduan Playwright](../tests/e2e/README.md).

## Gap sebelum klaim rilis

Belum ada hasil UAT untuk US-01–US-17 pada deployment target untuk revisi ini. Persetujuan admin, dua akun beda peran, refresh/switch/logout, isolasi Convex, cron/reconnect, race dua perangkat, dan CSV production tetap perlu browser dinamis development/preview. Catat commit frontend/backend, deployment, tanggal, penguji, hasil aktual, dan sign-off di [UAT](./UAT.md). Tidak ada push, deploy, atau perubahan sheet QA pada pekerjaan lokal ini.
