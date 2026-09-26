const illustrations = {
  "Aula Gedung A": {
    src: "/images/facilities/16859956.jpg",
    alt: "Ilustrasi aula dengan deretan kursi seminar",
    width: 800,
    height: 533,
  },
  "Lab Komputer 3": {
    src: "/images/facilities/18471480.jpg",
    alt: "Ilustrasi laboratorium dengan deretan komputer",
    width: 800,
    height: 600,
  },
  "Ruang Seminar 2": {
    src: "/images/facilities/6602623.jpg",
    alt: "Ilustrasi ruang seminar dengan meja dan kursi",
    width: 800,
    height: 800,
  },
  "Lapangan Basket Outdoor": {
    src: "/images/facilities/2186251.jpg",
    alt: "Ilustrasi lapangan basket luar ruang",
    width: 800,
    height: 1200,
  },
  "Studio Multimedia": {
    src: "/images/facilities/7457920.jpg",
    alt: "Ilustrasi studio dengan perangkat komputer",
    width: 800,
    height: 600,
  },
  "Ruang Rapat Senat": {
    src: "/images/facilities/8102300.jpg",
    alt: "Ilustrasi ruang rapat dengan meja dan jendela besar",
    width: 800,
    height: 1200,
  },
} as const

const categoryIllustrations = [
  { match: /olahraga|lapangan|basket/i, name: "Lapangan Basket Outdoor" },
  { match: /komputer|lab|studio/i, name: "Lab Komputer 3" },
  { match: /rapat/i, name: "Ruang Rapat Senat" },
  { match: /aula/i, name: "Aula Gedung A" },
  { match: /seminar|kelas/i, name: "Ruang Seminar 2" },
] as const

export function facilityIllustration(name: string, type: string) {
  if (Object.hasOwn(illustrations, name)) {
    return illustrations[name as keyof typeof illustrations]
  }

  const category = categoryIllustrations.find(({ match }) =>
    match.test(`${type} ${name}`)
  )

  return category
    ? illustrations[category.name]
    : illustrations["Ruang Seminar 2"]
}
