import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Link, NavLink, Outlet } from "react-router-dom"

import { Brand } from "@/components/brand"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSession } from "@/features/auth/session"

const publicNav = [
  { to: "/", label: "Beranda", end: true },
  { to: "/facilities", label: "Fasilitas", end: false },
]

export function RootLayout() {
  const { data } = useSession()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
          <Brand />
          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-1 md:flex"
          >
            {publicNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link
              to={data?.user ? "/app" : "/login"}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {data?.user ? "Buka portal" : "Masuk"}
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:px-8">
          <p>© 2026 RuangKampus · Project PPK sebelum UTS</p>
          <p>Jam layanan reservasi 07.00–20.00 WIB</p>
        </div>
      </footer>
    </div>
  )
}
