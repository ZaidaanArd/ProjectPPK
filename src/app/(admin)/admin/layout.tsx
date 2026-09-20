import type { Metadata } from "next"
export const metadata: Metadata = { robots: { index: false, follow: false } }
import type { ReactNode } from "react"
import { PortalShell } from "@/components/portal-shell"
import { requirePortalRole } from "@/lib/require-portal-role"

export default async function AdminPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const profile = await requirePortalRole(["admin"])

  return <PortalShell profile={profile}>{children}</PortalShell>
}
