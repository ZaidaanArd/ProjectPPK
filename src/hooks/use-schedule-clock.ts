"use client"

import { useSyncExternalStore } from "react"

const listeners = new Set<() => void>()
let snapshot: number | null = null
let timer: number | undefined
function update() {
  snapshot = Date.now()
  for (const listener of listeners) listener()
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    update()
    timer = window.setInterval(update, 1000)
    window.addEventListener("focus", update)
    document.addEventListener("visibilitychange", update)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.clearInterval(timer)
      window.removeEventListener("focus", update)
      document.removeEventListener("visibilitychange", update)
    }
  }
}
const getSnapshot = () => snapshot
const getServerSnapshot = () => null

/** Refresh on focus and time passing; null during SSR avoids stale hydration. */
export function useScheduleClock() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
