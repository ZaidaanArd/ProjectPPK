import { NextResponse } from "next/server"

import { api } from "../../../../../convex/_generated/api"
import { fetchAuthQuery, isAuthenticated } from "../../../../lib/auth-server"
import { csvDocument } from "../../../../lib/csv"
import { isStaticMode } from "../../../../lib/data-mode"

export async function GET(request: Request) {
  if (isStaticMode) {
    return NextResponse.json(
      { message: "Gunakan ekspor CSV di portal demo" },
      { status: 404 }
    )
  }
  const kind = new URL(request.url).searchParams.get("kind")
  if (kind !== "reservations" && kind !== "reports" && kind !== "summary") {
    return NextResponse.json(
      { message: "Jenis export tidak valid" },
      { status: 400 }
    )
  }

  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { message: "Silakan masuk terlebih dahulu" },
        { status: 401 }
      )
    }
    const profile = await fetchAuthQuery(api.profiles.current, {})
    if (!profile) {
      return NextResponse.json(
        { message: "Silakan masuk terlebih dahulu" },
        { status: 401 }
      )
    }
    if (profile.role !== "admin" || profile.status !== "active") {
      return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 })
    }

    let headers: string[]
    let rows: (string | number)[][]
    if (kind === "summary") {
      const data = await fetchAuthQuery(api.admin.analytics, {})
      headers = [
        "Fasilitas",
        "Lokasi",
        "Reservasi disetujui",
        "Menit pemakaian",
        "Laporan",
      ]
      rows = data.facilityUsage.map((item) => [
        item.name,
        item.location,
        item.approvedReservations,
        item.reservedMinutes,
        item.reports,
      ])
    } else {
      const data = await fetchAuthQuery(api.admin.exportData, { kind })
      headers =
        data.kind === "reservations"
          ? [
              "ID",
              "Fasilitas",
              "Pemohon",
              "Email",
              "Tujuan",
              "Mulai",
              "Selesai",
              "Status",
            ]
          : [
              "ID",
              "Fasilitas",
              "Pelapor",
              "Email",
              "Kategori",
              "Deskripsi",
              "Status",
              "Catatan",
            ]
      rows = data.rows.map((row) => Object.values(row))
    }
    const csv = csvDocument(headers, rows)

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sthana-${kind}.csv"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Admin CSV export failed", error)
    return NextResponse.json(
      { message: "Ekspor gagal. Coba lagi nanti." },
      { status: 500 }
    )
  }
}
