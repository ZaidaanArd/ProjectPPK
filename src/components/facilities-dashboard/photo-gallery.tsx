"use client"

import * as React from "react"
import { IconPhoto, IconZoomIn } from "@tabler/icons-react"
import type { FacilityPhoto } from "@/lib/facilities-dashboard/types"
import { cn } from "@/lib/utils"

export function PhotoGallery({
  photos,
  facilityName,
}: {
  photos: FacilityPhoto[]
  facilityName: string
}) {
  const [active, setActive] = React.useState(0)

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/50 px-4 py-10 text-center">
        <span className="mx-auto inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <IconPhoto size={20} aria-hidden="true" />
        </span>
        <p className="mt-2 text-sm font-medium">Belum ada foto ruangan</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Foto ruangan belum tersedia.
        </p>
      </div>
    )
  }

  const main = photos[active] ?? photos[0]

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={main.url}
          alt={main.alt ?? `${facilityName} — foto ${active + 1}`}
          loading="lazy"
          className="aspect-[16/9] w-full object-cover"
        />
        <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
          <IconZoomIn size={12} aria-hidden="true" />
          {active + 1} / {photos.length}
        </span>
      </div>

      {photos.length > 1 && (
        <ul
          aria-label={`Galeri foto ${facilityName}`}
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {photos.map((p, idx) => (
            <li key={p.id}>
              <button
                type="button"
                aria-label={`Lihat ${p.alt ?? `foto ${idx + 1}`}`}
                aria-current={idx === active ? "true" : undefined}
                onClick={() => setActive(idx)}
                className={cn(
                  "relative shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                  idx === active
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent opacity-80 hover:opacity-100"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.alt ?? `${facilityName} thumbnail ${idx + 1}`}
                  loading="lazy"
                  className="size-[72px] object-cover sm:size-[84px]"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
