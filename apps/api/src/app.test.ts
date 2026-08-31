import fastifySession from "@fastify/session"
import { afterEach, describe, expect, it } from "vitest"

import { requireRole } from "./app/services/auth-guard.js"
import { buildApp } from "./app.js"
import { loadEnv } from "./config/env.js"

const env = loadEnv({
  NODE_ENV: "test",
  WEB_ORIGIN: "http://localhost:5173",
  SESSION_SECRET: "test-secret-with-at-least-32-characters",
})

const apps: ReturnType<typeof buildApp>[] = []

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()))
})

describe("API scaffold", () => {
  it("returns typed health information", async () => {
    const app = buildApp({
      env,
      sessionStore: new fastifySession.MemoryStore(),
    })
    apps.push(app)
    const response = await app.inject({ method: "GET", url: "/health" })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      status: "ok",
      service: "project-ppk-api",
    })
  })

  it("returns an anonymous session by default", async () => {
    const app = buildApp({
      env,
      sessionStore: new fastifySession.MemoryStore(),
    })
    apps.push(app)
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/auth/session",
      headers: { origin: env.WEB_ORIGIN },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ user: null })
    expect(response.headers["access-control-allow-credentials"]).toBe("true")
  })

  it("protects role-scoped routes", async () => {
    const app = buildApp({
      env,
      sessionStore: new fastifySession.MemoryStore(),
    })
    apps.push(app)
    app.get("/protected", { preHandler: requireRole("admin") }, async () => ({
      ok: true,
    }))

    const response = await app.inject({ method: "GET", url: "/protected" })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ code: "UNAUTHENTICATED" })
  })

  it("uses the common not-found envelope", async () => {
    const app = buildApp({
      env,
      sessionStore: new fastifySession.MemoryStore(),
    })
    apps.push(app)
    const response = await app.inject({ method: "GET", url: "/missing" })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toMatchObject({ code: "NOT_FOUND" })
  })
})
