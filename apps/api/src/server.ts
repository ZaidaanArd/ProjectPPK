import { buildApp } from "./app.js"
import { createDatabase } from "./app/models/database.js"
import { PostgresSessionStore } from "./app/models/session-store.js"
import { loadEnv } from "./config/env.js"

const env = loadEnv()
const { client } = createDatabase(env.DATABASE_URL)
const app = buildApp({
  env,
  logger:
    env.NODE_ENV === "development"
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "SYS:standard" },
          },
        }
      : true,
  sessionStore: new PostgresSessionStore(client),
})

async function shutdown(signal: string) {
  app.log.info({ signal }, "Menutup API")
  await app.close()
  await client.end()
  process.exit(0)
}

process.once("SIGINT", () => void shutdown("SIGINT"))
process.once("SIGTERM", () => void shutdown("SIGTERM"))

app
  .listen({ host: env.API_HOST, port: env.API_PORT })
  .catch(async (error: unknown) => {
    app.log.error(error)
    await client.end()
    process.exit(1)
  })
