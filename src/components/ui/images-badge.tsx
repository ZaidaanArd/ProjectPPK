"use client"

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import {
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
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
  items: readonly SocialBadgeItem[]
  className?: string
  folderSize?: { width: number; height: number }
  teaserImageSize?: { width: number; height: number }
  hoverImageSize?: { width: number; height: number }
  hoverTranslateY?: number
  hoverSpread?: number
}

const platforms = {
  github: { label: "GitHub", icon: IconBrandGithub, preview: "bg-[#29232e]" },
  instagram: {
    label: "Instagram",
    icon: IconBrandInstagram,
    preview: "bg-gradient-to-br from-[#ff8aaf] to-[#ba1264]",
  },
  linkedin: {
    label: "LinkedIn",
    icon: IconBrandLinkedin,
    preview: "bg-[#0a66c2]",
  },
} as const

export function ImagesBadge({
  name,
  items,
  className,
  folderSize = { width: 44, height: 36 },
  teaserImageSize = { width: 28, height: 28 },
  hoverImageSize = { width: 96, height: 74 },
  hoverTranslateY = -80,
  hoverSpread = 34,
}: ImagesBadgeProps) {
  const [open, setOpen] = useState(false)
  const [activeCard, setActiveCard] = useState<number | null>(null)
  const [popupLeft, setPopupLeft] = useState(0)
  const [effectiveSpread, setEffectiveSpread] = useState(hoverSpread)
  const pinnedRef = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const id = useId()
  const reducedMotion = useReducedMotion()
  const visibleItems = items.slice(0, 3)
  const popupWidth = Math.max(240, hoverImageSize.width + hoverSpread * 2 + 24)
  const teaserSpread = Math.min(hoverSpread * 0.26, folderSize.width * 0.3)

  useLayoutEffect(() => {
    if (!open) return

    const placePopup = () => {
      const trigger = rootRef.current?.getBoundingClientRect()
      const popup = popupRef.current?.getBoundingClientRect()
      if (!trigger || !popup) return

      const preferredLeft = trigger.width - popup.width
      const minLeft = 16 - trigger.left
      const maxLeft = window.innerWidth - 16 - trigger.left - popup.width
      setPopupLeft(Math.max(minLeft, Math.min(preferredLeft, maxLeft)))
      setEffectiveSpread(
        Math.min(
          hoverSpread,
          Math.max(24, (popup.width - 24 - hoverImageSize.width) / 2)
        )
      )
    }

    placePopup()
    window.addEventListener("resize", placePopup)
    return () => window.removeEventListener("resize", placePopup)
  }, [open, hoverSpread, hoverImageSize.width])

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
        className="group inline-flex min-h-12 items-center gap-4 rounded-xl border border-pink-200 bg-pink-50 px-3.5 text-xs font-semibold whitespace-nowrap text-[#9d174d] transition-colors hover:border-pink-300 hover:bg-pink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 dark:border-pink-300/20 dark:bg-pink-300/10 dark:text-pink-200 dark:hover:bg-pink-300/20"
      >
        <span
          className="relative flex shrink-0 items-end"
          style={{ width: folderSize.width, height: folderSize.height }}
          aria-hidden="true"
        >
          <span
            className="absolute top-0 left-0.5 rounded-t bg-pink-500"
            style={{
              width: folderSize.width * 0.45,
              height: folderSize.height * 0.28,
            }}
          />
          <span
            className="absolute inset-x-0 bottom-0 rounded bg-gradient-to-b from-pink-400 to-[#d00064] shadow-sm"
            style={{ height: folderSize.height * 0.78 }}
          />
          {visibleItems.map((item, index) => {
            const Icon = platforms[item.platform].icon
            return (
              <motion.span
                key={item.platform}
                className={cn(
                  "absolute bottom-1 left-1/2 flex items-center justify-center overflow-hidden rounded text-white shadow ring-1 ring-white/50",
                  platforms[item.platform].preview
                )}
                style={{
                  zIndex: index + 1,
                  width: teaserImageSize.width,
                  height: teaserImageSize.height,
                }}
                animate={
                  reducedMotion
                    ? {}
                    : {
                        x: open
                          ? (index - 1) * teaserSpread -
                            teaserImageSize.width / 2
                          : -teaserImageSize.width / 2,
                        y: open
                          ? -folderSize.height * 0.5 - index * 2
                          : -4 - index,
                        rotate: open ? (index - 1) * 12 : (index - 1) * 3,
                      }
                }
                transition={{ type: "spring", stiffness: 420, damping: 29 }}
              >
                <Icon
                  size={Math.round(
                    Math.min(teaserImageSize.width, teaserImageSize.height) *
                      0.6
                  )}
                  className="relative"
                />
              </motion.span>
            )
          })}
          <motion.span
            className="absolute inset-x-0 bottom-0 z-10 origin-bottom rounded bg-gradient-to-b from-pink-300 to-pink-500 shadow-sm"
            style={{ height: folderSize.height * 0.64 }}
            animate={reducedMotion ? {} : { rotateX: open ? -35 : -12 }}
            transition={{ type: "spring", stiffness: 420, damping: 29 }}
          />
        </span>
        <span>Profil sosial</span>
      </button>

      {open && (
        <div
          id={id}
          ref={popupRef}
          className="absolute top-full z-50 mt-2 max-w-[calc(100vw-2rem)] rounded-xl border border-pink-100 bg-white p-2 shadow-[0_16px_40px_rgba(75,8,43,0.18)] dark:border-pink-200/15 dark:bg-[#29202d]"
          style={{ width: popupWidth, left: popupLeft }}
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
        >
          <div
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#ffe3ef] via-white to-[#f4d4e3] dark:from-[#4b263d] dark:via-[#31202d] dark:to-[#5b2b47]"
            style={{ height: hoverImageSize.height + 16 }}
          >
            {visibleItems.map((item, index) => {
              const { label, icon: Icon, preview } = platforms[item.platform]
              const content = (
                <>
                  <Icon
                    className="absolute top-3 left-3 drop-shadow-sm"
                    size={42}
                    aria-hidden="true"
                  />
                  <Icon
                    className="absolute -right-3 -bottom-5 opacity-20"
                    size={128}
                    strokeWidth={1.3}
                    aria-hidden="true"
                  />
                  <span className="absolute right-3 bottom-3 left-3 text-left text-xs font-semibold drop-shadow-sm">
                    {label}
                  </span>
                </>
              )
              return (
                <motion.div
                  key={item.platform}
                  className={cn(
                    "absolute top-2 left-1/2 overflow-hidden rounded-lg border border-white/80 text-white shadow-lg dark:border-pink-100/20",
                    preview
                  )}
                  style={{
                    width: hoverImageSize.width,
                    height: hoverImageSize.height,
                    zIndex: activeCard === index ? 10 : index + 1,
                  }}
                  onPointerEnter={() => setActiveCard(index)}
                  onPointerLeave={() => setActiveCard(null)}
                  initial={
                    reducedMotion
                      ? false
                      : {
                          x: -hoverImageSize.width / 2,
                          y: Math.abs(hoverTranslateY),
                          opacity: 0,
                        }
                  }
                  animate={{
                    x:
                      -hoverImageSize.width / 2 + (index - 1) * effectiveSpread,
                    y: activeCard === index ? -5 : 0,
                    rotate: activeCard === index ? 0 : (index - 1) * 8,
                    opacity: 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 370,
                    damping: 28,
                    delay: index * 0.04,
                  }}
                >
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${label} ${name}${item.handle ? ` (${item.handle})` : ""}, buka tab baru`}
                      className="absolute inset-0 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white"
                      onFocus={() => setActiveCard(index)}
                      onBlur={() => setActiveCard(null)}
                    >
                      {content}
                    </a>
                  ) : (
                    <div
                      aria-label={`${label} ${name}, belum tersedia`}
                      className="absolute inset-0 opacity-65"
                    >
                      {content}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
