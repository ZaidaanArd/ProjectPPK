"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { IconMenu2, IconX } from "@tabler/icons-react"
import { BrandLogo } from "@/components/brand-logo"
import { PublicAccountLinks } from "@/components/public-account-links"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
const nav = [
  { href: "/", label: "Beranda" },
  { href: "/facilities", label: "Fasilitas" },
  { href: "/tentang", label: "Tentang" },
]
export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [open])

  return (
    <header className="sthana-header">
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
          <AnimatedThemeToggler
            className="sthana-theme-toggle"
            aria-label="Ganti tema terang atau gelap"
            title="Ganti tema"
          />
          <PublicAccountLinks placement="header" />
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
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <PublicAccountLinks
            placement="mobile"
            onNavigate={() => setOpen(false)}
          />
        </nav>
      )}
    </header>
  )
}
