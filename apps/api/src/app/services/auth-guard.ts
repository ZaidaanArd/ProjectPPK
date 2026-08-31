import type { UserRole } from "@workspace/contracts"
import type { FastifyReply, FastifyRequest } from "fastify"

function sendAuthorizationError(
  request: FastifyRequest,
  reply: FastifyReply,
  statusCode: 401 | 403,
  code: "UNAUTHENTICATED" | "FORBIDDEN",
  message: string
) {
  return reply.code(statusCode).send({
    code,
    message,
    requestId: request.id,
  })
}

export async function requireSession(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.session.user) {
    return sendAuthorizationError(
      request,
      reply,
      401,
      "UNAUTHENTICATED",
      "Silakan masuk untuk melanjutkan."
    )
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async function roleGuard(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const user = request.session.user
    if (!user) {
      return sendAuthorizationError(
        request,
        reply,
        401,
        "UNAUTHENTICATED",
        "Silakan masuk untuk melanjutkan."
      )
    }

    if (!allowedRoles.includes(user.role)) {
      return sendAuthorizationError(
        request,
        reply,
        403,
        "FORBIDDEN",
        "Akun tidak memiliki akses ke area ini."
      )
    }
  }
}
