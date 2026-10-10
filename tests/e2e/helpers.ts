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

/** Tomorrow's date in WIB as YYYY-MM-DD. */
export function tomorrowInJakarta() {
  return new Date(Date.now() + (7 + 24) * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

/** Chooses a future ISO date through the shared calendar UI. */
export async function chooseCalendarDate(
  page: Page,
  label: string,
  date: string
) {
  await page.getByRole("button", { name: new RegExp(`^${label}:`) }).click()
  const calendar = page.getByRole("dialog", {
    name: `Pilih ${label.toLowerCase()}`,
    exact: true,
  })
  const dayLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))
  const day = calendar.getByRole("button", { name: dayLabel, exact: true })
  for (let month = 0; month < 24 && !(await day.count()); month += 1) {
    await calendar.getByRole("button", { name: "Bulan berikutnya" }).click()
  }
  await day.click()
  await expect(calendar).toBeHidden()
}

/**
 * Fills the open "Jadwalkan perbaikan" dialog: picks `date`, clicks the first
 * and last slot of the range, writes a reason, and saves.
 */
export async function scheduleRepair(
  page: Page,
  options: { date: string; first: string; last: string; reason: string }
) {
  const dialog = page.getByRole("dialog", { name: "Jadwalkan perbaikan" })
  await chooseCalendarDate(page, "Tanggal perbaikan", options.date)
  await dialog
    .getByRole("button", { name: `${options.first} · Tersedia` })
    .click()
  await dialog
    .getByRole("button", { name: `${options.last} · Tersedia` })
    .click()
  await dialog.getByLabel("Alasan perbaikan").fill(options.reason)
  await dialog.getByRole("button", { name: "Simpan jadwal" }).click()
  await expect(page.getByText("Perbaikan dijadwalkan")).toBeVisible()
}
