import {
  formatWib,
  formatWibRange,
  type TimeRange,
} from "../../convex/lib/maintenance"

export type { TimeRange }

export function isOngoing(range: TimeRange, now = Date.now()) {
  return range.startAt <= now && now < range.endAt
}

/** "12/10 10.00–14.00" (WIB), the format the server uses in its messages. */
export const formatMaintenance = formatWibRange

/** Short status line for a facility's next repair, or null if none. */
export function maintenanceSummary(range: TimeRange | null | undefined) {
  if (!range) return null
  return isOngoing(range)
    ? `Dalam perbaikan s.d. ${formatWib(range.endAt)}`
    : `Perbaikan terjadwal ${formatWibRange(range)}`
}
