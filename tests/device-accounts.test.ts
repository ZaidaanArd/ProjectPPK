import { beforeEach, describe, expect, it, vi } from "vitest"

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  listDeviceSessions: vi.fn(),
  revoke: vi.fn(),
  revokeSession: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: auth.getSession,
    multiSession: {
      listDeviceSessions: auth.listDeviceSessions,
      revoke: auth.revoke,
    },
    revokeSession: auth.revokeSession,
    signOut: auth.signOut,
  },
}))

import {
  getDeviceAccounts,
  leaveAllAccounts,
  leaveCurrentAccount,
} from "../src/lib/device-accounts"

beforeEach(() => {
  vi.clearAllMocks()
  auth.getSession.mockResolvedValue({
    data: { session: { token: "active-token" } },
    error: null,
  })
  auth.revoke.mockResolvedValue({ data: { status: true }, error: null })
  auth.revokeSession.mockResolvedValue({ data: { status: true }, error: null })
  auth.signOut.mockResolvedValue({ data: { success: true }, error: null })
})

describe("device account actions", () => {
  it("shows a useful error when the backend multi-session endpoint is absent", async () => {
    auth.listDeviceSessions.mockResolvedValue({
      data: null,
      error: { status: 404 },
    })
    await expect(getDeviceAccounts()).rejects.toThrow(
      "Layanan multi-akun belum tersedia"
    )
  })

  it("revokes only the active multi-session account", async () => {
    await leaveCurrentAccount()
    expect(auth.revoke).toHaveBeenCalledWith({ sessionToken: "active-token" })
    expect(auth.signOut).not.toHaveBeenCalled()
  })

  it("revokes a legacy session without signing out other accounts", async () => {
    auth.revoke.mockResolvedValue({ error: { status: 401 } })
    await leaveCurrentAccount()
    expect(auth.revokeSession).toHaveBeenCalledWith({ token: "active-token" })
    expect(auth.signOut).not.toHaveBeenCalled()
  })

  it("uses signOut only for the explicit all-accounts action", async () => {
    await leaveAllAccounts()
    expect(auth.signOut).toHaveBeenCalledOnce()
  })
})
