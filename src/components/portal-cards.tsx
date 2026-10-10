"use client"

import Image from "next/image"
import { useState, type ReactNode } from "react"
import {
  IconAirConditioning,
  IconArmchair,
  IconBulb,
  IconClockHour4,
  IconDeviceDesktop,
  IconDeviceProjector,
  IconDroplet,
  IconMapPin,
  IconSparkles,
  IconTool,
  IconWifi,
} from "@tabler/icons-react"

import { ProgressStepper } from "@/components/ui/progress-stepper"
import { facilityIllustration } from "@/lib/facility-illustrations"
import { displayDuration } from "@/lib/reservation-slots"
import { reportSteps, reservationSteps } from "@/lib/status-steps"
import { cn } from "@/lib/utils"

const tone = {
  amber: {
    date: "bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200",
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  emerald: {
    date: "bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-200",
    pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  sky: {
    date: "bg-sky-50 text-sky-900 dark:bg-sky-400/10 dark:text-sky-200",
    pill: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200",
    dot: "bg-sky-500",
  },
  red: {
    date: "bg-red-50 text-red-900 dark:bg-red-400/10 dark:text-red-200",
    pill: "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-200",
    dot: "bg-red-500",
  },
  zinc: {
    date: "bg-muted text-muted-foreground",
    pill: "bg-muted text-muted-foreground",
    dot: "bg-zinc-400",
  },
} as const

type Tone = keyof typeof tone

const statusTone: Record<string, Tone> = {
  pending: "amber",
  approved: "emerald",
  in_progress: "sky",
  resolved: "emerald",
  rejected: "red",
  cancelled: "zinc",
  expired: "zinc",
  completed: "zinc",
}

const weekday = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  timeZone: "Asia/Jakarta",
})
const dayNumber = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  timeZone: "Asia/Jakarta",
})
const monthShort = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  timeZone: "Asia/Jakarta",
})
const clock = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Jakarta",
})

export function StatusPill({
  status,
  label,
}: {
  status: string
  label: string
}) {
  const colors = tone[statusTone[status] ?? "zinc"]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        colors.pill
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          colors.dot,
          status === "pending" && "animate-pulse"
        )}
      />
      {label}
    </span>
  )
}

/** Weekday / day / month block used on tickets and dashboard rows. */
export function DateBlock({
  at,
  status,
  className,
}: {
  at: number
  status: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-2xl px-3 py-2 text-center leading-none",
        tone[statusTone[status] ?? "zinc"].date,
        className
      )}
    >
      <span className="text-[11px] font-semibold tracking-wide uppercase">
        {weekday.format(at)}
      </span>
      <span className="mt-1 font-heading text-2xl font-bold tabular-nums">
        {dayNumber.format(at)}
      </span>
      <span className="mt-1 text-[11px]">{monthShort.format(at)}</span>
    </span>
  )
}

function TicketShell({ children }: { children: ReactNode }) {
  return (
    <article className="group relative flex h-full overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-950/5">
      {children}
    </article>
  )
}

function Callout({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/40 p-3">
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
        {text}
      </p>
    </div>
  )
}

/** Perforated divider that separates a ticket's body from its actions. */
function Perforation() {
  return (
    <div aria-hidden="true" className="relative -mx-5 my-1 sm:-mx-6">
      <span className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full border border-border/80 bg-background" />
      <span className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full border border-border/80 bg-background" />
      <div className="mx-5 border-t-2 border-dashed border-border/70" />
    </div>
  )
}

export function ReservationTicket({
  compactDate = false,
  facilityName,
  location,
  startAt,
  endAt,
  status,
  statusLabel,
  purpose,
  decisionNote,
  createdAt,
  updatedAt,
  meta,
  alert,
  children,
}: {
  compactDate?: boolean
  facilityName: string
  location?: string
  startAt: number
  endAt: number
  status: string
  statusLabel: string
  purpose: string
  decisionNote?: string
  createdAt: number
  updatedAt?: number
  meta?: ReactNode
  alert?: ReactNode
  children?: ReactNode
}) {
  const image = facilityIllustration(facilityName, "")
  const minutes = Math.round((endAt - startAt) / 60000)
  return (
    <TicketShell>
      <DateBlock
        at={startAt}
        status={status}
        className={cn(
          "my-5 ml-5 hidden w-20 sm:flex",
          compactDate &&
            "w-16 self-start border border-border/70 !bg-muted !text-foreground"
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
        <div
          className={cn("flex items-start gap-3", compactDate && "flex-wrap")}
        >
          <span className="relative size-11 shrink-0 overflow-hidden rounded-2xl bg-muted">
            <Image
              src={image.src}
              alt=""
              fill
              sizes="44px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </span>
          <div className={cn("min-w-0 flex-1", compactDate && "basis-24")}>
            <h2 className="font-heading text-base font-semibold break-words">
              {facilityName}
            </h2>
            {location && (
              <p className="mt-0.5 flex items-start gap-1 text-xs break-words text-muted-foreground">
                <IconMapPin
                  size={13}
                  className="mt-px shrink-0"
                  aria-hidden="true"
                />
                {location}
              </p>
            )}
            {meta && (
              <div className="mt-0.5 text-xs break-words text-muted-foreground">
                {meta}
              </div>
            )}
          </div>
          <StatusPill status={status} label={statusLabel} />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background px-3 py-1 font-semibold tabular-nums">
            <IconClockHour4
              size={15}
              className="text-pink-600 dark:text-pink-300"
              aria-hidden="true"
            />
            <span className="sm:hidden">
              {weekday.format(startAt)}, {dayNumber.format(startAt)}{" "}
              {monthShort.format(startAt)} ·{" "}
            </span>
            {clock.format(startAt)}–{clock.format(endAt)} WIB
          </span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            {displayDuration(minutes)}
          </span>
        </div>

        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          <span className="mr-1.5 text-xs font-semibold text-muted-foreground">
            Tujuan
          </span>
          {purpose}
        </p>

        {decisionNote && (
          <Callout title="Catatan keputusan" text={decisionNote} />
        )}
        {alert}

        <div className="rounded-2xl bg-muted/30 px-2 pt-3 pb-2">
          <ProgressStepper
            label={`Progres reservasi ${facilityName}`}
            steps={reservationSteps({ status, createdAt, updatedAt })}
          />
        </div>

        {children && (
          <>
            <Perforation />
            <div className="space-y-3">{children}</div>
          </>
        )}
      </div>
    </TicketShell>
  )
}

const iconProps = { size: 22, stroke: 1.7, "aria-hidden": true } as const

const categoryIcons: [RegExp, ReactNode][] = [
  [/\bac\b|pendingin|dingin/i, <IconAirConditioning key="ac" {...iconProps} />],
  [
    /proyektor|projector|layar/i,
    <IconDeviceProjector key="pr" {...iconProps} />,
  ],
  [/kursi|meja|furnitur/i, <IconArmchair key="ku" {...iconProps} />],
  [/lampu|listrik/i, <IconBulb key="la" {...iconProps} />],
  [/komputer|perangkat|pc/i, <IconDeviceDesktop key="ko" {...iconProps} />],
  [/air|bocor|toilet/i, <IconDroplet key="ai" {...iconProps} />],
  [/wifi|internet|jaringan/i, <IconWifi key="wi" {...iconProps} />],
  [/bersih|sampah|kebersihan/i, <IconSparkles key="be" {...iconProps} />],
]
const fallbackIcon = <IconTool {...iconProps} />

function categoryIcon(category: string) {
  return (
    categoryIcons.find(([match]) => match.test(category))?.[1] ?? fallbackIcon
  )
}

export function ReportTicket({
  facilityName,
  category,
  description,
  photoUrl,
  status,
  statusLabel,
  resolutionNote,
  createdAt,
  updatedAt,
  reportedLabel,
  meta,
  children,
}: {
  facilityName: string
  category: string
  description: string
  photoUrl?: string | null
  status: string
  statusLabel: string
  resolutionNote?: string
  createdAt: number
  updatedAt?: number
  reportedLabel: string
  meta?: ReactNode
  children?: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const long = description.length > 140
  return (
    <TicketShell>
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-pink-50 text-pink-600 transition-transform duration-300 group-hover:-rotate-6 dark:bg-pink-400/10 dark:text-pink-300">
            {categoryIcon(category)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-base font-semibold break-words">
              {facilityName}
            </h2>
            <p className="mt-0.5 text-sm break-words text-muted-foreground">
              {category}
            </p>
            {meta && (
              <div className="mt-0.5 text-xs break-words text-muted-foreground">
                {meta}
              </div>
            )}
          </div>
          <StatusPill status={status} label={statusLabel} />
        </div>

        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm leading-relaxed break-words whitespace-pre-wrap",
                long && !expanded && "line-clamp-3"
              )}
            >
              {description}
            </p>
            {long && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="mt-1 text-xs font-semibold text-pink-700 hover:underline dark:text-pink-300"
              >
                {expanded ? "Ringkas" : "Selengkapnya"}
              </button>
            )}
          </div>
          {photoUrl && (
            <a
              href={photoUrl}
              target="_blank"
              rel="noreferrer"
              className="relative block size-20 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-muted/30"
            >
              {/* Uploaded images are user-provided and served from Convex storage. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Foto laporan fasilitas"
                className="size-full object-cover transition-transform duration-300 hover:scale-110"
              />
            </a>
          )}
        </div>

        {resolutionNote && (
          <Callout title="Catatan penanganan" text={resolutionNote} />
        )}

        <div className="rounded-2xl bg-muted/30 px-2 pt-3 pb-2">
          <ProgressStepper
            label={`Progres laporan ${facilityName}`}
            steps={reportSteps({ status, createdAt, updatedAt })}
          />
        </div>
        <p className="text-xs text-muted-foreground">{reportedLabel}</p>

        {children && (
          <>
            <Perforation />
            <div className="space-y-3">{children}</div>
          </>
        )}
      </div>
    </TicketShell>
  )
}
