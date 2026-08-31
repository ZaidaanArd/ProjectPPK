import { apiErrorSchema, type ApiError } from "@workspace/contracts"

const API_URL = import.meta.env.VITE_API_URL ?? ""

export class ApiClientError extends Error {
  readonly detail: ApiError

  constructor(detail: ApiError) {
    super(detail.message)
    this.name = "ApiClientError"
    this.detail = detail
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  const payload: unknown = await response.json()
  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(payload)
    if (parsedError.success) throw new ApiClientError(parsedError.data)

    throw new Error("Respons server tidak dapat dibaca.")
  }

  return payload as T
}
