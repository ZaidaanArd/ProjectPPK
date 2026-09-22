"use client"

import Image from "next/image"
import type { MouseEvent } from "react"
import { useRef, useState } from "react"
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react"
import { cn } from "@/lib/utils"

export type AnimatedTooltipItem = {
  id: number
  name: string
  designation: string
  image: string
  href: string
}

type AnimatedTooltipProps = {
  items: AnimatedTooltipItem[]
  className?: string
  imageClassName?: string
}

export function AnimatedTooltip({
  items,
  className,
  imageClassName,
}: AnimatedTooltipProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const x = useMotionValue(0)
  const springConfig = { stiffness: 110, damping: 16 }
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-10, 10]),
    springConfig
  )
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-18, 18]),
    springConfig
  )

  function handleMouseMove(event: MouseEvent<HTMLAnchorElement>) {
    if (prefersReducedMotion) return

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const { clientX, currentTarget } = event
    animationFrameRef.current = requestAnimationFrame(() => {
      const bounds = currentTarget.getBoundingClientRect()
      x.set(clientX - bounds.left - bounds.width / 2)
    })
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <ul
        className={cn("m-0 flex list-none items-center p-0 pr-3", className)}
        aria-label="Profil tim Sthana Kampus"
      >
        {items.map((item) => {
          const tooltipId = `team-tooltip-${item.id}`

          return (
            <li className="group relative -mr-3" key={item.id}>
              <AnimatePresence>
                {hoveredIndex === item.id ? (
                  <m.div
                    id={tooltipId}
                    role="tooltip"
                    initial={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 10, scale: 0.92 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 8, scale: 0.94 }
                    }
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    style={
                      prefersReducedMotion
                        ? { whiteSpace: "nowrap" }
                        : { translateX, rotate, whiteSpace: "nowrap" }
                    }
                    className="pointer-events-none absolute -top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center rounded-xl border border-white/15 bg-[#24101b] px-3 py-2 text-center shadow-[0_12px_32px_rgba(82,8,43,0.28)]"
                  >
                    <span className="text-xs font-semibold text-white">
                      {item.name}
                    </span>
                    <span className="mt-0.5 text-[10px] text-pink-100/75">
                      {item.designation}
                    </span>
                    <span className="absolute -bottom-1 h-2 w-2 rotate-45 border-r border-b border-white/15 bg-[#24101b]" />
                  </m.div>
                ) : null}
              </AnimatePresence>

              <a
                href={item.href}
                rel="author noreferrer"
                target="_blank"
                aria-label={`${item.name} — ${item.designation}`}
                aria-describedby={
                  hoveredIndex === item.id ? tooltipId : undefined
                }
                onMouseEnter={() => setHoveredIndex(item.id)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(item.id)}
                onBlur={() => setHoveredIndex(null)}
                onMouseMove={handleMouseMove}
                className="relative block rounded-full transition-transform duration-300 outline-none hover:z-30 hover:-translate-y-1 focus-visible:z-30 focus-visible:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#d00064] focus-visible:ring-offset-2"
              >
                <Image
                  height={100}
                  width={100}
                  src={item.image}
                  alt=""
                  className={cn(
                    "relative m-0 h-11 w-11 rounded-full border-2 border-white object-cover object-top p-0 shadow-[0_4px_14px_rgba(82,8,43,0.18)] transition-transform duration-300 group-focus-within:scale-105 group-hover:scale-105",
                    imageClassName
                  )}
                />
              </a>
            </li>
          )
        })}
      </ul>
    </LazyMotion>
  )
}
