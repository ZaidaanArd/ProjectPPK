"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconBellRinging,
  IconCalendarPlus,
  IconCheck,
  IconClockPlus,
  IconLock,
  IconLockOpen,
  IconTool,
  IconX,
} from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { PortalPageHeader } from "@/components/portal-page-header"
import { PortalListSkeleton } from "@/components/portal-skeletons"
import { ReservationDatePicker } from "@/components/reservation-date-picker"
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
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  useAppAuth,
  useAppMutation as useMutation,
  useAppQuery,
} from "@/lib/data-hooks"
import { isOngoing } from "@/lib/maintenance-display"
import {
  displayTime,
  reservationTimes,
  toTimestamp,
  type BusyRange,
} from "@/lib/reservation-slots"
import { toastError } from "@/lib/toast"
import {
  ClosureCard,
  ClosureDialog,
  DisruptionDialog,
  ENDING_SOON_MS,
  IssueCard,
  OpsLegend,
  ReopenClosureDialog,
  formatDateTime,
  todayJakarta,
  type ClosureItem,
  type IssueItem,
} from "@/components/staff-ops-panels"
import {
  Tabs,
  TabsCount,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"
import { cn } from "@/lib/utils"

const SLOT_MS = 30 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

const dateLabel = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Asia/Jakarta",
})
const timeLabel = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
})

function jakartaDate(timestamp: number) {
  return new Date(timestamp + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** "Sen, 12 Okt · 10.00–14.00", or both dates when the range spans days. */
export function formatWindow(startAt: number, endAt: number) {
  const time = (value: number) => timeLabel.format(value).replace(":", ".")
  return jakartaDate(startAt) === jakartaDate(endAt)
    ? `${dateLabel.format(startAt)} · ${time(startAt)}–${time(endAt)}`
    : `${dateLabel.format(startAt)} ${time(startAt)} – ${dateLabel.format(endAt)} ${time(endAt)}`
}

/** The current time, refreshed every minute so phases and past slots move. */
function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

/** Everything that already occupies a facility on one day, for the picker. */
function useDayAgenda(facilityId: string, date: string) {
  const now = useNow()
  const { isAuthenticated } = useAppAuth()
  const dayStart = Date.parse(`${date}T00:00:00+07:00`)
  const agenda = useAppQuery(
    api.maintenance.agenda,
    isAuthenticated && facilityId
      ? {
          facilityId: facilityId as Id<"facilities">,
          rangeStart: dayStart,
          rangeEnd: dayStart + DAY_MS,
        }
      : "skip"
  )
  const busy = useMemo<BusyRange[] | undefined>(() => {
    if (!agenda) return undefined
    // Slots that have already ended today cannot be scheduled either.
    const passed = Math.floor(now / SLOT_MS) * SLOT_MS
    return [
      ...agenda.reservations,
      ...agenda.maintenance,
      ...(passed > dayStart ? [{ startAt: dayStart, endAt: passed }] : []),
    ]
  }, [agenda, dayStart, now])
  return { agenda, busy }
}

/**
 * Picks a free time range for a repair. Approved and pending reservations,
 * other repairs, and past slots all count as taken: a repair yields to
 * bookings, so staff decide pending requests first.
 */
export function ScheduleMaintenanceDialog({
  open,
  onClose,
  facilityId: fixedFacilityId,
  initialFacilityId,
  facilityName,
  reportId,
}: {
  open: boolean
  onClose: () => void
  facilityId?: string
  initialFacilityId?: string
  facilityName?: string
  reportId?: Id<"reports">
}) {
  const facilities = useAppQuery(api.facilities.listPublic)
  const schedule = useMutation(api.maintenance.schedule)
  const [chosenFacility, setChosenFacility] = useState(initialFacilityId ?? "")
  const [previousOpen, setPreviousOpen] = useState(open)
  const [previousInitialFacilityId, setPreviousInitialFacilityId] =
    useState(initialFacilityId)
  const facilityId = fixedFacilityId ?? chosenFacility
  const [date, setDate] = useState(todayJakarta)
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [reason, setReason] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const { agenda, busy } = useDayAgenda(facilityId, date)
  const pendingCount =
    agenda?.reservations.filter((item) => item.status === "pending").length ?? 0

  // Reset on a new opening before the dialog and its agenda are rendered.
  if (
    open !== previousOpen ||
    initialFacilityId !== previousInitialFacilityId
  ) {
    setPreviousOpen(open)
    setPreviousInitialFacilityId(initialFacilityId)
    if (open && !fixedFacilityId) {
      setChosenFacility(initialFacilityId ?? "")
      setStart("")
      setEnd("")
    }
  }

  function reset() {
    setChosenFacility("")
    setDate(todayJakarta())
    setStart("")
    setEnd("")
    setReason("")
    setMessage("")
  }

  function close() {
    if (pending) return
    reset()
    onClose()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!facilityId) return setMessage("Pilih fasilitas terlebih dahulu.")
    if (!start || !end) return setMessage("Pilih rentang waktu yang kosong.")
    if (!reason.trim()) return setMessage("Isi alasan perbaikan.")
    setPending(true)
    setMessage("")
    try {
      await schedule({
        facilityId: facilityId as Id<"facilities">,
        startAt: toTimestamp(date, start),
        endAt: toTimestamp(date, end),
        reason,
        reportId,
      })
      toast.success("Perbaikan dijadwalkan", {
        description: "Slot di rentang itu sekarang tertutup untuk reservasi.",
      })
      reset()
      onClose()
    } catch (error) {
      setMessage(toastError("Jadwal perbaikan gagal disimpan", error))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      size="xl"
      labelledBy="maintenance-title"
    >
      <DialogHeader className="mb-5">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
            <IconTool size={20} aria-hidden="true" />
          </span>
          <div>
            <DialogTitle id="maintenance-title" className="text-xl font-bold">
              Jadwalkan perbaikan
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              {facilityName ? `${facilityName}. ` : ""}Perbaikan hanya bisa di
              waktu yang kosong. Selama perbaikan, slot itu tidak bisa dipesan;
              jam lain tetap terbuka.
            </DialogDescription>
          </div>
        </div>
        <DialogCloseButton onClose={close} />
      </DialogHeader>

      <form onSubmit={submit} className="space-y-5">
        {!fixedFacilityId && (
          <div className="grid gap-1.5">
            <Label htmlFor="maintenance-facility">Fasilitas</Label>
            <Select
              value={chosenFacility || null}
              disabled={!facilities || pending}
              onValueChange={(value) => {
                setChosenFacility(value ?? "")
                setStart("")
                setEnd("")
              }}
            >
              <SelectTrigger id="maintenance-facility" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    facilities?.find((facility) => facility.id === value)
                      ?.name ?? "Pilih fasilitas"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent portalled={false}>
                {(facilities ?? []).map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="maintenance-date">Tanggal</Label>
          <ReservationDatePicker
            id="maintenance-date"
            label="Tanggal perbaikan"
            portalled={false}
            disabled={pending}
            value={date}
            onChange={(value) => {
              setDate(value)
              setStart("")
              setEnd("")
            }}
          />
        </div>

        <TimeSlotPicker
          allowElapsed
          date={date}
          busy={busy}
          disabled={!facilityId || !busy}
          start={start}
          end={end}
          onChange={(range) => {
            setStart(range.start)
            setEnd(range.end)
          }}
        />
        {pendingCount > 0 && (
          <p className="rounded-2xl border border-border/80 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {pendingCount} reservasi menunggu di tanggal ini ikut menutup slot.
            Setujui atau tolak dulu di{" "}
            <Link
              href="/staff/reservations"
              className="font-semibold underline"
            >
              antrean reservasi
            </Link>{" "}
            bila perbaikan harus di jam itu.
          </p>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="maintenance-reason">Alasan perbaikan</Label>
          <Textarea
            id="maintenance-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Contoh: ganti unit AC"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Perkirakan jam selesai. Bila belum beres bisa diperpanjang; bila
            lebih cepat, tekan Selesai agar slot terbuka lagi.
          </p>
        </div>

        {message && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={close}>
            Batal
          </Button>
          <Button type="submit" disabled={pending}>
            <IconCalendarPlus size={16} aria-hidden="true" />
            {pending ? "Menyimpan…" : "Simpan jadwal"}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

type WindowItem = NonNullable<
  ReturnType<typeof useAuthenticatedQuery<typeof api.maintenance.listManaged>>
>[number]

function ExtendDialog({
  window,
  onClose,
}: {
  window: WindowItem | null
  onClose: () => void
}) {
  const extend = useMutation(api.maintenance.extend)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const currentEndDate = window ? jakartaDate(window.endAt) : ""
  const shownDate = date || currentEndDate
  const endAt = time ? toTimestamp(shownDate, time) : 0

  function close() {
    if (pending) return
    setDate("")
    setTime("")
    setMessage("")
    onClose()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!window) return
    if (!time) return setMessage("Pilih jam selesai baru.")
    setPending(true)
    setMessage("")
    try {
      await extend({ windowId: window.id, endAt })
      toast.success("Perbaikan diperpanjang")
      setPending(false)
      close()
    } catch (error) {
      setMessage(toastError("Perpanjangan gagal", error))
      setPending(false)
    }
  }

  return (
    <Dialog
      open={Boolean(window)}
      onClose={close}
      size="md"
      labelledBy="extend-title"
    >
      <DialogHeader className="mb-5">
        <DialogTitle id="extend-title" className="text-xl font-bold">
          Perpanjang perbaikan
        </DialogTitle>
        <DialogDescription>
          {window
            ? `${window.facilityName} · sekarang ${formatWindow(window.startAt, window.endAt)}. Waktu tambahan juga harus kosong.`
            : ""}
        </DialogDescription>
        <DialogCloseButton onClose={close} />
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="extend-date">Tanggal selesai baru</Label>
          <ReservationDatePicker
            id="extend-date"
            label="Tanggal selesai baru"
            portalled={false}
            disabled={pending}
            minDate={currentEndDate || todayJakarta()}
            value={shownDate || todayJakarta()}
            onChange={(value) => {
              setDate(value)
              setTime("")
            }}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="extend-time">Jam selesai baru</Label>
          <Select
            value={time || null}
            onValueChange={(value) => setTime(value ?? "")}
            disabled={pending}
          >
            <SelectTrigger id="extend-time" className="w-40">
              <SelectValue>
                {(value: string | null) =>
                  value ? displayTime(value) : "Pilih jam"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent portalled={false}>
              {reservationTimes.slice(1).map((item) => (
                <SelectItem
                  key={item}
                  value={item}
                  disabled={
                    !window || toTimestamp(shownDate, item) <= window.endAt
                  }
                >
                  {displayTime(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {message && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={close}>
            Batal
          </Button>
          <Button type="submit" disabled={pending}>
            <IconClockPlus size={16} aria-hidden="true" />
            {pending ? "Menyimpan…" : "Perpanjang"}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

const statusText = {
  ongoing: "Berlangsung",
  upcoming: "Terjadwal",
  completed: "Selesai",
  cancelled: "Dibatalkan",
} as const

function phase(window: WindowItem, now: number) {
  if (window.status !== "scheduled") return window.status
  return isOngoing(window, now) ? "ongoing" : "upcoming"
}

function WindowCard({
  window,
  now,
  onExtend,
  onClose,
}: {
  window: WindowItem
  now: number
  onExtend: (window: WindowItem) => void
  onClose: (window: WindowItem) => void
}) {
  const current = phase(window, now)
  return (
    <Card className="gap-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{window.facilityName}</p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatWindow(window.startAt, window.endAt)}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            current === "ongoing" &&
              "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
            current === "upcoming" &&
              "bg-pink-100 text-pink-800 dark:bg-pink-400/15 dark:text-pink-100"
          )}
        >
          {statusText[current]}
        </Badge>
      </div>
      <p className="text-sm">{window.reason}</p>
      <p className="text-xs text-muted-foreground">
        Dijadwalkan oleh {window.createdByName}
        {window.reportId ? (
          <>
            {" · dari "}
            <Link
              href={`/staff/reports?item=${window.reportId}`}
              className="underline"
            >
              laporan {window.reportCategory ?? ""}
            </Link>
          </>
        ) : null}
      </p>
      {window.status === "scheduled" && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onExtend(window)}>
            <IconClockPlus size={15} aria-hidden="true" />
            Perpanjang
          </Button>
          <Button
            size="sm"
            variant={current === "ongoing" ? "default" : "destructive"}
            onClick={() => onClose(window)}
          >
            {current === "ongoing" ? (
              <IconCheck size={15} aria-hidden="true" />
            ) : (
              <IconX size={15} aria-hidden="true" />
            )}
            {current === "ongoing" ? "Selesai sekarang" : "Batalkan"}
          </Button>
        </div>
      )}
    </Card>
  )
}

export type OpsTab = "perbaikan" | "gangguan" | "penutupan" | "riwayat"

export function StaffMaintenance({
  initialFacilityId,
  autoSchedule = false,
  initialTab = "perbaikan",
}: {
  initialFacilityId?: string
  autoSchedule?: boolean
  initialTab?: OpsTab
}) {
  const router = useRouter()
  const facilities = useAuthenticatedQuery(api.facilities.listPublic, {})
  const windows = useAuthenticatedQuery(api.maintenance.listManaged, {})
  const closeWindow = useMutation(api.maintenance.close)
  const [scheduling, setScheduling] = useState(false)
  const [scheduleFacilityId, setScheduleFacilityId] = useState<string>()
  const [entryMessage, setEntryMessage] = useState("")
  const [handledRequest, setHandledRequest] = useState<string | null>(null)
  const requestKey = autoSchedule ? (initialFacilityId ?? "") : null
  const [extending, setExtending] = useState<WindowItem | null>(null)
  const [closing, setClosing] = useState<WindowItem | null>(null)
  const [busy, setBusy] = useState(false)
  const now = useNow()
  const closingPhase = closing ? phase(closing, now) : null
  const issues = useAuthenticatedQuery(api.facilityIssues.listManaged, {})
  const closures = useAuthenticatedQuery(api.emergencyClosures.listManaged, {})
  const [issueDialog, setIssueDialog] = useState<{
    issue: IssueItem | null
  } | null>(null)
  const [closureOpen, setClosureOpen] = useState(false)
  const [reopening, setReopening] = useState<ClosureItem | null>(null)
  const [activeTab, setActiveTab] = useState<OpsTab>(initialTab)

  // Keep the open tab in the URL so links and reloads land on it.
  function changeTab(tab: OpsTab) {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set("tab", tab)
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false })
  }

  const clearScheduleRequest = useCallback(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has("facility") && !url.searchParams.has("schedule"))
      return
    url.searchParams.delete("facility")
    url.searchParams.delete("schedule")
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false })
  }, [router])

  // Consume each URL request once after the facility list is available.
  if (requestKey === null && handledRequest !== null) {
    setHandledRequest(null)
  } else if (
    requestKey !== null &&
    facilities &&
    handledRequest !== requestKey
  ) {
    setHandledRequest(requestKey)
    const facility = facilities.find((item) => item.id === requestKey)
    if (!facility) {
      setEntryMessage(
        "Fasilitas tidak ditemukan atau sudah nonaktif. Pilih fasilitas lain melalui Jadwalkan perbaikan."
      )
    } else {
      setEntryMessage("")
      setScheduleFacilityId(facility.id)
      setScheduling(true)
    }
  }

  useEffect(() => {
    if (entryMessage && requestKey !== null && handledRequest === requestKey) {
      clearScheduleRequest()
    }
  }, [entryMessage, requestKey, handledRequest, clearScheduleRequest])

  function closeScheduling() {
    setScheduling(false)
    setScheduleFacilityId(undefined)
    clearScheduleRequest()
  }

  const groups = useMemo(() => {
    const ongoing: WindowItem[] = []
    const upcoming: WindowItem[] = []
    const history: WindowItem[] = []
    for (const window of windows ?? []) {
      const current = phase(window, now)
      if (current === "ongoing") ongoing.push(window)
      else if (current === "upcoming") upcoming.push(window)
      else history.push(window)
    }
    const byStart = (a: WindowItem, b: WindowItem) => a.startAt - b.startAt
    return {
      ongoing: ongoing.sort(byStart),
      upcoming: upcoming.sort(byStart),
      history,
    }
  }, [windows, now])

  async function confirmClose() {
    if (!closing) return
    setBusy(true)
    try {
      const result = await closeWindow({ windowId: closing.id })
      toast.success(
        result === "completed"
          ? "Perbaikan selesai; slot sudah terbuka lagi."
          : "Jadwal perbaikan dibatalkan."
      )
    } catch (error) {
      toastError("Gagal mengubah jadwal perbaikan", error)
    } finally {
      setBusy(false)
      setClosing(null)
    }
  }

  const openIssues = (issues ?? []).filter((issue) => issue.status === "open")
  const activeClosures = (closures ?? []).filter(
    (closure) => closure.status === "closed"
  )
  const endingSoon = groups.ongoing.filter(
    (window) => window.endAt - now <= ENDING_SOON_MS
  )
  // Everything that is over, newest first, across the three kinds of work.
  const history = [
    ...groups.history.map((window) => ({
      at: window.closedAt ?? window.endAt,
      node: (
        <WindowCard
          key={window.id}
          window={window}
          now={now}
          onExtend={setExtending}
          onClose={setClosing}
        />
      ),
    })),
    ...(issues ?? [])
      .filter((issue) => issue.status !== "open")
      .map((issue) => ({
        at: issue.updatedAt,
        node: <IssueCard key={issue.id} issue={issue} />,
      })),
    ...(closures ?? [])
      .filter((closure) => closure.status !== "closed")
      .map((closure) => ({
        at: closure.reopenedAt ?? closure.closedAt,
        node: <ClosureCard key={closure.id} closure={closure} />,
      })),
  ].sort((a, b) => b.at - a.at)

  const tabs: {
    key: OpsTab
    label: string
    count: number | undefined
  }[] = [
    {
      key: "perbaikan",
      label: "Perbaikan",
      count: windows
        ? groups.ongoing.length + groups.upcoming.length
        : undefined,
    },
    { key: "gangguan", label: "Gangguan", count: issues && openIssues.length },
    {
      key: "penutupan",
      label: "Penutupan",
      count: closures && activeClosures.length,
    },
    { key: "riwayat", label: "Riwayat", count: undefined },
  ]

  const emptyState = (text: string) => (
    <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
      {text}
    </p>
  )

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Operasional fasilitas"
        title="Jadwal perbaikan"
        description="Jadwalkan perbaikan, catat gangguan ringan, dan tutup fasilitas saat darurat dari satu tempat."
        icon={IconTool}
        layout="actions-right"
      >
        <Button
          onClick={() => {
            setEntryMessage("")
            setScheduleFacilityId(undefined)
            setScheduling(true)
          }}
        >
          <IconCalendarPlus size={16} aria-hidden="true" />
          Jadwalkan perbaikan
        </Button>
        <Button
          variant="outline"
          onClick={() => setIssueDialog({ issue: null })}
        >
          <IconAlertTriangle size={16} aria-hidden="true" />
          Catat gangguan
        </Button>
        <Button
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-400/10"
          onClick={() => setClosureOpen(true)}
        >
          <IconLock size={16} aria-hidden="true" />
          Tutup darurat
        </Button>
      </PortalPageHeader>

      <OpsLegend />

      {entryMessage && (
        <output className="block rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {entryMessage}
        </output>
      )}

      {(endingSoon.length > 0 || activeClosures.length > 0) && (
        <section
          aria-labelledby="ops-attention"
          className="space-y-2 rounded-3xl border border-amber-300/60 bg-amber-50/70 p-4 dark:border-amber-300/20 dark:bg-amber-400/5"
        >
          <h2
            id="ops-attention"
            className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100"
          >
            <IconBellRinging size={17} aria-hidden="true" />
            Perlu perhatian
          </h2>
          <ul className="space-y-2">
            {endingSoon.map((window) => (
              <li
                key={window.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3"
              >
                <span className="text-sm">
                  Perbaikan <strong>{window.facilityName}</strong> berakhir{" "}
                  {formatDateTime(window.endAt)}. Sudah beres?
                </span>
                <span className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExtending(window)}
                  >
                    <IconClockPlus aria-hidden="true" />
                    Perpanjang
                  </Button>
                  <Button size="sm" onClick={() => setClosing(window)}>
                    <IconCheck aria-hidden="true" />
                    Selesai
                  </Button>
                </span>
              </li>
            ))}
            {activeClosures.map((closure) => (
              <li
                key={closure.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3"
              >
                <span className="text-sm">
                  <strong>{closure.facilityName}</strong> ditutup darurat sejak{" "}
                  {formatDateTime(closure.closedAt)}.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReopening(closure)}
                >
                  <IconLockOpen aria-hidden="true" />
                  Buka kembali
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) => changeTab(value as OpsTab)}
      >
        <TabsList aria-label="Jenis pekerjaan" className="grid-cols-4">
          {tabs.map((tab) => (
            <TabsTab key={tab.key} value={tab.key}>
              {tab.label}
              {tab.count !== undefined && <TabsCount>{tab.count}</TabsCount>}
            </TabsTab>
          ))}
        </TabsList>

        <TabsPanel value="perbaikan" className="space-y-6">
          {!windows ? (
            <PortalListSkeleton layout="grid" />
          ) : (
            [
              {
                key: "ongoing",
                title: "Sedang berlangsung",
                items: groups.ongoing,
                empty: "Tidak ada perbaikan yang sedang berjalan.",
              },
              {
                key: "upcoming",
                title: "Terjadwal",
                items: groups.upcoming,
                empty: "Belum ada perbaikan terjadwal.",
              },
            ].map((section) => (
              <section
                key={section.key}
                aria-labelledby={`maintenance-${section.key}`}
                className="space-y-3"
              >
                <h2
                  id={`maintenance-${section.key}`}
                  className="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  {section.title} ({section.items.length})
                </h2>
                {section.items.length === 0 ? (
                  emptyState(section.empty)
                ) : (
                  <div className="grid items-start gap-3 lg:grid-cols-2">
                    {section.items.map((window) => (
                      <WindowCard
                        key={window.id}
                        window={window}
                        now={now}
                        onExtend={setExtending}
                        onClose={setClosing}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))
          )}
        </TabsPanel>

        <TabsPanel value="gangguan" className="space-y-3">
          {!issues ? (
            <PortalListSkeleton layout="grid" />
          ) : openIssues.length === 0 ? (
            emptyState("Tidak ada gangguan aktif.")
          ) : (
            <div className="grid items-start gap-3 lg:grid-cols-2">
              {openIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onEdit={(item) => setIssueDialog({ issue: item })}
                />
              ))}
            </div>
          )}
        </TabsPanel>

        <TabsPanel value="penutupan" className="space-y-3">
          {!closures ? (
            <PortalListSkeleton layout="grid" />
          ) : activeClosures.length === 0 ? (
            emptyState("Tidak ada fasilitas yang sedang ditutup darurat.")
          ) : (
            <div className="grid items-start gap-3 lg:grid-cols-2">
              {activeClosures.map((closure) => (
                <ClosureCard
                  key={closure.id}
                  closure={closure}
                  onReopen={setReopening}
                />
              ))}
            </div>
          )}
        </TabsPanel>

        <TabsPanel value="riwayat" className="space-y-3">
          {!windows || !issues || !closures ? (
            <PortalListSkeleton layout="grid" />
          ) : history.length === 0 ? (
            emptyState("Belum ada riwayat.")
          ) : (
            <div className="grid items-start gap-3 lg:grid-cols-2">
              {history.map((entry) => entry.node)}
            </div>
          )}
        </TabsPanel>
      </Tabs>

      <ScheduleMaintenanceDialog
        open={scheduling}
        initialFacilityId={scheduleFacilityId}
        onClose={closeScheduling}
      />
      {issueDialog && (
        <DisruptionDialog
          open
          issue={issueDialog.issue}
          onClose={() => setIssueDialog(null)}
        />
      )}
      <ClosureDialog open={closureOpen} onClose={() => setClosureOpen(false)} />
      <ReopenClosureDialog
        closure={reopening}
        onClose={() => setReopening(null)}
      />
      <ExtendDialog window={extending} onClose={() => setExtending(null)} />
      <AlertDialog
        open={closing !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setClosing(null)
        }}
      >
        <AlertDialogContent className="bg-card text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {closingPhase === "ongoing"
                ? "Perbaikan sudah selesai?"
                : "Batalkan jadwal perbaikan?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {closing
                ? `${closing.facilityName} · ${formatWindow(closing.startAt, closing.endAt)}. ${
                    closingPhase === "ongoing"
                      ? "Perbaikan diakhiri sekarang dan slot setelahnya langsung bisa dipesan."
                      : "Slot di rentang ini kembali bisa dipesan."
                  }`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Kembali</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={confirmClose}>
              {busy
                ? "Memproses…"
                : closingPhase === "ongoing"
                  ? "Ya, selesai"
                  : "Ya, batalkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
