"use client"

import {
  AnalyticsUpIcon,
  Building02Icon,
  Calendar03Icon,
  File02Icon,
  Home03Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

export type PortalKind = "user" | "staff" | "admin"
type IconData = HugeiconsIconProps["icon"]

const portalConfig: Record<
  PortalKind,
  { label: string; nav: { href: string; label: string; icon: IconData }[] }
> = {
  user: {
    label: "Portal pengguna",
    nav: [
      { href: "/app", label: "Ringkasan", icon: Home03Icon },
      { href: "/app/reservations", label: "Reservasi", icon: Calendar03Icon },
      { href: "/app/reports", label: "Laporan", icon: File02Icon },
    ],
  },
  staff: {
    label: "Meja petugas",
    nav: [
      { href: "/staff", label: "Antrean", icon: Home03Icon },
      { href: "/staff/reservations", label: "Reservasi", icon: Calendar03Icon },
      { href: "/staff/reports", label: "Laporan", icon: File02Icon },
    ],
  },
  admin: {
    label: "Panel admin",
    nav: [
      { href: "/admin", label: "Dashboard", icon: AnalyticsUpIcon },
      { href: "/admin/facilities", label: "Fasilitas", icon: Building02Icon },
      { href: "/admin/users", label: "Akun", icon: UserGroupIcon },
    ],
  },
}

function isActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href.split("/").length > 2 && pathname.startsWith(`${href}/`))
  )
}

export function PortalNavigation({
  kind,
  mobile = false,
}: {
  kind: PortalKind
  mobile?: boolean
}) {
  const pathname = usePathname()
  const config = portalConfig[kind]

  if (mobile) {
    return (
      <nav
        aria-label={`${config.label} seluler`}
        className="flex gap-1 overflow-x-auto border-b bg-background px-4 py-2 lg:hidden"
      >
        {config.nav.map((item) => {
          const active = isActive(pathname, item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-xs font-semibold",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="mt-3 grid gap-1" aria-label={config.label}>
      {config.nav.map((item) => {
        const active = isActive(pathname, item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <HugeiconsIcon icon={item.icon} size={18} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function getPortalLabel(kind: PortalKind) {
  return portalConfig[kind].label
}
