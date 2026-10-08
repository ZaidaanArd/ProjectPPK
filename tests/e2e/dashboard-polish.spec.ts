import { expect, test } from "@playwright/test"

import { enterDemo } from "./helpers"
import { initialStaticData } from "../../src/lib/static-data"

test.skip(
  process.env.PLAYWRIGHT_STATIC_MODE !== "1" ||
    !process.env.PLAYWRIGHT_BASE_URL?.startsWith("http://localhost:"),
  "Pengujian dashboard memakai demo statis lokal."
)

test("aksi pengguna dan panduan tetap tersedia di header", async ({ page }) => {
  await enterDemo(page, "Pengguna")
  for (const [id, href] of [
    ["portal-reservation-action", "/app/reservations/new"],
    ["portal-report-action", "/app/reports/new"],
    ["portal-find-facilities", "/facilities"],
  ]) {
    const action = page.locator(`#${id}`)
    await expect(action).toHaveCount(1)
    await expect(action).toHaveAttribute("href", href)
    await expect(action).toBeInViewport()
  }
  await expect(page.getByText("Mulai dari sini", { exact: true })).toHaveCount(
    0
  )
  await expect(page.getByText("Tahap:", { exact: false })).toHaveCount(0)
  await page.getByRole("button", { name: "Buka panduan portal" }).click()
  for (const [title, id] of [
    ["Ringkasan aktivitas", "portal-home-summary"],
    ["Cari fasilitas", "portal-find-facilities"],
    ["Ajukan reservasi", "portal-reservation-action"],
    ["Buat laporan", "portal-report-action"],
  ]) {
    await expect(
      page
        .getByRole("dialog")
        .getByRole("heading", { name: title, exact: true })
    ).toBeVisible()
    await expect
      .poll(async () => {
        const target = await page.locator(`#${id}`).boundingBox()
        const pointer = await page
          .locator('[data-name="onborda-pointer"]')
          .boundingBox()
        if (!target || !pointer) return Infinity
        return Math.max(
          Math.abs(pointer.x - (target.x - 6)),
          Math.abs(pointer.y - (target.y - 6)),
          Math.abs(pointer.width - (target.width + 12)),
          Math.abs(pointer.height - (target.height + 12))
        )
      })
      .toBeLessThan(2)
    await page
      .getByRole("dialog")
      .getByRole("button", {
        name: title === "Buat laporan" ? "Selesai" : "Lanjut",
        exact: true,
      })
      .click()
  }
  await expect(page.getByRole("dialog")).toHaveCount(0)
})

test("semua langkah panduan tetap di dalam layar termasuk setelah resize", async ({
  page,
}) => {
  await enterDemo(page, "Pengguna")
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 600 })
    await page.getByRole("button", { name: "Buka panduan portal" }).click()
    const dialog = page.getByRole("dialog")
    for (const title of [
      "Ringkasan aktivitas",
      "Cari fasilitas",
      "Ajukan reservasi",
      "Buat laporan",
    ]) {
      await expect(
        dialog.getByRole("heading", { name: title, exact: true })
      ).toBeVisible()
      async function fitsViewport() {
        const bounds = await dialog.boundingBox()
        const viewport = page.viewportSize()!
        return (
          !!bounds &&
          bounds.x >= 15 &&
          bounds.y >= 15 &&
          bounds.x + bounds.width <= viewport.width - 15 &&
          bounds.y + bounds.height <= viewport.height - 15
        )
      }
      await expect.poll(fitsViewport).toBe(true)
      if (title === "Cari fasilitas") {
        await page.setViewportSize({
          width: width === 320 ? 390 : 320,
          height: 568,
        })
        await expect.poll(fitsViewport).toBe(true)
        await page.setViewportSize({ width, height: 600 })
        await expect.poll(fitsViewport).toBe(true)
      }
      await dialog
        .getByRole("button", {
          name: title === "Buat laporan" ? "Selesai" : "Lanjut",
          exact: true,
        })
        .click()
    }
    await expect(dialog).toHaveCount(0)
  }
})

test("tautan antrean membuka item dan mengikuti status terbaru", async ({
  page,
}) => {
  await enterDemo(page, "Petugas")
  await expect(page.getByText("Baru masuk", { exact: true })).toHaveCount(2)
  await page.getByRole("link", { name: "Tinjau", exact: true }).click()
  await expect(page).toHaveURL(/item=demo-reservation-pending/)
  await expect(
    page.locator("#queue-reservation-demo-reservation-pending")
  ).toBeFocused()
  await page.goto(
    "/staff/reservations?tab=menunggu&item=demo-reservation-approved"
  )
  await expect(page.getByRole("tab", { name: /Disetujui/ })).toHaveAttribute(
    "aria-selected",
    "true"
  )
  await expect(
    page.locator("#queue-reservation-demo-reservation-approved")
  ).toBeFocused()
  await page.goto("/staff")
  await page.getByRole("link", { name: "Tangani", exact: true }).click()
  await expect(page).toHaveURL(/item=demo-report/)
  await expect(page.locator("#queue-report-demo-report")).toBeFocused()
  await page.getByRole("button", { name: "Mulai tangani", exact: true }).click()
  await expect(page.locator("#queue-report-demo-report")).toHaveCount(0)
  await page.goto("/staff/reports?tab=baru&item=demo-report")
  await expect(
    page.getByRole("tab", { name: /Sedang ditangani/ })
  ).toHaveAttribute("aria-selected", "true")
  await expect(page.locator("#queue-report-demo-report")).toBeFocused()
  await page.getByRole("tab", { name: /Riwayat/ }).click()
  await expect(page.getByRole("tab", { name: /Riwayat/ })).toHaveAttribute(
    "aria-selected",
    "true"
  )
})

test("item hilang menampilkan pemberitahuan tanpa menghalangi antrean", async ({
  page,
}) => {
  await enterDemo(page, "Petugas")
  for (const [path, label] of [
    ["reservations", "Reservasi"],
    ["reports", "Laporan"],
  ]) {
    await page.goto(`/staff/${path}?item=tidak-tersedia`)
    await expect(
      page.getByText(`${label} yang dituju sudah tidak tersedia.`, {
        exact: false,
      })
    ).toBeVisible()
    await expect(page.getByRole("tab")).toHaveCount(3)
  }
})

test("grafik penggunaan dan semua unduhan admin tersedia", async ({ page }) => {
  await enterDemo(page, "Admin")
  const usage = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", {
      name: "Penggunaan fasilitas",
      exact: true,
    }),
  })
  await expect(usage.getByRole("listitem")).toHaveCount(6)
  await expect(
    usage.getByText("1 reservasi disetujui", { exact: true })
  ).toHaveCount(2)
  await expect(
    usage.getByText("0 reservasi disetujui", { exact: true })
  ).toHaveCount(4)
  await expect(
    usage.getByText("1 jam penggunaan · 0 laporan", { exact: true })
  ).toHaveCount(2)
  await expect(
    usage.getByText("0 menit penggunaan · 1 laporan", { exact: true })
  ).toBeVisible()
  for (const [label, kind] of [
    ["Rekap fasilitas CSV", "summary"],
    ["Reservasi CSV", "reservations"],
    ["Laporan CSV", "reports"],
  ]) {
    await page.getByRole("button", { name: "Unduh rekap" }).click()
    const downloading = page.waitForEvent("download")
    await page.getByRole("menuitem", { name: label, exact: true }).click()
    const download = await downloading
    expect(download.suggestedFilename()).toBe(`sthana-demo-${kind}.csv`)
    expect(await download.failure()).toBeNull()
  }
})

for (const role of ["Pengguna", "Petugas", "Admin"] as const) {
  test(`dashboard ${role} nyaman pada semua ukuran dan tema`, async ({
    page,
  }, testInfo) => {
    await enterDemo(page, role)
    await page.emulateMedia({ reducedMotion: "reduce" })
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const dark of [false, true]) {
        await page.evaluate(
          (enabled) =>
            document.documentElement.classList.toggle("dark", enabled),
          dark
        )
        await expect(
          page.locator("main").getByRole("heading", { level: 1 })
        ).toBeVisible()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          )
        ).toBe(true)
        await page.screenshot({
          path: testInfo.outputPath(
            `${role}-${width}-${dark ? "dark" : "light"}.png`
          ),
          fullPage: true,
        })
      }
    }
  })
}

for (const role of ["Pengguna", "Petugas", "Admin"] as const) {
  test(`dashboard ${role} menangani teks panjang dan data kosong`, async ({
    page,
  }) => {
    const data = structuredClone(initialStaticData)
    const longName =
      "Aula untuk kegiatan akademik dan organisasi mahasiswa dengan nama fasilitas yang panjang"
    data.facilities[0].name = longName
    data.facilities[0].location =
      "Gedung pusat kegiatan mahasiswa di kawasan kampus utama lantai dua sayap sebelah timur"
    data.reports[0].facilityId = data.facilities[0].id
    data.reservations[1].facilityId = data.facilities[0].id
    await page.addInitScript((seed) => {
      if (!localStorage.getItem("sthana:static-data:v1")) {
        localStorage.setItem("sthana:static-data:v1", JSON.stringify(seed))
      }
    }, data)
    await enterDemo(page, role)
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(
      page.locator("main").getByText(longName, { exact: false }).first()
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    await page.evaluate(() => {
      const seed = JSON.parse(localStorage.getItem("sthana:static-data:v1")!)
      seed.reservations = []
      seed.reports = []
      seed.facilities = []
      localStorage.setItem("sthana:static-data:v1", JSON.stringify(seed))
    })
    await page.reload()
    const emptyMessage =
      role === "Pengguna"
        ? "Belum ada jadwal terdekat."
        : role === "Petugas"
          ? "Tidak ada reservasi menunggu keputusan."
          : "Belum ada fasilitas untuk ditampilkan."
    await expect(page.getByText(emptyMessage, { exact: true })).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}

for (const count of [1, 3]) {
  test(`card Jadwal terdekat mengikuti ${count} jadwal dengan CTA di bawah`, async ({
    page,
  }) => {
    const now = Date.now()
    const hour = 60 * 60 * 1000
    const data = structuredClone(initialStaticData)
    const reservation = data.reservations[0]
    data.reservations = Array.from({ length: count }, (_, index) => ({
      ...reservation,
      id: `demo-upcoming-${index}`,
      status: "approved",
      startAt: now + (index + 1) * hour,
      endAt: now + (index + 2) * hour,
    }))
    const report = data.reports[0]
    data.reports = Array.from({ length: 3 }, (_, index) => ({
      ...report,
      id: `demo-polish-report-${index}`,
      status: index === 0 ? "in_progress" : "pending",
      updatedAt: now - index * 60_000,
    }))
    await page.addInitScript((seed) => {
      localStorage.setItem("sthana:static-data:v1", JSON.stringify(seed))
    }, data)
    await enterDemo(page, "Pengguna")

    const schedule = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByRole("heading", { name: "Jadwal terdekat" }) })
    const tracker = page.locator('[data-slot="card"]').filter({
      has: page.getByRole("heading", { name: "Pelacak laporan aktif" }),
    })
    const cta = schedule.getByRole("link", { name: "Buat reservasi baru" })

    await expect(schedule.getByRole("listitem")).toHaveCount(count)
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute("href", "/app/reservations/new")

    const lastItem = await schedule.getByRole("listitem").last().boundingBox()
    const scheduleBox = await schedule.boundingBox()
    const ctaBox = await cta.boundingBox()
    expect(lastItem).not.toBeNull()
    expect(scheduleBox).not.toBeNull()
    expect(ctaBox).not.toBeNull()
    if (!lastItem || !scheduleBox || !ctaBox) return

    expect(ctaBox.y).toBeGreaterThan(lastItem.y + lastItem.height - 1)
    const cardBottom = scheduleBox.y + scheduleBox.height
    expect(cardBottom - (ctaBox.y + ctaBox.height)).toBeLessThan(40)

    const trackerBox = await tracker.boundingBox()
    expect(trackerBox).not.toBeNull()
    if (trackerBox && (page.viewportSize()?.width ?? 0) >= 1024) {
      expect(Math.abs(scheduleBox.height - trackerBox.height)).toBeLessThan(2)
    }
  })
}
