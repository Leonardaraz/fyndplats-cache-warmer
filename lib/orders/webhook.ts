import { createVerify, timingSafeEqual } from "node:crypto";

/** Timing-säker strängjämförelse. */
function safeStrEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Avgör om ett forwardat anrop (från headless-fanouten) får litas på och hoppa
 * över egen signaturverifiering. Kräver rätt `X-Forwarded-From` OCH en
 * `X-Forward-Secret` som matchar den delade hemligheten
 * (`WEBHOOK_FORWARD_SECRET`).
 *
 * ☠️ Utan konfigurerad hemlighet litas forwarden INTE på (2026-11-14). Förut
 * räckte då rubriken `X-Forwarded-From`, en gissningsbar klartext som vem som
 * helst kan skriva, och den som skrev den slapp signaturkollen helt. En tappad
 * variabel öppnade alltså orderflödet för påhittade ordrar. Nu faller ett
 * sådant anrop tillbaka på Wix signatur (WIX_WEBHOOK_PUBLIC_KEY).
 *
 * `oppetUtanKonfig` (lokalt och i prov, se `oppetUtanKonfiguration`) ger det
 * gamla beteendet: bara rubriken. Det är FALSKT om inget annat sägs.
 */
export function isTrustedForward(
  forwardedFrom: string | null,
  providedSecret: string | null,
  expectedSecret: string | undefined,
  oppetUtanKonfig = false,
): boolean {
  if (forwardedFrom !== "fyndplats-webhook") return false;
  if (!expectedSecret) return oppetUtanKonfig;
  return safeStrEqual(providedSecret ?? "", expectedSecret);
}

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
 * Delar ett env-värde med en eller flera PEM-nycklar efter varandra
 * (WIX_VALIDERING_PUBLIC_KEY, när Wix byter kassans nyckel). Literala "\n" blir
 * riktiga radbrytningar, ett vanligt misstag när en PEM klistras in i Vercel.
 */
export function delaPemNycklar(pem: string | undefined): string[] {
  if (!pem) return [];
  const normal = pem.replace(/\\n/g, "\n");
  const block = normal.match(/-----BEGIN [A-Z ]*PUBLIC KEY-----[\s\S]*?-----END [A-Z ]*PUBLIC KEY-----/g);
  if (block) return block;
  return normal.trim() ? [normal.trim()] : [];
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
 * Vecklar ut den riktiga Wix-event-envelopen ur ett ev. inbäddat `data`-fält.
 *
 * Wix v2 lägger själva händelsen i ett `data`-fält — och paketerar den ibland
 * DUBBELT (en `data`-sträng inuti ännu en `data`-sträng). Den faktiska envelopen
 * — med claims som `entityFqdn`/`slug`/`entityId`/`*Event` — ligger då ett ELLER
 * TVÅ parse-hopp djupare. Tidigare packade vi upp `data` exakt EN gång; landade
 * envelopen ett lager till in fick anroparen mellanlagret (utan `createdEvent`)
 * → `normalizeOrderEvent` returnerade null → 422 på varje forwardad order.
 * Vi packar nu upp tills vi når lagret med de kanoniska claims:en (max 5 hopp).
 * Bakåtkompatibelt: ligger claims:en redan på toppnivå (legacy v1, testpayloads)
 * returneras objektet orört. Speglar headless `unwrapDataLayers`.
 */
function unwrapDataLayers(payload: Record<string, unknown>): Record<string, unknown> {
  let layer: unknown = payload;
  // Batchade event kommer ibland som en array i roten — kika på första elementet.
  if (Array.isArray(layer) && layer.length > 0) layer = layer[0];

  for (let i = 0; i < 5; i++) {
    if (!layer || typeof layer !== "object" || Array.isArray(layer)) break;
    const obj = layer as Record<string, unknown>;
    // Envelopen är nådd så fort vi ser ett kanoniskt claim direkt. OBS: `eventType`
    // ensam räknas INTE — Wix sätter ofta en sammanfattande eventType på en yttre
    // wrapper medan entityFqdn/slug/entityId/*Event ligger ett lager djupare.
    if (
      typeof obj.entityFqdn === "string" ||
      typeof obj.slug === "string" ||
      typeof obj.entityId === "string" ||
      obj.createdEvent !== undefined ||
      obj.updatedEvent !== undefined ||
      obj.deletedEvent !== undefined ||
      obj.actionEvent !== undefined
    ) {
      return obj;
    }
    // Ren {data:"<json>"}-wrapper → parsa och gräv vidare.
    if (typeof obj.data === "string") {
      try {
        layer = JSON.parse(obj.data);
        if (Array.isArray(layer) && layer.length > 0) layer = layer[0];
        continue;
      } catch {
        break;
      }
    }
    // {data:{...}} som objekt → kliv in ett lager.
    if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
      layer = obj.data;
      continue;
    }
    break;
  }
  return layer && typeof layer === "object" && !Array.isArray(layer)
    ? (layer as Record<string, unknown>)
    : payload;
}

/**
 * Tar emot råa request-body:n. Om en publik nyckel är konfigurerad verifieras
 * och avkodas JWT:t. Wix lägger ofta själva händelsen i ett `data`-fält som
 * JSON-sträng.
 *
 * `trustedForwarded=true` skippar signaturverifiering helt — använd ENDAST när
 * vi vet att payloaden redan verifierats upstream (`isTrustedForward`). Body
 * kan då vara antingen ett JWT (Wix-format som forwardats orört) eller rå JSON.
 *
 * ☠️ En OSIGNERAD kropp tas bara emot med `tillatOsignerat` (2026-11-14).
 * Förut tolkades kroppen som rå JSON så fort nyckeln saknades, så att en
 * tappad WIX_WEBHOOK_PUBLIC_KEY gjorde att vem som helst kunde skicka in en
 * order. Flaggan sätts bara lokalt och i prov (`oppetUtanKonfiguration`), och
 * den kringgår aldrig en nyckel som FINNS: med nyckel krävs alltid signatur.
 */
export function parseWebhookBody(
  rawBody: string,
  publicKeyPem?: string,
  options?: { trustedForwarded?: boolean; tillatOsignerat?: boolean },
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
    // Ingen nyckel och ingen betrodd forward: signaturen går inte att pröva.
    if (!options?.tillatOsignerat) return null;
    try {
      outer = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return unwrapDataLayers(outer);
}
