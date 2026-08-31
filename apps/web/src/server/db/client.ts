import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

export function createDatabase(url: string) {
  const client = postgres(url, { max: 10 })
  const db = drizzle(client, { schema })

  return { client, db }
}

export type DatabaseClient = ReturnType<typeof createDatabase>
export type Database = DatabaseClient["db"]
