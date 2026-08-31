import "server-only"

import { loadEnv } from "@/server/env"

import { createDatabase, type DatabaseClient } from "./client"

const globalDatabase = globalThis as typeof globalThis & {
  ppkDatabase?: DatabaseClient
}

export function getDatabaseClient() {
  if (!globalDatabase.ppkDatabase) {
    globalDatabase.ppkDatabase = createDatabase(loadEnv().DATABASE_URL)
  }

  return globalDatabase.ppkDatabase
}

export function getDatabase() {
  return getDatabaseClient().db
}
