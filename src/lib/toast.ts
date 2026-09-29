import { toast } from "sonner"

import { getErrorMessage } from "@/lib/errors"

/**
 * Shows an error toast with a readable reason and returns that reason so
 * callers can also keep their inline message.
 */
export function toastError(title: string, error: unknown, fallback = title) {
  const message = getErrorMessage(error, fallback)
  toast.error(title, message === title ? undefined : { description: message })
  return message
}

/** Runs a mutation from a click handler and reports the outcome as toasts. */
export async function runWithToast(
  action: () => Promise<unknown>,
  messages: { success: string; error: string }
) {
  try {
    await action()
    toast.success(messages.success)
  } catch (error) {
    toastError(messages.error, error)
  }
}
