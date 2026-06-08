import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
  },
  // Speglar tsconfig "@/*" → projektroten, så app/-filer (som importerar via @/)
  // kan enhetstestas. Påverkar inte befintliga test (de använder relativa imports).
  resolve: {
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL("./", import.meta.url)) }],
  },
});
