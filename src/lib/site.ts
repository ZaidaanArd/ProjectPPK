export const site = {
  name: "Sthana Kampus",
  description:
    "Sthana Kampus adalah aplikasi web untuk mencari fasilitas, mengajukan reservasi ruangan, memantau persetujuan, dan melaporkan kerusakan kampus.",
  creator: {
    name: "Myudak",
    url: "https://www.myudak.com/",
    sameAs: ["https://github.com/myudak"],
  },
  repository: "https://github.com/ZaidaanArd/ProjectPPK",
  lastUpdated: "2026-09-22",
}

function productionUrl() {
  if (
    process.env.NODE_ENV !== "production" ||
    (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production")
  )
    return undefined
  if (!process.env.SITE_URL) return undefined
  if (!URL.canParse(process.env.SITE_URL)) return undefined
  const url = new URL(process.env.SITE_URL)
  if (
    url.protocol !== "https:" ||
    ["localhost", "127.0.0.1"].includes(url.hostname)
  )
    return undefined
  return url.origin
}

export const siteUrl = productionUrl()
