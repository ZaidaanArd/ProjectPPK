# Playwright

Tes browser berada di folder ini. Secara default, tes membuka `https://sthana.myudak.com`.

```bash
pnpm install
pnpm exec playwright install chromium
pnpm test:e2e:record
```

Perintah `test:e2e:record` membuka situs dan Playwright Inspector. Klik alur yang ingin diperiksa, lalu salin kode yang direkam ke file `*.spec.ts` di folder ini. Gunakan nama atau label elemen untuk locator agar tes tetap mudah dirawat.

- `pnpm test:e2e` menjalankan tes browser.
- `pnpm exec playwright test tests/onlineTest/online1.test.ts --headed` menjalankan satu tes di browser terlihat.
- `pnpm test:e2e:ui` membuka antarmuka untuk menjalankan dan melihat langkah tes.
- `user-stories.spec.ts` berisi satu tes per user story (US-01–US-17) untuk demo statis lokal. Dengan `PLAYWRIGHT_SAVE_VIDEOS=1`, setiap tes direkam ke `docs/videos/US-XX.webm`; lihat [daftar video](../../docs/videos/README.md).
- Untuk menguji server lokal di PowerShell: `$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"; pnpm test:e2e`.
- Untuk merekam di server lokal: `pnpm exec playwright codegen http://localhost:3000`.
- Untuk merekam halaman login production: `pnpm exec playwright codegen https://sthana.myudak.com/login`.

Situs default adalah production. Klik yang membuat reservasi, laporan, atau akun akan mengubah data sungguhan. Rekam alur semacam itu di lingkungan development dengan akun khusus tes. File sesi login yang diekspor dari Playwright tidak boleh di-commit.
