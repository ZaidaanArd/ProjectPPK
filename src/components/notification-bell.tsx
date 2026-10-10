"use client"

import { useState } from "react"
import { IconBell } from "@tabler/icons-react"
import type { FunctionReturnType } from "convex/server"

import { api } from "../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppMutation } from "@/lib/data-hooks"
import { toastError } from "@/lib/toast"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"
import { cn } from "cn"

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

export function NotificationBell({ disabled }: { disabled?: boolean }) {
  const notifications = useAuthenticatedQuery(api.notifications.listMine, {})
  const unread = useAuthenticatedQuery(api.notifications.unreadCount, {})
  const markRead = useAppMutation(api.notifications.markRead)
  const markAllRead = useAppMutation(api.notifications.markAllRead)
  const [pending, setPending] = useState<string | null>(null)
  const [openedAt, setOpenedAt] = useState(0)
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

  async function handleReadAll() {
    try {
      await markAllRead({})
    } catch (error) {
      toastError("Gagal menandai semua notifikasi", error)
    }
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) setOpenedAt(Date.now())
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            disabled={disabled}
            aria-label={`Notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ""}`}
            className="relative rounded-xl text-[#8a2958] hover:bg-pink-50 dark:text-pink-200 dark:hover:bg-pink-950/50"
          />
        }
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
        className="max-h-[min(24rem,var(--available-height))] w-80 max-w-[calc(100vw-2rem)]"
      >
        <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
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
            return (
              <DropdownMenuItem
                key={item.id}
                onClick={() => void handleRead(item)}
                className={cn(
                  "items-start gap-2.5",
                  unreadItem && "bg-pink-50/60 dark:bg-pink-950/30"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    unreadItem
                      ? "bg-pink-600 dark:bg-pink-400"
                      : "bg-transparent"
                  )}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
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
                    {formatRelativeTime(item.createdAt, openedAt || item.createdAt)}
                  </span>
                </span>
              </DropdownMenuItem>
            )
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
