import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/app/models/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://ppk:ppk@localhost:5432/ppk",
  },
  strict: true,
  verbose: true,
})
