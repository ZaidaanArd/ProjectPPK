import { describe, expect, it } from "vitest"

import {
  accountDestination,
  accountStatusMessage,
  MAX_DEVICE_ACCOUNTS,
  portalAccessDestination,
} from "../src/lib/account-routing"

describe("account routing", () => {
  it("routes each active role to its own portal", () => {
    expect(accountDestination({ role: "user", status: "active" })).toBe("/app")
    expect(accountDestination({ role: "officer", status: "active" })).toBe(
      "/staff"
    )
    expect(accountDestination({ role: "admin", status: "active" })).toBe(
      "/admin"
    )
  })

  it("keeps inactive accounts out of every portal", () => {
    for (const status of ["pending", "rejected", "disabled"] as const) {
      expect(accountDestination({ role: "admin", status })).toBe(
        "/account/status"
      )
      expect(accountStatusMessage(status)).toBeTruthy()
      expect(portalAccessDestination({ role: "user", status }, ["user"])).toBe(
        "/account/status"
      )
    }
    expect(accountDestination(null)).toBe("/account/status")
  })

  it("keeps active accounts out of the wrong portal", () => {
    expect(
      portalAccessDestination({ role: "user", status: "active" }, ["admin"])
    ).toBe("/forbidden")
    expect(
      portalAccessDestination({ role: "admin", status: "active" }, ["admin"])
    ).toBeNull()
  })

  it("limits accounts stored on a device", () => {
    expect(MAX_DEVICE_ACCOUNTS).toBe(5)
  })
})
