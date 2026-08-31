import { eq } from "drizzle-orm"

import { loadEnv } from "../../config/env.js"
import { createDatabase } from "./database.js"
import { facilities, users } from "./schema.js"

const env = loadEnv()
const { client, db } = createDatabase(env.DATABASE_URL)

const seedUsers = [
  {
    name: "Admin Kampus",
    email: "admin@kampus.test",
    passwordHash: "scaffold-only-replace-before-auth",
    role: "admin" as const,
    status: "active" as const,
  },
  {
    name: "Petugas Fasilitas",
    email: "petugas@kampus.test",
    passwordHash: "scaffold-only-replace-before-auth",
    role: "officer" as const,
    status: "active" as const,
  },
]

const seedFacilities = [
  {
    name: "Ruang Kolaborasi Arunika",
    type: "Ruang kelas",
    location: "Gedung A · Lantai 2",
    capacity: 36,
    description: "Ruang diskusi dengan layar interaktif dan meja modular.",
  },
  {
    name: "Laboratorium Cakrawala",
    type: "Laboratorium",
    location: "Gedung Teknik · Lantai 3",
    capacity: 24,
    description: "Laboratorium komputer untuk praktikum dan riset mahasiswa.",
  },
  {
    name: "Aula Nawasena",
    type: "Aula",
    location: "Gedung Rektorat · Lantai 1",
    capacity: 180,
    description: "Aula serbaguna untuk seminar dan kegiatan organisasi.",
  },
]

async function seed() {
  for (const user of seedUsers) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, user.email),
    })
    if (!existing) await db.insert(users).values(user)
  }

  for (const facility of seedFacilities) {
    const existing = await db.query.facilities.findFirst({
      where: eq(facilities.name, facility.name),
    })
    if (!existing) await db.insert(facilities).values(facility)
  }
}

seed()
  .then(() => console.info("Database seed selesai."))
  .finally(() => client.end())
