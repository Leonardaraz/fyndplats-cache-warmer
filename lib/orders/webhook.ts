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
 * Avkodar payload från JWT UTAN signaturverifiering. Endast för bodies som vi
 * vet redan har verifierats upstream (t.ex. forward från fyndplats-headless
 * efter att den verifierat Wix-signaturen). Använd ALDRIG direkt mot okänd
 * input — då måste verifyJwtRs256 användas.
 */
export function decodeJwtUnsafe(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(b64urlToBuffer(parts[1]).toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Vecklar ut ett ev. inbäddat data-fält (sträng eller objekt) ur Wix-payload.
 * Wix lägger ofta själva händelsen i ett `data`-fält som JSON-sträng.
 */
function unwrapDataField(outer: Record<string, unknown>): Record<string, unknown> {
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

/**
 * Tar emot råa request-body:n. Om en publik nyckel är konfigurerad verifieras
 * och avkodas JWT:t; annars (t.ex. i test/dev) tolkas body som rå JSON.
 * Wix lägger ofta själva händelsen i ett `data`-fält som JSON-sträng.
 *
 * `trustedForwarded=true` skippar signaturverifiering helt — använd ENDAST när
 * vi vet att payloaden redan verifierats upstream (X-Forwarded-From-header från
 * fyndplats-headless). Body kan då vara antingen ett JWT (Wix-format som
 * forwardats orört) eller rå JSON.
 */
export function parseWebhookBody(
  rawBody: string,
  publicKeyPem?: string,
  options?: { trustedForwarded?: boolean },
): Record<string, unknown> | null {
  let outer: Record<string, unknown> | null = null;

  if (options?.trustedForwarded) {
    // Forwarded body kan vara JWT (Wix:s original) eller rå JSON. Försök JWT
    // först (vanligaste fallet), faller tillbaka på JSON-parse.
    const trimmed = rawBody.trim();
    if (trimmed.split(".").length === 3 && !trimmed.startsWith("{")) {
      outer = decodeJwtUnsafe(trimmed);
    }
    if (!outer) {
      try {
        outer = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
  } else if (publicKeyPem) {
    outer = verifyJwtRs256(rawBody.trim(), publicKeyPem);
    if (!outer) return null; // signatur ogiltig → avvisa
  } else {
    try {
      outer = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return unwrapDataField(outer);
}
