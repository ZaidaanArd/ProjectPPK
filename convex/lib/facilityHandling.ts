import type { Doc } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import { reportHandlingState } from "./reportHandling"

/** A report-owned closure has no timer and never overwrites admin status. */
export async function facilityHandling(
  ctx: QueryCtx | MutationCtx,
  facility: Doc<"facilities">
) {
  const reports = await ctx.db
    .query("reports")
    .withIndex("by_facility_and_status", (q) =>
      q.eq("facilityId", facility._id).eq("status", "in_progress")
    )
    .collect()
  return reportHandlingState(facility.status, reports)
}
