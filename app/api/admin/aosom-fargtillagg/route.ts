// POST /api/admin/aosom-fargtillagg — fler bilder till en färg på en
// sammanslagen Aosom-sida (Leonard 2026-10-21: färgval med fyra bilder eller färre).
//
//   { "lage": "kandidater", "mal": ["<wix-id>[:<val-id>]", …], "positioner": [3,8,9,10],
//     "hogstBilder": 4, "dryRun": false }
//   { "lage": "plan",  "sidor": [{ "id": "<wix-id>", "val": "<val-id>", "bilder": [{ "fil": "<fil-id>", "alt": "…" }] }] }
//   { "lage": "skriv", "sidor": [...], "bekrafta": "<sha>" }
//
// Logiken och skälen bor i lib/aosom/fargtillagg.ts.
//
// ☠️ TORRT SOM STANDARD. `kandidater` torrkör om inte `dryRun: false`, och `skriv`
// kräver `bekrafta` = sha:n som `plan` gav för samma sidor och filer mot samma
// läsningar. Planen räknas om ur färska läsningar; skiljer sha:n sig blir det 409.
//
// ☠️ SVARET ÄR PUBLIKT (aosom-fargtillagg.yml skriver ut det). Det bär bara Wix
// produkt-id, val-id, färgnamn, Wix egna fil-id och wixstatic-adresser, räknare
// och hinderkoder. Ett fel ur feeden, mappningarna eller Media Manager skrivs till
// Vercel-loggen, och svaret får en fast text: ett media-fel bär källadressen.
//
// Auth: CRON_SECRET eller EXTENSION_API_TOKEN, som husets andra admin-rutter.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { redigera } from "@/lib/polish/skrivplan";
import { liveDeps } from "@/lib/aosom/livsbild";
import {
  MAX_POSITION,
  hamtaTillaggskandidater,
  planeraOchSkrivTillagg,
  tolkaMal,
  tolkaTillagg,
} from "@/lib/aosom/fargtillagg";

export const runtime = "nodejs";
export const maxDuration = 300;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

const fel = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status });

function logga(vad: string, e: unknown) {
  // Vercel-loggen är inte publik, men artikelnummer stryks ändå.
  console.error(`[aosom-fargtillagg] ${vad}: ${redigera(String((e as Error)?.message ?? e)).slice(0, 300)}`);
}

/** En lista ur kroppen: en JSON-lista eller en sträng med komma/mellanslag. */
function lista(x: unknown): unknown[] {
  if (Array.isArray(x)) return x;
  if (typeof x === "string") return x.split(/[\s,;]+/);
  return [];
}

/**
 * Positionerna i kroppen: heltal 1–15. Ett ogiltigt värde vägrar hela listan, för
 * `tolkaPositioner` släpper tyst det den inte förstår och faller tillbaka på
 * standardlistan — en felstavad position ska inte se ut som ett lyckat anrop.
 */
function positioner(x: unknown): { positioner: number[] | undefined } | { fel: string } {
  const varden = lista(x).filter((v) => String(v ?? "").trim() !== "");
  if (varden.length === 0) return { positioner: undefined };
  const ut = new Set<number>();
  for (const v of varden) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > MAX_POSITION) return { fel: `positioner ska vara heltal 1–${MAX_POSITION}` };
    ut.add(n);
  }
  return { positioner: [...ut].sort((a, b) => a - b) };
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) return fel(401, "Otillåten");

  let kropp: {
    lage?: unknown;
    mal?: unknown;
    positioner?: unknown;
    hogstBilder?: unknown;
    sidor?: unknown;
    bekrafta?: unknown;
    dryRun?: unknown;
  };
  try {
    kropp = (await req.json()) ?? {};
  } catch {
    return fel(400, "Kroppen är inte JSON");
  }
  const lage = kropp.lage === undefined ? "kandidater" : String(kropp.lage);
  if (!["kandidater", "plan", "skriv"].includes(lage)) {
    return fel(400, "lage ska vara kandidater, plan eller skriv");
  }

  // ── kandidater ───────────────────────────────────────────────────────────
  if (lage === "kandidater") {
    const tolkade = tolkaMal(lista(kropp.mal));
    if ("fel" in tolkade) return fel(400, tolkade.fel);
    if (kropp.dryRun !== undefined && typeof kropp.dryRun !== "boolean") {
      return fel(400, "dryRun måste vara true eller false");
    }
    const pos = positioner(kropp.positioner);
    if ("fel" in pos) return fel(400, pos.fel);
    let hogstBilder: number | undefined;
    if (kropp.hogstBilder !== undefined) {
      const n = Number(kropp.hogstBilder);
      if (!Number.isInteger(n) || n < 0 || n > 20) return fel(400, "hogstBilder ska vara ett heltal 0–20");
      hogstBilder = n;
    }
    try {
      const svar = await hamtaTillaggskandidater(
        tolkade.mal,
        { dryRun: kropp.dryRun !== false, positioner: pos.positioner, hogstBilder },
        await liveDeps(),
      );
      console.log(
        `[aosom-fargtillagg] KANDIDATER: ${svar.rader.length} färger, ${svar.uppladdade} uppladdade, `
          + `${svar.missar} missar, ${svar.kvar.length} kvar${svar.dryRun ? " (torrkörning)" : ""}`,
      );
      return NextResponse.json({ ok: true, ...svar });
    } catch (e) {
      logga("kandidaterna", e);
      return fel(502, "kandidaterna föll — se Vercel-loggen");
    }
  }

  // ── plan och skriv ───────────────────────────────────────────────────────
  const tolkade = tolkaTillagg(kropp.sidor);
  if ("fel" in tolkade) return fel(400, tolkade.fel);
  const bekrafta = typeof kropp.bekrafta === "string" ? kropp.bekrafta.trim().toLowerCase() : "";
  if (lage === "skriv" && !/^[0-9a-f]{64}$/.test(bekrafta)) {
    return fel(400, "skriv kräver bekrafta = planens sha (64 hextecken)");
  }

  try {
    const svar = await planeraOchSkrivTillagg(
      tolkade.atgarder,
      { skriv: lage === "skriv", bekrafta },
      await liveDeps(),
    );
    console.log(
      `[aosom-fargtillagg] ${lage.toUpperCase()}: ${svar.produkter.length} sidor, ${svar.skrivbara} ändras`
        + (lage === "skriv" ? `, ${svar.skrivna} skrivna, stopp ${svar.stoppadAv}` : ""),
    );
    if (svar.stoppadAv === "sha") {
      return fel(409, "planen har ändrats sedan bekrafta räknades — kör plan igen med samma sidor och skicka dess sha", {
        lage,
      });
    }
    if (lage === "skriv") {
      await audit("aosom-fargtillagg", "skriv", `${svar.skrivna} sidor skrivna, stopp ${svar.stoppadAv}`).catch(() => {});
    }
    return NextResponse.json(
      { ok: svar.stoppadAv !== "avvikelse", ...svar },
      { status: svar.stoppadAv === "avvikelse" ? 500 : 200 },
    );
  } catch (e) {
    logga(lage, e);
    return fel(502, `${lage} föll — se Vercel-loggen`);
  }
}
