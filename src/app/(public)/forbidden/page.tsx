import type { Metadata } from "next"

import { ScaffoldPage } from "@/components/scaffold-page"

export const metadata: Metadata = { title: "Akses ditolak" }

export default function ForbiddenPage() {
  return <ScaffoldPage area="Public" title="Akses ditolak" />
}
