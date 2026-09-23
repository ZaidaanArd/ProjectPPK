"use client"

import { useState } from "react"
import { Popover } from "@base-ui/react/popover"
import {
  IconCalendarEvent,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"

const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
const shortDate = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})
const fullDate = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})
const monthLabel = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

function dateFromString(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function dateString(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function todayInJakarta() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const part = (type: string) => parts.find((item) => item.type === type)!.value
  return `${part("year")}-${part("month")}-${part("day")}`
}

export function ReservationDatePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => value.slice(0, 7))
  const today = todayInJakarta()
  const selectedDate = dateFromString(value)
  const [year, month] = visibleMonth.split("-").map(Number)
  const monthIndex = month - 1
  const firstWeekday =
    (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const cells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7

  function changeMonth(offset: number) {
    const next = new Date(Date.UTC(year, monthIndex + offset, 1))
    setVisibleMonth(
      dateString(next.getUTCFullYear(), next.getUTCMonth(), 1).slice(0, 7)
    )
  }

  function selectDate(next: string) {
    onChange(next)
    setOpen(false)
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setVisibleMonth(value.slice(0, 7))
        setOpen(nextOpen)
      }}
    >
      <Popover.Trigger
        id="reservation-date"
        type="button"
        aria-label={`Tanggal reservasi: ${fullDate.format(selectedDate)}`}
        className="flex h-11 w-full items-center gap-2 rounded-2xl border border-border bg-background px-3 text-left text-sm transition-colors outline-none hover:border-pink-300 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <IconCalendarEvent
          size={18}
          className="shrink-0 text-[#b00055] dark:text-pink-300"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate">
          {shortDate.format(selectedDate)}
        </span>
        <IconChevronDown
          size={16}
          className="shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={8}
          className="z-50"
        >
          <Popover.Popup className="w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-border bg-popover p-4 text-popover-foreground shadow-xl outline-none">
            <Popover.Title className="sr-only">
              Pilih tanggal reservasi
            </Popover.Title>
            <div className="mb-4 flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label="Bulan sebelumnya"
                onClick={() => changeMonth(-1)}
                disabled={visibleMonth <= today.slice(0, 7)}
                className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-30"
              >
                <IconChevronLeft size={18} aria-hidden="true" />
              </button>
              <span className="font-heading text-sm font-semibold">
                {monthLabel.format(new Date(Date.UTC(year, monthIndex, 1)))}
              </span>
              <button
                type="button"
                aria-label="Bulan berikutnya"
                onClick={() => changeMonth(1)}
                className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <IconChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdays.map((day) => (
                <span
                  key={day}
                  className="py-1 text-xs font-medium text-muted-foreground"
                >
                  {day}
                </span>
              ))}
              {Array.from({ length: cells }, (_, index) => {
                const day = index - firstWeekday + 1
                if (day < 1 || day > daysInMonth) {
                  return <span key={`empty-${index}`} aria-hidden="true" />
                }
                const current = dateString(year, monthIndex, day)
                const isSelected = current === value
                const isToday = current === today
                return (
                  <button
                    key={current}
                    type="button"
                    aria-label={fullDate.format(dateFromString(current))}
                    aria-pressed={isSelected}
                    aria-current={isToday ? "date" : undefined}
                    disabled={current < today}
                    onClick={() => selectDate(current)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-xl text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:text-muted-foreground/35",
                      isSelected
                        ? "bg-[#b00055] font-bold text-white hover:bg-[#990049]"
                        : "hover:bg-pink-100 hover:text-[#9b004c] dark:hover:bg-pink-400/15 dark:hover:text-pink-200",
                      isToday &&
                        !isSelected &&
                        "ring-1 ring-[#b00055]/60 dark:ring-pink-300/60"
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
              <span className="text-muted-foreground">
                Waktu Indonesia Barat
              </span>
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date(
                    dateFromString(today).getTime() + 86400000
                  )
                  const next = dateString(
                    tomorrow.getUTCFullYear(),
                    tomorrow.getUTCMonth(),
                    tomorrow.getUTCDate()
                  )
                  selectDate(next)
                }}
                className="font-semibold text-[#b00055] hover:underline focus-visible:outline-2 focus-visible:outline-ring dark:text-pink-300"
              >
                Pilih besok
              </button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
