import type { Metadata } from "next"
export const metadata: Metadata = { robots: { index: false, follow: false } }
import type { ReactNode } from "react"

export default function UserPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
