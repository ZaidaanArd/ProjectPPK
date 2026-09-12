import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { site } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="sthana-footer">
      <div className="sthana-container footer-grid">
        <div>
          <Link href="/" aria-label="Sthana Kampus — Beranda">
            <BrandLogo />
          </Link>
          <p>
            Reservasi dan pelaporan
            <br />
            fasilitas kampus.
          </p>
        </div>
        <nav aria-label="Layanan">
          <h2>Layanan</h2>
          <Link href="/facilities">Daftar fasilitas</Link>
          <Link href="/app/reservations/new">Ajukan reservasi</Link>
          <Link href="/app/reports/new">Lapor kerusakan</Link>
        </nav>
        <nav aria-label="Portal">
          <h2>Portal</h2>
          <Link href="/app">Pengguna</Link>
          <Link href="/staff">Petugas</Link>
          <Link href="/admin">Admin</Link>
        </nav>
        <nav aria-label="Akun">
          <h2>Akun</h2>
          <Link href="/login">Masuk</Link>
          <Link href="/register">Daftar akun</Link>
        </nav>
      </div>
      <div className="sthana-container footer-bottom">
        <span>© 2026 Sthana Kampus · Project PPK</span>
        <span>
          Dibuat oleh{" "}
          <a href={site.creator.url} rel="author">
            {site.creator.name}
          </a>
        </span>
      </div>
    </footer>
  )
}
