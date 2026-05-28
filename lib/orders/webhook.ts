import { createVerify } from "node:crypto";

// Wix levererar webhooks som ett RS256-signerat JWT i request-body. Verifiera
// med appens publika nyckel (från Wix Dev Center). Ren funktion — testbar med
// ett eget nyckelpar.

function b64urlToBuffer(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/** Verifierar ett RS256-JWT och returnerar payload, eller null vid ogiltig signatur. */
export function verifyJwtRs256(token: string, publicKeyPem: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  try {
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${header}.${payload}`);
    verifier.end();
    const ok = verifier.verify(publicKeyPem, b64urlToBuffer(signature));
    if (!ok) return null;
    return JSON.parse(b64urlToBuffer(payload).toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Tar emot råa request-body:n. Om en publik nyckel är konfigurerad verifieras
 * och avkodas JWT:t; annars (t.ex. i test/dev) tolkas body som rå JSON.
 * Wix lägger ofta själva händelsen i ett `data`-fält som JSON-sträng.
 */
export function parseWebhookBody(rawBody: string, publicKeyPem?: string): Record<string, unknown> | null {
  let outer: Record<string, unknown> | null = null;

  if (publicKeyPem) {
    outer = verifyJwtRs256(rawBody.trim(), publicKeyPem);
    if (!outer) return null; // signatur ogiltig → avvisa
  } else {
    try {
      outer = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  // Veckla ut ett ev. inbäddat data-fält (sträng eller objekt).
  if (typeof outer.data === "string") {
    try {
      return JSON.parse(outer.data) as Record<string, unknown>;
    } catch {
      return outer;
    }
  }
  if (outer.data && typeof outer.data === "object") {
    return outer.data as Record<string, unknown>;
  }
  return outer;
}
