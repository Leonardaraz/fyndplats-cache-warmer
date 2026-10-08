// POST /api/admin/omdirigeringar-variant — sammanslagningarnas 301:or landar
// på givarens färg.
//
//   (ingen parameter)   torrt: räknar och visar exempel, skriver ingenting
//   ?skarp=ja           skriver `?variant=<id>` på varje rad som går att
//                       avgöra exakt, och läser tillbaka raderna
//
// Leonard 2026-10-06: en gammal färgsida ska landa på sin färg på den
// sammanslagna sidan, inte på sidans förval. Logiken och dess spärrar bor i
// lib/aosom/omdirigering-variant.ts; det här är IO och auth.
//
// ☠️ HELLRE INGEN ÄNDRING ÄN FEL FÄRG. En rad som inte går att avgöra exakt
// lämnas orörd och räknas per skäl. Den pekar redan på rätt sida.
//
// ☠️ LOGGEN BÄR BARA RÄKNARE OCH ADRESSER — aldrig artikelnummer. Rutten
// anropas från en publik Actions-logg. Adresserna och variant-id:na står redan
// på sajten.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getStore } from "@/lib/store/factory";
import { mapWithConcurrency } from "@/lib/concurrency";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import type { WixAnrop } from "@/lib/polish/skrivplan";
import { listRedirects, upsertRedirect, type RedirectRow } from "@/lib/wix/redirects";
import {
  arSammanslagenUtanVariant,
  planeraVariantmal,
  type Variantmal,
  type WixVariant,
} from "@/lib/aosom/omdirigering-variant";

export const runtime = "nodejs";
export const maxDuration = 300;

const TIDSBUDGET_MS = 240_000;
/** Wix Data-frågans tak. Nås det läses lagret inte helt, och då skrivs ingenting. */
const LASTAK = 1000;
const SAMTIDIGA = 4;

type Obj = Record<string, unknown>;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

/** Produkten med exakt den här adressen, synlig eller inte. Kastar vid flera träffar. */
async function produktViaSlug(wix: WixAnrop, slug: string): Promise<Obj | null> {
  const s = slug.trim().toLowerCase();
  const svar = (await wix("POST", "/stores/v3/products/query", {
    query: { filter: { slug: s }, cursorPaging: { limit: 10 } },
  })) as { products?: Obj[] };
  const traffar = (svar.products ?? []).filter((p) => String(p.slug ?? "").trim().toLowerCase() === s);
  if (traffar.length > 1) throw new Error(`två produkter med adressen ${s}`);
  return traffar[0] ?? null;
}

async function varianterAv(wix: WixAnrop, id: string): Promise<WixVariant[]> {
  const svar = (await wix("GET", `/stores/v3/products/${encodeURIComponent(id)}?fields=VARIANT_OPTION_CHOICE_NAMES`)) as {
    product?: { variantsInfo?: { variants?: Obj[] } };
  };
  return (svar.product?.variantsInfo?.variants ?? [])
    .filter((v) => typeof v.id === "string")
    .map((v) => ({ id: v.id as string, sku: String(v.sku ?? "") }));
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }
  const skarp = req.nextUrl.searchParams.get("skarp") === "ja";

  let rader: RedirectRow[];
  try {
    rader = await listRedirects(LASTAK);
  } catch (err) {
    console.error(`[omdirigering-variant] kunde inte läsa omdirigeringarna: ${String(err).slice(0, 200)}`);
    return NextResponse.json({ ok: false, error: "Kunde inte läsa omdirigeringarna" }, { status: 500 });
  }
  if (rader.length >= LASTAK) {
    console.error(`[omdirigering-variant] TRUNKERAD: ${rader.length} rader, taket är ${LASTAK} — inget skrivet`);
    return NextResponse.json({ ok: false, trunkerad: true, error: "Fler omdirigeringar än rutten läser" }, { status: 500 });
  }
  const kandidater = rader.filter(arSammanslagenUtanVariant);

  const wix = skapaWixAnrop();
  const store = getStore();
  // Många givare pekar på samma sida: varje sida läses en gång.
  const sidor = new Map<string, Promise<{ id: string; varianter: WixVariant[] } | null>>();
  const sidaFor = (slug: string) => {
    if (!sidor.has(slug)) {
      sidor.set(slug, (async () => {
        const p = await produktViaSlug(wix, slug);
        if (!p || typeof p.id !== "string") return null;
        return { id: p.id, varianter: await varianterAv(wix, p.id) };
      })());
    }
    return sidor.get(slug)!;
  };

  type Utfall = { rad: RedirectRow; mal: Variantmal | null; fel?: string; skriven?: boolean };
  const utfall: Utfall[] = await mapWithConcurrency(kandidater, SAMTIDIGA, async (rad): Promise<Utfall> => {
    if (Date.now() - t0 > TIDSBUDGET_MS) return { rad, mal: null };
    try {
      const givarProdukt = await produktViaSlug(wix, rad.fromSlug);
      const givare = givarProdukt && typeof givarProdukt.id === "string"
        ? await store.getMappingByWixProductId(givarProdukt.id)
        : null;
      const mal = rad.toPath.trim();
      const sida = mal.startsWith("/produkt/") ? await sidaFor(mal.slice("/produkt/".length)) : null;
      const behall = sida ? await store.getMappingByWixProductId(sida.id) : null;
      const plan = planeraVariantmal({ rad, givare, behall, behallVarianter: sida?.varianter ?? null });
      if (skarp && plan.status === "nytt_mal") {
        await upsertRedirect({ ...rad, toPath: plan.toPath });
        return { rad, mal: plan, skriven: true };
      }
      return { rad, mal: plan };
    } catch (err) {
      return { rad, mal: null, fel: String((err as Error)?.message ?? err).slice(0, 160) };
    }
  });

  // Läs tillbaka: varje skriven rad ska stå med sitt nya mål.
  let aterlasta = 0;
  let avvikande = 0;
  const skrivna = utfall.filter((u) => u.skriven && u.mal?.status === "nytt_mal");
  if (skrivna.length > 0) {
    const efter = new Map((await listRedirects(LASTAK)).map((r) => [r.fromSlug, r.toPath]));
    for (const u of skrivna) {
      if (efter.get(u.rad.fromSlug) === (u.mal as { toPath: string }).toPath) aterlasta++;
      else avvikande++;
    }
  }

  const perSkal: Record<string, number> = {};
  let nyttMal = 0;
  let fel = 0;
  let ejHunna = 0;
  for (const u of utfall) {
    if (u.fel) fel++;
    else if (!u.mal) ejHunna++;
    else if (u.mal.status === "nytt_mal") nyttMal++;
    else if (u.mal.status === "hoppad") perSkal[u.mal.skal] = (perSkal[u.mal.skal] ?? 0) + 1;
  }
  const kvar = skarp ? kandidater.length - skrivna.length - Object.values(perSkal).reduce((a, b) => a + b, 0) : kandidater.length;

  if (skarp && skrivna.length > 0) {
    await audit(
      "redirects",
      "omdirigering-variant",
      `${aterlasta} sammanslagna omdirigeringar pekar nu på givarens färg (?variant=), `
        + `${avvikande} läste inte tillbaka, ${Object.values(perSkal).reduce((a, b) => a + b, 0)} lämnade orörda`,
    );
  }
  console.log(
    `[omdirigering-variant] ${skarp ? "SKARP" : "TORR"} ${rader.length} rader, ${kandidater.length} sammanslagna utan variant, `
      + `${nyttMal} med exakt variant, ${skrivna.length} skrivna, ${aterlasta} återlästa, ${avvikande} avvikande, `
      + `orörda ${JSON.stringify(perSkal)}, ${fel} fel, ${ejHunna} ej hunna, ${Date.now() - t0} ms`,
  );
  for (const u of utfall.filter((x) => x.fel).slice(0, 10)) console.error(`[omdirigering-variant] ${u.rad.fromSlug}: ${u.fel}`);

  return NextResponse.json({
    ok: avvikande === 0 && fel === 0,
    dryRun: !skarp,
    rader: rader.length,
    kandidater: kandidater.length,
    nyttMal,
    skrivna: skrivna.length,
    aterlasta,
    avvikande,
    perSkal,
    fel,
    ejHunna,
    kvar,
    exempel: utfall
      .filter((u) => u.mal?.status === "nytt_mal")
      .slice(0, 15)
      .map((u) => `/produkt/${u.rad.fromSlug} → ${(u.mal as { toPath: string }).toPath}`),
    orordaExempel: utfall
      .filter((u) => u.mal?.status === "hoppad")
      .slice(0, 15)
      .map((u) => `/produkt/${u.rad.fromSlug}: ${(u.mal as { skal: string }).skal}`),
  });
}
