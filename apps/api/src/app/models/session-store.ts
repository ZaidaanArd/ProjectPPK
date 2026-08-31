import type { SessionStore } from "@fastify/session"
import type { Session } from "fastify"
import type { JSONValue, Sql } from "postgres"

const DEFAULT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export class PostgresSessionStore implements SessionStore {
  constructor(private readonly sql: Sql) {}

  set(
    sessionId: string,
    session: Session,
    callback: (error?: unknown) => void
  ) {
    const expiresAt =
      session.cookie.expires ?? new Date(Date.now() + DEFAULT_SESSION_TTL_MS)

    this.sql`
      insert into sessions (sid, data, expires_at)
      values (${sessionId}, ${this.sql.json(JSON.parse(JSON.stringify(session)) as JSONValue)}, ${expiresAt})
      on conflict (sid)
      do update set data = excluded.data, expires_at = excluded.expires_at
    `
      .then(() => callback())
      .catch((error: unknown) => callback(error))
  }

  get(
    sessionId: string,
    callback: (error: unknown, session?: Session | null) => void
  ) {
    this.sql<{ data: Session; expires_at: Date }[]>`
      select data, expires_at
      from sessions
      where sid = ${sessionId}
      limit 1
    `
      .then((rows) => {
        const row = rows[0]
        if (!row) {
          callback(null, null)
          return
        }

        if (new Date(row.expires_at).getTime() <= Date.now()) {
          this.destroy(sessionId, () => callback(null, null))
          return
        }

        callback(null, row.data)
      })
      .catch((error: unknown) => callback(error))
  }

  destroy(sessionId: string, callback: (error?: unknown) => void) {
    this.sql`delete from sessions where sid = ${sessionId}`
      .then(() => callback())
      .catch((error: unknown) => callback(error))
  }
}
