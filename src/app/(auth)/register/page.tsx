import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { RegisterForm } from "./register-form"
import { isAuthenticated } from "@/lib/auth-server"

export const metadata: Metadata = { title: "Daftar" }

export default async function RegisterPage() {
  if (await isAuthenticated()) redirect("/portal")
  return <RegisterForm />
}
