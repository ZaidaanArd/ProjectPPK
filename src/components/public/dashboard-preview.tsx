import Image from "next/image"
import {
  IconHome,
  IconCalendarEvent,
  IconBuilding,
  IconFileDescription,
  IconBell,
  IconSearch,
  IconCheck,
} from "@tabler/icons-react"
import { BrandLogo } from "@/components/brand-logo"
import { facilities } from "@/lib/facilities"
const items = [
  { icon: IconHome, label: "Beranda" },
  { icon: IconCalendarEvent, label: "Reservasi" },
  { icon: IconBuilding, label: "Fasilitas" },
  { icon: IconFileDescription, label: "Laporan" },
  { icon: IconBell, label: "Notifikasi" },
]
export function DashboardPreview() {
  return (
    <div
      className="preview-scene"
      role="img"
      aria-label="Ilustrasi dashboard Sthana Kampus dengan fasilitas dan jadwal reservasi contoh"
    >
      <div className="preview-ribbon" aria-hidden="true" />
      <div className="dashboard-window" aria-hidden="true">
        <div className="preview-sidebar">
          <BrandLogo />
          <div className="preview-nav">
            {items.map(({ icon: Icon, label }) => (
              <div key={label}>
                <Icon size={13} />
                {label}
              </div>
            ))}
          </div>
          <div className="preview-avatar">
            S<span>Akun pengguna</span>
          </div>
        </div>
        <div className="preview-content">
          <div className="preview-topbar">
            <span>
              <IconSearch size={12} />
              Cari fasilitas kampus
            </span>
            <IconBell size={15} />
          </div>
          <div className="preview-greeting">
            <strong>Halo,</strong>
            <b>Selamat datang di Sthana Kampus!</b>
            <p>Jadwal dan fasilitasmu, dalam satu tempat.</p>
          </div>
          <div className="preview-stats">
            {[
              ["3", "Reservasi aktif"],
              ["5", "Menunggu persetujuan"],
              ["2", "Laporan dibuat"],
            ].map(([number, label]) => (
              <div key={label}>
                <IconCalendarEvent size={17} />
                <span>
                  {label}
                  <b>{number}</b>
                </span>
              </div>
            ))}
          </div>
          <div className="preview-section-title">
            Fasilitas pilihan <span>Lihat semua →</span>
          </div>
          <div className="preview-facilities">
            {facilities.slice(0, 3).map((f) => (
              <div key={f.slug}>
                <Image
                  src={f.image}
                  alt=""
                  width={180}
                  height={120}
                  sizes="150px"
                />
                <b>{f.name}</b>
                <span>Tersedia</span>
              </div>
            ))}
          </div>
          <div className="preview-confirmed">
            <span>
              <IconCheck size={13} />
            </span>
            Reservasi berhasil diajukan
            <div />
          </div>
        </div>
      </div>
      <div className="preview-schedule" aria-hidden="true">
        <strong>
          Jadwal hari ini <span>•••</span>
        </strong>
        <div>
          <IconCalendarEvent size={18} />
          <p>
            <small>08.00 – 11.00</small>
            <b>Aula Gedung A</b>
            <span>Seminar mahasiswa</span>
          </p>
          <em>Berlangsung</em>
        </div>
        <div>
          <IconCalendarEvent size={18} />
          <p>
            <small>13.00 – 15.00</small>
            <b>Lab Komputer 3</b>
            <span>Praktikum sistem</span>
          </p>
          <em>Akan datang</em>
        </div>
      </div>
    </div>
  )
}
