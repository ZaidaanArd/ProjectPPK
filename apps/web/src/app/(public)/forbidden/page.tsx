import type { Metadata } from "next"

import { Component as ForbiddenView } from "@/views/errors/forbidden-view"

export const metadata: Metadata = { title: "Akses ditolak" }

export default function ForbiddenPage() {
  return <ForbiddenView />
}
