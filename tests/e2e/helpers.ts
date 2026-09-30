import { expect, type Page } from "@playwright/test"

export type DemoRole = "Petugas" | "Admin" | "Pengguna"

/** Opens the static demo portal as the given role with onboarding skipped. */
export async function enterDemo(page: Page, role: DemoRole) {
  await page.goto("/login")
  await page.evaluate(() => {
    for (const [id, role] of [
      ["demo-user", "user"],
      ["demo-officer", "officer"],
      ["demo-admin", "admin"],
    ]) {
      localStorage.setItem(`sthana:onboarding:v1:${id}:${role}:seen`, "1")
    }
  })
  await page.getByRole("button", { name: `Masuk sebagai ${role}` }).click()
  await expect(page.getByText(`Mode demo · ${role}`)).toBeVisible()
  await expect(page.getByRole("dialog")).toHaveCount(0)
}

export async function expectScrollUnlocked(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.style.overflow === "hidden" ||
          document.body.style.overflow === "hidden"
      )
    )
    .toBe(false)
}
