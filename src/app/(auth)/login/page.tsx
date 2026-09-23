import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { LoginForm } from "./login-form"
import { StaticLogin } from "./static-login"
import { isAuthenticated } from "@/lib/auth-server"
import { isStaticMode } from "@/lib/data-mode"

export const metadata: Metadata = { title: "Masuk" }

export default async function LoginPage() {
  if (isStaticMode) {
    return <StaticLogin />
  }
  if (await isAuthenticated()) redirect("/portal")
  return <LoginForm />
}
