import { StaffMaintenance, type OpsTab } from "@/components/maintenance-portal"

const opsTabs: OpsTab[] = ["perbaikan", "gangguan", "penutupan", "riwayat"]

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{
    facility?: string | string[]
    schedule?: string | string[]
    tab?: string | string[]
  }>
}) {
  const { facility, schedule, tab } = await searchParams
  return (
    <StaffMaintenance
      initialFacilityId={typeof facility === "string" ? facility : undefined}
      autoSchedule={schedule === "1"}
      initialTab={opsTabs.find((item) => item === tab) ?? "perbaikan"}
    />
  )
}
