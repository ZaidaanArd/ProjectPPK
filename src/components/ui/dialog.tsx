"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

type DialogProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** Lebar maksimum konten, default lg (32rem). Slot modal pakai xl. */
  size?: "md" | "lg" | "xl"
  labelledBy?: string
}

/** Cadangan bila event animationend tidak pernah dipanggil. */
const exitFallbackMs = 250

// Kunci scroll level dokumen dengan penghitung, terpisah dari mekanisme
// scroll lock Base UI yang menulis ke `document.body`. Nilai asli hanya
// diambil sekali agar tidak ada nilai basi saat beberapa dialog bertumpuk.
let scrollLockCount = 0
let originalRootOverflow = ""

function lockDocumentScroll() {
  if (scrollLockCount === 0) {
    originalRootOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = "hidden"
  }
  scrollLockCount += 1
}

function unlockDocumentScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1)
  if (scrollLockCount === 0) {
    document.documentElement.style.overflow = originalRootOverflow
  }
}

function Dialog({
  open,
  onClose,
  children,
  size = "lg",
  labelledBy,
}: DialogProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  // Tetap render selama animasi keluar agar transisinya terlihat.
  const [mounted, setMounted] = React.useState(open)
  // Bekukan konten terakhir saat terbuka supaya isinya tidak berubah
  // atau kosong selama animasi keluar.
  const [frozenChildren, setFrozenChildren] = React.useState(children)

  // Sesuaikan langsung saat dibuka (pola resmi React) agar tidak
  // memanggil setState sinkron di dalam effect.
  if (open && !mounted) setMounted(true)
  if (open && frozenChildren !== children) setFrozenChildren(children)

  React.useEffect(() => {
    if (open || !mounted) return
    const timer = window.setTimeout(() => setMounted(false), exitFallbackMs)
    return () => window.clearTimeout(timer)
  }, [open, mounted])

  React.useEffect(() => {
    if (!mounted) return
    lockDocumentScroll()
    return unlockDocumentScroll
  }, [mounted])

  React.useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !open || dialog.open) return
    dialog.showModal()
  }, [open, mounted])

  if (!mounted) return null
  // Komponen "use client" tetap di-render di server — jangan sentuh document di sana.
  if (typeof document === "undefined") return null

  const maxWidth =
    size === "xl" ? "max-w-3xl" : size === "md" ? "max-w-md" : "max-w-lg"

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      className={cn(
        "fixed inset-0 z-50 m-auto max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border-0 bg-card p-6 text-card-foreground shadow-2xl ring-1 ring-foreground/10 duration-100 sm:p-7 dark:bg-[#251d28] dark:text-[#f8ecf3] dark:ring-white/10",
        "backdrop:bg-[#17101a]/45 backdrop:backdrop-blur-md backdrop:duration-100 dark:backdrop:bg-black/65",
        open
          ? "animate-in fade-in-0 zoom-in-95 backdrop:animate-in backdrop:fade-in-0"
          : "animate-out fade-out-0 fill-mode-forwards zoom-out-95 backdrop:animate-out backdrop:fade-out-0 backdrop:fill-mode-forwards",
        maxWidth
      )}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onAnimationEnd={(event) => {
        if (!open && event.target === event.currentTarget) setMounted(false)
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open ? children : frozenChildren}
    </dialog>,
    document.body
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mb-4 flex items-start justify-between gap-4", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "font-heading text-lg font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("mt-1 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogCloseButton({
  onClose,
  label = "Tutup dialog",
}: {
  onClose: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClose}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <IconX size={16} aria-hidden="true" />
    </button>
  )
}

export {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogCloseButton,
}
