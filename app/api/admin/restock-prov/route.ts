// POST /api/admin/restock-prov — provkör restock-mejlets två beroenden i drift,
// utan att en hemlighet behöver visas eller roteras.
//
//   { lage: "sidan", wixProductId }
//       tömmer produktsidans cache i butiken med samma anrop som före ett
//       restock-mejl, och svarar med butikens statuskod och en diagnos
//   { lage: "mejl", wixProductId, varianter?: string[] }
//       skickar restock-mejlet för produkten till den interna larmadressen,
//       genom samma kod som synkerna, utan att röra en enda bevakare
//
// Skälen och spärrarna står i lib/restock/prov.ts. Auth följer huset:
// CRON_SECRET (workflowen "Restock — provkör sidans cache och mejlet") eller
// EXTENSION_API_TOKEN.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { provaMejl, provaSidan, tvattaAdresser } from "@/lib/restock/prov";

export const runtime = "nodejs";
export const maxDuration = 60;

const WIX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_VARIANTER = 20;

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

  let body: { lage?: unknown; wixProductId?: unknown; varianter?: unknown };
  try {
    body = await req.json();
  } catch {
    return fel("Ogiltig JSON", 400);
  }

  // ☠️ Inget läge har en default. Ett utelämnat läge ska inte tyst bli ett mejl.
  const lage = body.lage;
  if (lage !== "sidan" && lage !== "mejl") return fel("lage måste vara sidan eller mejl", 400);

  const wixProductId = typeof body.wixProductId === "string" ? body.wixProductId.trim() : "";
  if (!WIX_ID.test(wixProductId)) return fel("wixProductId måste vara ett Wix-id", 400);

  let varianter: string[] | undefined;
  if (body.varianter !== undefined) {
    if (lage !== "mejl") return fel("varianter gäller bara läget mejl", 400);
    if (
      !Array.isArray(body.varianter)
      || body.varianter.length > MAX_VARIANTER
      || !body.varianter.every((v) => typeof v === "string" && WIX_ID.test(v.trim()))
    ) {
      return fel(`varianter måste vara högst ${MAX_VARIANTER} Wix-variant-id`, 400);
    }
    varianter = (body.varianter as string[]).map((v) => v.trim());
    if (varianter.length === 0) varianter = undefined;
  }

  try {
    const { http, svar } = lage === "sidan"
      ? await provaSidan(wixProductId)
      : await provaMejl(wixProductId, varianter);
    return NextResponse.json(svar, { status: http });
  } catch (e) {
    // Provfunktionerna fångar sina egna fel. Det här är ett fel i provet självt.
    return fel(tvattaAdresser(e instanceof Error ? e.message : String(e)), 500);
  }
}
