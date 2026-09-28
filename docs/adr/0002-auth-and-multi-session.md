# ADR-0002: Better Auth, profil, dan multi-session

Tanggal: 27 September 2026

Status: Accepted (mendokumentasikan implementasi saat ini)

## Konteks

Empat jenis akses membutuhkan identitas, pendaftaran dengan persetujuan admin, dan pergantian beberapa akun pada browser yang sama tanpa mencampur data portal.

## Keputusan

Better Auth mengelola user/credential/session melalui komponen Convex. Tabel profiles aplikasi menyimpan peran dan status. Pendaftaran mandiri membuat profil pending; pembuatan sesi baru ditolak sampai profil active. Plugin Multi Session membatasi lima akun per browser. Setelah login/switch, navigasi dokumen penuh ke /portal membaca ulang cookie dan token sebelum menampilkan data.

## Konsekuensi

Pemeriksaan peran di layout dan function Convex tetap diperlukan. Session lama sebelum plugin mungkin perlu login ulang sekali agar dapat di-switch. Integrasi Better Auth–Convex dan perubahan plugin memerlukan uji end-to-end pada deployment target; test unit saja tidak cukup. Akun pending/ditolak/nonaktif tidak boleh menjadi sesi aktif baru ketika gate diaktifkan.

Rujukan kode: convex/auth.ts, convex/profiles.ts, convex/lib/authz.ts, src/lib/device-accounts.ts, src/app/portal/page.tsx.
