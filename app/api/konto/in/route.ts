// POST /api/konto/in
//   { epost, kod }                    — koden från mejlet (JSON, från /konto)
//   formulär utan fält                — länken: token ligger i kakan fp_medlem_lank
//
// Prövar koden eller länken, tar den i anspråk (en gång), skapar kontot vid
// första inloggningen och sätter sessionskakan fp_medlem (90 dagar).

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  LANK_KAKA,
  MAX_FEL_PER_DYGN,
  arToken,
  hashaToken,
  normaliseraEpost,
  provaKod,
  provaLank,
  sakertMal,
  stadaKod,
  type Prov,
} from "@/lib/medlem/inloggning";
import {
  MK,
  hamtaInloggning,
  markeraAnvand,
  medlemsHemlighet,
  medlemsLage,
  senasteInloggning,
  taForsokPaInloggning,
  type Inloggning,
} from "@/lib/medlem/lager";
import { fraga } from "@/lib/wix-lager";
import { loggaIn } from "@/lib/medlem/konto";
import { SESSION_KAKA, TECKEN_KAKA, kakaAttribut, nySession, teckenAttribut } from "@/lib/medlem/session";
import { PRIVAT } from "@/lib/medlem/inloggad";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Fel = Exclude<Prov, "ok"> | "stangd" | "epost" | "sparrad" | "tillfalligt";

/**
 * Felaktiga koder på e-posten det senaste dygnet, summerat över alla koder.
 * Varje försök räknas när det tas i anspråk, också det som lyckas; en använd
 * inloggning räknas därför med ett försök mindre.
 */
async function felSenasteDygnet(epost: string): Promise<number> {
  const sedan = new Date(Date.now() - 86_400_000).toISOString();
  const rader = await fraga(MK.inloggningar, { filter: { epost, skapad: { $gt: sedan } }, limit: 100 });
  return rader.reduce((s, r) => s + Math.max(0, (Number(r.forsok) || 0) - (r.anvand ? 1 : 0)), 0);
}

export async function POST(req: Request) {
  const formular = !(req.headers.get("content-type") ?? "").includes("application/json");
  const burk = await cookies();
  const https = new URL(req.url).protocol === "https:";

  const misslyckat = (fel: Fel, status: number) => {
    if (formular) {
      const till = new URL("/konto", req.url);
      till.searchParams.set("fel", fel);
      const res = NextResponse.redirect(till, { status: 303, headers: PRIVAT });
      res.cookies.set(LANK_KAKA, "", kakaAttribut(0, https));
      return res;
    }
    return NextResponse.json({ ok: false, fel }, { status, headers: PRIVAT });
  };

  const hemlighet = medlemsHemlighet();
  if (!hemlighet || (await medlemsLage()) === "av") return misslyckat("stangd", 503);

  try {
    const nuMs = Date.now();
    let rad: Inloggning | null = null;
    let prov: Prov;
    if (formular) {
      const t = burk.get(LANK_KAKA)?.value;
      rad = arToken(t) ? await hamtaInloggning(hashaToken(t)) : null;
      prov = rad ? provaLank(rad, nuMs) : "utgangen";
    } else {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const epost = normaliseraEpost(body.epost);
      const kod = stadaKod(body.kod);
      if (!epost || !kod) return misslyckat(epost ? "fel-kod" : "epost", 400);
      rad = await senasteInloggning(epost, new Date(nuMs).toISOString());
      if (!rad) prov = "utgangen";
      else if ((await felSenasteDygnet(epost)) >= MAX_FEL_PER_DYGN) prov = "for-manga-forsok";
      else {
        // Försöket tas i anspråk före prövningen: så prövas högst fem koder
        // per inloggning, också när gissningarna kommer samtidigt.
        const tagen = await taForsokPaInloggning(rad.id);
        prov = tagen === "ok" ? provaKod(rad, kod, nuMs, hemlighet) : tagen === "slut" ? "for-manga-forsok" : "utgangen";
      }
    }
    if (prov !== "ok" || !rad) return misslyckat(prov === "ok" ? "utgangen" : prov, prov === "fel-kod" ? 401 : 400);
    if (!(await markeraAnvand(rad.id))) return misslyckat("anvand", 400);

    const utfall = await loggaIn(rad.epost, rad.order);
    if (!utfall.ok) return misslyckat("sparrad", 403);

    const mal = sakertMal(rad.mal);
    const { token, maxAgeS } = nySession(utfall.medlem.id, rad.epost, nuMs, hemlighet);
    const res = formular
      ? NextResponse.redirect(new URL(mal, req.url), { status: 303, headers: PRIVAT })
      : NextResponse.json({ ok: true, ny: utfall.ny, mal }, { headers: PRIVAT });
    res.cookies.set(SESSION_KAKA, token, kakaAttribut(maxAgeS, https));
    res.cookies.set(TECKEN_KAKA, "1", teckenAttribut(maxAgeS, https));
    res.cookies.set(LANK_KAKA, "", kakaAttribut(0, https));
    return res;
  } catch (e) {
    console.error("[konto/in] fel:", e instanceof Error ? e.message.slice(0, 160) : e);
    return misslyckat("tillfalligt", 503);
  }
}
