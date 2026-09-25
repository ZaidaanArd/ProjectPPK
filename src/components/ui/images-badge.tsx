"use client"

import { useEffect, useId, useRef, useState } from "react"
import Image from "next/image"
import {
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconExternalLink,
} from "@tabler/icons-react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export type SocialBadgeItem = {
  platform: "github" | "instagram" | "linkedin"
  handle?: string
  href?: string
}

type ImagesBadgeProps = {
  name: string
  image: string
  items: readonly SocialBadgeItem[]
  className?: string
}

const platforms = {
  github: { label: "GitHub", icon: IconBrandGithub },
  instagram: { label: "Instagram", icon: IconBrandInstagram },
  linkedin: { label: "LinkedIn", icon: IconBrandLinkedin },
} as const

export function ImagesBadge({
  name,
  image,
  items,
  className,
}: ImagesBadgeProps) {
  const [open, setOpen] = useState(false)
  const pinnedRef = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const id = useId()
  const reducedMotion = useReducedMotion()
  const visibleItems = items.slice(0, 3)

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        pinnedRef.current = false
        setOpen(false)
      }
    }
    const closeOnOutsideFocus = (event: FocusEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        pinnedRef.current = false
        setOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        pinnedRef.current = false
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer)
    document.addEventListener("focusin", closeOnOutsideFocus)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer)
      document.removeEventListener("focusin", closeOnOutsideFocus)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  const scheduleClose = () => {
    if (!pinnedRef.current)
      closeTimer.current = setTimeout(() => setOpen(false), 160)
  }
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={`Profil sosial ${name}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") {
            cancelClose()
            setOpen(true)
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") scheduleClose()
        }}
        onClick={() => {
          pinnedRef.current = !pinnedRef.current
          setOpen(pinnedRef.current)
        }}
        className="group inline-flex min-h-12 items-center gap-4 whitespace-nowrap rounded-xl border border-pink-200 bg-pink-50 px-3.5 text-xs font-semibold text-[#9d174d] transition-colors hover:border-pink-300 hover:bg-pink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 dark:border-pink-300/20 dark:bg-pink-300/10 dark:text-pink-200 dark:hover:bg-pink-300/20"
      >
        <span
          className="relative flex h-9 w-11 shrink-0 items-end"
          aria-hidden="true"
        >
          <span className="absolute top-0 left-0.5 h-2.5 w-5 rounded-t bg-pink-500" />
          <span className="absolute inset-x-0 bottom-0 h-7 rounded bg-gradient-to-b from-pink-400 to-[#d00064] shadow-sm" />
          {visibleItems.map((item, index) => {
            const Icon = platforms[item.platform].icon
            return (
              <motion.span
                key={item.platform}
                className="absolute bottom-1 left-1/2 flex h-7 w-7 items-center justify-center overflow-hidden rounded bg-white shadow ring-1 ring-pink-200 dark:bg-[#31202d] dark:ring-pink-300/30"
                style={{ zIndex: index + 1 }}
                animate={
                  reducedMotion
                    ? {}
                    : {
                        x: open ? (index - 1) * 13 - 14 : -14,
                        y: open ? -18 - index * 2 : -4 - index,
                        rotate: open ? (index - 1) * 12 : (index - 1) * 3,
                      }
                }
                transition={{ type: "spring", stiffness: 420, damping: 29 }}
              >
                <Image
                  src={image}
                  alt=""
                  width={28}
                  height={28}
                  className="absolute inset-0 h-full w-full object-cover opacity-35"
                />
                <Icon
                  size={17}
                  className="relative text-[#8c174e] dark:text-pink-200"
                />
              </motion.span>
            )
          })}
          <motion.span
            className="absolute inset-x-0 bottom-0 z-10 h-[23px] origin-bottom rounded bg-gradient-to-b from-pink-300 to-pink-500 shadow-sm"
            animate={reducedMotion ? {} : { rotateX: open ? -35 : -12 }}
            transition={{ type: "spring", stiffness: 420, damping: 29 }}
          />
        </span>
        <span>Profil sosial</span>
      </button>

      {open && (
        <div
          id={id}
          className="absolute top-full left-0 z-50 mt-2 flex w-60 flex-col gap-1.5 overflow-hidden rounded-xl border border-pink-100 bg-white p-2 shadow-[0_16px_40px_rgba(75,8,43,0.18)] dark:border-pink-200/15 dark:bg-[#29202d]"
        >
          {visibleItems.map((item) => {
            const { label, icon: Icon } = platforms[item.platform]
            const content = (
              <>
                <Icon size={22} className="shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="block text-xs font-semibold">{label}</span>
                  <span className="block truncate text-[11px] opacity-70">
                    {item.handle ?? "Belum tersedia"}
                  </span>
                </span>
                {item.href && <IconExternalLink size={14} aria-hidden="true" />}
              </>
            )
            return item.href ? (
              <a
                key={item.platform}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} ${name}, buka tab baru`}
                onPointerEnter={cancelClose}
                onPointerLeave={scheduleClose}
                className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-[#4e2137] hover:bg-pink-50 focus-visible:outline-2 focus-visible:outline-pink-600 dark:text-pink-100 dark:hover:bg-pink-300/10"
              >
                {content}
              </a>
            ) : (
              <button
                key={item.platform}
                type="button"
                aria-disabled="true"
                tabIndex={-1}
                onPointerEnter={cancelClose}
                onPointerLeave={scheduleClose}
                className="flex min-h-12 items-center gap-3 px-3 py-2 text-[#8f8290] dark:text-[#a99ba8]"
              >
                {content}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
