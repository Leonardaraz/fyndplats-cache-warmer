// POST /api/admin/faktura — fakturorna och kvittona för hand.
//
//   { lage: "plan" }                       vad som skulle skickas nu, och vilka
//                                          betalningsuppgifter som gäller
//   { lage: "skicka", order?: "10079" }    skicka det som väntar, som cronen
//   { lage: "prov", order: "10079" }       fakturan och kvittot för ordern till
//                                          den interna larmadressen, med [Prov]
//                                          i ämnesraden. Kunden får ingenting.
//   { lage: "installningar", betalaTill, fSkatt?, dagar? }
//                                          sparar betalningsuppgifterna i
//                                          FyndplatsAppConfig och läser tillbaka
//
// Workflowen "Faktura — skicka, prova och ställ in" anropar den med
// CRON_SECRET. Svaret bär bara ordernummer, aldrig kundens uppgifter.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getAppConfig, saveAppConfig } from "@/lib/store/app-config";
import { betalningUrKonfig, korFakturor } from "@/lib/orders/faktura-kor";
import { fakturaDeps } from "@/lib/orders/faktura-deps";
import { provmottagare } from "@/lib/restock/prov";

export const runtime = "nodejs";
export const maxDuration = 120;

const ORDERNUMMER = /^\d{4,8}$/;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function fel(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) return fel("Otillåten", 401);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fel("Ogiltig JSON", 400);
  }

  // ☠️ Inget läge har en default. Ett utelämnat läge ska inte bli ett utskick.
  const lage = body.lage;
  if (lage !== "plan" && lage !== "skicka" && lage !== "prov" && lage !== "installningar") {
    return fel("lage måste vara plan, skicka, prov eller installningar", 400);
  }

  try {
    if (lage === "installningar") {
      const betalaTill = typeof body.betalaTill === "string" ? body.betalaTill.trim() : "";
      if (betalaTill.length < 5 || betalaTill.length > 120) return fel("betalaTill måste vara 5–120 tecken", 400);
      const fSkatt = body.fSkatt === undefined ? undefined : body.fSkatt === true || body.fSkatt === "ja" ? "ja" : "nej";
      const dagarRaw = body.dagar === undefined || body.dagar === "" ? undefined : Number(body.dagar);
      if (dagarRaw !== undefined && !(Number.isInteger(dagarRaw) && dagarRaw > 0 && dagarRaw <= 90)) {
        return fel("dagar måste vara ett heltal 1–90", 400);
      }
      await saveAppConfig({
        fakturaBetalaTill: betalaTill,
        ...(fSkatt ? { fakturaFSkatt: fSkatt } : {}),
        ...(dagarRaw !== undefined ? { fakturaDagar: String(dagarRaw) } : {}),
      });
      // Läs tillbaka. Ett svar utan fel är inget kvitto.
      const lagrat = betalningUrKonfig(await getAppConfig());
      if (!lagrat || lagrat.betalaTill !== betalaTill) return fel("betalningsuppgiften läste inte tillbaka", 500);
      return NextResponse.json({ ok: true, lage, betalning: lagrat });
    }

    const order = typeof body.order === "string" ? body.order.trim() : "";
    if (order && !ORDERNUMMER.test(order)) return fel("order måste vara ett ordernummer", 400);
    if (lage === "prov" && !order) return fel("prov kräver order", 400);

    const deps = fakturaDeps();
    const betalning = await deps.betalning();
    const svar = await korFakturor(
      {
        dryRun: lage === "plan",
        ordernummer: order ? [order] : undefined,
        provTill: lage === "prov" ? provmottagare().adress : undefined,
      },
      deps,
    );
    return NextResponse.json(
      {
        ok: svar.fel.length === 0,
        lage,
        betalning,
        ...(lage === "prov" ? { mottagare: provmottagare().kalla } : {}),
        ...svar,
      },
      { status: svar.fel.length ? 500 : 200 },
    );
  } catch (e) {
    return fel(e instanceof Error ? e.message : String(e), 500);
  }
}
