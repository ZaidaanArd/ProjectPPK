"use client"

import { IconPlus, IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  KAPASITAS_OPTIONS,
  LOKASI_FASILITAS,
  STATUS_FASILITAS,
  TIPE_FASILITAS,
  type KapasitasFilter,
} from "@/lib/facilities-dashboard/constants"
import type {
  DemoRole,
  FacilityStatus,
  FacilityType,
} from "@/lib/facilities-dashboard/types"
import { RoleSwitcher } from "./role-switcher"

export type FilterSemua = "semua"

export function DashboardControls({
  search,
  onSearch,
  tipe,
  onTipe,
  status,
  onStatus,
  lokasi,
  onLokasi,
  kapasitas,
  onKapasitas,
  role,
  onRole,
  onTambah,
  showRoleSwitcher = true,
}: {
  search: string
  onSearch: (v: string) => void
  tipe: FacilityType | FilterSemua
  onTipe: (v: FacilityType | FilterSemua) => void
  status: FacilityStatus | FilterSemua
  onStatus: (v: FacilityStatus | FilterSemua) => void
  lokasi: string
  onLokasi: (v: string) => void
  kapasitas: KapasitasFilter
  onKapasitas: (v: KapasitasFilter) => void
  role: DemoRole
  onRole: (r: DemoRole) => void
  onTambah: () => void
  showRoleSwitcher?: boolean
}) {
  return (
    <section
      aria-label="Kontrol dashboard fasilitas"
      className="rounded-4xl bg-card p-4 shadow-md ring-1 ring-foreground/5 sm:p-5"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <IconSearch
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari nama fasilitas…"
            aria-label="Cari nama fasilitas"
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showRoleSwitcher && <RoleSwitcher value={role} onChange={onRole} />}
          {role === "admin" && (
            <Button type="button" onClick={onTambah}>
              <IconPlus size={16} aria-hidden="true" />
              Tambah Fasilitas
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-3 lg:grid-cols-4">
        <div className="grid gap-1.5">
          <Label id="filter-tipe-label">Tipe</Label>
          <Select
            value={tipe}
            onValueChange={(v) => onTipe(v as FacilityType | FilterSemua)}
          >
            <SelectTrigger
              aria-labelledby="filter-tipe-label"
              className="w-full"
            >
              <SelectValue placeholder="Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua tipe</SelectItem>
              {TIPE_FASILITAS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label id="filter-status-label">Status</Label>
          <Select
            value={status}
            onValueChange={(v) => onStatus(v as FacilityStatus | FilterSemua)}
          >
            <SelectTrigger
              aria-labelledby="filter-status-label"
              className="w-full"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua status</SelectItem>
              {STATUS_FASILITAS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label id="filter-lokasi-label">Lokasi</Label>
          <Select value={lokasi} onValueChange={(v) => onLokasi(v ?? "semua")}>
            <SelectTrigger
              aria-labelledby="filter-lokasi-label"
              className="w-full"
            >
              <SelectValue placeholder="Lokasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua lokasi</SelectItem>
              {LOKASI_FASILITAS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label id="filter-kapasitas-label">Kapasitas</Label>
          <Select
            value={kapasitas}
            onValueChange={(v) => onKapasitas(v as KapasitasFilter)}
          >
            <SelectTrigger
              aria-labelledby="filter-kapasitas-label"
              className="w-full"
            >
              <SelectValue placeholder="Kapasitas" />
            </SelectTrigger>
            <SelectContent>
              {KAPASITAS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  )
}
