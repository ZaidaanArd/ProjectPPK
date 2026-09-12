export const site = {
  name: "Sthana Kampus",
  description:
    "Cari fasilitas kampus, ajukan reservasi ruangan, pantau persetujuan, dan laporkan kerusakan dalam satu tempat.",
  creator: {
    name: "Myudak",
    url: "https://www.myudak.com/",
  },
}

function productionUrl() {
  if (
    process.env.NODE_ENV !== "production" ||
    (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production")
  )
    return undefined
  if (!process.env.SITE_URL) return undefined
  const url = new URL(process.env.SITE_URL)
  if (
    url.protocol !== "https:" ||
    ["localhost", "127.0.0.1"].includes(url.hostname)
  )
    return undefined
  return url.origin
}

export const siteUrl = productionUrl()
