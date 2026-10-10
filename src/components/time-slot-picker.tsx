"use client"

import { useMemo, useRef, useState, type KeyboardEvent } from "react"
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react"

import {
  daySlots,
  displayDuration,
  displayTime,
  selectSlot,
  toTimestamp,
  type BusyRange,
} from "@/lib/reservation-slots"
import { cn } from "@/lib/utils"
import { useScheduleClock } from "@/hooks/use-schedule-clock"

const groups = [
  { label: "Pagi", from: "07:00", to: "12:00" },
  { label: "Siang", from: "12:00", to: "15:00" },
  { label: "Sore", from: "15:00", to: "20:00" },
]

function slotClass(state: {
  taken: boolean
  selected: boolean
  edge: boolean
  preview: boolean
  pending: boolean
}) {
  const base =
    "relative h-10 rounded-xl border text-sm font-semibold tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1 focus-visible:outline-none"
  if (state.taken)
    return cn(
      base,
      "cursor-not-allowed border-border/60 bg-muted/60 text-muted-foreground/60 line-through"
    )
  if (state.selected)
    return cn(
      base,
      "border-pink-600 bg-pink-600 text-white shadow-sm shadow-pink-600/25 dark:border-pink-500 dark:bg-pink-500",
      !state.edge && "border-pink-500/80 bg-pink-500/85"
    )
  if (state.preview)
    return cn(
      base,
      "border-pink-300 bg-pink-100 text-pink-800 dark:border-pink-400/40 dark:bg-pink-400/15 dark:text-pink-200"
    )
  if (state.pending)
    return cn(
      base,
      "border-amber-400/60 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-400/10 dark:text-amber-200"
    )
  return cn(
    base,
    "border-emerald-300/70 bg-emerald-50 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200 dark:hover:bg-emerald-400/20"
  )
}

export function TimeSlotPicker({
  date,
  busy,
  disabled,
  start,
  end,
  onChange,
  pendingRanges,
  allowElapsed = false,
}: {
  date: string
  busy: readonly BusyRange[] | undefined
  disabled: boolean
  start: string
  end: string
  onChange: (range: { start: string; end: string }) => void
  pendingRanges?: readonly BusyRange[]
  allowElapsed?: boolean
}) {
  const reduced = Boolean(useReducedMotion())
  const now = useScheduleClock()
  const slots = useMemo(
    () =>
      daySlots(date, busy ?? [], {
        now: allowElapsed ? undefined : (now ?? undefined),
        pending: pendingRanges?.filter(
          (item) => now !== null && item.startAt > now
        ),
      }),
    [date, busy, now, allowElapsed, pendingRanges]
  )
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const [hover, setHover] = useState<number | null>(null)
  const [shake, setShake] = useState({ index: -1, count: 0 })
  const [hint, setHint] = useState("")

  const startIndex = slots.findIndex((slot) => slot.start === start)
  const endIndex = slots.findIndex((slot) => slot.end === end)
  const hasRange = startIndex >= 0 && endIndex >= startIndex
  const inRange = (index: number) =>
    hasRange && index >= startIndex && index <= endIndex
  const previewEnd =
    hasRange &&
    startIndex === endIndex &&
    hover !== null &&
    hover > startIndex &&
    !slots.slice(startIndex, hover + 1).some((slot) => slot.taken || slot.past)
      ? hover
      : -1
  const minutes = hasRange
    ? (toTimestamp(date, end) - toTimestamp(date, start)) / 60000
    : 0
  const free = slots.filter((slot) => !slot.taken && !slot.past).length
  const focusIndex = Math.max(
    0,
    hasRange && !slots[startIndex]?.past && !slots[startIndex]?.taken
      ? startIndex
      : slots.findIndex((slot) => !slot.taken && !slot.past)
  )

  function choose(index: number) {
    const next = selectSlot(slots, { start, end }, index)
    if (next.blocked) {
      setShake((current) => ({ index, count: current.count + 1 }))
      setHint(
        slots[index]?.taken
          ? "Slot ini sudah terisi."
          : "Rentang ini melewati slot yang terisi. Pilih jam lain."
      )
      return
    }
    setHint("")
    onChange({ start: next.start, end: next.end })
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    }
    let target: number | undefined
    if (event.key in moves) target = index + (moves[event.key] ?? 0)
    if (event.key === "Home") target = 0
    if (event.key === "End") target = slots.length - 1
    if (target === undefined) return
    event.preventDefault()
    const direction =
      event.key === "End" || (moves[event.key] ?? 1) < 0 ? -1 : 1
    while (
      target >= 0 &&
      target < slots.length &&
      (slots[target]?.taken || slots[target]?.past)
    )
      target += direction
    buttons.current[target]?.focus()
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <div className={cn("space-y-4", disabled && "opacity-60")}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <dl className="flex flex-wrap gap-2 text-sm">
            {[
              ["Jam mulai", hasRange ? displayTime(start) : "—"],
              ["Jam selesai", hasRange ? displayTime(end) : "—"],
              ["Durasi", minutes > 0 ? displayDuration(minutes) : "—"],
            ].map(([term, value]) => (
              <div
                key={term}
                className="rounded-2xl border border-border/80 bg-background px-3 py-1.5"
              >
                <dt className="text-[11px] text-muted-foreground">{term}</dt>
                <dd className="font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="min-w-44 flex-1 sm:max-w-64">
            <p className="mb-1.5 text-right text-xs text-muted-foreground">
              {disabled || !busy
                ? "Ketersediaan hari ini"
                : `${free} dari ${slots.length} slot tersedia`}
            </p>
            <div
              aria-hidden="true"
              className="grid h-2.5 gap-px overflow-hidden rounded-full"
              style={{
                gridTemplateColumns: `repeat(${slots.length}, 1fr)`,
              }}
            >
              {slots.map((slot, index) => (
                <span
                  key={slot.start}
                  className={cn(
                    "transition-colors",
                    inRange(index)
                      ? "bg-pink-500"
                      : slot.taken || slot.past
                        ? "bg-muted-foreground/25"
                        : slot.pending
                          ? "bg-amber-400/70"
                          : "bg-emerald-400/70"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <fieldset
          className="min-w-0 space-y-3"
          onPointerLeave={() => setHover(null)}
        >
          <legend className="sr-only">Pilih slot waktu</legend>
          {groups.map((group) => (
            <div
              key={group.label}
              className="grid gap-2 sm:grid-cols-[4.5rem_1fr] sm:items-start"
            >
              <p className="pt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </p>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-10">
                {slots.map((slot, index) => {
                  if (slot.start < group.from || slot.start >= group.to)
                    return null
                  const selected = inRange(index)
                  const preview =
                    previewEnd > 0 && index > startIndex && index <= previewEnd
                  const edge =
                    selected && (index === startIndex || index === endIndex)
                  return (
                    <m.button
                      key={slot.start}
                      ref={(node) => {
                        buttons.current[index] = node
                      }}
                      type="button"
                      disabled={
                        disabled ||
                        (!allowElapsed && now === null) ||
                        slot.taken ||
                        slot.past
                      }
                      tabIndex={index === focusIndex ? 0 : -1}
                      aria-pressed={selected}
                      aria-label={`${displayTime(slot.start)} · ${
                        slot.past
                          ? "Sudah lewat"
                          : slot.taken
                            ? "Terisi"
                            : slot.pending
                              ? "Ada pengajuan, tetap dapat diajukan"
                              : selected
                                ? "Dipilih"
                                : "Tersedia"
                      }`}
                      onClick={() => choose(index)}
                      onKeyDown={(event) => onKeyDown(event, index)}
                      onPointerEnter={() => setHover(index)}
                      // Alternate direction so repeated blocked clicks replay.
                      animate={
                        shake.index === index && !reduced
                          ? {
                              x:
                                shake.count % 2
                                  ? [0, -5, 5, -3, 3, 0]
                                  : [0, 5, -5, 3, -3, 0],
                            }
                          : { x: 0 }
                      }
                      transition={{ duration: 0.35 }}
                      className={slotClass({
                        taken: slot.taken || Boolean(slot.past),
                        pending: Boolean(slot.pending),
                        selected,
                        edge,
                        preview,
                      })}
                    >
                      {displayTime(slot.start)}
                    </m.button>
                  )
                })}
              </div>
            </div>
          ))}
        </fieldset>

        <p className="text-xs text-muted-foreground">
          Klik jam mulai, lalu klik slot terakhir yang ingin dipakai. Tiap slot
          30 menit.
        </p>
        {pendingRanges && (
          <p className="text-xs text-muted-foreground">
            Kuning: ada pengajuan, belum disetujui. Tetap bisa diajukan.
            Abu-abu: terisi atau sudah lewat.
          </p>
        )}
        {hint && (
          <p role="alert" className="text-sm text-destructive">
            {hint}
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {hasRange
            ? `Dipilih ${displayTime(start)} sampai ${displayTime(end)}, durasi ${displayDuration(minutes)}`
            : ""}
        </p>
      </div>
    </LazyMotion>
  )
}
