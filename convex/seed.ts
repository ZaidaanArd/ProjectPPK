import { ConvexError, v } from "convex/values"

import { env, mutation } from "./_generated/server"

const demoFacilities = [
  {
    name: "Aula Gedung A",
    type: "Aula",
    location: "Gedung A · Lantai 2",
    capacity: 300,
    description:
      "Aula untuk seminar, wisuda, dan kegiatan organisasi mahasiswa.",
  },
  {
    name: "Lab Komputer 3",
    type: "Laboratorium",
    location: "Gedung Informatika · Lantai 3",
    capacity: 40,
    description:
      "Laboratorium komputer untuk praktikum dan pelatihan perangkat lunak.",
  },
  {
    name: "Ruang Seminar 2",
    type: "Ruang Kelas",
    location: "Gedung Kuliah Bersama · Lantai 1",
    capacity: 60,
    description: "Ruang presentasi untuk seminar, sidang, dan kuliah tamu.",
  },
  {
    name: "Lapangan Basket Outdoor",
    type: "Olahraga",
    location: "Kawasan Sport Center",
    capacity: 50,
    description:
      "Lapangan luar ruang untuk latihan dan kegiatan olahraga kampus.",
  },
  {
    name: "Studio Multimedia",
    type: "Laboratorium",
    location: "Gedung Desain · Lantai 2",
    capacity: 25,
    description:
      "Studio untuk produksi audio visual dan kegiatan kreatif mahasiswa.",
  },
  {
    name: "Ruang Rapat Senat",
    type: "Rapat",
    location: "Gedung Rektorat · Lantai 4",
    capacity: 20,
    description: "Ruang rapat untuk dosen, senat, dan tamu fakultas.",
  },
] as const

export const demo = mutation({
  args: { secret: v.string() },
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx, args) => {
    if (args.secret !== env.BOOTSTRAP_SECRET) {
      throw new ConvexError("Bootstrap secret tidak valid")
    }

    const admin = await ctx.db
      .query("profiles")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first()
    if (!admin) {
      throw new ConvexError("Bootstrap admin sebelum menjalankan seed")
    }

    const existingNames = new Set(
      (await ctx.db.query("facilities").collect()).map(
        (facility) => facility.name
      )
    )
    const now = Date.now()
    const facilitiesToInsert = demoFacilities.filter(
      (facility) => !existingNames.has(facility.name)
    )
    await Promise.all(
      facilitiesToInsert.map((facility) =>
        ctx.db.insert("facilities", {
          ...facility,
          status:
            facility.name === "Studio Multimedia" ? "maintenance" : "active",
          createdBy: admin._id,
          createdAt: now,
          updatedAt: now,
        })
      )
    )
    const inserted = facilitiesToInsert.length

    return { inserted, skipped: demoFacilities.length - inserted }
  },
})
