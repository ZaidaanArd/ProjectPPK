"use client"

import { IconAlertTriangle, IconOctagonX, IconTool } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

export function DisruptionBanner({
  category,
  description,
  endText,
  className,
}: {
  category: string
  description: string
  endText?: string
  className?: string
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100",
        className
      )}
    >
      <IconTool aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">Ada gangguan: {category}</p>
        <p className="line-clamp-3 text-[13px]">{description}</p>
        <p className="mt-0.5 text-xs opacity-80">
          Fasilitas masih dapat digunakan{endText ?? " sampai pemberitahuan lebih lanjut"}.
        </p>
      </div>
    </div>
  )
}

export function ClosureBanner({
  reason,
  estimateText,
  className,
}: {
  reason: string
  estimateText?: string
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-2.5 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100",
        className
      )}
    >
      <IconOctagonX aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">Fasilitas ditutup darurat</p>
        <p className="line-clamp-3 text-[13px]">{reason}</p>
        <p className="mt-0.5 text-xs opacity-80">{estimateText ?? "Sampai pemberitahuan lebih lanjut"}.</p>
      </div>
    </div>
  )
}

export function MaintenanceReminderBanner({
  facilityName,
  endAtLabel,
  className,
}: {
  facilityName: string
  endAtLabel: string
  className?: string
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex gap-2.5 rounded-xl border border-sky-300 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-100",
        className
      )}
    >
      <IconAlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">Perbaikan hampir selesai</p>
        <p className="text-[13px]">
          {facilityName} berakhir {endAtLabel}. Selesaikan atau perpanjang.
        </p>
      </div>
    </div>
  )
}
