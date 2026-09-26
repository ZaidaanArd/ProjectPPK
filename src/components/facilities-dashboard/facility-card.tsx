"use client"

import {
  IconCalendarTime,
  IconMapPin,
  IconPhoto,
  IconPencil,
  IconPower,
  IconTool,
  IconUsers,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DemoRole, FacilityItem } from "@/lib/facilities-dashboard/types"
import { getCoverUrl } from "@/lib/facilities-dashboard/types"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./status-badge"

export function FacilityCard({
  facility,
  role,
  onCekSlot,
  onEdit,
  onToggleNonaktif,
  onToggleMaintenance,
  illustrated = false,
}: {
  facility: FacilityItem
  role: DemoRole
  onCekSlot: (f: FacilityItem) => void
  onEdit: (f: FacilityItem) => void
  onToggleNonaktif: (f: FacilityItem) => void
  onToggleMaintenance: (f: FacilityItem) => void
  illustrated?: boolean
}) {
  const isAdmin = role === "admin"
  const bisaMaintenance = role === "admin" || role === "petugas"
  const nonaktif = facility.status === "Nonaktif"
  const maintenance = facility.status === "Dalam Perbaikan"
  const unavailable = nonaktif || maintenance

  const cover = getCoverUrl(facility)
  const hasMultiple = (facility.photos?.length ?? 0) > 1

  return (
    <Card className={cover ? "h-full pt-0" : "h-full"}>
      {cover ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-[#f2f0ee] dark:bg-[#28252b]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={facility.photos?.[0]?.alt ?? facility.nama}
            loading="lazy"
            className="h-full w-full object-cover object-top"
          />
          {unavailable && (
            <span
              className={cn(
                "absolute top-2 left-2 rounded-full px-2 py-0.5 text-[11px] font-medium shadow-sm backdrop-blur",
                maintenance
                  ? "bg-amber-100/95 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200"
                  : "bg-background/90 text-muted-foreground"
              )}
            >
              {maintenance ? "Dalam Perbaikan" : "Nonaktif"}
            </span>
          )}
          {illustrated && (
            <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
              Ilustrasi
            </span>
          )}
          {hasMultiple && (
            <span className="absolute right-2 bottom-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
              +{facility.photos!.length} foto
            </span>
          )}
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-[16/9] w-full items-center justify-center bg-muted text-muted-foreground"
        >
          <IconPhoto size={32} />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="leading-snug">{facility.nama}</CardTitle>
          <StatusBadge status={facility.status} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
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
      </CardHeader>

      <CardContent>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {facility.deskripsi || "Belum ada deskripsi."}
        </p>
      </CardContent>

      <CardFooter className="mt-auto flex-col items-stretch gap-2">
        <Button
          type="button"
          variant={unavailable ? "secondary" : "default"}
          onClick={() => onCekSlot(facility)}
          disabled={unavailable}
          title={
            maintenance
              ? "Fasilitas sedang dalam perbaikan"
              : nonaktif
                ? "Fasilitas sedang tidak tersedia"
                : undefined
          }
          className="w-full"
        >
          <IconCalendarTime size={16} aria-hidden="true" />
          {maintenance
            ? "Sedang Perbaikan"
            : nonaktif
              ? "Tidak Tersedia"
              : "Cek Jadwal Slot"}
        </Button>

        {(isAdmin || bisaMaintenance) && (
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(facility)}
                >
                  <IconPencil size={14} aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={nonaktif ? "default" : "destructive"}
                  onClick={() => onToggleNonaktif(facility)}
                >
                  <IconPower size={14} aria-hidden="true" />
                  {nonaktif ? "Aktifkan" : "Nonaktifkan"}
                </Button>
              </>
            )}
            {bisaMaintenance && !nonaktif && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onToggleMaintenance(facility)}
                title={
                  facility.status === "Dalam Perbaikan"
                    ? "Kembalikan ke Aktif"
                    : "Ubah ke Dalam Perbaikan"
                }
              >
                <IconTool size={14} aria-hidden="true" />
                {facility.status === "Dalam Perbaikan"
                  ? "Selesai Maintenance"
                  : "Maintenance"}
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
