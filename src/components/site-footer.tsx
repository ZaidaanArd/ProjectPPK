import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { AnimatedTooltip } from "@/components/ui/animated-tooltip"

const team = [
  {
    id: 1,
    name: "Muchammad Yuda Tri Ananda",
    designation: "Project Manager",
    image: "/images/team/muchammad-yuda-tri-ananda.png",
    href: "https://github.com/myudak",
  },
  {
    id: 2,
    name: "Muhammad Zaidaan Ardiyansyah",
    designation: "Brand & UI Lead",
    image: "/images/team/muhammad-zaidaan-ardiyansyah.png",
    href: "https://github.com/ZaidaanArd",
  },
    {
    id: 3,
    name: "Muhammad Hafidh Zufar Dewantara",
    designation: "QA & Testing Lead",
    image: "/images/team/muhammad-hafidh-zufar-dewantara.png",
    href: "https://github.com/hafidhzufar05-web",
  },
  {
    id: 4,
    name: "Nayla Husna",
    designation: "Database Lead",
    image: "/images/team/nayla-husna.png",
    href: "https://github.com/naylahusna",
  },
] as const

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
        <div className="footer-team-credit">
          <span>Dibuat oleh</span>
          <AnimatedTooltip items={[...team]} />
        </div>
      </div>
    </footer>
  )
}
