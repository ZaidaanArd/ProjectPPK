# Security & Privacy Notes

Catatan ini mendeskripsikan kontrol yang ada di kode, bukan audit keamanan, kebijakan privasi formal, atau jaminan kepatuhan hukum.

## Data yang diproses

Profil menyimpan nama, email, peran, status, jenis pengguna, dan identitas institusi bila diberikan. Reservasi menyimpan fasilitas, tujuan, waktu, status, serta catatan keputusan. Laporan menyimpan kategori, deskripsi, foto opsional, status, dan catatan penanganan. Audit event mencatat aksi penting dan aktornya. Better Auth menyimpan kredensial dan sesi pada komponen auth Convex yang terpisah dari tabel profil aplikasi.

Jangan memakai data pribadi nyata untuk demo/QA. Jangan menaruh password, token, cookie, atau secret di Git, spreadsheet publik, screenshot, atau issue. File .env.local hanya lokal; secret server disimpan di environment Convex/Vercel.

## Kontrol akses di implementasi

- Halaman /app, /staff, dan /admin memiliki guard server-side; Convex query/mutation tetap memeriksa profil aktif dan role sehingga guard halaman bukan satu-satunya batas.
- Query riwayat pengguna memakai identitas sesi, bukan user ID yang bebas dipilih client. Ketersediaan publik tidak mengirim nama pemohon atau tujuan.
- Akun registrasi mandiri berstatus pending; sesi baru ditolak sampai aktif. Admin dapat menyetujui, menolak, atau menonaktifkan akun.
- Better Auth Multi Session mendukung hingga lima akun di browser; pergantian akun menavigasi ulang ke /portal. Menu membedakan keluar dari satu akun dan semua akun.
- Route CSV mengembalikan 401 tanpa sesi, 403 bila bukan admin aktif, dan 500 bila server gagal. Nilai CSV disanitasi untuk mengurangi risiko formula spreadsheet.
- Server memvalidasi jam/slot, bentrok reservasi, transisi status, role, serta foto JPEG/PNG/WebP maksimal 5 MB.

## Batasan dan pekerjaan lanjutan

- Foto laporan berada di Convex Storage. URL foto hanya diberikan melalui query terotorisasi, tetapi siapa pun yang kemudian memperoleh URL tersebut dapat mengaksesnya selama URL berlaku; hindari membagikannya sembarangan.
- Mode demo statis menyimpan data di localStorage dan foto di IndexedDB pada perangkat yang sama. Jangan menganggapnya aman untuk data sensitif atau sebagai backup.
- Repository belum mendefinisikan masa retensi, prosedur penghapusan data pribadi, perjanjian pemrosesan data, SLA keamanan, atau audit penetrasi. Tentukan hal-hal ini sebelum penggunaan institusional.
- Pengujian unit yang lulus tidak membuktikan keamanan production. Verifikasi lintas akun/peran dan sesi kedaluwarsa pada deployment target sebelum rilis.

Laporkan temuan keamanan secara privat kepada pemilik repository; jangan membuka issue publik yang berisi kredensial atau langkah eksploitasi terhadap production.
