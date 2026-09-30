import { posix } from "node:path"

import { site } from "./site"

export const qaSheetUrl =
  "https://docs.google.com/spreadsheets/d/1fAsl8YiMtvXk5auD-425DQlXwfscLSHhzMmpAepgPnE/edit?gid=1461202859#gid=1461202859"

export const publicDocs = [
  {
    slug: "user-guide",
    file: "USER-GUIDE.md",
    title: "Panduan pengguna",
    summary:
      "Cara memakai Sthana sebagai pengunjung, pengguna, petugas, dan admin.",
    category: "Penggunaan",
  },
  {
    slug: "architecture",
    file: "ARCHITECTURE.md",
    title: "Arsitektur",
    summary: "Alur Next.js, Better Auth, Convex, dan batas tanggung jawabnya.",
    category: "Teknis",
  },
  {
    slug: "data-and-api",
    file: "DATA-AND-API.md",
    title: "Data dan API",
    summary: "Model data, status, akses fungsi, dan aturan reservasi.",
    category: "Teknis",
  },
  {
    slug: "adr",
    file: "adr/README.md",
    title: "Keputusan arsitektur",
    summary: "Alasan pemilihan backend, autentikasi, dan halaman publik.",
    category: "Teknis",
  },
  {
    slug: "adr/0001-convex-backend",
    file: "adr/0001-convex-backend.md",
    title: "ADR-0001: Convex",
    summary: "Mengapa data operasional dan transaksi disimpan di Convex.",
    category: "Teknis",
  },
  {
    slug: "adr/0002-auth-and-multi-session",
    file: "adr/0002-auth-and-multi-session.md",
    title: "ADR-0002: Autentikasi",
    summary: "Status akun, Better Auth, dan pergantian beberapa akun.",
    category: "Teknis",
  },
  {
    slug: "adr/0003-public-pages-and-static-demo",
    file: "adr/0003-public-pages-and-static-demo.md",
    title: "ADR-0003: Halaman publik",
    summary: "Halaman publik statis dan batas mode demo di browser.",
    category: "Teknis",
  },
  {
    slug: "uat",
    file: "UAT.md",
    title: "UAT",
    summary: "Skenario penerimaan US-01–US-17; belum ada sign-off.",
    category: "Pengujian",
  },
  {
    slug: "test-report",
    file: "TEST-REPORT.md",
    title: "Laporan pengujian",
    summary: "Hasil test yang dijalankan, cakupan browser, dan gap verifikasi.",
    category: "Pengujian",
  },
  {
    slug: "security-privacy",
    file: "SECURITY-PRIVACY.md",
    title: "Keamanan dan privasi",
    summary: "Data yang diproses, kontrol akses, dan batasan yang diketahui.",
    category: "Operasional",
  },
  {
    slug: "operations",
    file: "OPERATIONS.md",
    title: "Panduan operasional",
    summary: "Setup, rilis, pemeriksaan layanan, insiden, dan rollback.",
    category: "Operasional",
  },
  {
    slug: "changelog",
    file: "CHANGELOG.md",
    title: "Catatan perubahan",
    summary:
      "Perubahan berdasarkan riwayat Git, terpisah dari status deployment.",
    category: "Proyek",
  },
  {
    slug: "case-study",
    file: "CASE-STUDY.md",
    title: "Studi kasus engineering",
    summary: "Masalah, keputusan desain, implementasi, dan hasil yang terukur.",
    category: "Proyek",
  },
  {
    slug: "requirements",
    file: "REQUIREMENTS.md",
    title: "Requirements",
    summary: "Peran, aturan, dan 17 user story Project PPK.",
    category: "Proyek",
  },
  {
    slug: "team-work",
    file: "TEAM-WORK.md",
    title: "Pembagian tim",
    summary: "Area tanggung jawab dan aturan review.",
    category: "Proyek",
  },
  {
    slug: "seo",
    file: "SEO.md",
    title: "Metadata dan indexing",
    summary: "Canonical, sitemap, dan catatan Search Console.",
    category: "Arsip teknis",
  },
  {
    slug: "roadmap",
    file: "ROADMAP.md",
    title: "Roadmap awal",
    summary: "Arsip perencanaan sebelum arsitektur Convex saat ini.",
    category: "Arsip teknis",
  },
] as const

export type PublicDoc = (typeof publicDocs)[number]

export const publicDocCategories = [
  "Penggunaan",
  "Teknis",
  "Pengujian",
  "Operasional",
  "Proyek",
  "Arsip teknis",
] as const

export function findPublicDoc(slug: string): PublicDoc | undefined {
  return publicDocs.find((doc) => doc.slug === slug)
}

export function publicDocHref(doc: PublicDoc): string {
  return "/docs/" + doc.slug
}

export function publicDocSourceHref(doc: PublicDoc): string {
  return site.repository + "/blob/main/docs/" + doc.file
}

export function resolvePublicDocLink(doc: PublicDoc, href: string): string {
  if (!href || href.startsWith("#")) return href
  if (/^(https?:|mailto:)/i.test(href)) return href
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith("//")) return "#"
  if (href.startsWith("/")) return href

  const [target, ...rest] = href.split("#")
  const fragment = rest.length ? "#" + rest.join("#") : ""
  const filePath = posix.normalize(
    posix.join("docs", posix.dirname(doc.file), decodeURIComponent(target))
  )
  const matched = publicDocs.find((entry) => "docs/" + entry.file === filePath)
  if (matched) return publicDocHref(matched) + fragment

  if (filePath === ".." || filePath.startsWith("../")) return "#"
  return site.repository + "/blob/main/" + encodeURI(filePath) + fragment
}
