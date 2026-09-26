"use client"

import Link from "next/link"
import { useMemo, useRef, useState, type FormEvent } from "react"
import {
  useAppMutation as useMutation,
  useAppQuery as useQuery,
} from "@/lib/data-hooks"
import { isStaticMode } from "@/lib/data-mode"
import { saveStaticPhoto } from "@/lib/static-data"
import {
  IconBuilding,
  IconCalendarCheck,
  IconCalendarPlus,
  IconClockHour4,
  IconFileAlert,
  IconFilePlus,
  IconMapPin,
  IconPhoto,
  IconSearch,
  IconTool,
  IconUpload,
} from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { BackLink } from "@/components/back-link"
import { DashboardMetricCard } from "@/components/dashboard-metric-card"
import {
  DashboardEmptyHint,
  DashboardSectionHeader,
  DashboardSkeletonRows,
  statusBadgeClass,
} from "@/components/dashboard-sections"
import { FacilitySelectionCard } from "@/components/facility-selection-card"
import { PortalPageHeader } from "@/components/portal-page-header"
import { PortalListSkeleton } from "@/components/portal-skeletons"
import { ReservationDatePicker } from "@/components/reservation-date-picker"
import { SthaniFace } from "@/components/sthani-face"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
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

type ReservationTab = "menunggu" | "disetujui" | "riwayat"

const reservationTabLabels: Record<ReservationTab, string> = {
  menunggu: "Menunggu",
  disetujui: "Disetujui",
  riwayat: "Riwayat",
}

const reservationTabEmptyMessages: Record<ReservationTab, string> = {
  menunggu: "Belum ada reservasi yang menunggu keputusan.",
  disetujui: "Belum ada reservasi yang disetujui.",
  riwayat: "Belum ada riwayat reservasi.",
}

function reservationMatchesTab(status: string, tab: ReservationTab) {
  if (tab === "menunggu") return status === "pending"
  if (tab === "disetujui") return status === "approved"
  return status === "rejected" || status === "cancelled"
}

type ReportTab = "menunggu" | "ditangani" | "riwayat"

const reportTabLabels: Record<ReportTab, string> = {
  menunggu: "Menunggu",
  ditangani: "Ditangani",
  riwayat: "Riwayat",
}

const reportTabEmptyMessages: Record<ReportTab, string> = {
  menunggu: "Belum ada laporan yang menunggu tindak lanjut.",
  ditangani: "Tidak ada laporan yang sedang ditangani.",
  riwayat: "Belum ada riwayat laporan.",
}

function reportMatchesTab(status: string, tab: ReportTab) {
  if (tab === "menunggu") return status === "pending"
  if (tab === "ditangani") return status === "in_progress"
  return status === "resolved" || status === "rejected"
}

const jakartaDateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})
const jakartaReservationDate = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
})
const jakartaReservationTime = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
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

const reservationTimes = Array.from({ length: 27 }, (_, index) => {
  const hour = 7 + Math.floor(index / 2)
  return `${String(hour).padStart(2, "0")}:${index % 2 ? "30" : "00"}`
})

function displayTime(time: string) {
  return time.replace(":", ".")
}

function displayDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return [hours && `${hours} jam`, remaining && `${remaining} menit`]
    .filter(Boolean)
    .join(" ")
}

const listCardClassName =
  "gap-0 p-5 transition-shadow duration-200 hover:shadow-lg sm:p-6"

function FormStepBadge({ number }: { number: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-pink-200 bg-pink-50 font-sans text-sm font-bold text-pink-700 dark:border-pink-300/20 dark:bg-pink-400/10 dark:text-pink-300"
    >
      {number}
    </span>
  )
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat("id-ID", {
  numeric: "auto",
})

function formatRelativeTime(value: number, now: number) {
  if (!Number.isFinite(value)) {
    return ""
  }
  const minutes = Math.round((value - now) / 60_000)
  if (Math.abs(minutes) < 60) {
    return relativeTimeFormatter.format(minutes, "minute")
  }
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) {
    return relativeTimeFormatter.format(hours, "hour")
  }
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) {
    return relativeTimeFormatter.format(days, "day")
  }
  return relativeTimeFormatter.format(Math.round(days / 30), "month")
}

type DashboardReservation = {
  id: Id<"reservations">
  facilityName: string
  facilityLocation: string
  purpose: string
  startAt: number
  endAt: number
  status: string
  createdAt: number
  updatedAt?: number
}

type DashboardReport = {
  id: Id<"reports">
  facilityName: string
  category: string
  status: string
  createdAt: number
  updatedAt?: number
}

function DashboardUpcomingCard({
  reservations,
  now,
}: {
  reservations: DashboardReservation[] | undefined
  now: number
}) {
  const upcoming = [...(reservations ?? [])]
    .filter((item) => item.status === "approved" && item.endAt > now)
    .sort((a, b) => a.startAt - b.startAt)
    .slice(0, 3)

  return (
    <Card className="gap-4 p-5 sm:p-6">
      <DashboardSectionHeader
        title="Jadwal terdekat"
        href="/app/reservations"
        linkLabel="Lihat semua"
      />
      {!reservations ? (
        <DashboardSkeletonRows />
      ) : upcoming.length === 0 ? (
        <DashboardEmptyHint
          text="Belum ada jadwal terdekat."
          actionHref="/app/reservations/new"
          actionLabel="Ajukan reservasi"
        />
      ) : (
        <ul className="space-y-3">
          {upcoming.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border/70 bg-muted/20 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 font-medium break-words">
                  {item.facilityName}
                </p>
                {jakartaReservationDate.format(item.startAt) ===
                  jakartaReservationDate.format(now) && (
                  <Badge
                    variant="secondary"
                    className="bg-pink-100 text-pink-800 dark:bg-pink-400/15 dark:text-pink-300"
                  >
                    Hari ini
                  </Badge>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <IconCalendarCheck size={16} aria-hidden="true" />
                {jakartaReservationDate.format(item.startAt)} ·{" "}
                {jakartaReservationTime.format(item.startAt)}–
                {jakartaReservationTime.format(item.endAt)} WIB
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <IconMapPin size={14} aria-hidden="true" />
                {item.facilityLocation}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

const reportProgressSteps = ["Menunggu", "Ditangani", "Selesai"] as const

function DashboardActiveReportsCard({
  reports,
}: {
  reports: DashboardReport[] | undefined
}) {
  const active = [...(reports ?? [])]
    .filter(
      (item) => item.status === "pending" || item.status === "in_progress"
    )
    .sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt))
    .slice(0, 3)

  return (
    <Card className="gap-4 p-5 sm:p-6">
      <DashboardSectionHeader
        title="Pelacak laporan aktif"
        href="/app/reports"
        linkLabel="Lihat semua"
      />
      {!reports ? (
        <DashboardSkeletonRows />
      ) : active.length === 0 ? (
        <DashboardEmptyHint
          text="Tidak ada laporan yang sedang diproses."
          actionHref="/app/reports/new"
          actionLabel="Buat laporan"
        />
      ) : (
        <ul className="space-y-3">
          {active.map((item) => {
            const step = item.status === "in_progress" ? 1 : 0
            return (
              <li
                key={item.id}
                className="rounded-2xl border border-border/70 bg-muted/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium break-words">
                      {item.facilityName}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.category}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={statusBadgeClass(item.status)}
                  >
                    {statusLabel[item.status]}
                  </Badge>
                </div>
                <div
                  className="mt-3 grid grid-cols-3 gap-1.5"
                  aria-hidden="true"
                >
                  {reportProgressSteps.map((label, index) => (
                    <span
                      key={label}
                      className={cn(
                        "h-1.5 rounded-full",
                        index <= step ? "bg-pink-500" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Tahap: {reportProgressSteps[step]}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

type DashboardActivityItem = {
  id: string
  kind: "reservation" | "report"
  title: string
  detail: string
  status: string
  at: number
}

function DashboardActivityCard({
  reservations,
  reports,
  now,
}: {
  reservations: DashboardReservation[] | undefined
  reports: DashboardReport[] | undefined
  now: number
}) {
  const activity: DashboardActivityItem[] = [
    ...(reservations ?? []).map((item) => ({
      id: `reservation-${item.id}`,
      kind: "reservation" as const,
      title: item.facilityName,
      detail: item.purpose,
      status: item.status,
      at: item.updatedAt ?? item.createdAt,
    })),
    ...(reports ?? []).map((item) => ({
      id: `report-${item.id}`,
      kind: "report" as const,
      title: item.facilityName,
      detail: item.category,
      status: item.status,
      at: item.updatedAt ?? item.createdAt,
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 5)

  const loading = !reservations || !reports

  return (
    <Card className="gap-4 p-5 sm:p-6">
      <DashboardSectionHeader title="Aktivitas terbaru" />
      {loading ? (
        <DashboardSkeletonRows rows={3} />
      ) : activity.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Belum ada aktivitas.
        </p>
      ) : (
        <ul className="space-y-4">
          {activity.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  item.kind === "reservation"
                    ? "bg-pink-100 text-pink-700 dark:bg-pink-400/15 dark:text-pink-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200"
                )}
              >
                {item.kind === "reservation" ? (
                  <IconCalendarCheck size={18} aria-hidden="true" />
                ) : (
                  <IconFileAlert size={18} aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 font-medium break-words">
                    {item.title}
                  </p>
                  <Badge
                    variant="secondary"
                    className={statusBadgeClass(item.status)}
                  >
                    {statusLabel[item.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {item.detail}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatRelativeTime(item.at, now)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
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
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardUpcomingCard reservations={reservations} now={now} />
        <DashboardActiveReportsCard reports={reports} />
      </div>
      <DashboardActivityCard
        reservations={reservations}
        reports={reports}
        now={now}
      />
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
  const [activeTab, setActiveTab] = useState<ReservationTab>("menunggu")

  const tabCounts = useMemo(() => {
    const counts: Record<ReservationTab, number> = {
      menunggu: 0,
      disetujui: 0,
      riwayat: 0,
    }
    reservations?.forEach((item) => {
      if (item.status === "pending") counts.menunggu += 1
      else if (item.status === "approved") counts.disetujui += 1
      else counts.riwayat += 1
    })
    return counts
  }, [reservations])

  const visibleReservations = useMemo(
    () =>
      reservations?.filter((item) =>
        reservationMatchesTab(item.status, activeTab)
      ),
    [reservations, activeTab]
  )

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
      <header className="relative border-b border-border/70 pb-6 sm:pb-7">
        <IconCalendarPlus
          size={88}
          stroke={1}
          aria-hidden="true"
          className="pointer-events-none absolute top-1 right-4 hidden text-pink-300/35 lg:block dark:text-pink-300/10"
        />
        <div id="reservation-overview" className="max-w-2xl">
          <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-pink-700 uppercase dark:text-pink-300">
            Jadwal penggunaan ruang
          </p>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            Reservasi saya
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Pantau pengajuan dan jadwal pemakaian fasilitas. Reservasi dapat
            dibatalkan paling lambat 1 jam sebelum mulai.
          </p>
        </div>
        <Link
          id="reservation-primary-action"
          href="/app/reservations/new"
          className={buttonVariants({ className: "mt-5 w-fit" })}
        >
          Ajukan reservasi
        </Link>
      </header>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      {!reservations ? (
        <PortalListSkeleton layout="grid" />
      ) : reservations.length === 0 ? (
        <Card className="items-center gap-3 border border-dashed border-border bg-gradient-to-b from-muted/20 to-card px-6 py-10 text-center sm:py-12">
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
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ReservationTab)}
        >
          <TabsList aria-label="Kategori reservasi">
            {(Object.keys(reservationTabLabels) as ReservationTab[]).map(
              (tab) => (
                <TabsTab key={tab} value={tab}>
                  {reservationTabLabels[tab]}
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 justify-center px-1.5 text-xs"
                  >
                    {tabCounts[tab]}
                  </Badge>
                </TabsTab>
              )
            )}
          </TabsList>
          <TabsPanel value={activeTab}>
            {visibleReservations && visibleReservations.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleReservations.map((item) => (
                  <Card
                    key={item.id}
                    className={cn("h-full", listCardClassName)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-heading text-base font-semibold break-words">
                          {item.facilityName}
                        </h2>
                        <p className="mt-1 flex items-start gap-1.5 text-sm break-words text-muted-foreground">
                          <IconMapPin
                            size={16}
                            className="mt-0.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="min-w-0">
                            {item.facilityLocation}
                          </span>
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "shrink-0",
                          item.status === "approved" &&
                            "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"
                        )}
                      >
                        {statusLabel[item.status]}
                      </Badge>
                    </div>
                    <div className="mt-5 rounded-2xl border border-border/70 bg-muted/30 p-3.5">
                      <p className="flex items-start gap-2 text-sm font-medium break-words">
                        <IconCalendarCheck
                          size={18}
                          className="mt-0.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span>
                          {jakartaReservationDate.format(item.startAt)}
                          {jakartaReservationDate.format(item.startAt) !==
                            jakartaReservationDate.format(item.endAt) &&
                            ` – ${jakartaReservationDate.format(item.endAt)}`}
                        </span>
                      </p>
                      <p className="mt-2 flex items-start gap-2 text-sm break-words">
                        <IconClockHour4
                          size={18}
                          className="mt-0.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span>
                          {jakartaReservationTime.format(item.startAt)} –{" "}
                          {jakartaReservationTime.format(item.endAt)} WIB
                        </span>
                      </p>
                    </div>
                    <div className="mt-5 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        Tujuan penggunaan
                      </p>
                      <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {item.purpose}
                      </p>
                    </div>
                    {item.decisionNote && (
                      <div className="mt-4 min-w-0 rounded-xl bg-muted p-3.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          Catatan keputusan
                        </p>
                        <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
                          {item.decisionNote}
                        </p>
                      </div>
                    )}
                    {["pending", "approved"].includes(item.status) && (
                      <div className="mt-auto pt-5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelReservation(item.id)}
                        >
                          Batalkan
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                {reservationTabEmptyMessages[activeTab]}
              </Card>
            )}
          </TabsPanel>
        </Tabs>
      )}
    </div>
  )
}

export function ReservationForm({
  initialFacilityId,
  initialDate,
  initialStartTime,
  initialEndTime,
}: {
  initialFacilityId?: string
  initialDate?: string
  initialStartTime?: string
  initialEndTime?: string
} = {}) {
  const facilities = useQuery(api.facilities.listPublic)
  const createReservation = useMutation(api.reservations.create)
  const [facilityId, setFacilityId] = useState(initialFacilityId ?? "")
  const [facilitySearch, setFacilitySearch] = useState("")
  const [date, setDate] = useState(initialDate ?? tomorrow)
  const [startTime, setStartTime] = useState(initialStartTime ?? "07:00")
  const [endTime, setEndTime] = useState(initialEndTime ?? "08:00")
  const [purpose, setPurpose] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [submittedReservation, setSubmittedReservation] = useState<{
    facilityName: string
    startAt: number
    endAt: number
  } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
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

  function rangeConflicts(start: string, end: string) {
    if (!availability || !start || !end) return false
    const startAt = toTimestamp(date, start)
    const endAt = toTimestamp(date, end)
    return availability.reservations.some(
      (item) => item.startAt < endAt && startAt < item.endAt
    )
  }

  const conflict = rangeConflicts(startTime, endTime)
  const durationMinutes =
    startTime && endTime
      ? (toTimestamp(date, endTime) - toTimestamp(date, startTime)) / 60000
      : 0

  function chooseStartTime(nextStart: string) {
    setStartTime(nextStart)
    if (endTime <= nextStart || rangeConflicts(nextStart, endTime)) {
      setEndTime(
        reservationTimes.find(
          (time) => time > nextStart && !rangeConflicts(nextStart, time)
        ) ?? ""
      )
    }
  }

  function requestSubmit(event: FormEvent) {
    event.preventDefault()
    if (!selectedFacility) {
      setMessage("Pilih fasilitas terlebih dahulu.")
      return
    }
    if (!availability || !endTime || conflict) {
      setMessage("Pilih rentang waktu yang tersedia terlebih dahulu.")
      return
    }
    setMessage("")
    setConfirmOpen(true)
  }

  async function executeSubmit() {
    if (!selectedFacility) return
    setPending(true)
    setMessage("")
    try {
      const startAt = toTimestamp(date, startTime)
      const endAt = toTimestamp(date, endTime)
      await createReservation({
        facilityId: selectedFacility.id,
        purpose,
        startAt,
        endAt,
      })
      setSubmittedReservation({
        facilityName: selectedFacility.name,
        startAt,
        endAt,
      })
      setFacilityId("")
      setFacilitySearch("")
      setDate(tomorrow())
      setStartTime("07:00")
      setEndTime("08:00")
      setPurpose("")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reservasi gagal")
    } finally {
      setPending(false)
    }
  }

  function confirmSubmit() {
    setConfirmOpen(false)
    void executeSubmit()
  }

  return (
    <div className="max-w-5xl space-y-6">
      <BackLink href="/app/reservations" />
      <PortalPageHeader
        eyebrow="Layanan fasilitas"
        title="Ajukan reservasi"
        description="Pilih fasilitas dan waktu yang sesuai. Slot tersedia setiap 30 menit antara pukul 07.00–20.00 WIB."
        icon={IconCalendarPlus}
      />
      <form onSubmit={requestSubmit} className="space-y-6">
        <fieldset className="space-y-5">
          <legend className="font-heading text-xl font-semibold">
            <span className="inline-flex items-center gap-3">
              <FormStepBadge number={1} />
              Pilih fasilitas
            </span>
          </legend>
          <p className="text-sm text-muted-foreground">
            Temukan ruang yang sesuai, lalu tentukan jadwal pemakaiannya.
          </p>
          <div id="reservation-facility-picker" className="relative max-w-md">
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
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleFacilities.map((facility) => (
                <FacilitySelectionCard
                  key={facility.id}
                  facility={facility}
                  radioName="facility"
                  selected={facilityId === facility.id}
                  onSelect={setFacilityId}
                />
              ))}
            </div>
          )}
        </fieldset>
        <div
          id="reservation-schedule"
          className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-3 font-heading font-semibold">
              <FormStepBadge number={2} />
              Jadwal pemakaian
            </h2>
            <span className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">
              Interval 30 menit · WIB
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="reservation-date">Tanggal</Label>
              <ReservationDatePicker value={date} onChange={setDate} />
            </div>
            <div className="space-y-1.5">
              <Label id="reservation-start-label">Jam mulai</Label>
              <Select
                value={startTime}
                onValueChange={(value) => value && chooseStartTime(value)}
                disabled={!selectedFacility || !availability}
              >
                <SelectTrigger
                  aria-labelledby="reservation-start-label"
                  className="h-11 w-full rounded-2xl border border-border bg-background"
                >
                  <SelectValue>
                    {(value: string | null) =>
                      value ? displayTime(value) : "Pilih jam mulai"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {reservationTimes.slice(0, -1).map((time, index) => {
                    const booked = rangeConflicts(
                      time,
                      reservationTimes[index + 1]
                    )
                    return (
                      <SelectItem key={time} value={time} disabled={booked}>
                        {displayTime(time)}
                        {booked ? " · Terisi" : ""}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label id="reservation-end-label">Jam selesai</Label>
              <Select
                value={endTime || null}
                onValueChange={(value) => setEndTime(value ?? "")}
                disabled={!selectedFacility || !availability || !startTime}
              >
                <SelectTrigger
                  aria-labelledby="reservation-end-label"
                  className="h-11 w-full rounded-2xl border border-border bg-background"
                >
                  <SelectValue>
                    {(value: string | null) =>
                      value ? displayTime(value) : "Pilih jam selesai"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {reservationTimes
                    .filter((time) => time > startTime)
                    .map((time) => {
                      const booked = rangeConflicts(startTime, time)
                      return (
                        <SelectItem key={time} value={time} disabled={booked}>
                          {displayTime(time)}
                          {booked ? " · Bentrok" : ""}
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p
              className={cn(
                conflict ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {!selectedFacility
                ? "Pilih fasilitas untuk melihat jam yang tersedia."
                : !availability
                  ? "Memuat ketersediaan jadwal…"
                  : conflict
                    ? "Rentang waktu ini sudah dipakai. Pilih jam lain."
                    : !endTime
                      ? "Pilih rentang waktu yang tersedia."
                      : "Rentang waktu tersedia untuk diajukan."}
            </p>
            {selectedFacility &&
              availability &&
              !conflict &&
              durationMinutes > 0 && (
                <span className="font-medium">
                  Durasi {displayDuration(durationMinutes)}
                </span>
              )}
          </div>
        </div>
        <div
          id="reservation-purpose"
          className="space-y-2 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6"
        >
          <Label
            htmlFor="purpose"
            className="flex items-center gap-3 font-heading font-semibold"
          >
            <FormStepBadge number={3} />
            Tujuan penggunaan
          </Label>
          <Textarea
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
          />
        </div>
        {message && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
        <div className="flex flex-col gap-4 rounded-3xl border border-pink-100 bg-pink-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-pink-300/10 dark:bg-pink-400/5">
          <div className="flex items-center gap-3">
            <FormStepBadge number={4} />
            <p className="text-sm font-medium">
              Periksa kembali, lalu kirim reservasi.
            </p>
          </div>
          <Button
            id="reservation-submit"
            type="submit"
            className="w-full sm:w-auto"
            disabled={
              pending ||
              !selectedFacility ||
              !availability ||
              !endTime ||
              conflict
            }
          >
            {pending ? "Mengirim…" : "Kirim reservasi"}
          </Button>
        </div>
      </form>
      <Dialog
        open={submittedReservation !== null}
        onClose={() => setSubmittedReservation(null)}
        labelledBy="reservation-success-title"
        size="md"
      >
        {submittedReservation && (
          <>
            <div className="-mx-6 -mt-6 mb-6 flex flex-col items-center gap-3 overflow-hidden rounded-t-3xl border-b border-pink-100 bg-[radial-gradient(circle_at_20%_20%,#fce7f3,transparent_55%),linear-gradient(135deg,#fff7fb,#f0fdf4)] px-6 py-5 text-center sm:-mx-7 sm:-mt-7 sm:flex-row sm:gap-5 sm:px-7 sm:text-left dark:border-pink-300/10 dark:bg-[radial-gradient(circle_at_20%_20%,rgba(190,24,93,0.25),transparent_55%),linear-gradient(135deg,#30202c,#1e2924)]">
              <SthaniFace expression="sayang" className="!w-28" />
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-[0.14em] text-pink-700 uppercase dark:text-pink-300">
                  Pengajuan reservasi
                </p>
                <DialogTitle
                  id="reservation-success-title"
                  className="mt-1 font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300"
                >
                  Berhasil dikirim ya!
                </DialogTitle>
                <DialogDescription className="mt-2 leading-relaxed">
                  Reservasimu sudah tercatat. Petugas akan meninjau pengajuan
                  ini.
                </DialogDescription>
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-400/15 dark:text-pink-300">
                  <IconBuilding size={19} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Fasilitas
                  </p>
                  <p className="mt-0.5 font-heading font-semibold break-words">
                    {submittedReservation.facilityName}
                  </p>
                </div>
              </div>
              <div className="border-t border-border/70" />
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-400/15 dark:text-pink-300">
                  <IconCalendarCheck size={19} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Jadwal
                  </p>
                  <p className="mt-0.5 text-sm font-medium">
                    {jakartaReservationDate.format(
                      submittedReservation.startAt
                    )}
                    {jakartaReservationDate.format(
                      submittedReservation.startAt
                    ) !==
                      jakartaReservationDate.format(
                        submittedReservation.endAt
                      ) &&
                      ` – ${jakartaReservationDate.format(submittedReservation.endAt)}`}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {jakartaReservationTime.format(
                      submittedReservation.startAt
                    )}{" "}
                    –{" "}
                    {jakartaReservationTime.format(submittedReservation.endAt)}{" "}
                    WIB
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
              <IconClockHour4
                size={19}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold">
                  Menunggu persetujuan petugas
                </p>
                <p className="mt-0.5 text-xs leading-relaxed opacity-80">
                  Pantau perubahan statusnya di halaman Reservasi saya.
                </p>
              </div>
            </div>
            <DialogFooter className="border-t border-border/70 pt-5 sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setSubmittedReservation(null)}
              >
                Ajukan reservasi lain
              </Button>
              <Link href="/app/reservations" className={buttonVariants()}>
                Lihat reservasi saya
              </Link>
            </DialogFooter>
          </>
        )}
      </Dialog>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-card text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Ajukan reservasi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Pastikan data sudah benar. Pengajuan akan dikirim ke petugas untuk
              ditinjau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedFacility && endTime && (
            <div className="space-y-3 rounded-2xl bg-muted/50 p-4 text-left text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Fasilitas
                </p>
                <p className="mt-0.5 font-medium break-words">
                  {selectedFacility.name}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Jadwal
                </p>
                <p className="mt-0.5 break-words">
                  {jakartaReservationDate.format(toTimestamp(date, startTime))}{" "}
                  ·{" "}
                  {jakartaReservationTime.format(toTimestamp(date, startTime))}–
                  {jakartaReservationTime.format(toTimestamp(date, endTime))}{" "}
                  WIB
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Tujuan
                </p>
                <p className="mt-0.5 break-words whitespace-pre-wrap">
                  {purpose}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              Ya, kirim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function ReportList() {
  const reports = useAuthenticatedQuery(api.reports.listMine, {})
  const [activeTab, setActiveTab] = useState<ReportTab>("menunggu")

  const tabCounts = useMemo(() => {
    const counts: Record<ReportTab, number> = {
      menunggu: 0,
      ditangani: 0,
      riwayat: 0,
    }
    reports?.forEach((report) => {
      if (report.status === "pending") counts.menunggu += 1
      else if (report.status === "in_progress") counts.ditangani += 1
      else counts.riwayat += 1
    })
    return counts
  }, [reports])

  const visibleReports = useMemo(
    () =>
      reports?.filter((report) => reportMatchesTab(report.status, activeTab)),
    [reports, activeTab]
  )

  return (
    <div className="space-y-6">
      <header className="relative border-b border-border/70 pb-6 sm:pb-7">
        <IconFilePlus
          size={88}
          stroke={1}
          aria-hidden="true"
          className="pointer-events-none absolute top-1 right-4 hidden text-pink-300/35 lg:block dark:text-pink-300/10"
        />
        <div id="report-overview" className="max-w-2xl">
          <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-pink-700 uppercase dark:text-pink-300">
            Tindak lanjut fasilitas
          </p>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            Laporan saya
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Lihat laporan kendala fasilitas dan pantau progres penanganannya.
          </p>
        </div>
        <Link
          id="report-primary-action"
          href="/app/reports/new"
          className={buttonVariants({ className: "mt-5 w-fit" })}
        >
          Buat laporan
        </Link>
      </header>
      {!reports ? (
        <PortalListSkeleton layout="grid" />
      ) : reports.length === 0 ? (
        <Card className="items-center gap-3 border border-dashed border-border bg-gradient-to-b from-muted/20 to-card px-6 py-10 text-center sm:py-12">
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
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ReportTab)}
        >
          <TabsList aria-label="Kategori laporan">
            {(Object.keys(reportTabLabels) as ReportTab[]).map((tab) => (
              <TabsTab key={tab} value={tab}>
                {reportTabLabels[tab]}
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 justify-center px-1.5 text-xs"
                >
                  {tabCounts[tab]}
                </Badge>
              </TabsTab>
            ))}
          </TabsList>
          <TabsPanel value={activeTab}>
            {visibleReports && visibleReports.length > 0 ? (
              <div className="grid items-start gap-4 lg:grid-cols-2">
                {visibleReports.map((report) => (
                  <Card key={report.id} className={listCardClassName}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-heading text-base font-semibold break-words">
                          {report.facilityName}
                        </h2>
                        <p className="mt-1 text-sm break-words text-muted-foreground">
                          {report.category}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {statusLabel[report.status]}
                      </Badge>
                    </div>
                    <div className="mt-5 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        Deskripsi laporan
                      </p>
                      <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {report.description}
                      </p>
                    </div>
                    {report.photoUrl && (
                      <div className="mt-4 flex min-h-40 items-center justify-center rounded-xl bg-muted/30 p-2">
                        {/* Uploaded images are user-provided and served from Convex storage. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={report.photoUrl}
                          alt="Foto laporan fasilitas"
                          className="block max-h-72 w-full rounded-lg object-contain"
                        />
                      </div>
                    )}
                    {report.resolutionNote && (
                      <div className="mt-4 min-w-0 rounded-xl bg-muted p-3.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          Catatan penanganan
                        </p>
                        <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
                          {report.resolutionNote}
                        </p>
                      </div>
                    )}
                    <div className="mt-auto pt-5">
                      <p className="text-xs text-muted-foreground">
                        Dilaporkan {formatDate(report.createdAt)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                {reportTabEmptyMessages[activeTab]}
              </Card>
            )}
          </TabsPanel>
        </Tabs>
      )}
    </div>
  )
}

export function ReportForm() {
  const facilities = useQuery(api.facilities.listPublic)
  const generateUploadUrl = useMutation(api.reports.generateUploadUrl)
  const createReport = useMutation(api.reports.create)
  const [facilityId, setFacilityId] = useState("")
  const [facilitySearch, setFacilitySearch] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [submittedReport, setSubmittedReport] = useState<{
    facilityName: string
    category: string
  } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const selectedFacility = facilities?.find(
    (facility) => facility.id === facilityId
  )
  const searchTerm = facilitySearch.trim().toLowerCase()
  const visibleFacilities = (facilities ?? []).filter(
    (facility) =>
      facility.id === facilityId ||
      `${facility.name} ${facility.type} ${facility.location}`
        .toLowerCase()
        .includes(searchTerm)
  )

  function requestSubmit(event: FormEvent) {
    event.preventDefault()
    if (!selectedFacility) {
      setMessage("Pilih fasilitas yang ingin dilaporkan terlebih dahulu.")
      return
    }
    setMessage("")
    setConfirmOpen(true)
  }

  async function executeSubmit() {
    if (!selectedFacility) return
    setPending(true)
    setMessage("")
    try {
      let photoStorageId: Id<"_storage"> | undefined
      if (photo) {
        if (isStaticMode) {
          photoStorageId = (await saveStaticPhoto(photo)) as Id<"_storage">
        } else {
          const uploadUrl = await generateUploadUrl()
          const upload = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": photo.type },
            body: photo,
          })
          if (!upload.ok) throw new Error("Unggah foto gagal")
          const uploaded = (await upload.json()) as {
            storageId: Id<"_storage">
          }
          photoStorageId = uploaded.storageId
        }
      }
      await createReport({
        facilityId: selectedFacility.id,
        category,
        description,
        photoStorageId,
        photoName: photo?.name,
      })
      setSubmittedReport({
        facilityName: selectedFacility.name,
        category: category.trim(),
      })
      setFacilityId("")
      setFacilitySearch("")
      setCategory("")
      setDescription("")
      setPhoto(null)
      formRef.current?.reset()
      if (photoInputRef.current) photoInputRef.current.value = ""
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Laporan gagal dikirim"
      )
    } finally {
      setPending(false)
    }
  }

  function confirmSubmit() {
    setConfirmOpen(false)
    void executeSubmit()
  }

  return (
    <div className="max-w-5xl space-y-6">
      <BackLink href="/app/reports" />
      <PortalPageHeader
        eyebrow="Layanan fasilitas"
        title="Buat laporan fasilitas"
        description="Ceritakan kendala yang kamu temui. Sertakan foto bila membantu petugas memahami masalah."
        icon={IconFilePlus}
      />
      <form ref={formRef} onSubmit={requestSubmit} className="space-y-6">
        <fieldset id="report-facility-field" className="space-y-5">
          <legend className="font-heading text-xl font-semibold">
            <span className="inline-flex items-center gap-3">
              <FormStepBadge number={1} />
              Pilih fasilitas
            </span>
          </legend>
          <p className="text-sm text-muted-foreground">
            Pilih fasilitas yang mengalami kendala, lalu jelaskan masalahnya.
          </p>
          <div id="report-facility-picker" className="relative max-w-md">
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
          ) : facilities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada fasilitas yang dapat dilaporkan.
            </p>
          ) : visibleFacilities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Fasilitas tidak ditemukan.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleFacilities.map((facility) => (
                <FacilitySelectionCard
                  key={facility.id}
                  facility={facility}
                  radioName="report-facility"
                  selected={facilityId === facility.id}
                  onSelect={setFacilityId}
                />
              ))}
            </div>
          )}
        </fieldset>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <section className="min-w-0 space-y-5 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-3 font-heading font-semibold">
              <FormStepBadge number={2} />
              Rincian kendala
            </h2>
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
          </section>
          <div className="flex min-w-0 flex-col gap-3 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
            <Label
              htmlFor="photo"
              className="flex items-center gap-3 font-heading font-semibold"
            >
              <FormStepBadge number={3} />
              Foto pendukung (opsional)
            </Label>
            <input
              ref={photoInputRef}
              id="photo"
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const selectedPhoto = e.target.files?.[0] ?? null
                if (
                  selectedPhoto &&
                  (selectedPhoto.size > 5 * 1024 * 1024 ||
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      selectedPhoto.type
                    ))
                ) {
                  setPhoto(null)
                  setMessage(
                    "Foto harus berformat JPG, PNG, atau WebP dan maksimal 5 MB."
                  )
                  e.currentTarget.value = ""
                  return
                }
                setPhoto(selectedPhoto)
                setMessage("")
              }}
            />
            <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-dashed border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch 2xl:flex-row 2xl:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <IconPhoto aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {photo ? photo.name : "Belum ada foto dipilih"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {photo
                      ? `${(photo.size / 1024 / 1024).toFixed(1)} MB · Siap diunggah`
                      : "JPG, PNG, atau WebP · Maksimal 5 MB"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto lg:w-full 2xl:w-auto"
                disabled={pending}
                onClick={() => photoInputRef.current?.click()}
              >
                <IconUpload aria-hidden="true" />
                {photo ? "Ganti foto" : "Pilih foto"}
              </Button>
            </div>
          </div>
        </div>
        {message && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
        <div className="flex flex-col gap-4 rounded-3xl border border-pink-100 bg-pink-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-pink-300/10 dark:bg-pink-400/5">
          <div className="flex items-center gap-3">
            <FormStepBadge number={4} />
            <p className="text-sm font-medium">
              Periksa kembali, lalu kirim laporan.
            </p>
          </div>
          <Button
            id="report-submit"
            type="submit"
            className="w-full sm:w-auto"
            disabled={pending || !selectedFacility}
          >
            {pending ? "Mengirim…" : "Kirim laporan"}
          </Button>
        </div>
      </form>
      <Dialog
        open={submittedReport !== null}
        onClose={() => setSubmittedReport(null)}
        labelledBy="report-success-title"
        size="md"
      >
        {submittedReport && (
          <>
            <div className="-mx-6 -mt-6 mb-6 flex flex-col items-center gap-3 overflow-hidden rounded-t-3xl border-b border-pink-100 bg-[radial-gradient(circle_at_20%_20%,#fce7f3,transparent_55%),linear-gradient(135deg,#fff7fb,#f0fdf4)] px-6 py-5 text-center sm:-mx-7 sm:-mt-7 sm:flex-row sm:gap-5 sm:px-7 sm:text-left dark:border-pink-300/10 dark:bg-[radial-gradient(circle_at_20%_20%,rgba(190,24,93,0.25),transparent_55%),linear-gradient(135deg,#30202c,#1e2924)]">
              <SthaniFace expression="sayang" className="!w-28" />
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-[0.14em] text-pink-700 uppercase dark:text-pink-300">
                  Laporan fasilitas
                </p>
                <DialogTitle
                  id="report-success-title"
                  className="mt-1 font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300"
                >
                  Berhasil dikirim ya!
                </DialogTitle>
                <DialogDescription className="mt-2 leading-relaxed">
                  Laporanmu sudah tercatat. Petugas akan meninjau kendala ini.
                </DialogDescription>
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-400/15 dark:text-pink-300">
                  <IconBuilding size={19} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Fasilitas
                  </p>
                  <p className="mt-0.5 font-heading font-semibold break-words">
                    {submittedReport.facilityName}
                  </p>
                </div>
              </div>
              <div className="border-t border-border/70" />
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-400/15 dark:text-pink-300">
                  <IconTool size={19} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Kategori kendala
                  </p>
                  <p className="mt-0.5 text-sm font-medium break-words">
                    {submittedReport.category}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
              <IconClockHour4
                size={19}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold">
                  Menunggu penanganan petugas
                </p>
                <p className="mt-0.5 text-xs leading-relaxed opacity-80">
                  Pantau perkembangannya di halaman Laporan saya.
                </p>
              </div>
            </div>
            <DialogFooter className="border-t border-border/70 pt-5 sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setSubmittedReport(null)}
              >
                Buat laporan lain
              </Button>
              <Link href="/app/reports" className={buttonVariants()}>
                Lihat laporan saya
              </Link>
            </DialogFooter>
          </>
        )}
      </Dialog>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-card text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim laporan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Pastikan data sudah benar. Laporan akan dikirim ke petugas untuk
              ditindaklanjuti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedFacility && (
            <div className="space-y-3 rounded-2xl bg-muted/50 p-4 text-left text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Fasilitas
                </p>
                <p className="mt-0.5 font-medium break-words">
                  {selectedFacility.name}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Kategori
                </p>
                <p className="mt-0.5 break-words">{category}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Deskripsi
                </p>
                <p className="mt-0.5 break-words whitespace-pre-wrap">
                  {description}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Foto
                </p>
                <p className="mt-0.5 break-words">
                  {photo ? photo.name : "Tanpa foto"}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              Ya, kirim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
