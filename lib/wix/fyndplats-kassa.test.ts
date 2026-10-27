import { createHash, createPublicKey } from "node:crypto";
import { describe, expect, it } from "vitest";
import { FYNDPLATS_KASSA_PUBLIC_KEY } from "./fyndplats-kassa";

describe("Fyndplats kassas publika nyckel", () => {
  it("är en RSA-nyckel på 2048 bitar", () => {
    const nyckel = createPublicKey(FYNDPLATS_KASSA_PUBLIC_KEY);
    expect(nyckel.asymmetricKeyType).toBe("rsa");
    expect(nyckel.asymmetricKeyDetails?.modulusLength).toBe(2048);
  });

  // Fingeravtrycket är nyckeln som lästes ur appens panel 2026-10-27. En ändring
  // av nyckeln ska vara ett beslut, inte ett tecken som råkade följa med.
  it("är nyckeln som lästes ur appens panel", () => {
    const der = createPublicKey(FYNDPLATS_KASSA_PUBLIC_KEY).export({ type: "spki", format: "der" });
    expect(createHash("sha256").update(der).digest("hex").slice(0, 16)).toBe("46e669837a6976da");
  });
});
