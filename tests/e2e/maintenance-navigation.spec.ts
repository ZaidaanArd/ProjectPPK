import { expect, test } from "@playwright/test"

import { initialStaticData } from "../../src/lib/static-data"
import {
  chooseCalendarDate,
  enterDemo,
  scheduleRepair,
  tomorrowInJakarta,
} from "./helpers"

test.skip(
  process.env.PLAYWRIGHT_STATIC_MODE !== "1" ||
    !process.env.PLAYWRIGHT_BASE_URL?.startsWith("http://localhost:"),
  "Memakai data demo lokal."
)

test("kartu fasilitas membuka form dengan pilihan sesuai kartu", async ({
  page,
}) => {
  await enterDemo(page, "Admin")
  await page.setViewportSize({ width: 390, height: 844 })
  for (const [name, id] of [
    ["Aula Gedung A", "demo-aula"],
    ["Lab Komputer 3", "demo-lab"],
  ]) {
    await page.goto("/admin/facilities")
    const card = page.locator('[data-slot="card"]').filter({
      has: page.getByRole("heading", { name, exact: true }),
    })
    const link = card.getByRole("link", { name: "Jadwal perbaikan" })
    await expect(link).toHaveAttribute(
      "href",
      `/staff/maintenance?facility=${id}&schedule=1`
    )
    await link.click()
    const dialog = page.getByRole("dialog", { name: "Jadwalkan perbaikan" })
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole("combobox", { name: "Fasilitas", exact: true })
    ).toContainText(name)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await dialog.getByRole("button", { name: "Batal", exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/staff\/maintenance$/)
    await page.reload()
    await expect(dialog).toBeHidden()
    await page
      .getByRole("button", { name: "Jadwalkan perbaikan", exact: true })
      .click()
    await expect(
      dialog.getByRole("combobox", { name: "Fasilitas", exact: true })
    ).toContainText("Pilih fasilitas")
    await dialog.getByRole("button", { name: "Tutup dialog" }).click()
  }
})

test("fasilitas awal dapat diganti dan jadwal tersimpan untuk pilihan baru", async ({
  page,
}) => {
  await enterDemo(page, "Admin")
  await page.goto("/staff/maintenance?facility=demo-aula&schedule=1")
  const dialog = page.getByRole("dialog", { name: "Jadwalkan perbaikan" })
  await expect(
    dialog.getByRole("combobox", { name: "Fasilitas", exact: true })
  ).toContainText("Aula Gedung A")
  await chooseCalendarDate(page, "Tanggal perbaikan", tomorrowInJakarta())
  await expect(
    dialog.getByRole("button", { name: "09.00 · Terisi" })
  ).toBeDisabled()
  await dialog.getByRole("button", { name: "08.00 · Tersedia" }).click()
  await expect(
    dialog.getByRole("button", { name: "08.00 · Dipilih" })
  ).toBeVisible()
  await dialog.getByRole("combobox", { name: "Fasilitas", exact: true }).click()
  await dialog
    .getByRole("option", { name: "Lab Komputer 3", exact: true })
    .click()
  await expect(dialog.locator('[aria-pressed="true"]')).toHaveCount(0)
  await expect(
    dialog.getByRole("button", { name: "09.00 · Tersedia" })
  ).toBeEnabled()
  await expect(
    dialog.getByRole("button", { name: "13.00 · Terisi" })
  ).toBeDisabled()
  const reason = "Perbaikan dari kartu fasilitas admin"
  await scheduleRepair(page, {
    date: tomorrowInJakarta(),
    first: "10.00",
    last: "11.30",
    reason,
  })
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/staff\/maintenance$/)
  await expect(
    page.locator('[data-slot="card"]').filter({ hasText: reason })
  ).toContainText("Lab Komputer 3")
  await page
    .getByRole("button", { name: "Jadwalkan perbaikan", exact: true })
    .click()
  await expect(
    dialog.getByRole("combobox", { name: "Fasilitas", exact: true })
  ).toContainText("Pilih fasilitas")
  await expect(dialog.getByLabel("Alasan perbaikan")).toHaveValue("")
  await expect(dialog.locator('[aria-pressed="true"]')).toHaveCount(0)
})

test("fasilitas nonaktif dan parameter invalid tidak membuka form otomatis", async ({
  page,
}) => {
  const seed = structuredClone(initialStaticData)
  seed.facilities[0].status = "inactive"
  await page.addInitScript((data) => {
    if (!localStorage.getItem("sthana:static-data:v1")) {
      localStorage.setItem("sthana:static-data:v1", JSON.stringify(data))
    }
  }, seed)
  await enterDemo(page, "Admin")
  await page.goto("/admin/facilities")
  const card = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "Aula Gedung A", exact: true }),
  })
  await expect(
    card.getByRole("button", { name: "Jadwal perbaikan" })
  ).toBeDisabled()
  await expect(
    card.getByRole("link", { name: "Jadwal perbaikan" })
  ).toHaveCount(0)
  for (const query of [
    "facility=demo-aula&schedule=1",
    "facility=not-an-id&schedule=1",
    "schedule=1",
    "facility=demo-lab&facility=demo-seminar&schedule=1",
  ]) {
    await page.goto(`/staff/maintenance?${query}`)
    await expect(
      page.getByText("Fasilitas tidak ditemukan atau sudah nonaktif.", {
        exact: false,
      })
    ).toBeVisible()
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await expect(page).toHaveURL(/\/staff\/maintenance$/)
    await expect(
      page.getByRole("heading", { name: "Jadwal perbaikan", exact: true })
    ).toBeVisible()
  }
  await page.goto("/staff/maintenance?facility=demo-lab")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page
    .getByRole("button", { name: "Jadwalkan perbaikan", exact: true })
    .click()
  const dialog = page.getByRole("dialog", { name: "Jadwalkan perbaikan" })
  await expect(
    dialog.getByRole("combobox", { name: "Fasilitas", exact: true })
  ).toContainText("Pilih fasilitas")
  await dialog.getByRole("button", { name: "Batal", exact: true }).click()
  await expect(page).toHaveURL(/\/staff\/maintenance$/)
})
