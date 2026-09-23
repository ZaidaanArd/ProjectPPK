"use client"

import * as React from "react"
import { DashboardControls, type FilterSemua } from "./dashboard-controls"
import { FacilityFormModal } from "./facility-form-modal"
import { FacilityGrid } from "./facility-grid"
import { SlotGridModal } from "./slot-grid-modal"
import {
  formatTanggalIndo,
  matchKapasitas,
  type KapasitasFilter,
} from "@/lib/facilities-dashboard/constants"
import {
  getBookedIdsForDate,
  mockFacilities,
} from "@/lib/facilities-dashboard/mock-data"
import type {
  DemoRole,
  FacilityFormValues,
  FacilityItem,
  FacilityStatus,
  FacilityType,
  TimeSlot,
} from "@/lib/facilities-dashboard/types"

function slugify(nama: string) {
  return (
    nama
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `fasilitas-${Date.now()}`
  )
}

export function FacilityDashboard({
  initialRole = "pengguna",
  showRoleSwitcher = true,
}: {
  initialRole?: DemoRole
  showRoleSwitcher?: boolean
}) {
  const [role, setRole] = React.useState<DemoRole>(initialRole)
  const [facilities, setFacilities] =
    React.useState<FacilityItem[]>(mockFacilities)
  const [search, setSearch] = React.useState("")
  const [tipe, setTipe] = React.useState<FacilityType | FilterSemua>("semua")
  const [status, setStatus] = React.useState<FacilityStatus | FilterSemua>(
    "semua"
  )
  const [lokasi, setLokasi] = React.useState<string>("semua")
  const [kapasitas, setKapasitas] = React.useState<KapasitasFilter>("semua")

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<FacilityItem | null>(null)
  const [slotFacility, setSlotFacility] = React.useState<FacilityItem | null>(
    null
  )
  const [selectedDate, setSelectedDate] = React.useState<string>("")
  const [notice, setNotice] = React.useState("")

  // Reset tanggal (kosong) tiap buka modal — jadwal baru muncul setelah tanggal dipilih via kalender
  function openSlot(f: FacilityItem) {
    setSelectedDate("")
    setSlotFacility(f)
  }

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return facilities.filter((f) => {
      if (q && !f.nama.toLowerCase().includes(q)) return false
      if (tipe !== "semua" && f.tipe !== tipe) return false
      if (status !== "semua" && f.status !== status) return false
      if (lokasi !== "semua" && f.lokasi !== lokasi) return false
      if (!matchKapasitas(f.kapasitas, kapasitas)) return false
      return true
    })
  }, [facilities, search, tipe, status, lokasi, kapasitas])

  function resetFilter() {
    setSearch("")
    setTipe("semua")
    setStatus("semua")
    setLokasi("semua")
    setKapasitas("semua")
  }

  function openTambah() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(f: FacilityItem) {
    setEditing(f)
    setFormOpen(true)
  }

  function handleSubmitForm(values: FacilityFormValues) {
    // Kerangka foto siap-DB: fotoUrl = cover (kompatibel), photos = galeri
    const normalized: FacilityFormValues = {
      ...values,
      fotoUrl: values.photos?.[0]?.url ?? values.fotoUrl ?? "",
    }
    if (editing) {
      setFacilities((prev) =>
        prev.map((f) => (f.id === editing.id ? { ...f, ...normalized } : f))
      )
      setNotice(`“${values.nama}” berhasil diperbarui.`)
    } else {
      const id = slugify(values.nama)
      setFacilities((prev) => [{ id, status: "Aktif", ...normalized }, ...prev])
      setNotice(`“${values.nama}” berhasil ditambahkan.`)
    }
    setFormOpen(false)
    setEditing(null)
  }

  function toggleNonaktif(f: FacilityItem) {
    setFacilities((prev) =>
      prev.map((x) =>
        x.id === f.id
          ? { ...x, status: x.status === "Nonaktif" ? "Aktif" : "Nonaktif" }
          : x
      )
    )
    setNotice(
      f.status === "Nonaktif"
        ? `“${f.nama}” diaktifkan kembali.`
        : `“${f.nama}” dinonaktifkan.`
    )
  }

  function toggleMaintenance(f: FacilityItem) {
    if (f.status === "Nonaktif") return
    setFacilities((prev) =>
      prev.map((x) =>
        x.id === f.id
          ? {
              ...x,
              status:
                x.status === "Dalam Perbaikan" ? "Aktif" : "Dalam Perbaikan",
            }
          : x
      )
    )
    setNotice(
      f.status === "Dalam Perbaikan"
        ? `“${f.nama}” kembali Aktif.`
        : `“${f.nama}” ditandai Dalam Perbaikan.`
    )
  }

  function handlePilihSlot(f: FacilityItem, slot: TimeSlot, isoDate: string) {
    const tgl = formatTanggalIndo(isoDate)
    // Hook integrasi ke modul reservasi (US-03): arahkan ke /app/reservations/new?facility=&date=&slot=
    setNotice(
      `Slot ${slot.mulai}–${slot.selesai} di “${f.nama}” tanggal ${tgl} tersedia — lanjutkan ke form reservasi.`
    )
    setSlotFacility(null)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      {notice && (
        <output className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-800 dark:text-emerald-200">
          {notice}
        </output>
      )}

      <DashboardControls
        search={search}
        onSearch={setSearch}
        tipe={tipe}
        onTipe={setTipe}
        status={status}
        onStatus={setStatus}
        lokasi={lokasi}
        onLokasi={setLokasi}
        kapasitas={kapasitas}
        onKapasitas={setKapasitas}
        role={role}
        onRole={setRole}
        onTambah={openTambah}
        showRoleSwitcher={showRoleSwitcher}
      />

      <FacilityGrid
        facilities={filtered}
        role={role}
        onCekSlot={openSlot}
        onEdit={openEdit}
        onToggleNonaktif={toggleNonaktif}
        onToggleMaintenance={toggleMaintenance}
        onReset={resetFilter}
      />

      <FacilityFormModal
        open={formOpen}
        editing={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmitForm}
      />

      <SlotGridModal
        facility={slotFacility}
        bookedIds={
          slotFacility && selectedDate
            ? getBookedIdsForDate(slotFacility.id, selectedDate)
            : []
        }
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onClose={() => setSlotFacility(null)}
        onPilihSlot={handlePilihSlot}
      />
    </div>
  )
}
