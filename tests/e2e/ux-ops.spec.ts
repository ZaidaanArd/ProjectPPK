import { expect, test, type Page } from "@playwright/test"

import { enterDemo, seedDateInJakarta } from "./helpers"

test.skip(
  process.env.PLAYWRIGHT_STATIC_MODE !== "1" ||
    !process.env.PLAYWRIGHT_BASE_URL?.startsWith("http://localhost:"),
  "Tes ini hanya untuk demo statis lokal; tidak mengubah data production."
)

/**
 * As the demo user, requests Lab Komputer 3 at 13.30–15.00, overlapping the
 * seeded pending 13.00–14.00 request.
 */
async function createConflict(page: Page) {
  await enterDemo(page, "Pengguna")
  await page.goto(
    `/app/reservations/new?facility=demo-lab&date=${seedDateInJakarta()}`
  )
  await page.getByRole("button", { name: /^13\.30 · / }).click()
  await page.getByRole("button", { name: /^14\.30 · / }).click()
  await expect(
    page.getByText(/Sudah ada 1 pengajuan menunggu di jam ini/)
  ).toBeVisible()
  await page.getByLabel("Tujuan penggunaan").fill("Rapat himpunan")
  await page.getByRole("button", { name: "Kirim reservasi" }).click()
  await page.getByRole("button", { name: "Ya, kirim" }).click()
  await expect(page.getByText("Berhasil dikirim ya!")).toBeVisible()
}

test("staff see which requests conflict and jump to them", async ({ page }) => {
  await createConflict(page)
  await enterDemo(page, "Petugas")
  await page.goto("/staff/reservations")

  const card = page.locator("#queue-reservation-demo-reservation-pending")
  await expect(card).toContainText("Bentrok dengan 1 pengajuan lain")
  await expect(card).toContainText("Tujuan: Rapat himpunan")
  await card.getByRole("button", { name: "Lihat" }).click()
  await expect(
    page.locator("section:focus", { hasText: "Rapat himpunan" })
  ).toBeVisible()

  await card.getByRole("button", { name: "Setujui" }).click()
  const confirm = page.getByRole("alertdialog")
  await expect(confirm).toContainText("1 pengajuan ini otomatis ditolak")
  await expect(confirm).toContainText("Pengguna Demo")
})

test("maintenance page groups work in tabs and closes via dialogs", async ({
  page,
}) => {
  await enterDemo(page, "Petugas")
  await page.goto("/staff/maintenance")
  await expect(page.getByRole("tab", { name: /Perbaikan/ })).toBeVisible()

  await page.getByRole("button", { name: "Tutup darurat" }).click()
  const dialog = page.getByRole("dialog", { name: "Tutup darurat" })
  await dialog.locator("#closure-facility").click()
  await page.getByRole("option", { name: "Aula Gedung A" }).click()
  await expect(dialog.locator("#closure-facility")).toContainText(
    "Aula Gedung A"
  )
  await expect(dialog).toContainText("reservasi terdampak")
  await dialog.getByLabel("Alasan").fill("Kabel listrik terkelupas")
  await dialog.getByRole("checkbox").click()
  await dialog.getByRole("button", { name: "Tutup fasilitas" }).click()
  await expect(dialog).toBeHidden()

  await expect(page.getByText("Perlu perhatian")).toBeVisible()
  await page.getByRole("tab", { name: /Penutupan/ }).click()
  await expect(page).toHaveURL(/tab=penutupan/)
  const panel = page.getByRole("tabpanel")
  await expect(panel).toContainText("Keselamatan")
  await panel.getByRole("button", { name: "Buka kembali" }).click()
  await page.getByRole("button", { name: "Ya, sudah aman" }).click()
  await expect(panel).toContainText(
    "Tidak ada fasilitas yang sedang ditutup darurat."
  )
})

test("clicking a notification opens its details", async ({ page }) => {
  await enterDemo(page, "Petugas")
  await page.goto("/staff/maintenance")
  // A safety closure cancels the demo user's approved booking and notifies.
  await page.getByRole("button", { name: "Tutup darurat" }).click()
  const dialog = page.getByRole("dialog", { name: "Tutup darurat" })
  await dialog.locator("#closure-facility").click()
  await page.getByRole("option", { name: "Aula Gedung A" }).click()
  await dialog.getByLabel("Alasan").fill("Atap bocor")
  await dialog.getByRole("checkbox").click()
  await dialog.getByRole("button", { name: "Tutup fasilitas" }).click()
  await expect(dialog).toBeHidden()

  await enterDemo(page, "Pengguna")
  await page.getByRole("button", { name: /^Notifikasi/ }).click()
  await page
    .getByRole("menuitem", { name: /Reservasi dibatalkan.*Buka detail/ })
    .click()
  const detail = page.getByRole("dialog", {
    name: /Reservasi dibatalkan/,
  })
  await expect(detail).toBeVisible()
  await expect(detail).toContainText("Atap bocor")
  await expect(
    detail.getByRole("link", { name: "Lihat reservasi" })
  ).toHaveAttribute("href", /item=demo-reservation-approved/)
})
