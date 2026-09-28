# Deployment / Operations Runbook

Production frontend: https://sthana.myudak.com. Source of truth: ZaidaanArd/ProjectPPK; myudak/Sthana-ProjectPPK adalah mirror sumber Vercel. Backend production memakai deployment Convex terpisah dari development. Perintah di bawah adalah prosedur, **bukan** bukti bahwa deployment telah dilakukan.

## Menjalankan lokal

Gunakan Node.js 24 dan pnpm 11.3.0; salin nama variabel dari [contoh env](../.env.example) tanpa meng-commit nilainya.

    pnpm install --frozen-lockfile
    pnpm dev:backend

Di terminal lain jalankan pnpm dev, lalu buka http://localhost:3000/api/health. Untuk demo tanpa backend, set NEXT_PUBLIC_DATA_MODE=static di .env.local dan jalankan pnpm dev; data demo berada di browser. Production harus memakai mode dynamic.

## Environment dan akses

| Lokasi            | Variabel / tanggung jawab                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Frontend Vercel   | NEXT_PUBLIC_DATA_MODE=dynamic, NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_CONVEX_SITE_URL, NEXT_PUBLIC_SITE_URL, SITE_URL |
| Convex production | BETTER_AUTH_SECRET, SITE_URL, BOOTSTRAP_SECRET; AUTH_PREVIEW_ORIGIN hanya bila preview QA diperlukan               |
| Convex opsional   | PENDING_SESSION_GATE: default aktif; nilai false hanya untuk rollout kompatibilitas sementara                      |

Pastikan origin dan deployment frontend/backend cocok. Jangan mencetak secret dalam log, issue, atau dokumen. Akses deploy hanya untuk anggota yang ditunjuk.

## Urutan rilis

1. Catat SHA sumber dan mirror, deployment Convex target, serta deployment Vercel sebelumnya. Pastikan perubahan telah direview dan CI pada SHA final hijau.
2. Jalankan pnpm test, pnpm lint, pnpm typecheck, dan satu pnpm build pada hasil integrasi; jalankan Playwright terarah di lingkungan QA. Bila gagal, hentikan rilis.
3. Periksa konfigurasi Convex dengan pnpm exec convex deploy --dry-run. Verifikasi target benar; pnpm exec convex deploy **mengubah deployment production**, jadi jalankan hanya setelah review dan persetujuan rilis. Deploy backend kompatibel lebih dahulu bila kontrak backend berubah.
4. Uji preview frontend terhadap backend yang dimaksud. Pastikan auth, reservasi, laporan, dan ekspor CSV sesuai [UAT](./UAT.md).
5. Fast-forward mirror deployment ke SHA yang sama sesuai proses tim, lalu tunggu Vercel production siap. Jangan force-push. Cek /api/health, /, /facilities, /login, dan portal tiap peran dengan akun QA; jangan memakai data pengguna nyata untuk mutasi uji.
6. Catat SHA, waktu, pelaksana, hasil smoke, dan rollback target di [changelog](./CHANGELOG.md) atau catatan rilis. Jika PENDING_SESSION_GATE sempat false, aktifkan kembali setelah frontend kompatibel terpasang.

## Saat ada insiden

1. Catat waktu, URL, peran akun, request gagal, deployment SHA, dan dampak. Cek status Vercel dan Convex serta log yang relevan; jangan menyalin token/session atau password.
2. Pisahkan masalah frontend, auth/Convex, dan data. /api/health hanya memastikan route Next.js hidup; respons 200 tidak membuktikan database atau Better Auth sehat.
3. Bila hanya frontend rusak, gunakan deployment Vercel sebelumnya yang masih kompatibel dengan backend. Bila backend rusak, hentikan mutasi berisiko dan deploy ulang revisi Convex yang kompatibel setelah memeriksa schema/data; jangan mengasumsikan rollback kode mengembalikan data.
4. Verifikasi ulang login, isolasi peran, satu reservasi, satu laporan, dan CSV admin. Simpan catatan insiden, akar masalah, dan langkah pencegahan.

## Data dan perawatan

Fasilitas contoh berasal dari seed yang idempotent; jalankan hanya pada deployment yang dimaksud. Bootstrap admin pertama memerlukan BOOTSTRAP_SECRET dan berhenti setelah admin tersedia. Hindari menjalankan perapian atau seed pada production tanpa pratinjau dampak dan persetujuan. Tidak ada job backup/restore aplikasi yang didefinisikan di repository ini; periksa kemampuan backup Convex dan kebijakan tim sebelum mengandalkan pemulihan data.
