// GET /api/admin/aosom-familjer — färg- och storlekssyskon i Aosom-sortimentet.
//
// Svarar på Leonards fråga 2026-09-27: vilka av våra sidor och utkast är samma
// vara i en annan färg, samma vara i en annan storlek, eller samma vara två
// gånger? Logiken och motiven bor i lib/aosom/familjer.ts.
//
//   ?typ=farg|storlek|farg_storlek|samma    bara den typen
//   ?lage=en_publicerad|bara_utkast|flera_publicerade
//   ?max=200                                tak på antalet familjer i svaret
//   ?par=<id>,<id>;<id>,<id>                vad jämförelsen såg mellan två
//                                           sidor — för att kalibrera mot par
//                                           en människa redan granskat
//
// ☠️ RUTTEN SKRIVER INGENTING och kan inte skriva. Den läser feeden,
// mappningarna och katalogen och svarar. Det finns med flit ingen "slå ihop
// allt"-flagga: varje familj ska ses med bilderna, och sammanslagningen är en
// egen workflow med torrkörning som default.
//
// ☠️ SVARET BÄR ALDRIG ARTIKELNUMMER, PSIN, TYSKA NAMN ELLER KOSTNADER — det går
// till en publik Actions-logg. Auth följer huset: CRON_SECRET eller
// EXTENSION_API_TOKEN.
//
// ☠️ TVÅ MASSFEL-SPÄRRAR, samma tal som synken. En halvläst feed hade fått våra
// sidor att se syskonlösa ut, och en halvläst katalog hade fått publicerade
// sidor att se ut som saknade — båda hade gett ett svar som ser komplett ut och
// inte är det.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { fetchAosomFeed } from "@/lib/aosom/feed";
import { MIN_FEED_RADER } from "@/lib/aosom/sync";
import { listAllV3Products, MIN_WIX_PRODUKTER } from "@/lib/wix/v3-products";
import {
  diagnosPar,
  hittaFamiljer,
  type FamiljIndata,
  type FamiljLage,
  type FamiljTyp,
  type WixProduktInfo,
} from "@/lib/aosom/familjer";
import { felText } from "@/lib/polish/skrivplan";

export const runtime = "nodejs";
export const maxDuration = 300;

const TYPER: FamiljTyp[] = ["farg", "storlek", "farg_storlek", "samma"];
const LAGEN: FamiljLage[] = ["en_publicerad", "bara_utkast", "flera_publicerade"];
/** Fler par än så i en diagnos är en körlista, inte en kalibrering. */
const MAX_PAR = 30;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const typ = (params.get("typ") ?? "").trim();
  const lage = (params.get("lage") ?? "").trim();
  if (typ && !TYPER.includes(typ as FamiljTyp)) {
    return NextResponse.json({ ok: false, error: `typ ska vara en av ${TYPER.join(", ")}` }, { status: 400 });
  }
  if (lage && !LAGEN.includes(lage as FamiljLage)) {
    return NextResponse.json({ ok: false, error: `lage ska vara en av ${LAGEN.join(", ")}` }, { status: 400 });
  }
  const maxRaw = Number(params.get("max"));
  const max = Number.isFinite(maxRaw) && maxRaw > 0 ? Math.trunc(maxRaw) : Infinity;
  const par = (params.get("par") ?? "")
    .split(";")
    .map((p) => p.split(",").map((id) => id.trim()).filter(Boolean))
    .filter((p) => p.length > 0);
  if (par.some((p) => p.length !== 2)) {
    return NextResponse.json({ ok: false, error: "par ska vara <id>,<id>;<id>,<id>" }, { status: 400 });
  }
  if (par.length > MAX_PAR) {
    return NextResponse.json({ ok: false, error: `högst ${MAX_PAR} par per anrop` }, { status: 400 });
  }

  try {
    const [rader, mappningar, produkter] = await Promise.all([
      fetchAosomFeed(),
      getStore().listMappings(),
      listAllV3Products({ beskrivning: false }),
    ]);
    if (rader.length < MIN_FEED_RADER) {
      throw new Error(`feeden gav ${rader.length} rader (golv ${MIN_FEED_RADER}) — ett läsfel, inte ett sortiment`);
    }
    if (produkter.length < MIN_WIX_PRODUKTER) {
      throw new Error(`katalogen gav ${produkter.length} produkter (golv ${MIN_WIX_PRODUKTER}) — ett läsfel`);
    }

    const wix = new Map<string, WixProduktInfo>();
    for (const p of produkter) {
      const pris = Number(p.priceMin);
      wix.set(p.id, {
        id: p.id,
        visible: p.visible !== false,
        name: p.name ?? "",
        slug: p.slug ?? "",
        prisMin: Number.isFinite(pris) && pris > 0 ? pris : null,
      });
    }
    const indata: FamiljIndata = { rader, mappningar, wix };
    const svar = hittaFamiljer(indata);

    const urval = svar.familjer.filter((f) =>
      (!typ || f.typ === typ) && (!lage || f.lage === lage));
    const visade = urval.slice(0, max);

    console.log(
      `[aosom-familjer] ${svar.summering.familjer} familjer över ${svar.summering.sidorIFamiljer} sidor `
      + `(${svar.summering.publiceradeIFamiljer} publicerade), ${svar.summering.verktygetIdag} klarar dagens verktyg, `
      + `${svar.summering.dubblettgrupper} dubblettgrupper — ${svar.underlag.feedrader} feedrader, `
      + `${svar.underlag.sidor} sidor`,
    );

    return NextResponse.json({
      ok: true,
      summering: svar.summering,
      underlag: svar.underlag,
      urval: { typ: typ || null, lage: lage || null, traffar: urval.length, visade: visade.length, kapad: visade.length < urval.length },
      familjer: visade,
      par: par.map(([a, b]) => diagnosPar(indata, a, b)),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: felText(e) }, { status: 500 });
  }
}
