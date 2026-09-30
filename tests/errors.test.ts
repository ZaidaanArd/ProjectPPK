import { ConvexError } from "convex/values"
import { describe, expect, it } from "vitest"

import { getErrorMessage } from "../src/lib/errors"

describe("getErrorMessage", () => {
  it("uses ConvexError data", () => {
    expect(
      getErrorMessage(new ConvexError("Slot sudah digunakan"), "Gagal")
    ).toBe("Slot sudah digunakan")
    expect(
      getErrorMessage(new ConvexError({ message: "Tidak diizinkan" }), "Gagal")
    ).toBe("Tidak diizinkan")
  })

  it("strips Convex request metadata and stack traces", () => {
    const error = new Error(
      "[CONVEX M(reservations:create)] [Request ID: 7a1b2c3d] Server Error\nUncaught Error: Fasilitas tidak tersedia\n    at handler (../convex/reservations.ts:42:11)\n  Called by client"
    )
    expect(getErrorMessage(error, "Gagal")).toBe("Fasilitas tidak tersedia")
  })

  it("falls back for empty, internal, or validator errors", () => {
    expect(getErrorMessage(undefined, "Gagal")).toBe("Gagal")
    expect(
      getErrorMessage(new Error("[CONVEX M(x)] Server Error"), "Gagal")
    ).toBe("Gagal")
    expect(
      getErrorMessage(
        new Error("ArgumentValidationError: Value does not match validator."),
        "Gagal"
      )
    ).toBe("Gagal")
  })

  it("keeps plain messages", () => {
    expect(getErrorMessage(new Error("Email sudah terdaftar"), "Gagal")).toBe(
      "Email sudah terdaftar"
    )
  })
})
