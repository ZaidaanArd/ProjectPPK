import { redirect } from "next/navigation"

import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { fetchAuthQuery } from "@/lib/auth-server"

export async function requirePortalRole(
  allowedRoles: Array<Doc<"profiles">["role"]>
) {
  let profile = null

  try {
    profile = await fetchAuthQuery(api.profiles.current)
  } catch {
    redirect("/login")
  }

  if (!profile) {
    redirect("/login")
  }

  if (profile.status !== "active" || !allowedRoles.includes(profile.role)) {
    redirect("/forbidden")
  }

  return profile
}
