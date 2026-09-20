import { NextResponse } from "next/server"

import { api } from "../../../../../convex/_generated/api"
import { fetchAuthQuery } from "@/lib/auth-server"

function csvCell(value: string | number) {
  const stringValue = String(value)
  return /[",\n]/.test(stringValue)
    ? `"${stringValue.replaceAll('"', '""')}"`
    : stringValue
}

export async function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind")
  if (kind !== "reservations" && kind !== "reports") {
    return NextResponse.json(
      { message: "Jenis export tidak valid" },
      { status: 400 }
    )
  }

  try {
    const data = await fetchAuthQuery(api.admin.exportData, { kind })
    const headers =
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
    const rows = data.rows.map((row) =>
      Object.values(row).map(csvCell).join(",")
    )
    const csv = `\uFEFF${headers.join(",")}\n${rows.join("\n")}`

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sthana-${kind}.csv"`,
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 })
  }
}
