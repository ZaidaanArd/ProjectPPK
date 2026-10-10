# ADR-0004 — Batas 48 jam dan dampak penanganan

Tanggal: 11 Oktober 2026. Status: diterima untuk implementasi lokal; belum dirilis.

## Konteks

“H−2” ambigu jika dihitung sebagai dua tanggal kalender. “Mulai tangani” juga belum memastikan apakah ruang aman dipakai: perbaikan kecil tidak semestinya membatalkan booking, sedangkan kerusakan berbahaya tidak boleh menunggu slot kosong.

## Keputusan

1. Pengajuan baru membutuhkan selisih mulai−waktu server ≥48 jam. Helper kebijakan murni dipakai UI/demo dan validator Convex; tepat batas diterima.
2. Petugas memilih usable/closed saat pekerjaan mulai, dengan keterangan publik terpisah dari laporan privat.
3. Usable membuat gangguan; tidak mengunci booking, notifikasi berdasarkan overlap per reservasi.
4. Closed membuat penutupan keselamatan sekarang, membatalkan booking/proposal terdampak secara atomik. Estimasi tidak auto-open.
5. Completion perlu catatan dan konfirmasi aman; hanya closure berasal dari penanganan dibuka setelah laporan closed terakhir selesai. Closure manual memakai reopen tersendiri.
6. Histori booking tidak dihapus/dihidupkan ulang. Fasilitas diarsipkan. Pagination notifikasi menjaga pesan lama tetap dapat diakses.

## Alternatif yang ditolak

- Menutup setiap perbaikan kecil: terlalu mengganggu kegiatan yang masih aman.
- Menganggap pending sudah booked: memberi jaminan sebelum keputusan petugas dan menghambat pengajuan alternatif.
- Membuka otomatis pada estimasi selesai: estimasi tidak membuktikan keselamatan.
- Menghapus fasilitas beserta histori: merusak rekap dan audit.

## Konsekuensi

Mutation report mengubah laporan, issue/closure, booking, audit, dan notifikasi dalam satu transaksi Convex. UI menyediakan preview dampak tetapi server menghitung ulang saat submit. Field mode/source baru opsional untuk data lama. Old client yang tidak mengirim handlingImpact ditolak saat memulai; frontend/backend harus dirilis kompatibel.

Scheduled maintenance terencana tetap berbasis rentang waktu, bukan closure pekerjaan berbahaya. Kebijakan 48 jam untuk rescheduling belum disepakati dan tidak diperluas diam-diam. Mode statis meniru perilaku, bukan jaminan transaksi lintas browser.

## Verifikasi

[Matriks edge case](../EDGE-CASES.md), `convex/edgeCases.test.ts`, `tests/reservation-policy.test.ts`, dan [Test Report](../TEST-REPORT.md). UAT produksi tetap terpisah.
