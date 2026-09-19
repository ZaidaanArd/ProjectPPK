import type { Metadata } from "next"
export const metadata: Metadata = { robots: { index: false, follow: false } }
import type { ReactNode } from "react"
import { requirePortalRole } from "@/lib/require-portal-role"

export default async function AdminPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePortalRole(["admin"])

  return children
}
