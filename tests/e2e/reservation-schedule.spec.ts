import { expect, test } from "@playwright/test"
import { enterDemo } from "./helpers"

test.skip(
  process.env.PLAYWRIGHT_STATIC_MODE !== "1" ||
    !process.env.PLAYWRIGHT_BASE_URL?.startsWith("http://localhost:"),
  "Local demo only; never writes production data."
)
const date = "2027-10-01"
const at = (time: string) => Date.parse(`${date}T${time}:00+07:00`)
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(at("07:31")))
  await page.addInitScript(
    ({ date }) => {
      if (localStorage.getItem("sthana:static-data:v1")) return
      const at = (time: string) => Date.parse(`${date}T${time}:00+07:00`)
      const createdAt = at("07:00")
      const base = { createdAt, updatedAt: createdAt }
      localStorage.setItem(
        "sthana:static-data:v1",
        JSON.stringify({
          version: 1,
          accounts: [
            {
              id: "demo-user",
              name: "Pengguna QA",
              email: "user@example.test",
              role: "user",
              status: "active",
              mustChangePassword: false,
              ...base,
            },
            {
              id: "demo-officer",
              name: "Petugas QA",
              email: "staff@example.test",
              role: "officer",
              status: "active",
              mustChangePassword: false,
              ...base,
            },
            {
              id: "demo-admin",
              name: "Admin QA",
              email: "admin@example.test",
              role: "admin",
              status: "active",
              mustChangePassword: false,
              ...base,
            },
          ],
          facilities: [
            {
              id: "qa-facility",
              name: "Aula QA",
              type: "Aula",
              location: "Gedung QA",
              capacity: 50,
              description: "Ruang uji",
              status: "active",
              ...base,
            },
          ],
          reservations: [
            {
              id: "qa-approved",
              userId: "demo-user",
              facilityId: "qa-facility",
              purpose: "Agenda lama",
              startAt: at("09:00"),
              endAt: at("10:00"),
              status: "approved",
              ...base,
            },
            {
              id: "qa-pending",
              userId: "other-user",
              facilityId: "qa-facility",
              purpose: "Agenda lain",
              startAt: at("17:00"),
              endAt: at("18:00"),
              status: "pending",
              ...base,
            },
          ],
          reports: [],
          maintenance: [],
          reservationChanges: [],
        })
      )
    },
    { date }
  )
})

test("elapsed slots are disabled and pending slots remain selectable in the form", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(at("15:30")))
  await enterDemo(page, "Pengguna")
  await page.goto(`/app/reservations/new?facility=qa-facility&date=${date}`)
  await expect(
    page.getByRole("button", { name: "15.30 · Sudah lewat", exact: true })
  ).toBeDisabled()
  await expect(
    page.getByRole("button", { name: "16.00 · Tersedia", exact: true })
  ).toBeEnabled()
  await expect(
    page.getByRole("button", {
      name: "17.00 · Ada pengajuan, tetap dapat diajukan",
      exact: true,
    })
  ).toBeEnabled()
  await page
    .getByRole("button", {
      name: "17.00 · Ada pengajuan, tetap dapat diajukan",
      exact: true,
    })
    .click()
  await expect(
    page
      .getByRole("button", { name: /Kirim reservasi|Ajukan reservasi/ })
      .last()
  ).toBeEnabled()
  await page.screenshot({
    path: test.info().outputPath("elapsed-and-pending.png"),
    fullPage: true,
  })
})

test("schedule change keeps original until staff approval and survives refresh", async ({
  page,
}) => {
  await enterDemo(page, "Pengguna")
  await page.goto("/app/reservations")
  await page.getByRole("tab", { name: /Disetujui/ }).click()
  await page.getByRole("button", { name: "Ubah jadwal" }).click()
  const dialog = page.getByRole("dialog", { name: "Ajukan perubahan jadwal" })
  await dialog
    .getByRole("button", { name: "11.00 · Tersedia", exact: true })
    .click()
  await dialog
    .getByRole("button", { name: "11.30 · Tersedia", exact: true })
    .click()
  await dialog.getByLabel("Alasan perubahan").fill("Agenda berubah")
  await dialog
    .getByRole("button", { name: "Ajukan perubahan", exact: true })
    .click()
  await expect(dialog).toBeHidden()
  await expect(page.getByTestId("schedule-change-card")).toContainText(
    "Menunggu"
  )
  await expect(page.getByRole("button", { name: "Ubah jadwal" })).toBeDisabled()
  await page.reload()
  await expect(page.getByTestId("schedule-change-card")).toContainText(
    "Menunggu"
  )
  await page
    .getByRole("combobox", { name: "Ganti peran" })
    .selectOption("officer")
  await page.goto("/staff/reservations")
  await page.getByRole("button", { name: "Setujui perubahan" }).click()
  const confirm = page.getByRole("dialog", { name: "Setujui jadwal baru?" })
  await expect(confirm).toContainText("Slot lama dilepas setelah berhasil")
  await confirm.getByRole("button", { name: "Konfirmasi" }).click()
  await expect(confirm).toBeHidden()
  await expect(
    page.getByRole("button", { name: "Setujui perubahan" })
  ).toHaveCount(0)
  await page.getByRole("combobox", { name: "Ganti peran" }).selectOption("user")
  await page.goto("/app/reservations")
  await page.getByRole("tab", { name: /Disetujui/ }).click()
  await expect(
    page.getByRole("article").filter({ hasText: "Agenda lama" })
  ).toContainText("11.00–12.00 WIB")
  await page.getByText("Riwayat perubahan (1)").click()
  await expect(page.getByTestId("schedule-change-card")).toContainText(
    "Disetujui"
  )
  await page.screenshot({
    path: test.info().outputPath("approved-change.png"),
    fullPage: true,
  })
})

test("public calendar exposes pending hints without locking them, in mobile dark mode", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(at("15:30")))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/facilities")
  await page
    .getByRole("listitem")
    .filter({ hasText: "Aula QA" })
    .getByRole("button", { name: "Cek Jadwal Slot" })
    .click()
  const dialog = page.getByRole("dialog", { name: "Slot Waktu — Aula QA" })
  await dialog.getByRole("button", { name: /October 1st, 2027/ }).click()
  await expect(
    dialog.getByRole("button", { name: "15.30", exact: true })
  ).toBeDisabled()
  await expect(
    dialog.getByRole("button", { name: "16.00", exact: true })
  ).toBeEnabled()
  await expect(
    dialog.getByRole("button", { name: "17.00", exact: true })
  ).toBeEnabled()
  await expect(
    dialog.getByRole("button", { name: "17.00", exact: true })
  ).toHaveAttribute("title", /Ada pengajuan/)
  await expect(dialog).not.toContainText("Agenda lain")
  await page.screenshot({
    path: test.info().outputPath("public-mobile-dark.png"),
    fullPage: true,
  })
})
