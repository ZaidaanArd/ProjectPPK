import type { Doc } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import { reportHandlingState } from "./reportHandling"

/** A report-owned closure has no timer and never overwrites admin status. */
export async function activeClosure(
  ctx: QueryCtx | MutationCtx,
  facilityId: Doc<"facilities">["_id"]
) {
  return ctx.db
    .query("emergencyClosures")
    .withIndex("by_facility_status", (q) =>
      q.eq("facilityId", facilityId).eq("status", "closed")
    )
    .first()
}

export async function openIssues(
  ctx: QueryCtx | MutationCtx,
  facilityId: Doc<"facilities">["_id"]
) {
  return ctx.db
    .query("facilityIssues")
    .withIndex("by_facility_status", (q) =>
      q.eq("facilityId", facilityId).eq("status", "open")
    )
    .collect()
}

/** Emergency closure blocks; light issues are notice-only and never lock. */
export async function facilityHandling(
  ctx: QueryCtx | MutationCtx,
  facility: Doc<"facilities">
) {
  const closure = await activeClosure(ctx, facility._id)
  if (closure) {
    return {
      status: "maintenance" as const,
      handlingNotice:
        "Fasilitas ditutup darurat sampai petugas membuka kembali dan memastikan aman digunakan.",
      closureId: closure._id,
    }
  }
  const reports = await ctx.db
    .query("reports")
    .withIndex("by_facility_and_status", (q) =>
      q.eq("facilityId", facility._id).eq("status", "in_progress")
    )
    .collect()
  const base = reportHandlingState(facility.status, reports)
  if (base.status !== "active") return base
  const issues = await openIssues(ctx, facility._id)
  if (issues.length === 0) return base
  const first = issues[0]
  const more = issues.length > 1 ? ` (+${issues.length - 1} lainnya)` : ""
  const endText = first.endAt
    ? undefined
    : " sampai pemberitahuan lebih lanjut"
  return {
    status: base.status,
    handlingNotice:
      base.handlingNotice ??
      `Ada gangguan: ${first.category}${more}. Fasilitas masih dapat digunakan.${endText ?? ""}`,
  }
}
