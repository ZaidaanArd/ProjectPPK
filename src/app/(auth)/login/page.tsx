import type { Metadata } from "next"

import { ScaffoldPage } from "@/components/scaffold-page"

export const metadata: Metadata = { title: "Masuk" }

export default function LoginPage() {
  return <ScaffoldPage area="Auth" title="Login" />
}
