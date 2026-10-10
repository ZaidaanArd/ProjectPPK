"use client"

import { useEffect, useId, useState, useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })
  return () => observer.disconnect()
}

function useDarkMode() {
  return useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false
  )
}

// Sthana palette: berry ink on blush, pink accents.
const palettes = {
  light: {
    background: "transparent",
    primaryColor: "#fff1f8",
    primaryTextColor: "#24152a",
    primaryBorderColor: "#d00064",
    secondaryColor: "#ffe5f2",
    tertiaryColor: "#fbf7fa",
    lineColor: "#8a5a74",
    textColor: "#24152a",
    noteBkgColor: "#fff7e0",
    noteTextColor: "#4a3500",
    noteBorderColor: "#e0b341",
    actorBkg: "#fff1f8",
    actorBorder: "#d00064",
    labelBackground: "#ffffff",
    edgeLabelBackground: "#ffffff",
  },
  dark: {
    background: "transparent",
    primaryColor: "#3a2232",
    primaryTextColor: "#f8edf4",
    primaryBorderColor: "#ff78b8",
    secondaryColor: "#2d1d29",
    tertiaryColor: "#251d28",
    lineColor: "#c89ab3",
    textColor: "#f8edf4",
    noteBkgColor: "#3d3214",
    noteTextColor: "#ffe9a8",
    noteBorderColor: "#a88a2f",
    actorBkg: "#3a2232",
    actorBorder: "#ff78b8",
    labelBackground: "#251d28",
    edgeLabelBackground: "#251d28",
  },
}

let renderQueue: Promise<unknown> = Promise.resolve()

/**
 * Renders a Mermaid definition as SVG in the browser. Mermaid is loaded on
 * demand, and renders are queued because its renderer is not re-entrant.
 * Until it is ready (or if the definition fails) the source is shown.
 */
export function MermaidDiagram({
  chart,
  className,
  label,
}: {
  chart: string
  className?: string
  label?: string
}) {
  const dark = useDarkMode()
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  const [result, setResult] = useState<{
    key: string
    svg?: string
    error?: string
  } | null>(null)
  const key = `${dark}:${chart}`

  useEffect(() => {
    let cancelled = false
    const job = renderQueue.then(async () => {
      const { default: mermaid } = await import("mermaid")
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: "inherit",
        themeVariables: dark ? palettes.dark : palettes.light,
        flowchart: { curve: "basis", htmlLabels: true },
      })
      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart.trim())
        if (!cancelled) setResult({ key, svg })
      } catch (error) {
        if (!cancelled)
          setResult({
            key,
            error: error instanceof Error ? error.message : String(error),
          })
      }
    })
    renderQueue = job.catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [chart, dark, id, key])

  const current = result?.key === key ? result : null

  return (
    <figure
      className={cn("mermaid-diagram", className)}
      aria-label={label}
      data-state={current?.svg ? "ready" : current?.error ? "error" : "loading"}
    >
      {current?.svg ? (
        <div
          className="mermaid-diagram-svg"
          // Mermaid output, rendered with securityLevel "strict".
          dangerouslySetInnerHTML={{ __html: current.svg }}
        />
      ) : (
        <pre className="mermaid-diagram-source">
          <code>{chart.trim()}</code>
        </pre>
      )}
      {current?.error && (
        <figcaption className="mermaid-diagram-error">
          Diagram gagal dirender: {current.error}
        </figcaption>
      )}
    </figure>
  )
}
