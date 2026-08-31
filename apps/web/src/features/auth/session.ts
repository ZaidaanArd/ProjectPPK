import {
  sessionResponseSchema,
  type SessionResponse,
} from "@workspace/contracts"
import { useQuery } from "@tanstack/react-query"

import { apiRequest } from "@/lib/api-client"

export const sessionQueryKey = ["auth", "session"] as const

export async function getSession(): Promise<SessionResponse> {
  const payload = await apiRequest<unknown>("/api/v1/auth/session")
  return sessionResponseSchema.parse(payload)
}

export function useSession() {
  return useQuery({ queryKey: sessionQueryKey, queryFn: getSession })
}
