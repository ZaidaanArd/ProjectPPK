import { describe, expect, it } from "vitest"

import { resolveOnboardingVisit } from "../src/lib/portal-onboarding-storage"

function memoryStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value)
    },
  }
}

describe("portal onboarding", () => {
  it("opens once for a new account and not again on a later visit", () => {
    const persistent = memoryStorage()
    const key = "sthana:onboarding:v1:profile-1:user"

    expect(resolveOnboardingVisit(key, persistent, memoryStorage())).toEqual({
      repeat: false,
      shouldShow: true,
    })
    expect(resolveOnboardingVisit(key, persistent, memoryStorage())).toEqual({
      repeat: false,
      shouldShow: false,
    })
  })

  it("can repeat on a later visit but not on every route change", () => {
    const persistent = memoryStorage()
    const visit = memoryStorage()
    const key = "sthana:onboarding:v1:profile-1:user"
    persistent.setItem(`${key}:repeat`, "1")

    expect(resolveOnboardingVisit(key, persistent, visit).shouldShow).toBe(true)
    expect(resolveOnboardingVisit(key, persistent, visit).shouldShow).toBe(
      false
    )
    expect(
      resolveOnboardingVisit(key, persistent, memoryStorage()).shouldShow
    ).toBe(true)
  })

  it("keeps each profile and role separate", () => {
    const persistent = memoryStorage()
    resolveOnboardingVisit(
      "sthana:onboarding:v1:profile-1:user",
      persistent,
      memoryStorage()
    )

    expect(
      resolveOnboardingVisit(
        "sthana:onboarding:v1:profile-2:admin",
        persistent,
        memoryStorage()
      ).shouldShow
    ).toBe(true)
  })
})
