// GET/POST /api/cron/faktura — fakturan och kvittot för ordrar på faktura.
//
// Varje timme. Skickar fakturan för en handlagd, obetald order som webhooken
// missade, och kvittot när ordern markerats betald i Wix. Reglerna står i
// lib/orders/faktura-kor.ts.
//
// SKARP SOM DEFAULT, som orderåterhämtningen: kunden väntar på fakturan, och
// loggen gör att ingenting skickas två gånger. `?dryRun=1` säger vad som skulle
// skickas.
//
// Query:
//   ?dryRun=1          skicka ingenting
//   ?order=10079       bara dessa ordernummer

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { korFakturor } from "@/lib/orders/faktura-kor";
import { fakturaDeps } from "@/lib/orders/faktura-deps";

export const runtime = "nodejs";
export const maxDuration = 120;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

async function handle(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  const p = req.nextUrl.searchParams;
  const dryRun = p.get("dryRun") === "1" || p.get("dryRun") === "true";
  const ordernummer = (p.get("order") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  try {
    const svar = await korFakturor({ dryRun, ordernummer: ordernummer.length ? ordernummer : undefined }, fakturaDeps());
    const nagot = svar.fakturor.length + svar.kvitton.length + svar.fel.length + svar.vantarPaBetalningsuppgifter.length;
    if (nagot > 0) {
      console.log(
        `[faktura] ${svar.fakturor.length} fakturor (${svar.fakturor.join(", ") || "—"}), ` +
          `${svar.kvitton.length} kvitton (${svar.kvitton.join(", ") || "—"}), ` +
          `${svar.fel.length} fel, väntar på betalningsuppgifter: ${svar.vantarPaBetalningsuppgifter.join(", ") || "—"}`,
      );
      if (!dryRun) {
        await audit(
          "faktura",
          "cron",
          `fakturor ${svar.fakturor.join(",") || "—"} · kvitton ${svar.kvitton.join(",") || "—"} · fel ${svar.fel.map((f) => `${f.order}/${f.typ}: ${f.fel}`).join("; ") || "—"}`,
        ).catch(() => null);
      }
    }
    return NextResponse.json({ ok: svar.fel.length === 0, ...svar }, { status: svar.fel.length ? 500 : 200 });
  } catch (e) {
    const fel = e instanceof Error ? e.message : String(e);
    console.error(`[faktura] körningen föll: ${fel}`);
    return NextResponse.json({ ok: false, error: fel }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
