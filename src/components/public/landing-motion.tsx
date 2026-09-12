"use client"
import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (media.matches || !("IntersectionObserver" in window)) return
    const nodes =
      root.current?.querySelectorAll<HTMLElement>("[data-reveal]") ?? []
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("reveal-pending")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08 }
    )
    nodes.forEach((node) => {
      if (node.getBoundingClientRect().top > window.innerHeight)
        node.classList.add("reveal-pending")
      observer.observe(node)
    })
    const stop = () => {
      if (media.matches) {
        nodes.forEach((node) => node.classList.remove("reveal-pending"))
        observer.disconnect()
      }
    }
    media.addEventListener("change", stop)
    return () => {
      observer.disconnect()
      media.removeEventListener("change", stop)
      nodes.forEach((node) => node.classList.remove("reveal-pending"))
    }
  }, [])
  return <div ref={root}>{children}</div>
}
