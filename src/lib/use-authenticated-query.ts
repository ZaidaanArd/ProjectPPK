"use client"

import type { OptionalRestArgsOrSkip } from "convex/react"
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server"
import { useAppAuth, useAppQuery } from "@/lib/data-hooks"

/**
 * Starts a private query only after Convex has confirmed the browser token.
 * This prevents protected functions from racing Better Auth token exchange.
 */
export function useAuthenticatedQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>
): FunctionReturnType<Query> | undefined {
  const { isAuthenticated } = useAppAuth()
  const queryArgs = [
    isAuthenticated ? args : "skip",
  ] as unknown as OptionalRestArgsOrSkip<Query>

  return useAppQuery(query, ...queryArgs)
}
