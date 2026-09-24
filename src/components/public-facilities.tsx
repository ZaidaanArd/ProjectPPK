"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconSearch, IconX } from "@tabler/icons-react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { FacilityGrid } from "@/components/facilities-dashboard/facility-grid"
import { SlotGridModal } from "@/components/facilities-dashboard/slot-grid-modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppQuery as useQuery } from "@/lib/data-hooks"
import { facilityIllustration } from "@/lib/facility-illustrations"
import {
  matchKapasitas,
  type KapasitasFilter,
} from "@/lib/facilities-dashboard/constants"
import type {
  FacilityItem,
  FacilityType,
  TimeSlot,
} from "@/lib/facilities-dashboard/types"

function dayRange(date: string) {
  const start = Date.parse(`${date}T00:00:00+07:00`)
  return { start, end: start + 24 * 60 * 60 * 1000 }
}

function useIntentionalSkeleton(pending: boolean) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!pending) return
    const timer = window.setTimeout(() => setVisible(true), 180)
    return () => window.clearTimeout(timer)
  }, [pending])
  useEffect(() => {
    if (pending || !visible) return
    const timer = window.setTimeout(() => setVisible(false), 360)
    return () => window.clearTimeout(timer)
  }, [pending, visible])
  return visible
}

function FacilitySkeleton() {
  return (
    <div
      aria-label="Memuat fasilitas"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-4xl bg-card pb-6 shadow-md ring-1 ring-foreground/5"
          aria-hidden="true"
        >
          <Skeleton className="aspect-[16/9] w-full rounded-none motion-reduce:animate-none" />
          <div className="space-y-4 px-6 pt-6">
            <Skeleton className="h-5 w-2/3 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-full motion-reduce:animate-none" />
            <Skeleton className="h-4 w-3/4 motion-reduce:animate-none" />
            <Skeleton className="h-10 w-full motion-reduce:animate-none" />
          </div>
        </div>
      ))}
      <span className="sr-only">Memuat fasilitas…</span>
    </div>
  )
}

function PublicSlotDialog({
  facility,
  selectedDate,
  onSelectDate,
  onClose,
}: {
  facility: FacilityItem | null
  selectedDate: string
  onSelectDate: (date: string) => void
  onClose: () => void
}) {
  const router = useRouter()
  const range = useMemo(
    () => (selectedDate ? dayRange(selectedDate) : null),
    [selectedDate]
  )
  const availability = useQuery(
    api.facilities.getPublicAvailability,
    facility && range
      ? {
          facilityId: facility.id as Id<"facilities">,
          rangeStart: range.start,
          rangeEnd: range.end,
        }
      : "skip"
  )
  const liveSlots = useMemo<TimeSlot[] | null | undefined>(() => {
    if (!selectedDate || !range) return undefined
    if (!availability) return null
    return Array.from({ length: 26 }, (_, index) => {
      const startAt = range.start + (7 * 60 + index * 30) * 60_000
      const endAt = startAt + 30 * 60_000
      const startMinutes = 7 * 60 + index * 30
      const endMinutes = startMinutes + 30
      const format = (minutes: number) =>
        `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
      const mulai = format(startMinutes)
      const selesai = format(endMinutes)
      return {
        id: `${mulai}-${selesai}`,
        mulai: mulai.replace(":", "."),
        selesai: selesai.replace(":", "."),
        status:
          availability.facilityStatus !== "active"
            ? "terkunci"
            : availability.reservations.some(
                  (item) => item.startAt < endAt && startAt < item.endAt
                )
              ? "terisi"
              : "tersedia",
      }
    })
  }, [availability, range, selectedDate])
  return (
    <SlotGridModal
      facility={facility}
      bookedIds={[]}
      slotsOverride={liveSlots}
      illustrated
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
      onClose={onClose}
      onPilihSlot={(item, slot, date) => {
        const params = new URLSearchParams({
          facility: item.id,
          date,
          slot: slot.id,
        })
        router.push(`/app/reservations/new?${params.toString()}`)
      }}
    />
  )
}

export function PublicFacilities() {
  const facilities = useQuery(api.facilities.listPublic)
  const [search, setSearch] = useState("")
  const [type, setType] = useState("semua")
  const [status, setStatus] = useState("semua")
  const [location, setLocation] = useState("semua")
  const [capacity, setCapacity] = useState<KapasitasFilter>("semua")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const showSkeleton = useIntentionalSkeleton(facilities === undefined)
  const types = useMemo(
    () => [...new Set((facilities ?? []).map((item) => item.type))].sort(),
    [facilities]
  )
  const locations = useMemo(
    () => [...new Set((facilities ?? []).map((item) => item.location))].sort(),
    [facilities]
  )
  const cards = useMemo<FacilityItem[]>(
    () =>
      (facilities ?? []).map((item) => {
        const illustration = facilityIllustration(item.name, item.type)
        return {
          id: item.id,
          nama: item.name,
          tipe: item.type as FacilityType,
          lokasi: item.location,
          kapasitas: item.capacity,
          deskripsi: item.description,
          fotoUrl: illustration.src,
          photos: [
            {
              id: `${item.id}-illustration`,
              url: illustration.src,
              alt: illustration.alt,
              sortOrder: 0,
            },
          ],
          status: item.status === "active" ? "Aktif" : "Dalam Perbaikan",
        }
      }),
    [facilities]
  )
  const selected = cards.find((item) => item.id === selectedId) ?? null
  const filtered = cards.filter((item) => {
    const term = search.trim().toLocaleLowerCase("id")
    return (
      (!term ||
        `${item.nama} ${item.tipe} ${item.lokasi} ${item.deskripsi}`
          .toLocaleLowerCase("id")
          .includes(term)) &&
      (type === "semua" || item.tipe === type) &&
      (status === "semua" || item.status === status) &&
      (location === "semua" || item.lokasi === location) &&
      matchKapasitas(item.kapasitas, capacity)
    )
  })
  function resetFilters() {
    setSearch("")
    setType("semua")
    setStatus("semua")
    setLocation("semua")
    setCapacity("semua")
  }
  const loading = facilities === undefined || showSkeleton

  return (
    <div className="sthana-container public-facilities-content space-y-5">
      <div className="public-facilities-intro">
        <div>
          <h1>Fasilitas kampus</h1>
          <p>
            Cari fasilitas dan periksa jadwalnya sebelum mengajukan reservasi.
          </p>
        </div>
      </div>
      <section
        aria-label="Filter fasilitas"
        className="rounded-4xl bg-card p-5 shadow-md ring-1 ring-foreground/5 sm:p-6 dark:ring-foreground/10"
      >
        <div className="relative">
          <IconSearch
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, jenis, atau lokasi"
            aria-label="Cari fasilitas"
            className="pr-10 pl-10"
          />
          {search && (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => setSearch("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX size={16} />
            </button>
          )}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="grid gap-2">
            <Label id="public-type-label">Tipe</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value ?? "semua")}
            >
              <SelectTrigger
                aria-labelledby="public-type-label"
                className="w-full"
              >
                <SelectValue>
                  {(value: string | null) =>
                    value === "semua" ? "Semua tipe" : value
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua tipe</SelectItem>
                {types.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label id="public-status-label">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value ?? "semua")}
            >
              <SelectTrigger
                aria-labelledby="public-status-label"
                className="w-full"
              >
                <SelectValue>
                  {(value: string | null) =>
                    value === "semua" ? "Semua status" : value
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua status</SelectItem>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Dalam Perbaikan">Dalam Perbaikan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label id="public-location-label">Lokasi</Label>
            <Select
              value={location}
              onValueChange={(value) => setLocation(value ?? "semua")}
            >
              <SelectTrigger
                aria-labelledby="public-location-label"
                className="w-full"
              >
                <SelectValue>
                  {(value: string | null) =>
                    value === "semua" ? "Semua lokasi" : value
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua lokasi</SelectItem>
                {locations.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label id="public-capacity-label">Kapasitas</Label>
            <Select
              value={capacity}
              onValueChange={(value) =>
                setCapacity((value ?? "semua") as KapasitasFilter)
              }
            >
              <SelectTrigger
                aria-labelledby="public-capacity-label"
                className="w-full"
              >
                <SelectValue>
                  {(value: string | null) =>
                    ({
                      semua: "Semua kapasitas",
                      kecil: "< 30 orang",
                      sedang: "30–100 orang",
                      besar: "> 100 orang",
                    })[value ?? "semua"]
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua kapasitas</SelectItem>
                <SelectItem value="kecil">&lt; 30 orang</SelectItem>
                <SelectItem value="sedang">30–100 orang</SelectItem>
                <SelectItem value="besar">&gt; 100 orang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {loading ? "Memuat fasilitas…" : `${filtered.length} fasilitas`}
      </p>
      {loading ? (
        showSkeleton ? (
          <FacilitySkeleton />
        ) : (
          <div className="min-h-[430px]" aria-label="Memuat fasilitas" />
        )
      ) : (
        <FacilityGrid
          facilities={filtered}
          viewerRole="pengguna"
          illustrated
          onCekSlot={(item) => {
            setSelectedDate("")
            setSelectedId(item.id)
          }}
          onEdit={() => {}}
          onToggleNonaktif={() => {}}
          onToggleMaintenance={() => {}}
          onReset={resetFilters}
        />
      )}
      <p className="text-xs text-muted-foreground">
        Gambar merupakan ilustrasi fasilitas.
      </p>
      <PublicSlotDialog
        facility={selected}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}
