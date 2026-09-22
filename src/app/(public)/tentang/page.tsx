import type { Metadata } from "next"
import Image from "next/image"
import {
  IconArrowRight,
  IconBrandGithub,
  IconExternalLink,
} from "@tabler/icons-react"
import { LandingMotion } from "@/components/public/landing-motion"
import { site, siteUrl } from "@/lib/site"

const pageUrl = siteUrl ? `${siteUrl}/tentang` : undefined
const description =
  "Cerita di balik nama, rancangan, identitas visual, dan tim Sthana Kampus—proyek reservasi dan pelaporan fasilitas kampus untuk Project PPK 2026."

export const metadata: Metadata = {
  title: {
    absolute: "Tentang Sthana Kampus — Arti Nama, Tim, dan Desain",
  },
  description,
  ...(pageUrl ? { alternates: { canonical: pageUrl } } : {}),
  openGraph: {
    title: "Tentang Sthana Kampus",
    description,
    type: "website",
    ...(pageUrl ? { url: pageUrl } : {}),
  },
}

const roles = [
  {
    number: "01",
    name: "Pengguna",
    description:
      "Mencari fasilitas, melihat slot, mengajukan reservasi, dan melaporkan kendala.",
  },
  {
    number: "02",
    name: "Petugas",
    description:
      "Memeriksa antrean reservasi dan menindaklanjuti laporan fasilitas.",
  },
  {
    number: "03",
    name: "Admin",
    description:
      "Menjaga data fasilitas, akun, akses, dan rekap aktivitas tetap tertata.",
  },
] as const

const colors = [
  { name: "Sthana Berry", hex: "#52082B", className: "about-swatch-berry" },
  { name: "Campus Pink", hex: "#D00064", className: "about-swatch-pink" },
  { name: "Soft Blush", hex: "#FFE5F2", className: "about-swatch-blush" },
  { name: "Deep Ink", hex: "#1C172F", className: "about-swatch-ink" },
] as const

const teamMembers = [
  {
    name: "Muchammad Yuda Tri Ananda",
    role: "Tech Team & Backend Lead",
    focus:
      "Arsitektur, kontrak, API/service, autentikasi, integrasi, quality gate, dan deployment.",
    profile: "https://github.com/myudak",
    handle: "@myudak",
    image: "/images/team/muchammad-yuda-tri-ananda.png",
    badge: "Project Manager",
    portraitSide: "left",
    primary: true,
  },
  {
    name: "Muhammad Hafidh Zufar Dewantara",
    role: "QA & Testing Lead",
    focus:
      "Skenario pengujian, validasi user story, regression testing, dan pencatatan temuan.",
    profile: "https://github.com/hafidhzufar05-web",
    handle: "@hafidhzufar05-web",
    image: "/images/team/muhammad-hafidh-zufar-dewantara.png",
    badge: null,
    portraitSide: "right",
    primary: false,
  },
  {
    name: "Muhammad Zaidaan Ardiyansyah",
    role: "Brand & UI Lead",
    focus:
      "Identitas visual, shared UI, public experience, auth UI, dan tampilan responsif.",
    profile: "https://github.com/ZaidaanArd",
    handle: "@ZaidaanArd",
    image: "/images/team/muhammad-zaidaan-ardiyansyah.png",
    badge: null,
    portraitSide: "left",
    primary: false,
  },
  {
    name: "Nayla Husna",
    role: "Database Lead",
    focus:
      "Schema Convex, relasi dan index data, integritas data, seed, dan dokumentasi database.",
    profile: "https://github.com/naylahusna",
    handle: "@naylahusna",
    image: "/images/team/nayla-husna.png",
    badge: null,
    portraitSide: "right",
    primary: false,
  },
] as const

export default function AboutPage() {
  return (
    <LandingMotion>
      <main id="main-content" className="sthana-about">
        {pageUrl ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "AboutPage",
                    "@id": `${pageUrl}/#page`,
                    url: pageUrl,
                    name: "Tentang Sthana Kampus",
                    description,
                    inLanguage: "id-ID",
                    isPartOf: { "@id": `${siteUrl}/#website` },
                    mainEntity: { "@id": `${siteUrl}/#application` },
                    creator: { "@id": `${siteUrl}/#creator` },
                    contributor: teamMembers.map((member) => ({
                      "@type": "Person",
                      name: member.name,
                      jobTitle: member.badge
                        ? `${member.badge}; ${member.role}`
                        : member.role,
                      url: member.profile,
                    })),
                  },
                  {
                    "@type": "BreadcrumbList",
                    "@id": `${pageUrl}/#breadcrumb`,
                    itemListElement: [
                      {
                        "@type": "ListItem",
                        position: 1,
                        name: "Beranda",
                        item: siteUrl,
                      },
                      {
                        "@type": "ListItem",
                        position: 2,
                        name: "Tentang Sthana Kampus",
                        item: pageUrl,
                      },
                    ],
                  },
                ],
              }).replace(/</g, "\\u003c"),
            }}
          />
        ) : null}

        <section className="about-hero">
          <div className="sthana-container about-hero-grid">
            <div className="about-hero-copy">
              <h1>Ruang kampus, dibuat lebih mudah dipakai.</h1>
              <p>
                Sthana Kampus adalah aplikasi web untuk reservasi ruang dan
                pelaporan fasilitas kampus. Satu alur yang dapat diikuti
                pengguna, petugas, dan admin, dibuat untuk Project PPK 2026.
              </p>
              <div className="about-hero-links">
                <a
                  href="https://github.com/ZaidaanArd/ProjectPPK"
                  className="sthana-button primary"
                  rel="external"
                >
                  <IconBrandGithub size={18} aria-hidden="true" /> Lihat source
                  code
                </a>
                <a href="#cerita-nama" className="about-text-link">
                  Cerita di balik nama
                  <IconArrowRight size={17} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="about-wordmark" aria-label="Sthāna berarti tempat">
              <span className="about-wordmark-script" lang="sa">
                स्थान
              </span>
              <span className="about-wordmark-name">sthāna</span>
              <span className="about-wordmark-meaning">
                tempat · kediaman · lokasi
              </span>
            </div>
          </div>
        </section>

        <section
          id="cerita-nama"
          className="sthana-container about-origin"
          data-reveal
        >
          <div className="about-origin-title">
            <span className="about-section-number" aria-hidden="true">
              01
            </span>
            <h2>Satu nama untuk tempat yang dipakai bersama.</h2>
          </div>
          <div className="about-origin-copy">
            <p>
              <i>Sthāna</i> (स्थान) berasal dari bahasa Sanskerta dan dapat
              berarti tempat berdiri atau tinggal, kediaman, posisi, maupun
              tempat. Makna “tempat” itu menjadi dasar nama Sthana Kampus.
            </p>
            <p>
              Kampus memiliki banyak ruang dengan jadwal, kapasitas, kondisi,
              dan penanggung jawab berbeda. Sthana dirancang agar semua pihak
              melihat sumber informasi yang sama—dari pencarian ruang sampai
              laporan selesai ditangani.
            </p>
            <a
              href="https://www.sanskrit-lexicon.uni-koeln.de/scans/LANScan/LANScanpdf/lan_311.pdf"
              className="about-source-link"
              rel="external"
            >
              Rujukan leksikon Sanskerta
              <IconExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="about-brand" data-reveal>
          <div className="sthana-container about-brand-grid">
            <div className="about-brand-mark" aria-hidden="true">
              <span className="about-brand-orbit" />
              <Image
                src="/brand/sthana-mark-512.png"
                alt=""
                width={300}
                height={300}
                sizes="(max-width: 800px) 180px, 300px"
              />
            </div>
            <div className="about-brand-copy">
              <span className="about-section-number" aria-hidden="true">
                02
              </span>
              <h2>Pink yang terasa hidup, bukan sekadar dekorasi.</h2>
              <p>
                Pink dipilih agar Sthana mudah dikenali di antara produk kampus
                yang cenderung formal. Berry yang gelap menjaga teks tetap
                tegas, sementara blush memberi ruang bernapas pada antarmuka
                yang padat data.
              </p>
              <div className="about-palette" aria-label="Palet warna Sthana">
                {colors.map((color) => (
                  <div key={color.hex} className="about-color">
                    <span className={color.className} aria-hidden="true" />
                    <strong>{color.name}</strong>
                    <code>{color.hex}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="sthana-container about-system" data-reveal>
          <div className="about-system-heading">
            <span className="about-section-number" aria-hidden="true">
              03
            </span>
            <h2>Satu sistem, tiga sudut kerja.</h2>
            <p>
              Setiap peran memperoleh informasi dan tindakan yang memang
              dibutuhkan—tanpa mencampurkan antrean atau kewenangan.
            </p>
          </div>
          <ol className="about-role-list">
            {roles.map((role) => (
              <li key={role.name}>
                <span aria-hidden="true">{role.number}</span>
                <h3>{role.name}</h3>
                <p>{role.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="sthana-container about-team"
          aria-labelledby="team-heading"
          data-reveal
        >
          <div className="about-team-intro">
            <div>
              <span className="about-section-number" aria-hidden="true">
                04
              </span>
              <h2 id="team-heading">Tim di balik Sthana.</h2>
            </div>
            <p>
              Empat fokus kerja, satu repository utama. Setiap anggota memegang
              area yang jelas dan tetap saling mereview hasil implementasi.
            </p>
          </div>
          <ol className="about-team-grid">
            {teamMembers.map((member) => (
              <li
                key={member.name}
                className={[
                  member.primary ? "about-team-primary" : "",
                  member.portraitSide === "right"
                    ? "about-team-portrait-right"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="about-team-avatar">
                  <Image
                    src={member.image}
                    alt={`Ilustrasi profil ${member.name}`}
                    width={256}
                    height={256}
                    sizes="(max-width: 600px) 84px, 124px"
                  />
                </div>
                <div className="about-team-copy">
                  <div className="about-team-heading">
                    <h3>{member.name}</h3>
                    {member.badge ? <span>{member.badge}</span> : null}
                  </div>
                  <p className="about-team-role">{member.role}</p>
                  <p className="about-team-focus">{member.focus}</p>
                  <a href={member.profile} rel="external">
                    <IconBrandGithub size={16} aria-hidden="true" />
                    {member.handle}
                    <IconArrowRight size={15} aria-hidden="true" />
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="sthana-container about-project" data-reveal>
          <div>
            <h2>Dibangun terbuka, masih terus dikembangkan.</h2>
            <p>
              Sthana merupakan proyek akademik. Alur utama, autentikasi, data,
              dan portal peran sedang dikembangkan bertahap berdasarkan 17 user
              story Project PPK.
            </p>
          </div>
          <div className="about-links">
            <a
              href={site.creator.url}
              className="sthana-button white small"
              rel="author"
            >
              Dibuat oleh Myudak
              <IconArrowRight size={16} aria-hidden="true" />
            </a>
            <a
              href="https://github.com/ZaidaanArd/ProjectPPK"
              className="sthana-button about-project-secondary small"
              rel="external"
            >
              <IconBrandGithub size={16} aria-hidden="true" /> Repository utama
            </a>
          </div>
        </section>
      </main>
    </LandingMotion>
  )
}
