import { expect, test } from "@playwright/test"

test("login page is reachable", async ({ page }) => {
  const response = await page.goto("/login")

  expect(response?.status()).toBe(200)
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole("textbox").first()).toBeVisible()
})
