import type { ReactNode } from "react"

import { PortalLayout } from "@/app/layouts/portal-layout"
import { requireUser } from "@/server/auth/session"

export default async function UserPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requireUser(["user"])

  return (
    <PortalLayout kind="user" user={user}>
      {children}
    </PortalLayout>
  )
}
