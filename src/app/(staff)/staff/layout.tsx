import type { Metadata } from "next"
export const metadata: Metadata = { robots: { index: false, follow: false } }
import type { ReactNode } from "react"
import { requirePortalRole } from "@/lib/require-portal-role"

export default async function StaffPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePortalRole(["officer", "admin"])

  return children
}
