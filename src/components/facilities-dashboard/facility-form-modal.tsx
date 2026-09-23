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
  photos: [],
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
    photos:
      editing.photos ??
      (editing.fotoUrl
        ? [
            {
              id: `${editing.id}-cover`,
              url: editing.fotoUrl,
              sortOrder: 0,
              alt: editing.nama,
            },
          ]
        : []),
  }
}

function photosToTextarea(photos?: FacilityFormValues["photos"]): string {
  if (!photos?.length) return ""
  return [...photos]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => p.url)
    .join("\n")
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
  const [fotoTextarea, setFotoTextarea] = React.useState(() =>
    photosToTextarea(toFormValues(editing).photos)
  )
  const [error, setError] = React.useState("")

  function set<K extends keyof FacilityFormValues>(
    key: K,
    v: FacilityFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  const fotoUrlsPreview = React.useMemo(() => {
    return fotoTextarea
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5)
  }, [fotoTextarea])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.nama.trim()) return setError("Nama fasilitas wajib diisi.")
    if (!values.lokasi.trim()) return setError("Lokasi wajib diisi.")
    if (!Number.isFinite(values.kapasitas) || values.kapasitas < 1)
      return setError("Kapasitas harus bilangan bulat minimal 1.")
    const urls = fotoTextarea
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
    if (urls.length > 5)
      return setError("Maksimal 5 foto. Hapus baris berlebih.")
    for (const u of urls) {
      const ok =
        u.startsWith("/") || u.startsWith("http://") || u.startsWith("https://")
      if (!ok)
        return setError(
          `URL foto tidak valid: ${u} — pakai /images/... atau https://...`
        )
    }
    const fid =
      (editing?.id ?? values.nama.toLowerCase().replace(/[^a-z0-9]+/g, "-")) ||
      "fasilitas-baru"
    const photos = urls.map((url, i) => ({
      id: `${fid}-${i + 1}`,
      url,
      alt: `${values.nama.trim() || "Fasilitas"} — foto ${i + 1}`,
      sortOrder: i,
    }))
    const fotoUrl = photos[0]?.url ?? ""
    setError("")
    onSubmit({ ...values, nama: values.nama.trim(), fotoUrl, photos })
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

      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="f-foto">
          Foto galeri — kerangka siap-database (maks 5, satu URL per baris)
        </Label>
        <Textarea
          id="f-foto"
          value={fotoTextarea}
          onChange={(e) => setFotoTextarea(e.target.value)}
          placeholder={
            "/images/facilities/16859956.jpg\nhttps://.../foto-ruangan.jpg\n(kosongkan jika belum ada foto)"
          }
          rows={3}
        />
        <p className="text-[11px] text-muted-foreground">
          Urutan = sort_order; baris pertama = cover (
          <code className="rounded bg-muted px-1">fotoUrl</code> untuk
          kompatibilitas). Nanti ganti jadi{" "}
          <code className="rounded bg-muted px-1">
            &lt;input type=&quot;file&quot; multiple&gt;
          </code>{" "}
          + upload ke storage, DB simpan url.
        </p>
        {fotoUrlsPreview.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {fotoUrlsPreview.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="size-14 rounded-xl border object-cover"
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Belum ada foto — akan tampil placeholder IconPhoto di kartu & modal.
          </p>
        )}
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
            Khusus Admin. Kerangka foto:{" "}
            <code>FACILITY_PHOTOS(facility_id, url, alt, sort_order)</code> —
            API <code>GET /api/facilities</code> include <code>photos[]</code>,{" "}
            <code>POST/PATCH /api/admin/facilities</code> terima{" "}
            <code>photos[]</code> (skeleton URL, nanti multipart).
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
