"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { useAppMutation as useMutation } from "@/lib/data-hooks"
import { toastError } from "@/lib/toast"
import {
  IconArrowRight,
  IconSearch,
  IconChecklist,
  IconClockHour4,
  IconFileAlert,
  IconProgress,
  IconAlertTriangle,
} from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import {
  DashboardMetricCard,
  DashboardMetricPanel,
} from "@/components/dashboard-metric-card"
import {
  DashboardEmptyHint,
  DashboardSectionHeader,
  DashboardSkeletonRows,
} from "@/components/dashboard-sections"
import { PortalPageHeader } from "@/components/portal-page-header"
import { ReportTicket, ReservationTicket } from "@/components/portal-cards"
import { PortalListSkeleton } from "@/components/portal-skeletons"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  TabsCount,
} from "@/components/ui/tabs"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"
import { cn } from "@/lib/utils"
import { displayDuration } from "@/lib/reservation-slots"

const labels: Record<string, string> = {
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

const jakartaDate = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
})

const jakartaTime = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Jakarta",
})

function formatDate(value: number) {
  return jakartaDateTime.format(value)
}

type QueueSortOrder = "prioritas" | "terbaru" | "terlama"

export type ReservationTab = "menunggu" | "disetujui" | "riwayat"

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

export type ReportTab = "baru" | "ditangani" | "riwayat"

const reportTabLabels: Record<ReportTab, string> = {
  baru: "Laporan baru",
  ditangani: "Sedang ditangani",
  riwayat: "Riwayat",
}

const reportTabEmptyMessages: Record<ReportTab, string> = {
  baru: "Belum ada laporan baru.",
  ditangani: "Tidak ada laporan yang sedang ditangani.",
  riwayat: "Belum ada riwayat laporan.",
}

function reportMatchesTab(status: string, tab: ReportTab) {
  if (tab === "baru") return status === "pending"
  if (tab === "ditangani") return status === "in_progress"
  return status === "resolved" || status === "rejected"
}

const queueSortLabels: Record<QueueSortOrder, string> = {
  prioritas: "Prioritas",
  terbaru: "Terbaru",
  terlama: "Terlama",
}

function reservationPriority(status: string) {
  return status === "pending" ? 0 : 1
}

function reportPriority(status: string) {
  if (status === "pending") return 0
  if (status === "in_progress") return 1
  return 2
}

function waitingTime(createdAt: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - createdAt) / 60_000))
  if (minutes === 0) return "Baru masuk"
  if (minutes < 1440) return `Menunggu ${displayDuration(minutes)}`
  return `Menunggu ${Math.floor(minutes / 1440)} hari`
}

function reservationTabForStatus(status: string): ReservationTab {
  return status === "pending"
    ? "menunggu"
    : status === "approved"
      ? "disetujui"
      : "riwayat"
}

function reportTabForStatus(status: string): ReportTab {
  return status === "pending"
    ? "baru"
    : status === "in_progress"
      ? "ditangani"
      : "riwayat"
}

function useQueueItemFocus<Tab extends string>(
  itemId: string | undefined,
  items: { id: string; status: string }[] | undefined,
  activeTab: Tab,
  setActiveTab: (tab: Tab) => void,
  tabForStatus: (status: string) => Tab,
  prefix: string,
  search: string,
  setSearch: (value: string) => void
) {
  const focusedItem = useRef<string | null>(null)
  const target = items?.find((item) => item.id === itemId)

  useEffect(() => {
    if (!itemId || !target || focusedItem.current === itemId) return
    if (search) {
      setSearch("")
      return
    }
    const targetTab = tabForStatus(target.status)
    if (activeTab !== targetTab) {
      setActiveTab(targetTab)
      return
    }
    const frame = requestAnimationFrame(() => {
      const card = document.getElementById(`${prefix}-${itemId}`)
      if (!card) return
      card.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      })
      card.focus({ preventScroll: true })
      focusedItem.current = itemId
    })
    return () => cancelAnimationFrame(frame)
  }, [
    itemId,
    target,
    activeTab,
    setActiveTab,
    tabForStatus,
    prefix,
    search,
    setSearch,
  ])

  return Boolean(itemId && items && !target)
}

type DashboardQueueReservation = {
  id: Id<"reservations">
  applicantName: string
  facilityName: string
  purpose: string
  startAt: number
  endAt: number
  status: string
  createdAt: number
}

type DashboardQueueReport = {
  id: Id<"reports">
  reporterName: string
  facilityName: string
  category: string
  status: string
  createdAt: number
}

function StaffPendingReservationsCard({
  reservations,
  now,
}: {
  reservations: DashboardQueueReservation[] | undefined
  now: number
}) {
  const pending = [...(reservations ?? [])]
    .filter((item) => item.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 3)

  return (
    <Card className="gap-4 p-5 shadow-sm sm:p-6">
      <DashboardSectionHeader
        title="Reservasi menunggu"
        href="/staff/reservations?tab=menunggu"
        linkLabel="Lihat antrean"
      />
      {!reservations ? (
        <DashboardSkeletonRows />
      ) : pending.length === 0 ? (
        <DashboardEmptyHint
          text="Tidak ada reservasi menunggu keputusan."
          actionHref="/staff/reservations?tab=menunggu"
          actionLabel="Buka antrean"
        />
      ) : (
        <ul className="divide-y divide-border/70">
          {pending.map((item) => (
            <li key={item.id} className="py-4 first:pt-0 last:pb-0">
              <p className="font-semibold break-words">{item.applicantName}</p>
              <p className="mt-0.5 text-sm break-words text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {item.facilityName}
                </span>{" "}
                · {item.purpose}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-foreground tabular-nums">
                <IconClockHour4 size={14} aria-hidden="true" />
                {jakartaDate.format(item.startAt)} ·{" "}
                {jakartaTime.format(item.startAt)}–
                {jakartaTime.format(item.endAt)} WIB
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {waitingTime(item.createdAt, now)}
                </p>
                <Link
                  href={`/staff/reservations?tab=menunggu&item=${encodeURIComponent(item.id)}`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "default",
                    className:
                      "rounded-xl border-border bg-muted/50 hover:bg-muted hover:shadow-sm dark:bg-white/5 dark:hover:bg-white/10",
                  })}
                >
                  Tinjau <IconArrowRight aria-hidden="true" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function StaffNewReportsCard({
  reports,
  now,
}: {
  reports: DashboardQueueReport[] | undefined
  now: number
}) {
  const pending = [...(reports ?? [])]
    .filter((item) => item.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 3)

  return (
    <Card className="gap-4 p-5 shadow-sm sm:p-6">
      <DashboardSectionHeader
        title="Laporan baru"
        href="/staff/reports?tab=baru"
        linkLabel="Lihat antrean"
      />
      {!reports ? (
        <DashboardSkeletonRows />
      ) : pending.length === 0 ? (
        <DashboardEmptyHint
          text="Tidak ada laporan baru."
          actionHref="/staff/reports?tab=baru"
          actionLabel="Buka antrean"
        />
      ) : (
        <ul className="divide-y divide-border/70">
          {pending.map((item) => (
            <li key={item.id} className="py-4 first:pt-0 last:pb-0">
              <p className="font-semibold break-words">{item.facilityName}</p>
              <p className="mt-0.5 text-sm break-words text-muted-foreground">
                {item.category} · {item.reporterName}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {waitingTime(item.createdAt, now)}
                </p>
                <Link
                  href={`/staff/reports?tab=baru&item=${encodeURIComponent(item.id)}`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "default",
                    className:
                      "rounded-xl border-border bg-muted/50 hover:bg-muted hover:shadow-sm dark:bg-white/5 dark:hover:bg-white/10",
                  })}
                >
                  Tangani <IconArrowRight aria-hidden="true" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function StaffTodayScheduleCard({
  reservations,
  now,
}: {
  reservations: DashboardQueueReservation[] | undefined
  now: number
}) {
  const today = [...(reservations ?? [])]
    .filter(
      (item) =>
        item.status === "approved" &&
        jakartaDate.format(item.startAt) === jakartaDate.format(now)
    )
    .sort((a, b) => a.startAt - b.startAt)

  return (
    <Card className="gap-4 p-5 shadow-sm sm:p-6">
      <DashboardSectionHeader
        title="Jadwal hari ini"
        href="/staff/reservations?tab=disetujui"
        linkLabel="Lihat semua"
      />
      {!reservations ? (
        <DashboardSkeletonRows />
      ) : today.length === 0 ? (
        <DashboardEmptyHint
          text="Tidak ada jadwal hari ini."
          actionHref="/staff/reservations?tab=disetujui"
          actionLabel="Lihat semua jadwal"
        />
      ) : (
        <ul className="divide-y divide-border/70">
          {today.map((item) => {
            const ongoing = item.startAt <= now && now < item.endAt
            const finished = item.endAt <= now
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold tabular-nums">
                    {jakartaTime.format(item.startAt)}–
                    {jakartaTime.format(item.endAt)} WIB
                  </p>
                  <p className="mt-0.5 text-sm break-words text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {item.facilityName}
                    </span>{" "}
                    · {item.applicantName}
                  </p>
                  <p className="mt-0.5 text-xs break-words text-muted-foreground">
                    {item.purpose}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    ongoing &&
                      "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300",
                    finished && "bg-muted text-muted-foreground",
                    !ongoing &&
                      !finished &&
                      "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"
                  )}
                >
                  {ongoing
                    ? "Berlangsung"
                    : finished
                      ? "Selesai"
                      : "Akan datang"}
                </Badge>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export function StaffDashboard() {
  const reservations = useAuthenticatedQuery(api.reservations.listQueue, {})
  const reports = useAuthenticatedQuery(api.reports.listQueue, {})
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-7">
      <PortalPageHeader
        layout="actions-right"
        eyebrow="Portal petugas"
        title="Antrean operasional"
        description="Prioritaskan permohonan dan kendala yang perlu ditangani."
        icon={IconChecklist}
      >
        <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs text-muted-foreground shadow-sm dark:bg-card">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          Sinkron real-time
        </span>
      </PortalPageHeader>
      <DashboardMetricPanel columns={3}>
        <DashboardMetricCard
          label="Reservasi menunggu"
          value={
            reservations
              ? reservations.filter((item) => item.status === "pending").length
              : undefined
          }
          description="Permohonan yang membutuhkan keputusan."
          icon={IconClockHour4}
          href="/staff/reservations?tab=menunggu"
        />
        <DashboardMetricCard
          label="Laporan baru"
          value={
            reports
              ? reports.filter((item) => item.status === "pending").length
              : undefined
          }
          description="Laporan yang belum diambil petugas."
          icon={IconFileAlert}
          href="/staff/reports?tab=baru"
        />
        <DashboardMetricCard
          label="Sedang ditangani"
          value={
            reports
              ? reports.filter((item) => item.status === "in_progress").length
              : undefined
          }
          description="Pekerjaan aktif yang perlu dituntaskan."
          icon={IconProgress}
          href="/staff/reports?tab=ditangani"
        />
      </DashboardMetricPanel>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <StaffPendingReservationsCard reservations={reservations} now={now} />
        <StaffNewReportsCard reports={reports} now={now} />
      </div>
      <StaffTodayScheduleCard reservations={reservations} now={now} />
      <Card className="p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-[#b00055] dark:bg-pink-900/40 dark:text-pink-200">
              <IconChecklist className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-semibold">
                Lanjutkan antrean kerja
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Buka antrean sesuai jenis pekerjaan yang ingin diproses.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/staff/reservations" className={buttonVariants()}>
              Reservasi
            </Link>
            <Link
              href="/staff/reports"
              className={buttonVariants({ variant: "outline" })}
            >
              Laporan
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function StaffReservations({
  initialTab = "menunggu",
  initialItem,
}: {
  initialTab?: ReservationTab
  initialItem?: string
}) {
  const reservations = useAuthenticatedQuery(api.reservations.listQueue, {})
  const decide = useMutation(api.reservations.decide)
  const cancel = useMutation(api.reservations.cancelByStaff)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState<ReservationTab>(initialTab)
  const [sortOrder, setSortOrder] = useState<QueueSortOrder>("prioritas")
  const [search, setSearch] = useState("")
  const searchTerm = search.trim().toLowerCase()
  const [confirmAction, setConfirmAction] = useState<{
    id: Id<"reservations">
    action: "approved" | "rejected" | "cancelled"
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const missingItem = useQueueItemFocus(
    initialItem,
    reservations,
    activeTab,
    setActiveTab,
    reservationTabForStatus,
    "queue-reservation",
    search,
    setSearch
  )

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

  // Pending requests that clash with each other; approving one rejects the rest.
  const overlaps = useMemo(() => {
    const pending = (reservations ?? []).filter(
      (item) => item.status === "pending"
    )
    const counts: Record<string, number> = {}
    for (const item of pending) {
      counts[item.id] = pending.filter(
        (other) =>
          other.id !== item.id &&
          other.facilityName === item.facilityName &&
          other.startAt < item.endAt &&
          item.startAt < other.endAt
      ).length
    }
    return counts
  }, [reservations])

  const visibleReservations = useMemo(() => {
    if (!reservations) return undefined
    const filtered = reservations.filter(
      (item) =>
        reservationMatchesTab(item.status, activeTab) &&
        `${item.applicantName} ${item.facilityName}`
          .toLowerCase()
          .includes(searchTerm)
    )
    filtered.sort((a, b) => {
      if (sortOrder === "terbaru") return b.createdAt - a.createdAt
      if (sortOrder === "terlama") return a.createdAt - b.createdAt
      const priority =
        reservationPriority(a.status) - reservationPriority(b.status)
      if (priority !== 0) return priority
      return b.createdAt - a.createdAt
    })
    return filtered
  }, [reservations, activeTab, sortOrder, searchTerm])

  const confirmReservation = confirmAction
    ? reservations?.find((item) => item.id === confirmAction.id)
    : undefined
  const confirmNote = confirmAction
    ? (notes[confirmAction.id] ?? "").trim()
    : ""

  async function execute(
    id: Id<"reservations">,
    action: "approved" | "rejected" | "cancelled"
  ) {
    const note = notes[id]?.trim() ?? ""
    try {
      if (action === "cancelled") {
        await cancel({ reservationId: id, reason: note })
        setSuccess("Reservasi dibatalkan.")
        toast.success("Reservasi dibatalkan")
      } else {
        await decide({
          reservationId: id,
          decision: action,
          note: note || undefined,
        })
        setSuccess(
          action === "approved" ? "Reservasi disetujui." : "Reservasi ditolak."
        )
        toast.success(
          action === "approved" ? "Reservasi disetujui" : "Reservasi ditolak"
        )
      }
    } catch (error) {
      setMessage(toastError("Tindakan gagal", error))
    } finally {
      setIsSubmitting(false)
      setConfirmAction(null)
    }
  }

  function requestProcess(
    id: Id<"reservations">,
    action: "approved" | "rejected" | "cancelled"
  ) {
    setMessage("")
    setSuccess("")
    const note = notes[id]?.trim() ?? ""
    if (action === "cancelled" && !note) {
      setMessage("Isi alasan pembatalan sebelum membatalkan reservasi.")
      document.getElementById(`reservation-note-${id}`)?.focus()
      return
    }
    setConfirmAction({ id, action })
  }

  function confirmProcess() {
    if (!confirmAction) return
    setIsSubmitting(true)
    void execute(confirmAction.id, confirmAction.action)
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Tinjau pengajuan"
        title="Antrean reservasi"
        description="Saat satu reservasi disetujui, ajuan lain yang bentrok otomatis ditolak."
        icon={IconClockHour4}
      />
      {missingItem && (
        <output className="block text-sm text-muted-foreground">
          Reservasi yang dituju sudah tidak tersedia. Anda tetap dapat meninjau
          antrean lainnya.
        </output>
      )}
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      {success && (
        <output className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {success}
        </output>
      )}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as ReservationTab)
          setMessage("")
          setSuccess("")
        }}
      >
        <TabsList aria-label="Kategori reservasi">
          {(Object.keys(reservationTabLabels) as ReservationTab[]).map(
            (tab) => (
              <TabsTab key={tab} value={tab}>
                {reservationTabLabels[tab]}
                <TabsCount>{reservations ? tabCounts[tab] : "…"}</TabsCount>
              </TabsTab>
            )
          )}
        </TabsList>
        <TabsPanel value={activeTab} className="space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full min-w-0 lg:flex-1 lg:basis-64">
              <Label htmlFor="reservation-queue-search">Cari reservasi</Label>
              <div className="relative mt-1.5">
                <IconSearch
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="reservation-queue-search"
                  placeholder="Cari pemohon atau fasilitas"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label id="reservation-sort-label">Urutkan</Label>
              <Select
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as QueueSortOrder)}
              >
                <SelectTrigger
                  aria-labelledby="reservation-sort-label"
                  className="w-44"
                >
                  <SelectValue>
                    {(value: string | null) =>
                      queueSortLabels[value as QueueSortOrder] ?? "Urutkan"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(queueSortLabels) as QueueSortOrder[]).map(
                    (order) => (
                      <SelectItem key={order} value={order}>
                        {queueSortLabels[order]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            {reservations && visibleReservations && (
              <p
                className="pb-2 text-xs text-muted-foreground"
                aria-live="polite"
              >
                Menampilkan {visibleReservations.length} dari{" "}
                {tabCounts[activeTab]} reservasi di tab ini
              </p>
            )}
          </div>
          {!visibleReservations || !reservations ? (
            <PortalListSkeleton layout="grid" />
          ) : visibleReservations.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              {searchTerm && tabCounts[activeTab] > 0 ? (
                <>
                  <p>Tidak ada reservasi yang cocok dengan pencarian.</p>
                  <Button
                    variant="outline"
                    className="mx-auto mt-3"
                    onClick={() => setSearch("")}
                  >
                    Hapus pencarian
                  </Button>
                </>
              ) : (
                reservationTabEmptyMessages[activeTab]
              )}
            </Card>
          ) : (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {visibleReservations.map((item) => (
                <section
                  key={item.id}
                  id={`queue-reservation-${item.id}`}
                  tabIndex={-1}
                  aria-label={`Reservasi ${item.facilityName} oleh ${item.applicantName}`}
                  className="rounded-3xl outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4 focus:ring-offset-background"
                >
                  <ReservationTicket
                    compactDate
                    facilityName={item.facilityName}
                    startAt={item.startAt}
                    endAt={item.endAt}
                    status={item.status}
                    statusLabel={labels[item.status] ?? item.status}
                    purpose={item.purpose}
                    decisionNote={item.decisionNote}
                    createdAt={item.createdAt}
                    meta={`${item.applicantName} · ${item.applicantEmail}`}
                    alert={
                      item.status === "pending" && overlaps[item.id] ? (
                        <p className="flex items-start gap-2 rounded-2xl border border-amber-300/60 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
                          <IconAlertTriangle
                            size={16}
                            className="mt-px shrink-0"
                            aria-hidden="true"
                          />
                          Bentrok dengan {overlaps[item.id]} pengajuan lain pada
                          jam yang sama — pengajuan itu otomatis ditolak jika
                          ini disetujui.
                        </p>
                      ) : null
                    }
                  >
                    {(item.status === "pending" ||
                      item.status === "approved") && (
                      <div className="space-y-3">
                        <Input
                          id={`reservation-note-${item.id}`}
                          aria-label="Catatan keputusan"
                          placeholder="Alasan wajib untuk pembatalan"
                          value={notes[item.id] ?? ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                        />
                        <div className="flex flex-wrap gap-2">
                          {item.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  requestProcess(item.id, "approved")
                                }
                              >
                                Setujui
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  requestProcess(item.id, "rejected")
                                }
                              >
                                Tolak
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => requestProcess(item.id, "cancelled")}
                          >
                            Batalkan
                          </Button>
                        </div>
                      </div>
                    )}
                  </ReservationTicket>
                </section>
              ))}
            </div>
          )}
        </TabsPanel>
      </Tabs>
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setConfirmAction(null)
        }}
      >
        <AlertDialogContent className="bg-card text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "approved"
                ? "Setujui reservasi ini?"
                : confirmAction?.action === "rejected"
                  ? "Tolak reservasi ini?"
                  : "Batalkan reservasi ini?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "approved"
                ? `Reservasi ${confirmReservation?.facilityName ?? "fasilitas ini"} pada ${confirmReservation ? `${formatDate(confirmReservation.startAt)} – ${formatDate(confirmReservation.endAt)}` : "jadwal ini"} akan disetujui. Ajuan lain yang bentrok otomatis ditolak.`
                : confirmAction?.action === "rejected"
                  ? `Reservasi ${confirmReservation?.facilityName ?? "fasilitas ini"} akan ditolak dan tidak dapat diubah lagi.`
                  : `Reservasi ${confirmReservation?.facilityName ?? "fasilitas ini"} akan dibatalkan. Alasan pembatalan akan terlihat oleh pemohon.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmNote && (
            <div className="rounded-2xl bg-muted/50 p-4 text-left text-sm">
              <p className="text-xs font-medium text-muted-foreground">
                Catatan keputusan
              </p>
              <p className="mt-1 leading-relaxed break-words whitespace-pre-wrap">
                {confirmNote}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant={
                confirmAction?.action === "approved" ? "default" : "destructive"
              }
              disabled={isSubmitting}
              onClick={confirmProcess}
            >
              {isSubmitting
                ? "Memproses…"
                : confirmAction?.action === "approved"
                  ? "Ya, setujui"
                  : confirmAction?.action === "rejected"
                    ? "Ya, tolak"
                    : "Ya, batalkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function StaffReports({
  initialTab = "baru",
  initialItem,
}: {
  initialTab?: ReportTab
  initialItem?: string
}) {
  const reports = useAuthenticatedQuery(api.reports.listQueue, {})
  const updateStatus = useMutation(api.reports.updateStatus)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [maintenance, setMaintenance] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab)
  const [sortOrder, setSortOrder] = useState<QueueSortOrder>("prioritas")
  const [search, setSearch] = useState("")
  const searchTerm = search.trim().toLowerCase()
  const [confirmAction, setConfirmAction] = useState<{
    reportId: Id<"reports">
    status: "resolved" | "rejected"
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const missingItem = useQueueItemFocus(
    initialItem,
    reports,
    activeTab,
    setActiveTab,
    reportTabForStatus,
    "queue-report",
    search,
    setSearch
  )

  const tabCounts = useMemo(() => {
    const counts: Record<ReportTab, number> = {
      baru: 0,
      ditangani: 0,
      riwayat: 0,
    }
    reports?.forEach((report) => {
      if (report.status === "pending") counts.baru += 1
      else if (report.status === "in_progress") counts.ditangani += 1
      else counts.riwayat += 1
    })
    return counts
  }, [reports])

  const visibleReports = useMemo(() => {
    if (!reports) return undefined
    const filtered = reports.filter(
      (report) =>
        reportMatchesTab(report.status, activeTab) &&
        `${report.reporterName} ${report.facilityName} ${report.category}`
          .toLowerCase()
          .includes(searchTerm)
    )
    filtered.sort((a, b) => {
      if (sortOrder === "terbaru") return b.createdAt - a.createdAt
      if (sortOrder === "terlama") return a.createdAt - b.createdAt
      const priority = reportPriority(a.status) - reportPriority(b.status)
      if (priority !== 0) return priority
      return b.updatedAt - a.updatedAt
    })
    return filtered
  }, [reports, activeTab, sortOrder, searchTerm])

  const confirmReport = confirmAction
    ? reports?.find((report) => report.id === confirmAction.reportId)
    : undefined
  const confirmNote = confirmAction
    ? (
        notes[confirmAction.reportId] ??
        confirmReport?.resolutionNote ??
        ""
      ).trim()
    : ""

  async function execute(
    reportId: Id<"reports">,
    status: "in_progress" | "resolved" | "rejected",
    maintenanceOverride?: boolean
  ) {
    const report = reports?.find((item) => item.id === reportId)
    const note = (notes[reportId] ?? report?.resolutionNote ?? "").trim()
    try {
      await updateStatus({
        reportId,
        status,
        note,
        facilityMaintenance: maintenanceOverride ?? maintenance[reportId],
      })
      const successText =
        status === "in_progress"
          ? "Laporan mulai ditangani."
          : status === "resolved"
            ? "Laporan ditandai selesai dan fasilitas diaktifkan kembali."
            : "Laporan ditolak."
      setSuccess(successText)
      toast.success(successText)
    } catch (error) {
      setMessage(toastError("Pembaruan laporan gagal", error))
    } finally {
      setIsSubmitting(false)
      setConfirmAction(null)
    }
  }

  function requestProcess(
    reportId: Id<"reports">,
    status: "in_progress" | "resolved" | "rejected"
  ) {
    setMessage("")
    setSuccess("")
    const report = reports?.find((item) => item.id === reportId)
    const note = (notes[reportId] ?? report?.resolutionNote ?? "").trim()
    if (status !== "in_progress" && !note) {
      setMessage(
        "Isi catatan penanganan sebelum menyelesaikan atau menolak laporan."
      )
      document.getElementById(`report-note-${reportId}`)?.focus()
      return
    }
    if (status === "in_progress") {
      // Starting work puts the facility under maintenance unless unticked.
      void execute(reportId, status, maintenance[reportId] ?? true)
      return
    }
    setConfirmAction({ reportId, status })
  }

  function confirmProcess() {
    if (!confirmAction) return
    setIsSubmitting(true)
    const report = reports?.find((item) => item.id === confirmAction.reportId)
    // Closing a report that was being handled reactivates its facility.
    void execute(
      confirmAction.reportId,
      confirmAction.status,
      confirmAction.status === "resolved" || report?.status === "in_progress"
        ? false
        : undefined
    )
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Tindak lanjut fasilitas"
        title="Laporan fasilitas"
        description="Pantau laporan baru, pekerjaan yang sedang ditangani, dan riwayatnya."
        icon={IconFileAlert}
      />
      {missingItem && (
        <output className="block text-sm text-muted-foreground">
          Laporan yang dituju sudah tidak tersedia. Anda tetap dapat meninjau
          antrean lainnya.
        </output>
      )}
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      {success && (
        <output className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {success}
        </output>
      )}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as ReportTab)
          setMessage("")
          setSuccess("")
        }}
      >
        <TabsList aria-label="Kategori laporan">
          {(Object.keys(reportTabLabels) as ReportTab[]).map((tab) => (
            <TabsTab key={tab} value={tab}>
              {reportTabLabels[tab]}
              <TabsCount>{reports ? tabCounts[tab] : "…"}</TabsCount>
            </TabsTab>
          ))}
        </TabsList>
        <TabsPanel value={activeTab} className="space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full min-w-0 lg:flex-1 lg:basis-64">
              <Label htmlFor="report-queue-search">Cari laporan</Label>
              <div className="relative mt-1.5">
                <IconSearch
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="report-queue-search"
                  placeholder="Cari pelapor, fasilitas, atau kategori"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label id="report-sort-label">Urutkan</Label>
              <Select
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as QueueSortOrder)}
              >
                <SelectTrigger
                  aria-labelledby="report-sort-label"
                  className="w-44"
                >
                  <SelectValue>
                    {(value: string | null) =>
                      queueSortLabels[value as QueueSortOrder] ?? "Urutkan"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(queueSortLabels) as QueueSortOrder[]).map(
                    (order) => (
                      <SelectItem key={order} value={order}>
                        {queueSortLabels[order]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            {reports && visibleReports && (
              <p
                className="pb-2 text-xs text-muted-foreground"
                aria-live="polite"
              >
                Menampilkan {visibleReports.length} dari {tabCounts[activeTab]}{" "}
                laporan di tab ini
              </p>
            )}
          </div>
          {!visibleReports || !reports ? (
            <PortalListSkeleton layout="grid" />
          ) : visibleReports.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              {searchTerm && tabCounts[activeTab] > 0 ? (
                <>
                  <p>Tidak ada laporan yang cocok dengan pencarian.</p>
                  <Button
                    variant="outline"
                    className="mx-auto mt-3"
                    onClick={() => setSearch("")}
                  >
                    Hapus pencarian
                  </Button>
                </>
              ) : (
                reportTabEmptyMessages[activeTab]
              )}
            </Card>
          ) : (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {visibleReports.map((report) => {
                const open =
                  report.status === "pending" || report.status === "in_progress"
                return (
                  <section
                    key={report.id}
                    id={`queue-report-${report.id}`}
                    tabIndex={-1}
                    aria-label={`Laporan ${report.facilityName} oleh ${report.reporterName}`}
                    className="rounded-3xl outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4 focus:ring-offset-background"
                  >
                    <ReportTicket
                      facilityName={report.facilityName}
                      category={report.category}
                      description={report.description}
                      photoUrl={report.photoUrl}
                      status={report.status}
                      statusLabel={labels[report.status] ?? report.status}
                      resolutionNote={
                        open
                          ? undefined
                          : report.resolutionNote || "Tidak ada catatan."
                      }
                      createdAt={report.createdAt}
                      updatedAt={report.updatedAt}
                      meta={`${report.reporterName} · ${report.reporterEmail}`}
                      reportedLabel={`Dilaporkan ${formatDate(report.createdAt)} · Diperbarui ${formatDate(report.updatedAt)}`}
                    >
                      {open ? (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label htmlFor={`report-note-${report.id}`}>
                              Catatan penanganan
                            </Label>
                            <Input
                              id={`report-note-${report.id}`}
                              placeholder="Wajib untuk selesai atau ditolak"
                              value={
                                notes[report.id] ?? report.resolutionNote ?? ""
                              }
                              onChange={(event) =>
                                setNotes((current) => ({
                                  ...current,
                                  [report.id]: event.target.value,
                                }))
                              }
                            />
                          </div>
                          <label
                            htmlFor={`maintenance-${report.id}`}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              id={`maintenance-${report.id}`}
                              checked={maintenance[report.id] ?? true}
                              onCheckedChange={(checked) =>
                                setMaintenance((current) => ({
                                  ...current,
                                  [report.id]: checked === true,
                                }))
                              }
                            />
                            Tandai fasilitas dalam perbaikan
                          </label>
                          <p className="-mt-1 text-xs text-muted-foreground">
                            Otomatis dicentang saat laporan mulai ditangani —
                            hapus centang bila fasilitas masih bisa dipakai.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {report.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  requestProcess(report.id, "in_progress")
                                }
                              >
                                Mulai tangani
                              </Button>
                            )}
                            {report.status === "in_progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  requestProcess(report.id, "resolved")
                                }
                              >
                                Selesaikan + aktifkan fasilitas
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                requestProcess(report.id, "rejected")
                              }
                            >
                              Tolak
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </ReportTicket>
                  </section>
                )
              })}
            </div>
          )}
        </TabsPanel>
      </Tabs>
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setConfirmAction(null)
        }}
      >
        <AlertDialogContent className="bg-card text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.status === "rejected"
                ? "Tolak laporan ini?"
                : "Selesaikan laporan ini?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.status === "rejected"
                ? `Laporan untuk ${confirmReport?.facilityName ?? "fasilitas ini"} akan ditolak dan tidak dapat diubah lagi.`
                : `Laporan untuk ${confirmReport?.facilityName ?? "fasilitas ini"} akan ditandai selesai dan fasilitas diaktifkan kembali.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmNote && (
            <div className="rounded-2xl bg-muted/50 p-4 text-left text-sm">
              <p className="text-xs font-medium text-muted-foreground">
                Catatan penanganan
              </p>
              <p className="mt-1 leading-relaxed break-words whitespace-pre-wrap">
                {confirmNote}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant={
                confirmAction?.status === "rejected" ? "destructive" : "default"
              }
              disabled={isSubmitting}
              onClick={confirmProcess}
            >
              {isSubmitting
                ? "Memproses…"
                : confirmAction?.status === "rejected"
                  ? "Ya, tolak"
                  : "Ya, selesaikan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
