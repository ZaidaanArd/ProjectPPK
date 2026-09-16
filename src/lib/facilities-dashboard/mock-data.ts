import type { FacilityItem } from "./types"

// Mock data agar tampilan langsung interaktif tanpa backend.
// Foto memakai file yang sudah ada di public/images/facilities.
// bookedSlots TIDAK menyimpan identitas pemesan (privasi pengunjung, US-01).

export const mockFacilities: FacilityItem[] = [
  {
    id: "aula-gedung-a",
    nama: "Aula Gedung A",
    tipe: "Aula",
    lokasi: "Gedung A",
    kapasitas: 300,
    deskripsi:
      "Cocok untuk seminar, wisuda jurusan, dan acara ormawa. Termasuk sound system dan proyektor.",
    fotoUrl: "/images/facilities/16859956.jpg",
    status: "Aktif",
  },
  {
    id: "lab-komputer-3",
    nama: "Lab Komputer 3",
    tipe: "Lab",
    lokasi: "Gedung Informatika",
    kapasitas: 40,
    deskripsi:
      "40 unit PC dengan software praktikum standar. Peminjaman per slot 30 menit.",
    fotoUrl: "/images/facilities/18471480.jpg",
    status: "Aktif",
  },
  {
    id: "ruang-kelas-b201",
    nama: "Ruang Kelas B201",
    tipe: "Ruang Kelas",
    lokasi: "Gedung B",
    kapasitas: 60,
    deskripsi:
      "Ruang kuliah reguler dengan AC, papan tulis, dan proyektor HDMI.",
    fotoUrl: "/images/facilities/6602623.jpg",
    status: "Aktif",
  },
  {
    id: "lapangan-basket-outdoor",
    nama: "Lapangan Basket Outdoor",
    tipe: "Lapangan",
    lokasi: "Sport Center",
    kapasitas: 50,
    deskripsi: "Untuk latihan rutin UKM dan kegiatan olahraga kampus.",
    fotoUrl: "/images/facilities/2186251.jpg",
    status: "Aktif",
  },
  {
    id: "studio-multimedia",
    nama: "Studio Multimedia",
    tipe: "Lab",
    lokasi: "Gedung Desain",
    kapasitas: 25,
    deskripsi:
      "Sedang perawatan AC dan akustik ruangan. Estimasi buka kembali minggu depan.",
    fotoUrl: "/images/facilities/7457920.jpg",
    status: "Dalam Perbaikan",
  },
  {
    id: "ruang-rapat-senat",
    nama: "Ruang Rapat Senat",
    tipe: "Ruang Kelas",
    lokasi: "Gedung Rektorat",
    kapasitas: 20,
    deskripsi:
      "Untuk rapat dosen, senat, dan tamu fakultas. Perlu persetujuan petugas.",
    fotoUrl: "/images/facilities/8102300.jpg",
    status: "Aktif",
  },
  {
    id: "proyektor-epson-12",
    nama: "Proyektor Epson #12",
    tipe: "Alat",
    lokasi: "Gedung B",
    kapasitas: 1,
    deskripsi:
      "Proyektor portable 4000 lumen + kabel HDMI dan pointer. Ambil di loket petugas.",
    fotoUrl: "",
    status: "Aktif",
  },
  {
    id: "aula-lama-lt1",
    nama: "Aula Lama Lt. 1",
    tipe: "Aula",
    lokasi: "Gedung A",
    kapasitas: 120,
    deskripsi:
      "Dinonaktifkan sementara menunggu renovasi plafon. Tidak menerima reservasi baru.",
    fotoUrl: "",
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
