"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useAppQuery as useQuery } from "@/lib/data-hooks"
import {
  IconArrowRight,
  IconCalendar,
  IconChevronDown,
  IconMapPin,
  IconSearch,
  IconUsers,
  IconX,
} from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Skeleton } from "@/components/ui/skeleton"
import { facilityIllustration } from "@/lib/facility-illustrations"

const jakartaTime = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
})

function dateInJakarta(offset = 0) {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000)
  now.setUTCDate(now.getUTCDate() + offset)
  return now.toISOString().slice(0, 10)
}

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

function FacilitiesSkeleton() {
  return (
    <div
      className="public-facilities-grid"
      aria-live="polite"
      aria-label="Memuat daftar fasilitas"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div className="public-facility-card" key={index} aria-hidden="true">
          <Skeleton className="!h-48 !rounded-none motion-reduce:animate-none" />
          <div className="flex flex-col gap-4 p-5">
            <Skeleton className="h-3 w-20 motion-reduce:animate-none" />
            <Skeleton className="h-6 w-3/4 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-full motion-reduce:animate-none" />
            <Skeleton className="h-4 w-2/3 motion-reduce:animate-none" />
            <Skeleton className="mt-3 h-10 w-full motion-reduce:animate-none" />
          </div>
        </div>
      ))}
      <span className="sr-only">Memuat fasilitas…</span>
    </div>
  )
}

function Availability({
  facilityId,
  date,
}: {
  facilityId: Id<"facilities">
  date: string
}) {
  const range = useMemo(() => dayRange(date), [date])
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
        return {
          label: jakartaTime.format(startAt),
          booked: availability?.reservations.some(
            (item) => item.startAt < endAt && startAt < item.endAt
          ),
        }
      }),
    [availability, range.start]
  )

  if (!availability) {
    return (
      <div
        className="grid grid-cols-4 gap-2 sm:grid-cols-6"
        aria-live="polite"
        aria-label="Memuat jadwal"
      >
        {Array.from({ length: 12 }, (_, index) => (
          <Skeleton
            key={index}
            className="h-9 rounded-lg motion-reduce:animate-none"
            aria-hidden="true"
          />
        ))}
      </div>
    )
  }

  const availableCount = slots.filter((slot) => !slot.booked).length

  return (
    <div className="public-facility-schedule">
      <div className="public-facility-schedule-heading">
        <span className="font-semibold">Jadwal 07.00–20.00 WIB</span>
        <span>{availableCount} dari 26 slot tersedia</span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {slots.map((slot) => (
          <span
            key={slot.label}
            className={
              slot.booked
                ? "public-facility-slot public-facility-slot-booked"
                : "public-facility-slot public-facility-slot-open"
            }
            title={
              slot.booked
                ? `${slot.label} sudah dipesan`
                : `${slot.label} tersedia`
            }
          >
            {slot.label}
          </span>
        ))}
      </div>
      <div className="public-facility-schedule-footer">
        <span>
          <i className="public-facility-dot public-facility-dot-open" />{" "}
          Tersedia
        </span>
        <span>
          <i className="public-facility-dot public-facility-dot-booked" />
          Dipesan
        </span>
        <Link
          href={{
            pathname: "/app/reservations/new",
            query: { facility: facilityId, date },
          }}
        >
          Ajukan reservasi <IconArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

export function PublicFacilities() {
  const facilities = useQuery(api.facilities.listPublic)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Semua")
  const [date, setDate] = useState(() => dateInJakarta(1))
  const [selectedId, setSelectedId] = useState<Id<"facilities"> | null>(null)
  const showSkeleton = useIntentionalSkeleton(facilities === undefined)
  const categories = useMemo(
    () => ["Semua", ...new Set((facilities ?? []).map((item) => item.type))],
    [facilities]
  )
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("id")
    return (facilities ?? []).filter(
      (facility) =>
        (category === "Semua" || facility.type === category) &&
        `${facility.name} ${facility.type} ${facility.location} ${facility.description}`
          .toLocaleLowerCase("id")
          .includes(term)
    )
  }, [facilities, search, category])
  const loading = facilities === undefined || showSkeleton

  return (
    <div className="sthana-container public-facilities-content">
      <div className="public-facilities-intro">
        <div>
          <h1>Fasilitas kampus</h1>
          <p>
            Cari fasilitas dan periksa jadwalnya sebelum mengajukan reservasi.
          </p>
        </div>
        <div className="public-facilities-date">
          <label htmlFor="facility-date">
            <IconCalendar size={17} aria-hidden="true" /> Tanggal jadwal
          </label>
          <input
            id="facility-date"
            type="date"
            min={dateInJakarta()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </div>

      <div className="public-facilities-controls">
        <div className="public-facilities-search">
          <IconSearch size={19} aria-hidden="true" />
          <input
            type="search"
            aria-label="Cari fasilitas"
            placeholder="Cari nama, jenis, atau lokasi"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search ? (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => setSearch("")}
            >
              <IconX size={17} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div
          className="public-facilities-categories"
          aria-label="Filter jenis fasilitas"
        >
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="public-facilities-results" aria-live="polite">
        <span>
          {loading ? "Memuat fasilitas" : `${filtered.length} fasilitas`}
        </span>
        <span>
          {search || category !== "Semua"
            ? "Hasil pencarian"
            : "Daftar fasilitas"}
        </span>
      </div>

      {loading ? (
        showSkeleton ? (
          <FacilitiesSkeleton />
        ) : (
          <div className="public-facilities-loading-space" aria-live="polite">
            <span className="sr-only">Memuat fasilitas…</span>
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="public-facilities-empty">
          <IconSearch size={28} aria-hidden="true" />
          <h2>
            {facilities.length === 0
              ? "Belum ada fasilitas"
              : "Fasilitas tidak ditemukan"}
          </h2>
          {facilities.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setSearch("")
                setCategory("Semua")
              }}
            >
              Hapus filter <IconArrowRight size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="public-facilities-grid">
          {filtered.map((facility) => {
            const illustration = facilityIllustration(
              facility.name,
              facility.type
            )
            const active = facility.status === "active"
            const expanded = selectedId === facility.id

            return (
              <article key={facility.id} className="public-facility-card">
                <div className="public-facility-image">
                  <Image
                    src={illustration.src}
                    alt={illustration.alt}
                    fill
                    sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                  />
                  <span className="public-facility-image-note">Ilustrasi</span>
                  <span
                    className={
                      active
                        ? "public-facility-status"
                        : "public-facility-status public-facility-status-maintenance"
                    }
                  >
                    <i /> {active ? "Aktif" : "Perawatan"}
                  </span>
                </div>
                <div className="public-facility-body">
                  <span className="public-facility-type">{facility.type}</span>
                  <h2>{facility.name}</h2>
                  <p>{facility.description}</p>
                  <div className="public-facility-meta">
                    <span>
                      <IconMapPin size={16} aria-hidden="true" />
                      {facility.location}
                    </span>
                    <span>
                      <IconUsers size={16} aria-hidden="true" />
                      {facility.capacity} orang
                    </span>
                  </div>
                  {active ? (
                    <button
                      type="button"
                      className="public-facility-action"
                      aria-expanded={expanded}
                      aria-controls={`schedule-${facility.id}`}
                      onClick={() =>
                        setSelectedId(expanded ? null : facility.id)
                      }
                    >
                      {expanded ? "Tutup jadwal" : "Lihat jadwal"}
                      <IconChevronDown size={18} aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="public-facility-unavailable">
                      Belum dapat direservasi
                    </span>
                  )}
                </div>
                {expanded && active ? (
                  <div
                    id={`schedule-${facility.id}`}
                    className="public-facility-expanded"
                  >
                    <Availability facilityId={facility.id} date={date} />
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
