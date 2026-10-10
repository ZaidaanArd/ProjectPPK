import { expect, test } from "@playwright/test"

import { initialStaticData } from "../../src/lib/static-data"
import { chooseCalendarDate, enterDemo, tomorrowInJakarta } from "./helpers"

test.skip(
  process.env.PLAYWRIGHT_STATIC_MODE !== "1" ||
    !process.env.PLAYWRIGHT_BASE_URL?.startsWith("http://localhost:"),
  "Memakai data demo lokal."
)

test("dropdown dan kalender dapat dipakai di dalam dialog pada kedua tema", async ({
  page,
}, testInfo) => {
  await enterDemo(page, "Admin")
  await page.goto("/staff/maintenance?facility=demo-aula&schedule=1")
  const dialog = page.getByRole("dialog", {
    name: "Jadwalkan perbaikan",
    exact: true,
  })
  const facility = dialog.getByRole("combobox", {
    name: "Fasilitas",
    exact: true,
  })
  for (const width of [320, 390, 1024]) {
    await page.setViewportSize({ width, height: 900 })
    for (const dark of [false, true]) {
      await page.evaluate(
        (value) => document.documentElement.classList.toggle("dark", value),
        dark
      )
      await facility.click()
      const option = dialog.getByRole("option", {
        name: "Aula Gedung A",
        exact: true,
      })
      await expect(option).toHaveAttribute("aria-selected", "true")
      await expect(option).toBeVisible()
      if (width === 320)
        await page.screenshot({
          path: testInfo.outputPath(`dropdown-${dark}.png`),
        })
      await page.keyboard.press("Escape")
      await expect(dialog).toBeVisible()
      await expect(facility).toBeFocused()
      await dialog.getByRole("button", { name: /^Tanggal perbaikan:/ }).click()
      const calendar = page.getByRole("dialog", {
        name: "Pilih tanggal perbaikan",
        exact: true,
      })
      await expect(
        calendar.getByRole("button", { name: "Pilih besok", exact: true })
      ).toBeVisible()
      const box = await calendar.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width)
      if (width === 320)
        await page.screenshot({
          path: testInfo.outputPath(`calendar-${dark}.png`),
        })
      await page.keyboard.press("Escape")
      await expect(calendar).toBeHidden()
      await expect(dialog).toBeVisible()
    }
  }
  await facility.focus()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("l")
  await page.keyboard.press("Enter")
  await expect(facility).toContainText("Lab Komputer 3")
  await chooseCalendarDate(page, "Tanggal perbaikan", tomorrowInJakarta())
  await expect(
    dialog.getByRole("button", { name: "13.00 · Terisi" })
  ).toBeDisabled()
})

test("perpanjangan memakai kalender dan dropdown dengan batas waktu yang sama", async ({
  page,
}) => {
  const date = tomorrowInJakarta()
  const seed = structuredClone(initialStaticData)
  seed.maintenance[0].startAt = Date.parse(`${date}T09:00:00+07:00`)
  seed.maintenance[0].endAt = Date.parse(`${date}T11:00:00+07:00`)
  await page.addInitScript(
    (data) =>
      localStorage.setItem("sthana:static-data:v1", JSON.stringify(data)),
    seed
  )
  await enterDemo(page, "Petugas")
  await page.goto("/staff/maintenance")
  await page.getByRole("button", { name: "Perpanjang", exact: true }).click()
  const dialog = page.getByRole("dialog", {
    name: "Perpanjang perbaikan",
    exact: true,
  })
  await dialog.getByRole("button", { name: /^Tanggal selesai baru:/ }).click()
  const calendar = page.getByRole("dialog", {
    name: "Pilih tanggal selesai baru",
    exact: true,
  })
  const priorDay = new Date(`${date}T00:00:00Z`)
  priorDay.setUTCDate(priorDay.getUTCDate() - 1)
  const priorLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(priorDay)
  if (priorDay.getUTCMonth() === new Date(`${date}T00:00:00Z`).getUTCMonth()) {
    await expect(
      calendar.getByRole("button", { name: priorLabel, exact: true })
    ).toBeDisabled()
  }
  await page.keyboard.press("Escape")
  const time = dialog.getByRole("combobox", {
    name: "Jam selesai baru",
    exact: true,
  })
  await time.click()
  await expect(
    dialog.getByRole("option", { name: "11.00", exact: true })
  ).toHaveAttribute("aria-disabled", "true")
  await dialog.getByRole("option", { name: "11.30", exact: true }).click()
  const nextDate = new Date(Date.parse(`${date}T00:00:00Z`) + 86400000)
    .toISOString()
    .slice(0, 10)
  await chooseCalendarDate(page, "Tanggal selesai baru", nextDate)
  await expect(time).toContainText("Pilih jam")
  await time.click()
  await dialog.getByRole("option", { name: "07.30", exact: true }).click()
  await dialog.getByRole("button", { name: "Perpanjang", exact: true }).click()
  await expect(
    page.getByText("Perbaikan diperpanjang", { exact: true })
  ).toBeVisible()
  await expect(dialog).toBeHidden()
  const endAt = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("sthana:static-data:v1")!)
    return data.maintenance.find(
      (item: { id: string }) => item.id === "demo-maintenance-studio"
    ).endAt
  })
  expect(endAt).toBe(Date.parse(`${nextDate}T07:30:00+07:00`))
})

test("kalender reservasi tetap dapat dipakai di luar dialog", async ({
  page,
}) => {
  await enterDemo(page, "Pengguna")
  await page.goto("/app/reservations/new")
  await chooseCalendarDate(page, "Tanggal reservasi", tomorrowInJakarta())
  await expect(
    page.getByRole("button", { name: /^Tanggal reservasi:/ })
  ).toBeVisible()
  await expect(page.getByRole("dialog")).toHaveCount(0)
})
