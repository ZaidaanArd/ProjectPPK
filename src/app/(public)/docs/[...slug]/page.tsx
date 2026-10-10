import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { IconArrowLeft, IconBrandGithub } from "@tabler/icons-react"
import Markdown from "react-markdown"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"

import { MermaidDiagram } from "@/components/mermaid-diagram"
import { ScrollspyToc } from "@/components/scrollspy-toc"
import {
  findPublicDoc,
  publicDocSourceHref,
  publicDocs,
  resolvePublicDocLink,
} from "@/lib/public-docs"
import { readPublicDoc } from "@/lib/read-public-doc"
import { siteUrl } from "@/lib/site"

type PageProps = { params: Promise<{ slug: string[] }> }

export const dynamicParams = false

export function generateStaticParams() {
  return publicDocs.map((doc) => ({ slug: doc.slug.split("/") }))
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const doc = findPublicDoc(slug.join("/"))
  if (!doc) notFound()

  return {
    title: doc.title + " — Dokumentasi Sthana Kampus",
    description: doc.summary,
    ...(siteUrl
      ? { alternates: { canonical: siteUrl + "/docs/" + doc.slug } }
      : {}),
  }
}

export default async function DocsArticlePage({ params }: PageProps) {
  const { slug } = await params
  const doc = findPublicDoc(slug.join("/"))
  if (!doc) notFound()

  const markdown = await readPublicDoc(doc)

  return (
    <main id="main-content" className="docs-page">
      <div className="sthana-container docs-article-shell">
        <nav aria-label="Breadcrumb" className="docs-breadcrumb">
          <Link href="/tentang">Tentang</Link>
          <span aria-hidden="true">/</span>
          <Link href="/docs">Dokumentasi</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{doc.title}</span>
        </nav>
        <header className="docs-article-header">
          <p>{doc.category}</p>
          <Link
            href={publicDocSourceHref(doc)}
            target="_blank"
            rel="noopener noreferrer"
            className="docs-source-link"
          >
            <IconBrandGithub size={17} aria-hidden="true" />
            Lihat sumber
          </Link>
        </header>
        <article className="docs-prose">
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug]}
            components={{
              a: ({ href = "", children }) => {
                const resolved = resolvePublicDocLink(doc, href)
                if (resolved.startsWith("/") || resolved.startsWith("#")) {
                  return <Link href={resolved}>{children}</Link>
                }
                return (
                  <a href={resolved} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                )
              },
              // ```mermaid blocks render as diagrams instead of code.
              pre: ({ node, children }) => {
                const code = node?.children[0]
                const classes =
                  code?.type === "element" ? code.properties.className : null
                if (
                  Array.isArray(classes) &&
                  classes.includes("language-mermaid") &&
                  code?.type === "element" &&
                  code.children[0]?.type === "text"
                ) {
                  return <MermaidDiagram chart={code.children[0].value} />
                }
                return <pre>{children}</pre>
              },
              table: ({ children }) => (
                <div className="docs-table-scroll">
                  <table>{children}</table>
                </div>
              ),
            }}
          >
            {markdown}
          </Markdown>
        </article>
        <ScrollspyToc selector=".docs-prose h2, .docs-prose h3" />
        <Link href="/docs" className="docs-back-link">
          <IconArrowLeft size={17} aria-hidden="true" />
          Semua dokumentasi
        </Link>
      </div>
    </main>
  )
}
