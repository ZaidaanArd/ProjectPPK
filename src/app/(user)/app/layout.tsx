import type { Metadata } from "next"
export const metadata: Metadata = { robots: { index: false, follow: false } }
import type { ReactNode } from "react"
import { requirePortalRole } from "@/lib/require-portal-role"

export default async function UserPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePortalRole(["user"])

  return children
}
