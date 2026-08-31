import type { FastifyPluginAsync } from "fastify"

import { getHealthController } from "../controllers/health-controller.js"

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", getHealthController)
}
