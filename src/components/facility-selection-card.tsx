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
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-[border-color,box-shadow,transform] duration-200 focus-within:ring-2 focus-within:ring-pink-400/40 hover:-translate-y-0.5 hover:shadow-lg",
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
      <span className="relative block aspect-[16/9] overflow-hidden bg-muted/30">
        <Image
          src={illustration.src}
          alt={illustration.alt}
          fill
          sizes="(max-width: 1023px) 100vw, 50vw"
          className="object-cover object-top"
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          {facility.type}
        </span>
        {selected && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-pink-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            <IconCheck size={14} aria-hidden="true" /> Dipilih
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col p-4 sm:p-5">
        <span className="font-heading text-base font-semibold break-words">
          {facility.name}
        </span>
        <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {facility.description}
        </span>
        <span className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <IconMapPin size={14} aria-hidden="true" />
            {facility.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <IconUsers size={14} aria-hidden="true" />
            {facility.capacity} orang
          </span>
        </span>
      </span>
    </label>
  )
}
