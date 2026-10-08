"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "cn"
import type { ComponentProps } from "react"

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "grid w-full max-w-full grid-cols-3 items-stretch gap-1 rounded-2xl border border-border/60 bg-muted/50 p-1 text-muted-foreground sm:w-fit",
        className
      )}
      {...props}
    />
  )
}

function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(
        "group/tab inline-flex min-h-18 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-transparent px-2 py-2 text-center text-sm leading-tight font-medium whitespace-normal transition-[color,background-color,border-color,box-shadow] duration-200 outline-none select-none hover:bg-background/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none sm:min-h-10 sm:flex-row sm:gap-2 sm:px-3 dark:hover:bg-white/5 data-disabled:pointer-events-none data-disabled:opacity-50 data-active:border-border data-active:bg-background data-active:text-foreground data-active:shadow-sm data-active:hover:bg-background dark:data-active:border-white/15 dark:data-active:bg-[#3b303b] dark:data-active:text-zinc-50 dark:data-active:hover:bg-[#3b303b]",
        className
      )}
      {...props}
    />
  )
}

function TabsCount({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="tabs-count"
      className={cn(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md bg-foreground/5 px-1.5 text-xs leading-none font-semibold text-muted-foreground tabular-nums group-data-active/tab:bg-foreground/10 group-data-active/tab:text-foreground dark:bg-white/5 dark:group-data-active/tab:bg-white/15 dark:group-data-active/tab:text-zinc-50",
        className
      )}
      {...props}
    />
  )
}

function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn("outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTab, TabsCount, TabsPanel }
