// Bildplanen: en runda som BARA skriver bildlistan (2026-09-30).
//
// Skrivplanen (skrivplan.ts) skriver text, bilder, kategorier och SKU i ett
// svep, och den kräver sidans hela text. En sida som redan är polerad och bara
// ska få fler bilder har ingen ny text att skicka, och att skicka den gamla
// betyder att läsa den ur Wix och skriva tillbaka den, alltså en avskrift av en
// publicerad text som ingen tänkt ändra.
//
// Bildplanen bär därför bara `kort`, `pid` och `media`. Den byggs med
// tools/polish-gates/bygg-bildplan.py ur rundans nyttolast-media.json
// (bygg-media.py), och workflowen "Polering — skriv bara bilderna" skickar den
// hit. Skrivningen är skrivplanens eget mediesteg, så båda vägarna vägrar en
// lista som tappar en bild ett färgval pekar på.
//
// ☠️ Svaret går till en PUBLIK Actions-logg: bara kort-id, ok/fel och antal.

import {
  HEX8,
  UUID,
  MEDIA_ID,
  RUNDA,
  strang,
  artikelnummerformer,
  produktAv,
  summera,
  felText,
  stegMedia,
  type Obj,
  type SkrivMedia,
  type StegRad,
  type StegUtfall,
  type WixAnrop,
} from "./skrivplan";

export const BILDSTEG = ["media", "verifiera"] as const;
export type Bildsteg = (typeof BILDSTEG)[number];

/** En bildrunda rör bara media, och ett anrop är en GET och en PATCH per produkt. */
export const MAX_BILDPRODUKTER = 50;

export interface BildProdukt {
  kort: string;
  pid: string;
  media: SkrivMedia[];
}

export interface Bildplan {
  runda: string;
  produkter: BildProdukt[];
}

export function valideraBildplan(x: unknown): { plan: Bildplan } | { fel: string[] } {
  const fel: string[] = [];
  if (typeof x !== "object" || x === null || Array.isArray(x)) return { fel: ["planen måste vara ett objekt"] };
  const p = x as Record<string, unknown>;
  if (!strang(p.runda, 60) || !RUNDA.test(p.runda)) fel.push("runda saknas eller har fel form");
  if (!Array.isArray(p.produkter) || p.produkter.length === 0) return { fel: [...fel, "produkter saknas"] };
  if (p.produkter.length > MAX_BILDPRODUKTER) {
    return { fel: [...fel, `högst ${MAX_BILDPRODUKTER} produkter per plan`] };
  }

  const sedda = { kort: new Set<string>(), pid: new Set<string>() };
  p.produkter.forEach((r: unknown, i: number) => {
    const d = (typeof r === "object" && r !== null ? r : {}) as Record<string, unknown>;
    const var_ = typeof d.kort === "string" && HEX8.test(d.kort) ? d.kort : `rad ${i + 1}`;
    const f = (t: string) => fel.push(`${var_}: ${t}`);

    if (!strang(d.kort, 8) || !HEX8.test(d.kort)) f("kort ska vara 8 hextecken");
    if (!strang(d.pid, 36) || !UUID.test(d.pid)) f("pid ska vara ett uuid");
    else if (typeof d.kort === "string" && !d.pid.startsWith(d.kort)) f("pid börjar inte med kort");

    if (!Array.isArray(d.media) || d.media.length === 0 || d.media.length > 15) f("media ska ha 1–15 bilder");
    else {
      const idn = new Set<string>();
      d.media.forEach((m: unknown, j: number) => {
        const mm = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>;
        if (!strang(mm.id, 80) || !MEDIA_ID.test(mm.id)) f(`bild ${j + 1}: id har fel form`);
        else if (idn.has(mm.id)) f(`bild ${j + 1}: samma bild två gånger`);
        else idn.add(mm.id);
        if (!strang(mm.altText, 250) || !mm.altText.trim()) f(`bild ${j + 1}: altText saknas`);
        // ☠️ Felet namnger bilden, aldrig träffen — svaret går till en publik logg.
        else if (artikelnummerformer(mm.altText) > 0) f(`bild ${j + 1} altText har artikelnummerform`);
      });
    }

    for (const nyckel of ["kort", "pid"] as const) {
      const v = d[nyckel];
      if (typeof v !== "string") continue;
      if (sedda[nyckel].has(v)) f(`${nyckel} förekommer två gånger i planen`);
      sedda[nyckel].add(v);
    }
  });

  return fel.length ? { fel } : { plan: x as Bildplan };
}

/**
 * Läser varje produkt i en egen GET och jämför bildlistan mot planen: samma
 * bilder, i samma ordning, med samma alt-text. Synligheten rapporteras men
 * fäller inte — en bildskrivning rör den aldrig.
 */
export async function verifieraBilder(plan: Bildplan, wix: WixAnrop): Promise<StegUtfall> {
  const rader: StegRad[] = [];
  for (const p of plan.produkter) {
    try {
      const prod = produktAv(await wix("GET", `/stores/v3/products/${p.pid}?fields=MEDIA_ITEMS_INFO`));
      // ☠️ Bevisa att fältet FANNS i projektionen innan en nolla tolkas som fel.
      const items = ((prod.media as Obj | undefined)?.itemsInfo as Obj | undefined)?.items;
      if (!Array.isArray(items)) {
        rader.push({ kort: p.kort, ok: false, fel: "fält saknas i projektionen: media.itemsInfo" });
        continue;
      }
      const bilder = items as Obj[];
      const ok = bilder.length === p.media.length
        && bilder.every((b, i) => b.id === p.media[i].id && (b.altText ?? "") === p.media[i].altText);
      rader.push({
        kort: p.kort,
        ok,
        ...(ok ? {} : { fel: "bildlistan skiljer sig från planen" }),
        rev: prod.revision,
        bilder: bilder.length,
        synlig: prod.visible === true,
      });
    } catch (e) {
      rader.push({ kort: p.kort, ok: false, fel: felText(e) });
    }
  }
  return summera(rader, "verifierade");
}

export async function korBildsteg(steg: Bildsteg, plan: Bildplan, wix: WixAnrop, torr: boolean): Promise<StegUtfall> {
  switch (steg) {
    case "media":
      return stegMedia(plan, wix, torr);
    case "verifiera":
      return verifieraBilder(plan, wix);
  }
}
