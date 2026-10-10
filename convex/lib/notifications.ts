import type { Id } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"
import { notificationTypeValidator } from "./validators"

export type NotificationType = typeof notificationTypeValidator.type

type NotificationEvent = {
  userId: Id<"profiles">
  type: NotificationType
  title: string
  body: string
  dedupKey: string
  reservationId?: Id<"reservations">
  facilityId?: Id<"facilities">
  issueId?: Id<"facilityIssues">
  changeId?: Id<"reservationChanges">
  closureId?: Id<"emergencyClosures">
}

/**
 * Creates one in-app notification. Idempotent per dedupKey so scheduled jobs
 * and retried mutations never duplicate a delivery. Callers own the copy;
 * a sent notification never implies the user read or agreed to anything.
 */
export async function notify(
  ctx: MutationCtx,
  event: NotificationEvent
): Promise<Id<"notifications"> | null> {
  const existing = await ctx.db
    .query("notifications")
    .withIndex("by_dedup_key", (q) => q.eq("dedupKey", event.dedupKey))
    .first()
  if (existing) return null

  return ctx.db.insert("notifications", {
    userId: event.userId,
    type: event.type,
    title: event.title,
    body: event.body,
    reservationId: event.reservationId,
    facilityId: event.facilityId,
    issueId: event.issueId,
    changeId: event.changeId,
    closureId: event.closureId,
    dedupKey: event.dedupKey,
    createdAt: Date.now(),
  })
}
