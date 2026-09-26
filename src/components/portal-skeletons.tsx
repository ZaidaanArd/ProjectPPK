"use client"

import { useEffect, useState } from "react"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function PortalShellLoading() {
  return (
    <div className="flex min-h-svh bg-[#f7f4f6] dark:bg-[#17131a]">
      <aside className="hidden w-72 shrink-0 border-r border-pink-950/5 bg-[#fffafd] p-4 md:block dark:border-white/10 dark:bg-[#211b23]">
        <div className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="size-10 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="mt-10 space-y-3">
          <Skeleton className="h-3 w-16" />
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-xl" />
          ))}
        </div>
        <div className="absolute bottom-5 w-60">
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center border-b bg-white/80 px-4 backdrop-blur sm:px-6 dark:border-white/10 dark:bg-[#201a23]/85">
          <Skeleton className="size-8 rounded-xl" />
          <Skeleton className="ml-4 h-4 w-36" />
        </header>
        <main className="mx-auto max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
          <div className="space-y-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <MetricGridSkeleton count={3} />
          <PortalListSkeleton rows={2} />
        </main>
      </div>
    </div>
  )
}

export function MetricGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="gap-4 p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="size-10 rounded-2xl" />
          </div>
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-3 w-36" />
        </Card>
      ))}
    </div>
  )
}

export function PortalListSkeleton({
  rows = 3,
  layout = "list",
}: {
  rows?: number
  layout?: "list" | "grid"
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 320)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-24" aria-label="Memuat data" aria-busy="true">
      {visible ? (
        <div
          className={cn(
            "motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in-0",
            layout === "grid" ? "grid gap-4 lg:grid-cols-2" : "space-y-3"
          )}
        >
          {Array.from({ length: rows }, (_, index) => (
            <Card key={index} className="gap-4 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-44 max-w-full" />
                  <Skeleton className="h-3 w-64 max-w-full" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/5" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="h-24 rounded-2xl border border-border/70 bg-white/60 dark:bg-card/60" />
      )}
    </div>
  )
}
