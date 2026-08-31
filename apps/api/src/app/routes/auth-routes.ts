import type { FastifyPluginAsync } from "fastify"

import { getSessionController } from "../controllers/auth-controller.js"

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.get("/session", getSessionController)
}
