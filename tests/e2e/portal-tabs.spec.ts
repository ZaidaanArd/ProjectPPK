import { expect, test } from "@playwright/test"

import { initialStaticData } from "../../src/lib/static-data"
import { enterDemo } from "./helpers"

test.skip(
  process.env.PLAYWRIGHT_STATIC_MODE !== "1" ||
    !process.env.PLAYWRIGHT_BASE_URL?.startsWith("http://localhost:"),
  "Pengujian tab memakai demo statis lokal."
)

for (const role of ["Pengguna", "Petugas"] as const) {
  for (const collection of ["reservations", "reports"] as const) {
    test(`tab ${collection} ${role} sejajar dan dapat dioperasikan`, async ({
      page,
    }, testInfo) => {
      const data = structuredClone(initialStaticData)
      data.reservations = Array.from({ length: 100 }, (_, index) => ({
        ...data.reservations[1],
        id: `demo-reservation-tab-${index}`,
      }))
      data.reports = Array.from({ length: 100 }, (_, index) => ({
        ...data.reports[0],
        id: `demo-report-tab-${index}`,
      }))
      await page.addInitScript((seed) => {
        if (!localStorage.getItem("sthana:static-data:v1")) {
          localStorage.setItem("sthana:static-data:v1", JSON.stringify(seed))
        }
      }, data)
      await enterDemo(page, role)
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto(`/${role === "Pengguna" ? "app" : "staff"}/${collection}`)
      const list = page.getByRole("tablist")
      const tabs = list.getByRole("tab")
      await expect(tabs).toHaveCount(3)
      await expect(tabs.nth(0).locator('[data-slot="tabs-count"]')).toHaveText(
        "100"
      )
      await expect(tabs.nth(2).locator('[data-slot="tabs-count"]')).toHaveText(
        "0"
      )

      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        for (const dark of [false, true]) {
          await page.evaluate(
            (enabled) =>
              document.documentElement.classList.toggle("dark", enabled),
            dark
          )
          const boxes = await tabs.evaluateAll((items) =>
            items.map((item) => {
              const { x, y, width, height } = item.getBoundingClientRect()
              return { x, y, width, height }
            })
          )
          expect(
            Math.max(...boxes.map((box) => box.y)) -
              Math.min(...boxes.map((box) => box.y))
          ).toBeLessThan(1)
          expect(
            Math.max(...boxes.map((box) => box.width)) -
              Math.min(...boxes.map((box) => box.width))
          ).toBeLessThan(1)
          expect(
            boxes.every((box) => box.x >= 0 && box.x + box.width <= width)
          ).toBe(true)
          const overflow = await page.evaluate(() => {
            if (document.documentElement.scrollWidth <= window.innerWidth)
              return []
            return Array.from(document.querySelectorAll("main *"))
              .filter(
                (element) =>
                  element.getBoundingClientRect().right > window.innerWidth + 1
              )
              .slice(0, 10)
              .map((element) => ({
                tag: element.tagName,
                className: element.className,
                right: element.getBoundingClientRect().right,
              }))
          })
          expect(overflow, `Overflow pada lebar ${width}`).toEqual([])
          const colors = await tabs.evaluateAll((items) =>
            items.map((item) => {
              const styles = getComputedStyle(item)
              return [styles.backgroundColor, styles.color]
            })
          )
          expect(colors[0]).not.toEqual(colors[1])
          await list.screenshot({
            path: testInfo.outputPath(
              `${width}-${dark ? "dark" : "light"}.png`
            ),
          })
        }
      }

      await tabs.nth(2).click()
      await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true")
      await expect(page.getByRole("tabpanel")).toContainText(
        collection === "reservations"
          ? "Belum ada riwayat reservasi."
          : "Belum ada riwayat laporan."
      )
      await tabs.nth(0).click()
      await tabs.nth(0).press("ArrowRight")
      await expect(tabs.nth(1)).toBeFocused()
      await tabs.nth(1).press("ArrowLeft")
      await expect(tabs.nth(0)).toBeFocused()
      await tabs.nth(0).press("Enter")
      await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true")
    })
  }
}
