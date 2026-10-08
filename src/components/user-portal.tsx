"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"
import {
  useAppMutation as useMutation,
  useAppQuery as useQuery,
} from "@/lib/data-hooks"
import { isStaticMode } from "@/lib/data-mode"
import { toastError } from "@/lib/toast"
import { saveStaticPhoto } from "@/lib/static-data"
import { facilityIllustration } from "@/lib/facility-illustrations"
import {
  displayDuration,
  displayTime,
  rangeIsBusy,
  toTimestamp,
} from "@/lib/reservation-slots"
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
  IconShare,
  IconTool,
  IconUpload,
} from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { BackLink } from "@/components/back-link"
import {
  DashboardMetricCard,
  DashboardMetricPanel,
} from "@/components/dashboard-metric-card"
import {
  DashboardEmptyHint,
  DashboardSectionHeader,
  DashboardSkeletonRows,
  statusBadgeClass,
} from "@/components/dashboard-sections"
import { FacilitySelectionCard } from "@/components/facility-selection-card"
import { FormProgress, FormSummaryBar } from "@/components/form-progress"
import { PortalPageHeader } from "@/components/portal-page-header"
import {
  DateBlock,
  ReportTicket,
  ReservationTicket,
} from "@/components/portal-cards"
import { ProgressStepper } from "@/components/ui/progress-stepper"
import { reportSteps } from "@/lib/status-steps"
import { PortalListSkeleton } from "@/components/portal-skeletons"
import { ReservationDatePicker } from "@/components/reservation-date-picker"
import { ShareDialog } from "@/components/share/share-dialog"
import type { ShareSubject } from "@/components/share/share-card"
import { SthaniFace } from "@/components/sthani-face"
import { TimeSlotPicker } from "@/components/time-slot-picker"
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
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  TabsCount,
} from "@/components/ui/tabs"
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

const summaryDate = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
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

/** Pink tebal yang sama dengan state aktif sidebar (nav-main.tsx). */
function dateBlockPinkClass(width: string) {
  return cn(
    width,
    "!bg-[#d00064] !text-white shadow-[0_6px_14px_rgba(208,0,100,0.14)]"
  )
}

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

function wibDayIndex(value: number) {
  return Math.floor((value + WIB_OFFSET_MS) / DAY_MS)
}

/** Jadwal dianggap milik sebuah hari bila rentangnya bersinggungan dengan hari itu. */
function scheduleOverlapsDay(
  item: { startAt: number; endAt: number },
  dayIndex: number
) {
  return (
    wibDayIndex(item.startAt) <= dayIndex &&
    wibDayIndex(item.endAt - 1) >= dayIndex
  )
}

/** Label waktu mulai berbasis tanggal kalender WIB (bukan pembulatan jam). */
function upcomingTimeLabel(startAt: number, now: number) {
  if (startAt <= now) return "Berlangsung"
  const dayDiff = wibDayIndex(startAt) - wibDayIndex(now)
  if (dayDiff <= 0) {
    const minutes = Math.max(1, Math.ceil((startAt - now) / 60_000))
    if (minutes < 60) return `${minutes} menit lagi`
    return `${Math.floor(minutes / 60)} jam lagi`
  }
  if (dayDiff === 1) return "Besok"
  if (dayDiff === 2) return "Lusa"
  return `${dayDiff} hari lagi`
}

function UpcomingStatusBadge({
  startAt,
  now,
}: {
  startAt: number
  now: number
}) {
  const ongoing = startAt <= now
  return (
    <Badge
      variant="secondary"
      className={cn(
        ongoing
          ? "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300"
          : "bg-muted text-muted-foreground"
      )}
    >
      {upcomingTimeLabel(startAt, now)}
    </Badge>
  )
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
    <Card className="gap-4 p-5 shadow-sm sm:p-6 lg:h-full">
      <DashboardSectionHeader
        title="Jadwal terdekat"
        href="/app/reservations"
        linkLabel="Lihat semua"
      />
      {!reservations ? (
        <DashboardSkeletonRows />
      ) : upcoming.length === 0 ? (
        <div className="grid flex-1 content-center">
          <DashboardEmptyHint
            text="Belum ada jadwal terdekat."
            actionHref="/app/reservations/new"
            actionLabel="Ajukan reservasi"
          />
        </div>
      ) : (
        <>
          <ul className="flex flex-1 flex-col gap-3">
            {upcoming.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border border-border/70 p-3"
              >
                <DateBlock
                  at={item.startAt}
                  status={item.status}
                  className={dateBlockPinkClass("w-14")}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="min-w-0 font-semibold break-words">
                      {item.facilityName}
                    </p>
                    <UpcomingStatusBadge startAt={item.startAt} now={now} />
                  </div>
                  <p className="flex items-center gap-1.5 text-sm font-medium tabular-nums">
                    <IconCalendarCheck size={16} aria-hidden="true" />
                    {jakartaReservationTime.format(item.startAt)}–
                    {jakartaReservationTime.format(item.endAt)} WIB
                  </p>
                  <p className="flex items-start gap-1.5 text-xs break-words text-muted-foreground">
                    <IconMapPin size={14} aria-hidden="true" />
                    {item.facilityLocation}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/app/reservations/new"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "mt-auto self-start",
            })}
          >
            <IconCalendarPlus aria-hidden="true" />
            Buat reservasi baru
          </Link>
        </>
      )}
    </Card>
  )
}

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
    <Card className="gap-4 p-5 shadow-sm sm:p-6 lg:h-full">
      <DashboardSectionHeader
        title="Pelacak laporan aktif"
        href="/app/reports"
        linkLabel="Lihat semua"
      />
      {!reports ? (
        <DashboardSkeletonRows />
      ) : active.length === 0 ? (
        <div className="grid flex-1 content-center">
          <DashboardEmptyHint
            text="Tidak ada laporan yang sedang diproses."
            actionHref="/app/reports/new"
            actionLabel="Buat laporan"
          />
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border/70">
            {active.map((item) => {
              return (
                <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold break-words">
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
                  <ProgressStepper
                    className="mt-4"
                    label={`Progres laporan ${item.facilityName}`}
                    steps={reportSteps(item)}
                  />
                </li>
              )
            })}
          </ul>
          <Link
            href="/app/reports/new"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "mt-auto self-start",
            })}
          >
            <IconFilePlus aria-hidden="true" />
            Buat laporan baru
          </Link>
        </>
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

  const today = wibDayIndex(now)
  const groups: { label: string; items: DashboardActivityItem[] }[] = []
  for (const item of activity) {
    const diff = today - wibDayIndex(item.at)
    const label =
      diff <= 0
        ? "Hari ini"
        : diff === 1
          ? "Kemarin"
          : jakartaReservationDate.format(item.at)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }

  const loading = !reservations || !reports

  return (
    <Card className="gap-4 p-5 shadow-sm sm:p-6">
      <DashboardSectionHeader title="Aktivitas terbaru" />
      {loading ? (
        <DashboardSkeletonRows rows={3} />
      ) : activity.length === 0 ? (
        <DashboardEmptyHint text="Belum ada aktivitas." />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h3>
              <ul className="divide-y divide-border/70">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={
                        item.kind === "reservation"
                          ? "/app/reservations"
                          : "/app/reports"
                      }
                      className="-mx-2 flex items-start gap-3 rounded-xl px-2 py-4 transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                    >
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
                          <p className="min-w-0 font-semibold break-words">
                            {item.title}
                          </p>
                          <Badge
                            variant="secondary"
                            className={statusBadgeClass(item.status)}
                          >
                            {statusLabel[item.status]}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm break-words text-muted-foreground">
                          {item.detail}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatRelativeTime(item.at, now)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Card>
  )
}

export function UserDashboard() {
  const reservations = useAuthenticatedQuery(api.reservations.listMine, {})
  const reports = useAuthenticatedQuery(api.reports.listMine, {})
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const refresh = () => setNow(Date.now())
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh()
    }
    const timer = window.setInterval(refresh, 60_000)
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])
  const upcoming = (reservations ?? []).filter(
    (item) => item.status === "approved" && item.endAt > now
  )
  const todayIndex = wibDayIndex(now)
  const scheduleToday = upcoming.filter((item) =>
    scheduleOverlapsDay(item, todayIndex)
  ).length
  const summaryParts = reservations
    ? [scheduleToday > 0 && `${scheduleToday} jadwal hari ini`].filter(Boolean)
    : []

  return (
    <div className="space-y-7">
      <header className="grid gap-5 border-b border-border/70 pb-6 lg:grid-cols-2 lg:items-center">
        <div className="min-w-0 space-y-4">
          <div id="portal-home-summary">
            <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-pink-700 uppercase dark:text-pink-300">
              Portal pengguna
            </p>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">
              Aktivitas kampus Anda
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Pantau reservasi dan laporan fasilitas dari satu tempat.
            </p>
            {summaryParts.length > 0 && (
              <p
                data-testid="portal-home-status"
                className="mt-3 inline-flex flex-wrap items-center gap-x-2 rounded-full bg-pink-100 px-3 py-1 text-sm font-semibold text-[#b00055] dark:bg-pink-400/10 dark:text-pink-200"
              >
                {summaryParts.join(" · ")}
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs text-muted-foreground shadow-sm dark:bg-card">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            Data diperbarui otomatis
          </span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-3 lg:justify-end">
          <Link
            id="portal-reservation-action"
            href="/app/reservations/new"
            className={buttonVariants()}
          >
            <IconCalendarPlus aria-hidden="true" /> Ajukan reservasi
          </Link>
          <Link
            id="portal-report-action"
            href="/app/reports/new"
            className={buttonVariants({
              variant: "outline",
              className:
                "border-transparent bg-background hover:bg-foreground hover:text-background dark:hover:bg-white/15 dark:hover:text-white",
            })}
          >
            <IconFilePlus aria-hidden="true" /> Buat laporan
          </Link>
          <Link
            id="portal-find-facilities"
            href="/facilities"
            className={buttonVariants({
              variant: "ghost",
              className:
                "hover:bg-transparent hover:text-primary dark:hover:bg-transparent",
            })}
          >
            <IconSearch aria-hidden="true" /> Cari fasilitas
          </Link>
        </div>
      </header>
      <DashboardMetricPanel columns={3}>
        <DashboardMetricCard
          label="Reservasi aktif"
          value={reservations ? upcoming.length : undefined}
          description="Reservasi disetujui yang belum selesai."
          icon={IconCalendarCheck}
          href="/app/reservations"
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
          href="/app/reservations"
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
          href="/app/reports"
        />
      </DashboardMetricPanel>
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <DashboardUpcomingCard reservations={reservations} now={now} />
        <DashboardActiveReportsCard reports={reports} />
      </div>
      <DashboardActivityCard
        reservations={reservations}
        reports={reports}
        now={now}
      />
    </div>
  )
}

export function ReservationList() {
  const [shareSubject, setShareSubject] = useState<ShareSubject | null>(null)
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
      toast.success("Reservasi berhasil dibatalkan")
    } catch (error) {
      setMessage(toastError("Pembatalan gagal", error))
    }
  }

  return (
    <div className="space-y-6">
      <ShareDialog
        subject={shareSubject}
        onClose={() => setShareSubject(null)}
      />
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
                  <TabsCount>{tabCounts[tab]}</TabsCount>
                </TabsTab>
              )
            )}
          </TabsList>
          <TabsPanel value={activeTab}>
            {visibleReservations && visibleReservations.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleReservations.map((item) => (
                  <ReservationTicket
                    key={item.id}
                    facilityName={item.facilityName}
                    location={item.facilityLocation}
                    startAt={item.startAt}
                    endAt={item.endAt}
                    status={item.status}
                    statusLabel={statusLabel[item.status] ?? item.status}
                    purpose={item.purpose}
                    decisionNote={item.decisionNote}
                    createdAt={item.createdAt}
                    updatedAt={item.updatedAt}
                  >
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setShareSubject({
                            kind: "reservation",
                            facilityName: item.facilityName,
                            location: item.facilityLocation,
                            startAt: item.startAt,
                            endAt: item.endAt,
                            status: item.status,
                            statusLabel:
                              statusLabel[item.status] ?? item.status,
                            purpose: item.purpose,
                            createdAt: item.createdAt,
                            updatedAt: item.updatedAt,
                          })
                        }
                      >
                        <IconShare aria-hidden="true" />
                        Bagikan
                      </Button>
                      {["pending", "approved"].includes(item.status) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelReservation(item.id)}
                        >
                          Batalkan
                        </Button>
                      ) : null}
                    </div>
                  </ReservationTicket>
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

  const conflict = availability
    ? rangeIsBusy(date, startTime, endTime, availability.reservations)
    : false
  const durationMinutes =
    startTime && endTime
      ? (toTimestamp(date, endTime) - toTimestamp(date, startTime)) / 60000
      : 0
  const scheduleReady = Boolean(
    selectedFacility && availability && endTime && !conflict
  )

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
      toast.success("Reservasi terkirim", {
        description: `${selectedFacility.name} menunggu persetujuan petugas.`,
      })
    } catch (error) {
      setMessage(toastError("Reservasi gagal diajukan", error))
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
      <FormProgress
        label="Progres pengajuan reservasi"
        steps={[
          {
            id: "reservation-facility-picker",
            label: "Fasilitas",
            done: Boolean(selectedFacility),
          },
          {
            id: "reservation-schedule",
            label: "Jadwal",
            done: scheduleReady,
          },
          {
            id: "reservation-purpose",
            label: "Tujuan",
            done: purpose.trim().length > 0,
          },
          { id: "reservation-submit", label: "Kirim", done: false },
        ]}
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
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
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
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="reservation-date">Tanggal</Label>
            <ReservationDatePicker value={date} onChange={setDate} />
          </div>
          <TimeSlotPicker
            date={date}
            busy={availability?.reservations}
            disabled={!selectedFacility || !availability}
            start={startTime}
            end={endTime}
            onChange={({ start, end }) => {
              setStartTime(start)
              setEndTime(end)
            }}
          />
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
        <FormSummaryBar
          image={
            selectedFacility
              ? facilityIllustration(
                  selectedFacility.name,
                  selectedFacility.type
                )
              : undefined
          }
          title={selectedFacility?.name ?? "Belum memilih fasilitas"}
          detail={
            scheduleReady
              ? `${summaryDate.format(toTimestamp(date, startTime))} · ${displayTime(startTime)}–${displayTime(endTime)} WIB · ${displayDuration(durationMinutes)}`
              : "Periksa kembali, lalu kirim reservasi."
          }
        >
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
        </FormSummaryBar>
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
  const [shareSubject, setShareSubject] = useState<ShareSubject | null>(null)
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
      <ShareDialog
        subject={shareSubject}
        onClose={() => setShareSubject(null)}
      />
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
                <TabsCount>{tabCounts[tab]}</TabsCount>
              </TabsTab>
            ))}
          </TabsList>
          <TabsPanel value={activeTab}>
            {visibleReports && visibleReports.length > 0 ? (
              <div className="grid items-start gap-4 lg:grid-cols-2">
                {visibleReports.map((report) => (
                  <ReportTicket
                    key={report.id}
                    facilityName={report.facilityName}
                    category={report.category}
                    description={report.description}
                    photoUrl={report.photoUrl}
                    status={report.status}
                    statusLabel={statusLabel[report.status] ?? report.status}
                    resolutionNote={report.resolutionNote}
                    createdAt={report.createdAt}
                    updatedAt={report.updatedAt}
                    reportedLabel={`Dilaporkan ${formatDate(report.createdAt)}`}
                  >
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setShareSubject({
                          kind: "report",
                          facilityName: report.facilityName,
                          category: report.category,
                          description: report.description,
                          status: report.status,
                          statusLabel:
                            statusLabel[report.status] ?? report.status,
                          createdAt: report.createdAt,
                          updatedAt: report.updatedAt,
                        })
                      }
                    >
                      <IconShare aria-hidden="true" />
                      Bagikan
                    </Button>
                  </ReportTicket>
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
  const detailsReady =
    category.trim().length > 0 && description.trim().length > 0
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
      toast.success("Laporan terkirim", {
        description: `Laporan ${selectedFacility.name} akan ditinjau petugas.`,
      })
    } catch (error) {
      setMessage(toastError("Laporan gagal dikirim", error))
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
      <FormProgress
        label="Progres pembuatan laporan"
        steps={[
          {
            id: "report-facility-field",
            label: "Fasilitas",
            done: Boolean(selectedFacility),
          },
          {
            id: "report-category-field",
            label: "Rincian",
            done: detailsReady,
          },
          {
            id: "report-photo-field",
            label: "Foto",
            done: Boolean(photo),
            optional: true,
          },
          { id: "report-submit", label: "Kirim", done: false },
        ]}
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
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
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
          <div
            id="report-photo-field"
            className="flex min-w-0 flex-col gap-3 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6"
          >
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
        <FormSummaryBar
          image={
            selectedFacility
              ? facilityIllustration(
                  selectedFacility.name,
                  selectedFacility.type
                )
              : undefined
          }
          title={selectedFacility?.name ?? "Belum memilih fasilitas"}
          detail={
            detailsReady
              ? `${category.trim()}${photo ? " · 1 foto" : ""}`
              : "Periksa kembali, lalu kirim laporan."
          }
        >
          <Button
            id="report-submit"
            type="submit"
            className="w-full sm:w-auto"
            disabled={pending || !selectedFacility}
          >
            {pending ? "Mengirim…" : "Kirim laporan"}
          </Button>
        </FormSummaryBar>
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
