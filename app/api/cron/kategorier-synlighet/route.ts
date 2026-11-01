// GET /api/cron/kategorier-synlighet
//
// Gör nya kategorier synliga när de har minst tio publicerade produkter
// (Leonard 2026-10-31). Logiken och spärrarna står i
// lib/vevor/kategorier-synlighet.ts.
//
// TORRKÖRNING ÄR DEFAULT för ett handanrop. Cronen i vercel.json kör skarpt
// (`?dryRun=false`) varje timme. Workflowen "Kategorier — visa nya kategorier
// med minst tio produkter" kör samma rutt för hand.
//
// ☠️ SVARET BÄR BARA KATEGORINAMN, ID OCH ANTAL. Det skrivs ut i en publik
// Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import { tomOchBesok } from "@/lib/headless/produktsida";
import { korKategorisynlighet, type Butiksbesked } from "@/lib/vevor/kategorier-synlighet";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Sidor som visar kategorilistan och som Google läser först. */
const BUTIKENS_SIDOR = ["/sitemap.xml", "/", "/butik"] as const;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

async function meddelaButiken(): Promise<Butiksbesked> {
  const sokvagar: Butiksbesked["sokvagar"] = {};
  for (const s of BUTIKENS_SIDOR) sokvagar[s] = await tomOchBesok(s);
  return { sokvagar };
}

async function kor(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  const dryRun = req.nextUrl.searchParams.get("dryRun") !== "false";
  try {
    const svar = await korKategorisynlighet({ wix: skapaWixAnrop(), meddelaButiken }, { dryRun });
    const rad =
      `[kategorier-synlighet] ${dryRun ? "torr" : "skarp"}: ${svar.kandidater} dolda nya kategorier, ` +
      `${svar.visade.length} ${dryRun ? "skulle visas" : "visade"}` +
      (svar.visade.length > 0 ? ` (${svar.visade.map((v) => `${v.namn} ${v.produkter}`).join(", ")})` : "") +
      `, ${svar.underGransen.length} under gränsen, ${svar.vantarPaAvdelning.length} väntar på avdelningen, ` +
      `${svar.fel.length} fel, trädfel ${svar.tradFel.length}`;
    // En tom körning loggar ingenting: den går varje timme (se CLAUDE.md, "En tom cron-tugga ska vara TYST").
    if (svar.visade.length > 0 || svar.fel.length > 0 || svar.tradFel.length > 0 || dryRun) console.log(rad);
    if (!dryRun && (svar.visade.length > 0 || svar.fel.length > 0)) {
      await audit("kategorier-synlighet", "cron", rad.slice(0, 900)).catch(() => undefined);
    }
    return NextResponse.json({ ok: svar.fel.length === 0 && svar.tradFel.length === 0, ...svar });
  } catch (err) {
    console.error("[kategorier-synlighet] föll:", err instanceof Error ? err.message.slice(0, 200) : "");
    return NextResponse.json({ ok: false, error: "körningen föll, se Vercels logg" }, { status: 502 });
  }
}

export const GET = kor;
export const POST = kor;
