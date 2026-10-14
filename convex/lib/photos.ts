import { ConvexError } from "convex/values"

import type { Id } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

/**
 * Checks an uploaded file's stored metadata (never the client's claim):
 * at most 5 MB and JPEG, PNG, or WebP. A rejected file is deleted so it does
 * not linger in storage. Returns the content type.
 */
export async function validateUploadedPhoto(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
  label = "Foto"
) {
  const metadata = await ctx.db.system.get(storageId)
  if (!metadata) {
    throw new ConvexError(`${label} tidak ditemukan`)
  }
  if (metadata.size > MAX_PHOTO_BYTES) {
    await ctx.storage.delete(storageId)
    throw new ConvexError("Ukuran foto maksimal 5 MB")
  }
  if (!metadata.contentType || !PHOTO_TYPES.has(metadata.contentType)) {
    await ctx.storage.delete(storageId)
    throw new ConvexError("Format foto harus JPG, PNG, atau WebP")
  }
  return metadata.contentType
}
