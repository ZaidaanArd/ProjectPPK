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

test("auth validation and theme preference remain interactive", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: /gunakan tema gelap/i }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)

  await page.goto("/login")
  await page.getByLabel(/email kampus/i).fill("bukan-email")
  await page.getByLabel(/kata sandi/i).fill("pendek")
  await page.getByRole("button", { name: /^masuk$/i }).click()
  await expect(page.getByText(/alamat email yang valid/i)).toBeVisible()
  await expect(page.getByText(/minimal 8 karakter/i)).toBeVisible()

  await page.getByRole("link", { name: /daftar mandiri/i }).click()
  await expect(page).toHaveURL(/\/register$/)
  await expect(
    page.getByRole("heading", { name: /mulai dengan identitas kampusmu/i })
  ).toBeVisible()
})

test("single Next.js runtime exposes scaffold REST contracts", async ({
  request,
}) => {
  const health = await request.get("/health")
  expect(health.ok()).toBeTruthy()
  await expect(health.json()).resolves.toMatchObject({
    status: "ok",
    service: "project-ppk-web",
    version: "0.0.1",
  })

  const session = await request.get("/api/v1/auth/session")
  expect(session.ok()).toBeTruthy()
  await expect(session.json()).resolves.toEqual({ user: null })

  const missing = await request.get("/api/v1/not-implemented")
  expect(missing.status()).toBe(404)
  await expect(missing.json()).resolves.toMatchObject({
    code: "NOT_FOUND",
    message: "Endpoint tidak ditemukan.",
  })
})
