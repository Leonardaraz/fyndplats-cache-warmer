// GET/POST /api/cron/rea
//
// Rea-jobbet (lib/pricing/rea-kor.ts): läser varje variants pris varje timme
// och ger en variant ett jämförpris i Wix när priset verkligen har sänkts
// (7 a § prisinformationslagen, regeln i lib/pricing/rea.ts). Leonard
// 2026-11-01: "Fixa".
//
// Lägen (`?lage=`):
//   kor     (default) avläsningen, besluten och skrivningen.
//   seed    fyller historiken bakåt ur butikens dagliga avläsning, en gång.
//   status  tillståndet: strömbrytaren, bakåtfyllningen, senaste körningen.
//   pa, av  strömbrytaren för skrivningen av jämförpriser.
//
// TORRKÖRNING ÄR DEFAULT för `kor` och `seed`. Cronen i vercel.json kör skarpt
// (`?dryRun=false`) varje timme, minut 40, utanför Aosoms synkfönster
// (:12–:29) och före VEVOR-synken (:50). Workflowen "Rea — automatisk
// reaskylt" kör samma rutt för hand.
//
// ☠️ SVARET BÄR BARA WIX-ID OCH RÄKNARE, aldrig priser. Det skrivs ut i en
// publik Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { queryAuctions } from "@/lib/auction/store";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import { korRea, seedaHistorik, type ReaDeps } from "@/lib/pricing/rea-kor";
import { WixReaLager } from "@/lib/pricing/rea-lager";
import { lasVariantpriser } from "@/lib/wix/jamforpris";
import { redigeraFeltext } from "@/lib/wix/variant-svep";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Skrivningen påbörjar inga nya produkter efter så lång tid. Läsningen tar ungefär en halv minut. */
const SKRIVBUDGET_MS = 200_000;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function deps(): ReaDeps {
  const wix = skapaWixAnrop();
  return {
    lager: new WixReaLager(),
    wix,
    lasVariantpriser: () => lasVariantpriser(wix),
    lasAuktioner: () => queryAuctions(["live", "sold", "expired"]),
  };
}

function heltal(v: string | null): number | undefined {
  if (v === null || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
}

async function kor(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  const start = Date.now();
  const q = req.nextUrl.searchParams;
  const lage = q.get("lage") ?? "kor";
  const torr = q.get("dryRun") !== "false";
  try {
    const d = deps();

    if (lage === "status") {
      const t = await d.lager.lasTillstand();
      return NextResponse.json({ ok: true, lage, ...t, luckor: t.luckor.length, senasteLucka: t.luckor.at(-1) ?? null });
    }

    if (lage === "pa" || lage === "av") {
      await d.lager.uppdateraTillstand({ skriv: lage === "pa" });
      const t = await d.lager.lasTillstand();
      if (t.skriv !== (lage === "pa")) {
        return NextResponse.json({ ok: false, error: "strömbrytaren läste inte tillbaka som skriven" }, { status: 500 });
      }
      console.log(`[rea] strömbrytaren ${lage === "pa" ? "på" : "av"}`);
      await audit("rea", "admin", `strömbrytaren ${lage === "pa" ? "på" : "av"}`).catch(() => undefined);
      return NextResponse.json({ ok: true, lage, skriv: t.skriv, seedKlar: t.seedKlar });
    }

    if (lage === "seed") {
      const r = await seedaHistorik(d, { torr, igen: q.get("igen") === "1" });
      const rad =
        `[rea] seed ${torr ? "torr" : "skarp"}: ${r.redanGjord ? "redan gjord, " : ""}${r.butiksrader} butiksrader, ` +
        `${r.fullstandigaDagar} av ${r.dagar} dagar fullständiga, ${r.luckor} luckor, ` +
        `${r.envariant} produkter med en variant, ${r.flervariantHoppade} med flera hoppade, ` +
        `${r.seedade} fyllda bakåt (${r.punkter} punkter), ${r.sparadeFel} fel` +
        (r.stoppadAv ? `, stoppad av ${r.stoppadAv}` : "");
      console.log(rad);
      if (!torr && !r.redanGjord) await audit("rea", "admin", rad.slice(0, 900)).catch(() => undefined);
      return NextResponse.json({ ok: r.sparadeFel === 0 && !r.stoppadAv, lage, ...r });
    }

    if (lage !== "kor") return NextResponse.json({ ok: false, error: `okänt läge "${lage}"` }, { status: 400 });

    const limit = heltal(q.get("limit"));
    const maxNya = heltal(q.get("maxNya"));
    if (Number.isNaN(limit) || Number.isNaN(maxNya)) {
      return NextResponse.json({ ok: false, error: "limit och maxNya är heltal, noll eller större" }, { status: 400 });
    }
    const ids = (q.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const r = await korRea(d, {
      torr,
      deadline: start + SKRIVBUDGET_MS,
      ...(limit !== undefined ? { limit } : {}),
      ...(maxNya !== undefined ? { maxNya } : {}),
      ...(ids.length ? { ids } : {}),
    });
    const skrevNagot = r.skrivet.satta + r.skrivet.borttagna > 0;
    const problem = r.stoppad || r.skrivet.fel > 0 || r.skrivet.avvikelser > 0 || r.historik.fel > 0 || r.plan.nyaSparrade;
    const rad =
      `[rea] ${torr ? "torr" : "skarp"}: ${r.varianter} varianter (${r.erbjudna} köpbara), ` +
      `historik ${r.historik.produkter} produkter, ${r.historik.nyaPunkter} nya punkter, ${r.historik.fel} fel` +
      (r.historik.nyLucka ? `, ny lucka sedan ${r.historik.nyLucka.fran}` : "") +
      `; rea på ${r.beslut.rea} varianter (${r.medRea.length} produkter), ${r.beslut.auktionLevande} i levande auktion; ` +
      `plan ${r.plan.nya} nya, ${r.plan.byten} byten, ${r.plan.borttagningar} borttagna på ${r.plan.produkter} produkter` +
      (r.plan.nyaSparrade ? " (masspärren: inga nya)" : "") +
      `; skrivet ${r.skrivet.satta} satta, ${r.skrivet.borttagna} borttagna på ${r.skrivet.produkter} produkter, ` +
      `${r.skrivet.prisAndrat} med ändrat pris, ${r.skrivet.fel} fel, ${r.skrivet.avvikelser} avvikelser` +
      (r.skrevInte ? `; skrev inte: ${r.skrevInte}` : "") +
      (r.stoppadAv ? `; stoppad av ${r.stoppadAv}` : "") +
      (r.ejNadda > 0 ? `, ${r.ejNadda} kvar` : "");
    // En tom körning loggar ingenting: den går varje timme (CLAUDE.md, "En tom cron-tugga ska vara TYST").
    if (torr || skrevNagot || problem || r.historik.nyLucka) console.log(rad);
    if (!torr && (skrevNagot || problem)) await audit("rea", "cron", rad.slice(0, 900)).catch(() => undefined);
    const ok = !(r.stoppadAv && r.stoppadAv !== "tidsbudget") && r.skrivet.fel === 0 && r.historik.fel === 0;
    return NextResponse.json({ ok, lage, ...r });
  } catch (err) {
    const message = redigeraFeltext(err instanceof Error ? err.message : String(err)).slice(0, 300);
    console.error(`[rea] ${lage} föll: ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

export const GET = kor;
export const POST = kor;
