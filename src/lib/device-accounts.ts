import { authClient } from "@/lib/auth-client"

export type DeviceAccount = NonNullable<
  Awaited<ReturnType<typeof authClient.multiSession.listDeviceSessions>>["data"]
>[number]

type AuthError = { message?: string; status?: number } | null | undefined

export function accountErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

function assertSuccess(error: AuthError) {
  if (!error) return
  if (error.status === 404) {
    throw new Error("Layanan multi-akun belum tersedia. Muat ulang nanti.")
  }
  throw new Error(error.message || "Tindakan akun gagal. Coba lagi.")
}

export async function getDeviceAccounts() {
  const result = await authClient.multiSession.listDeviceSessions()
  assertSuccess(result.error)
  return result.data ?? []
}

export async function getActiveSessionToken() {
  const result = await authClient.getSession()
  assertSuccess(result.error)
  return result.data?.session.token ?? null
}

export function isLegacySession(
  activeToken: string | null,
  accounts: DeviceAccount[]
) {
  return Boolean(
    activeToken &&
    !accounts.some(({ session }) => session.token === activeToken)
  )
}

export async function switchDeviceAccount(sessionToken: string) {
  const result = await authClient.multiSession.setActive({ sessionToken })
  assertSuccess(result.error)
}

export async function removeDeviceAccount(sessionToken: string) {
  const result = await authClient.multiSession.revoke({ sessionToken })
  assertSuccess(result.error)
}

export async function leaveCurrentAccount() {
  const activeToken = await getActiveSessionToken()
  if (!activeToken) return

  const result = await authClient.multiSession.revoke({
    sessionToken: activeToken,
  })
  if (!result.error) return

  // Pre-plugin sessions lack a multi-session cookie. Revoke only this token;
  // signOut would also remove every other account stored in the browser.
  if (result.error.status === 401 || result.error.status === 404) {
    const fallback = await authClient.revokeSession({ token: activeToken })
    assertSuccess(fallback.error)
    return
  }
  assertSuccess(result.error)
}

export async function leaveAllAccounts() {
  const result = await authClient.signOut()
  assertSuccess(result.error)
}
