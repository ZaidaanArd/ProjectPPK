export type StepState = "done" | "current" | "upcoming" | "error"

export type ProgressStep = { label: string; state: StepState; at?: number }

type Tracked = { status: string; createdAt: number; updatedAt?: number }

function build(
  labels: [string, string, string],
  reached: number,
  item: Tracked,
  terminal?: string
): ProgressStep[] {
  const latest = item.updatedAt ?? item.createdAt
  return labels.map((label, index) => {
    if (terminal && index === 2) {
      return { label: terminal, state: "error", at: latest }
    }
    const state: StepState =
      index < reached || (index === reached && reached === 2)
        ? "done"
        : index === reached
          ? "current"
          : "upcoming"
    // Later steps only get a time when it differs from the submission.
    const at =
      index === 0
        ? item.createdAt
        : index === reached && reached > 0 && latest !== item.createdAt
          ? latest
          : undefined
    return { label, state, at }
  })
}

/** Diajukan → Ditinjau petugas → Disetujui (or Ditolak / Dibatalkan). */
export function reservationSteps(item: Tracked): ProgressStep[] {
  const labels: [string, string, string] = [
    "Diajukan",
    "Ditinjau petugas",
    "Disetujui",
  ]
  if (item.status === "approved") return build(labels, 2, item)
  if (item.status === "rejected") return build(labels, 2, item, "Ditolak")
  if (item.status === "cancelled") return build(labels, 2, item, "Dibatalkan")
  return build(labels, 1, item)
}

/** Diterima → Ditangani → Selesai (or Ditolak). */
export function reportSteps(item: Tracked): ProgressStep[] {
  const labels: [string, string, string] = ["Diterima", "Ditangani", "Selesai"]
  if (item.status === "resolved") return build(labels, 2, item)
  if (item.status === "rejected") return build(labels, 2, item, "Ditolak")
  if (item.status === "in_progress") return build(labels, 1, item)
  return build(labels, 0, item)
}
