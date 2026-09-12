export type FacilityStatus = "Tersedia" | "Penuh" | "Perawatan"

export type Facility = {
  slug: string
  name: string
  category: "Ruang Kelas" | "Aula" | "Laboratorium" | "Olahraga" | "Rapat"
  building: string
  capacity: number
  status: FacilityStatus
  description: string
  image: string
  imageAlt: string
}

// Data contoh untuk tampilan public.
// Nanti diganti hasil fetch dari database/API — bentuk tipenya usahakan tetap sama.
export const facilities: Facility[] = [
  {
    slug: "aula-gedung-a",
    image: "/images/facilities/16859956.jpg",
    imageAlt: "Ilustrasi aula dengan deretan kursi untuk seminar",
    name: "Aula Gedung A",
    category: "Aula",
    building: "Gedung A · Lt. 2",
    capacity: 300,
    status: "Tersedia",
    description:
      "Cocok untuk seminar, wisuda jurusan, dan acara ormawa. Termasuk sound system dan proyektor.",
  },
  {
    slug: "lab-komputer-3",
    image: "/images/facilities/18471480.jpg",
    imageAlt: "Ilustrasi laboratorium dengan deretan komputer",
    name: "Lab Komputer 3",
    category: "Laboratorium",
    building: "Gedung Informatika · Lt. 3",
    capacity: 40,
    status: "Tersedia",
    description:
      "40 unit PC dengan software praktikum standar. Bisa dipinjam per sesi 2 jam.",
  },
  {
    slug: "ruang-seminar-2",
    image: "/images/facilities/6602623.jpg",
    imageAlt: "Ilustrasi ruang kelas dengan meja dan kursi",
    name: "Ruang Seminar 2",
    category: "Ruang Kelas",
    building: "Gedung Kuliah Bersama · Lt. 1",
    capacity: 60,
    status: "Penuh",
    description:
      "Ruang presentasi tugas akhir dan kuliah tamu. Pekan ini sudah penuh dipesan.",
  },
  {
    slug: "lapangan-basket-outdoor",
    image: "/images/facilities/2186251.jpg",
    imageAlt: "Ilustrasi lapangan basket di luar ruangan",
    name: "Lapangan Basket Outdoor",
    category: "Olahraga",
    building: "Kawasan Sport Center",
    capacity: 50,
    status: "Tersedia",
    description: "Untuk latihan rutin UKM dan kegiatan olahraga kampus.",
  },
  {
    slug: "studio-multimedia",
    image: "/images/facilities/7457920.jpg",
    imageAlt: "Ilustrasi ruang kerja komputer multimedia",
    name: "Studio Multimedia",
    category: "Laboratorium",
    building: "Gedung Desain · Lt. 2",
    capacity: 25,
    status: "Perawatan",
    description:
      "Sedang perawatan AC dan akustik ruangan. Estimasi buka kembali minggu depan.",
  },
  {
    slug: "ruang-rapat-senat",
    image: "/images/facilities/8102300.jpg",
    imageAlt: "Ilustrasi ruang rapat dengan jendela besar",
    name: "Ruang Rapat Senat",
    category: "Rapat",
    building: "Gedung Rektorat · Lt. 4",
    capacity: 20,
    status: "Tersedia",
    description:
      "Untuk rapat dosen, senat, dan tamu fakultas. Perlu persetujuan petugas.",
  },
]

export const facilityStats = [
  { value: "12+", label: "Gedung terdaftar" },
  { value: "48", label: "Ruangan & lapangan" },
  { value: "<24 jam", label: "Rata-rata persetujuan" },
  { value: "1.200+", label: "Reservasi per semester" },
] as const
