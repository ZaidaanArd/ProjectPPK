import type { Metadata } from "next"

import { Component as RegisterView } from "@/views/auth/register-view"

export const metadata: Metadata = { title: "Daftar" }

export default function RegisterPage() {
  return <RegisterView />
}
