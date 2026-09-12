import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return siteUrl
    ? [
        { url: siteUrl, changeFrequency: "monthly", priority: 1 },
        {
          url: `${siteUrl}/tentang`,
          changeFrequency: "yearly",
          priority: 0.6,
        },
      ]
    : []
}
