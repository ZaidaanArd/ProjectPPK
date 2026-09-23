import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { PortalRole } from "@/lib/portal-navigation"

const roles: PortalRole[] = ["user", "officer", "admin"]

export async function getStaticServerRole(): Promise<PortalRole | null> {
  const value = (await cookies()).get("sthana_demo_role")?.value
  return roles.find((role) => role === value) ?? null
}

export async function requireStaticRole(allowed: PortalRole[]) {
  const role = await getStaticServerRole()
  if (!role) redirect("/login")
  if (!allowed.includes(role)) redirect("/forbidden")
  const names = {
    user: "Pengguna Demo",
    officer: "Petugas Demo",
    admin: "Admin Demo",
  }
  const emails = {
    user: "pengguna@demo.local",
    officer: "petugas@demo.local",
    admin: "admin@demo.local",
  }
  return {
    id: `demo-${role}`,
    name: names[role],
    email: emails[role],
    role,
    status: "active" as const,
    mustChangePassword: false,
    createdAt: 0,
    updatedAt: 0,
    authUserId: `demo-${role}`,
  }
}
