import "server-only"

import type { UserRole } from "@workspace/contracts"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

import { signSessionId } from "@/server/auth/session-crypto"
import { readSessionUser } from "@/server/auth/session-reader"
import { getDatabase } from "@/server/db/database"
import { sessions } from "@/server/db/schema"
import { loadEnv } from "@/server/env"

export const SESSION_COOKIE_NAME = "ppk.sid"
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

export async function setSessionCookie(sessionId: string) {
  const cookieStore = await cookies()
  cookieStore.set(
    SESSION_COOKIE_NAME,
    signSessionId(sessionId, loadEnv().SESSION_SECRET),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    }
  )
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!cookieValue) {
    return null
  }

  return readSessionUser(cookieValue, loadEnv().SESSION_SECRET, (sessionId) =>
    getDatabase().query.sessions.findFirst({
      where: eq(sessions.sid, sessionId),
      columns: { data: true, expiresAt: true },
    })
  )
})

export async function requireUser(roles: readonly UserRole[]) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!roles.includes(user.role)) {
    redirect("/forbidden")
  }

  return user
}
