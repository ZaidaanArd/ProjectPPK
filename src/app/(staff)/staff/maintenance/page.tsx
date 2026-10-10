import { StaffMaintenance } from "@/components/maintenance-portal"

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{
    facility?: string | string[]
    schedule?: string | string[]
  }>
}) {
  const { facility, schedule } = await searchParams
  return (
    <StaffMaintenance
      initialFacilityId={typeof facility === "string" ? facility : undefined}
      autoSchedule={schedule === "1"}
    />
  )
}
