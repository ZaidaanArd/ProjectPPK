"use client"

import Image from "next/image"
import { IconCheck, IconMapPin, IconUsers } from "@tabler/icons-react"

import { facilityIllustration } from "@/lib/facility-illustrations"
import { cn } from "@/lib/utils"

type FacilityOption = {
  id: string
  name: string
  type: string
  location: string
  capacity: number
  description: string
}

export function FacilitySelectionCard({
  facility,
  radioName,
  selected,
  onSelect,
}: {
  facility: FacilityOption
  radioName: string
  selected: boolean
  onSelect: (id: string) => void
}) {
  const illustration = facilityIllustration(facility.name, facility.type)

  return (
    <label
      className={cn(
        "group relative flex min-h-24 cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-sm transition-[border-color,box-shadow,transform] duration-200 focus-within:ring-2 focus-within:ring-pink-400/40 hover:-translate-y-0.5 hover:shadow-lg",
        selected
          ? "border-pink-500 ring-2 ring-pink-400/40 dark:border-pink-400"
          : "border-border/80 hover:border-pink-300 dark:hover:border-pink-500/50"
      )}
    >
      <input
        type="radio"
        name={radioName}
        value={facility.id}
        checked={selected}
        onChange={() => onSelect(facility.id)}
        required
        className="sr-only"
      />
      <span className="relative w-24 shrink-0 overflow-hidden bg-muted/30 sm:w-28">
        <Image
          src={illustration.src}
          alt={illustration.alt}
          fill
          sizes="112px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {selected && (
          <span className="absolute inset-0 grid place-items-center bg-pink-600/55 text-white">
            <span className="grid size-8 place-items-center rounded-full bg-white text-pink-600 shadow">
              <IconCheck size={18} stroke={3} aria-hidden="true" />
            </span>
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 p-3.5">
        <span className="flex items-start justify-between gap-2">
          <span className="font-heading text-sm font-semibold break-words">
            {facility.name}
          </span>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {facility.type}
          </span>
        </span>
        <span className="line-clamp-1 text-xs text-muted-foreground">
          {facility.description}
        </span>
        <span className="mt-auto flex flex-wrap gap-x-3 gap-y-0.5 pt-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <IconMapPin size={12} aria-hidden="true" />
            {facility.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <IconUsers size={12} aria-hidden="true" />
            {facility.capacity} orang
          </span>
        </span>
        {selected && <span className="sr-only">Dipilih</span>}
      </span>
    </label>
  )
}
