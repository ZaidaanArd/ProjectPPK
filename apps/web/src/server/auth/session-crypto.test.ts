import {
  createSessionId,
  signSessionId,
  verifySessionCookie,
} from "./session-crypto"

const secret = "test-secret-with-at-least-32-characters"

describe("signed session cookie", () => {
  it("creates high-entropy opaque session identifiers", () => {
    expect(createSessionId()).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(createSessionId()).not.toBe(createSessionId())
  })

  it("returns the session id for a valid signature", () => {
    const cookie = signSessionId("session-123", secret)

    expect(verifySessionCookie(cookie, secret)).toBe("session-123")
  })

  it("rejects malformed and tampered cookies", () => {
    const cookie = signSessionId("session-123", secret)

    expect(verifySessionCookie("malformed", secret)).toBeNull()
    expect(verifySessionCookie(`${cookie}tampered`, secret)).toBeNull()
    expect(verifySessionCookie(cookie, `${secret}-different`)).toBeNull()
  })
})
