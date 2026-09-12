"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { IconArrowRight, IconMenu2, IconX } from "@tabler/icons-react"
import { BrandLogo } from "@/components/brand-logo"
const nav = [
  { href: "/", label: "Beranda" },
  { href: "/facilities", label: "Fasilitas" },
  { href: "/#tentang", label: "Tentang" },
]
export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  return (
    <header
      className="sthana-header"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false)
      }}
    >
      <div className="sthana-container header-row">
        <Link
          href="/"
          aria-label="Sthana Kampus — Beranda"
          onClick={() => setOpen(false)}
        >
          <BrandLogo />
        </Link>
        <nav className="desktop-nav" aria-label="Navigasi utama">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/login" className="header-login">
            Masuk
          </Link>
          <Link href="/register" className="sthana-button primary small">
            Daftar akun <IconArrowRight size={16} aria-hidden="true" />
          </Link>
          <button
            className="mobile-menu-button"
            type="button"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <IconX size={22} /> : <IconMenu2 size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-navigation"
          aria-label="Navigasi mobile"
        >
          {[...nav, { href: "/login", label: "Masuk" }].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
