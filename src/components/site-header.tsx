"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
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
  const [indicator, setIndicator] = useState<{
    left: number
    width: number
  } | null>(null)
  const [indicatorReady, setIndicatorReady] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const pathname = usePathname()

  const moveIndicator = useCallback((element: HTMLElement | null) => {
    const container = navRef.current
    if (!container || !element) return
    setIndicator({ left: element.offsetLeft, width: element.offsetWidth })
  }, [])

  const moveIndicatorToActive = useCallback(() => {
    moveIndicator(
      navRef.current?.querySelector<HTMLElement>('a[aria-current="page"]') ??
        null
    )
  }, [moveIndicator])

  useEffect(() => {
    moveIndicatorToActive()
  }, [pathname, moveIndicatorToActive])

  useEffect(() => {
    const container = navRef.current
    if (!container) return
    const frame = window.requestAnimationFrame(() => setIndicatorReady(true))
    const observer =
      "ResizeObserver" in window
        ? new ResizeObserver(moveIndicatorToActive)
        : null
    observer?.observe(container)
    const onPointerLeave = () => moveIndicatorToActive()
    const onFocusOut = (event: FocusEvent) => {
      if (!container.contains(event.relatedTarget as Node | null)) {
        moveIndicatorToActive()
      }
    }
    container.addEventListener("pointerleave", onPointerLeave)
    container.addEventListener("focusout", onFocusOut)
    document.fonts.ready.then(moveIndicatorToActive).catch(() => {})
    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
      container.removeEventListener("pointerleave", onPointerLeave)
      container.removeEventListener("focusout", onFocusOut)
    }
  }, [moveIndicatorToActive])

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
        <nav ref={navRef} className="desktop-nav" aria-label="Navigasi utama">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              onPointerEnter={(event) => moveIndicator(event.currentTarget)}
              onFocus={(event) => moveIndicator(event.currentTarget)}
            >
              {item.label}
            </Link>
          ))}
          <span
            aria-hidden="true"
            className="desktop-nav-indicator"
            data-ready={indicatorReady ? "true" : undefined}
            style={
              indicator
                ? { left: indicator.left, width: indicator.width }
                : undefined
            }
          />
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
              aria-current={pathname === item.href ? "page" : undefined}
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
