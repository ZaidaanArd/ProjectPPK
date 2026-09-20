"use client"

import Link from "next/link"
import { useMemo, useRef, useState, type FormEvent } from "react"
import { useMutation, useQuery } from "convex/react"
import { IconCalendarPlus, IconFilePlus } from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

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
  const reservations = useQuery(api.reservations.listMine)
  const reports = useQuery(api.reports.listMine)
  const [now] = useState(() => Date.now())
  const upcoming = (reservations ?? []).filter(
    (item) => item.status === "approved" && item.endAt > now
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Dashboard pengguna</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan reservasi dan laporan fasilitas Anda.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Reservasi mendatang</p>
          <p className="text-3xl font-bold">{upcoming.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Menunggu persetujuan</p>
          <p className="text-3xl font-bold">
            {
              (reservations ?? []).filter((item) => item.status === "pending")
                .length
            }
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Laporan aktif</p>
          <p className="text-3xl font-bold">
            {
              (reports ?? []).filter((item) =>
                ["pending", "in_progress"].includes(item.status)
              ).length
            }
          </p>
        </Card>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/app/reservations/new" className={buttonVariants()}>
          <IconCalendarPlus aria-hidden="true" /> Ajukan reservasi
        </Link>
        <Link
          href="/app/reports/new"
          className={buttonVariants({ variant: "outline" })}
        >
          <IconFilePlus aria-hidden="true" /> Buat laporan
        </Link>
      </div>
    </div>
  )
}

export function ReservationList() {
  const reservations = useQuery(api.reservations.listMine)
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Reservasi saya</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reservasi dapat dibatalkan paling lambat 1 jam sebelum mulai.
          </p>
        </div>
        <Link href="/app/reservations/new" className={buttonVariants()}>
          Ajukan reservasi
        </Link>
      </div>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      {!reservations ? (
        <p className="text-sm text-muted-foreground">Memuat reservasi…</p>
      ) : reservations.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Belum ada reservasi.
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

export function ReservationForm() {
  const facilities = useQuery(api.facilities.listPublic)
  const createReservation = useMutation(api.reservations.create)
  const [facilityId, setFacilityId] = useState("")
  const [date, setDate] = useState(tomorrow)
  const [startTime, setStartTime] = useState("07:00")
  const [endTime, setEndTime] = useState("08:00")
  const [purpose, setPurpose] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const rangeStart = Date.parse(`${date}T00:00:00+07:00`)
  const availability = useQuery(
    api.facilities.getPublicAvailability,
    facilityId
      ? {
          facilityId: facilityId as Id<"facilities">,
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
    if (!facilityId) return
    setPending(true)
    setMessage("")
    try {
      await createReservation({
        facilityId: facilityId as Id<"facilities">,
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
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Ajukan reservasi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih slot 30 menit antara pukul 07.00–20.00 WIB.
        </p>
      </div>
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="facility">Fasilitas</Label>
            <select
              id="facility"
              value={facilityId}
              onChange={(event) => setFacilityId(event.target.value)}
              required
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Pilih fasilitas</option>
              {(facilities ?? [])
                .filter((item) => item.status === "active")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {item.location}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
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
          <div className="space-y-1.5">
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
          <Button type="submit" disabled={pending || conflict}>
            {pending ? "Mengirim…" : "Kirim reservasi"}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export function ReportList() {
  const reports = useQuery(api.reports.listMine)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Laporan saya</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau progres penanganan masalah fasilitas.
          </p>
        </div>
        <Link href="/app/reports/new" className={buttonVariants()}>
          Buat laporan
        </Link>
      </div>
      {!reports ? (
        <p className="text-sm text-muted-foreground">Memuat laporan…</p>
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Belum ada laporan.
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
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              placeholder="Contoh: AC, proyektor, kebersihan"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
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
          <Button type="submit" disabled={pending}>
            {pending ? "Mengirim…" : "Kirim laporan"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
