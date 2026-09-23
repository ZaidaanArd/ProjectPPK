"use client"

import { useCallback, useSyncExternalStore } from "react"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { getFunctionName } from "convex/server"
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server"

import { isStaticMode } from "@/lib/data-mode"
import {
  getDemoRole,
  getStaticData,
  hydrateStaticData,
  staticMutation,
  staticQuery,
  subscribeStaticData,
  useStaticData,
} from "@/lib/static-data"

function useStaticQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args?: FunctionArgs<Query> | "skip"
): FunctionReturnType<Query> | undefined {
  useStaticData()
  if (args === "skip") return undefined
  return staticQuery(getFunctionName(query), args) as FunctionReturnType<Query>
}

function useStaticMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation
) {
  const name = getFunctionName(mutation)
  return useCallback(
    async (args: FunctionArgs<Mutation>) =>
      staticMutation(name, args) as Promise<FunctionReturnType<Mutation>>,
    [name]
  )
}

function useStaticAuth() {
  const role = useSyncExternalStore<ReturnType<typeof getDemoRole> | "loading">(
    subscribeStaticData,
    getDemoRole,
    () => "loading"
  )
  return {
    isLoading: role === "loading",
    isAuthenticated: role !== null && role !== "loading",
  }
}

// Selection is fixed for the lifetime of a development server, so each caller
// always invokes the same hook implementation on every render.
export const useAppQuery = (
  isStaticMode ? useStaticQuery : useQuery
) as typeof useQuery
export const useAppMutation = (
  isStaticMode ? useStaticMutation : useMutation
) as typeof useMutation
export const useAppAuth = (
  isStaticMode ? useStaticAuth : useConvexAuth
) as typeof useConvexAuth

export async function prepareStaticData() {
  if (isStaticMode) await hydrateStaticData()
  return getStaticData()
}
