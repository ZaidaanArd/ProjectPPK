import type { Metadata } from "next"

import { PublicFacilities } from "@/components/public-facilities"
import { site, siteUrl } from "@/lib/site"

const pageUrl = siteUrl ? `${siteUrl}/facilities` : undefined
const description =
  "Jelajahi fasilitas kampus di Sthana Kampus, cari berdasarkan nama atau lokasi, lalu periksa ketersediaan slot pukul 07.00–20.00 WIB."

export const metadata: Metadata = {
  title: "Daftar Fasilitas Kampus",
  description,
  ...(pageUrl ? { alternates: { canonical: pageUrl } } : {}),
  openGraph: {
    title: "Daftar Fasilitas Kampus",
    description,
    type: "website",
    ...(pageUrl ? { url: pageUrl } : {}),
  },
}

export default function FacilitiesPage() {
  return (
    <main
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 75% 0%, #ffe2f1 0, transparent 55%), radial-gradient(ellipse at 5% 15%, #fff0f8 0, transparent 55%), #fffcfd",
      }}
    >
      {pageUrl ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "@id": `${pageUrl}/#page`,
              url: pageUrl,
              name: "Daftar Fasilitas Kampus",
              description,
              inLanguage: "id-ID",
              isPartOf: { "@id": `${siteUrl}/#website` },
              about: { "@id": `${siteUrl}/#application` },
              creator: {
                "@type": "Person",
                "@id": `${siteUrl}/#creator`,
                name: site.creator.name,
                url: site.creator.url,
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
      <PublicFacilities />
    </main>
  )
}
