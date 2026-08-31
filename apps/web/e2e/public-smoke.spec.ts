import { expect, test } from "@playwright/test"

test("public landing and facility search work", async ({ page }) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", {
      name: /temukan ruang. atur waktu. jaga kampus/i,
    })
  ).toBeVisible()

  await page
    .getByRole("link", { name: /cek fasilitas/i })
    .first()
    .click()
  await expect(page).toHaveURL(/\/facilities$/)
  await page.getByRole("textbox", { name: /cari fasilitas/i }).fill("Cakrawala")
  await expect(page.getByText("Laboratorium Cakrawala")).toBeVisible()
  await expect(page.getByText("Aula Nawasena")).not.toBeVisible()
})

test("protected area redirects anonymous visitors", async ({ page }) => {
  await page.goto("/app")
  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole("heading", { name: /masuk ke portal kampus/i })
  ).toBeVisible()
})
