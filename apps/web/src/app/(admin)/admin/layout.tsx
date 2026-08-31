import type { ReactNode } from "react"

import { PortalLayout } from "@/app/layouts/portal-layout"
import { requireUser } from "@/server/auth/session"

export default async function AdminPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requireUser(["admin"])

  return (
    <PortalLayout kind="admin" user={user}>
      {children}
    </PortalLayout>
  )
}
