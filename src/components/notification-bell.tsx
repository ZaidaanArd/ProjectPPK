"use client"

import Link from "next/link"
import { useState } from "react"
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBan,
  IconBell,
  IconCalendarEvent,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
  IconClockOff,
  IconLock,
  IconLockOpen,
  IconTool,
  type Icon,
} from "@tabler/icons-react"
import type { FunctionReturnType } from "convex/server"

import { api } from "../../convex/_generated/api"
import { ReservationTicket } from "@/components/portal-cards"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppAuth, useAppMutation, useAppQuery } from "@/lib/data-hooks"
import { useScheduleClock } from "@/hooks/use-schedule-clock"
import { toastError } from "@/lib/toast"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"
import { cn } from "cn"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
  DialogFooter,
} from "@/components/ui/dialog"

type NotificationItem = FunctionReturnType<
  typeof api.notifications.listMine
>[number]

const relativeFormatter = new Intl.RelativeTimeFormat("id-ID", {
  numeric: "auto",
})
const relativeSteps = [
  { amount: 60_000, unit: "minute" },
  { amount: 3_600_000, unit: "hour" },
  { amount: 86_400_000, unit: "day" },
] as const
const absoluteFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})

function formatRelativeTime(value: number, now: number) {
  const elapsed = value - now
  for (const step of relativeSteps) {
    if (Math.abs(elapsed) < step.amount)
      return relativeFormatter.format(
        Math.round(elapsed / step.amount),
        step.unit
      )
  }
  return absoluteFormatter.format(value)
}

function referenceHref(item: NotificationItem): string | null {
  if (item.type === "maintenance.reminder") return "/staff/maintenance"
  if (item.reservationId)
    return `/app/reservations?item=${encodeURIComponent(item.reservationId)}`
  if (item.changeId) return "/app/reservations"
  if (item.closureId && item.facilityId) return "/app/reservations"
  if (item.issueId && item.facilityId) return "/facilities"
  if (item.facilityId) return "/facilities"
  return null
}

function referenceLabel(item: NotificationItem): string | null {
  if (item.type === "maintenance.reminder") return "Buka jadwal perbaikan"
  if (item.reservationId || item.changeId) return "Lihat reservasi"
  if (item.closureId) return "Lihat reservasi terdampak"
  if (item.issueId) return "Lihat fasilitas"
  if (item.facilityId) return "Lihat fasilitas"
  return null
}

const typeMeta: Record<
  NotificationItem["type"],
  { label: string; icon: Icon; tone: string }
> = {
  "reservation.approved": {
    label: "Reservasi disetujui",
    icon: IconCircleCheck,
    tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
  "reservation.rejected": {
    label: "Reservasi ditolak",
    icon: IconCircleX,
    tone: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  },
  "reservation.cancelled": {
    label: "Reservasi dibatalkan",
    icon: IconBan,
    tone: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  },
  "reservation.expired": {
    label: "Reservasi kedaluwarsa",
    icon: IconClockOff,
    tone: "bg-muted text-muted-foreground",
  },
  "reservation.change_decided": {
    label: "Ubah jadwal diputuskan",
    icon: IconCalendarEvent,
    tone: "bg-pink-100 text-pink-700 dark:bg-pink-400/15 dark:text-pink-200",
  },
  "reservation.change_conflict": {
    label: "Ubah jadwal bentrok",
    icon: IconAlertTriangle,
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  },
  "disruption.created": {
    label: "Gangguan fasilitas",
    icon: IconAlertTriangle,
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  },
  "disruption.updated": {
    label: "Gangguan diperbarui",
    icon: IconAlertTriangle,
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  },
  "disruption.resolved": {
    label: "Gangguan selesai",
    icon: IconCircleCheck,
    tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
  "emergency.closed": {
    label: "Penutupan darurat",
    icon: IconLock,
    tone: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  },
  "emergency.reopened": {
    label: "Fasilitas dibuka kembali",
    icon: IconLockOpen,
    tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
  "maintenance.reminder": {
    label: "Pengingat perbaikan",
    icon: IconTool,
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  },
}

const reservationStatusLabel: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
  completed: "Selesai",
}

export function NotificationBell({ disabled }: { disabled?: boolean }) {
  const notifications = useAuthenticatedQuery(api.notifications.listMine, {})
  const unread = useAuthenticatedQuery(api.notifications.unreadCount, {})
  const markRead = useAppMutation(api.notifications.markRead)
  const markAllRead = useAppMutation(api.notifications.markAllRead)
  const [pending, setPending] = useState<string | null>(null)
  const [openedAt, setOpenedAt] = useState(0)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selected, setSelected] = useState<NotificationItem | null>(null)
  const unreadCount = unread ?? 0

  async function handleRead(item: NotificationItem) {
    if (item.readAt !== undefined || pending) return
    setPending(item.id)
    try {
      await markRead({ notificationId: item.id })
    } catch (error) {
      toastError("Gagal menandai notifikasi", error)
    } finally {
      setPending(null)
    }
  }

  /** Opens the details popup; reading it counts as read. */
  function openDetail(item: NotificationItem) {
    setSelected(item)
    void handleRead(item)
  }

  async function handleReadAll() {
    try {
      await markAllRead({})
    } catch (error) {
      toastError("Gagal menandai semua notifikasi", error)
    }
  }

  return (
    <>
      <DropdownMenu
        onOpenChange={(open) => {
          if (open) setOpenedAt(Date.now())
        }}
      >
        <DropdownMenuTrigger
          disabled={
            disabled || notifications === undefined || unread === undefined
          }
          aria-label={`Notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ""}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "relative rounded-xl text-[#8a2958] hover:bg-pink-50 dark:text-pink-200 dark:hover:bg-pink-950/50"
          )}
        >
          <IconBell aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-600 px-1 text-[10px] font-semibold text-white dark:bg-pink-500"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="max-h-[min(26rem,var(--available-height))] w-[22rem] max-w-[calc(100vw-2rem)]"
        >
          <DropdownMenuGroup>
            <div className="flex items-center justify-between gap-2 pr-1">
              <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {unreadCount} belum dibaca
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <>
                <DropdownMenuItem onClick={() => void handleReadAll()}>
                  Tandai semua dibaca
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {notifications === undefined ? (
              <DropdownMenuItem disabled>Memuat notifikasi…</DropdownMenuItem>
            ) : notifications.length === 0 ? (
              <DropdownMenuItem disabled>
                Belum ada notifikasi untuk akun ini
              </DropdownMenuItem>
            ) : (
              notifications.map((item) => {
                const unreadItem = item.readAt === undefined
                const meta = typeMeta[item.type]
                const TypeIcon = meta.icon
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => openDetail(item)}
                    aria-label={`${item.title}. Buka detail`}
                    className={cn(
                      "items-start gap-2.5 py-2.5",
                      unreadItem && "bg-pink-50/60 dark:bg-pink-950/30"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
                        meta.tone
                      )}
                    >
                      <TypeIcon size={15} />
                      {unreadItem && (
                        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-popover bg-pink-600 dark:bg-pink-400" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span
                        className={cn(
                          "truncate text-sm",
                          unreadItem
                            ? "font-semibold text-foreground"
                            : "font-medium text-muted-foreground"
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {item.body}
                      </span>
                      <span className="text-[11px] text-muted-foreground/80">
                        {formatRelativeTime(
                          item.createdAt,
                          openedAt || item.createdAt
                        )}
                      </span>
                    </span>
                    <IconChevronRight
                      size={16}
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-muted-foreground/70"
                    />
                  </DropdownMenuItem>
                )
              })
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
            Semua notifikasi
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {historyOpen && (
        <NotificationHistory
          onClose={() => setHistoryOpen(false)}
          onOpen={openDetail}
        />
      )}
      {selected && (
        <NotificationDetail item={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

/** Full text of one notification, with what it is about and where to go. */
function NotificationDetail({
  item,
  onClose,
}: {
  item: NotificationItem
  onClose: () => void
}) {
  const { isAuthenticated } = useAppAuth()
  const now = useScheduleClock()
  const reservation = useAppQuery(
    api.reservations.getMine,
    isAuthenticated && item.reservationId
      ? { reservationId: item.reservationId }
      : "skip"
  )
  const meta = typeMeta[item.type]
  const TypeIcon = meta.icon
  const href = referenceHref(item)
  const label = referenceLabel(item)

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      labelledBy="notification-detail-title"
    >
      <DialogHeader className="mb-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-2xl",
              meta.tone
            )}
          >
            <TypeIcon size={21} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {meta.label}
            </p>
            <DialogTitle
              id="notification-detail-title"
              className="mt-0.5 text-lg leading-snug font-bold"
            >
              {item.title}
            </DialogTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {absoluteFormatter.format(item.createdAt)} ·{" "}
              {formatRelativeTime(item.createdAt, now ?? item.createdAt)}
            </p>
          </div>
        </div>
        <DialogCloseButton onClose={onClose} />
      </DialogHeader>

      <p className="text-sm leading-relaxed whitespace-pre-line">{item.body}</p>

      {item.reservationId && (
        <div className="mt-5">
          {reservation === undefined ? (
            <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
              Memuat detail reservasi…
            </p>
          ) : reservation === null ? (
            <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
              Detail reservasi tidak tersedia untuk akun ini.
            </p>
          ) : (
            <ReservationTicket
              compactDate
              facilityName={reservation.facilityName}
              location={reservation.facilityLocation}
              startAt={reservation.startAt}
              endAt={reservation.endAt}
              status={reservation.status}
              statusLabel={
                reservationStatusLabel[reservation.status] ?? reservation.status
              }
              purpose={reservation.purpose}
              decisionNote={reservation.decisionNote}
              createdAt={reservation.createdAt}
              updatedAt={reservation.updatedAt}
            />
          )}
        </div>
      )}

      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onClose}>
          Tutup
        </Button>
        {href && label && (
          <Link href={href} onClick={onClose} className={buttonVariants()}>
            {label}
            <IconArrowRight aria-hidden="true" />
          </Link>
        )}
      </DialogFooter>
    </Dialog>
  )
}

function NotificationHistory({
  onClose,
  onOpen,
}: {
  onClose: () => void
  onOpen: (item: NotificationItem) => void
}) {
  const [cursors, setCursors] = useState<(string | null)[]>([null])
  const page = useAuthenticatedQuery(api.notifications.listPage, {
    paginationOpts: { cursor: cursors.at(-1) ?? null, numItems: 20 },
  })
  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      labelledBy="notification-history-title"
    >
      <DialogHeader>
        <DialogTitle id="notification-history-title">
          Semua notifikasi
        </DialogTitle>
        <DialogCloseButton onClose={onClose} />
      </DialogHeader>
      <div className="max-h-[60vh] space-y-2 overflow-y-auto">
        {!page ? (
          <p>Memuat notifikasi…</p>
        ) : page.page.length === 0 ? (
          <p>Belum ada notifikasi.</p>
        ) : (
          page.page.map((item) => {
            const meta = typeMeta[item.type]
            const TypeIcon = meta.icon
            const unreadItem = item.readAt === undefined
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpen(item)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors hover:border-pink-300 hover:bg-pink-50/50 dark:hover:bg-pink-950/20",
                  unreadItem &&
                    "border-pink-200 bg-pink-50/40 dark:border-pink-400/20 dark:bg-pink-950/20"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full",
                    meta.tone
                  )}
                >
                  <TypeIcon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm",
                      unreadItem ? "font-semibold" : "font-medium"
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
                    {item.body}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {absoluteFormatter.format(item.createdAt)}
                  </span>
                </span>
                <IconChevronRight
                  size={16}
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-muted-foreground/70"
                />
              </button>
            )
          })
        )}
      </div>
      <div className="mt-4 flex justify-between">
        <Button
          variant="outline"
          disabled={cursors.length === 1}
          onClick={() => setCursors((current) => current.slice(0, -1))}
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          disabled={!page || page.isDone}
          onClick={() => {
            if (page) setCursors((current) => [...current, page.continueCursor])
          }}
        >
          Berikutnya
        </Button>
      </div>
    </Dialog>
  )
}
