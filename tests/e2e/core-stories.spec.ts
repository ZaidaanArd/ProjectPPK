import { expect, test } from "@playwright/test"

import {
  enterDemo,
  chooseCalendarDate,
  expectScrollUnlocked,
  scheduleRepair,
  tomorrowInJakarta,
} from "./helpers"

test.skip(
  process.env.PLAYWRIGHT_STATIC_MODE !== "1" ||
    !process.env.PLAYWRIGHT_BASE_URL?.startsWith("http://localhost:"),
  "Tes ini hanya untuk demo statis lokal; tidak mengubah data production."
)

test("US-09: slot reservasi yang sudah disetujui ditandai terisi", async ({
  page,
}) => {
  await enterDemo(page, "Pengguna")
  await page.goto("/app/reservations/new")
  await page.getByText("Aula Gedung A", { exact: true }).click()
  await expect(
    page.getByRole("button", { name: /09.00.*Terisi/ })
  ).toBeDisabled()
})

test("US-10: pembatalan meminta alasan dan memfokuskan input", async ({
  page,
}) => {
  await enterDemo(page, "Petugas")
  await page.goto("/staff/reservations")
  await expect(page.getByRole("tab", { name: /Menunggu/ })).toBeVisible()
  await expect(page.getByRole("tab", { name: /Disetujui/ })).toBeVisible()
  await expect(page.getByRole("tab", { name: /Riwayat/ })).toBeVisible()
  await page.getByRole("button", { name: "Batalkan" }).first().click()
  await expect(page.getByText("Isi alasan pembatalan sebelum")).toBeVisible()
  const reason = page
    .getByRole("textbox", { name: "Catatan keputusan" })
    .first()
  await expect(reason).toBeFocused()
  await reason.fill("Pemohon membatalkan kegiatan")
  await page.getByRole("button", { name: "Batalkan" }).first().click()
  await expect(page.getByText("Batalkan reservasi ini?")).toBeVisible()
  await page.getByRole("button", { name: "Ya, batalkan" }).click()
  await expect(page.getByRole("status")).toContainText("Reservasi dibatalkan")
  await expect(page.getByText("Praktikum bersama")).toBeHidden()
  await page.getByRole("tab", { name: /Riwayat/ }).click()
  await expect(page.getByText("Praktikum bersama")).toBeVisible()
  await expect(
    page.getByText("Dibatalkan", { exact: true }).first()
  ).toBeVisible()
})

test("US-10: keputusan setujui memerlukan konfirmasi", async ({ page }) => {
  await enterDemo(page, "Petugas")
  await page.goto("/staff/reservations")
  await expect(page.getByText("Praktikum bersama")).toBeVisible()
  await page.getByRole("button", { name: "Setujui" }).click()
  await expect(page.getByText("Setujui reservasi ini?")).toBeVisible()
  await page.getByRole("button", { name: "Batal" }).click()
  await expect(page.getByText("Setujui reservasi ini?")).toBeHidden()
  await expect(page.getByText("Praktikum bersama")).toBeVisible()

  await page.getByRole("button", { name: "Setujui" }).click()
  await page.getByRole("button", { name: "Ya, setujui" }).click()
  await expect(page.getByRole("status")).toContainText("Reservasi disetujui")
  await expect(page.getByText("Praktikum bersama")).toBeHidden()
  await page.getByRole("tab", { name: /Disetujui/ }).click()
  await expect(page.getByText("Praktikum bersama")).toBeVisible()
})

test("US-11/12: mulai tanpa catatan, jadwalkan perbaikan, lalu selesai", async ({
  page,
}) => {
  await enterDemo(page, "Petugas")
  await page.goto("/staff/reports")
  await page.getByRole("button", { name: "Mulai tangani" }).click()
  await expect(page.getByRole("status")).toContainText(
    "Laporan mulai ditangani"
  )
  await page.getByRole("tab", { name: /Sedang ditangani/ }).click()
  await page.getByRole("button", { name: "Jadwalkan perbaikan" }).click()
  await scheduleRepair(page, {
    date: tomorrowInJakarta(),
    first: "08.00",
    last: "09.30",
    reason: "Ganti PC",
  })

  const lab = page
    .getByRole("list", { name: "Daftar fasilitas" })
    .locator("li")
    .filter({ hasText: "Lab Komputer 3" })
  await page.goto("/facilities")
  await expect(lab).toContainText("Perbaikan terjadwal")
  // Only the repair window is closed; the facility stays bookable.
  await expect(
    lab.getByRole("button", { name: "Cek Jadwal Slot" })
  ).toBeEnabled()

  await page.goto("/staff/reports?tab=ditangani")
  await page.getByRole("button", { name: "Selesaikan laporan" }).click()
  await expect(page.getByText("Isi catatan penanganan sebelum")).toBeVisible()
  await expect(page.getByText("Selesaikan laporan ini?")).toBeHidden()
  await page
    .getByRole("textbox", { name: "Catatan penanganan" })
    .fill("Komputer diperbaiki")
  await page.getByRole("button", { name: "Selesaikan laporan" }).click()
  await expect(page.getByText("Selesaikan laporan ini?")).toBeVisible()
  await page.getByRole("button", { name: "Ya, selesaikan" }).click()
  await expect(page.getByRole("status")).toContainText(
    "Laporan ditandai selesai"
  )
  // Closing the report cancels its repair that had not started yet.
  await page.goto("/facilities")
  await expect(lab).not.toContainText("Perbaikan terjadwal")
})

test("US-11: tolak laporan memerlukan catatan dan konfirmasi", async ({
  page,
}) => {
  await enterDemo(page, "Petugas")
  await page.goto("/staff/reports")
  await page.getByRole("button", { name: "Tolak" }).click()
  await expect(page.getByText("Isi catatan penanganan sebelum")).toBeVisible()
  await expect(page.getByText("Tolak laporan ini?")).toBeHidden()

  await page
    .getByRole("textbox", { name: "Catatan penanganan" })
    .fill("Bukan kendala fasilitas")
  await page.getByRole("button", { name: "Tolak" }).click()
  await expect(page.getByText("Tolak laporan ini?")).toBeVisible()
  await page.getByRole("button", { name: "Batal" }).click()
  await expect(page.getByText("Tolak laporan ini?")).toBeHidden()
  await expect(page.getByText("Menunggu", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Tolak" }).click()
  await page.getByRole("button", { name: "Ya, tolak" }).click()
  await expect(page.getByRole("status")).toContainText("Laporan ditolak")
  await page.getByRole("tab", { name: /Riwayat/ }).click()
  await expect(page.getByText("Ditolak", { exact: true }).first()).toBeVisible()
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

test("US-16: hapus fasilitas dari mode ubah memerlukan konfirmasi", async ({
  page,
}) => {
  await enterDemo(page, "Admin")
  await page.goto("/admin/facilities")
  await expect(page.getByText("Ruang Rapat Senat")).toBeVisible()

  await page.getByRole("button", { name: "Ubah Ruang Rapat Senat" }).click()
  await expect(page.getByText("Mode ubah")).toBeVisible()
  await page.getByRole("button", { name: "Hapus ruangan" }).click()
  await expect(page.getByText("Hapus ruangan ini?")).toBeVisible()

  const confirm = page
    .locator("dialog")
    .filter({ hasText: "Hapus ruangan ini?" })
  await confirm.getByRole("button", { name: "Batal" }).click()
  await expect(page.getByText("Hapus ruangan ini?")).toBeHidden()
  await expect(page.getByText("Ruang Rapat Senat").first()).toBeVisible()

  await page.getByRole("button", { name: "Hapus ruangan" }).click()
  await confirm.getByRole("button", { name: "Ya, hapus" }).click()
  await expect(page.getByRole("status")).toContainText(
    "Fasilitas Ruang Rapat Senat berhasil dihapus"
  )
  await expect(
    page.getByRole("button", { name: "Ubah Ruang Rapat Senat" })
  ).toBeHidden()
  await expectScrollUnlocked(page)

  await page.getByRole("button", { name: "Ubah Lab Komputer 3" }).click()
  await page.getByRole("button", { name: "Hapus ruangan" }).click()
  await confirm.getByRole("button", { name: "Ya, hapus" }).click()
  await expect(
    confirm.getByText("masih memiliki reservasi aktif")
  ).toBeVisible()
  await expect(page.getByText("Lab Komputer 3").first()).toBeVisible()
})

test("Portal pengguna: reservasi & laporan dipisah per tab", async ({
  page,
}) => {
  await enterDemo(page, "Pengguna")

  await page.goto("/app/reservations")
  await expect(page.getByRole("tab", { name: /Menunggu/ })).toBeVisible()
  await expect(page.getByRole("tab", { name: /Disetujui/ })).toBeVisible()
  await expect(page.getByRole("tab", { name: /Riwayat/ })).toBeVisible()
  await expect(page.getByText("Praktikum bersama")).toBeVisible()
  await page.getByRole("tab", { name: /Disetujui/ }).click()
  await expect(page.getByText("Seminar kampus")).toBeVisible()
  await expect(page.getByText("Praktikum bersama")).toBeHidden()
  await page.getByRole("tab", { name: /Riwayat/ }).click()
  await expect(page.getByText("Belum ada riwayat reservasi.")).toBeVisible()

  await page.goto("/app/reports")
  await expect(page.getByRole("tab", { name: /Menunggu/ })).toBeVisible()
  await expect(page.getByRole("tab", { name: /Ditangani/ })).toBeVisible()
  await expect(page.getByRole("tab", { name: /Riwayat/ })).toBeVisible()
  await expect(page.getByText("Satu komputer tidak menyala.")).toBeVisible()
  await page.getByRole("tab", { name: /Riwayat/ }).click()
  await expect(page.getByText("Belum ada riwayat laporan.")).toBeVisible()
})

test("Portal pengguna: tombol kembali di halaman bertingkat", async ({
  page,
}) => {
  await enterDemo(page, "Pengguna")

  await page.goto("/app/reports/new")
  await page.getByRole("link", { name: "Kembali" }).click()
  await expect(page).toHaveURL(/\/app\/reports$/)

  await page.goto("/app/reservations/new")
  await page.getByRole("link", { name: "Kembali" }).click()
  await expect(page).toHaveURL(/\/app\/reservations$/)
})

test("Portal pengguna: konfirmasi sebelum kirim reservasi & laporan", async ({
  page,
}) => {
  await enterDemo(page, "Pengguna")

  await page.goto("/app/reservations/new")
  await page.getByText("Aula Gedung A", { exact: true }).click()
  await page.getByLabel("Tujuan penggunaan").fill("Diskusi kelompok")
  await page.getByRole("button", { name: "Kirim reservasi" }).click()
  await expect(page.getByText("Ajukan reservasi ini?")).toBeVisible()
  await page.getByRole("button", { name: "Batal" }).click()
  await expect(page.getByText("Ajukan reservasi ini?")).toBeHidden()
  await page.getByRole("button", { name: "Kirim reservasi" }).click()
  await page.getByRole("button", { name: "Ya, kirim" }).click()
  await expect(page.getByText("Berhasil dikirim ya!")).toBeVisible()
  await page.getByRole("button", { name: "Ajukan reservasi lain" }).click()
  await expect(page.getByText("Berhasil dikirim ya!")).toBeHidden()
  await expectScrollUnlocked(page)

  await page.goto("/app/reports/new")
  await page.getByText("Aula Gedung A", { exact: true }).click()
  await page.getByLabel("Kategori").fill("AC")
  await page.getByLabel("Deskripsi").fill("AC tidak dingin")
  await page.getByRole("button", { name: "Kirim laporan" }).click()
  await expect(page.getByText("Kirim laporan ini?")).toBeVisible()
  await page.getByRole("button", { name: "Ya, kirim" }).click()
  await expect(page.getByText("Berhasil dikirim ya!")).toBeVisible()
  await page.getByRole("button", { name: "Buat laporan lain" }).click()
  await expect(page.getByText("Berhasil dikirim ya!")).toBeHidden()
  await expectScrollUnlocked(page)

  await page.getByRole("link", { name: "Laporan" }).first().click()
  await expect(page).toHaveURL(/\/app\/reports$/)
  await page.getByRole("link", { name: "Buat laporan" }).first().click()
  await expect(page).toHaveURL(/\/app\/reports\/new$/)
  await expectScrollUnlocked(page)
})

test("Beranda pengguna: jadwal terdekat, laporan aktif, dan aktivitas", async ({
  page,
}) => {
  await enterDemo(page, "Pengguna")
  await expect(
    page.getByRole("heading", { name: "Jadwal terdekat" })
  ).toBeVisible()
  await expect(page.getByText("Seminar kampus").first()).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Pelacak laporan aktif" })
  ).toBeVisible()
  await expect(page.getByText("Tahap: Menunggu")).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Aktivitas terbaru" })
  ).toBeVisible()
  await expect(page.getByText("Mulai dari sini")).toBeVisible()
})

test("Beranda petugas: butuh tindakan dan jadwal hari ini", async ({
  page,
}) => {
  await enterDemo(page, "Petugas")

  await expect(
    page.getByRole("heading", { name: "Reservasi menunggu" })
  ).toBeVisible()
  await expect(page.getByText("Praktikum bersama")).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Laporan baru" })
  ).toBeVisible()
  await expect(page.getByText("Perangkat").first()).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Jadwal hari ini" })
  ).toBeVisible()
  await expect(page.getByText("Kuliah tamu")).toBeVisible()
  await expect(page.getByText("Ruang Seminar 2")).toBeVisible()

  await expect(
    page.getByRole("link", { name: "Tinjau", exact: true })
  ).toHaveAttribute("href", "/staff/reservations?tab=menunggu")
  await expect(
    page.getByRole("link", { name: "Tangani", exact: true })
  ).toHaveAttribute("href", "/staff/reports?tab=baru")
})

test("Logo sidebar membuka beranda publik", async ({ page }) => {
  await enterDemo(page, "Petugas")
  await page.getByRole("link", { name: "Sthana Kampus — Beranda" }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole("link", { name: "Tentang" })).toBeVisible()
})

test("Halaman fasilitas publik: chips, filter aktif, urutkan, dan status perawatan", async ({
  page,
}) => {
  await page.goto("/facilities")
  await expect(
    page.getByText("6 fasilitas ditemukan", { exact: true })
  ).toBeVisible()

  await page.getByRole("button", { name: "Aula", exact: true }).click()
  await expect(
    page.getByText("1 fasilitas ditemukan", { exact: true })
  ).toBeVisible()
  await expect(page.getByText("Aula Gedung A")).toBeVisible()
  await expect(page.getByText("Lab Komputer 3")).toBeHidden()

  await page.getByRole("button", { name: "Hapus filter Tipe: Aula" }).click()
  await expect(
    page.getByText("6 fasilitas ditemukan", { exact: true })
  ).toBeVisible()

  await page.getByRole("combobox", { name: "Urutkan" }).click()
  await page.getByRole("option", { name: "Kapasitas terbesar" }).click()
  await expect(
    page.getByRole("list", { name: "Daftar fasilitas" }).locator("li").first()
  ).toContainText("Aula Gedung A")

  const studio = page
    .getByRole("list", { name: "Daftar fasilitas" })
    .locator("li")
    .filter({ hasText: "Studio Multimedia" })
  // The seeded repair is ongoing, but only its own time range is closed.
  await expect(studio).toContainText("Dalam perbaikan s.d.")
  await expect(
    studio.getByRole("button", { name: "Cek Jadwal Slot" })
  ).toBeEnabled()
})

test("US-12: perbaikan hanya di slot kosong dan menutup slot itu bagi pengguna", async ({
  page,
}) => {
  const date = tomorrowInJakarta()
  await enterDemo(page, "Petugas")
  await page.goto("/staff/maintenance")
  await page.getByRole("button", { name: "Jadwalkan perbaikan" }).click()
  const dialog = page.getByRole("dialog", { name: "Jadwalkan perbaikan" })
  await dialog.getByRole("combobox", { name: "Fasilitas", exact: true }).click()
  await dialog
    .getByRole("option", { name: "Lab Komputer 3", exact: true })
    .click()
  await chooseCalendarDate(page, "Tanggal perbaikan", date)
  // The pending 13.00–14.00 request holds its slots: repairs yield.
  await expect(
    dialog.getByRole("button", { name: "13.00 · Terisi" })
  ).toBeDisabled()
  await expect(dialog).toContainText("1 reservasi menunggu")
  await dialog.getByRole("button", { name: "10.00 · Tersedia" }).click()
  await dialog.getByRole("button", { name: "11.30 · Tersedia" }).click()
  await dialog.getByLabel("Alasan perbaikan").fill("Ganti kabel jaringan")
  await dialog.getByRole("button", { name: "Simpan jadwal" }).click()
  await expect(page.getByText("Perbaikan dijadwalkan")).toBeVisible()
  await expect(
    page.getByRole("paragraph").filter({ hasText: "Ganti kabel jaringan" })
  ).toBeVisible()

  await enterDemo(page, "Pengguna")
  await page.goto(`/app/reservations/new?facility=demo-lab&date=${date}`)
  await expect(page.getByText("Jadwal perbaikan:")).toBeVisible()
  await expect(
    page.getByRole("button", { name: /10.00.*Terisi/ })
  ).toBeDisabled()
  await expect(
    page.getByRole("button", { name: /12.00.*Tersedia/ })
  ).toBeEnabled()
})

test("Bagikan: kartu reservasi dapat diunduh sebagai story gelap", async ({
  page,
}) => {
  await enterDemo(page, "Pengguna")
  await page.goto("/app/reservations")
  await page.getByRole("tab", { name: /Disetujui/ }).click()
  await page.getByRole("button", { name: "Bagikan" }).first().click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByRole("heading", { name: /^Bagikan / })).toBeVisible()
  await dialog.getByRole("button", { name: "Story" }).click()
  await dialog.getByRole("button", { name: "Gelap", exact: true }).click()
  await expect(
    dialog.getByRole("button", { name: "Gelap", exact: true })
  ).toHaveAttribute("aria-pressed", "true")
  await expect(
    dialog.getByRole("link", { name: "Kirim lewat WhatsApp" })
  ).toHaveAttribute("href", /wa\.me/)
  const downloadPromise = page.waitForEvent("download")
  await dialog.getByRole("button", { name: "Unduh gambar" }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(
    /^sthana-reservasi-.+-story\.png$/
  )
})
