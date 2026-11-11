// GET /api/admin/kategorikoll
//
// KATEGORIKOLLEN (planen A4/A5, 2026-11-04). Bara läsning, ingen skrivning.
//
// Läser kategoriträdet och alla synliga produkter med deras direkta kategorier
// en gång, och räknar två saker över hela katalogen:
//
//   brodsmula      butikens brödsmula före och efter regeln "avdelningen
//                  produkten är kopplad till går först" (lib/kategorikoll/
//                  brodsmula.ts), grupperad "från → till" med antal.
//   typkopplingar  produkter vars namn pekar ut en underkategori som de inte
//                  ligger i (lib/polish/typkategori.ts), per kategori.
//
// ☠️ Svaret går till en publik Actions-logg: det bär antal, kategorinamn och
// Wix-id, aldrig produktnamn, priser eller artikelnummer. Namnen slås upp
// lokalt ur id:na.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import { lasKategoritradet } from "@/lib/wix/kategoritrad";
import { saknadeTypkategorier } from "@/lib/polish/typkategori";
import { brodsmula, PROMO, raknaPerSida, somText, type Kat } from "@/lib/kategorikoll/brodsmula";
import { lasSynligaProdukter } from "@/lib/kategorikoll/produkter";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Wix-id per grupp i svaret. Antalet är alltid det fulla. */
const ID_PER_GRUPP = 40;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  const wix = skapaWixAnrop();
  try {
    const trad = await lasKategoritradet(wix);
    // Butiken ser bara synliga kategorier och aldrig promo-kollektionerna.
    const kategorier: Kat[] = trad
      .filter((k) => k.synlig && !PROMO.has(k.namn))
      .map((k) => ({ id: k.id, namn: k.namn, foralder: k.foralder }));
    const perId = new Map(kategorier.map((k) => [k.id, k]));

    // Filtret följer bara med första sidan; se lib/kategorikoll/produkter.ts.
    const produkter = await lasSynligaProdukter(wix);

    // Butikens listningar räknar bara produkter i lager.
    const antal = raknaPerSida(
      produkter.filter((p) => p.iLager),
      kategorier,
    );
    const brod = new Map<string, { antal: number; ids: string[] }>();
    const typ = new Map<string, { antal: number; ids: string[] }>();
    let andras = 0;
    let typSaknas = 0;
    for (const p of produkter) {
      const egna = p.kat.map((id) => perId.get(id)).filter((k): k is Kat => k !== undefined);
      const fore = somText(brodsmula(egna, kategorier, antal, "fore"));
      const efter = somText(brodsmula(egna, kategorier, antal, "efter", p.namn));
      if (fore !== efter) {
        andras++;
        const g = brod.get(`${fore} → ${efter}`) ?? { antal: 0, ids: [] };
        g.antal++;
        if (g.ids.length < ID_PER_GRUPP) g.ids.push(p.id);
        brod.set(`${fore} → ${efter}`, g);
      }
      const saknade = saknadeTypkategorier({ namn: p.namn, kat: egna.map((k) => k.namn) }, trad);
      if (saknade.length) typSaknas++;
      for (const s of saknade) {
        const g = typ.get(s.kategori) ?? { antal: 0, ids: [] };
        g.antal++;
        if (g.ids.length < ID_PER_GRUPP) g.ids.push(p.id);
        typ.set(s.kategori, g);
      }
    }

    const sorterad = (m: Map<string, { antal: number; ids: string[] }>, nyckel: string) =>
      [...m.entries()].sort((a, b) => b[1].antal - a[1].antal).map(([k, v]) => ({ [nyckel]: k, ...v }));
    const svar = {
      ok: true,
      produkter: produkter.length,
      iLager: produkter.filter((p) => p.iLager).length,
      brodsmula: { andras, grupper: sorterad(brod, "byte") },
      typkopplingar: { produkter: typSaknas, perKategori: sorterad(typ, "kategori") },
    };
    console.log(
      `[kategorikoll] ${svar.produkter} produkter: ${andras} får ny brödsmula i ${brod.size} grupper, ` +
        `${typSaknas} saknar en typkategori`,
    );
    return NextResponse.json(svar, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e).slice(0, 300);
    console.error(`[kategorikoll] ${msg}`);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
