import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"

test.skip(
  !process.env.PLAYWRIGHT_BASE_URL?.startsWith("http://localhost:"),
  "Pendaftaran tes hanya boleh dijalankan terhadap frontend lokal dan Convex development."
)
test.setTimeout(120_000)

test("pendaftaran pending tidak membuat sesi dan status baru terlihat setelah login", async ({
  page,
  context,
}) => {
  const email = `qa-pending-${randomUUID().slice(0, 8)}@example.test`
  const password = `Test!${randomUUID().slice(0, 12)}`

  await page.goto("/register")
  await page.getByLabel("Nama Lengkap").fill("QA Pending")
  await page.getByLabel("NIM", { exact: true }).fill("QA-PLAYWRIGHT")
  await page.getByLabel("Email", { exact: true }).fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByLabel("Konfirmasi Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Daftar Sekarang" }).click()

  await expect(page.getByText("Pendaftaran Berhasil!")).toBeVisible()
  expect(
    (await context.cookies()).filter((cookie) =>
      cookie.name.includes("session_token")
    )
  ).toHaveLength(0)

  await page.goto("/register")
  await page.getByLabel("Nama Lengkap").fill("QA Pending")
  await page.getByLabel("NIM", { exact: true }).fill("QA-PLAYWRIGHT")
  await page.getByLabel("Email", { exact: true }).fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByLabel("Konfirmasi Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Daftar Sekarang" }).click()
  await expect(
    page.getByText("Email sudah terdaftar.", { exact: false })
  ).toBeVisible()

  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Masuk", exact: true }).click()
  await expect(
    page.getByText("Akun ini masih menunggu persetujuan admin.")
  ).toBeVisible()
  expect(
    (await context.cookies()).filter((cookie) =>
      cookie.name.includes("session_token")
    )
  ).toHaveLength(0)
})
