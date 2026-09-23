import type { FacilityItem } from "./types"

// Mock data agar tampilan langsung interaktif tanpa backend.
// Foto memakai file yang sudah ada di public/images/facilities.
// bookedSlots TIDAK menyimpan identitas pemesan (privasi pengunjung, US-01).

// Kumpulan foto yang tersedia di public — dipakai sebagai skeleton galeri
const FOTO_POOL = [
  "/images/facilities/16859956.jpg",
  "/images/facilities/18471480.jpg",
  "/images/facilities/6602623.jpg",
  "/images/facilities/2186251.jpg",
  "/images/facilities/7457920.jpg",
  "/images/facilities/8102300.jpg",
] as const

export const mockFacilities: FacilityItem[] = [
  {
    id: "aula-gedung-a",
    nama: "Aula Gedung A",
    tipe: "Aula",
    lokasi: "Gedung A",
    kapasitas: 300,
    deskripsi:
      "Cocok untuk seminar, wisuda jurusan, dan acara ormawa. Termasuk sound system, proyektor 5000 lumen, podium, dan AC central. Kapasitas 300 kursi dengan layout theater. Cocok untuk wisuda, seminar nasional, dan expo kampus.",
    fotoUrl: "/images/facilities/16859956.jpg",
    photos: [
      { id: "aula-gedung-a-1", url: "/images/facilities/16859956.jpg", sortOrder: 0, alt: "Aula Gedung A — tampak depan" },
      { id: "aula-gedung-a-2", url: "/images/facilities/6602623.jpg", sortOrder: 1, alt: "Aula Gedung A — layout kursi" },
      { id: "aula-gedung-a-3", url: "/images/facilities/8102300.jpg", sortOrder: 2, alt: "Aula Gedung A — panggung & podium" },
    ],
    status: "Aktif",
  },
  {
    id: "lab-komputer-3",
    nama: "Lab Komputer 3",
    tipe: "Lab",
    lokasi: "Gedung Informatika",
    kapasitas: 40,
    deskripsi:
      "40 unit PC dengan software praktikum standar (VS Code, Docker, Figma). Peminjaman per slot 30 menit, termasuk jaringan LAN gigabit dan proyektor. Ideal untuk praktikum, workshop, dan ujian lab.",
    fotoUrl: "/images/facilities/18471480.jpg",
    photos: [
      { id: "lab-komputer-3-1", url: "/images/facilities/18471480.jpg", sortOrder: 0, alt: "Lab Komputer 3 — deretan PC" },
      { id: "lab-komputer-3-2", url: "/images/facilities/7457920.jpg", sortOrder: 1, alt: "Lab Komputer 3 — meja kerja" },
      { id: "lab-komputer-3-3", url: "/images/facilities/6602623.jpg", sortOrder: 2, alt: "Lab Komputer 3 — sudut ruangan" },
    ],
    status: "Aktif",
  },
  {
    id: "ruang-kelas-b201",
    nama: "Ruang Kelas B201",
    tipe: "Ruang Kelas",
    lokasi: "Gedung B",
    kapasitas: 60,
    deskripsi:
      "Ruang kuliah reguler dengan AC, papan tulis, proyektor HDMI, dan 60 kursi. Pencahayaan natural, akses lift, dan dekat kantin. Cocok untuk kuliah, presentasi TA, dan rapat kecil.",
    fotoUrl: "/images/facilities/6602623.jpg",
    photos: [
      { id: "ruang-kelas-b201-1", url: "/images/facilities/6602623.jpg", sortOrder: 0, alt: "Ruang Kelas B201 — tampak dalam" },
      { id: "ruang-kelas-b201-2", url: "/images/facilities/8102300.jpg", sortOrder: 1, alt: "Ruang Kelas B201 — papan tulis" },
      { id: "ruang-kelas-b201-3", url: "/images/facilities/16859956.jpg", sortOrder: 2, alt: "Ruang Kelas B201 — baris kursi" },
    ],
    status: "Aktif",
  },
  {
    id: "lapangan-basket-outdoor",
    nama: "Lapangan Basket Outdoor",
    tipe: "Lapangan",
    lokasi: "Sport Center",
    kapasitas: 50,
    deskripsi:
      "Lapangan basket outdoor standar dengan lantai semen halus, ring portable, dan lampu sorot untuk kegiatan sore. Untuk latihan rutin UKM dan kegiatan olahraga kampus. Tersedia jam pagi & sore.",
    fotoUrl: "/images/facilities/2186251.jpg",
    photos: [
      { id: "lapangan-basket-outdoor-1", url: "/images/facilities/2186251.jpg", sortOrder: 0, alt: "Lapangan Basket — tampak lapangan" },
      { id: "lapangan-basket-outdoor-2", url: "/images/facilities/16859956.jpg", sortOrder: 1, alt: "Lapangan Basket — tribun" },
      { id: "lapangan-basket-outdoor-3", url: "/images/facilities/18471480.jpg", sortOrder: 2, alt: "Lapangan Basket — detail ring" },
    ],
    status: "Aktif",
  },
  {
    id: "studio-multimedia",
    nama: "Studio Multimedia",
    tipe: "Lab",
    lokasi: "Gedung Desain",
    kapasitas: 25,
    deskripsi:
      "Studio multimedia dengan 25 workstation, tablet gambar, dan peredam suara. Sedang perawatan AC dan akustik ruangan. Estimasi buka kembali minggu depan. Cocok untuk editing, animasi, dan recording.",
    fotoUrl: "/images/facilities/7457920.jpg",
    photos: [
      { id: "studio-multimedia-1", url: "/images/facilities/7457920.jpg", sortOrder: 0, alt: "Studio Multimedia — workstation" },
      { id: "studio-multimedia-2", url: "/images/facilities/18471480.jpg", sortOrder: 1, alt: "Studio Multimedia — ruang editing" },
    ],
    status: "Dalam Perbaikan",
  },
  {
    id: "ruang-rapat-senat",
    nama: "Ruang Rapat Senat",
    tipe: "Ruang Kelas",
    lokasi: "Gedung Rektorat",
    kapasitas: 20,
    deskripsi:
      "Ruang rapat eksklusif dengan meja konferensi 20 kursi, proyektor, dan jendela besar. Untuk rapat dosen, senat, dan tamu fakultas. Perlu persetujuan petugas. Termasuk pantry kecil & akses VIP.",
    fotoUrl: "/images/facilities/8102300.jpg",
    photos: [
      { id: "ruang-rapat-senat-1", url: "/images/facilities/8102300.jpg", sortOrder: 0, alt: "Ruang Rapat Senat — meja konferensi" },
      { id: "ruang-rapat-senat-2", url: "/images/facilities/6602623.jpg", sortOrder: 1, alt: "Ruang Rapat Senat — sudut ruangan" },
      { id: "ruang-rapat-senat-3", url: "/images/facilities/7457920.jpg", sortOrder: 2, alt: "Ruang Rapat Senat — detail kursi" },
    ],
    status: "Aktif",
  },
  {
    id: "proyektor-epson-12",
    nama: "Proyektor Epson #12",
    tipe: "Alat",
    lokasi: "Gedung B",
    kapasitas: 1,
    deskripsi:
      "Proyektor portable 4000 lumen + kabel HDMI dan pointer. Cocok untuk kelas dan aula yang belum ada proyektor tetap. Ambil di loket petugas Gedung B. Wajib cek kondisi sebelum pinjam.",
    fotoUrl: "",
    photos: [],
    status: "Aktif",
  },
  {
    id: "aula-lama-lt1",
    nama: "Aula Lama Lt. 1",
    tipe: "Aula",
    lokasi: "Gedung A",
    kapasitas: 120,
    deskripsi:
      "Dinonaktifkan sementara menunggu renovasi plafon. Tidak menerima reservasi baru hingga perbaikan selesai. Untuk keperluan mendesak hubungi petugas.",
    fotoUrl: "",
    photos: [],
    status: "Nonaktif",
  },
]

/** Slot yang sudah terisi / diproses per fasilitas (format id "HH:MM-HH:MM"). */
export const mockBookedSlots: Record<string, string[]> = {
  "aula-gedung-a": ["08:00-08:30", "08:30-09:00", "13:00-13:30", "19:00-19:30"],
  "lab-komputer-3": ["09:00-09:30", "09:30-10:00", "10:00-10:30"],
  "ruang-kelas-b201": ["07:00-07:30", "10:30-11:00", "15:00-15:30"],
  "lapangan-basket-outdoor": ["16:00-16:30", "16:30-17:00", "17:00-17:30"],
  "ruang-rapat-senat": ["09:00-09:30", "14:00-14:30"],
  "proyektor-epson-12": ["08:00-08:30", "11:00-11:30"],
  "studio-multimedia": [],
  "aula-lama-lt1": [],
}

// --- Helper kerangka DB foto & slot per tanggal (skeleton, siap ganti API) ---
function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

const ALL_SLOT_IDS: string[] = (() => {
  const ids: string[] = []
  for (let m = 7 * 60; m < 20 * 60; m += 30) {
    const pad = (n: number) => String(n).padStart(2, "0")
    const mulai = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
    const selesai = `${pad(Math.floor((m + 30) / 60))}:${pad((m + 30) % 60)}`
    ids.push(`${mulai}-${selesai}`)
  }
  return ids
})()

/**
 * Skeleton: slot terisi yang beda tiap tanggal (deterministik, tanpa backend).
 * Nanti diganti fetch `GET /api/facilities/:id/slots?date=YYYY-MM-DD`.
 */
export function getBookedIdsForDate(facilityId: string, isoDate: string): string[] {
  const base = mockBookedSlots[facilityId] ?? []
  // tanggal ganjil/genap & hash facility → geser pola agar tiap hari terlihat beda tapi stabil
  const h = hashString(`${facilityId}|${isoDate}`)
  const offset = h % ALL_SLOT_IDS.length
  const extraCount = (h % 3) // 0-2 slot tambahan pseudo-random
  const extra: string[] = []
  for (let i = 0; i < extraCount; i++) {
    extra.push(ALL_SLOT_IDS[(offset + i * 7) % ALL_SLOT_IDS.length])
  }
  // gabung base + extra, unik
  return Array.from(new Set([...base, ...extra])).slice(0, 8)
}
