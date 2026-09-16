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
import { StatusBadge } from "./status-badge"

export function FacilityCard({
  facility,
  role,
  onCekSlot,
  onEdit,
  onToggleNonaktif,
  onToggleMaintenance,
}: {
  facility: FacilityItem
  role: DemoRole
  onCekSlot: (f: FacilityItem) => void
  onEdit: (f: FacilityItem) => void
  onToggleNonaktif: (f: FacilityItem) => void
  onToggleMaintenance: (f: FacilityItem) => void
}) {
  const isAdmin = role === "admin"
  const bisaMaintenance = role === "admin" || role === "petugas"
  const nonaktif = facility.status === "Nonaktif"

  return (
    <Card className="h-full">
      {facility.fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={facility.fotoUrl}
          alt={facility.nama}
          loading="lazy"
          className="aspect-[16/9] w-full object-cover"
        />
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
          variant={nonaktif ? "secondary" : "default"}
          onClick={() => onCekSlot(facility)}
          className="w-full"
        >
          <IconCalendarTime size={16} aria-hidden="true" />
          Cek Jadwal Slot
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
