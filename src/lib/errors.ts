import { ConvexError } from "convex/values"

const CONVEX_NOISE = [
  /\[CONVEX [^\]]*\]/g,
  /\[Request ID: [^\]]*\]/g,
  /\bServer Error\b/g,
  /\bUncaught (?:ConvexError|Error|TypeError|RangeError):?/g,
  /\bConvexError:/g,
  /\bArgumentValidationError:?/g,
]

/**
 * Turns an unknown thrown value into a short message that is safe to show
 * to users. Convex prefixes errors with request metadata and stack traces;
 * those are stripped so only the human-readable reason remains.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) {
    const data: unknown = error.data
    if (typeof data === "string" && data.trim()) return data.trim()
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string" &&
      data.message.trim()
    ) {
      return data.message.trim()
    }
  }

  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : ""
  if (!raw) return fallback

  // Drop stack frames and "Called by client" trailers.
  let message = raw.split(/\n\s*(?:at |Called by )/)[0] ?? ""
  for (const pattern of CONVEX_NOISE) message = message.replace(pattern, " ")
  message = message.replace(/\s+/g, " ").trim()

  // Validator failures and internal errors are not useful to end users.
  if (
    !message ||
    /validator|Object contains extra field|Value does not match/i.test(message)
  ) {
    return fallback
  }
  return message
}
