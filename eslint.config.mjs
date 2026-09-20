import { defineConfig, globalIgnores } from "eslint/config"
import convexPlugin from "@convex-dev/eslint-plugin"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypeScript from "eslint-config-next/typescript"

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  ...convexPlugin.configs.recommended,
  globalIgnores([".next/**", "dist/**", "convex/_generated/**"]),
])
