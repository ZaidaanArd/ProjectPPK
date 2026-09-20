"use client"

import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { IconBuilding, IconMapPin, IconUsers } from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function tomorrowInJakarta() {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000)
  now.setUTCDate(now.getUTCDate() + 1)
  return now.toISOString().slice(0, 10)
}

function dayRange(date: string) {
  const start = Date.parse(`${date}T00:00:00+07:00`)
  return { start, end: start + 24 * 60 * 60 * 1000 }
}

function Availability({
  facilityId,
  date,
}: {
  facilityId: Id<"facilities">
  date: string
}) {
  const range = dayRange(date)
  const availability = useQuery(api.facilities.getPublicAvailability, {
    facilityId,
    rangeStart: range.start,
    rangeEnd: range.end,
  })

  const slots = useMemo(
    () =>
      Array.from({ length: 26 }, (_, index) => {
        const startAt = range.start + (7 * 60 + index * 30) * 60 * 1000
        const endAt = startAt + 30 * 60 * 1000
        const booked = availability?.reservations.some(
          (item) => item.startAt < endAt && startAt < item.endAt
        )
        return {
          label: new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Jakarta",
          }).format(startAt),
          booked,
        }
      }),
    [availability, range.start]
  )

  if (!availability) {
    return <p className="text-sm text-muted-foreground">Memuat jadwal…</p>
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-9">
      {slots.map((slot) => (
        <span
          key={slot.label}
          className={`rounded-md border px-2 py-1.5 text-center text-xs ${
            slot.booked
              ? "border-muted bg-muted text-muted-foreground line-through"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {slot.label}
        </span>
      ))}
    </div>
  )
}

export function PublicFacilities() {
  const facilities = useQuery(api.facilities.listPublic)
  const [search, setSearch] = useState("")
  const [date, setDate] = useState(tomorrowInJakarta)
  const [selectedId, setSelectedId] = useState<Id<"facilities"> | null>(null)

  const filtered = (facilities ?? []).filter((facility) =>
    `${facility.name} ${facility.type} ${facility.location} ${facility.capacity}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-heading text-3xl font-bold">Fasilitas kampus</h1>
          <p className="mt-2 text-muted-foreground">
            Cek fasilitas dan slot yang masih tersedia tanpa perlu masuk.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            aria-label="Cari fasilitas"
            placeholder="Cari nama atau lokasi"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Input
            aria-label="Tanggal jadwal"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </div>

      {!facilities ? (
        <p className="text-sm text-muted-foreground">Memuat fasilitas…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Fasilitas tidak ditemukan.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((facility) => (
            <Card key={facility.id} className="gap-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <IconBuilding
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                    <h2 className="font-heading text-lg font-semibold">
                      {facility.name}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {facility.description}
                  </p>
                </div>
                <Badge
                  variant={
                    facility.status === "active" ? "default" : "secondary"
                  }
                >
                  {facility.status === "active" ? "Aktif" : "Perawatan"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <IconMapPin className="size-4" /> {facility.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <IconUsers className="size-4" /> {facility.capacity} orang
                </span>
                <span>{facility.type}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={facility.status !== "active"}
                onClick={() =>
                  setSelectedId(selectedId === facility.id ? null : facility.id)
                }
              >
                {selectedId === facility.id ? "Tutup jadwal" : "Lihat jadwal"}
              </Button>
              {selectedId === facility.id && (
                <Availability facilityId={facility.id} date={date} />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
