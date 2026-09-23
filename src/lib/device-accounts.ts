import { authClient } from "@/lib/auth-client"

export type DeviceAccount = NonNullable<
  Awaited<ReturnType<typeof authClient.multiSession.listDeviceSessions>>["data"]
>[number]

function assertSuccess(error: { message?: string } | null | undefined) {
  if (error) throw new Error(error.message || "Tindakan akun gagal. Coba lagi.")
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
  const [activeToken, accounts] = await Promise.all([
    getActiveSessionToken(),
    getDeviceAccounts(),
  ])

  if (!activeToken) return

  if (accounts.some(({ session }) => session.token === activeToken)) {
    await removeDeviceAccount(activeToken)
    return
  }

  // Sessions from before the plugin have no multi-session cookie. Only fall
  // back to signOut when no other stored accounts could be affected.
  if (accounts.length > 0) {
    throw new Error("Sesi akun belum siap. Muat ulang lalu coba lagi.")
  }
  const result = await authClient.signOut()
  assertSuccess(result.error)
}

export async function leaveAllAccounts() {
  const result = await authClient.signOut()
  assertSuccess(result.error)
}
