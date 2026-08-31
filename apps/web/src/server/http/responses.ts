import { randomUUID } from "node:crypto"

import type { ApiError } from "@workspace/contracts"
import { NextResponse } from "next/server"

export function createRequestId() {
  return randomUUID()
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  requestId = createRequestId()
) {
  const body: ApiError = { code, message, requestId }
  return NextResponse.json(body, { status })
}

export function internalErrorResponse(requestId = createRequestId()) {
  return errorResponse(
    500,
    "INTERNAL_ERROR",
    "Terjadi kesalahan pada server.",
    requestId
  )
}
