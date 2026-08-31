import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const userRole = pgEnum("user_role", ["user", "officer", "admin"])
export const accountStatus = pgEnum("account_status", [
  "pending",
  "active",
  "rejected",
  "disabled",
])
export const facilityStatus = pgEnum("facility_status", [
  "active",
  "maintenance",
  "inactive",
])
export const reservationStatus = pgEnum("reservation_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
])
export const reportStatus = pgEnum("report_status", [
  "pending",
  "in_progress",
  "resolved",
  "rejected",
])

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("user"),
    status: accountStatus("status").notNull().default("pending"),
    verifiedBy: uuid("verified_by"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)]
)

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid", { length: 128 }).primaryKey(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("sessions_expires_at_idx").on(table.expiresAt)]
)

export const facilities = pgTable(
  "facilities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 150 }).notNull(),
    type: varchar("type", { length: 80 }).notNull(),
    location: varchar("location", { length: 180 }).notNull(),
    capacity: integer("capacity").notNull(),
    description: text("description").notNull(),
    status: facilityStatus("status").notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    check("facilities_capacity_positive", sql`${table.capacity} > 0`),
    index("facilities_status_idx").on(table.status),
  ]
)

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id),
    facilityId: uuid("facility_id")
      .notNull()
      .references(() => facilities.id),
    purpose: text("purpose").notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    status: reservationStatus("status").notNull().default("pending"),
    processedBy: uuid("processed_by").references(() => users.id),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    decisionNote: text("decision_note"),
    ...timestamps,
  },
  (table) => [
    check(
      "reservations_time_order",
      sql`${table.endTime} > ${table.startTime}`
    ),
    index("reservations_facility_time_idx").on(
      table.facilityId,
      table.startTime,
      table.endTime
    ),
    index("reservations_requester_idx").on(table.requesterId),
    index("reservations_status_idx").on(table.status),
  ]
)

export const reservationStatusHistory = pgTable(
  "reservation_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    fromStatus: reservationStatus("from_status"),
    toStatus: reservationStatus("to_status").notNull(),
    changedBy: uuid("changed_by").references(() => users.id),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reservation_history_reservation_idx").on(table.reservationId),
  ]
)

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id),
    facilityId: uuid("facility_id")
      .notNull()
      .references(() => facilities.id),
    category: varchar("category", { length: 80 }).notNull(),
    description: text("description").notNull(),
    photoUrl: text("photo_url"),
    status: reportStatus("status").notNull().default("pending"),
    handledBy: uuid("handled_by").references(() => users.id),
    resolutionNote: text("resolution_note"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("reports_facility_idx").on(table.facilityId),
    index("reports_status_idx").on(table.status),
  ]
)

export const reportStatusHistory = pgTable(
  "report_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    fromStatus: reportStatus("from_status"),
    toStatus: reportStatus("to_status").notNull(),
    changedBy: uuid("changed_by").references(() => users.id),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("report_history_report_idx").on(table.reportId)]
)
