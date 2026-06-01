import { defineConfig } from "vitest/config";

// Dedikerad konfig för A/B-kostnadstestet (scripts/ab-test-pipeline.ts). Det gör
// RIKTIGA Claude-anrop, så det körs ALDRIG i den vanliga `pnpm test`-sviten
// (vars include är **/*.test.ts). Kör explicit:
//   node_modules/.bin/vitest run --config vitest.ab.config.ts
export default defineConfig({
  test: {
    include: ["scripts/ab-test-pipeline.ts"],
    environment: "node",
    testTimeout: 900_000,
    hookTimeout: 120_000,
  },
});
