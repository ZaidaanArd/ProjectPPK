import { readFile } from "node:fs/promises"
import { join } from "node:path"

import type { PublicDoc } from "@/lib/public-docs"

export function readPublicDoc(doc: PublicDoc): Promise<string> {
  return readFile(join(process.cwd(), "docs", doc.file), "utf8")
}
