"use client"

import { ImagesBadge } from "@/components/ui/images-badge"

export default function ImagesBadgeDemo() {
  return (
    <div className="flex min-h-40 w-full items-center justify-center">
      <ImagesBadge
        name="Muchammad Yuda Tri Ananda"
        items={[
          {
            platform: "github",
            handle: "@myudak",
            href: "https://github.com/myudak",
          },
          {
            platform: "instagram",
            handle: "@myudakk",
            href: "https://www.instagram.com/myudakk/",
          },
          {
            platform: "linkedin",
            handle: "myudak",
            href: "https://www.linkedin.com/in/myudak/",
          },
        ]}
      />
    </div>
  )
}
