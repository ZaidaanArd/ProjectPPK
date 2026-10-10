import { ConvexError } from "convex/values"

import { JAKARTA_UTC_OFFSET_MS, SLOT_MS, overlaps } from "./reservationTime"

/** A single maintenance window may not block a facility for longer than this. */
export const MAINTENANCE_MAX_MS = 7 * 24 * 60 * 60 * 1000

export type TimeRange = { startAt: number; endAt: number }

/** "12/10 10.00" in WIB. */
export function formatWib(timestamp: number) {
  const date = new Date(timestamp + JAKARTA_UTC_OFFSET_MS)
  const two = (value: number) => String(value).padStart(2, "0")
  return `${two(date.getUTCDate())}/${two(date.getUTCMonth() + 1)} ${two(date.getUTCHours())}.${two(date.getUTCMinutes())}`
}

export function formatWibRange(range: TimeRange) {
  const start = formatWib(range.startAt)
  const end = formatWib(range.endAt)
  // Same day: "12/10 10.00–12.00".
  return start.slice(0, 5) === end.slice(0, 5)
    ? `${start}–${end.slice(6)}`
    : `${start} – ${end}`
}

/**
 * Checks the shape of a maintenance window: on the 30-minute grid, ending
 * after it starts and after `now`, starting no earlier than the current slot,
 * and at most seven days long.
 */
export function validateMaintenanceWindow(
  startAt: number,
  endAt: number,
  now: number
) {
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) {
    throw new ConvexError("Waktu perbaikan tidak valid")
  }
  if (startAt % SLOT_MS !== 0 || endAt % SLOT_MS !== 0) {
    throw new ConvexError("Waktu perbaikan harus mengikuti slot 30 menit")
  }
  if (endAt <= startAt) {
    throw new ConvexError("Waktu selesai harus setelah waktu mulai")
  }
  if (startAt + SLOT_MS <= now) {
    throw new ConvexError("Waktu mulai perbaikan sudah lewat")
  }
  if (endAt - startAt > MAINTENANCE_MAX_MS) {
    throw new ConvexError(
      "Satu jadwal perbaikan maksimal 7 hari. Untuk penutupan lebih lama, admin dapat menonaktifkan fasilitas."
    )
  }
}

/**
 * Maintenance and reservations may never overlap, and maintenance yields:
 * it can only take time that no approved or pending reservation and no other
 * maintenance window holds. Throws a message that names what is in the way.
 */
export function assertMaintenanceSlotFree(
  range: TimeRange,
  blockers: {
    approved: TimeRange[]
    pending: TimeRange[]
    maintenance: TimeRange[]
  }
) {
  const hit = (items: TimeRange[]) =>
    items
      .filter((item) =>
        overlaps(item.startAt, item.endAt, range.startAt, range.endAt)
      )
      .sort((a, b) => a.startAt - b.startAt)
  const list = (items: TimeRange[]) =>
    items.slice(0, 3).map(formatWibRange).join(", ") +
    (items.length > 3 ? `, dan ${items.length - 3} lainnya` : "")

  const approved = hit(blockers.approved)
  if (approved.length > 0) {
    throw new ConvexError(
      `Bentrok dengan ${approved.length} reservasi disetujui (${list(approved)}). Pilih waktu yang kosong.`
    )
  }
  const pending = hit(blockers.pending)
  if (pending.length > 0) {
    throw new ConvexError(
      `Ada ${pending.length} reservasi menunggu di waktu ini (${list(pending)}). Setujui atau tolak dulu di antrean reservasi.`
    )
  }
  const maintenance = hit(blockers.maintenance)
  if (maintenance.length > 0) {
    throw new ConvexError(
      `Sudah ada jadwal perbaikan di waktu ini (${list(maintenance)}).`
    )
  }
}

/** Reservations may not take time that a scheduled maintenance window holds. */
export function assertNoMaintenanceOverlap(
  range: TimeRange,
  maintenance: TimeRange[]
) {
  const hit = maintenance.find((item) =>
    overlaps(item.startAt, item.endAt, range.startAt, range.endAt)
  )
  if (hit) {
    throw new ConvexError(
      `Slot bertepatan dengan jadwal perbaikan (${formatWibRange(hit)})`
    )
  }
}
