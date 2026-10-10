"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { createPortal } from "react-dom"
import {
  IconFocusCentered,
  IconMinus,
  IconPlus,
  IconX,
} from "@tabler/icons-react"

const MIN = 0.2
const MAX = 6
// Matches the p-6 padding around the diagram card.
const PADDING = 48

type View = { scale: number; x: number; y: number }

/**
 * Full-screen viewer for a rendered diagram: wheel or pinch to zoom around
 * the pointer, drag to pan, buttons or +/−/0 keys, Escape to close.
 */
export function MermaidLightbox({
  svg,
  title,
  onClose,
}: {
  svg: string
  title: string
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const size = useRef({ width: 0, height: 0 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ distance: number; view: View } | null>(null)
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 })

  const fit = useCallback(() => {
    const box = stage.current?.getBoundingClientRect()
    const { width, height } = size.current
    if (!box || !width || !height) return
    const scale = Math.min(box.width / width, box.height / height) * 0.92
    setView({
      scale,
      x: (box.width - width * scale) / 2,
      y: (box.height - height * scale) / 2,
    })
  }, [])

  /** Zooms by `factor`, keeping the stage point (px, py) still. */
  const zoomAt = useCallback((factor: number, px?: number, py?: number) => {
    const box = stage.current?.getBoundingClientRect()
    if (!box) return
    const cx = px ?? box.width / 2
    const cy = py ?? box.height / 2
    setView((current) => {
      const scale = Math.min(MAX, Math.max(MIN, current.scale * factor))
      const ratio = scale / current.scale
      return {
        scale,
        x: cx - (cx - current.x) * ratio,
        y: cy - (cy - current.y) * ratio,
      }
    })
  }, [])

  useLayoutEffect(() => {
    const node = dialog.current
    if (node && !node.open) node.showModal()
    // Show the diagram at its natural size, then fit it to the screen.
    const element = content.current?.querySelector("svg")
    if (element) {
      const viewBox = element.viewBox.baseVal
      const width = viewBox?.width || element.getBoundingClientRect().width
      const height = viewBox?.height || element.getBoundingClientRect().height
      size.current = { width: width + PADDING, height: height + PADDING }
      element.style.maxWidth = "none"
      element.setAttribute("width", String(width))
      element.setAttribute("height", String(height))
    }
    fit()
  }, [fit])

  useEffect(() => {
    const node = stage.current
    if (!node) return
    // Wheel must be non-passive to stop the page from scrolling.
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const box = node.getBoundingClientRect()
      zoomAt(
        Math.exp(-event.deltaY * 0.0015),
        event.clientX - box.left,
        event.clientY - box.top
      )
    }
    node.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("resize", fit)
    // Keep the page behind the viewer still.
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = "hidden"
    return () => {
      root.style.overflow = previousOverflow
      node.removeEventListener("wheel", onWheel)
      window.removeEventListener("resize", fit)
    }
  }, [fit, zoomAt])

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = {
        distance: Math.hypot(a!.x - b!.x, a!.y - b!.y),
        view,
      }
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    const next = { x: event.clientX, y: event.clientY }
    pointers.current.set(event.pointerId, next)
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const box = stage.current!.getBoundingClientRect()
      const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y)
      const start = pinch.current.view
      const scale = Math.min(
        MAX,
        Math.max(MIN, start.scale * (distance / pinch.current.distance))
      )
      const cx = (a!.x + b!.x) / 2 - box.left
      const cy = (a!.y + b!.y) / 2 - box.top
      const ratio = scale / start.scale
      setView({
        scale,
        x: cx - (cx - start.x) * ratio,
        y: cy - (cy - start.y) * ratio,
      })
      return
    }
    setView((current) => ({
      ...current,
      x: current.x + next.x - previous.x,
      y: current.y + next.y - previous.y,
    }))
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size < 2) pinch.current = null
  }

  function onKeyDown(event: ReactKeyboardEvent) {
    if (event.key === "+" || event.key === "=") zoomAt(1.25)
    else if (event.key === "-") zoomAt(0.8)
    else if (event.key === "0") fit()
    else return
    event.preventDefault()
  }

  const button =
    "flex size-9 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:outline-none"

  if (typeof document === "undefined") return null

  return createPortal(
    <dialog
      ref={dialog}
      aria-label={`Diagram: ${title}`}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onKeyDown={onKeyDown}
      className="mermaid-lightbox fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none bg-[#140e16] p-0 text-white backdrop:bg-black/70"
    >
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent px-4 py-3">
        <p className="truncate text-sm font-semibold">{title}</p>
        <div className="flex items-center gap-1 rounded-full bg-white/10 p-1 backdrop-blur">
          <button
            type="button"
            className={button}
            aria-label="Perkecil"
            onClick={() => zoomAt(0.8)}
          >
            <IconMinus size={17} aria-hidden="true" />
          </button>
          <span className="w-12 text-center text-xs text-white/80 tabular-nums">
            {Math.round(view.scale * 100)}%
          </span>
          <button
            type="button"
            className={button}
            aria-label="Perbesar"
            onClick={() => zoomAt(1.25)}
          >
            <IconPlus size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={button}
            aria-label="Pas di layar"
            onClick={fit}
          >
            <IconFocusCentered size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={button}
            aria-label="Tutup"
            onClick={onClose}
          >
            <IconX size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        ref={stage}
        className="absolute inset-0 cursor-grab touch-none overflow-hidden select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={fit}
      >
        <div
          ref={content}
          className="mermaid-lightbox-content absolute top-0 left-0 origin-top-left rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1d171f]"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          }}
          // Mermaid output, rendered with securityLevel "strict".
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      <p className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5 text-xs text-white/60">
        Scroll atau cubit untuk zoom · seret untuk geser · klik dua kali atau 0
        untuk pas · Esc untuk tutup
      </p>
    </dialog>,
    document.body
  )
}
