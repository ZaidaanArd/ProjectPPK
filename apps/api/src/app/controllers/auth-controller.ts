import type { FastifyReply, FastifyRequest } from "fastify"

export function getSessionController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return reply.send({ user: request.session.user ?? null })
}
