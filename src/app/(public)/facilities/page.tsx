import type { Metadata } from "next"

import { PublicFacilities } from "@/components/public-facilities"
import { SthaniFace } from "@/components/sthani-face"
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
    <main className="public-facilities-page min-h-screen">
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
      <span className="public-facilities-hero-art" aria-hidden="true">
        <SthaniFace expression="senang" />
      </span>
      <PublicFacilities />
    </main>
  )
}
