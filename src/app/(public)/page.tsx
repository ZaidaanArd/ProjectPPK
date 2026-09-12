import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  IconArrowRight,
  IconBuilding,
  IconCalendarEvent,
  IconCheck,
  IconMapPin,
  IconSearch,
  IconShield,
  IconUsers,
  IconUser,
  IconTool as IconWrench,
} from "@tabler/icons-react"
import { DashboardPreview } from "@/components/public/dashboard-preview"
import { LandingMotion } from "@/components/public/landing-motion"
import { facilities } from "@/lib/facilities"
export const metadata: Metadata = {
  title: { absolute: "Sthana Kampus — Reservasi & Pelaporan Fasilitas Kampus" },
  description:
    "Cari fasilitas kampus, ajukan reservasi ruangan, pantau persetujuan, dan laporkan kerusakan dalam satu tempat.",
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
const steps = [
  {
    icon: IconSearch,
    title: "Cari fasilitas",
    text: "Temukan ruangan sesuai lokasi, kapasitas, dan kebutuhanmu.",
  },
  {
    icon: IconCalendarEvent,
    title: "Ajukan reservasi",
    text: "Pilih tanggal dan waktu, lalu isi keperluan penggunaan.",
  },
  {
    icon: IconCheck,
    title: "Tunggu persetujuan",
    text: "Petugas memeriksa jadwal. Pantau status dari akunmu.",
  },
  {
    icon: IconWrench,
    title: "Laporkan kendala",
    text: "Ada yang rusak? Kirim laporan dan ikuti penanganannya.",
  },
]
const portals = [
  {
    icon: IconUser,
    title: "Pengguna",
    text: "Kelola reservasi dan laporan fasilitasmu.",
    href: "/app",
  },
  {
    icon: IconUsers,
    title: "Petugas",
    text: "Verifikasi reservasi dan tangani laporan.",
    href: "/staff",
  },
  {
    icon: IconShield,
    title: "Admin",
    text: "Kelola fasilitas, pengguna, dan rekap aktivitas.",
    href: "/admin",
  },
]
export default function HomePage() {
  return (
    <main id="main-content" className="sthana-landing">
      <LandingMotion>
        <section className="landing-hero">
          <div className="sthana-container hero-grid">
            <div className="hero-copy">
              <h1>
                Pinjam ruangan kampus <span>tanpa drama antre.</span>
              </h1>
              <p>
                Cari fasilitas, ajukan reservasi, dan pantau persetujuan. Semua
                kebutuhan ruang kampusmu, dalam satu tempat.
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
          <section data-reveal aria-labelledby="facilities-heading">
            <div className="section-heading">
              <div>
                <h2 id="facilities-heading">Ruang untuk setiap rencana.</h2>
                <p>Temukan fasilitas yang pas untuk kegiatanmu.</p>
              </div>
              <Link
                href="/facilities"
                className="sthana-button secondary small"
              >
                Semua fasilitas <IconArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="facility-grid">
              {facilities.map((f) => (
                <article className="facility-card" key={f.slug}>
                  <div className="facility-photo">
                    <Image
                      src={f.image}
                      alt={f.imageAlt}
                      fill
                      sizes="(max-width: 600px) 110px, (max-width: 1100px) 140px, 120px"
                    />
                  </div>
                  <div className="facility-info">
                    <div className="facility-tags">
                      <span>{f.category}</span>
                      <span
                        className={`facility-status status-${f.status.toLowerCase()}`}
                      >
                        {f.status}
                      </span>
                    </div>
                    <h3>{f.name}</h3>
                    <p>{f.description}</p>
                    <div className="facility-meta">
                      <span>
                        <IconMapPin size={13} aria-hidden="true" />
                        {f.building}
                      </span>
                      <span>
                        <IconUsers size={13} aria-hidden="true" />
                        {f.capacity} orang
                      </span>
                    </div>
                    <Link
                      href="/facilities"
                      aria-label={`Lihat fasilitas ${f.name}`}
                    >
                      Lihat fasilitas{" "}
                      <IconArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <p className="demo-note">
              Katalog contoh · Foto merupakan ilustrasi fasilitas.
            </p>
          </section>
          <section id="tentang" data-reveal aria-labelledby="steps-heading">
            <div className="section-heading">
              <h2 id="steps-heading">
                Dari cari ruangan
                <br />
                sampai urusan beres.
              </h2>
              <p>Empat langkah, semuanya tercatat.</p>
            </div>
            <div className="steps-grid">
              {steps.map(({ icon: Icon, title, text }, i) => (
                <article key={title}>
                  <div className="step-top">
                    <span className="feature-icon">
                      <Icon size={26} stroke={1.7} aria-hidden="true" />
                    </span>
                    <span className="step-number">0{i + 1}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  {i < 3 && (
                    <IconArrowRight
                      className="step-arrow"
                      size={20}
                      aria-hidden="true"
                    />
                  )}
                </article>
              ))}
            </div>
          </section>
          <section data-reveal aria-labelledby="portals-heading">
            <div className="section-heading">
              <h2 id="portals-heading">Satu sistem, tiga pintu masuk.</h2>
            </div>
            <div className="portal-grid">
              {portals.map(({ icon: Icon, title, text, href }) => (
                <article key={title}>
                  <span className="feature-icon">
                    <Icon size={25} aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                    <Link href={href}>
                      Buka portal{" "}
                      <IconArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
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
