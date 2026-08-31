import { buttonVariants } from "@workspace/ui/components/button"
import Link from "next/link"
import type { ReactNode } from "react"

import { Brand } from "@/components/brand"
import { PublicNavigation } from "@/components/public-navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { getCurrentUser } from "@/server/auth/session"

export async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
          <Brand />
          <PublicNavigation />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link
              href={user ? "/app" : "/login"}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {user ? "Buka portal" : "Masuk"}
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:px-8">
          <p>© 2026 RuangKampus · Project PPK sebelum UTS</p>
          <p>Jam layanan reservasi 07.00–20.00 WIB</p>
        </div>
      </footer>
    </div>
  )
}
