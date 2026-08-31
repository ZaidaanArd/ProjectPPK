import type { UserSession } from "@workspace/contracts"

import { signSessionId } from "./session-crypto"
import { readSessionUser, type StoredSession } from "./session-reader"

const secret = "test-secret-with-at-least-32-characters"
const now = new Date("2026-08-31T12:00:00.000Z")
const user: UserSession = {
  id: "1026f1ed-5b8c-4f51-a54e-5e7c1ef9b423",
  name: "Admin Kampus",
  email: "admin@kampus.test",
  role: "admin",
  status: "active",
}

function lookup(row: StoredSession | undefined) {
  return async () => row
}

describe("session reader", () => {
  it("does not query storage for an invalid cookie", async () => {
    const findSession = vi.fn(lookup(undefined))

    await expect(
      readSessionUser("invalid-cookie", secret, findSession, now)
    ).resolves.toBeNull()
    expect(findSession).not.toHaveBeenCalled()
  })

  it("rejects an expired database session", async () => {
    const cookie = signSessionId("expired-session", secret)

    await expect(
      readSessionUser(
        cookie,
        secret,
        lookup({
          data: { user },
          expiresAt: new Date("2026-08-31T11:59:59.000Z"),
        }),
        now
      )
    ).resolves.toBeNull()
  })

  it("returns the validated user from an active session", async () => {
    const cookie = signSessionId("active-session", secret)

    await expect(
      readSessionUser(
        cookie,
        secret,
        lookup({
          data: { user },
          expiresAt: new Date("2026-09-01T12:00:00.000Z"),
        }),
        now
      )
    ).resolves.toEqual(user)
  })
})
