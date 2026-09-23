import { expect, test, type Page } from "@playwright/test"

test.skip(
  process.env.PLAYWRIGHT_STATIC_MODE !== "1" ||
    !process.env.PLAYWRIGHT_BASE_URL?.startsWith("http://localhost:"),
  "Tes ini hanya untuk demo statis lokal; tidak mengubah data production."
)

async function enterDemo(page: Page, role: "Petugas" | "Admin" | "Pengguna") {
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

test("US-09: slot reservasi yang sudah disetujui ditandai terisi", async ({
  page,
}) => {
  await enterDemo(page, "Pengguna")
  await page.goto("/app/reservations/new")
  await page.getByText("Aula Gedung A", { exact: true }).click()
  await page.getByRole("combobox", { name: "Jam mulai" }).click()
  await expect(
    page.getByRole("option", { name: /09.00.*Terisi/ })
  ).toBeDisabled()
})

test("US-10: pembatalan meminta alasan dan memfokuskan input", async ({
  page,
}) => {
  await enterDemo(page, "Petugas")
  await page.goto("/staff/reservations")
  await page.getByRole("button", { name: "Batalkan" }).first().click()
  await expect(page.getByText("Isi alasan pembatalan sebelum")).toBeVisible()
  const reason = page
    .getByRole("textbox", { name: "Catatan keputusan" })
    .first()
  await expect(reason).toBeFocused()
  await reason.fill("Pemohon membatalkan kegiatan")
  await page.getByRole("button", { name: "Batalkan" }).first().click()
  await expect(page.getByText("Dibatalkan", { exact: true })).toBeVisible()
})

test("US-11/12: mulai tanpa catatan, perbaikan, lalu aktif kembali", async ({
  page,
}) => {
  await enterDemo(page, "Petugas")
  await page.goto("/staff/reports")
  await page
    .getByRole("checkbox", { name: "Tandai fasilitas dalam perbaikan" })
    .check()
  await page.getByRole("button", { name: "Mulai tangani" }).click()
  await expect(page.getByText("Ditangani", { exact: true })).toBeVisible()

  await page.goto("/facilities")
  const lab = page.locator("article.public-facility-card").filter({
    has: page.getByRole("heading", { name: "Lab Komputer 3" }),
  })
  await expect(lab).toContainText("Perawatan")

  await page.goto("/staff/reports")
  await page
    .getByRole("button", { name: "Selesaikan + aktifkan fasilitas" })
    .click()
  await expect(page.getByText("Isi catatan penanganan sebelum")).toBeVisible()
  await page
    .getByRole("textbox", { name: "Catatan penanganan" })
    .fill("Komputer diperbaiki")
  await page
    .getByRole("button", { name: "Selesaikan + aktifkan fasilitas" })
    .click()
  await expect(page.getByText("Selesai", { exact: true })).toBeVisible()
  await page.goto("/facilities")
  await expect(lab).toContainText("Aktif")
})

test("US-17: rekap per fasilitas/lokasi tersedia dan CSV dapat diunduh", async ({
  page,
}) => {
  await enterDemo(page, "Admin")
  await expect(
    page.getByRole("heading", { name: "Penggunaan fasilitas" })
  ).toBeVisible()
  await expect(
    page.getByRole("row").filter({ hasText: "Lab Komputer 3" })
  ).toContainText("Gedung Informatika")
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Rekap fasilitas CSV" }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe("sthana-demo-summary.csv")
})
