export type FacilityStatus = "Aktif" | "Perawatan"

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

// Preview statis beranda; data dan jadwal terkini ditampilkan di /facilities.
export const facilities: Facility[] = [
  {
    slug: "aula-gedung-a",
    image: "/images/facilities/16859956.jpg",
    imageAlt: "Ilustrasi aula dengan deretan kursi untuk seminar",
    name: "Aula Gedung A",
    category: "Aula",
    building: "Gedung A · Lantai 2",
    capacity: 300,
    status: "Aktif",
    description:
      "Aula untuk seminar, wisuda, dan kegiatan organisasi mahasiswa.",
  },
  {
    slug: "lab-komputer-3",
    image: "/images/facilities/18471480.jpg",
    imageAlt: "Ilustrasi laboratorium dengan deretan komputer",
    name: "Lab Komputer 3",
    category: "Laboratorium",
    building: "Gedung Informatika · Lantai 3",
    capacity: 40,
    status: "Aktif",
    description:
      "Laboratorium komputer untuk praktikum dan pelatihan perangkat lunak.",
  },
  {
    slug: "ruang-seminar-2",
    image: "/images/facilities/6602623.jpg",
    imageAlt: "Ilustrasi ruang kelas dengan meja dan kursi",
    name: "Ruang Seminar 2",
    category: "Ruang Kelas",
    building: "Gedung Kuliah Bersama · Lantai 1",
    capacity: 60,
    status: "Aktif",
    description: "Ruang presentasi untuk seminar, sidang, dan kuliah tamu.",
  },
  {
    slug: "lapangan-basket-outdoor",
    image: "/images/facilities/2186251.jpg",
    imageAlt: "Ilustrasi lapangan basket di luar ruangan",
    name: "Lapangan Basket Outdoor",
    category: "Olahraga",
    building: "Kawasan Sport Center",
    capacity: 50,
    status: "Aktif",
    description:
      "Lapangan luar ruang untuk latihan dan kegiatan olahraga kampus.",
  },
  {
    slug: "studio-multimedia",
    image: "/images/facilities/7457920.jpg",
    imageAlt: "Ilustrasi ruang kerja komputer multimedia",
    name: "Studio Multimedia",
    category: "Laboratorium",
    building: "Gedung Desain · Lantai 2",
    capacity: 25,
    status: "Perawatan",
    description:
      "Studio untuk produksi audio visual dan kegiatan kreatif mahasiswa.",
  },
  {
    slug: "ruang-rapat-senat",
    image: "/images/facilities/8102300.jpg",
    imageAlt: "Ilustrasi ruang rapat dengan jendela besar",
    name: "Ruang Rapat Senat",
    category: "Rapat",
    building: "Gedung Rektorat · Lantai 4",
    capacity: 20,
    status: "Aktif",
    description: "Ruang rapat untuk dosen, senat, dan tamu fakultas.",
  },
]

export const facilityStats = [
  { value: "12+", label: "Gedung terdaftar" },
  { value: "48", label: "Ruangan & lapangan" },
  { value: "<24 jam", label: "Rata-rata persetujuan" },
  { value: "1.200+", label: "Reservasi per semester" },
] as const
