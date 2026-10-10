import path from "node:path"
import { expect, test, type Page } from "@playwright/test"

import { enterDemo, scheduleRepair, tomorrowInJakarta } from "./helpers"

// One walkthrough per user story (docs/REQUIREMENTS.md). With
// PLAYWRIGHT_SAVE_VIDEOS=1 each run is recorded to docs/videos/US-XX.webm.

test.skip(
  process.env.PLAYWRIGHT_STATIC_MODE !== "1" ||
    !process.env.PLAYWRIGHT_BASE_URL?.startsWith("http://localhost:"),
  "Tes ini hanya untuk demo statis lokal; tidak mengubah data production."
)

const saveVideos = process.env.PLAYWRIGHT_SAVE_VIDEOS === "1"
const videoDir = path.join(__dirname, "../../docs/videos")

test.use({
  viewport: { width: 1280, height: 720 },
  timezoneId: "Asia/Jakarta",
  video: saveVideos
    ? { mode: "on", size: { width: 1280, height: 720 } }
    : "retain-on-failure",
})

test.beforeEach(async ({ page }, testInfo) => {
  if (!saveVideos) return
  // Caption so each recording explains itself.
  await page.addInitScript((caption) => {
    const show = () => {
      if (document.getElementById("story-caption")) return
      const el = document.createElement("div")
      el.id = "story-caption"
      el.setAttribute("aria-hidden", "true")
      el.textContent = caption
      el.style.cssText =
        "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483647;max-width:90vw;padding:8px 16px;border-radius:999px;background:rgba(24,24,27,.88);color:#fff;font:600 14px/1.4 system-ui,sans-serif;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.25)"
      document.body.appendChild(el)
    }
    if (document.body) show()
    else document.addEventListener("DOMContentLoaded", show)
  }, testInfo.title)
})

test.afterEach(async ({ page }, testInfo) => {
  if (!saveVideos) return
  await beat(page, 1200)
  const video = page.video()
  await page.close()
  await video?.saveAs(path.join(videoDir, `${testInfo.title.slice(0, 5)}.webm`))
})

/** Short pause so viewers can follow the recording; no-op otherwise. */
function beat(page: Page, ms = 700) {
  return saveVideos ? page.waitForTimeout(ms) : Promise.resolve()
}

function tomorrowCell(page: Page) {
  return page
    .getByRole("gridcell", { name: /^Today/ })
    .locator("xpath=following::button[1]")
}

test("US-01: pengunjung melihat status slot tanpa detail pemohon", async ({
  page,
}) => {
  await page.goto("/facilities")
  await expect(
    page.getByRole("heading", { name: "Fasilitas kampus" })
  ).toBeVisible()
  await beat(page)
  await page
    .getByRole("listitem")
    .filter({ hasText: "Aula Gedung A" })
    .getByRole("button", { name: "Cek Jadwal Slot" })
    .click()
  const dialog = page.getByRole("dialog", {
    name: "Slot Waktu — Aula Gedung A",
  })
  await expect(dialog).toBeVisible()
  await beat(page)
  await tomorrowCell(page).click()
  await expect(dialog.getByText(/tersedia · \d+ terisi/)).toBeVisible()
  const slots = dialog.locator('[aria-label^="Slot Aula Gedung A tanggal"]')
  await expect(slots.getByRole("button", { name: "09.00" })).toBeDisabled()
  await expect(slots.getByRole("button", { name: "11.00" })).toBeEnabled()
  await expect(dialog).not.toContainText("Seminar kampus")
  await expect(dialog).not.toContainText("Pengguna Demo")
  await beat(page, 1500)
})

test("US-02: mencari fasilitas menurut tipe, lokasi, dan kapasitas", async ({
  page,
}) => {
  await page.goto("/facilities")
  await expect(
    page.getByText("6 fasilitas ditemukan", { exact: true })
  ).toBeVisible()
  await beat(page)

  await page.getByRole("combobox", { name: "Tipe" }).locator("svg").click()
  await page.getByRole("option", { name: "Laboratorium", exact: true }).click()
  await expect(
    page.getByText("2 fasilitas ditemukan", { exact: true })
  ).toBeVisible()
  await beat(page)
  await page
    .getByRole("button", { name: "Hapus filter Tipe: Laboratorium" })
    .click()

  await page.getByRole("textbox", { name: "Cari fasilitas" }).fill("Rektorat")
  await expect(
    page.getByText("1 fasilitas ditemukan", { exact: true })
  ).toBeVisible()
  await expect(page.getByText("Ruang Rapat Senat")).toBeVisible()
  await beat(page)
  await page.getByRole("textbox", { name: "Cari fasilitas" }).fill("")

  await page.getByRole("combobox", { name: "Urutkan" }).locator("svg").click()
  await page.getByRole("option", { name: "Kapasitas terbesar" }).click()
  await expect(
    page.getByRole("list", { name: "Daftar fasilitas" }).locator("li").first()
  ).toContainText("Aula Gedung A")
  await beat(page, 1500)
})

test("US-03: pengguna mengajukan reservasi dengan tujuan penggunaan", async ({
  page,
}) => {
  await enterDemo(page, "Pengguna")
  await page.goto("/app/reservations/new")
  await page.getByText("Aula Gedung A", { exact: true }).click()
  await beat(page)
  await expect(
    page.getByRole("button", { name: /09.00.*Terisi/ })
  ).toBeDisabled()
  await beat(page)
  await page.getByRole("button", { name: "11.00 · Tersedia" }).click()
  await beat(page, 400)
  await page.getByRole("button", { name: "11.30 · Tersedia" }).click()
  await expect(page.getByText("1 jam", { exact: true })).toBeVisible()
  await page.getByLabel("Tujuan penggunaan").fill("Rapat himpunan mahasiswa")
  await beat(page)
  await page.getByRole("button", { name: "Kirim reservasi" }).click()
  await expect(page.getByText("Ajukan reservasi ini?")).toBeVisible()
  await beat(page)
  await page.getByRole("button", { name: "Ya, kirim" }).click()
  await expect(page.getByText("Berhasil dikirim ya!")).toBeVisible()
  await beat(page, 1500)

  await page.goto("/app/reservations")
  await expect(page.getByText("Rapat himpunan mahasiswa")).toBeVisible()
  await expect(page.getByRole("tab", { name: /Menunggu 2/ })).toBeVisible()
})

test("US-04: pengguna membatalkan reservasinya sendiri", async ({ page }) => {
  await enterDemo(page, "Pengguna")
  await page.goto("/app/reservations")
  const pending = page
    .getByRole("tabpanel")
    .filter({ hasText: "Praktikum bersama" })
  await expect(pending).toBeVisible()
  await beat(page)
  await pending.getByRole("button", { name: "Batalkan" }).click()
  await expect(page.getByText("Reservasi berhasil dibatalkan")).toBeVisible()
  await beat(page)
  await page.getByRole("tab", { name: /Riwayat/ }).click()
  await expect(page.getByText("Praktikum bersama")).toBeVisible()
  await expect(
    page.getByText("Dibatalkan", { exact: true }).first()
  ).toBeVisible()
  await beat(page, 1500)
})

test("US-05: pengguna melihat riwayat dan detail reservasinya", async ({
  page,
}) => {
  await enterDemo(page, "Pengguna")
  await page.goto("/app/reservations")
  await expect(page.getByText("Praktikum bersama")).toBeVisible()
  await expect(page.getByText("13.00–14.00 WIB")).toBeVisible()
  await beat(page)
  await page.getByRole("tab", { name: /Disetujui/ }).click()
  await expect(page.getByText("Seminar kampus")).toBeVisible()
  await expect(page.getByText("Kuliah tamu")).toBeVisible()
  await beat(page)
  await page.getByRole("tab", { name: /Riwayat/ }).click()
  await expect(page.getByText("Belum ada riwayat reservasi.")).toBeVisible()
  await beat(page, 1500)
})

test("US-06: pengguna melaporkan kerusakan dengan kategori, deskripsi, dan foto", async ({
  page,
}) => {
  await enterDemo(page, "Pengguna")
  await page.goto("/app/reports/new")
  await page.getByText("Aula Gedung A", { exact: true }).click()
  await page.getByLabel("Kategori").fill("Proyektor")
  await page
    .getByLabel("Deskripsi")
    .fill("Proyektor utama berkedip saat dipakai.")
  await beat(page)

  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: "catatan.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("bukan gambar"),
  })
  await expect(
    page.getByText(
      "Foto harus berformat JPG, PNG, atau WebP dan maksimal 5 MB."
    )
  ).toBeVisible()
  await beat(page)

  await fileInput.setInputFiles({
    name: "proyektor.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    ),
  })
  await expect(page.getByText("proyektor.png")).toBeVisible()
  await beat(page)
  await page.getByRole("button", { name: "Kirim laporan" }).click()
  await expect(page.getByText("Kirim laporan ini?")).toBeVisible()
  await page.getByRole("button", { name: "Ya, kirim" }).click()
  await expect(page.getByText("Berhasil dikirim ya!")).toBeVisible()
  await beat(page, 1500)

  await page.goto("/app/reports")
  await expect(
    page.getByText("Proyektor utama berkedip saat dipakai.")
  ).toBeVisible()
})

test("US-07: pengguna melihat status laporan miliknya", async ({ page }) => {
  await enterDemo(page, "Petugas")
  await page.goto("/staff/reports")
  await page.getByRole("button", { name: "Mulai tangani" }).click()
  await expect(page.getByRole("status")).toContainText(
    "Laporan mulai ditangani"
  )
  await beat(page)

  await enterDemo(page, "Pengguna")
  await page.goto("/app/reports")
  await expect(page.getByRole("tab", { name: /Menunggu/ })).toBeVisible()
  await beat(page)
  await page.getByRole("tab", { name: /Ditangani/ }).click()
  await expect(page.getByText("Satu komputer tidak menyala.")).toBeVisible()
  await expect(
    page.getByText("Ditangani", { exact: true }).last()
  ).toBeVisible()
  await beat(page, 1500)
})

test("US-08: petugas melihat dashboard antrean reservasi dan laporan", async ({
  page,
}) => {
  await enterDemo(page, "Petugas")
  await expect(
    page.getByRole("heading", { name: "Reservasi menunggu" })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Laporan baru" })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Jadwal hari ini" })
  ).toBeVisible()
  await beat(page, 1200)

  await page.getByRole("link", { name: "Tinjau", exact: true }).click()
  await expect(page).toHaveURL(/\/staff\/reservations/)
  await expect(page.getByText("Praktikum bersama")).toBeVisible()
  await beat(page)

  await page.goto("/staff/reports")
  await expect(page.getByText("Satu komputer tidak menyala.")).toBeVisible()
  await beat(page, 1500)
})

test("US-09: petugas menyetujui reservasi dan slot yang sama terkunci", async ({
  page,
}) => {
  await enterDemo(page, "Petugas")
  await page.goto("/staff/reservations")
  await expect(page.getByText("Praktikum bersama")).toBeVisible()
  await beat(page)
  await page.getByRole("button", { name: "Setujui" }).click()
  await expect(page.getByText("Setujui reservasi ini?")).toBeVisible()
  await beat(page)
  await page.getByRole("button", { name: "Ya, setujui" }).click()
  await expect(page.getByRole("status")).toContainText("Reservasi disetujui")
  await beat(page)

  await enterDemo(page, "Pengguna")
  await page.goto("/app/reservations/new")
  await page.getByText("Lab Komputer 3", { exact: true }).click()
  await expect(
    page.getByRole("button", { name: /13.00.*Terisi/ })
  ).toBeDisabled()
  await beat(page, 1500)
})

test("US-10: petugas membatalkan reservasi disetujui dengan alasan", async ({
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
  await beat(page)
  await reason.fill("Ruangan dipakai untuk kegiatan darurat rektorat")
  await page.getByRole("button", { name: "Batalkan" }).first().click()
  await expect(page.getByText("Batalkan reservasi ini?")).toBeVisible()
  await beat(page)
  await page.getByRole("button", { name: "Ya, batalkan" }).click()
  await expect(page.getByRole("status")).toContainText("Reservasi dibatalkan")
  await beat(page)
  await page.getByRole("tab", { name: /Riwayat/ }).click()
  await expect(
    page.getByText("Dibatalkan", { exact: true }).first()
  ).toBeVisible()
  await beat(page, 1500)
})

test("US-11: petugas memproses laporan dan menutupnya dengan catatan", async ({
  page,
}) => {
  await enterDemo(page, "Petugas")
  await page.goto("/staff/reports")
  await page.getByRole("button", { name: "Mulai tangani" }).click()
  await expect(page.getByRole("status")).toContainText(
    "Laporan mulai ditangani"
  )
  await beat(page)

  await page.getByRole("tab", { name: /Sedang ditangani/ }).click()
  await page.getByRole("button", { name: /^Selesaikan/ }).click()
  await expect(page.getByText("Isi catatan penanganan sebelum")).toBeVisible()
  await beat(page)
  await page
    .getByRole("textbox", { name: "Catatan penanganan" })
    .fill("Power supply komputer diganti")
  await page.getByRole("button", { name: /^Selesaikan/ }).click()
  await expect(page.getByText("Selesaikan laporan ini?")).toBeVisible()
  await beat(page)
  await page.getByRole("button", { name: "Ya, selesaikan" }).click()
  await expect(page.getByRole("status")).toContainText(
    "Laporan ditandai selesai"
  )
  await page.getByRole("tab", { name: /Riwayat/ }).click()
  await expect(page.getByText("Selesai", { exact: true }).first()).toBeVisible()
  await beat(page, 1500)
})

test("US-12: petugas menjadwalkan perbaikan di slot kosong lalu menyelesaikannya", async ({
  page,
}) => {
  await enterDemo(page, "Petugas")
  await page.goto("/staff/reports")
  await page.getByRole("button", { name: "Mulai tangani" }).click()
  await expect(page.getByRole("status")).toContainText(
    "Laporan mulai ditangani"
  )
  await page.getByRole("tab", { name: /Sedang ditangani/ }).click()
  await beat(page)
  await page.getByRole("button", { name: "Jadwalkan perbaikan" }).click()
  await beat(page)
  await scheduleRepair(page, {
    date: tomorrowInJakarta(),
    first: "08.00",
    last: "09.30",
    reason: "Ganti PC yang tidak menyala",
  })
  await beat(page)

  const lab = page
    .getByRole("list", { name: "Daftar fasilitas" })
    .locator("li")
    .filter({ hasText: "Lab Komputer 3" })
  await page.goto("/facilities")
  await expect(lab).toContainText("Perbaikan terjadwal")
  // The catalog re-renders while demo data hydrates; retry the scroll.
  await expect(() => lab.scrollIntoViewIfNeeded()).toPass()
  await beat(page, 1200)

  await page.goto("/staff/reports?tab=ditangani")
  await page
    .getByRole("textbox", { name: "Catatan penanganan" })
    .fill("Komputer diperbaiki")
  await page.getByRole("button", { name: "Selesaikan laporan" }).click()
  await page.getByRole("button", { name: "Ya, selesaikan" }).click()
  await expect(page.getByRole("status")).toContainText(
    "Laporan ditandai selesai"
  )
  await beat(page)

  await page.goto("/facilities")
  await expect(lab).not.toContainText("Perbaikan terjadwal")
  await expect(() => lab.scrollIntoViewIfNeeded()).toPass()
  await beat(page, 1500)
})

async function createAccount(
  page: Page,
  name: string,
  email: string,
  role: "Petugas" | "Pengguna"
) {
  await page.getByRole("button", { name: "Buat akun" }).click()
  const dialog = page.getByRole("dialog", { name: "Buat akun baru" })
  await dialog.getByRole("textbox", { name: "Nama" }).fill(name)
  await dialog.getByRole("textbox", { name: "Email" }).fill(email)
  await dialog.getByRole("combobox", { name: "Role" }).click()
  await page
    .getByRole("listbox")
    .getByRole("option", { name: role, exact: true })
    .click()
  await beat(page)
  await dialog.getByRole("button", { name: "Buat akun aktif" }).click()
  await expect(dialog).toBeHidden()
}

test("US-13: admin mendaftarkan akun petugas", async ({ page }) => {
  await enterDemo(page, "Admin")
  await page.goto("/admin/users")
  await beat(page)
  await createAccount(page, "Petugas Sarpras", "sarpras@demo.local", "Petugas")
  await expect(page.getByText(/Akun Petugas Sarpras dibuat/)).toBeVisible()
  const card = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("heading", { name: "Petugas Sarpras" }) })
  await expect(card).toContainText("Aktif")
  await expect(card).toContainText("Petugas")
  await beat(page, 1500)
})

test("US-14: admin mendaftarkan akun pengguna langsung", async ({ page }) => {
  await enterDemo(page, "Admin")
  await page.goto("/admin/users")
  await beat(page)
  await createAccount(page, "Dosen Tamu", "dosen.tamu@demo.local", "Pengguna")
  await expect(page.getByText(/Akun Dosen Tamu dibuat/)).toBeVisible()
  const card = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("heading", { name: "Dosen Tamu" }) })
  await expect(card).toContainText("Aktif")
  await expect(card).toContainText("Pengguna")
  await beat(page, 1500)
})

test("US-15: admin memverifikasi atau menolak registrasi mandiri", async ({
  page,
}) => {
  await page.goto("/register")
  await page.getByLabel("Nama").fill("Rina Mahasiswa")
  await page.getByLabel("Email").fill("rina@demo.local")
  await beat(page)
  await page.getByRole("button", { name: "Daftar demo" }).click()
  await expect(page.getByText("Pendaftaran demo tersimpan.")).toBeVisible()
  await beat(page, 1200)

  await enterDemo(page, "Admin")
  await page.goto("/admin/users")
  const rina = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("heading", { name: "Rina Mahasiswa" }) })
  await expect(rina).toContainText("Menunggu")
  await beat(page)
  await rina.getByRole("button", { name: "Setujui" }).click()
  await expect(page.getByText("Akun Rina Mahasiswa disetujui")).toBeVisible()
  await expect(rina).toContainText("Aktif")
  await beat(page)

  const calon = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("heading", { name: "Calon Pengguna" }) })
  await calon.getByRole("button", { name: "Tolak", exact: true }).click()
  await calon
    .getByRole("textbox", { name: "Alasan penolakan" })
    .fill("Email bukan milik civitas kampus")
  await calon.getByRole("button", { name: "Konfirmasi penolakan" }).click()
  await expect(page.getByText("Akun Calon Pengguna ditolak")).toBeVisible()
  await expect(calon).toContainText("Ditolak")
  await beat(page, 1500)
})

test("US-16: admin menambah, mengubah, dan menonaktifkan fasilitas", async ({
  page,
}) => {
  await enterDemo(page, "Admin")
  await page.goto("/admin/facilities")
  await page.getByRole("button", { name: "Tambah fasilitas" }).click()
  const createDialog = page.getByRole("dialog", { name: "Tambah fasilitas" })
  await createDialog.getByLabel("Nama fasilitas").fill("Ruang Diskusi 5")
  await createDialog.getByLabel("Tipe").fill("Ruang Kelas")
  await createDialog.getByLabel("Lokasi").fill("Perpustakaan · Lantai 5")
  await createDialog.getByLabel("Kapasitas").fill("12")
  await createDialog
    .getByLabel("Deskripsi")
    .fill("Ruang diskusi kecil untuk kerja kelompok.")
  await beat(page)
  await createDialog.getByRole("button", { name: "Tambah fasilitas" }).click()
  await expect(createDialog).toBeHidden()
  await expect(
    page.getByRole("heading", { name: "Ruang Diskusi 5" })
  ).toBeVisible()
  await beat(page)

  await page.getByRole("button", { name: "Ubah Ruang Diskusi 5" }).click()
  await expect(page.getByText("Mode ubah")).toBeVisible()
  const editDialog = page.getByRole("dialog")
  await editDialog.getByLabel("Kapasitas").fill("16")
  await beat(page)
  await editDialog.getByRole("button", { name: "Simpan perubahan" }).click()
  await expect(editDialog).toBeHidden()
  await expect(page.getByText("Ruang Kelas · 16 orang")).toBeVisible()
  await beat(page)

  const card = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("heading", { name: "Ruang Diskusi 5" }) })
  await card.getByRole("button", { name: "Sembunyikan" }).click()
  await expect(page.getByText("Ruang Diskusi 5 disembunyikan")).toBeVisible()
  await expect(card).toContainText("Disembunyikan")
  await beat(page, 1500)
})

test("US-17: admin melihat rekap dan mengekspor CSV", async ({ page }) => {
  await enterDemo(page, "Admin")
  await expect(
    page.getByRole("heading", { name: "Penggunaan fasilitas" })
  ).toBeVisible()
  const row = page.getByRole("row").filter({ hasText: "Lab Komputer 3" })
  await expect(row).toContainText("Gedung Informatika")
  await row.scrollIntoViewIfNeeded()
  await beat(page, 1200)
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Rekap fasilitas CSV" }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe("sthana-demo-summary.csv")
  await beat(page, 1500)
})
