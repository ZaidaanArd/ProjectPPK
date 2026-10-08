import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {href && linkLabel && (
        <Link
          href={href}
          className="rounded-md text-sm font-medium text-muted-foreground underline-offset-4 transition-colors outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

export function DashboardSkeletonRows({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="space-y-2 rounded-2xl border border-border/70 p-4"
        >
          <Skeleton className="h-4 w-40 max-w-full" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
      ))}
    </div>
  )
}

export function DashboardEmptyHint({
  text,
  actionHref,
  actionLabel,
}: {
  text: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "mt-3",
          })}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

export function statusBadgeClass(status: string) {
  if (status === "approved" || status === "resolved") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"
  }
  if (status === "in_progress") {
    return "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300"
  }
  if (status === "pending") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"
  }
  if (status === "rejected") {
    return "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300"
  }
  return ""
}
