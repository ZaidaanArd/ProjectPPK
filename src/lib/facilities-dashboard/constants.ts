import type { FacilityStatus, TimeSlot } from "./types"

// Aturan bisnis wajib: operasional 07.00–20.00 WIB, slot tetap 30 menit.
export const JAM_OPERASIONAL_AWAL = 7
export const JAM_OPERASIONAL_AKHIR = 20
export const DURASI_SLOT_MENIT = 30
/** (20 - 7) jam * 2 slot per jam = 26 slot per hari */
export const TOTAL_SLOT_PER_HARI = 26

export const TIPE_FASILITAS = [
  "Ruang Kelas",
  "Aula",
  "Lab",
  "Alat",
  "Lapangan",
] as const

export const STATUS_FASILITAS = [
  "Aktif",
  "Dalam Perbaikan",
  "Nonaktif",
] as const

export const LOKASI_FASILITAS = [
  "Gedung A",
  "Gedung B",
  "Gedung Informatika",
  "Sport Center",
  "Gedung Desain",
  "Gedung Rektorat",
] as const

export const KAPASITAS_OPTIONS = [
  { value: "semua", label: "Semua kapasitas" },
  { value: "kecil", label: "< 30 orang" },
  { value: "sedang", label: "30 – 100 orang" },
  { value: "besar", label: "> 100 orang" },
] as const

export type KapasitasFilter = (typeof KAPASITAS_OPTIONS)[number]["value"]

export function matchKapasitas(kapasitas: number, filter: KapasitasFilter) {
  if (filter === "semua") return true
  if (filter === "kecil") return kapasitas < 30
  if (filter === "sedang") return kapasitas >= 30 && kapasitas <= 100
  return kapasitas > 100
}

// --- Helper tanggal untuk picker di modal slot ---
export function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function parseIsoDate(s: string): Date {
  const [y, m, day] = s.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, day ?? 1)
}

export function formatTanggalIndo(iso: string): string {
  const d = parseIsoDate(iso)
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatTanggalPendek(iso: string): string {
  const d = parseIsoDate(iso)
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })
}

export function getTanggalOptions(jumlah: number = 14): string[] {
  const out: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < jumlah; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    out.push(toIsoDate(d))
  }
  return out
}

export function isWeekendIso(iso: string): boolean {
  const day = parseIsoDate(iso).getDay()
  return day === 0 || day === 6
}

function pad(n: number) {
  return n.toString().padStart(2, "0")
}

function menitKeLabel(menit: number) {
  return `${pad(Math.floor(menit / 60))}.${pad(menit % 60)}`
}

function menitKeId(menit: number) {
  return `${pad(Math.floor(menit / 60))}:${pad(menit % 60)}`
}

/**
 * Generate 26 slot tetap 07.00–20.00.
 * - maintenance  -> semua "terkunci" (orange stripe)
 * - nonaktif     -> semua "nonaktif" (disabled abu)
 * - bookedIds    -> "terisi" (tanpa identitas pemesan, sesuai US-01)
 * - selain itu   -> "tersedia"
 */
export function generateTimeSlots(
  statusFasilitas: FacilityStatus,
  bookedIds: string[] | Set<string> = []
): TimeSlot[] {
  const booked = bookedIds instanceof Set ? bookedIds : new Set(bookedIds)
  const slots: TimeSlot[] = []
  const awal = JAM_OPERASIONAL_AWAL * 60
  const akhir = JAM_OPERASIONAL_AKHIR * 60

  for (let m = awal; m < akhir; m += DURASI_SLOT_MENIT) {
    const mulaiId = menitKeId(m)
    const selesaiId = menitKeId(m + DURASI_SLOT_MENIT)
    const id = `${mulaiId}-${selesaiId}`
    let status: TimeSlot["status"] = "tersedia"
    if (statusFasilitas === "Dalam Perbaikan") status = "terkunci"
    else if (statusFasilitas === "Nonaktif") status = "nonaktif"
    else if (booked.has(id)) status = "terisi"

    slots.push({
      id,
      mulai: menitKeLabel(m),
      selesai: menitKeLabel(m + DURASI_SLOT_MENIT),
      status,
    })
  }
  return slots
}
