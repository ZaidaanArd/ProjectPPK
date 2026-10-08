import { expect, test } from "@playwright/test"
import { enterDemo } from "./helpers"
import { initialStaticData } from "../../src/lib/static-data"

test.skip(process.env.PLAYWRIGHT_STATIC_MODE !== "1", "Memakai data demo lokal")

test("jadwal dan angka aktif mengikuti waktu tanpa reload", async ({
  page,
}) => {
  const now = Date.now()
  await page.clock.install({ time: now })
  const data = structuredClone(initialStaticData)
  data.reservations = [
    { ...data.reservations[0], startAt: now + 60_000, endAt: now + 120_000 },
  ]
  await page.addInitScript(
    (seed) =>
      localStorage.setItem("sthana:static-data:v1", JSON.stringify(seed)),
    data
  )
  await enterDemo(page, "Pengguna")
  const schedule = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("heading", { name: "Jadwal terdekat" }) })
  const metric = page
    .locator('[aria-label="Ringkasan dashboard"] > div > *')
    .filter({ has: page.getByText("Reservasi aktif", { exact: true }) })
  await expect(metric.getByText("1", { exact: true })).toBeVisible()
  await expect(
    schedule.getByText("1 menit lagi", { exact: true })
  ).toBeVisible()
  await page.clock.fastForward(60_000)
  await expect(schedule.getByText("Berlangsung", { exact: true })).toBeVisible()
  await page.clock.fastForward(60_000)
  await expect(metric.getByText("0", { exact: true })).toBeVisible()
  await expect(schedule.getByText("Belum ada jadwal terdekat.")).toBeVisible()
  await page.clock.setSystemTime(now + 90_000)
  await page.evaluate(() => window.dispatchEvent(new Event("focus")))
  await expect(schedule.getByText("Berlangsung", { exact: true })).toBeVisible()
  await page.clock.setSystemTime(now + 130_000)
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange"))
  )
  await expect(metric.getByText("0", { exact: true })).toBeVisible()
})

test("jadwal terdekat memberi label waktu relatif berbasis tanggal WIB", async ({
  page,
}) => {
  const hour = 60 * 60 * 1000
  // 10.00 WIB agar +2 jam tetap di hari yang sama.
  const now = Date.UTC(2026, 9, 6, 3, 0, 0)
  await page.clock.install({ time: now })
  const data = structuredClone(initialStaticData)
  const base = data.reservations[0]
  data.reservations = [2 * hour, 24 * hour, 48 * hour].map((offset, index) => ({
    ...base,
    id: `demo-relative-${index}`,
    status: "approved",
    startAt: now + offset,
    endAt: now + offset + hour,
  }))
  await page.addInitScript(
    (seed) =>
      localStorage.setItem("sthana:static-data:v1", JSON.stringify(seed)),
    data
  )
  await enterDemo(page, "Pengguna")
  const schedule = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("heading", { name: "Jadwal terdekat" }) })
  await expect(schedule.getByText("2 jam lagi", { exact: true })).toBeVisible()
  await expect(schedule.getByText("Besok", { exact: true })).toBeVisible()
  await expect(schedule.getByText("Lusa", { exact: true })).toBeVisible()
})

for (const kind of ["reservations", "reports"] as const) {
  test(`pencarian ${kind} mengikuti tab dan dapat dihapus`, async ({
    page,
  }) => {
    await enterDemo(page, "Petugas")
    await page.goto(`/staff/${kind}`)
    const input = page.getByRole("textbox", {
      name: kind === "reservations" ? "Cari reservasi" : "Cari laporan",
    })
    const card = page.locator(
      kind === "reservations"
        ? '[id^="queue-reservation-"]'
        : '[id^="queue-report-"]'
    )
    await input.fill("  LAB KOMPUTER  ")
    await expect(card).toHaveCount(1)
    await input.fill(kind === "reservations" ? "PENGGUNA DEMO" : "PERANGKAT")
    await expect(card).toHaveCount(1)
    await page.getByRole("tab", { name: /Riwayat/ }).click()
    await expect(input).toHaveValue(
      kind === "reservations" ? "PENGGUNA DEMO" : "PERANGKAT"
    )
    await expect(card).toHaveCount(0)
    await page.getByRole("tab").first().click()
    await input.fill("tidak ditemukan")
    await expect(card).toHaveCount(0)
    await page.getByRole("button", { name: "Hapus pencarian" }).click()
    await expect(input).toHaveValue("")
    await expect(card).toHaveCount(1)
    await input.fill("tidak ditemukan")
    const id =
      kind === "reservations" ? "demo-reservation-pending" : "demo-report"
    await page.goto(`/staff/${kind}?item=${id}`)
    await expect(input).toHaveValue("")
    await expect(card).toBeFocused()
  })
}

test("verifikasi akun admin membuka filter dan menerima URL invalid", async ({
  page,
}) => {
  await enterDemo(page, "Admin")
  await expect(page.getByText("1 akun menunggu verifikasi")).toBeVisible()
  await page.getByRole("link", { name: "Tinjau akun" }).click()
  await expect(page).toHaveURL(/status=pending/)
  await expect(
    page.getByRole("combobox", { name: "Status", exact: true })
  ).toContainText("Menunggu")
  await expect(
    page.getByRole("heading", { name: "Calon Pengguna", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Admin Demo", exact: true })
  ).toHaveCount(0)
  await page.goto("/admin/users?status=invalid")
  await expect(
    page.getByRole("combobox", { name: "Status", exact: true })
  ).toContainText("Semua")
  await expect(
    page.getByRole("heading", { name: "Admin Demo", exact: true })
  ).toBeVisible()
  const seed = structuredClone(initialStaticData)
  seed.accounts = seed.accounts.map((account) => ({
    ...account,
    status: "active",
  }))
  await page.evaluate(
    (data) =>
      localStorage.setItem("sthana:static-data:v1", JSON.stringify(data)),
    seed
  )
  await page.goto("/admin")
  await expect(page.getByText("0 akun menunggu verifikasi")).toBeVisible()
  await expect(page.getByRole("link", { name: "Tinjau akun" })).toHaveCount(0)
})

test("alasan tindakan akun muncul sesuai tindakan dan dapat dibatalkan", async ({
  page,
}) => {
  await enterDemo(page, "Admin")
  await page.goto("/admin/users")
  const candidate = page.locator("#account-demo-pending")
  const user = page.locator("#account-demo-user")
  await expect(page.getByRole("textbox", { name: /^Alasan/ })).toHaveCount(0)
  await candidate.getByRole("button", { name: "Tolak", exact: true }).click()
  const reason = candidate.getByRole("textbox", { name: "Alasan penolakan" })
  await expect(reason).toBeFocused()
  await candidate.getByRole("button", { name: "Konfirmasi penolakan" }).click()
  await expect(candidate.getByRole("alert")).toHaveText("Alasan wajib diisi.")
  await expect(candidate).toContainText("Menunggu")
  await candidate.getByRole("button", { name: "Batal", exact: true }).click()
  await expect(reason).toHaveCount(0)
  await expect(
    candidate.getByRole("button", { name: "Tolak", exact: true })
  ).toBeFocused()
  await user.getByRole("button", { name: "Nonaktifkan", exact: true }).click()
  await user
    .getByRole("textbox", { name: "Alasan penonaktifan" })
    .fill("Akun uji tidak digunakan")
  await user.getByRole("button", { name: "Konfirmasi nonaktifkan" }).click()
  await expect(user).toContainText("Nonaktif")
  await expect(user.getByRole("textbox")).toHaveCount(0)
  await user.getByRole("button", { name: "Aktifkan", exact: true }).click()
  await expect(user).toContainText("Aktif")
  await candidate.getByRole("button", { name: "Tolak", exact: true }).click()
  await reason.fill("Email tidak sesuai")
  await candidate.getByRole("button", { name: "Konfirmasi penolakan" }).click()
  await expect(candidate).toContainText("Ditolak")
  await expect(reason).toHaveCount(0)
})

test("toolbar antrean dan akun responsif dalam kedua tema", async ({
  page,
}, testInfo) => {
  await enterDemo(page, "Petugas")
  for (const route of [
    "/staff/reservations",
    "/staff/reports",
    "/admin/users",
  ]) {
    if (route.startsWith("/admin"))
      await page
        .getByRole("combobox", { name: "Ganti peran" })
        .selectOption("admin")
    await page.goto(route)
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const dark of [false, true]) {
        await page.evaluate(
          (value) => document.documentElement.classList.toggle("dark", value),
          dark
        )
        await expect(page.getByRole("textbox", { name: /^Cari/ })).toBeVisible()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true)
        if (width === 320 || width === 1440)
          await page.screenshot({
            path: testInfo.outputPath(
              `${route.replaceAll("/", "-")}-${width}-${dark}.png`
            ),
            fullPage: true,
          })
      }
    }
  }
})
