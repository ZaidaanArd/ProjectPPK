import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  IconArrowRight,
  IconBuilding,
  IconCalendarEvent,
  IconCheck,
  IconMapPin,
  IconUsers,
  IconTool as IconWrench,
} from "@tabler/icons-react"
import { DashboardPreview } from "@/components/public/dashboard-preview"
import { FaqAccordion } from "@/components/public/faq-accordion"
import { LandingMotion } from "@/components/public/landing-motion"
import { StepsShowcase, type Step } from "@/components/public/steps-showcase"
import { SthaniFace } from "@/components/sthani-face"
import { facilities } from "@/lib/facilities"
import { site, siteUrl } from "@/lib/site"
export const metadata: Metadata = {
  title: { absolute: "Sthana Kampus — Reservasi & Pelaporan Fasilitas Kampus" },
  description: site.description,
  ...(siteUrl ? { alternates: { canonical: siteUrl } } : {}),
}
const features = [
  {
    icon: IconBuilding,
    title: "Cari fasilitas",
    text: "Ruangan hingga lapangan",
  },
  {
    icon: IconCalendarEvent,
    title: "Ajukan reservasi",
    text: "Pilih jadwal yang sesuai",
  },
  {
    icon: IconCheck,
    title: "Pantau persetujuan",
    text: "Status dalam satu tempat",
  },
  {
    icon: IconWrench,
    title: "Laporkan kendala",
    text: "Ikuti progres penanganan",
  },
]
const steps: Step[] = [
  {
    key: "search",
    title: "Cari fasilitas",
    text: "Temukan ruangan sesuai lokasi, kapasitas, dan kebutuhanmu.",
  },
  {
    key: "reserve",
    title: "Ajukan reservasi",
    text: "Pilih tanggal dan waktu, lalu isi keperluan penggunaan.",
  },
  {
    key: "approve",
    title: "Tunggu persetujuan",
    text: "Petugas memeriksa jadwal. Pantau status dari akunmu.",
  },
  {
    key: "report",
    title: "Laporkan kendala",
    text: "Ada yang rusak? Kirim laporan dan ikuti penanganannya.",
  },
]
const faqs = [
  {
    question: "Siapa yang bisa menggunakan Sthana Kampus?",
    text: "Semua mahasiswa dan dosen bisa mendaftar untuk mengajukan reservasi, sementara verifikasi dan pengelolaan fasilitas ditangani petugas serta admin kampus.",
  },
  {
    question: "Bagaimana cara mengajukan reservasi ruangan?",
    text: "Cari fasilitas yang tersedia, pilih tanggal dan jam pakai, isi keperluan acara, lalu kirim pengajuan. Status persetujuan bisa dipantau langsung dari akunmu.",
  },
  {
    question: "Berapa lama pengajuan disetujui?",
    text: "Pengajuan diperiksa dan diverifikasi oleh petugas dalam hitungan jam kerja. Setiap perubahan status langsung terlihat di akunmu.",
  },
  {
    question: "Apakah reservasi bisa dibatalkan?",
    text: "Bisa. Buka daftar reservasi di akunmu, pilih pengajuan yang ingin dibatalkan, lalu batalkan selama statusnya masih menunggu persetujuan.",
  },
  {
    question: "Bagaimana cara melaporkan fasilitas yang rusak?",
    text: "Buat laporan dari akunmu, jelaskan kendalanya misalnya AC mati atau kursi rusak dan sebutkan lokasinya. Petugas akan menindaklanjuti dan memperbarui progresnya.",
  },
]
export default function HomePage() {
  return (
    <main id="main-content" className="sthana-landing">
      {siteUrl && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Person",
                  "@id": `${siteUrl}/#creator`,
                  name: site.creator.name,
                  url: site.creator.url,
                  sameAs: site.creator.sameAs,
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}/#website`,
                  name: site.name,
                  alternateName: "Sthana",
                  url: siteUrl,
                  description: site.description,
                  inLanguage: "id-ID",
                  creator: { "@id": `${siteUrl}/#creator` },
                },
                {
                  "@type": "WebApplication",
                  "@id": `${siteUrl}/#application`,
                  name: site.name,
                  url: siteUrl,
                  description: site.description,
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Web",
                  inLanguage: "id-ID",
                  isAccessibleForFree: true,
                  featureList: [
                    "Pencarian fasilitas kampus",
                    "Reservasi fasilitas kampus",
                    "Pelaporan kerusakan fasilitas",
                    "Portal pengguna, petugas, dan admin",
                  ],
                  creator: { "@id": `${siteUrl}/#creator` },
                  isPartOf: { "@id": `${siteUrl}/#website` },
                  sameAs: site.repository,
                },
              ],
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <LandingMotion>
        <section className="landing-hero">
          <div className="sthana-container hero-grid">
            <div className="hero-copy">
              <h1>
                Pinjam ruangan kampus <span>tanpa drama antri</span>
              </h1>
              <p>
                Sthana Kampus membantu mencari fasilitas, mengajukan reservasi,
                dan memantau persetujuan dalam satu tempat.
              </p>
              <div className="hero-actions">
                <Link href="/facilities" className="sthana-button primary">
                  Lihat fasilitas{" "}
                  <IconArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  href="/app/reservations/new"
                  className="sthana-button secondary"
                >
                  <IconCalendarEvent size={18} aria-hidden="true" />
                  Ajukan reservasi
                </Link>
              </div>
            </div>
            <DashboardPreview />
          </div>
          <div className="sthana-container feature-strip">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <span className="feature-icon">
                  <Icon size={25} stroke={1.7} aria-hidden="true" />
                </span>
                <div>
                  <h2>{title}</h2>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <div className="sthana-container landing-sections">
          <section
            className="landing-facilities-section"
            data-reveal
            aria-labelledby="facilities-heading"
          >
            <div className="section-heading">
              <div>
                <h2 id="facilities-heading">Ruang untuk setiap rencana</h2>
                <p>Temukan fasilitas yang pas untuk kegiatanmu</p>
              </div>
              <Link
                href="/facilities"
                className="sthana-button secondary small"
              >
                Semua fasilitas <IconArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="public-facilities-grid landing-facilities-grid">
              {facilities.map((f) => (
                <article
                  className="public-facility-card landing-facility-card"
                  key={f.slug}
                >
                  <div className="public-facility-image">
                    <Image
                      src={f.image}
                      alt={f.imageAlt}
                      fill
                      sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                    />
                    <span
                      className={
                        f.status === "Perawatan"
                          ? "public-facility-status public-facility-status-maintenance"
                          : "public-facility-status"
                      }
                    >
                      <i /> {f.status}
                    </span>
                  </div>
                  <div className="public-facility-body">
                    <span className="public-facility-type">{f.category}</span>
                    <h3>{f.name}</h3>
                    <p>{f.description}</p>
                    <div className="public-facility-meta">
                      <span>
                        <IconMapPin size={16} aria-hidden="true" />
                        {f.building}
                      </span>
                      <span>
                        <IconUsers size={16} aria-hidden="true" />
                        {f.capacity} orang
                      </span>
                    </div>
                    <Link
                      href="/facilities"
                      className="public-facility-action landing-facility-action"
                      aria-label={`Lihat fasilitas ${f.name}`}
                    >
                      Lihat fasilitas
                      <IconArrowRight size={17} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section id="cara-kerja" data-reveal aria-labelledby="steps-heading">
            <div className="section-heading">
              <h2 id="steps-heading">
                Dari cari ruangan
                <br />
                sampai urusan beres
              </h2>
            </div>
            <StepsShowcase steps={steps} />
          </section>
          <section data-reveal aria-labelledby="faq-heading">
            <div className="faq-layout">
              <div className="faq-intro">
                <h2 id="faq-heading">Sering ditanyakan</h2>
                <p>
                  Jawaban singkat untuk hal yang paling sering ditanyakan soal
                  reservasi dan pelaporan fasilitas.
                </p>
                <SthaniFace expression="bingung" className="faq-mascot" />
              </div>
              <FaqAccordion items={faqs} />
            </div>
          </section>
          <section className="report-banner" data-reveal>
            <div>
              <h2>AC mati atau kursi rusak?</h2>
              <p>Laporkan fasilitas bermasalah, lalu pantau penanganannya.</p>
              <Link href="/app/reports/new" className="sthana-button white">
                Laporkan kendala <IconArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <Image
              src="/brand/sthana-mark-512.png"
              alt=""
              width={260}
              height={260}
              className="banner-mark"
            />
          </section>
        </div>
      </LandingMotion>
    </main>
  )
}
