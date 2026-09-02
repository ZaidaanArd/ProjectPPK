import type { Metadata } from "next"

import { ScaffoldPage } from "@/components/scaffold-page"

export const metadata: Metadata = { title: "Fasilitas" }

export default function FacilitiesPage() {
  return <ScaffoldPage area="Public" title="Daftar fasilitas" />
}
