// POST /api/admin/aosom-livsbild — leverantörens miljöbild (feedens position 2)
// som ANDRA bild på varje publicerad Aosom-sida, och på en sammanslagen sida
// som andra bild för varje färg.
//
//   { "lage": "rapport", "efter": "<markör>" }                       (default) läser bara
//   { "lage": "kandidater", "mal": ["<wix-id>[:<val-id>]", …], "dryRun": false }
//   { "lage": "plan",  "par": ["<wix-id>[:<val-id>]:<fil-id|flytta>", …] }
//   { "lage": "skriv", "par": [...], "bekrafta": "<sha>" }
//
// Logiken och skälen bor i lib/aosom/livsbild.ts.
//
// ☠️ RAPPORT SOM DEFAULT. `kandidater` torrkör om inte `dryRun: false`, och
// `skriv` kräver `bekrafta` = sha:n som `plan` gav för samma par mot samma
// sidor. Planen räknas om ur färska läsningar; skiljer sha:n sig blir det 409.
//
// ☠️ SVARET ÄR PUBLIKT (aosom-livsbild.yml skriver ut det). Det bär bara Wix
// produkt-id, val-id, Wix egna fil-id och adresser, räknare och hinderkoder.
// Ett fel ur feeden, mappningarna eller Media Manager skrivs till
// Vercel-loggen, och svaret får en fast text: ett media-fel bär källadressen.
//
// Auth: CRON_SECRET eller EXTENSION_API_TOKEN, som husets andra admin-rutter.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { redigera } from "@/lib/polish/skrivplan";
import {
  hamtaKandidater,
  liveDeps,
  planeraOchSkriv,
  rapportera,
  tolkaNycklar,
  tolkaPar,
} from "@/lib/aosom/livsbild";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Wix markör: base64 i någon av sina former. Allt annat vägras. */
const MARKOR = /^[A-Za-z0-9+/=_.-]{1,4096}$/;

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
  console.error(`[aosom-livsbild] ${vad}: ${redigera(String((e as Error)?.message ?? e)).slice(0, 300)}`);
}

/** En lista ur kroppen: en JSON-lista eller en sträng med komma/mellanslag. */
function lista(x: unknown): unknown[] {
  if (Array.isArray(x)) return x;
  if (typeof x === "string") return x.split(/[\s,;]+/);
  return [];
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) return fel(401, "Otillåten");

  let kropp: { lage?: unknown; efter?: unknown; mal?: unknown; par?: unknown; bekrafta?: unknown; dryRun?: unknown };
  try {
    kropp = (await req.json()) ?? {};
  } catch {
    return fel(400, "Kroppen är inte JSON");
  }
  const lage = kropp.lage === undefined ? "rapport" : String(kropp.lage);
  if (!["rapport", "kandidater", "plan", "skriv"].includes(lage)) {
    return fel(400, "lage ska vara rapport, kandidater, plan eller skriv");
  }

  // ── rapport ──────────────────────────────────────────────────────────────
  if (lage === "rapport") {
    const efter = typeof kropp.efter === "string" ? kropp.efter.trim() : "";
    if (efter && !MARKOR.test(efter)) return fel(400, "efter ska vara markören ur förra körningens nasta");
    try {
      const svar = await rapportera(await liveDeps(), { efter: efter || undefined });
      const r = svar.raknare;
      console.log(
        `[aosom-livsbild] RAPPORT: ${svar.granskade} synliga, ${svar.rader} rader på ${svar.sidor} sidor: `
          + `som två ${r.har_som_tva}, annan plats ${r.har_annan_plats}, huvudbild ${r.ar_huvudbild}, `
          + `olänkad ${r.i_galleriet_olankad}, saknas ${r.saknas}, okänd ${r.okand}, stopp ${svar.stoppadAv}`,
      );
      return NextResponse.json({ ok: true, ...svar });
    } catch (e) {
      logga("rapporten", e);
      return fel(502, "rapporten föll — se Vercel-loggen och kör om med samma efter");
    }
  }

  // ── kandidater ───────────────────────────────────────────────────────────
  if (lage === "kandidater") {
    const tolkade = tolkaNycklar(lista(kropp.mal));
    if ("fel" in tolkade) return fel(400, tolkade.fel);
    if (kropp.dryRun !== undefined && typeof kropp.dryRun !== "boolean") {
      return fel(400, "dryRun måste vara true eller false");
    }
    try {
      const svar = await hamtaKandidater(tolkade.mal, { dryRun: kropp.dryRun !== false }, await liveDeps());
      console.log(
        `[aosom-livsbild] KANDIDATER: ${svar.rader.length} rader, ${svar.uppladdade} uppladdade, `
          + `${svar.missar} missar, ${svar.kvar.length} kvar${svar.dryRun ? " (torrkörning)" : ""}`,
      );
      return NextResponse.json({ ok: true, ...svar });
    } catch (e) {
      logga("kandidaterna", e);
      return fel(502, "kandidaterna föll — se Vercel-loggen");
    }
  }

  // ── plan och skriv ───────────────────────────────────────────────────────
  const tolkade = tolkaPar(lista(kropp.par));
  if ("fel" in tolkade) return fel(400, tolkade.fel);
  const bekrafta = typeof kropp.bekrafta === "string" ? kropp.bekrafta.trim().toLowerCase() : "";
  if (lage === "skriv" && !/^[0-9a-f]{64}$/.test(bekrafta)) {
    return fel(400, "skriv kräver bekrafta = planens sha (64 hextecken)");
  }

  try {
    const svar = await planeraOchSkriv(
      tolkade.atgarder,
      { skriv: lage === "skriv", bekrafta },
      await liveDeps(),
    );
    console.log(
      `[aosom-livsbild] ${lage.toUpperCase()}: ${svar.produkter.length} sidor, ${svar.skrivbara} ändras`
        + (lage === "skriv" ? `, ${svar.skrivna} skrivna, stopp ${svar.stoppadAv}` : ""),
    );
    if (svar.stoppadAv === "sha") {
      return fel(409, "planen har ändrats sedan bekrafta räknades — kör plan igen med samma par och skicka dess sha", {
        lage,
      });
    }
    if (lage === "skriv") {
      await audit("aosom-livsbild", "skriv", `${svar.skrivna} sidor skrivna, stopp ${svar.stoppadAv}`).catch(() => {});
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
