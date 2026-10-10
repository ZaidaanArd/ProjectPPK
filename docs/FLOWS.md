# Alur dan logika sistem

Semua aturan di bawah ditegakkan di backend Convex. Tampilan di browser hanya membantu memilih; server tetap memeriksa ulang setiap permintaan. Kode acuannya ada di `convex/` dan aturan bersama di `convex/lib/`.

## Gambaran besar

### Tiga peran, satu sumber data

Pengguna mengajukan, petugas memutuskan dan menindaklanjuti, admin mengelola data dan akun. Semua membaca data yang sama di Convex, jadi perubahan satu peran langsung terlihat di layar peran lain.

```mermaid
flowchart LR
    P([Pengunjung]) -->|lihat katalog dan slot| K[Katalog fasilitas]
    U([Pengguna]) -->|ajukan| R[Reservasi]
    U -->|lapor + foto| L[Laporan]
    T([Petugas]) -->|setujui / tolak / batalkan| R
    T -->|tangani / selesaikan| L
    T -->|jadwalkan| M[Jadwal perbaikan]
    A([Admin]) -->|kelola| F[Fasilitas]
    A -->|verifikasi| AK[Akun]
    A -->|rekap + CSV| X[Analitik]
    R --> DB[(Convex)]
    L --> DB
    M --> DB
    F --> DB
    AK --> DB
    DB -->|update real-time| K
```

- Pengunjung tanpa akun hanya bisa melihat katalog dan slot yang terisi, tanpa nama pemohon atau tujuan.
- Admin juga bisa melakukan semua tindakan petugas.
- Setiap tindakan penting dicatat di tabel `auditEvents`.

### Perjalanan satu permintaan

Contoh: pengguna mengirim reservasi. Browser memanggil fungsi Convex langsung dengan token sesi; fungsi itu memeriksa identitas, status akun, peran, dan aturan sebelum menulis apa pun.

```mermaid
sequenceDiagram
    actor B as Browser
    participant N as Next.js
    participant A as Better Auth
    participant C as Convex function
    participant D as Convex DB
    B->>N: Masuk (email + password)
    N->>A: Proxy /api/auth
    A-->>B: Cookie sesi (HttpOnly)
    B->>C: reservations.create + JWT
    C->>C: Cek sesi, akun aktif, peran "user"
    C->>D: Cek bentrok (index by_facility_status_start)
    C->>D: Simpan "pending" + auditEvents
    D-->>B: Query berlangganan ikut berubah
```

- Satu mutation = satu transaksi: kalau satu pemeriksaan gagal, tidak ada yang tersimpan.
- Data tidak dihapus destruktif; status yang berubah.

## Akun

### Status akun

Daftar mandiri menghasilkan akun `pending` yang belum bisa masuk portal. Admin menyetujui atau menolak (alasan wajib). Akun buatan admin langsung `active` dengan password sementara.

```mermaid
stateDiagram-v2
    [*] --> pending: Daftar mandiri
    [*] --> active: Dibuat admin (wajib ganti password)
    pending --> active: Admin menyetujui
    pending --> rejected: Admin menolak + alasan
    active --> disabled: Admin menonaktifkan + alasan
    disabled --> active: Admin mengaktifkan lagi
    rejected --> [*]
```

- Admin tidak bisa menonaktifkan akunnya sendiri.
- Akun `pending`, `rejected`, dan `disabled` diarahkan ke halaman status akun, bukan portal.

### Masuk ke portal

Setelah login, server membaca profil lalu mengarahkan ke portal sesuai peran. Halaman portal memeriksa ulang di server, jadi URL tidak bisa ditebak untuk masuk.

```mermaid
flowchart TD
    L[Login berhasil] --> S{Status akun aktif?}
    S -- Tidak --> ST[/Halaman status akun/]
    S -- Ya --> R{Peran}
    R -- user --> APP[/Portal pengguna /app/]
    R -- officer --> STAFF[/Portal petugas /staff/]
    R -- admin --> ADM[/Portal admin /admin/]
    APP --> G{Halaman butuh peran lain?}
    STAFF --> G
    ADM --> G
    G -- Ya --> F[/403 Forbidden/]
    G -- Tidak --> OK[Tampilkan halaman]
```

- Pemeriksaan yang sama diulang di setiap fungsi Convex (`requireRole`).
- Satu perangkat bisa menyimpan hingga 5 akun dan berpindah tanpa login ulang.

## Reservasi

### Mengajukan reservasi

Server memeriksa urutan aturan ini. Reservasi yang baru diajukan berstatus `pending` dan belum memblokir slot bagi pengguna lain.

```mermaid
flowchart TD
    A[Pengguna kirim reservasi] --> B{Fasilitas aktif?}
    B -- Tidak --> X1[Ditolak: tidak dapat dipesan]
    B -- Ya --> C{07.00–20.00 WIB, satu hari, kelipatan 30 menit?}
    C -- Tidak --> X2[Ditolak: waktu tidak valid]
    C -- Ya --> D{Di masa mendatang?}
    D -- Tidak --> X3[Ditolak]
    D -- Ya --> E{Bentrok reservasi disetujui?}
    E -- Ya --> X4[Ditolak: slot sudah dipakai]
    E -- Tidak --> F{Bentrok jadwal perbaikan?}
    F -- Ya --> X5[Ditolak: bertepatan dengan perbaikan]
    F -- Tidak --> G[Tersimpan sebagai Menunggu]
```

- Beberapa pengajuan menunggu boleh menumpuk di slot yang sama; petugas yang memilih.
- Tujuan penggunaan wajib diisi.

### Status reservasi

Begitu petugas menyetujui satu reservasi, semua pengajuan menunggu yang bentrok dengannya otomatis ditolak sistem dengan catatan yang jelas.

```mermaid
stateDiagram-v2
    [*] --> pending: Pengguna mengajukan
    pending --> approved: Petugas menyetujui
    pending --> rejected: Petugas menolak
    pending --> rejected: Otomatis, kalah oleh reservasi lain yang disetujui
    pending --> cancelled: Pengguna / petugas membatalkan
    approved --> cancelled: Pengguna (min. 1 jam sebelum) atau petugas + alasan
    approved --> [*]
    rejected --> [*]
    cancelled --> [*]
```

- Pengguna hanya bisa membatalkan minimal 1 jam sebelum mulai.
- Petugas yang membatalkan wajib menulis alasan.
- Penolakan otomatis dicatat di audit sebagai aktor `system`.

### Persetujuan dan penolakan otomatis

Saat petugas menekan Setujui, server memeriksa ulang bentrok di dalam transaksi yang sama, jadi dua petugas yang menyetujui bersamaan tidak bisa menghasilkan dua reservasi di slot yang sama.

```mermaid
sequenceDiagram
    actor P as Petugas
    participant C as reservations.decide
    participant D as Convex DB
    P->>C: Setujui reservasi R1 (10.00–12.00)
    C->>D: Ada reservasi disetujui yang bentrok?
    alt Sudah ada
        C->>D: R1 ditolak otomatis
    else Kosong
        C->>D: Ada jadwal perbaikan di waktu itu?
        C->>D: R1 = Disetujui
        C->>D: R2, R3 (menunggu, bentrok) = Ditolak otomatis
    end
    D-->>P: Antrean langsung diperbarui
```

- Reservasi yang bersebelahan (10.00–12.00 dan 12.00–13.00) tidak dianggap bentrok.

## Laporan fasilitas

### Status laporan

Laporan baru berstatus `pending`. Menyelesaikan atau menolak wajib disertai catatan penanganan, dan status yang sudah ditutup tidak bisa dibuka lagi.

```mermaid
stateDiagram-v2
    [*] --> pending: Pengguna melapor (+ foto opsional)
    pending --> in_progress: Petugas mulai menangani
    pending --> rejected: Petugas menolak + catatan
    in_progress --> resolved: Petugas menyelesaikan + catatan
    in_progress --> rejected: Petugas menolak + catatan
    resolved --> [*]
    rejected --> [*]
```

- Foto maksimal 5 MB, hanya JPG, PNG, atau WebP; server memeriksa ulang metadata file.
- Saat laporan ditutup, jadwal perbaikan yang terkait ikut diakhiri.

### Dari laporan ke perbaikan

Laporan tidak lagi mematikan fasilitas seharian. Petugas menjadwalkan perbaikan di waktu yang kosong, langsung dari kartu laporan.

```mermaid
flowchart LR
    A[Laporan masuk] --> B[Petugas: Mulai tangani]
    B --> C{Perlu menutup ruang?}
    C -- Tidak --> E[Perbaiki tanpa menutup slot]
    C -- Ya --> D[Jadwalkan perbaikan di slot kosong]
    D --> F[Slot rentang itu tertutup]
    E --> G[Selesaikan laporan + catatan]
    F --> G
    G --> H[Perbaikan terkait diakhiri, slot terbuka lagi]
```

- Perbaikan yang sudah berjalan diakhiri saat itu juga; yang belum mulai dibatalkan.

## Jadwal perbaikan

### Aturan utama

Perbaikan dan reservasi tidak boleh tumpang tindih, dan perbaikan yang mengalah: perbaikan hanya boleh mengambil waktu yang benar-benar kosong.

```mermaid
flowchart TD
    S[Petugas pilih fasilitas, tanggal, jam mulai-selesai, alasan] --> V{Kelipatan 30 menit, belum lewat, maks 7 hari?}
    V -- Tidak --> XV[Ditolak: waktu tidak valid]
    V -- Ya --> K{Bentrok reservasi DISETUJUI?}
    K -- Ya --> XK[Ditolak: pilih waktu yang kosong]
    K -- Tidak --> P{Bentrok reservasi MENUNGGU?}
    P -- Ya --> XP[Ditolak: setujui atau tolak dulu di antrean]
    P -- Tidak --> M{Bentrok jadwal perbaikan lain?}
    M -- Ya --> XM[Ditolak]
    M -- Tidak --> OK[Tersimpan: slot itu tertutup untuk reservasi]
```

- Reservasi yang sudah disetujui tetap berjalan; perbaikan harus mencari waktu lain.
- Pengajuan menunggu tidak ditolak diam-diam oleh sistem; petugas yang memutuskannya dulu.
- Jam lain di hari yang sama tetap bisa dipesan.

### Status jadwal perbaikan

Jam selesai wajib diisi sebagai perkiraan. Jadwal berakhir otomatis di jam itu lewat scheduled function Convex, atau lebih cepat kalau petugas menekan Selesai.

```mermaid
stateDiagram-v2
    [*] --> scheduled: Dijadwalkan (waktu kosong)
    scheduled --> scheduled: Diperpanjang (tambahan waktu juga harus kosong)
    scheduled --> completed: Jam selesai tiba (otomatis)
    scheduled --> completed: Petugas klik Selesai saat berjalan
    scheduled --> cancelled: Dibatalkan sebelum mulai
    scheduled --> completed: Laporan terkait ditutup (sudah mulai)
    scheduled --> cancelled: Laporan terkait ditutup (belum mulai)
    completed --> [*]
    cancelled --> [*]
```

- Status "Berlangsung" atau "Terjadwal" dihitung dari jam sekarang terhadap rentang `startAt`–`endAt`.
- Satu jadwal maksimal 7 hari; penutupan lebih lama memakai status Nonaktif milik admin.

### Contoh kasus: kelas sudah direservasi lalu perlu diperbaiki

Reservasi yang sudah disetujui tetap jalan. Perbaikan dijadwalkan di waktu kosong berikutnya, dan selama perbaikan slot itu tidak bisa direservasi.

```mermaid
sequenceDiagram
    actor U as Pengguna
    actor P as Petugas
    participant S as Sthana (Convex)
    U->>S: Reservasi Aula, Senin 08.00–10.00
    P->>S: Setujui
    S-->>U: Disetujui
    Note over P: Laporan masuk: AC Aula rusak
    P->>S: Jadwalkan perbaikan Senin 09.00–12.00
    S-->>P: Ditolak: bentrok dengan reservasi 08.00–10.00
    P->>S: Jadwalkan perbaikan Senin 10.00–14.00
    S-->>P: Tersimpan
    U->>S: Reservasi Aula, Senin 13.00
    S-->>U: Ditolak: bertepatan dengan perbaikan
    Note over U,S: 08.00–10.00 tetap dipakai sesuai reservasi
    P->>S: Selesai pukul 12.00
    S-->>U: Slot 12.00 dan seterusnya bisa dipesan lagi
```

- Kalau perbaikan butuh lebih lama, petugas memperpanjang; tambahan waktunya juga harus kosong.

### Data jadwal perbaikan

Jadwal perbaikan disimpan di tabel sendiri, terhubung ke fasilitas dan, bila dibuat dari laporan, ke laporan itu.

```mermaid
erDiagram
    FACILITY ||--o{ RESERVATION : dipesan
    FACILITY ||--o{ MAINTENANCE_WINDOW : diperbaiki
    REPORT |o--o{ MAINTENANCE_WINDOW : memicu
    PROFILE ||--o{ MAINTENANCE_WINDOW : menjadwalkan
    MAINTENANCE_WINDOW {
        id facilityId
        id reportId "opsional"
        string reason
        number startAt
        number endAt
        string status "scheduled, completed, cancelled"
        id createdBy
    }
```

- Index `by_facility_status_start` dipakai untuk cek bentrok, sama seperti reservasi.
- Status fasilitas lama `maintenance` (menutup seluruh fasilitas) tidak bisa dipasang lagi; admin hanya bisa mengaktifkannya kembali.

## Hak akses

### Siapa boleh melakukan apa

Setiap fungsi Convex memanggil `requireRole` sebelum membaca atau menulis data. Tombol yang disembunyikan di UI bukan satu-satunya pengaman.

```mermaid
flowchart LR
    subgraph Pengguna
      U1[Ajukan / batalkan reservasi sendiri]
      U2[Buat laporan + foto]
    end
    subgraph Petugas
      O1[Setujui / tolak / batalkan reservasi]
      O2[Tangani laporan]
      O3[Jadwalkan / perpanjang / akhiri perbaikan]
    end
    subgraph Admin
      A1[Semua tindakan petugas]
      A2[Kelola fasilitas]
      A3[Verifikasi dan kelola akun]
      A4[Rekap + ekspor CSV]
    end
    Pengunjung[Pengunjung tanpa akun] --> V[Katalog + slot terisi, tanpa data pribadi]
```

- Query pengguna selalu memakai ID profil dari sesi, bukan ID kiriman browser.
- Ekspor CSV memeriksa sesi dan peran admin di server.
