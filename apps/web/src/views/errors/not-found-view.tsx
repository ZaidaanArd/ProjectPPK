import { buttonVariants } from "@workspace/ui/components/button"
import { Link } from "react-router-dom"

export function Component() {
  return (
    <section className="mx-auto grid min-h-[65svh] max-w-xl place-items-center px-6 text-center">
      <div>
        <p className="font-mono text-xs font-bold tracking-widest text-primary">
          404 · RUTE TIDAK DITEMUKAN
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Sepertinya kamu keluar jalur.
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Halaman ini belum tersedia atau alamatnya sudah berubah.
        </p>
        <Link to="/" className={buttonVariants({ className: "mt-7" })}>
          Kembali ke beranda
        </Link>
      </div>
    </section>
  )
}
