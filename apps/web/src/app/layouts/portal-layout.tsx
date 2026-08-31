import { Logout02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { UserSession } from "@workspace/contracts"
import { Button } from "@workspace/ui/components/button"
import type { ReactNode } from "react"

import { Brand } from "@/components/brand"
import {
  PortalNavigation,
  type PortalKind,
} from "@/components/portal-navigation"
import { ThemeToggle } from "@/components/theme-toggle"

const portalLabels: Record<PortalKind, string> = {
  user: "Portal pengguna",
  staff: "Meja petugas",
  admin: "Panel admin",
}

export function PortalLayout({
  kind,
  user,
  children,
}: {
  kind: PortalKind
  user: UserSession
  children: ReactNode
}) {
  return (
    <div className="min-h-svh bg-muted/35 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b px-6">
          <Brand />
        </div>
        <div className="px-4 py-6">
          <p className="px-3 font-mono text-[10px] font-bold tracking-[0.18em] text-sidebar-foreground/55 uppercase">
            {portalLabels[kind]}
          </p>
          <PortalNavigation kind={kind} />
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
            <p className="text-sm font-bold">{user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>
        <PortalNavigation kind={kind} mobile />
        <main className="mx-auto max-w-[1500px] p-5 sm:p-8">{children}</main>
      </div>
    </div>
  )
}
