"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useAppMutation as useMutation } from "@/lib/data-hooks"
import {
  IconChecklist,
  IconClockHour4,
  IconFileAlert,
  IconProgress,
} from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { DashboardMetricCard } from "@/components/dashboard-metric-card"
import {
  DashboardEmptyHint,
  DashboardSectionHeader,
  DashboardSkeletonRows,
} from "@/components/dashboard-sections"
import { PortalPageHeader } from "@/components/portal-page-header"
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
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"
import { cn } from "@/lib/utils"

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
}: {
  reservations: DashboardQueueReservation[] | undefined
}) {
  const pending = [...(reservations ?? [])]
    .filter((item) => item.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 3)

  return (
    <Card className="gap-4 p-5 sm:p-6">
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
        <ul className="space-y-3">
          {pending.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border/70 bg-muted/20 p-4"
            >
              <p className="font-medium break-words">{item.applicantName}</p>
              <p className="mt-0.5 text-sm break-words text-muted-foreground">
                {item.facilityName} · {item.purpose}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <IconClockHour4 size={14} aria-hidden="true" />
                {jakartaDate.format(item.startAt)} ·{" "}
                {jakartaTime.format(item.startAt)}–
                {jakartaTime.format(item.endAt)} WIB
              </p>
              <Link
                href="/staff/reservations?tab=menunggu"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "mt-3",
                })}
              >
                Tinjau
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function StaffNewReportsCard({
  reports,
}: {
  reports: DashboardQueueReport[] | undefined
}) {
  const pending = [...(reports ?? [])]
    .filter((item) => item.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 3)

  return (
    <Card className="gap-4 p-5 sm:p-6">
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
        <ul className="space-y-3">
          {pending.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border/70 bg-muted/20 p-4"
            >
              <p className="font-medium break-words">{item.facilityName}</p>
              <p className="mt-0.5 text-sm break-words text-muted-foreground">
                {item.category} · {item.reporterName}
              </p>
              <Link
                href="/staff/reports?tab=baru"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "mt-3",
                })}
              >
                Tangani
              </Link>
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
    <Card className="gap-4 p-5 sm:p-6">
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
        <ul className="space-y-3">
          {today.map((item) => {
            const ongoing = item.startAt <= now && now < item.endAt
            const finished = item.endAt <= now
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {jakartaTime.format(item.startAt)}–
                    {jakartaTime.format(item.endAt)} WIB
                  </p>
                  <p className="mt-0.5 text-sm break-words text-muted-foreground">
                    {item.facilityName} · {item.applicantName}
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
  const [now] = useState(() => Date.now())

  return (
    <div className="space-y-7">
      <PortalPageHeader
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
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardMetricCard
          label="Reservasi menunggu"
          value={
            reservations
              ? reservations.filter((item) => item.status === "pending").length
              : undefined
          }
          description="Permohonan yang membutuhkan keputusan."
          icon={IconClockHour4}
          tone="amber"
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
          tone="pink"
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
          tone="emerald"
          href="/staff/reports?tab=ditangani"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <StaffPendingReservationsCard reservations={reservations} />
        <StaffNewReportsCard reports={reports} />
      </div>
      <StaffTodayScheduleCard reservations={reservations} now={now} />
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-[#b00055] dark:bg-pink-900/40 dark:text-pink-200">
              <IconChecklist className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold">
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
}: {
  initialTab?: ReservationTab
}) {
  const reservations = useAuthenticatedQuery(api.reservations.listQueue, {})
  const decide = useMutation(api.reservations.decide)
  const cancel = useMutation(api.reservations.cancelByStaff)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState<ReservationTab>(initialTab)
  const [sortOrder, setSortOrder] = useState<QueueSortOrder>("prioritas")
  const [confirmAction, setConfirmAction] = useState<{
    id: Id<"reservations">
    action: "approved" | "rejected" | "cancelled"
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const visibleReservations = useMemo(() => {
    if (!reservations) return undefined
    const filtered = reservations.filter((item) =>
      reservationMatchesTab(item.status, activeTab)
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
  }, [reservations, activeTab, sortOrder])

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
      } else {
        await decide({
          reservationId: id,
          decision: action,
          note: note || undefined,
        })
        setSuccess(
          action === "approved" ? "Reservasi disetujui." : "Reservasi ditolak."
        )
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tindakan gagal")
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
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 justify-center px-1.5 text-xs"
                >
                  {reservations ? tabCounts[tab] : "…"}
                </Badge>
              </TabsTab>
            )
          )}
        </TabsList>
        <TabsPanel value={activeTab} className="space-y-6">
          <div className="flex flex-wrap items-end gap-3">
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
                {reservations.length} reservasi
              </p>
            )}
          </div>
          {!visibleReservations || !reservations ? (
            <PortalListSkeleton layout="grid" />
          ) : visibleReservations.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              {reservationTabEmptyMessages[activeTab]}
            </Card>
          ) : (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {visibleReservations.map((item) => (
                <Card
                  key={item.id}
                  className="gap-4 p-5 transition-shadow duration-200 hover:shadow-lg sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-heading font-semibold break-words">
                        {item.facilityName}
                      </h2>
                      <p className="mt-1 text-sm break-words text-muted-foreground">
                        {item.applicantName} · {item.applicantEmail}
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
                      {labels[item.status]}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-2 rounded-2xl border border-border/70 bg-muted/25 p-3 text-sm">
                    <IconClockHour4
                      size={18}
                      className="mt-0.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="break-words">
                      {formatDate(item.startAt)} – {formatDate(item.endAt)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      Tujuan penggunaan
                    </p>
                    <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {item.purpose}
                    </p>
                  </div>
                  {item.decisionNote && (
                    <div className="min-w-0 rounded-xl bg-muted p-3.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        Catatan keputusan
                      </p>
                      <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {item.decisionNote}
                      </p>
                    </div>
                  )}
                  {(item.status === "pending" ||
                    item.status === "approved") && (
                    <div className="space-y-3 border-t border-border/70 pt-4">
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
                </Card>
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
}: {
  initialTab?: ReportTab
}) {
  const reports = useAuthenticatedQuery(api.reports.listQueue, {})
  const updateStatus = useMutation(api.reports.updateStatus)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [maintenance, setMaintenance] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab)
  const [sortOrder, setSortOrder] = useState<QueueSortOrder>("prioritas")
  const [confirmAction, setConfirmAction] = useState<{
    reportId: Id<"reports">
    status: "resolved" | "rejected"
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    const filtered = reports.filter((report) =>
      reportMatchesTab(report.status, activeTab)
    )
    filtered.sort((a, b) => {
      if (sortOrder === "terbaru") return b.createdAt - a.createdAt
      if (sortOrder === "terlama") return a.createdAt - b.createdAt
      const priority = reportPriority(a.status) - reportPriority(b.status)
      if (priority !== 0) return priority
      return b.updatedAt - a.updatedAt
    })
    return filtered
  }, [reports, activeTab, sortOrder])

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
      if (status === "in_progress") {
        setSuccess("Laporan mulai ditangani.")
      } else if (status === "resolved") {
        setSuccess("Laporan ditandai selesai dan fasilitas diaktifkan kembali.")
      } else {
        setSuccess("Laporan ditolak.")
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pembaruan gagal")
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
      void execute(reportId, status)
      return
    }
    setConfirmAction({ reportId, status })
  }

  function confirmProcess() {
    if (!confirmAction) return
    setIsSubmitting(true)
    void execute(
      confirmAction.reportId,
      confirmAction.status,
      confirmAction.status === "resolved" ? false : undefined
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
              <Badge
                variant="secondary"
                className="h-5 min-w-5 justify-center px-1.5 text-xs"
              >
                {reports ? tabCounts[tab] : "…"}
              </Badge>
            </TabsTab>
          ))}
        </TabsList>
        <TabsPanel value={activeTab} className="space-y-6">
          <div className="flex flex-wrap items-end gap-3">
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
                Menampilkan {visibleReports.length} dari {reports.length}{" "}
                laporan
              </p>
            )}
          </div>
          {!visibleReports || !reports ? (
            <PortalListSkeleton layout="grid" />
          ) : visibleReports.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              {reportTabEmptyMessages[activeTab]}
            </Card>
          ) : (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {visibleReports.map((report) => (
                <Card
                  key={report.id}
                  className="gap-4 p-5 transition-shadow duration-200 hover:shadow-lg sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-heading font-semibold break-words">
                        {report.facilityName}
                      </h2>
                      <p className="mt-1 text-sm break-words text-muted-foreground">
                        {report.reporterName} · {report.reporterEmail}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "shrink-0",
                        report.status === "resolved" &&
                          "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
                        report.status === "in_progress" &&
                          "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300"
                      )}
                    >
                      {labels[report.status]}
                    </Badge>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      {report.category}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {report.description}
                    </p>
                  </div>
                  {report.photoUrl && (
                    <div className="flex min-h-40 items-center justify-center rounded-xl bg-muted/30 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={report.photoUrl}
                        alt="Bukti laporan"
                        className="block max-h-72 w-full rounded-lg object-contain"
                      />
                    </div>
                  )}
                  {report.status === "pending" ||
                  report.status === "in_progress" ? (
                    <div className="space-y-3 border-t border-border/70 pt-4">
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
                          checked={maintenance[report.id] ?? false}
                          onCheckedChange={(checked) =>
                            setMaintenance((current) => ({
                              ...current,
                              [report.id]: checked === true,
                            }))
                          }
                        />
                        Tandai fasilitas dalam perbaikan
                      </label>
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
                          onClick={() => requestProcess(report.id, "rejected")}
                        >
                          Tolak
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 border-t border-border/70 pt-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Catatan penanganan
                        </p>
                        <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
                          {report.resolutionNote || "Tidak ada catatan."}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Diperbarui {formatDate(report.updatedAt)}
                      </p>
                    </div>
                  )}
                </Card>
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
