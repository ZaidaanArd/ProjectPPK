import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { api } from "../../../convex/_generated/api"
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server"
import { accountDestination } from "@/lib/account-routing"
import { isStaticMode } from "@/lib/data-mode"
import { getStaticServerRole } from "@/lib/static-auth-server"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function PortalEntryPage() {
  if (isStaticMode) {
    const role = await getStaticServerRole()
    if (!role) redirect("/login")
    redirect(
      role === "admin" ? "/admin" : role === "officer" ? "/staff" : "/app"
    )
  }
  if (!(await isAuthenticated())) redirect("/login")
  const profile = await fetchAuthQuery(api.profiles.current)
  redirect(accountDestination(profile))
}
