import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { requireActiveProfile } from "./lib/authz"
import { notificationTypeValidator } from "./lib/validators"

const MAX_LIST = 50

const notificationListItemValidator = v.object({
  id: v.id("notifications"),
  type: notificationTypeValidator,
  title: v.string(),
  body: v.string(),
  reservationId: v.optional(v.id("reservations")),
  facilityId: v.optional(v.id("facilities")),
  issueId: v.optional(v.id("facilityIssues")),
  changeId: v.optional(v.id("reservationChanges")),
  closureId: v.optional(v.id("emergencyClosures")),
  readAt: v.optional(v.number()),
  createdAt: v.number(),
})

/** Latest notifications of the signed-in account only. */
export const listMine = query({
  args: {},
  returns: v.array(notificationListItemValidator),
  handler: async (ctx) => {
    const profile = await requireActiveProfile(ctx)
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", profile._id))
      .order("desc")
      .take(MAX_LIST)
    return rows.map((row) => ({
      id: row._id,
      type: row.type,
      title: row.title,
      body: row.body,
      reservationId: row.reservationId,
      facilityId: row.facilityId,
      issueId: row.issueId,
      changeId: row.changeId,
      closureId: row.closureId,
      readAt: row.readAt,
      createdAt: row.createdAt,
    }))
  },
})

export const unreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const profile = await requireActiveProfile(ctx)
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", profile._id))
      .collect()
    return rows.filter((row) => row.readAt === undefined).length
  },
})

/** Only the owner may mark their own notification read. */
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await requireActiveProfile(ctx)
    const row = await ctx.db.get("notifications", args.notificationId)
    if (!row || row.userId !== profile._id) {
      throw new ConvexError("Notifikasi tidak ditemukan")
    }
    if (row.readAt === undefined) {
      await ctx.db.patch(row._id, { readAt: Date.now() })
    }
    return null
  },
})

/** Marks every unread notification of the signed-in account as read. */
export const markAllRead = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const profile = await requireActiveProfile(ctx)
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", profile._id))
      .collect()
    const now = Date.now()
    for (const row of rows) {
      if (row.readAt === undefined) {
        await ctx.db.patch(row._id, { readAt: now })
      }
    }
    return null
  },
})
