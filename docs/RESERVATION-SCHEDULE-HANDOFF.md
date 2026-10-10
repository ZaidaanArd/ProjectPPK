# Reservasi & jadwal — handoff Zufar

## Kontrak perilaku

| Kondisi                                               | Tampilan                          | Boleh diajukan?                          |
| ----------------------------------------------------- | --------------------------------- | ---------------------------------------- |
| Jam mulai sudah lewat atau sama dengan sekarang (WIB) | Abu-abu, nonaktif                 | Tidak                                    |
| Ada pengajuan pending                                 | Kuning, “Ada pengajuan”           | Ya, belum ada jaminan slot               |
| Reservasi approved                                    | Terisi                            | Tidak, interval bersebelahan tetap boleh |
| Perbaikan terjadwal                                   | Terkunci untuk interval perbaikan | Tidak di interval itu                    |
| Fasilitas ditutup/nonaktif                            | Terkunci                          | Tidak                                    |

Jam operasional 07.00–20.00 WIB, interval 30 menit. Batas awal inklusif,
batas akhir eksklusif untuk bentrok. Clock UI diperbarui dan disegarkan saat
tab kembali aktif; mutation server tetap sumber keputusan akhir.

Pending kedaluwarsa **pada waktu mulai**, bukan berdasarkan umur pengajuan.
`expired` tersimpan untuk permintaan baru melalui scheduled mutation idempotent.
Pending lama juga ditampilkan expired dan tidak bisa disetujui walaupun job
belum berjalan. Approved yang berakhir ditampilkan **Selesai**, tetapi tetap
`approved` di database agar statistik/CSV pemakaian tidak kehilangan riwayat.

## Perubahan jadwal

- Hanya pemilik reservasi approved yang belum mulai, pada fasilitas yang sama.
- Satu permintaan pending per reservasi. Alasan wajib.
- Snapshot waktu lama disimpan dalam `reservationChanges`; jadwal lama tetap
  mengunci slot. Target baru adalah informasi pending, bukan booking.
- Petugas/admin menyetujui atau menolak dari Antrean reservasi. Penolakan wajib
  alasan. Persetujuan memvalidasi ulang status, snapshot, waktu, fasilitas,
  perbaikan dan konflik dalam satu mutation; conflict mengabaikan hanya
  reservasi asal, bukan reservasi orang lain.
- Jadwal asal hanya diganti setelah persetujuan berhasil. Penolakan,
  pembatalan, expiry dan kegagalan tidak menghapus booking lama.
- Deadline perubahan adalah `min(waktu mulai lama, waktu mulai baru)`.
- Pembatalan reservasi asal membatalkan perubahan pending. Persetujuan booking
  lain menolak target perubahan yang bentrok tanpa membatalkan booking asal.
- Audit mencatat ID perubahan, snapshot lama/baru, alasan dan aktor.

## API dan koordinasi modul gangguan & notifikasi

`reservations.requestScheduleChange`, `listScheduleChanges`,
`decideScheduleChange`, `cancelScheduleChange` adalah API publik dengan role
dan ownership di server. `expire`, `expireScheduleChange`,
`previewExpiredPending` internal saja. API jadwal publik hanya mengembalikan
rentang pending, tidak nama/email/purpose/ID pemohon.

Schema tambahan: `reservations.status` menerima `expired`;
`reservationChanges` menyimpan usulan (indeks pemilik, reservasi/status,
status, fasilitas/status/waktu). Modul gangguan memakai mutation ini untuk
perubahan jadwal, tidak mengubah timestamp approved ketika pengguna baru
mengirim permintaan. Event audit `reservation.change_*` tersedia sebagai
titik integrasi notifikasi; notifikasi/emergency closure bukan scope ini.

Penanganan laporan yang menutup fasilitas harus dipakai sebagai status efektif
dalam pengecekan create/approve/perubahan jadwal, tanpa auto-open berdasarkan
estimasi. Jangan menimpa status fasilitas atau menghapus booking approved
hanya karena ada laporan gangguan.

## Verifikasi lokal

```sh
pnpm exec vitest run convex/reservations.test.ts tests/reservation-slots.test.ts tests/reservation-state.test.ts tests/static-data.test.ts tests/status-steps.test.ts tests/csv.test.ts
```

Browser test lokal membutuhkan server `NEXT_PUBLIC_DATA_MODE=static`:

```powershell
$env:PLAYWRIGHT_STATIC_MODE='1'
$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'
pnpm exec playwright test tests/e2e/reservation-schedule.spec.ts --project=chromium
```

Test backend mencakup deadline, exact retry, dua pengajuan bersamaan,
ownership, privasi jadwal, penggantian jadwal, bentrok, pembatalan dan expiry.
Test Convex lokal tidak menggantikan smoke test terhadap deployment nyata.

## Rilis dan data lama

Belum push/deploy otomatis. Deploy hanya setelah frontend mengenali `expired`
dan API perubahan jadwal tersedia; lakukan smoke test akun pengguna/petugas
di preview. Tidak ada cron/bulk cleanup production yang dijalankan di task ini.

Pratinjau read-only (paginate sampai `nextCursor = null`):

```sh
pnpm exec convex run reservations:previewExpiredPending '{}'
```

Pastikan target deployment sebelum menjalankan CLI. Jangan menjalankan
`reconcilePendingConflicts` atau perapian historis production tanpa persetujuan
atas daftar ID terdampak. Scheduled expiry berlaku pada permintaan baru.

Mode demo menyimpan tambahan data dalam localStorage versi yang sama secara
additive; data browser lama tetap bisa dibaca. Demo bukan bukti produksi lulus.
