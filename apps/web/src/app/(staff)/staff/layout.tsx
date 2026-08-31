import type { ReactNode } from "react"

import { PortalLayout } from "@/app/layouts/portal-layout"
import { requireUser } from "@/server/auth/session"

export default async function StaffPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requireUser(["officer", "admin"])

  return (
    <PortalLayout kind="staff" user={user}>
      {children}
    </PortalLayout>
  )
}
