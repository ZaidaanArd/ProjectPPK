import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().default("postgres://ppk:ppk@localhost:5432/ppk"),
  SESSION_SECRET: z.string().min(32).optional(),
})

export type AppEnv = Omit<z.infer<typeof envSchema>, "SESSION_SECRET"> & {
  SESSION_SECRET: string
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.parse(source)

  if (parsed.NODE_ENV === "production" && !parsed.SESSION_SECRET) {
    throw new Error("SESSION_SECRET wajib diatur pada environment production.")
  }

  return {
    ...parsed,
    SESSION_SECRET:
      parsed.SESSION_SECRET ?? "development-only-secret-change-me-123456",
  }
}
