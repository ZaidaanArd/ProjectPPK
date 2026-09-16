import type { Metadata } from "next"

import { FacilityDashboard } from "@/components/facilities-dashboard/facility-dashboard"

export const metadata: Metadata = {
  title: "Demo Dashboard Fasilitas",
  description:
    "Coba Dashboard Fasilitas: search, filter, tambah/edit, maintenance, dan grid 26 slot 07.00–20.00.",
  robots: { index: false, follow: false },
}

export default function DemoFasilitasPage() {
  return (
    <main
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 75% 0%, #ffe2f1 0, transparent 55%), radial-gradient(ellipse at 5% 15%, #fff0f8 0, transparent 55%), #fffcfd",
      }}
    >
      <FacilityDashboard initialRole="pengguna" />
      <p className="mx-auto w-full max-w-6xl px-4 pb-10 text-xs text-muted-foreground sm:px-6">
        Halaman demo — gunakan switch Admin / Petugas / Pengguna untuk menguji
        matriks aksi. Data tersimpan lokal (mock) dan siap disambung ke{" "}
        <code>GET /api/facilities</code>.
      </p>
    </main>
  )
}
