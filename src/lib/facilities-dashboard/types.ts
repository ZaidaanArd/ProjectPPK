// Kontrak domain khusus Dashboard Fasilitas (demo interaktif).
// Selaras dengan docs/DATA-AND-API.md: backend memakai
// `active | maintenance | inactive`, UI memakai label Indonesia.

export type DemoRole = "admin" | "petugas" | "pengguna"

export type FacilityStatus = "Aktif" | "Dalam Perbaikan" | "Nonaktif"

export type BackendFacilityStatus = "active" | "maintenance" | "inactive"

export type FacilityType = "Ruang Kelas" | "Aula" | "Lab" | "Alat" | "Lapangan"

// Kerangka foto siap-database: cover tetap fotoUrl (kompatibel), galeri di photos.
// Nanti tabel FACILITY_PHOTOS { id, facility_id FK, url, alt, sort_order } — DB cuma simpan url.
export type FacilityPhoto = {
  id: string
  url: string
  alt?: string
  sortOrder: number
}

export type FacilityItem = {
  id: string
  nama: string
  tipe: FacilityType
  lokasi: string
  kapasitas: number
  deskripsi: string
  fotoUrl: string
  /** Galeri foto ruangan — opsional biar mock lama tidak jebol. Maks 5 per fasilitas. */
  photos?: FacilityPhoto[]
  status: FacilityStatus
  /** Waktu dibuat untuk pengurutan "Terbaru" di katalog publik. */
  createdAt?: number
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
  /** Kerangka galeri — form kirim array url; fotoUrl = photos[0] untuk kompatibilitas */
  photos?: FacilityPhoto[]
}

export function getCoverUrl(facility: FacilityItem): string {
  const sorted = facility.photos
    ? [...facility.photos].sort((a, b) => a.sortOrder - b.sortOrder)
    : []
  return sorted[0]?.url ?? facility.fotoUrl ?? ""
}

export function getGalleryPhotos(facility: FacilityItem): FacilityPhoto[] {
  if (facility.photos && facility.photos.length > 0) {
    return [...facility.photos].sort((a, b) => a.sortOrder - b.sortOrder)
  }
  if (facility.fotoUrl) {
    return [
      {
        id: `${facility.id}-cover`,
        url: facility.fotoUrl,
        sortOrder: 0,
        alt: facility.nama,
      },
    ]
  }
  return []
}

export function buildPhotosFromUrls(
  facilityId: string,
  urls: string[],
  baseAlt: string
): FacilityPhoto[] {
  return urls.slice(0, 5).map((url, i) => ({
    id: `${facilityId}-${i + 1}`,
    url: url.trim(),
    alt: `${baseAlt} — foto ${i + 1}`,
    sortOrder: i,
  }))
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
