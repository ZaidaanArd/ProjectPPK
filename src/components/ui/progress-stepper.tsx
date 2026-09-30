"use client"

import { IconCheck, IconX } from "@tabler/icons-react"
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react"

import type { ProgressStep } from "@/lib/status-steps"
import { cn } from "@/lib/utils"

const stepDate = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Jakarta",
})

const nodeClass = {
  done: "border-pink-600 bg-pink-600 text-white dark:border-pink-500 dark:bg-pink-500",
  current:
    "border-pink-500 bg-background text-pink-600 dark:border-pink-400 dark:text-pink-300",
  upcoming: "border-border bg-background text-muted-foreground",
  error: "border-red-500 bg-red-500 text-white",
} as const

export function ProgressStepper({
  steps,
  label,
  size = "sm",
  className,
}: {
  steps: ProgressStep[]
  label: string
  size?: "sm" | "md"
  className?: string
}) {
  const reduced = Boolean(useReducedMotion())
  const node = size === "sm" ? "size-6 text-[11px]" : "size-8 text-xs"
  const top = size === "sm" ? "top-3" : "top-4"

  return (
    <LazyMotion features={domAnimation} strict>
      <ol aria-label={label} className={cn("flex items-start", className)}>
        {steps.map((step, index) => {
          const reached = step.state !== "upcoming"
          return (
            <li
              key={step.label}
              aria-current={step.state === "current" ? "step" : undefined}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center"
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute right-1/2 h-0.5 w-full -translate-y-1/2 overflow-hidden rounded-full bg-border",
                    top
                  )}
                >
                  {reached && (
                    <m.span
                      className={cn(
                        "block h-full origin-left",
                        step.state === "error" ? "bg-red-400" : "bg-pink-500"
                      )}
                      initial={reduced ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.45, delay: index * 0.18 }}
                    />
                  )}
                </span>
              )}
              <m.span
                className={cn(
                  "relative z-10 grid shrink-0 place-items-center rounded-full border-2 font-semibold",
                  node,
                  nodeClass[step.state]
                )}
                initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 22,
                  delay: index * 0.18,
                }}
              >
                {step.state === "current" && !reduced && (
                  <m.span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-pink-400/40"
                    animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}
                {step.state === "done" ? (
                  <IconCheck size={13} stroke={3} aria-hidden="true" />
                ) : step.state === "error" ? (
                  <IconX size={13} stroke={3} aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </m.span>
              <span
                className={cn(
                  "max-w-full truncate px-1 leading-tight",
                  size === "sm" ? "text-[11px]" : "text-xs",
                  step.state === "upcoming"
                    ? "text-muted-foreground"
                    : step.state === "error"
                      ? "font-semibold text-red-600 dark:text-red-400"
                      : "font-semibold text-foreground"
                )}
              >
                {step.label}
              </span>
              {step.at !== undefined && (
                <span className="-mt-1 text-[10px] text-muted-foreground tabular-nums">
                  {stepDate.format(step.at)}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </LazyMotion>
  )
}
