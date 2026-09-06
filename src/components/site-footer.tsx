import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="text-sm font-semibold tracking-tight">RuangKampus</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Sistem reservasi dan pelaporan fasilitas kampus. Pesan ruangan,
            pantau status persetujuan, dan laporkan kerusakan dalam satu tempat.
          </p>
        </div>

        <nav aria-label="Layanan">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Layanan
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/facilities" className="hover:text-primary hover:underline">
                Daftar fasilitas
              </Link>
            </li>
            <li>
              <Link href="/app/reservations/new" className="hover:text-primary hover:underline">
                Ajukan reservasi
              </Link>
            </li>
            <li>
              <Link href="/app/reports/new" className="hover:text-primary hover:underline">
                Lapor kerusakan
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Portal">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Portal
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/app" className="hover:text-primary hover:underline">
                Portal pengguna
              </Link>
            </li>
            <li>
              <Link href="/staff" className="hover:text-primary hover:underline">
                Portal petugas
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-primary hover:underline">
                Portal admin
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Akun">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Akun
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/login" className="hover:text-primary hover:underline">
                Masuk
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-primary hover:underline">
                Daftar
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 RuangKampus · Project PPK</p>
          <p>Contoh layout public — data masih mock, belum tersambung database.</p>
        </div>
      </div>
    </footer>
  )
}
