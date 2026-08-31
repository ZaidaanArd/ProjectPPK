import type { UserSession } from "@workspace/contracts"

declare module "fastify" {
  interface Session {
    user?: UserSession
  }
}

export {}
