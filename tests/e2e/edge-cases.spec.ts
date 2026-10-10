import path from "node:path"
import { mkdir } from "node:fs/promises"
import { expect, test } from "@playwright/test"
import { enterDemo } from "./helpers"

test.skip(
  process.env.PLAYWRIGHT_STATIC_MODE !== "1" ||
    !process.env.PLAYWRIGHT_BASE_URL?.startsWith("http://localhost:"),
  "Local static demo only"
)
const shots = path.join(process.cwd(), "public/docs-assets")
const capture = process.env.PLAYWRIGHT_DOC_SCREENSHOTS === "1"
test.use({ timezoneId: "Asia/Jakarta", viewport: { width: 1280, height: 900 } })

test("EC-13/15/17: impact dialog closes until safety-confirmed completion", async ({
  page,
}) => {
  if (capture) await page.setViewportSize({ width: 1280, height: 1100 })
  await enterDemo(page, "Petugas")
  await page.goto("/staff/reports")
  await page.getByRole("button", { name: "Mulai tangani", exact: true }).click()
  const dialog = page.getByRole("alertdialog")
  await expect(
    dialog.getByRole("button", { name: "Mulai tangani", exact: true })
  ).toBeDisabled()
  await dialog.getByRole("radio", { name: /^Harus ditutup/ }).check()
  await dialog
    .getByLabel("Keterangan untuk pengguna")
    .fill("Atap ruang tidak aman. Fasilitas ditutup sementara.")
  await expect(dialog.getByText(/pengajuan.*reservasi disetujui/)).toBeVisible()
  await dialog.getByRole("checkbox").check()
  if (capture) {
    await mkdir(shots, { recursive: true })
    await dialog.screenshot({ path: path.join(shots, "handling-closed.png") })
  }
  await dialog
    .getByRole("button", { name: "Mulai tangani", exact: true })
    .click()
  await expect(dialog).toBeHidden()
  await page.getByRole("tab", { name: /Sedang ditangani/ }).click()
  await page
    .getByRole("textbox", { name: "Catatan penanganan" })
    .fill("Pemeriksaan selesai dan atap sudah aman.")
  await page.getByRole("button", { name: "Selesaikan laporan" }).click()
  await expect(
    page.getByRole("button", { name: "Ya, selesaikan" })
  ).toBeDisabled()
  await page.getByRole("checkbox", { name: /aman/ }).check()
  await page.getByRole("button", { name: "Ya, selesaikan" }).click()
  await expect(page.getByRole("status")).toContainText(
    "Laporan ditandai selesai"
  )
})

test("EC-03: public slots inside 48 hours are disabled", async ({ page }) => {
  await page.goto("/facilities")
  await page
    .getByRole("listitem")
    .filter({ hasText: "Aula Gedung A" })
    .getByRole("button", { name: "Cek Jadwal Slot" })
    .click()
  const dialog = page.getByRole("dialog", {
    name: "Slot Waktu — Aula Gedung A",
  })
  await expect(dialog).toBeVisible()
  await dialog.getByRole("gridcell", { name: /^Today/ }).click()
  const slots = dialog.locator(
    '[aria-label^="Slot Aula Gedung A tanggal"] button'
  )
  await expect(slots).toHaveCount(26)
  for (const slot of await slots.all()) await expect(slot).toBeDisabled()
  if (capture) {
    await mkdir(shots, { recursive: true })
    await dialog.screenshot({ path: path.join(shots, "slots-lead-time.png") })
  }
})

test("EC-27: user notification history opens", async ({ page }) => {
  await enterDemo(page, "Pengguna")
  await page.getByRole("button", { name: /^Notifikasi/ }).click()
  await page.getByRole("menuitem", { name: "Semua notifikasi" }).click()
  await expect(
    page.getByRole("dialog", { name: "Semua notifikasi" })
  ).toBeVisible()
})

test("documentation screenshots and rendered architecture diagrams", async ({
  page,
}) => {
  test.skip(!capture, "Optional documentation evidence capture")
  test.setTimeout(120000)
  await mkdir(shots, { recursive: true })
  await page.goto("/login")
  await expect(
    page.getByRole("heading", { name: "Mode Demo Statis" })
  ).toBeVisible()
  await page.screenshot({ path: path.join(shots, "login-demo.png") })
  await page.goto("/docs/architecture")
  await expect(
    page.getByRole("heading", { name: "Arsitektur Sthana Kampus", exact: true })
  ).toBeVisible()
  const diagrams = page.locator(".mermaid-diagram-svg > svg")
  await expect(diagrams.first()).toBeVisible({ timeout: 30000 })
  await diagrams.first().screenshot({
    path: path.join(shots, "architecture.png"),
    style: ".mermaid-diagram-expand { visibility: hidden; }",
  })
  await page.goto("/docs/data-and-api")
  await page
    .locator(".mermaid-diagram-svg > svg")
    .first()
    .screenshot({
      path: path.join(shots, "erd.png"),
      style: ".mermaid-diagram-expand { visibility: hidden; }",
    })
  await page.goto("/facilities")
  await expect(
    page.getByRole("heading", { name: "Fasilitas kampus" })
  ).toBeVisible()
  await page.screenshot({ path: path.join(shots, "facilities.png") })
  await enterDemo(page, "Pengguna")
  await page.goto("/app/reservations/new")
  await page.getByText("Aula Gedung A", { exact: true }).click()
  await page.screenshot({ path: path.join(shots, "reservation-form.png") })
  await page.goto("/app/reports/new")
  await expect(
    page
      .getByRole("heading")
      .filter({ hasText: /laporan/i })
      .first()
  ).toBeVisible()
  await page.screenshot({ path: path.join(shots, "report-form.png") })
  await enterDemo(page, "Admin")
  await page.goto("/admin")
  await expect(page.getByRole("heading").first()).toBeVisible()
  await page.screenshot({ path: path.join(shots, "admin-summary.png") })
})
