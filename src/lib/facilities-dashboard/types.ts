// Kontrak domain khusus Dashboard Fasilitas (demo interaktif).
// Selaras dengan docs/DATA-AND-API.md: backend memakai
// `active | maintenance | inactive`, UI memakai label Indonesia.

export type DemoRole = "admin" | "petugas" | "pengguna"

export type FacilityStatus = "Aktif" | "Dalam Perbaikan" | "Nonaktif"

export type BackendFacilityStatus = "active" | "maintenance" | "inactive"

export type FacilityType = "Ruang Kelas" | "Aula" | "Lab" | "Alat" | "Lapangan"

export type FacilityItem = {
  id: string
  nama: string
  tipe: FacilityType
  lokasi: string
  kapasitas: number
  deskripsi: string
  fotoUrl: string
  status: FacilityStatus
}

export type SlotStatus = "tersedia" | "terisi" | "terkunci" | "nonaktif"

export type TimeSlot = {
  /** Key stabil, mis. "07:00-07:30" */
  id: string
  mulai: string
  selesai: string
  status: SlotStatus
}

export type FacilityFormValues = {
  nama: string
  tipe: FacilityType
  lokasi: string
  kapasitas: number
  deskripsi: string
  fotoUrl: string
}

export function toBackendStatus(status: FacilityStatus): BackendFacilityStatus {
  if (status === "Dalam Perbaikan") return "maintenance"
  if (status === "Nonaktif") return "inactive"
  return "active"
}

export function fromBackendStatus(
  status: BackendFacilityStatus
): FacilityStatus {
  if (status === "maintenance") return "Dalam Perbaikan"
  if (status === "inactive") return "Nonaktif"
  return "Aktif"
}
