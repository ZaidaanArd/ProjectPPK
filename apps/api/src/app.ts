import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import session, { type SessionStore } from "@fastify/session"
import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify"
import { ZodError } from "zod"

import { authRoutes } from "./app/routes/auth-routes.js"
import { healthRoutes } from "./app/routes/health-routes.js"
import { type AppEnv, loadEnv } from "./config/env.js"

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

type BuildAppOptions = {
  env?: AppEnv
  logger?: FastifyServerOptions["logger"]
  sessionStore?: SessionStore
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const env = options.env ?? loadEnv()
  const app = Fastify({
    logger: options.logger ?? false,
  })

  app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
  })
  app.register(cookie)
  app.register(session, {
    secret: env.SESSION_SECRET,
    cookieName: "ppk.sid",
    saveUninitialized: false,
    rolling: true,
    store: options.sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })

  app.addHook("onRequest", async (request, reply) => {
    if (
      request.url.startsWith("/api/") &&
      MUTATING_METHODS.has(request.method) &&
      request.headers.origin !== env.WEB_ORIGIN
    ) {
      return reply.code(403).send({
        code: "INVALID_ORIGIN",
        message: "Origin permintaan tidak diizinkan.",
        requestId: request.id,
      })
    }
  })

  app.register(healthRoutes)
  app.register(authRoutes, { prefix: "/api/v1/auth" })

  app.setNotFoundHandler((request, reply) => {
    return reply.code(404).send({
      code: "NOT_FOUND",
      message: "Endpoint tidak ditemukan.",
      requestId: request.id,
    })
  })

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(422).send({
        code: "VALIDATION_ERROR",
        message: "Data yang dikirim belum valid.",
        fieldErrors: error.flatten().fieldErrors,
        requestId: request.id,
      })
    }

    const fastifyError = error as FastifyError
    request.log.error(fastifyError)
    const statusCode = fastifyError.statusCode ?? 500
    return reply.code(statusCode).send({
      code: statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR",
      message:
        statusCode >= 500
          ? "Terjadi kesalahan pada server."
          : fastifyError.message,
      requestId: request.id,
    })
  })

  return app
}
