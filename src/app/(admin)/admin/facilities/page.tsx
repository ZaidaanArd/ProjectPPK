import { FacilityDashboard } from "@/components/facilities-dashboard/facility-dashboard"

export default function FacilitiesAdminPage() {
  return (
    <main
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 75% 0%, #ffe2f1 0, transparent 55%), radial-gradient(ellipse at 5% 15%, #fff0f8 0, transparent 55%), #fffcfd",
      }}
    >
      <FacilityDashboard initialRole="admin" />
    </main>
  )
}
