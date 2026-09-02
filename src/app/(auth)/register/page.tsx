import type { Metadata } from "next"

import { ScaffoldPage } from "@/components/scaffold-page"

export const metadata: Metadata = { title: "Daftar" }

export default function RegisterPage() {
  return <ScaffoldPage area="Auth" title="Registrasi" />
}
