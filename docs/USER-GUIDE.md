# Panduan pengguna Sthana Kampus

Aturan rinci: [Aturan bisnis dan asumsi](./BUSINESS-RULES.md).

Pengajuan baru harus minimal **48 jam sebelum mulai**. Slot lebih dekat atau sudah lewat dinonaktifkan. “Ada pengajuan” belum berarti terpesan; hanya Disetujui yang menjamin jadwal, selama fasilitas tidak ditutup karena keselamatan.

Saat petugas klik **Mulai tangani**, pilih **Masih bisa digunakan** (gangguan dan notifikasi, booking tetap) atau **Harus ditutup** (penutupan langsung dan pembatalan terdampak). Isi keterangan publik tanpa identitas pelapor. Preview menunjukkan dampak; server menghitung ulang saat konfirmasi. Untuk penanganan tertutup, selesai/tolak wajib catatan dan centang aman; closure manual tetap memerlukan pembukaan terpisah. Estimasi bukan auto-open, dan booking batal tidak dipulihkan.

Pengguna dapat membuka riwayat lewat lonceng → **Semua notifikasi**, lalu mengikuti tautan reservasi. Perubahan jadwal perlu persetujuan; jadwal lama tetap berlaku sampai disetujui.

Situs: https://sthana.myudak.com. Versi yang berjalan dapat berbeda dari checkout lokal; bila tampilan atau alurnya berbeda, catat URL, waktu, dan langkah reproduksi.

## Pengunjung

1. Buka beranda atau [daftar fasilitas](/facilities).
2. Cari fasilitas menurut nama/lokasi dan periksa status serta slotnya. Informasi pemohon reservasi tidak ditampilkan untuk publik.
3. Pilih **Buka portal** untuk masuk. Jika belum memiliki akun pengguna, pilih **Daftar akun**.

## Daftar dan masuk

Siapa pun dari civitas kampus dapat mendaftar sendiri cukup dengan nama, email, dan password minimal delapan karakter; tidak perlu memilih mahasiswa/dosen atau mengisi NIM/NIP. Pendaftaran baru menunggu persetujuan admin dan tidak langsung membuat sesi login. Akun petugas dibuat oleh admin. Setelah disetujui, masuk di /login; /portal mengarahkan ke dashboard sesuai peran. Bila ditolak atau dinonaktifkan, hubungi administrator.

## Pengguna

- **Reservasi:** buka **Reservasi → Ajukan reservasi**, pilih fasilitas, tanggal, jam mulai/selesai, dan isi tujuan. Slot operasional adalah 07.00–20.00 WIB dalam kelipatan 30 menit. Pengajuan berstatus **Menunggu** sampai diputuskan petugas. Lihat status di **Reservasi saya**. Reservasi milik sendiri dapat dibatalkan paling lambat satu jam sebelum mulai.
- **Laporan:** buka **Laporan → Buat laporan**, pilih fasilitas, kategori, deskripsi, dan bila perlu foto JPEG/PNG/WebP maksimal 5 MB. Pantau status di **Laporan saya**.
- **Akun:** menu profil menyediakan **Ganti password**, **Tambah akun**, perpindahan akun, **Keluar** dari akun tertentu, dan **Keluar semua akun**. Maksimal lima akun tersimpan di browser. Perpindahan akun memuat ulang portal agar data akun sebelumnya tidak tetap tampil.

## Petugas

- Di **Reservasi**, tinjau antrean lalu setujui atau tolak pengajuan. Persetujuan ditolak server bila fasilitas tidak aktif atau slot sudah dipakai reservasi disetujui. Pembatalan darurat memerlukan alasan.
- Di **Laporan**, mulai penanganan dengan dampak dan keterangan publik; catatan hasil boleh kosong ketika baru mulai. **Harus ditutup** menutup langsung sampai aman, bukan menunggu slot kosong. Penyelesaian atau penolakan wajib catatan; dampak closed wajib konfirmasi aman. Jadwalkan pekerjaan terencana secara terpisah di slot kosong.
- Di **Jadwal perbaikan**, pilih fasilitas, tanggal, dan rentang jam yang kosong. Reservasi disetujui maupun menunggu menutup slot, jadi putuskan dulu pengajuan yang menunggu bila perbaikan harus di jam itu. Isi perkiraan jam selesai; **Perpanjang** bila belum beres, **Selesai sekarang** bila lebih cepat, atau **Batalkan** sebelum dimulai. Selama perbaikan, hanya rentang itu yang tidak bisa dipesan.

## Administrator

- Di **Akun**, setujui/tolak pendaftaran, buat akun pengguna atau petugas, dan kelola status akun.
- Di **Fasilitas**, tambah/ubah fasilitas, arsipkan, atau aktifkan kembali. Riwayat tetap tersimpan. Untuk penutupan berbahaya gunakan **Penutupan fasilitas**; untuk pekerjaan terencana gunakan **Jadwal perbaikan**. Keduanya bisa diakses admin.
- Di dashboard, lihat rekap per fasilitas/lokasi; unduh CSV rekap, reservasi, atau laporan. Ekspor memerlukan sesi admin aktif.

## Bantuan singkat

| Keadaan                           | Langkah                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| Akun baru belum bisa masuk        | Tunggu persetujuan admin; pendaftaran tidak langsung mengaktifkan akun.                             |
| Slot tidak bisa dipilih           | Cek tanggal, jam operasional, status fasilitas, dan slot yang sudah disetujui.                      |
| Akun lain tidak muncul            | Coba muat ulang daftar akun; sesi lama mungkin perlu satu kali login ulang melalui **Tambah akun**. |
| Batas lima akun tercapai          | Lepas satu akun dari menu profil sebelum menambah akun baru.                                        |
| Data demo berbeda dari production | Mode statis lokal menyimpan data browser dan bukan database production.                             |

Untuk tim penguji, catat kasus gagal di [UAT](./UAT.md) dan baca [Test Report](./TEST-REPORT.md). Jangan menaruh password dalam issue atau screenshot.
