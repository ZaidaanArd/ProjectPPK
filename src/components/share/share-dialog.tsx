"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import {
  IconBrandTelegram,
  IconBrandWhatsapp,
  IconBrandX,
  IconDownload,
  IconLink,
  IconMoon,
  IconQuote,
  IconShare,
} from "@tabler/icons-react"

import {
  ShareCard,
  shareSizes,
  type ShareFormat,
  type ShareSubject,
} from "@/components/share/share-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogCloseButton, DialogTitle } from "@/components/ui/dialog"
import { toastError } from "@/lib/toast"
import { cn } from "@/lib/utils"

const PREVIEW_WIDTH = 280

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function shareText(subject: ShareSubject) {
  if (subject.kind === "reservation") {
    return subject.status === "approved"
      ? `Reservasi ${subject.facilityName} disetujui! Aku pesan lewat Sthana Kampus 🎉`
      : `Aku baru reservasi ${subject.facilityName} lewat Sthana Kampus 🗓️`
  }
  return subject.status === "resolved"
    ? `Kendala di ${subject.facilityName} sudah beres berkat laporan di Sthana Kampus ✨`
    : `Aku melaporkan kendala di ${subject.facilityName} lewat Sthana Kampus 🔧`
}

async function waitForAssets(node: HTMLElement) {
  await document.fonts.ready
  await Promise.all(
    Array.from(node.querySelectorAll("img")).map((image) =>
      image.complete
        ? undefined
        : new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true })
            image.addEventListener("error", resolve, { once: true })
          })
    )
  )
}

function Toggle({
  pressed,
  onClick,
  icon,
  children,
}: {
  pressed: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:outline-none",
        pressed
          ? "border-pink-400/60 bg-pink-100 text-pink-800 dark:bg-pink-400/20 dark:text-pink-100"
          : "border-border bg-background text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {children}
    </button>
  )
}

export function ShareDialog({
  subject,
  onClose,
}: {
  subject: ShareSubject | null
  onClose: () => void
}) {
  const capture = useRef<HTMLDivElement>(null)
  const [format, setFormat] = useState<ShareFormat>("post")
  const [dark, setDark] = useState(false)
  const [snippet, setSnippet] = useState(true)
  const [busy, setBusy] = useState(false)

  const size = shareSizes[format]
  const scale = PREVIEW_WIDTH / size.width
  const url =
    typeof window === "undefined"
      ? "https://sthana.myudak.com/facilities"
      : `${window.location.origin}/facilities`
  const text = subject ? shareText(subject) : ""
  const fileName = subject
    ? `sthana-${subject.kind === "reservation" ? "reservasi" : "laporan"}-${slug(subject.facilityName)}-${format}.png`
    : "sthana.png"

  async function renderImage() {
    const node = capture.current
    if (!node) throw new Error("Kartu belum siap")
    await waitForAssets(node)
    const { domToBlob } = await import("modern-screenshot")
    return domToBlob(node, {
      type: "image/png",
      scale: 1,
      width: size.width,
      height: size.height,
    })
  }

  function download(blob: Blob) {
    const href = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = href
    link.download = fileName
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(href), 1000)
  }

  async function copyLink(quiet = false) {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      if (!quiet) toast.success("Link disalin", { description: url })
      return true
    } catch (error) {
      if (!quiet) toastError("Link gagal disalin", error)
      return false
    }
  }

  async function run(action: "share" | "download") {
    setBusy(true)
    try {
      const blob = await renderImage()
      const file = new File([blob], fileName, { type: "image/png" })
      if (
        action === "share" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "Sthana Kampus",
          text,
          url,
        })
        return
      }
      download(blob)
      if (action === "share") {
        const copied = await copyLink(true)
        toast.success("Gambar diunduh", {
          description: copied
            ? "Link juga sudah disalin — tinggal tempel di postinganmu."
            : "Unggah gambarnya ke media sosialmu.",
        })
      } else {
        toast.success("Gambar diunduh", { description: fileName })
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      toastError("Gambar gagal dibuat", error)
    } finally {
      setBusy(false)
    }
  }

  const encoded = {
    text: encodeURIComponent(text),
    url: encodeURIComponent(url),
  }
  const socials = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      icon: <IconBrandWhatsapp size={18} aria-hidden="true" />,
    },
    {
      label: "X",
      href: `https://x.com/intent/post?text=${encoded.text}&url=${encoded.url}`,
      icon: <IconBrandX size={18} aria-hidden="true" />,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encoded.url}&text=${encoded.text}`,
      icon: <IconBrandTelegram size={18} aria-hidden="true" />,
    },
  ]

  return (
    <Dialog
      open={subject !== null}
      onClose={onClose}
      labelledBy="share-dialog-title"
      size="md"
    >
      {subject && (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle
              id="share-dialog-title"
              className="font-heading text-lg"
            >
              Bagikan {subject.facilityName}
            </DialogTitle>
            <DialogCloseButton onClose={onClose} />
          </div>

          {/* Stacked preview */}
          <div
            className="relative mx-auto transition-[height] duration-300"
            style={{ width: PREVIEW_WIDTH, height: size.height * scale }}
          >
            {[-7, 6].map((angle) => (
              <span
                key={angle}
                aria-hidden="true"
                className="absolute inset-0 rounded-[26px] border border-pink-200/40 bg-gradient-to-br from-pink-200/60 to-pink-400/30 blur-[1px] dark:from-pink-500/20 dark:to-fuchsia-500/10"
                style={{ transform: `rotate(${angle}deg) scale(0.94)` }}
              />
            ))}
            <figure
              className="absolute inset-0 overflow-hidden rounded-[26px] shadow-2xl shadow-pink-900/25"
              aria-label="Pratinjau kartu"
            >
              <div
                style={{
                  width: size.width,
                  height: size.height,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <ShareCard
                  subject={subject}
                  format={format}
                  dark={dark}
                  snippet={snippet}
                />
              </div>
            </figure>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
              {(["post", "story"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={format === value}
                  onClick={() => setFormat(value)}
                  className={cn(
                    "h-8 rounded-full px-4 text-sm font-semibold transition-colors",
                    format === value
                      ? "bg-pink-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {value === "post" ? "Post" : "Story"}
                </button>
              ))}
            </div>
            <Toggle
              pressed={dark}
              onClick={() => setDark((value) => !value)}
              icon={<IconMoon size={16} aria-hidden="true" />}
            >
              Gelap
            </Toggle>
            <Toggle
              pressed={snippet}
              onClick={() => setSnippet((value) => !value)}
              icon={<IconQuote size={16} aria-hidden="true" />}
            >
              Cuplikan
            </Toggle>
          </div>

          <div className="space-y-2.5">
            <Button
              className="h-12 w-full rounded-2xl text-base"
              disabled={busy}
              onClick={() => void run("share")}
            >
              <IconShare aria-hidden="true" />
              {busy ? "Menyiapkan gambar…" : "Bagikan"}
            </Button>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                className="h-11 rounded-2xl"
                onClick={() => void copyLink()}
              >
                <IconLink aria-hidden="true" />
                Salin link
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-2xl"
                disabled={busy}
                onClick={() => void run("download")}
              >
                <IconDownload aria-hidden="true" />
                Unduh gambar
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            Kirim link lewat
            {socials.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Kirim lewat ${label}`}
                className="grid size-9 place-items-center rounded-full transition-colors hover:bg-muted hover:text-foreground"
              >
                {icon}
              </a>
            ))}
          </div>

          {/* Full-size copy for the PNG capture, clipped out of view. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 size-0 overflow-hidden"
          >
            <ShareCard
              ref={capture}
              subject={subject}
              format={format}
              dark={dark}
              snippet={snippet}
            />
          </div>
        </div>
      )}
    </Dialog>
  )
}
