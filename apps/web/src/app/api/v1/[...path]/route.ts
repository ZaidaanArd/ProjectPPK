import { errorResponse } from "@/server/http/responses"

function notFound() {
  return errorResponse(404, "NOT_FOUND", "Endpoint tidak ditemukan.")
}

export const GET = notFound
export const POST = notFound
export const PUT = notFound
export const PATCH = notFound
export const DELETE = notFound
