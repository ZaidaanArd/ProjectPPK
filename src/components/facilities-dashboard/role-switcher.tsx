"use client"

import { IconShieldCheck, IconTool, IconUser } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { DemoRole } from "@/lib/facilities-dashboard/types"

const ROLES: { value: DemoRole; label: string; icon: typeof IconUser }[] = [
  { value: "admin", label: "Admin", icon: IconShieldCheck },
  { value: "petugas", label: "Petugas", icon: IconTool },
  { value: "pengguna", label: "Pengguna", icon: IconUser },
]

export function RoleSwitcher({
  value,
  onChange,
}: {
  value: DemoRole
  onChange: (role: DemoRole) => void
}) {
  return (
    <div
      role="group"
      aria-label="Simulasi peran pengguna"
      className="inline-flex items-center gap-1 rounded-full bg-muted p-1"
    >
      {ROLES.map(({ value: r, label, icon: Icon }) => {
        const aktif = r === value
        return (
          <button
            key={r}
            type="button"
            aria-pressed={aktif}
            onClick={() => onChange(r)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-all",
              aktif
                ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
