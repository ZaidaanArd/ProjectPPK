"use client"

import Image from "next/image"
import type { ReactNode } from "react"
import { IconCheck } from "@tabler/icons-react"
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

export type FormStep = {
  id: string
  label: string
  done: boolean
  /** Optional steps never block the next step from becoming current. */
  optional?: boolean
}

// Room for the sticky portal header (h-16) plus this bar.
const SCROLL_OFFSET = 150

/** Sticky stepper that tracks how far a long form has been filled in. */
export function FormProgress({
  steps,
  label,
}: {
  steps: FormStep[]
  label: string
}) {
  const reduced = Boolean(useReducedMotion())
  const current = steps.findIndex((step) => !step.done && !step.optional)
  const doneCount = steps.filter(
    (step, index) => step.done || (step.optional && index < current)
  ).length

  function jump(id: string) {
    const target = document.getElementById(id)
    if (!target) return
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET,
      behavior: reduced ? "auto" : "smooth",
    })
    target.querySelector<HTMLElement>("input, textarea, button")?.focus({
      preventScroll: true,
    })
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <nav
        aria-label={label}
        className="sticky top-18 z-20 rounded-3xl border border-border/70 bg-background/95 p-2 shadow-sm backdrop-blur-xl"
      >
        <div className="relative mx-3 mb-2 h-1 overflow-hidden rounded-full bg-muted sm:hidden">
          <m.span
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-pink-500"
            initial={false}
            animate={{ scaleX: doneCount / steps.length }}
            transition={{ duration: reduced ? 0 : 0.4 }}
          />
        </div>
        <ol className="flex items-center gap-1">
          {steps.map((step, index) => {
            const isCurrent = index === current
            return (
              <li
                key={step.id}
                className={cn(
                  "flex min-w-0 items-center",
                  isCurrent ? "flex-[3] sm:flex-1" : "flex-1"
                )}
              >
                <button
                  type="button"
                  onClick={() => jump(step.id)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:outline-none sm:px-3",
                    isCurrent && "bg-pink-50 dark:bg-pink-400/10"
                  )}
                >
                  <m.span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold",
                      step.done
                        ? "border-pink-600 bg-pink-600 text-white dark:border-pink-500 dark:bg-pink-500"
                        : isCurrent
                          ? "border-pink-500 text-pink-600 dark:text-pink-300"
                          : step.optional
                            ? "border-dashed border-border text-muted-foreground"
                            : "border-border text-muted-foreground"
                    )}
                    initial={false}
                    animate={{ scale: step.done ? [1.25, 1] : 1 }}
                    transition={{ duration: reduced ? 0 : 0.3 }}
                  >
                    {step.done ? (
                      <IconCheck size={14} stroke={3} aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </m.span>
                  <span
                    className={cn(
                      "truncate",
                      isCurrent || step.done
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                      !isCurrent && "hidden sm:inline"
                    )}
                  >
                    {step.label}
                    {step.optional && !step.done && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        (opsional)
                      </span>
                    )}
                    <span className="sr-only">
                      {step.done
                        ? " (selesai)"
                        : isCurrent
                          ? " (sekarang)"
                          : ""}
                    </span>
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="relative mx-1 hidden h-0.5 w-6 shrink-0 overflow-hidden rounded-full bg-border sm:block lg:w-10"
                  >
                    <m.span
                      className="absolute inset-0 origin-left bg-pink-500"
                      initial={false}
                      animate={{ scaleX: step.done ? 1 : 0 }}
                      transition={{ duration: reduced ? 0 : 0.35 }}
                    />
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </LazyMotion>
  )
}

/** Sticky footer that recaps the choices so far next to the submit button. */
export function FormSummaryBar({
  image,
  title,
  detail,
  children,
}: {
  image?: { src: string; alt: string }
  title: string
  detail: ReactNode
  children: ReactNode
}) {
  return (
    <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-3xl border border-pink-200/70 bg-background/90 p-3 shadow-[0_18px_40px_-18px_rgba(190,24,93,0.35)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-3 sm:pl-3 dark:border-pink-300/15">
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative size-12 shrink-0 overflow-hidden rounded-2xl bg-pink-100 dark:bg-pink-400/15">
          {image && (
            <Image
              src={image.src}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <div className="truncate text-xs text-muted-foreground">{detail}</div>
        </div>
      </div>
      <div className="flex shrink-0 sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        {children}
      </div>
    </div>
  )
}
