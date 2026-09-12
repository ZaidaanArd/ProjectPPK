import type { Metadata } from "next"

import { ScaffoldPage } from "@/components/scaffold-page"

export const metadata: Metadata = {
  title: "Fasilitas",
  robots: { index: false, follow: false },
}

export default function FacilitiesPage() {
  return <ScaffoldPage area="Public" title="Daftar fasilitas" />
}
