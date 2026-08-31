import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

const SIGNATURE_ALGORITHM = "sha256"

function createSignature(sessionId: string, secret: string) {
  return createHmac(SIGNATURE_ALGORITHM, secret)
    .update(sessionId)
    .digest("base64url")
}

export function createSessionId() {
  return randomBytes(32).toString("base64url")
}

export function signSessionId(sessionId: string, secret: string) {
  return `${sessionId}.${createSignature(sessionId, secret)}`
}

export function verifySessionCookie(value: string, secret: string) {
  const separatorIndex = value.lastIndexOf(".")
  if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
    return null
  }

  const sessionId = value.slice(0, separatorIndex)
  const signature = value.slice(separatorIndex + 1)
  const expected = Buffer.from(createSignature(sessionId, secret))
  const received = Buffer.from(signature)

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null
  }

  return sessionId
}
