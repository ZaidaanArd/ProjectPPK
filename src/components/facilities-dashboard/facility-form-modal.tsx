"use client"

import * as React from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  LOKASI_FASILITAS,
  TIPE_FASILITAS,
} from "@/lib/facilities-dashboard/constants"
import type {
  FacilityFormValues,
  FacilityItem,
  FacilityType,
} from "@/lib/facilities-dashboard/types"

const DEFAULT_VALUES: FacilityFormValues = {
  nama: "",
  tipe: "Ruang Kelas",
  lokasi: "Gedung A",
  kapasitas: 30,
  deskripsi: "",
  fotoUrl: "",
}

function toFormValues(editing: FacilityItem | null): FacilityFormValues {
  if (!editing) return DEFAULT_VALUES
  return {
    nama: editing.nama,
    tipe: editing.tipe,
    lokasi: editing.lokasi,
    kapasitas: editing.kapasitas,
    deskripsi: editing.deskripsi,
    fotoUrl: editing.fotoUrl,
  }
}

// Inner form di-mount ulang setiap modal dibuka (Dialog me-return null saat
// closed), jadi useState(initial) cukup — tanpa useEffect sinkronisasi.
function FacilityFormFields({
  editing,
  onClose,
  onSubmit,
}: {
  editing: FacilityItem | null
  onClose: () => void
  onSubmit: (values: FacilityFormValues) => void
}) {
  const [values, setValues] = React.useState<FacilityFormValues>(() =>
    toFormValues(editing)
  )
  const [error, setError] = React.useState("")

  function set<K extends keyof FacilityFormValues>(
    key: K,
    v: FacilityFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.nama.trim()) return setError("Nama fasilitas wajib diisi.")
    if (!values.lokasi.trim()) return setError("Lokasi wajib diisi.")
    if (!Number.isFinite(values.kapasitas) || values.kapasitas < 1)
      return setError("Kapasitas harus bilangan bulat minimal 1.")
    setError("")
    onSubmit({ ...values, nama: values.nama.trim() })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="f-nama">Nama Fasilitas</Label>
        <Input
          id="f-nama"
          value={values.nama}
          onChange={(e) => set("nama", e.target.value)}
          placeholder="mis. Aula Gedung B"
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label id="f-tipe-label">Tipe</Label>
        <Select
          value={values.tipe}
          onValueChange={(v) =>
            set("tipe", (v ?? "Ruang Kelas") as FacilityType)
          }
        >
          <SelectTrigger aria-labelledby="f-tipe-label" className="w-full">
            <SelectValue placeholder="Pilih tipe" />
          </SelectTrigger>
          <SelectContent>
            {TIPE_FASILITAS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label id="f-lokasi-label">Lokasi</Label>
        <Select
          value={values.lokasi}
          onValueChange={(v) => set("lokasi", v ?? "Gedung A")}
        >
          <SelectTrigger aria-labelledby="f-lokasi-label" className="w-full">
            <SelectValue placeholder="Pilih lokasi" />
          </SelectTrigger>
          <SelectContent>
            {LOKASI_FASILITAS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="f-kapasitas">Kapasitas (orang)</Label>
        <Input
          id="f-kapasitas"
          type="number"
          min={1}
          step={1}
          value={values.kapasitas}
          onChange={(e) => set("kapasitas", Number(e.target.value))}
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="f-foto">URL Foto (opsional)</Label>
        <Input
          id="f-foto"
          type="url"
          inputMode="url"
          value={values.fotoUrl}
          onChange={(e) => set("fotoUrl", e.target.value)}
          placeholder="https://… atau kosongkan untuk placeholder"
        />
      </div>

      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="f-deskripsi">Deskripsi</Label>
        <Textarea
          id="f-deskripsi"
          value={values.deskripsi}
          onChange={(e) => set("deskripsi", e.target.value)}
          placeholder="Fasilitas, aturan pakai, perlengkapan…"
          rows={3}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm font-medium text-destructive sm:col-span-2"
        >
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit">
          {editing ? "Simpan Perubahan" : "Tambah Fasilitas"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function FacilityFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean
  /** null = mode tambah, FacilityItem = mode edit */
  editing: FacilityItem | null
  onClose: () => void
  onSubmit: (values: FacilityFormValues) => void
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      labelledBy="facility-form-title"
    >
      <DialogHeader>
        <div>
          <DialogTitle id="facility-form-title">
            {editing ? `Edit — ${editing.nama}` : "Tambah Fasilitas"}
          </DialogTitle>
          <DialogDescription>
            Khusus Admin. Data tersimpan lokal (demo) dan siap disambung ke{" "}
            <code>POST/PATCH /api/admin/facilities</code>.
          </DialogDescription>
        </div>
        <DialogCloseButton onClose={onClose} />
      </DialogHeader>

      <FacilityFormFields
        key={editing ? editing.id : "baru"}
        editing={editing}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Dialog>
  )
}
