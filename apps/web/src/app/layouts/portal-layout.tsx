import {
  AnalyticsUpIcon,
  Building02Icon,
  Calendar03Icon,
  File02Icon,
  Home03Icon,
  Logout02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { NavLink, Outlet } from "react-router-dom"

import { Brand } from "@/components/brand"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSession } from "@/features/auth/session"

type PortalKind = "user" | "staff" | "admin"
type IconData = HugeiconsIconProps["icon"]

const portalConfig: Record<
  PortalKind,
  { label: string; nav: { to: string; label: string; icon: IconData }[] }
> = {
  user: {
    label: "Portal pengguna",
    nav: [
      { to: "/app", label: "Ringkasan", icon: Home03Icon },
      { to: "/app/reservations", label: "Reservasi", icon: Calendar03Icon },
      { to: "/app/reports", label: "Laporan", icon: File02Icon },
    ],
  },
  staff: {
    label: "Meja petugas",
    nav: [
      { to: "/staff", label: "Antrean", icon: Home03Icon },
      { to: "/staff/reservations", label: "Reservasi", icon: Calendar03Icon },
      { to: "/staff/reports", label: "Laporan", icon: File02Icon },
    ],
  },
  admin: {
    label: "Panel admin",
    nav: [
      { to: "/admin", label: "Dashboard", icon: AnalyticsUpIcon },
      { to: "/admin/facilities", label: "Fasilitas", icon: Building02Icon },
      { to: "/admin/users", label: "Akun", icon: UserGroupIcon },
    ],
  },
}

export function PortalLayout({ kind }: { kind: PortalKind }) {
  const { data } = useSession()
  const config = portalConfig[kind]

  return (
    <div className="min-h-svh bg-muted/35 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b px-6">
          <Brand />
        </div>
        <div className="px-4 py-6">
          <p className="px-3 font-mono text-[10px] font-bold tracking-[0.18em] text-sidebar-foreground/55 uppercase">
            {config.label}
          </p>
          <nav className="mt-3 grid gap-1" aria-label={config.label}>
            {config.nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.split("/").length === 2}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )
                }
              >
                <HugeiconsIcon icon={item.icon} size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t p-4">
          <Button variant="ghost" className="w-full justify-start">
            <HugeiconsIcon icon={Logout02Icon} data-icon="inline-start" />
            Keluar
          </Button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b bg-background/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="lg:hidden">
            <Brand compact />
          </div>
          <div className="hidden lg:block">
            <p className="text-xs text-muted-foreground">
              Selamat datang kembali,
            </p>
            <p className="text-sm font-bold">{data?.user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">
              {data?.user?.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-background px-4 py-2 lg:hidden">
          {config.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split("/").length === 2}
              className={({ isActive }) =>
                cn(
                  "shrink-0 rounded-full px-3 py-2 text-xs font-semibold",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="mx-auto max-w-[1500px] p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
