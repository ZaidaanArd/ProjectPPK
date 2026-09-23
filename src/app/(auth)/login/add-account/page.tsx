import type { Metadata } from "next"

import { LoginForm } from "../login-form"
import { redirect } from "next/navigation"
import { isStaticMode } from "@/lib/data-mode"

export const metadata: Metadata = { title: "Tambah akun" }

export default function AddAccountPage() {
  if (isStaticMode) redirect("/login")
  return <LoginForm addAccount />
}
