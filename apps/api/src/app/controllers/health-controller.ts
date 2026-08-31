import type { FastifyReply, FastifyRequest } from "fastify"

export function getHealthController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return reply.send({
    status: "ok",
    service: "project-ppk-api",
    version: "0.0.1",
    uptime: Math.round(process.uptime()),
    requestId: request.id,
  })
}
