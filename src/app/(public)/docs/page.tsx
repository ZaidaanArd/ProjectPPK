import type { Metadata } from "next"
import Link from "next/link"
import { IconArrowRight } from "@tabler/icons-react"

import {
  publicDocCategories,
  publicDocHref,
  publicDocs,
} from "@/lib/public-docs"
import { siteUrl } from "@/lib/site"

export const metadata: Metadata = {
  title: "Dokumentasi Sthana Kampus",
  description:
    "Panduan pengguna, arsitektur, pengujian, keamanan, dan catatan pengembangan Sthana Kampus.",
  ...(siteUrl ? { alternates: { canonical: siteUrl + "/docs" } } : {}),
}

export default function DocsIndexPage() {
  return (
    <main id="main-content" className="docs-page">
      <div className="sthana-container docs-index">
        <nav aria-label="Breadcrumb" className="docs-breadcrumb">
          <Link href="/tentang">Tentang</Link>
          <span aria-hidden="true">/</span>
          <span>Dokumentasi</span>
        </nav>
        <div className="docs-index-heading">
          <h1>Dokumentasi</h1>
          <p>
            Panduan, keputusan teknis, pengujian, dan batasan Sthana Kampus.
          </p>
        </div>
        {publicDocCategories.map((category) => {
          const documents = publicDocs.filter(
            (doc) => doc.category === category
          )
          return (
            <section key={category} className="docs-index-group">
              <h2>{category}</h2>
              <ul className="docs-index-grid">
                {documents.map((doc) => (
                  <li key={doc.slug}>
                    <Link href={publicDocHref(doc)} className="docs-index-card">
                      <span className="docs-index-card-title">{doc.title}</span>
                      <span className="docs-index-card-summary">
                        {doc.summary}
                      </span>
                      <IconArrowRight aria-hidden="true" size={18} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </main>
  )
}
