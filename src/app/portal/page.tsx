import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { api } from "../../../convex/_generated/api"
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server"
import { accountDestination } from "@/lib/account-routing"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function PortalEntryPage() {
  if (!(await isAuthenticated())) redirect("/login")
  const profile = await fetchAuthQuery(api.profiles.current)
  redirect(accountDestination(profile))
}
