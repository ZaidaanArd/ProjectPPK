import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Building02Icon } from "@hugeicons/core-free-icons"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/", label: "Beranda" },
  { href: "/facilities", label: "Fasilitas" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HugeiconsIcon icon={Building02Icon} size={20} strokeWidth={2} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">
              RuangKampus
            </span>
            <span className="block text-xs text-muted-foreground">
              Reservasi fasilitas kampus
            </span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}
          >
            Masuk
          </Link>
          <Link href="/register" className={cn(buttonVariants({ variant: "default" }))}>
            Daftar akun
          </Link>
        </div>
      </div>
    </header>
  )
}
