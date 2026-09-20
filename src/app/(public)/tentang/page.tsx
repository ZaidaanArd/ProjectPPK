import type { Metadata } from "next"
import { IconArrowRight, IconBrandGithub } from "@tabler/icons-react"
import { site, siteUrl } from "@/lib/site"

const pageUrl = siteUrl ? `${siteUrl}/tentang` : undefined
const description =
  "Tentang Sthana Kampus, proyek aplikasi web reservasi dan pelaporan fasilitas kampus yang dibuat oleh Myudak untuk Project PPK 2026."

export const metadata: Metadata = {
  title: "Tentang",
  description,
  ...(pageUrl ? { alternates: { canonical: pageUrl } } : {}),
}

const roles = [
  {
    name: "Pengguna",
    description:
      "Mencari fasilitas, mengajukan reservasi, dan membuat laporan.",
  },
  {
    name: "Petugas",
    description: "Memeriksa reservasi dan menindaklanjuti laporan fasilitas.",
  },
  {
    name: "Admin",
    description: "Mengelola fasilitas, pengguna, dan rekap aktivitas.",
  },
]

const teamMembers = [
  {
    name: "Muchammad Yuda Tri Ananda",
    role: "Tech Team & Backend Lead",
    focus:
      "Arsitektur, kontrak, API/service, autentikasi, integrasi, quality gate, dan deployment.",
    primary: true,
  },
  {
    name: "Muhammad Hafidh Zufar Dewantara",
    role: "QA & Testing Lead",
    focus:
      "Skenario pengujian, validasi user story, regression testing, dan pencatatan temuan.",
    primary: false,
  },
  {
    name: "Muhammad Zaidaan Ardiyansyah",
    role: "Brand & UI Lead",
    focus:
      "Identitas visual, shared UI, public experience, auth UI, dan tampilan responsif.",
    primary: false,
  },
  {
    name: "Nayla Husna",
    role: "Database Lead",
    focus:
      "Schema Convex, relasi dan index data, integritas data, seed, dan dokumentasi database.",
    primary: false,
  },
] as const

export default function AboutPage() {
  return (
    <main id="main-content" className="sthana-about">
      {pageUrl && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AboutPage",
              "@id": `${pageUrl}/#page`,
              url: pageUrl,
              name: "Tentang Sthana Kampus",
              description,
              inLanguage: "id-ID",
              isPartOf: { "@id": `${siteUrl}/#website` },
              mainEntity: { "@id": `${siteUrl}/#application` },
              creator: {
                "@type": "Person",
                "@id": `${siteUrl}/#creator`,
                name: site.creator.name,
                url: site.creator.url,
              },
              contributor: teamMembers.map((member) => ({
                "@type": "Person",
                name: member.name,
                jobTitle: member.role,
              })),
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}

      <section className="sthana-container about-hero">
        <h1>Tentang Sthana Kampus</h1>
        <p>
          Sthana Kampus adalah proyek aplikasi web untuk reservasi dan pelaporan
          fasilitas kampus, dibuat oleh Myudak untuk Project PPK 2026.
        </p>
      </section>

      <div className="sthana-container about-content">
        <div className="about-main">
          <section className="about-section">
            <h2>Apa yang dirancang</h2>
            <p>
              Sthana Kampus menyatukan pencarian fasilitas, pengajuan jadwal,
              pemantauan persetujuan, dan pelaporan kerusakan dalam satu alur.
              Tujuannya agar penggunaan ruang kampus lebih mudah dipahami dan
              tercatat.
            </p>
          </section>

          <section className="about-section">
            <h2>Siapa yang menggunakan</h2>
            <ul className="about-role-list">
              {roles.map((role) => (
                <li key={role.name}>
                  <strong>{role.name}</strong>
                  <p>{role.description}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="about-project" aria-labelledby="project-heading">
          <h2 id="project-heading">Tentang proyek</h2>
          <p>
            Situs ini merupakan proyek akademik. Tampilan dan struktur dasarnya
            sudah tersedia, sedangkan fitur transaksi dan pengelolaan data masih
            dikembangkan.
          </p>
          <div className="about-links">
            <a
              href={site.creator.url}
              className="sthana-button primary small"
              rel="author"
            >
              Myudak <IconArrowRight size={16} aria-hidden="true" />
            </a>
            <a
              href="https://github.com/ZaidaanArd/ProjectPPK"
              className="sthana-button secondary small"
              rel="external"
            >
              <IconBrandGithub size={16} aria-hidden="true" /> Source code
            </a>
          </div>
        </aside>
      </div>

      <section
        className="sthana-container about-team"
        aria-labelledby="team-heading"
      >
        <h2 id="team-heading">Tim project</h2>
        <ol className="about-team-grid">
          {teamMembers.map((member, index) => (
            <li
              key={member.name}
              className={member.primary ? "about-team-primary" : undefined}
            >
              <span className="about-team-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="about-team-copy">
                <div className="about-team-heading">
                  <h3>{member.name}</h3>
                  {member.primary && <span>Primary lead</span>}
                </div>
                <p className="about-team-role">{member.role}</p>
                <p className="about-team-focus">{member.focus}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
