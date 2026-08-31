import type { Metadata } from "next"

import { Component as FacilitiesView } from "@/views/public/facilities-view"

export const metadata: Metadata = { title: "Fasilitas" }

export default function FacilitiesPage() {
  return <FacilitiesView />
}
