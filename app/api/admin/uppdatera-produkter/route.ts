// POST /api/admin/uppdatera-produkter — motorn säger till att produkter ändrats.
//
// Kropp: { "produkter": [{ "id": "<wix-id>", "slug"?: "...", "gamlaSlugs"?: [...],
//          "vad"?: "produkt" | "recensioner" }], "orsak"?: "auktion", "varm"?: true }
//
// Tömmer det som ändrats för varje produkt (V3-produkten eller recensionerna)
// och själva sidan, och värmer sidorna efteråt så att nästa kund inte betalar
// ombyggnaden. Används för det som inte kan vänta på femminuterscronen
// (/api/cron/uppdatera-andrade): fyndauktionens prissteg och återställningar.
//
// Med orsaken "auktion" töms också /fyndauktion och dess egen hämtning av
// auktionsraderna (AUKTIONSSIDANS_TAGG). Motorn ropar hit när timmens priser
// bytts, runt HH:00:25 (uppmätt 2026-10-20). Förut tömdes bara produktsidorna,
// och auktionssidan visade "Priset uppdateras…" i ~2,5 minuter efter timslaget:
// sidan (30 s) och raderna (15 s) serverade båda det gamla en gång till innan
// de byggdes om.
//
// AUTH: ADMIN_SECRET som kakan `fp_admin` (proxy.ts släpper bara igenom
// /api/admin/* med den) eller som "Authorization: Bearer". ALDRIG i adressen:
// en nyckel i en URL hamnar i åtkomstloggar. Jämförelsen är tidskonstant, och
// saknas ADMIN_SECRET är rutten stängd.

import { NextRequest, NextResponse, after } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { uppdateraProduktsidor } from "../../../../lib/produktsidor-uppdatera";
import type { AndradProdukt } from "../../../../lib/produkt-cache";
import { bearerVarde, sammaHemlighet } from "../../../../lib/hemlig-jamforelse";
import { varmAlla } from "../../../../lib/warm";
import { AUKTIONSSIDANS_TAGG, auktionssidanSkaTommas } from "../../../../lib/auction-motor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Så många poster per anrop. Motorn delar större mängder. */
const MAX_POSTER = 500;
/** Så många sidor värms per anrop; resten byggs om vid nästa besök. */
const MAX_VARMA = 60;
/** Motorn ringer sekunder efter sin skrivning till Wix, och Wix läsning kan
 *  släpa efter (motorns CLAUDE.md). En värmning direkt hade kunnat bygga sidan
 *  med förra priset. Tömningen verkställs dessutom först efter svaret. */
const VANTA_FORE_VARMNING_MS = 20_000;
/** Sista värmningen startar senast så här långt före maxDuration (en sidhämtning får ta 60 s). */
const MARGINAL_MS = 65_000;

function behorig(req: NextRequest): boolean {
  const nyckel = process.env.ADMIN_SECRET;
  if (!nyckel) return false;
  return (
    sammaHemlighet(req.cookies.get("fp_admin")?.value, nyckel)
    || sammaHemlighet(bearerVarde(req.headers.get("authorization")), nyckel)
  );
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  if (!behorig(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let kropp: unknown;
  try {
    kropp = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "kroppen är inte JSON" }, { status: 400 });
  }
  if (!kropp || typeof kropp !== "object" || Array.isArray(kropp)) {
    return NextResponse.json({ ok: false, error: "kroppen ska vara ett objekt" }, { status: 400 });
  }
  const { produkter, orsak: raOrsak, varm } = kropp as { produkter?: unknown; orsak?: unknown; varm?: unknown };
  if (!Array.isArray(produkter)) {
    return NextResponse.json({ ok: false, error: "`produkter` saknas eller är inte en lista" }, { status: 400 });
  }
  if (produkter.length > MAX_POSTER) {
    return NextResponse.json({ ok: false, error: `för många poster (högst ${MAX_POSTER} per anrop)` }, { status: 400 });
  }
  // Orsaken hamnar i loggen: inga radbrytningar eller andra styrtecken.
  const orsak = typeof raOrsak === "string" ? raOrsak.replace(/[\p{Cc}\p{Cf}]/gu, " ").slice(0, 40) : "okänd";

  const plan = await uppdateraProduktsidor(produkter as AndradProdukt[]);
  // { expire: 0 }, inte "max": nästa hämtning ska bygga om med de nya priserna,
  // inte servera det gamla en gång till. Bara auktionssidans egen tagg: att tömma
  // "auctions" hade tömt startsidan också, varje timme (lib/auction-motor.ts).
  const auktionssidan = auktionssidanSkaTommas(orsak);
  if (auktionssidan) {
    revalidateTag(AUKTIONSSIDANS_TAGG, { expire: 0 });
    revalidatePath("/fyndauktion");
  }
  // Värmningen går mot produktionsadressen (lib/site-urls.ts); en preview ska inte värma den.
  const varma = varm !== false && process.env.VERCEL_ENV === "production" ? plan.slugs.slice(0, MAX_VARMA) : [];
  if (varma.length) {
    after(async () => {
      await new Promise((r) => setTimeout(r, VANTA_FORE_VARMNING_MS));
      const r = await varmAlla(varma, start + maxDuration * 1000 - MARGINAL_MS);
      console.log(`[uppdatera-produkter] ${orsak}: värmde ${r.ok} av ${varma.length} (fel ${r.fel}${r.avbruten ? ", avbruten" : ""})`);
    });
  }

  console.log(
    `[uppdatera-produkter] ${orsak}: produkter ${plan.ids.length}, sidor ${plan.sokvagar.length}, `
      + `utan slug ${plan.utanSlug.length}, ogiltiga ${plan.ogiltiga}${plan.uppslagFel ? `, uppslag föll: ${plan.uppslagFel}` : ""}`
      + (auktionssidan ? ", auktionssidan tömd" : ""),
  );
  return NextResponse.json({
    ok: true,
    produkter: plan.ids.length,
    sidor: plan.sokvagar.length,
    utanSlug: plan.utanSlug.length,
    ogiltiga: plan.ogiltiga,
    varms: varma.length,
    auktionssidan,
    ...(plan.uppslagFel ? { uppslagFel: plan.uppslagFel } : {}),
  });
}
