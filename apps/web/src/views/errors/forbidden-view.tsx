import { buttonVariants } from "@workspace/ui/components/button"
import Link from "next/link"

export function Component() {
  return (
    <section className="mx-auto grid min-h-[65svh] max-w-xl place-items-center px-6 text-center">
      <div>
        <p className="font-mono text-xs font-bold tracking-widest text-primary">
          403 · AKSES DITOLAK
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Area ini bukan untuk peran akunmu.
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Kembali ke halaman publik atau gunakan akun dengan kewenangan yang
          sesuai.
        </p>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", className: "mt-7" })}
        >
          Kembali ke beranda
        </Link>
      </div>
    </section>
  )
}
