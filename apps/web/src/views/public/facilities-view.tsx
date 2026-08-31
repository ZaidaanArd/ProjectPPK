"use client"

import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Input } from "@workspace/ui/components/input"
import { useDeferredValue, useMemo, useState } from "react"

import { FacilityCard } from "@/components/facility-card"
import { PageHeading } from "@/components/page-heading"
import { facilities } from "@/mocks/facilities"

export function Component() {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const visibleFacilities = useMemo(
    () =>
      facilities.filter((facility) =>
        [facility.name, facility.type, facility.location]
          .join(" ")
          .toLowerCase()
          .includes(deferredQuery)
      ),
    [deferredQuery]
  )

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
      <PageHeading
        eyebrow="Direktori fasilitas"
        title="Cari ruang yang cocok, sebelum mengajukan."
        description="Pengunjung dapat melihat status dan slot ketersediaan tanpa membuka identitas pemohon atau tujuan penggunaan."
      />
      <div className="relative mt-8 max-w-lg">
        <HugeiconsIcon
          icon={Search01Icon}
          size={18}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama, tipe, atau lokasi..."
          aria-label="Cari fasilitas"
          className="h-12 rounded-2xl pl-11"
        />
      </div>

      {visibleFacilities.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleFacilities.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed bg-muted/50 px-6 py-16 text-center">
          <h2 className="text-lg font-bold">Fasilitas tidak ditemukan</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Coba gunakan nama gedung atau tipe fasilitas yang berbeda.
          </p>
        </div>
      )}
    </section>
  )
}
