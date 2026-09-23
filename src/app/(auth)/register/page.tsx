import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { RegisterForm } from "./register-form"
import { isAuthenticated } from "@/lib/auth-server"
import { isStaticMode } from "@/lib/data-mode"
import { StaticRegister } from "./static-register"

export const metadata: Metadata = { title: "Daftar" }

export default async function RegisterPage() {
  if (isStaticMode) return <StaticRegister />
  if (await isAuthenticated()) redirect("/portal")
  return <RegisterForm />
}
