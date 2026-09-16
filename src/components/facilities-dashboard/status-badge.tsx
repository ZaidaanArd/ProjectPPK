"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { FacilityStatus } from "@/lib/facilities-dashboard/types"

const STATUS_STYLE: Record<FacilityStatus, string> = {
  Aktif:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "Dalam Perbaikan":
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Nonaktif: "border-border bg-muted text-muted-foreground",
}

const DOT_STYLE: Record<FacilityStatus, string> = {
  Aktif: "bg-emerald-500",
  "Dalam Perbaikan": "bg-amber-500",
  Nonaktif: "bg-zinc-400",
}

export function StatusBadge({ status }: { status: FacilityStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", STATUS_STYLE[status])}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", DOT_STYLE[status])}
      />
      {status}
    </Badge>
  )
}
