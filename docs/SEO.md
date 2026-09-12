# Sthana Kampus: metadata and indexing

Set `SITE_URL` to the final HTTPS production origin before building the production deployment. Leave it unset locally. On Vercel, configure it for the Production environment only.

- Without a production URL, pages use `noindex, nofollow`, robots disallows crawling, and the sitemap is empty.
- With a production URL, the homepage receives its canonical URL and WebSite structured data, and appears in the sitemap.
- Login, registration, portals, forbidden, and the facilities placeholder remain noindex. Update that page and the sitemap when the actual facility catalogue ships.
- Vercel preview builds stay noindex even when SITE_URL is present.
- `/opengraph-image` generates the 1200×630 sharing image from the local brand mark. Icons and the manifest live in `public`.

Metadata is set at build time. Rebuild after changing the production URL. Indexing directives do not provide access control.

Photo sources and license are documented in [ATTRIBUTION.md](../public/images/facilities/ATTRIBUTION.md). Landing data and dashboard illustrations are examples, not usage statistics.
