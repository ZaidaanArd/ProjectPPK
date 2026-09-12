import type { Metadata } from "next"

import { ScaffoldPage } from "@/components/scaffold-page"

export const metadata: Metadata = {
  title: "Akses ditolak",
  robots: { index: false, follow: false },
}

export default function ForbiddenPage() {
  return <ScaffoldPage area="Public" title="Akses ditolak" />
}
