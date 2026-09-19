import type { Id } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"

export async function recordAuditEvent(
  ctx: MutationCtx,
  event: {
    entityType: "account" | "facility" | "reservation" | "report"
    entityId: string
    action: string
    fromStatus?: string
    toStatus?: string
    actorId?: Id<"profiles">
    actorRole: "user" | "officer" | "admin" | "system"
    note?: string
  }
) {
  await ctx.db.insert("auditEvents", {
    ...event,
    createdAt: Date.now(),
  })
}
