// lib/withdrawal.ts
// Ångerfunktion ("ångra köp") enligt distansavtalslagen — delad server-logik för
// /api/angra/lookup (order-uppslag) och /api/angra (anmälan + mottagningskvitto).
//
// Bakgrund: ångerfunktionen är lagkrav sedan 19 juni 2026 (prop. 2025/26:84).
// Kunden ska kunna utöva ångerrätten via en tydlig funktion på samma sajt där
// köpet gjordes, och få ett AUTOMATISKT mottagningskvitto (bevis på att hen
// ångrat — inte ett godkännande av returen).
//
// Den här filen äger: order-uppslag mot vår lokala orders-spegel (känd schema,
// snabb, ingen Wix-filter-gissning), ärende-id, DB-loggning (bevis), och de två
// mejlen (kund-kvitto + notis till butiken). Allt är best-effort defensivt:
// ångerrätten får ALDRIG blockeras av att DB/mejl strular — formuläret faller
// då tillbaka på manuell inmatning och anmälan loggas ändå.

import { randomUUID } from "crypto";
import { Resend } from "resend";
import { render } from "@react-email/render";

import { sql } from "./db";
import { getProducts } from "./products";
import WithdrawalReceiptEmail from "../emails/withdrawal-receipt";

const FROM = "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";
const NOTIFY_TO = "info@fyndplats.com";

export interface WithdrawalLineItem {
  name: string;
  qty: number;
  lineMinor?: number;
  /** Produktbild (matchad mot katalogen på namn) — visas i formuläret + kvittot. */
  image?: string;
}

// Normaliserar ett produktnamn för matchning (gemener, kollapsade mellanslag).
function normName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

// Berikar order-rader med produktbild genom att matcha radens namn mot katalogen
// (getProducts → samma bild som visas på PDP/listningar). Bilder är DEKORATIVA:
// matchar inget (borttagen produkt, namnavvikelse, Wix nere) → raden står utan
// bild, aldrig ett fel. Återanvänder den cache:ade produktlistan.
async function attachCatalogImages(items: WithdrawalLineItem[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const products = await getProducts();
    const imgByName = new Map<string, string>();
    for (const p of products) {
      if (p.name && p.img) {
        const k = normName(p.name);
        if (!imgByName.has(k)) imgByName.set(k, p.img);
      }
    }
    for (const it of items) {
      const img = imgByName.get(normName(it.name));
      if (img) it.image = img;
    }
  } catch (err) {
    console.error("[angra] kunde inte berika bilder (ignorerar)", err instanceof Error ? err.message : err);
  }
}

export interface OrderLookupResult {
  found: boolean;
  items: WithdrawalLineItem[];
}

function resend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

// ── Order-uppslag ────────────────────────────────────────────────────────────
// Slå upp ordern i den lokala orders-spegeln på ordernummer + e-post. E-posten
// är ägar-verifieringen: matchar den inte returnerar vi found:false UTAN att
// avslöja om ordernumret finns (ingen enumerering av andras ordrar). Items i
// spegeln är { name, qty, lineMinor } (se lib/order-record.ts).
export async function lookupOrderItems(
  orderNumber: string,
  email: string,
): Promise<OrderLookupResult> {
  const num = (orderNumber || "").trim();
  const mail = (email || "").trim().toLowerCase();
  if (!num || !mail) return { found: false, items: [] };
  try {
    const res = await sql/*sql*/`
      SELECT items_json FROM orders
      WHERE order_number = ${num} AND lower(email) = ${mail}
      LIMIT 1
    `;
    const row = res.rows[0] as { items_json?: unknown } | undefined;
    if (!row) return { found: false, items: [] };
    const raw = Array.isArray(row.items_json) ? row.items_json : [];
    const items: WithdrawalLineItem[] = raw.map((it: Record<string, unknown>) => ({
      name: String(it?.name ?? "Produkt"),
      qty: Number(it?.qty ?? 1) || 1,
      lineMinor: Number(it?.lineMinor ?? 0) || 0,
    }));
    await attachCatalogImages(items);
    return { found: true, items };
  } catch (err) {
    // DB nere/ej migrerad → "hittades inte" så formuläret faller tillbaka på
    // manuell inmatning. Ångerrätten får aldrig blockeras av ett DB-fel.
    console.error("[angra] order-uppslag misslyckades:", err instanceof Error ? err.message : err);
    return { found: false, items: [] };
  }
}

// ── Loggning (bevis) ─────────────────────────────────────────────────────────
let ensured: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await sql/*sql*/`
        CREATE TABLE IF NOT EXISTS withdrawal_requests (
          id            TEXT PRIMARY KEY,
          order_number  TEXT,
          email         TEXT NOT NULL,
          items_json    JSONB NOT NULL DEFAULT '[]'::jsonb,
          reason        TEXT,
          matched_order BOOLEAN NOT NULL DEFAULT FALSE,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
      await sql/*sql*/`CREATE INDEX IF NOT EXISTS withdrawal_requests_email_idx ON withdrawal_requests(email);`;
      await sql/*sql*/`CREATE INDEX IF NOT EXISTS withdrawal_requests_created_idx ON withdrawal_requests(created_at DESC);`;
    })().catch((e) => {
      ensured = null; // tillåt retry vid nästa anrop
      throw e;
    });
  }
  return ensured;
}

export function newCaseId(): string {
  // Kort, läsbart ärende-id: ANG-XXXXXX (6 hex ur en UUID, versaler).
  return "ANG-" + randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
}

export interface WithdrawalRecord {
  caseId: string;
  orderNumber: string;
  email: string;
  items: WithdrawalLineItem[];
  reason?: string;
  matchedOrder: boolean;
}

export async function recordWithdrawal(rec: WithdrawalRecord): Promise<boolean> {
  try {
    await ensureTable();
    await sql/*sql*/`
      INSERT INTO withdrawal_requests (id, order_number, email, items_json, reason, matched_order, created_at)
      VALUES (
        ${rec.caseId}, ${rec.orderNumber || null}, ${rec.email},
        ${JSON.stringify(rec.items)}::jsonb, ${rec.reason || null}, ${rec.matchedOrder}, NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `;
    return true;
  } catch (err) {
    console.error("[angra] kunde inte logga ångeranmälan", rec.caseId, err instanceof Error ? err.message : err);
    return false;
  }
}

// ── Mejl ─────────────────────────────────────────────────────────────────────
export function formatStockholm(d: Date): string {
  // Svensk datum + tid i butikens tidszon, oavsett serverns lokala TZ.
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Stockholm",
  }).format(d);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Skickar (a) kundens automatiska mottagningskvitto och (b) en notis till butiken.
 *  Best-effort: ett mejl-fel får inte fälla anmälan — vi loggar och returnerar
 *  status så anroparen kan svara kunden ändå (anmälan är redan loggad i DB). */
export async function sendWithdrawalEmails(input: {
  caseId: string;
  email: string;
  orderNumber: string;
  items: WithdrawalLineItem[];
  reason?: string;
  matchedOrder: boolean;
  receivedAt: Date;
}): Promise<{ customer: boolean; notify: boolean }> {
  const receivedStr = formatStockholm(input.receivedAt);
  const result = { customer: false, notify: false };

  // (a) Kund-kvitto
  try {
    const html = await render(
      WithdrawalReceiptEmail({
        caseId: input.caseId,
        orderNumber: input.orderNumber || undefined,
        receivedAt: receivedStr,
        items: input.items,
      }),
    );
    await resend().emails.send({
      from: FROM,
      to: input.email,
      replyTo: REPLY_TO,
      subject: `Mottagningskvitto – din ångeranmälan ${input.caseId}`,
      html,
    });
    result.customer = true;
  } catch (err) {
    console.error("[angra] kund-kvitto kunde inte skickas", input.caseId, err instanceof Error ? err.message : err);
  }

  // (b) Notis till butiken
  try {
    const rows = input.items.length
      ? input.items.map((it) => `<li>${escapeHtml(it.name)} — antal: ${it.qty}</li>`).join("")
      : "<li><em>Inga artiklar valda (manuell inmatning / hela ordern)</em></li>";
    const notifyHtml = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;color:#1a1a1a">
        <h2 style="margin:0 0 8px">Ny ångeranmälan ${escapeHtml(input.caseId)}</h2>
        <p style="margin:0 0 4px"><strong>Mottaget:</strong> ${escapeHtml(receivedStr)}</p>
        <p style="margin:0 0 4px"><strong>Kund:</strong> ${escapeHtml(input.email)}</p>
        <p style="margin:0 0 4px"><strong>Order:</strong> ${input.orderNumber ? escapeHtml(input.orderNumber) : "—"} ${input.matchedOrder ? "(matchad i systemet)" : "(ej matchad – verifiera manuellt)"}</p>
        <p style="margin:8px 0 4px"><strong>Artiklar att ångra:</strong></p>
        <ul style="margin:0 0 8px">${rows}</ul>
        ${input.reason ? `<p style="margin:4px 0"><strong>Anledning (frivillig):</strong> ${escapeHtml(input.reason)}</p>` : ""}
        <p style="margin:8px 0 0;color:#6b6b6b">Kunden har fått ett automatiskt mottagningskvitto. Verifiera ägarskap/villkor och hantera återbetalningen.</p>
      </div>`;
    await resend().emails.send({
      from: FROM,
      to: NOTIFY_TO,
      replyTo: input.email,
      subject: `Ny ångeranmälan ${input.caseId}${input.orderNumber ? ` · order ${input.orderNumber}` : ""}`,
      html: notifyHtml,
    });
    result.notify = true;
  } catch (err) {
    console.error("[angra] butiks-notis kunde inte skickas", input.caseId, err instanceof Error ? err.message : err);
  }

  return result;
}
