import { ConvexError } from "convex/values"

import type { Doc } from "../_generated/dataModel"

type FacilityStatus = Doc<"facilities">["status"]
type ReportStatus = Doc<"reports">["status"]

const reportTransitions: Record<ReportStatus, ReadonlySet<ReportStatus>> = {
  pending: new Set(["in_progress", "rejected"]),
  in_progress: new Set(["resolved", "rejected"]),
  resolved: new Set(),
  rejected: new Set(),
}

export function assertFacilityCanApprove(status: FacilityStatus) {
  if (status !== "active") {
    throw new ConvexError(
      "Reservasi tidak dapat disetujui karena fasilitas sedang tidak aktif"
    )
  }
}

export function assertReportTransition(
  currentStatus: ReportStatus,
  nextStatus: ReportStatus
) {
  if (!reportTransitions[currentStatus].has(nextStatus)) {
    throw new ConvexError(
      `Status laporan tidak dapat diubah dari ${currentStatus} menjadi ${nextStatus}`
    )
  }
}
