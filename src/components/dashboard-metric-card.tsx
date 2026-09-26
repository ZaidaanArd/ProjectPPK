import type { ElementType } from "react"
import Link from "next/link"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const tones = {
  berry: {
    icon: "bg-[#52082b] text-white shadow-[0_8px_22px_rgba(82,8,43,0.2)]",
    glow: "from-[#52082b]/10",
  },
  pink: {
    icon: "bg-[#d00064] text-white shadow-[0_8px_22px_rgba(208,0,100,0.2)]",
    glow: "from-[#d00064]/10",
  },
  amber: {
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200",
    glow: "from-amber-100/70 dark:from-amber-500/10",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200",
    glow: "from-emerald-100/70 dark:from-emerald-500/10",
  },
} as const

export function DashboardMetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "pink",
  href,
}: {
  label: string
  value: number | undefined
  description: string
  icon: ElementType
  tone?: keyof typeof tones
  href?: string
}) {
  const colors = tones[tone]

  const card = (
    <Card className="relative gap-4 overflow-hidden p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-70",
          colors.glow
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {value === undefined ? (
            <Skeleton className="mt-3 h-9 w-16" />
          ) : (
            <p className="mt-1 font-heading text-3xl font-bold tracking-tight">
              {value}
            </p>
          )}
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
            colors.icon
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="relative text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </Card>
  )

  if (!href) return card

  return (
    <Link
      href={href}
      className="block rounded-4xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {card}
    </Link>
  )
}
