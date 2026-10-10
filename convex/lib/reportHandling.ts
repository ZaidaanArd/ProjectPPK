export type HandlingImpact = "usable" | "closed"

export function reportHandlingState(
  status: "active" | "maintenance" | "inactive",
  reports: readonly { status: string; handlingImpact?: HandlingImpact }[]
) {
  const active = reports.filter((report) => report.status === "in_progress")
  const closed = active.some((report) => report.handlingImpact === "closed")
  const usable = active.some((report) => report.handlingImpact === "usable")
  return {
    status: status === "active" && closed ? ("maintenance" as const) : status,
    handlingNotice: closed
      ? "Fasilitas ditutup sampai petugas menyelesaikan penanganan dan memastikan aman digunakan."
      : usable
        ? "Ada gangguan yang sedang ditangani. Fasilitas masih dapat digunakan."
        : undefined,
  }
}
