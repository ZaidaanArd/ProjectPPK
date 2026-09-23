import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { LoginForm } from "./login-form"
import { isAuthenticated } from "@/lib/auth-server"

export const metadata: Metadata = { title: "Masuk" }

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/portal")
  return <LoginForm />
}
