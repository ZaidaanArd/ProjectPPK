import type { Metadata } from "next"

import { PublicFacilities } from "@/components/public-facilities"

export const metadata: Metadata = {
  title: "Fasilitas",
  description:
    "Jelajahi fasilitas kampus: cari, filter, dan cek ketersediaan slot 07.00–20.00 WIB.",
}

export default function FacilitiesPage() {
  return (
    <main
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 75% 0%, #ffe2f1 0, transparent 55%), radial-gradient(ellipse at 5% 15%, #fff0f8 0, transparent 55%), #fffcfd",
      }}
    >
      <PublicFacilities />
    </main>
  )
}
