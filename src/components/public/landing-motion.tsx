"use client"
import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (media.matches || !("IntersectionObserver" in window)) {
      const revealAll = () =>
        root.current
          ?.querySelectorAll<HTMLElement>(".reveal-pending")
          .forEach((node) => node.classList.remove("reveal-pending"))
      revealAll()
      const fallback = new MutationObserver(revealAll)
      if (root.current)
        fallback.observe(root.current, { childList: true, subtree: true })
      return () => fallback.disconnect()
    }
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
    const registered = new Set<HTMLElement>()
    const scheduled = new Set<number>()
    const schedule = (callback: () => void) => {
      const frame = window.requestAnimationFrame(() => {
        scheduled.delete(frame)
        callback()
      })
      scheduled.add(frame)
    }
    const cancelScheduled = () => {
      scheduled.forEach((frame) => window.cancelAnimationFrame(frame))
      scheduled.clear()
    }
    const register = (node: HTMLElement) => {
      if (registered.has(node)) return
      registered.add(node)
      if (node.dataset.reveal === "dynamic") {
        node.classList.add("reveal-pending")
        schedule(() =>
          schedule(() => {
            if (node.isConnected) observer.observe(node)
          })
        )
        return
      }
      if (node.getBoundingClientRect().top > window.innerHeight)
        node.classList.add("reveal-pending")
      observer.observe(node)
    }
    root.current
      ?.querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach(register)
    const changes = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((added) => {
          if (!(added instanceof HTMLElement)) return
          if (added.matches("[data-reveal]")) register(added)
          added.querySelectorAll<HTMLElement>("[data-reveal]").forEach(register)
        })
      })
    })
    if (root.current)
      changes.observe(root.current, { childList: true, subtree: true })
    const stop = () => {
      if (media.matches) {
        cancelScheduled()
        registered.forEach((node) => node.classList.remove("reveal-pending"))
        observer.disconnect()
        changes.disconnect()
      }
    }
    media.addEventListener("change", stop)
    return () => {
      cancelScheduled()
      observer.disconnect()
      changes.disconnect()
      media.removeEventListener("change", stop)
      registered.forEach((node) => node.classList.remove("reveal-pending"))
    }
  }, [])
  return <div ref={root}>{children}</div>
}
