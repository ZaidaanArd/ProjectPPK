import type { ElementType, ReactNode } from "react"
import Link from "next/link"
import { IconArrowUpRight } from "@tabler/icons-react"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function DashboardMetricPanel({
  children,
  columns = 3,
}: {
  children: ReactNode
  columns?: 3 | 4
}) {
  return (
    <Card className="gap-0 p-0 shadow-sm" aria-label="Ringkasan dashboard">
      <div
        className={cn(
          "grid [&>*]:min-w-0 [&>*]:border-border/70",
          columns === 3
            ? "md:grid-cols-3 [&>*]:border-b [&>*]:last:border-b-0 md:[&>*]:border-r md:[&>*]:border-b-0 md:[&>*]:last:border-r-0"
            : "md:grid-cols-2 lg:grid-cols-4 [&>*]:border-b [&>*]:last:border-b-0 md:[&>*]:border-r lg:[&>*]:border-r lg:[&>*]:border-b-0 lg:[&>*]:last:border-r-0 md:[&>*:nth-child(2n)]:border-r-0 lg:[&>*:nth-child(2n)]:border-r md:[&>*:nth-last-child(-n+2)]:border-b-0"
        )}
      >
        {children}
      </div>
    </Card>
  )
}

export function DashboardMetricCard({
  label,
  value,
  description,
  icon: Icon,
  href,
}: {
  label: string
  value: number | undefined
  description: string
  icon: ElementType
  href?: string
}) {
  const card = (
    <div className="relative flex h-full min-w-0 flex-col gap-2 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            {label}
            {href && (
              <IconArrowUpRight
                className="ml-1 inline size-4 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </p>
          {value === undefined ? (
            <Skeleton className="mt-2 h-9 w-16" />
          ) : (
            <p className="mt-2 font-heading text-3xl font-bold tracking-tight break-all text-[#850440] tabular-nums dark:text-pink-200">
              {value}
            </p>
          )}
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-[#b00055] dark:text-pink-200">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="relative text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )

  if (!href) return card

  return (
    <Link
      href={href}
      className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
      {card}
    </Link>
  )
}
