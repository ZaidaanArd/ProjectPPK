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

function Dialog({
  open,
  onClose,
  children,
  size = "lg",
  labelledBy,
}: DialogProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null)

  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  React.useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !open || dialog.open) return
    dialog.showModal()
  }, [open])

  if (!open) return null
  // Komponen "use client" tetap di-render di server — jangan sentuh document di sana.
  if (typeof document === "undefined") return null

  const maxWidth =
    size === "xl" ? "max-w-3xl" : size === "md" ? "max-w-md" : "max-w-lg"

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      className={cn(
        "fixed inset-0 z-50 m-auto max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border-0 bg-card p-6 text-card-foreground shadow-2xl ring-1 ring-foreground/10 backdrop:bg-[#17101a]/45 backdrop:backdrop-blur-md sm:p-7 dark:bg-[#251d28] dark:text-[#f8ecf3] dark:ring-white/10 dark:backdrop:bg-black/65",
        maxWidth
      )}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {children}
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
