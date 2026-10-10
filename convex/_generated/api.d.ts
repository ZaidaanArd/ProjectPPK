/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as emergencyClosures from "../emergencyClosures.js";
import type * as facilities from "../facilities.js";
import type * as facilityIssues from "../facilityIssues.js";
import type * as http from "../http.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_authz from "../lib/authz.js";
import type * as lib_facilityHandling from "../lib/facilityHandling.js";
import type * as lib_maintenance from "../lib/maintenance.js";
import type * as lib_notifications from "../lib/notifications.js";
import type * as lib_reportHandling from "../lib/reportHandling.js";
import type * as lib_reservationState from "../lib/reservationState.js";
import type * as lib_reservationTime from "../lib/reservationTime.js";
import type * as lib_validators from "../lib/validators.js";
import type * as lib_workflows from "../lib/workflows.js";
import type * as maintenance from "../maintenance.js";
import type * as notifications from "../notifications.js";
import type * as profiles from "../profiles.js";
import type * as reports from "../reports.js";
import type * as reservations from "../reservations.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  emergencyClosures: typeof emergencyClosures;
  facilities: typeof facilities;
  facilityIssues: typeof facilityIssues;
  http: typeof http;
  "lib/audit": typeof lib_audit;
  "lib/authz": typeof lib_authz;
  "lib/facilityHandling": typeof lib_facilityHandling;
  "lib/maintenance": typeof lib_maintenance;
  "lib/notifications": typeof lib_notifications;
  "lib/reportHandling": typeof lib_reportHandling;
  "lib/reservationState": typeof lib_reservationState;
  "lib/reservationTime": typeof lib_reservationTime;
  "lib/validators": typeof lib_validators;
  "lib/workflows": typeof lib_workflows;
  maintenance: typeof maintenance;
  notifications: typeof notifications;
  profiles: typeof profiles;
  reports: typeof reports;
  reservations: typeof reservations;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
