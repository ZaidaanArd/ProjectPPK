type ScaffoldPageProps = {
  area: string
  title: string
}

export function ScaffoldPage({ area, title }: ScaffoldPageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-xl border bg-card p-8 shadow-sm">
        <p className="mb-3 text-sm font-medium text-muted-foreground">{area}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-4 text-muted-foreground">
          Placeholder route. Fitur dan desain belum diimplementasikan.
        </p>
      </section>
    </main>
  )
}
