import type { ReactNode } from "react"

import { AuthLayout } from "@/app/layouts/auth-layout"

export default function AuthenticationLayout({
  children,
}: {
  children: ReactNode
}) {
  return <AuthLayout>{children}</AuthLayout>
}
