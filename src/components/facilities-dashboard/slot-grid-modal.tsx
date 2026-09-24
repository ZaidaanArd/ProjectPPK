"use client"

import * as React from "react"
import {
  IconCalendar,
  IconClock,
  IconLock,
  IconMapPin,
  IconUsers,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogCloseButton,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  formatTanggalIndo,
  generateTimeSlots,
  parseIsoDate,
  toIsoDate,
} from "@/lib/facilities-dashboard/constants"
import type { FacilityItem, TimeSlot } from "@/lib/facilities-dashboard/types"
import { getGalleryPhotos } from "@/lib/facilities-dashboard/types"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { PhotoGallery } from "./photo-gallery"
import { StatusBadge } from "./status-badge"

export function SlotGridModal({
  facility,
  bookedIds,
  selectedDate,
  onSelectDate,
  onClose,
  onPilihSlot,
  slotsOverride,
  illustrated = false,
}: {
  facility: FacilityItem | null
  bookedIds: string[]
  selectedDate: string
  onSelectDate: (iso: string) => void
  onClose: () => void
  onPilihSlot?: (
    facility: FacilityItem,
    slot: TimeSlot,
    isoDate: string
  ) => void
  slotsOverride?: TimeSlot[] | null
  illustrated?: boolean
}) {
  const slots = React.useMemo(
    () =>
      slotsOverride ??
      (slotsOverride === undefined && facility
        ? generateTimeSlots(facility.status, bookedIds)
        : []),
    [facility, bookedIds, slotsOverride]
  )
  const tersedia = slots.filter((s) => s.status === "tersedia").length
  const terisi = slots.filter((s) => s.status === "terisi").length
  const gallery = facility ? getGalleryPhotos(facility) : []
  const [hanyaTersedia, setHanyaTersedia] = React.useState(false)

  const slotTampil = React.useMemo(
    () =>
      hanyaTersedia ? slots.filter((s) => s.status === "tersedia") : slots,
    [slots, hanyaTersedia]
  )

  const minDate = React.useMemo(() => parseIsoDate(toIsoDate(new Date())), [])
  const maxDate = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return toIsoDate(d)
  }, [])
  const maxCalendarDate = React.useMemo(() => parseIsoDate(maxDate), [maxDate])
  const selectedCalendarDate = selectedDate
    ? parseIsoDate(selectedDate)
    : undefined

  if (!facility) {
    return (
      <Dialog
        open={false}
        onClose={onClose}
        size="xl"
        labelledBy="slot-modal-title"
      >
        <span />
      </Dialog>
    )
  }

  const tanggalLabel = selectedDate ? formatTanggalIndo(selectedDate) : ""

  return (
    <Dialog
      open={facility !== null}
      onClose={onClose}
      size="xl"
      labelledBy="slot-modal-title"
    >
      <DialogHeader>
        <div className="min-w-0">
          <DialogTitle id="slot-modal-title">
            Slot Waktu — {facility.nama}
          </DialogTitle>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <StatusBadge status={facility.status} />
            <Badge variant="secondary">{facility.tipe}</Badge>
            <span className="inline-flex items-center gap-1">
              <IconMapPin size={13} aria-hidden="true" />
              {facility.lokasi}
            </span>
            <span className="inline-flex items-center gap-1">
              <IconUsers size={13} aria-hidden="true" />
              {facility.kapasitas} orang
            </span>
          </div>
        </div>
        <DialogCloseButton onClose={onClose} />
      </DialogHeader>

      {/* 1. Foto ruangan */}
      <section aria-labelledby="slot-foto-heading" className="mb-5">
        <h3
          id="slot-foto-heading"
          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          {illustrated ? "Ilustrasi fasilitas" : "Foto ruangan"}
        </h3>
        <div className="mt-2">
          <PhotoGallery
            key={facility.id}
            photos={gallery}
            facilityName={facility.nama}
          />
        </div>
      </section>

      {/* 2. Operasional + Deskripsi — garis abu atas-bawah, tanpa kotak */}
      <section aria-labelledby="slot-deskripsi-heading" className="mb-5">
        <h3
          id="slot-deskripsi-heading"
          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          Operasional & Deskripsi fasilitas
        </h3>
        <Separator className="mt-2" />
        <div className="flex items-center gap-2.5 py-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <IconClock size={15} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold tracking-wide">
            Operasional 07.00–20.00 WIB
          </p>
        </div>
        <Separator />
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">
          {facility.deskripsi || "Belum ada deskripsi."}
        </p>
      </section>

      <Separator className="mb-5" />

      {facility.status === "Dalam Perbaikan" && (
        <output className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          <IconLock size={15} aria-hidden="true" />
          Fasilitas dalam perbaikan — seluruh slot terkunci otomatis.
        </output>
      )}
      {facility.status === "Nonaktif" && (
        <output className="mb-4 rounded-2xl border bg-muted px-3 py-2 text-sm text-muted-foreground">
          Fasilitas nonaktif — tidak menerima reservasi baru.
        </output>
      )}

      {/* 3+4. Tanggal (kalender shadcn) + Jadwal (tab sesi + pil kompak) */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* 3. Pilih tanggal — tanpa kotak */}
        <section aria-labelledby="slot-tanggal-heading">
          <h3
            id="slot-tanggal-heading"
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            <IconCalendar size={14} aria-hidden="true" />
            Pilih tanggal
          </h3>
          <div className="mt-2 flex justify-center sm:justify-start">
            <Calendar
              mode="single"
              selected={selectedCalendarDate}
              onSelect={(d) => {
                if (d) onSelectDate(toIsoDate(d))
              }}
              disabled={{ before: minDate, after: maxCalendarDate }}
              startMonth={minDate}
              endMonth={maxCalendarDate}
              className="rounded-2xl border"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {selectedDate ? (
              <>
                Terpilih:{" "}
                <span className="font-semibold text-foreground">
                  {tanggalLabel}
                </span>{" "}
                {slotsOverride === null
                  ? "· Memuat jadwal…"
                  : `· ${tersedia} tersedia · ${terisi} terisi`}
              </>
            ) : (
              "Belum ada tanggal dipilih — klik tanggal di kalender."
            )}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Maks {maxDate} (H+30) · tanggal lewat nonaktif otomatis.
          </p>
        </section>

        {/* 4. Jadwal — langsung semua jam, tanpa bagi sesi */}
        <section aria-labelledby="slot-jadwal-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              id="slot-jadwal-heading"
              className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {selectedDate ? `Jadwal — ${tanggalLabel}` : "Jadwal"}
            </h3>
            {selectedDate && (
              <label
                htmlFor="slot-hanya-tersedia"
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground"
              >
                <input
                  id="slot-hanya-tersedia"
                  type="checkbox"
                  checked={hanyaTersedia}
                  onChange={(e) => setHanyaTersedia(e.target.checked)}
                  className="size-3.5 accent-emerald-600"
                />
                Hanya tersedia
              </label>
            )}
          </div>

          {!selectedDate ? (
            <p className="mt-2 rounded-2xl border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              Pilih tanggal dulu untuk melihat jadwal slot.
            </p>
          ) : slotsOverride === null ? (
            <output className="mt-2 block rounded-2xl border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              Memuat jadwal…
            </output>
          ) : slotTampil.length === 0 ? (
            <p className="mt-2 rounded-2xl border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              Tidak ada slot tersedia untuk filter ini.
            </p>
          ) : (
            <>
              <div
                aria-label={`Slot ${facility.nama} tanggal ${tanggalLabel}`}
                className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-4"
              >
                {slotTampil.map((slot) => {
                  const bisaKlik = slot.status === "tersedia"
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!bisaKlik}
                      onClick={() =>
                        onPilihSlot?.(facility, slot, selectedDate)
                      }
                      title={
                        bisaKlik
                          ? `Slot ${slot.mulai}–${slot.selesai} tanggal ${tanggalLabel} tersedia`
                          : slot.status === "terkunci"
                            ? "Terkunci (maintenance)"
                            : "Tidak tersedia"
                      }
                      className={cn(
                        "h-9 rounded-xl border text-[11px] font-semibold tabular-nums transition-all",
                        bisaKlik
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-200"
                          : slot.status === "terkunci"
                            ? "cursor-not-allowed border-amber-500/30 bg-amber-500/10 text-amber-800/70 dark:text-amber-200/70"
                            : "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-70"
                      )}
                    >
                      {slot.mulai}
                    </button>
                  )
                })}
              </div>

              <p className="mt-2 text-[11px] text-muted-foreground">
                Tiap slot 30 menit · klik jam hijau untuk memilih.
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <i
                    aria-hidden="true"
                    className="size-2 rounded-full bg-emerald-500"
                  />{" "}
                  Tersedia
                </span>
                <span className="inline-flex items-center gap-1">
                  <i
                    aria-hidden="true"
                    className="size-2 rounded-full bg-zinc-400"
                  />{" "}
                  Terisi
                </span>
                <span className="inline-flex items-center gap-1">
                  <i
                    aria-hidden="true"
                    className="size-2 rounded-full bg-amber-500"
                  />{" "}
                  Terkunci
                </span>
              </div>
            </>
          )}
        </section>
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Tutup
        </Button>
      </div>
    </Dialog>
  )
}
