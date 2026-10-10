# Test Report

## Snapshot lokal — 11 Oktober 2026

Basis checkout: `c3e5cb0` + perubahan kebijakan waktu, penanganan, dan dokumentasi lokal. Perubahan konfigurasi/video lain tidak termasuk pekerjaan ini. Hasil berikut **bukan** bukti deployment production atau penerimaan UAT.

Kode aplikasi/test yang diuji lokal: `46d1945`. Rilis production berikutnya memakai `defd77d`, termasuk format hasil integrasi dan bindings Convex terbaru.

## Rilis dan smoke check production — 11 Oktober 2026

- Frontend `defd77df37257de21589223e066866c0d39e27ab`: Vercel deployment `dpl_D9aSsxisssWx4DrqAZx61H1aD4qP`, status **READY**, domain [sthana.myudak.com](https://sthana.myudak.com). CI GitHub [38086250146](https://github.com/ZaidaanArd/ProjectPPK/actions/runs/38086250146) berhasil.
- Convex production `decisive-shark-563`: dry-run memvalidasi schema tanpa menghapus index; deploy berhasil sebelum frontend. Tidak menjalankan seed/reset/cleanup pending.
- Login tiga peran aktif berhasil; tambah akun dan switch admin → pengguna kembali ke portal peran yang tepat. Header/footer publik menampilkan Buka portal.
- Form reservasi menampilkan aturan minimal 48 jam; form laporan dan preview dampak penanganan tersedia dari backend production. Tidak mengirim booking/laporan baru atau mengonfirmasi penutupan untuk screenshot.
- Rekap fasilitas CSV berhasil diunduh melalui portal admin; header mencakup fasilitas, lokasi, jumlah reservasi disetujui, menit penggunaan, dan jumlah laporan.
- `/api/health` merespons `ok`. Pemindaian log Vercel pada jendela smoke check tidak mengembalikan log error; ini bukan jaminan tidak ada error di seluruh periode.
- Screenshot UI production tersimpan terpisah di `public/docs-assets/*-production.png`; diagram mengikuti schema/aturan kode. Bukti lokal di bawah tetap dibedakan dari smoke check production. **UAT belum disetujui.**

## Hasil verifikasi lokal sebelum rilis

| Pemeriksaan                  | Hasil                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Vitest                       | **Lulus:** 23 file, 112 test                                                                           |
| Playwright terarah           | **Lulus:** 11 skenario lokal: 10 pada run awal, EC-27 lulus pada retest setelah perbaikan trigger/menu |
| Capture dokumentasi          | **Lulus:** ulang EC-13/15/17 dan capture diagram/UI; screenshot dari demo lokal                        |
| Lint dan typecheck           | **Lulus:** Oxc, ESLint Convex, TypeScript                                                              |
| Format hasil integrasi       | **Lulus:** 57 file hasil integrasi sesuai Oxfmt                                                        |
| Build final                  | **Lulus:** satu build dynamic, 53 halaman; publik dan docs tetap statis                                |
| Browser dinamis / production | Smoke check terbatas; lihat bagian rilis production di atas                                            |
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

Set `PLAYWRIGHT_DOC_SCREENSHOTS=1` untuk capture opsional diagram dan UI di `test-results/docs-demo`; gambar tidak memakai akun production dan tidak menimpa gambar laporan production. Test capture tambahan: `tests/e2e/edge-cases.spec.ts --grep "documentation screenshots"`.

`tests/e2e/user-stories.spec.ts` berisi satu walkthrough untuk setiap US-01–US-17. Tambahkan `PLAYWRIGHT_SAVE_VIDEOS=1` untuk merekam ulang video di [docs/videos](./videos/README.md).

Untuk registrasi pending, gunakan frontend localhost yang terhubung **hanya** ke Convex development, tanpa PLAYWRIGHT_STATIC_MODE, lalu jalankan tests/e2e/auth-pending.spec.ts. Jangan arahkan test yang membuat akun/data ke production. Konfigurasi lengkap: [panduan Playwright](../tests/e2e/README.md).

## Gap sebelum penerimaan UAT

Smoke check production di atas tidak menggantikan UAT US-01–US-17. Registrasi pending/persetujuan admin, logout satu/semua, isolasi data adversarial, cron/reconnect, race dua perangkat, dan seluruh transisi mutasi tetap perlu regresi dinamis terarah. Catat penguji, hasil aktual, dan sign-off di [UAT](./UAT.md). Sheet QA tidak diubah.
