import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs"

export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
  // Valid placeholders keep static tooling/builds working before env injection.
  // Runtime auth is only called when the real public variables are present.
  convexUrl:
    process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://unused.convex.cloud",
  convexSiteUrl:
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "https://unused.convex.site",
})
