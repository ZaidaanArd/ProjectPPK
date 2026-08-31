import type { Facility } from "@workspace/contracts"

export const facilities: Facility[] = [
  {
    id: "019908f4-72b1-7000-8000-000000000001",
    name: "Ruang Kolaborasi Arunika",
    type: "Ruang kelas",
    location: "Gedung A · Lantai 2",
    capacity: 36,
    description: "Layar interaktif, meja modular, dan pencahayaan alami.",
    status: "active",
  },
  {
    id: "019908f4-72b1-7000-8000-000000000002",
    name: "Laboratorium Cakrawala",
    type: "Laboratorium",
    location: "Gedung Teknik · Lantai 3",
    capacity: 24,
    description: "Perangkat komputasi untuk praktikum dan riset mahasiswa.",
    status: "active",
  },
  {
    id: "019908f4-72b1-7000-8000-000000000003",
    name: "Aula Nawasena",
    type: "Aula",
    location: "Gedung Rektorat · Lantai 1",
    capacity: 180,
    description: "Aula serbaguna untuk seminar dan kegiatan organisasi.",
    status: "maintenance",
  },
]
