"use client"

import { useEffect, useId, useMemo, useState, type DragEvent } from "react"
import { IconPhotoPlus, IconRestore, IconUpload } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { facilityImage } from "@/lib/facility-illustrations"
import { cn } from "@/lib/utils"

const MAX_BYTES = 5 * 1024 * 1024
const TYPES = ["image/jpeg", "image/png", "image/webp"]

export type FacilityPhotoValue = {
  /** A newly picked file, uploaded when the form is saved. */
  file: File | null
  /** The photo the facility already has, if any. */
  currentUrl: string | null
  /** True when the admin chose to drop the current photo. */
  remove: boolean
}

export const emptyPhoto: FacilityPhotoValue = {
  file: null,
  currentUrl: null,
  remove: false,
}

/** Rejects a file before upload with the same rules the server enforces. */
export function photoProblem(file: File) {
  if (!TYPES.includes(file.type))
    return "Format foto harus JPG, PNG, atau WebP."
  if (file.size > MAX_BYTES) return "Ukuran foto maksimal 5 MB."
  return null
}

/**
 * Cover photo picker for a facility. Shows what visitors will see: the new
 * file, else the current photo, else the illustration used by default.
 */
export function FacilityPhotoField({
  value,
  onChange,
  name,
  type,
  disabled,
}: {
  value: FacilityPhotoValue
  onChange: (value: FacilityPhotoValue) => void
  name: string
  type: string
  disabled?: boolean
}) {
  const inputId = useId()
  const [error, setError] = useState("")
  const [dragging, setDragging] = useState(false)
  const fileUrl = useMemo(
    () => (value.file ? URL.createObjectURL(value.file) : null),
    [value.file]
  )
  useEffect(
    () => () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    },
    [fileUrl]
  )

  const shownUrl = fileUrl ?? (value.remove ? null : value.currentUrl)
  const fallback = facilityImage({ name: name || "Fasilitas", type })
  const hasPhoto = Boolean(shownUrl)

  function pick(file: File | undefined) {
    if (!file) return
    const problem = photoProblem(file)
    setError(problem ?? "")
    if (!problem) onChange({ ...value, file, remove: false })
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    if (!disabled) pick(event.dataTransfer.files[0])
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <p className="text-sm font-medium">Foto fasilitas</p>
      {/* Drag and drop is a shortcut; the label and button open the picker. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "group relative block aspect-[16/7] cursor-pointer overflow-hidden rounded-2xl border bg-muted/30 transition-colors",
          dragging
            ? "border-pink-500 ring-2 ring-pink-400/40"
            : "border-border/80 hover:border-pink-300",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shownUrl ?? fallback.src}
          alt={hasPhoto ? `Foto ${name}` : fallback.alt}
          className="size-full object-cover"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {hasPhoto
            ? value.file
              ? "Foto baru · disimpan saat formulir dikirim"
              : "Foto saat ini"
            : "Gambar bawaan (ilustrasi)"}
        </span>
        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-pink-700 shadow-lg">
            <IconUpload size={16} aria-hidden="true" />
            {hasPhoto ? "Ganti foto" : "Unggah foto"}
          </span>
        </span>
        <input
          id={inputId}
          type="file"
          accept={TYPES.join(",")}
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            pick(event.target.files?.[0])
            event.target.value = ""
          }}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <IconPhotoPlus aria-hidden="true" />
          {hasPhoto ? "Ganti foto" : "Pilih foto"}
        </Button>
        {hasPhoto && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={() => {
              setError("")
              onChange({ ...value, file: null, remove: true })
            }}
          >
            <IconRestore aria-hidden="true" />
            Pakai gambar bawaan
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          JPG, PNG, atau WebP · maks 5 MB · seret foto ke kotak di atas
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
