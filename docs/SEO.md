# Sthana Kampus: metadata and indexing

Set `SITE_URL` to the final HTTPS production origin before building the production deployment. Leave it unset locally. On Vercel, configure it for the Production environment only.

- Without a production URL, pages use `noindex, nofollow`, robots disallows crawling, and the sitemap is empty.
- With a production URL, the homepage, `/facilities`, `/tentang`, and the public `/docs` pages receive canonical URLs, remain indexable, and appear in the sitemap. The homepage defines the website, web application, and creator; `/facilities` defines the collection page; `/tentang` describes the same entities in visible text and structured data.
- Login, registration, portals, and forbidden remain noindex. The facilities catalogue has shipped and is included in the sitemap.
- Vercel preview builds stay noindex even when SITE_URL is present.
- `/opengraph-image` generates the 1200×630 sharing image from the local brand mark. The primary Search favicon is the stable 96×96 PNG, with a conventional `/favicon.ico` fallback; app icons and the manifest remain in `public`.

Metadata is set at build time. Rebuild after changing the production URL. Indexing directives do not provide access control.

Photo sources and license are documented in [ATTRIBUTION.md](../public/images/facilities/ATTRIBUTION.md). Landing data and dashboard illustrations are examples, not usage statistics.

## Search Console release checklist

Use the verified `myudak.com` Domain property, which also covers `sthana.myudak.com`.

1. Deploy production with `SITE_URL=https://sthana.myudak.com`.
2. Confirm the homepage is indexable and its canonical is the HTTPS origin.
3. Submit `https://sthana.myudak.com/sitemap.xml`.
4. Inspect the homepage and `/tentang`, run live tests, and request indexing.
5. Record the submission below, then monitor branded queries and Core Web Vitals in Search Console.

### Submission log

| Date (Asia/Jakarta) | Sitemap           | Live test                         | Indexing request |
| ------------------- | ----------------- | --------------------------------- | ---------------- |
| 2026-09-12          | Success           | Indexable                         | Queued           |
| 2026-09-13          | Success (2 pages) | Homepage and `/tentang` indexable | Both queued      |

On 2026-09-13, Search Console initially reported `/tentang` as "Discovered - currently not indexed", which is expected for a newly published URL. Its live test passed before the indexing request was submitted.

The Rich Results Test detected one valid Software Application item. Its only notices were the optional `offers` and `aggregateRating` fields; they remain omitted because the scaffold has no real pricing or ratings.

## Bing Webmaster Tools

Use `https://sthana.myudak.com/` as the site URL. Verify ownership in Bing Webmaster Tools (or import the verified Google Search Console property), then submit `https://sthana.myudak.com/sitemap.xml`. Check URL Inspection for `/`, `/facilities`, `/tentang`, and `/docs`, and review any crawl or indexing errors. Do not mark this complete until the site is visible in the Bing account and sitemap submission is confirmed there.

The sitemap's `lastModified` is a release date, not a build timestamp. Update it when these public pages actually change. IndexNow can be added if public content starts changing frequently; a submission is a crawl notification, not an indexing guarantee.
