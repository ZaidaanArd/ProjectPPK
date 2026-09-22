import type { Metadata } from "next"
import { cookies } from "next/headers"
export const metadata: Metadata = { robots: { index: false, follow: false } }
import type { ReactNode } from "react"
import { PortalShell } from "@/components/portal-shell"
import { requirePortalRole } from "@/lib/require-portal-role"

export default async function UserPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const profile = await requirePortalRole(["user"])
  const sidebarDefaultOpen =
    (await cookies()).get("sidebar_state")?.value !== "false"

  return (
    <PortalShell profile={profile} sidebarDefaultOpen={sidebarDefaultOpen}>
      {children}
    </PortalShell>
  )
}
