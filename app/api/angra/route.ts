// POST /api/angra
// Tar emot en ångeranmälan (ångra köp) från ångerfunktionen på /angra-kop,
// loggar den (bevis), skickar kundens AUTOMATISKA mottagningskvitto och en notis
// till butiken. Lagkrav sedan 19 juni 2026 (prop. 2025/26:84).
//
// Defensivt: anmälan loggas i DB innan mejlen skickas, så ett mejl-fel aldrig
// "tappar" en ångran. Honeypot + rate-limit skyddar mejl-endpointen mot bottar.
// Reason är FRIVILLIG (lagen tillåter inte att man kräver skäl för att ångra).

import { NextResponse, type NextRequest } from "next/server";
import {
  lookupOrderItems,
  newCaseId,
  recordWithdrawal,
  sendWithdrawalEmails,
  type WithdrawalLineItem,
} from "@/lib/withdrawal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate-limit + dedupe (in-memory). Skyddar mejl-endpointen.
const HITS = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_HITS = 6;
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 2000) for (const k of [...HITS.keys()].slice(0, 200)) HITS.delete(k);
  return arr.length > MAX_HITS;
}

// Dubbel-submit-skydd: samma kund+order inom kort fönster → returnera samma OK
// utan att skicka om kvittot.
const RECENT = new Map<string, { caseId: string; at: number }>();
const DEDUPE_MS = 3 * 60_000;

function sanitizeItems(raw: unknown): WithdrawalLineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 50)
    .map((it) => {
      const o = (it ?? {}) as Record<string, unknown>;
      const name = String(o.name ?? "").trim().slice(0, 200);
      const qty = Math.max(1, Math.min(999, Math.floor(Number(o.qty ?? 1)) || 1));
      return name ? { name, qty } : null;
    })
    .filter((x): x is WithdrawalLineItem => x !== null);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  let body: {
    orderNumber?: unknown;
    email?: unknown;
    items?: unknown;
    reason?: unknown;
    hp?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }

  // Honeypot: dolt fält som bottar fyller i. Låtsas lyckas, gör inget.
  if (typeof body.hp === "string" && body.hp.trim() !== "") {
    return NextResponse.json({ ok: true, caseId: newCaseId() }, { status: 200 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim().slice(0, 64) : "";
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : "";
  const items = sanitizeItems(body.items);

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Ange en giltig e-postadress." }, { status: 400 });
  }
  // Kräv minst ordernummer ELLER valda/angivna varor — men blockera aldrig en
  // giltig ångran i onödan.
  if (!orderNumber && items.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Ange ditt ordernummer eller vilka varor du vill ångra." },
      { status: 400 },
    );
  }

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "För många anmälningar just nu. Vänta en stund och försök igen, eller mejla info@fyndplats.com." },
      { status: 429 },
    );
  }

  // Dedupe dubbel-submit.
  const dkey = `${email}|${orderNumber}`;
  const prior = RECENT.get(dkey);
  const now = Date.now();
  if (prior && now - prior.at < DEDUPE_MS) {
    return NextResponse.json({ ok: true, caseId: prior.caseId, deduped: true }, { status: 200 });
  }

  // Server-verifiera ägarskap för att sätta matched_order (klientens uppslag
  // litar vi inte blint på). Berika även radpriser om de matchar.
  let matchedOrder = false;
  let enriched = items;
  if (orderNumber) {
    const look = await lookupOrderItems(orderNumber, email);
    matchedOrder = look.found;
    if (look.found && items.length) {
      enriched = items.map((sel) => {
        const m = look.items.find((o) => o.name === sel.name);
        return m ? { ...sel, lineMinor: m.lineMinor, image: m.image } : sel;
      });
    }
  }

  const caseId = newCaseId();
  const receivedAt = new Date();

  // Logga FÖRST (bevis) — sen mejla.
  await recordWithdrawal({ caseId, orderNumber, email, items: enriched, reason, matchedOrder });
  RECENT.set(dkey, { caseId, at: now });
  if (RECENT.size > 2000) for (const k of [...RECENT.keys()].slice(0, 200)) RECENT.delete(k);

  const mail = await sendWithdrawalEmails({
    caseId,
    email,
    orderNumber,
    items: enriched,
    reason,
    matchedOrder,
    receivedAt,
  });

  return NextResponse.json({ ok: true, caseId, emailed: mail.customer }, { status: 200 });
}
