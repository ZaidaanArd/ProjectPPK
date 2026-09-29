"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconInfoCircle,
  IconLoader2,
} from "@tabler/icons-react"
import { Toaster as Sonner, useSonner, type ToasterProps } from "sonner"

// The app toggles dark mode with a class on <html> instead of next-themes.
function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })
  return () => observer.disconnect()
}

function getTheme(): ToasterProps["theme"] {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function getServerTheme(): ToasterProps["theme"] {
  return "light"
}

// Modal <dialog>s live in the browser top layer, above any z-index. Hosting
// the toaster in a manual popover (also top layer) and re-opening it when a
// toast arrives keeps toasts visible on top of an open modal.
function useTopLayer() {
  const ref = useRef<HTMLDivElement>(null)
  const { toasts } = useSonner()
  const count = toasts.length

  useEffect(() => {
    const layer = ref.current
    if (!layer || typeof layer.showPopover !== "function") return
    const open = layer.matches(":popover-open")
    if (count === 0) {
      if (open) layer.hidePopover()
      return
    }
    if (open && document.querySelector("dialog:modal")) layer.hidePopover()
    if (!layer.matches(":popover-open")) layer.showPopover()
  }, [count])

  return ref
}

function Toaster(props: ToasterProps) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme)
  const layerRef = useTopLayer()

  return (
    <div
      ref={layerRef}
      popover="manual"
      className="pointer-events-none m-0 size-full max-h-none max-w-none overflow-visible border-0 bg-transparent p-0 [&_[data-sonner-toast]]:pointer-events-auto"
    >
      <Sonner
        theme={theme}
        className="toaster group"
        icons={{
          success: <IconCircleCheck className="size-4" aria-hidden="true" />,
          info: <IconInfoCircle className="size-4" aria-hidden="true" />,
          warning: <IconAlertTriangle className="size-4" aria-hidden="true" />,
          error: <IconCircleX className="size-4" aria-hidden="true" />,
          loading: (
            <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />
          ),
        }}
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
            "--border-radius": "var(--radius)",
          } as React.CSSProperties
        }
        toastOptions={{
          classNames: {
            toast: "font-sans shadow-lg",
            description: "!text-current opacity-80",
          },
        }}
        {...props}
      />
    </div>
  )
}

export { Toaster }
