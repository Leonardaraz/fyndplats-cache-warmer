// GET /api/cron/media-audit
//
// Inventerar Media Manager: vilka bilder refereras INTE av katalogen?
//
// Frågan kom från Leonard 2026-08-27 ("alla bilder vi har i wix som inte
// används till någon produkt eller något"). Den går inte att besvara från
// chatten: biblioteket har 30 231 bilder och ett filobjekt är ~1,3 kB, alltså
// ~39 MB som skulle behöva passera en konversation. Här, med WIX_API_TOKEN i
// miljön, är samma jobb ~170 API-anrop.
//
// RUTTEN SKRIVER ALDRIG NÅGOT. Det finns ingen raderingsväg, medvetet:
// "utan katalogreferens" är inte samma sak som "oanvänd". Wix Media har inget
// API som svarar på var en fil används (kontrollerat 2026-08-27), så sidor,
// banners, logotyper, bloggen och CMS-kollektioner ligger utanför det vi kan
// se. Rapporten är ett underlag för en människa. Ska något raderas görs det
// mot en läst lista, precis som i prisreparationen.
//
// Query:
//   ?siteId=...      inventera ett annat site (default: butikens headless-site)
//   ?maxSeconds=240  egen tidsbudget (ruttens maxDuration är 300 s)
//   ?ids=1           ta med hela id-listan i svaret (annars bara de 200 största)

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import {
  buildReport,
  collectCatalogMediaIds,
  collectCategoryMediaIds,
  countProducts,
  headlessSiteId,
  listAllMediaFiles,
} from "@/lib/wix/media-audit";

export const runtime = "nodejs";
export const maxDuration = 300;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const siteId = req.nextUrl.searchParams.get("siteId") || headlessSiteId();
  const maxSeconds = Number(req.nextUrl.searchParams.get("maxSeconds")) || 240;
  const medIds = req.nextUrl.searchParams.get("ids") === "1";
  const budget = { deadline: Date.now() + maxSeconds * 1000 };

  try {
    // Katalogen först. Den är den lilla sidan (1 696 produkter mot 30 231
    // filer) och den som gör listan meningsfull — hinner inte den klart är
    // rapporten värdelös, och då ska vi inte ha bränt budgeten på filerna.
    const katalog = await collectCatalogMediaIds(siteId, budget);

    // Facit på hur många produkter som FINNS. Ser sökningen färre saknas
    // referenser vi inte vet om, och rapporten får inte kallas fullständig.
    let produkterIKatalogen: number | null = null;
    try {
      produkterIKatalogen = await countProducts(siteId);
    } catch {
      produkterIKatalogen = null;
    }

    let kategoriIds: Set<string> | null = null;
    let kategorifel: string | undefined;
    try {
      kategoriIds = await collectCategoryMediaIds(siteId);
    } catch (e) {
      kategorifel = e instanceof Error ? e.message : String(e);
    }

    const media = await listAllMediaFiles(siteId, budget);
    const rapport = buildReport(
      siteId,
      media,
      katalog,
      { ids: kategoriIds, fel: kategorifel },
      produkterIKatalogen,
    );

    return NextResponse.json({
      ok: true,
      ...rapport,
      mbUtanReferens: Math.round((rapport.bytesUtanReferens / 1_048_576) * 10) / 10,
      mbTotalt: Math.round((rapport.bytesTotalt / 1_048_576) * 10) / 10,
      mbIDubbletter: Math.round((rapport.bytesIDubbletter / 1_048_576) * 10) / 10,
      idUtanReferens: medIds ? rapport.idUtanReferens : undefined,
      varning: rapport.fullstandig
        ? "Utan katalogreferens ≠ oanvänd: sidor, banners, blogg och CMS-kollektioner syns inte här."
        : "OFULLSTÄNDIG körning — siffrorna är undre gränser och listan får INTE användas för radering.",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, fel: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
