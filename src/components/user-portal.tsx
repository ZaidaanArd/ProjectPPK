"use client"

import Link from "next/link"
import { useMemo, useRef, useState, type FormEvent } from "react"
import { useMutation, useQuery } from "convex/react"
import {
  IconBuilding,
  IconCalendarCheck,
  IconCalendarPlus,
  IconCheck,
  IconClockHour4,
  IconFilePlus,
  IconMapPin,
  IconSearch,
  IconTool,
  IconUsers,
} from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { DashboardMetricCard } from "@/components/dashboard-metric-card"
import { PortalListSkeleton } from "@/components/portal-skeletons"
import { SthaniFace } from "@/components/sthani-face"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"

const statusLabel: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  in_progress: "Ditangani",
  resolved: "Selesai",
}

const jakartaDateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})

function formatDate(value: number) {
  return jakartaDateTime.format(value)
}

function tomorrow() {
  const date = new Date(Date.now() + 7 * 60 * 60 * 1000)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

function toTimestamp(date: string, time: string) {
  return Date.parse(`${date}T${time}:00+07:00`)
}

export function UserDashboard() {
  const reservations = useAuthenticatedQuery(api.reservations.listMine, {})
  const reports = useAuthenticatedQuery(api.reports.listMine, {})
  const [now] = useState(() => Date.now())
  const upcoming = (reservations ?? []).filter(
    (item) => item.status === "approved" && item.endAt > now
  )

  return (
    <div className="space-y-7">
      <div
        id="portal-home-summary"
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#b00055] uppercase dark:text-pink-300">
            Portal pengguna
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Aktivitas kampus Anda
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pantau reservasi dan laporan fasilitas dari satu tempat.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs text-muted-foreground shadow-sm dark:bg-card">
          <span className="size-2 rounded-full bg-emerald-500" />
          Data diperbarui otomatis
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardMetricCard
          label="Reservasi mendatang"
          value={reservations ? upcoming.length : undefined}
          description="Jadwal yang sudah disetujui dan belum selesai."
          icon={IconCalendarCheck}
          tone="berry"
        />
        <DashboardMetricCard
          label="Menunggu persetujuan"
          value={
            reservations
              ? reservations.filter((item) => item.status === "pending").length
              : undefined
          }
          description="Pengajuan yang sedang diperiksa petugas."
          icon={IconClockHour4}
          tone="amber"
        />
        <DashboardMetricCard
          label="Laporan aktif"
          value={
            reports
              ? reports.filter((item) =>
                  ["pending", "in_progress"].includes(item.status)
                ).length
              : undefined
          }
          description="Kendala yang belum dinyatakan selesai."
          icon={IconTool}
          tone="pink"
        />
      </div>
      <Card className="border-0 bg-gradient-to-br from-[#52082b] via-[#8e0045] to-[#d00064] p-6 text-white shadow-[0_18px_50px_rgba(82,8,43,0.2)] ring-0 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-heading text-xl font-bold">Mulai dari sini</h2>
            <p className="mt-1 text-sm text-pink-100/80">
              Ajukan kebutuhan ruang atau beri tahu petugas jika ada kendala.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              id="portal-find-facilities"
              href="/facilities"
              className={buttonVariants({
                variant: "outline",
                className:
                  "border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white",
              })}
            >
              <IconSearch aria-hidden="true" /> Cari fasilitas
            </Link>
            <Link
              id="portal-reservation-action"
              href="/app/reservations/new"
              className={buttonVariants({
                className:
                  "!bg-white !text-[#8e0045] hover:!bg-pink-50 hover:!text-[#8e0045]",
              })}
            >
              <IconCalendarPlus aria-hidden="true" /> Ajukan reservasi
            </Link>
            <Link
              id="portal-report-action"
              href="/app/reports/new"
              className={buttonVariants({
                variant: "outline",
                className:
                  "border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white",
              })}
            >
              <IconFilePlus aria-hidden="true" /> Buat laporan
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function ReservationList() {
  const reservations = useAuthenticatedQuery(api.reservations.listMine, {})
  const cancel = useMutation(api.reservations.cancelMine)
  const [message, setMessage] = useState("")

  async function cancelReservation(id: Id<"reservations">) {
    setMessage("")
    try {
      await cancel({ reservationId: id })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pembatalan gagal")
    }
  }

  return (
    <div className="space-y-6">
      <div
        id="reservation-overview"
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold">Reservasi saya</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reservasi dapat dibatalkan paling lambat 1 jam sebelum mulai.
          </p>
        </div>
        <Link
          id="reservation-primary-action"
          href="/app/reservations/new"
          className={buttonVariants()}
        >
          Ajukan reservasi
        </Link>
      </div>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      {!reservations ? (
        <PortalListSkeleton />
      ) : reservations.length === 0 ? (
        <Card className="items-center gap-3 border border-dashed border-pink-200/80 bg-gradient-to-b from-pink-50/50 to-card px-6 py-10 text-center sm:py-12 dark:border-pink-300/15 dark:from-pink-400/5">
          <SthaniFace expression="senang" className="!w-28" />
          <h2 className="mt-2 font-heading text-xl font-bold">
            Belum ada reservasi
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Pilih fasilitas dan waktu untuk mengajukan reservasi pertama.
          </p>
          <Link
            href="/app/reservations/new"
            className={buttonVariants({ className: "mt-3" })}
          >
            Ajukan reservasi
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {reservations.map((item) => (
            <Card key={item.id} className="gap-3 p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{item.facilityName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {item.facilityLocation}
                  </p>
                </div>
                <Badge
                  variant={item.status === "approved" ? "default" : "secondary"}
                >
                  {statusLabel[item.status]}
                </Badge>
              </div>
              <p className="text-sm">
                {formatDate(item.startAt)} – {formatDate(item.endAt)}
              </p>
              <p className="text-sm text-muted-foreground">{item.purpose}</p>
              {item.decisionNote && (
                <p className="rounded-lg bg-muted p-3 text-sm">
                  {item.decisionNote}
                </p>
              )}
              {["pending", "approved"].includes(item.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => cancelReservation(item.id)}
                >
                  Batalkan
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function ReservationForm({
  initialFacilityId,
  initialDate,
}: {
  initialFacilityId?: string
  initialDate?: string
} = {}) {
  const facilities = useQuery(api.facilities.listPublic)
  const createReservation = useMutation(api.reservations.create)
  const [facilityId, setFacilityId] = useState(initialFacilityId ?? "")
  const [facilitySearch, setFacilitySearch] = useState("")
  const [date, setDate] = useState(initialDate ?? tomorrow)
  const [startTime, setStartTime] = useState("07:00")
  const [endTime, setEndTime] = useState("08:00")
  const [purpose, setPurpose] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const availableFacilities = (facilities ?? []).filter(
    (facility) => facility.status === "active"
  )
  const selectedFacility = availableFacilities.find(
    (facility) => facility.id === facilityId
  )
  const searchTerm = facilitySearch.trim().toLowerCase()
  const visibleFacilities = availableFacilities.filter(
    (facility) =>
      facility.id === facilityId ||
      `${facility.name} ${facility.type} ${facility.location}`
        .toLowerCase()
        .includes(searchTerm)
  )
  const rangeStart = Date.parse(`${date}T00:00:00+07:00`)
  const availability = useQuery(
    api.facilities.getPublicAvailability,
    selectedFacility
      ? {
          facilityId: selectedFacility.id,
          rangeStart,
          rangeEnd: rangeStart + 24 * 60 * 60 * 1000,
        }
      : "skip"
  )

  const conflict = useMemo(() => {
    if (!availability) return false
    const startAt = toTimestamp(date, startTime)
    const endAt = toTimestamp(date, endTime)
    return availability.reservations.some(
      (item) => item.startAt < endAt && startAt < item.endAt
    )
  }, [availability, date, endTime, startTime])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selectedFacility) {
      setMessage("Pilih fasilitas terlebih dahulu.")
      return
    }
    setPending(true)
    setMessage("")
    try {
      await createReservation({
        facilityId: selectedFacility.id,
        purpose,
        startAt: toTimestamp(date, startTime),
        endAt: toTimestamp(date, endTime),
      })
      setPurpose("")
      setMessage("Reservasi dikirim dan menunggu persetujuan petugas.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reservasi gagal")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Ajukan reservasi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih slot 30 menit antara pukul 07.00–20.00 WIB.
        </p>
      </div>
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <fieldset className="space-y-4">
            <legend className="font-heading text-base font-semibold">
              Pilih fasilitas
            </legend>
            <div id="reservation-facility-picker" className="relative max-w-sm">
              <IconSearch
                size={18}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                aria-label="Cari fasilitas"
                placeholder="Cari nama atau lokasi"
                value={facilitySearch}
                onChange={(event) => setFacilitySearch(event.target.value)}
                className="pl-10"
              />
            </div>
            {!facilities ? (
              <p className="text-sm text-muted-foreground">Memuat fasilitas…</p>
            ) : availableFacilities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada fasilitas yang dapat direservasi.
              </p>
            ) : visibleFacilities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Fasilitas tidak ditemukan.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleFacilities.map((facility) => {
                  const selected = facilityId === facility.id
                  return (
                    <label
                      key={facility.id}
                      className={cn(
                        "relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-ring",
                        selected
                          ? "border-pink-500 bg-pink-50 ring-1 ring-pink-400/40 dark:border-pink-400 dark:bg-pink-400/10"
                          : "border-border bg-background hover:border-pink-300 hover:bg-pink-50/40 dark:hover:border-pink-500/40 dark:hover:bg-pink-400/5"
                      )}
                    >
                      <input
                        type="radio"
                        name="facility"
                        value={facility.id}
                        checked={selected}
                        onChange={() => setFacilityId(facility.id)}
                        required
                        className="sr-only"
                      />
                      <span className="flex items-start justify-between gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-400/15 dark:text-pink-200">
                          <IconBuilding size={19} aria-hidden="true" />
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="rounded-full bg-pink-50 px-2 py-1 text-[11px] font-medium text-pink-800 dark:bg-pink-400/10 dark:text-pink-200">
                            {facility.type}
                          </span>
                          {selected ? (
                            <IconCheck
                              size={19}
                              className="text-pink-600 dark:text-pink-300"
                              aria-hidden="true"
                            />
                          ) : null}
                        </span>
                      </span>
                      <span className="font-heading font-semibold">
                        {facility.name}
                      </span>
                      <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {facility.description}
                      </span>
                      <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <IconMapPin size={14} aria-hidden="true" />
                          {facility.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <IconUsers size={14} aria-hidden="true" />
                          {facility.capacity} orang
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </fieldset>
          <div id="reservation-schedule" className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="start">Mulai</Label>
              <Input
                id="start"
                type="time"
                min="07:00"
                max="19:30"
                step="1800"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">Selesai</Label>
              <Input
                id="end"
                type="time"
                min="07:30"
                max="20:00"
                step="1800"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          {facilityId && availability && (
            <p
              className={cn(
                "text-sm",
                conflict ? "text-destructive" : "text-emerald-700"
              )}
            >
              {conflict
                ? "Slot bertabrakan dengan reservasi yang sudah disetujui."
                : "Slot belum digunakan."}
            </p>
          )}
          <div id="reservation-purpose" className="space-y-1.5">
            <Label htmlFor="purpose">Tujuan penggunaan</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
            />
          </div>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          <Button
            id="reservation-submit"
            type="submit"
            disabled={pending || conflict}
          >
            {pending ? "Mengirim…" : "Kirim reservasi"}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export function ReportList() {
  const reports = useAuthenticatedQuery(api.reports.listMine, {})

  return (
    <div className="space-y-6">
      <div
        id="report-overview"
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold">Laporan saya</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau progres penanganan masalah fasilitas.
          </p>
        </div>
        <Link
          id="report-primary-action"
          href="/app/reports/new"
          className={buttonVariants()}
        >
          Buat laporan
        </Link>
      </div>
      {!reports ? (
        <PortalListSkeleton />
      ) : reports.length === 0 ? (
        <Card className="items-center gap-3 border border-dashed border-pink-200/80 bg-gradient-to-b from-pink-50/50 to-card px-6 py-10 text-center sm:py-12 dark:border-pink-300/15 dark:from-pink-400/5">
          <SthaniFace expression="ngantuk" className="!w-28" />
          <h2 className="mt-2 font-heading text-xl font-bold">
            Belum ada laporan
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Laporkan kendala fasilitas; progres penanganannya akan tampil di
            sini.
          </p>
          <Link
            href="/app/reports/new"
            className={buttonVariants({ className: "mt-3" })}
          >
            Buat laporan
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="gap-3 p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{report.facilityName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {report.category}
                  </p>
                </div>
                <Badge variant="secondary">{statusLabel[report.status]}</Badge>
              </div>
              <p className="text-sm">{report.description}</p>
              {report.photoUrl && (
                // Uploaded images are user-provided and served from Convex storage.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={report.photoUrl}
                  alt="Foto laporan fasilitas"
                  className="max-h-64 rounded-lg object-cover"
                />
              )}
              {report.resolutionNote && (
                <p className="rounded-lg bg-muted p-3 text-sm">
                  {report.resolutionNote}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDate(report.createdAt)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function ReportForm() {
  const facilities = useQuery(api.facilities.listPublic)
  const generateUploadUrl = useMutation(api.reports.generateUploadUrl)
  const createReport = useMutation(api.reports.create)
  const [facilityId, setFacilityId] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const photoRef = useRef<File | null>(null)
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!facilityId) return
    const form = event.currentTarget as HTMLFormElement
    const photo = photoRef.current
    setPending(true)
    setMessage("")
    try {
      let photoStorageId: Id<"_storage"> | undefined
      if (photo) {
        const uploadUrl = await generateUploadUrl()
        const upload = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": photo.type },
          body: photo,
        })
        if (!upload.ok) throw new Error("Unggah foto gagal")
        const uploaded = (await upload.json()) as { storageId: Id<"_storage"> }
        photoStorageId = uploaded.storageId
      }
      await createReport({
        facilityId: facilityId as Id<"facilities">,
        category,
        description,
        photoStorageId,
        photoName: photo?.name,
      })
      setCategory("")
      setDescription("")
      photoRef.current = null
      form.reset()
      setMessage("Laporan berhasil dikirim.")
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Laporan gagal dikirim"
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Buat laporan fasilitas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sertakan foto bila membantu petugas memahami masalah.
        </p>
      </div>
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div id="report-facility-field" className="space-y-1.5">
            <Label htmlFor="report-facility">Fasilitas</Label>
            <select
              id="report-facility"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              required
            >
              <option value="">Pilih fasilitas</option>
              {(facilities ?? []).map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </div>
          <div id="report-category-field" className="space-y-1.5">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              placeholder="Contoh: AC, proyektor, kebersihan"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          <div id="report-description-field" className="space-y-1.5">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="photo">Foto (opsional, maks. 5 MB)</Label>
            <Input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                photoRef.current = e.target.files?.[0] ?? null
              }}
            />
          </div>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          <Button id="report-submit" type="submit" disabled={pending}>
            {pending ? "Mengirim…" : "Kirim laporan"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
