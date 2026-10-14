import { convexTest } from "convex-test"
import { describe, expect, it, vi } from "vitest"

import { api } from "./_generated/api"
import schema from "./schema"

vi.mock("./auth", () => ({
  authComponent: {
    safeGetAuthUser: async (ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
    }) => {
      const identity = await ctx.auth.getUserIdentity()
      return identity ? { _id: identity.subject } : null
    },
  },
}))

const modules = (
  import.meta as ImportMeta & {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>
  }
).glob("./**/*.ts")

type TestContext = ReturnType<typeof convexTest>

async function seedFacility(
  t: TestContext,
  related?: {
    reservationStatus?: "pending" | "approved" | "cancelled"
    reportStatus?: "pending" | "in_progress" | "resolved"
  }
) {
  return t.run(async (ctx) => {
    const now = Date.now()
    const adminId = await ctx.db.insert("profiles", {
      authUserId: "facility-admin",
      name: "Admin",
      email: "facility-admin@example.test",
      role: "admin",
      status: "active",
      mustChangePassword: false,
      createdAt: now,
      updatedAt: now,
    })
    const userId = await ctx.db.insert("profiles", {
      authUserId: "facility-user",
      name: "Pengguna",
      email: "facility-user@example.test",
      role: "user",
      status: "active",
      mustChangePassword: false,
      createdAt: now,
      updatedAt: now,
    })
    const facilityId = await ctx.db.insert("facilities", {
      name: "Ruang Uji",
      type: "Ruang",
      location: "Gedung Uji",
      capacity: 10,
      description: "Ruang untuk pengujian",
      status: "active",
      createdBy: adminId,
      createdAt: now,
      updatedAt: now,
    })
    if (related?.reservationStatus) {
      await ctx.db.insert("reservations", {
        userId,
        facilityId,
        purpose: "Praktikum",
        startAt: now + 60 * 60 * 1000,
        endAt: now + 2 * 60 * 60 * 1000,
        status: related.reservationStatus,
        createdAt: now,
        updatedAt: now,
      })
    }
    if (related?.reportStatus) {
      await ctx.db.insert("reports", {
        reporterId: userId,
        facilityId,
        category: "Perangkat",
        description: "Rusak",
        status: related.reportStatus,
        createdAt: now,
        updatedAt: now,
      })
    }
    return { facilityId }
  })
}

describe("facility removal", () => {
  it("removes a facility without active activity and records an audit event", async () => {
    const t = convexTest(schema, modules)
    const { facilityId } = await seedFacility(t)
    const admin = t.withIdentity({ subject: "facility-admin" })

    await admin.mutation(api.facilities.remove, { facilityId })

    expect(
      await t.run((ctx) => ctx.db.get("facilities", facilityId))
    ).toMatchObject({ status: "inactive" })
    expect(await admin.query(api.facilities.listManaged, {})).toHaveLength(1)
    expect(await admin.query(api.facilities.listPublic, {})).toHaveLength(0)
    const audits = await t.run((ctx) =>
      ctx.db
        .query("auditEvents")
        .withIndex("by_entity", (q) =>
          q.eq("entityType", "facility").eq("entityId", facilityId)
        )
        .collect()
    )
    expect(audits.map((event) => event.action)).toContain("facility.archived")
  })

  it("blocks removal while an active reservation exists", async () => {
    const t = convexTest(schema, modules)
    const { facilityId } = await seedFacility(t, {
      reservationStatus: "pending",
    })
    const admin = t.withIdentity({ subject: "facility-admin" })

    await expect(
      admin.mutation(api.facilities.remove, { facilityId })
    ).rejects.toThrow("reservasi aktif")
    expect(
      await t.run((ctx) => ctx.db.get("facilities", facilityId))
    ).not.toBeNull()
  })

  it("blocks removal while a report is still unfinished", async () => {
    const t = convexTest(schema, modules)
    const { facilityId } = await seedFacility(t, {
      reportStatus: "in_progress",
    })
    const admin = t.withIdentity({ subject: "facility-admin" })

    await expect(
      admin.mutation(api.facilities.remove, { facilityId })
    ).rejects.toThrow("laporan yang belum selesai")
  })

  it("allows removal after related records reach a terminal status", async () => {
    const t = convexTest(schema, modules)
    const { facilityId } = await seedFacility(t, {
      reservationStatus: "cancelled",
      reportStatus: "resolved",
    })
    const admin = t.withIdentity({ subject: "facility-admin" })

    await admin.mutation(api.facilities.remove, { facilityId })

    expect(
      await t.run((ctx) => ctx.db.get("facilities", facilityId))
    ).toMatchObject({ status: "inactive" })
  })
})

describe("facility photos", () => {
  const input = {
    name: "Ruang Foto",
    type: "Ruang",
    location: "Gedung Foto",
    capacity: 12,
    description: "Ruang dengan foto",
  }
  // convex-test does not record a file's content type; set it like
  // production storage does.
  const store = (t: TestContext, type: string, bytes = 16) =>
    t.run(async (ctx) => {
      const id = await ctx.storage.store(
        new Blob([new Uint8Array(bytes)], { type })
      )
      await ctx.db.patch(
        "_storage" as never,
        id as never,
        {
          contentType: type,
        } as never
      )
      return id
    })

  it("adds, replaces, and removes a cover photo, deleting unused files", async () => {
    const t = convexTest(schema, modules)
    await seedFacility(t)
    const admin = t.withIdentity({ subject: "facility-admin" })
    const first = await store(t, "image/png")
    const id = await admin.mutation(api.facilities.create, {
      ...input,
      photoStorageId: first,
    })
    const listed = await t.query(api.facilities.listPublic, {})
    expect(listed.find((item) => item.id === id)?.photoUrl).toEqual(
      expect.any(String)
    )
    // Facilities without a photo fall back to an illustration in the UI.
    expect(listed.find((item) => item.name === "Ruang Uji")?.photoUrl).toBe(
      null
    )

    const second = await store(t, "image/webp")
    await admin.mutation(api.facilities.update, {
      facilityId: id,
      ...input,
      photo: second,
    })
    expect(await t.run((ctx) => ctx.storage.getUrl(first))).toBe(null)

    // Omitting `photo` keeps the current one.
    await admin.mutation(api.facilities.update, { facilityId: id, ...input })
    expect(
      (await t.run((ctx) => ctx.db.get("facilities", id)))?.photoStorageId
    ).toBe(second)

    await admin.mutation(api.facilities.update, {
      facilityId: id,
      ...input,
      photo: null,
    })
    expect(
      (await t.run((ctx) => ctx.db.get("facilities", id)))?.photoStorageId
    ).toBeUndefined()
    expect(await t.run((ctx) => ctx.storage.getUrl(second))).toBe(null)
  })

  it("rejects files that are not JPG, PNG, or WebP and only admins upload", async () => {
    const t = convexTest(schema, modules)
    await seedFacility(t)
    const admin = t.withIdentity({ subject: "facility-admin" })
    const gif = await store(t, "image/gif")
    await expect(
      admin.mutation(api.facilities.create, { ...input, photoStorageId: gif })
    ).rejects.toThrow("Format foto harus JPG, PNG, atau WebP")
    await expect(
      t
        .withIdentity({ subject: "facility-user" })
        .mutation(api.facilities.generatePhotoUploadUrl, {})
    ).rejects.toThrow("tidak memiliki izin")
  })
})
