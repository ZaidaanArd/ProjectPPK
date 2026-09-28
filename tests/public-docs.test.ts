import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import {
  findPublicDoc,
  publicDocHref,
  publicDocs,
  resolvePublicDocLink,
} from "../src/lib/public-docs"

describe("public documentation", () => {
  it("uses unique routes backed by repository files", () => {
    expect(new Set(publicDocs.map((doc) => doc.slug)).size).toBe(
      publicDocs.length
    )
    for (const doc of publicDocs) {
      expect(existsSync(join(process.cwd(), "docs", doc.file))).toBe(true)
      expect(publicDocHref(doc)).toBe("/docs/" + doc.slug)
    }
  })

  it("keeps relative document links on the site", () => {
    const requirements = findPublicDoc("requirements")
    const adr = findPublicDoc("adr")
    expect(requirements).toBeDefined()
    expect(adr).toBeDefined()
    if (!requirements || !adr) return

    expect(resolvePublicDocLink(requirements, "./UAT.md")).toBe("/docs/uat")
    expect(resolvePublicDocLink(adr, "./0001-convex-backend.md")).toBe(
      "/docs/adr/0001-convex-backend"
    )
    expect(
      resolvePublicDocLink(
        adr,
        "../TEST-REPORT.md#snapshot-lokal--27-september-2026"
      )
    ).toBe("/docs/test-report#snapshot-lokal--27-september-2026")
  })

  it("resolves every linked Markdown document in the public registry", () => {
    const brokenLinks: string[] = []
    for (const doc of publicDocs) {
      const markdown = readFileSync(
        join(process.cwd(), "docs", doc.file),
        "utf8"
      )
      const links = [...markdown.matchAll(/\]\(([^)]+\.md(?:#[^)]*)?)\)/gi)]
      for (const [, href] of links) {
        const resolved = resolvePublicDocLink(doc, href)
        if (resolved.startsWith("/docs/")) {
          if (!findPublicDoc(resolved.slice(6).split("#")[0])) {
            brokenLinks.push(`${doc.file}: ${href}`)
          }
        } else {
          if (
            !resolved.startsWith(
              "https://github.com/ZaidaanArd/ProjectPPK/blob/main/"
            )
          ) {
            brokenLinks.push(`${doc.file}: ${href}`)
            continue
          }
          const filePath = decodeURI(
            resolved.split("/blob/main/")[1].split("#")[0]
          )
          if (!existsSync(join(process.cwd(), filePath))) {
            brokenLinks.push(`${doc.file}: ${href}`)
          }
        }
      }
    }
    expect(brokenLinks).toEqual([])
  })

  it("sends non-public source links to GitHub and rejects unsafe schemes", () => {
    const operations = findPublicDoc("operations")
    expect(operations).toBeDefined()
    if (!operations) return

    expect(resolvePublicDocLink(operations, "../.env.example")).toBe(
      "https://github.com/ZaidaanArd/ProjectPPK/blob/main/.env.example"
    )
    expect(resolvePublicDocLink(operations, "javascript:alert(1)")).toBe("#")
    expect(findPublicDoc("../../secret")).toBeUndefined()
  })
})
