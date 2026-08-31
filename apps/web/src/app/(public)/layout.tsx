import type { ReactNode } from "react"

import { RootLayout } from "@/app/layouts/root-layout"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <RootLayout>{children}</RootLayout>
}
