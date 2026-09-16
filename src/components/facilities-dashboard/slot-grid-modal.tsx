"use client"

import * as React from "react"
import { IconLock } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { generateTimeSlots } from "@/lib/facilities-dashboard/constants"
import type { FacilityItem, TimeSlot } from "@/lib/facilities-dashboard/types"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./status-badge"

function slotClass(status: TimeSlot["status"]) {
  if (status === "tersedia")
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-200"
  if (status === "terisi")
    return "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-80"
  if (status === "nonaktif")
    return "cursor-not-allowed border-border bg-muted/60 text-muted-foreground opacity-70"
  // terkunci: orange stripe
  return "cursor-not-allowed border-amber-500/40 text-amber-800 dark:text-amber-200"
}

export function SlotGridModal({
  facility,
  bookedIds,
  onClose,
  onPilihSlot,
}: {
  facility: FacilityItem | null
  bookedIds: string[]
  onClose: () => void
  onPilihSlot?: (facility: FacilityItem, slot: TimeSlot) => void
}) {
  const slots = React.useMemo(
    () => (facility ? generateTimeSlots(facility.status, bookedIds) : []),
    [facility, bookedIds]
  )
  const tersedia = slots.filter((s) => s.status === "tersedia").length
  const terisi = slots.filter((s) => s.status === "terisi").length

  return (
    <Dialog
      open={facility !== null}
      onClose={onClose}
      size="xl"
      labelledBy="slot-modal-title"
    >
      {facility && (
        <>
          <DialogHeader>
            <div>
              <DialogTitle id="slot-modal-title">
                Slot Waktu — {facility.nama}
              </DialogTitle>
              <DialogDescription>
                Operasional 07.00–20.00 WIB · 26 slot × 30 menit · tanpa
                identitas pemesan.
              </DialogDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <StatusBadge status={facility.status} />
                <span>
                  {tersedia} tersedia · {terisi} terisi
                </span>
              </div>
            </div>
            <DialogCloseButton onClose={onClose} />
          </DialogHeader>

          {facility.status === "Dalam Perbaikan" && (
            <p
              role="status"
              className="mb-3 flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
            >
              <IconLock size={15} aria-hidden="true" />
              Fasilitas dalam perbaikan — seluruh slot terkunci otomatis.
            </p>
          )}
          {facility.status === "Nonaktif" && (
            <p
              role="status"
              className="mb-3 rounded-2xl border bg-muted px-3 py-2 text-sm text-muted-foreground"
            >
              Fasilitas nonaktif — tidak menerima reservasi baru.
            </p>
          )}

          <div
            role="list"
            aria-label={`Grid slot ${facility.nama}`}
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
          >
            {slots.map((slot) => {
              const bisaKlik = slot.status === "tersedia"
              return (
                <button
                  key={slot.id}
                  type="button"
                  role="listitem"
                  disabled={!bisaKlik}
                  onClick={() => onPilihSlot?.(facility, slot)}
                  title={
                    bisaKlik
                      ? `Slot ${slot.mulai}–${slot.selesai} tersedia`
                      : slot.status === "terkunci"
                        ? "Terkunci (maintenance)"
                        : "Tidak tersedia"
                  }
                  style={
                    slot.status === "terkunci"
                      ? {
                          backgroundImage:
                            "repeating-linear-gradient(135deg, rgba(245,158,11,.22) 0 8px, rgba(245,158,11,.08) 8px 16px)",
                        }
                      : undefined
                  }
                  className={cn(
                    "rounded-2xl border px-2 py-2.5 text-center transition-all",
                    slotClass(slot.status)
                  )}
                >
                  <span className="block text-xs font-semibold tabular-nums">
                    {slot.mulai}–{slot.selesai}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium">
                    {slot.status === "tersedia"
                      ? "Tersedia"
                      : slot.status === "terkunci"
                        ? "Terkunci"
                        : "Tidak Tersedia"}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <i
                aria-hidden="true"
                className="size-3 rounded-sm bg-emerald-500/70"
              />{" "}
              Tersedia (bisa diklik)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i aria-hidden="true" className="size-3 rounded-sm bg-zinc-400" />{" "}
              Terisi / Diproses
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i
                aria-hidden="true"
                className="size-3 rounded-sm bg-amber-500"
              />{" "}
              Terkunci (perbaikan)
            </span>
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </>
      )}
    </Dialog>
  )
}
