"use client"

import { IconBuilding } from "@tabler/icons-react"
import type { DemoRole, FacilityItem } from "@/lib/facilities-dashboard/types"
import { FacilityCard } from "./facility-card"

export function FacilityGrid({
  facilities,
  viewerRole,
  onCekSlot,
  onEdit,
  onToggleNonaktif,
  onToggleMaintenance,
  onReset,
  illustrated = false,
  reveal = false,
}: {
  facilities: FacilityItem[]
  viewerRole: DemoRole
  onCekSlot: (f: FacilityItem) => void
  onEdit: (f: FacilityItem) => void
  onToggleNonaktif: (f: FacilityItem) => void
  onToggleMaintenance: (f: FacilityItem) => void
  onReset: () => void
  illustrated?: boolean
  reveal?: boolean
}) {
  if (facilities.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-4xl border border-dashed bg-card px-6 py-14 text-center shadow-sm">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <IconBuilding size={20} aria-hidden="true" />
        </span>
        <div>
          <p className="font-heading text-base font-medium">
            Tidak ada fasilitas yang cocok
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Coba ubah kata kunci atau reset filter.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="h-9 rounded-full bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:opacity-90"
        >
          Reset filter
        </button>
      </div>
    )
  }

  return (
    <ul
      aria-label="Daftar fasilitas"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {facilities.map((f) => (
        <li
          key={f.id}
          className={reveal ? "reveal-pending h-full" : "h-full"}
          data-reveal={reveal ? "dynamic" : undefined}
        >
          <FacilityCard
            facility={f}
            role={viewerRole}
            onCekSlot={onCekSlot}
            onEdit={onEdit}
            onToggleNonaktif={onToggleNonaktif}
            onToggleMaintenance={onToggleMaintenance}
            illustrated={illustrated}
          />
        </li>
      ))}
    </ul>
  )
}
