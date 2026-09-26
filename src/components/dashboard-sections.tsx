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
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-heading text-base font-semibold">{title}</h2>
      {href && linkLabel && (
        <Link
          href={href}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
  actionHref: string
  actionLabel: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
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
  return ""
}
