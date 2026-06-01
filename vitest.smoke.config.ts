import { defineConfig } from "vitest/config";

// Live-smoke för Batch API (scripts/batch-smoke.ts) — gör RIKTIGA Anthropic-anrop.
// Körs aldrig i `pnpm test`. Kör explicit:
//   node_modules/.bin/vitest run --config vitest.smoke.config.ts
export default defineConfig({
  test: {
    include: ["scripts/batch-smoke.ts"],
    environment: "node",
    testTimeout: 300_000,
    hookTimeout: 60_000,
  },
});
