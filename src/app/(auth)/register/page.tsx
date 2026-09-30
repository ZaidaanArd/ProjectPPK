import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { RegisterForm } from "./register-form"
import { isAuthenticated } from "@/lib/auth-server"
import { isStaticMode } from "@/lib/data-mode"
import { StaticRegister } from "./static-register"

export const metadata: Metadata = { title: "Daftar" }

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>
}) {
  if (isStaticMode) return <StaticRegister />
  // Signed-in users may register another account from the add-account page.
  const fromAddAccount = (await searchParams).from === "add-account"
  if (!fromAddAccount && (await isAuthenticated())) redirect("/portal")
  return <RegisterForm fromAddAccount={fromAddAccount} />
}
