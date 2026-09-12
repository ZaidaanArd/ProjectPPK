import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const alt = "Sthana Kampus — Reservasi dan pelaporan fasilitas kampus"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const logo = await readFile(
    join(process.cwd(), "public/brand/sthana-mark-512.png")
  )
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "linear-gradient(120deg,#fff 30%,#fce3ef)",
        padding: 80,
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#1b1329",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${logo.toString("base64")}`}
          width={90}
          height={90}
          alt=""
        />
        <span style={{ fontSize: 38, fontWeight: 700 }}>Sthana Kampus</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 72,
          fontWeight: 700,
          lineHeight: 1.05,
        }}
      >
        <span>Pinjam ruangan kampus</span>
        <span style={{ color: "#ce0060" }}>tanpa drama antre.</span>
      </div>
      <span style={{ fontSize: 24, color: "#71687c" }}>
        Reservasi ruangan & pelaporan fasilitas kampus
      </span>
    </div>,
    size
  )
}
