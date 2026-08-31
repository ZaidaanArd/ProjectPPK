import { userSessionSchema, type UserSession } from "@workspace/contracts"

import { verifySessionCookie } from "./session-crypto"

export type StoredSession = {
  data: Record<string, unknown>
  expiresAt: Date
}

export async function readSessionUser(
  cookieValue: string,
  secret: string,
  findSession: (sessionId: string) => Promise<StoredSession | undefined>,
  now = new Date()
): Promise<UserSession | null> {
  const sessionId = verifySessionCookie(cookieValue, secret)
  if (!sessionId) {
    return null
  }

  const row = await findSession(sessionId)
  if (!row || row.expiresAt.getTime() <= now.getTime()) {
    return null
  }

  const parsedUser = userSessionSchema.safeParse(row.data.user)
  return parsedUser.success ? parsedUser.data : null
}
