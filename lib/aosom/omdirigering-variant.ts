// Sammanslagningarnas 301:or landar på givarens färg (2026-10-06).
//
// VARFÖR. En sammanslagen färgsida (t.ex. den krämvita knästolen) omdirigerades
// till sidan vi behöll, men till sidans FÖRVAL — oftast en annan färg. Google
// bryr sig inte, men en kund som kommer via en gammal länk, ett bokmärke eller
// en delning ser fel färg först. Leonard 2026-10-06: "fixa det noggrant".
//
// Nya sammanslagningar skriver `?variant=` direkt (lib/aosom/sammanslagning.ts).
// Den här modulen rättar de rader som redan fanns: 325 st den 2026-10-06.
//
// HUR VARIANTEN HITTAS. Givarens Aosom-artikel står kvar på dess pensionerade
// mappning (`variants[0].supplierVariantId`, se `utkastetsArtikel`), och sidan
// vi behöll har en mappningsvariant per artikel med `wixVariantId`. Samma
// artikel på båda ger variant-id:t, som sedan måste finnas i Wix. Det är
// artikeln som avgör, inte färgens namn: namnen ändras vid poleringen.
//
// ☠️ HELLRE INGEN ÄNDRING ÄN FEL FÄRG. Allt som inte går att avgöra exakt —
// ingen givare, ingen artikel, artikeln på noll eller flera varianter, ett
// variant-id som inte finns i Wix — lämnar raden som den är. Den pekar då
// fortfarande på rätt sida, bara inte på rätt färg.
//
// Ren logik utan IO; rutten /api/admin/omdirigeringar-variant gör läsningarna.

import type { ProductMappingRecord } from "../store";
import type { RedirectRow } from "../wix/redirects";
import { radensArtikel } from "./artiklar";

/** Skälet som sammanslagningen skriver på sina rader. */
export const SAMMANSLAGEN_PREFIX = "Sammanslagen";

export type VariantmalSkal =
  | "givaren_hittas_inte"
  | "givarens_artikel_saknas"
  | "sidan_hittas_inte"
  | "artikeln_inte_pa_sidan"
  | "artikeln_pa_flera_varianter"
  | "varianten_inte_i_wix";

export type Variantmal =
  | { status: "nytt_mal"; toPath: string; variantId: string }
  | { status: "redan_variant" }
  | { status: "hoppad"; skal: VariantmalSkal };

export interface WixVariant {
  id: string;
  sku: string;
}

export interface VariantmalIn {
  rad: RedirectRow;
  /** Givarens mappning (den pensionerade sidan med `fromSlug`), eller null. */
  givare: ProductMappingRecord | null;
  /** Mappningen för sidan raden pekar på, eller null. */
  behall: ProductMappingRecord | null;
  /** Den sidans varianter i Wix, eller null när sidan inte gick att läsa. */
  behallVarianter: WixVariant[] | null;
}

const norm = (s: string | undefined | null) => String(s ?? "").trim().toUpperCase();

/** Rader från en sammanslagning som ännu inte pekar på en variant. */
export function arSammanslagenUtanVariant(r: RedirectRow): boolean {
  return String(r.reason ?? "").startsWith(SAMMANSLAGEN_PREFIX) && !String(r.toPath ?? "").includes("?");
}

/** Givarens artikel: radens egen, eller den som står kvar på varianten efter pensioneringen. */
export function givarensArtikel(m: ProductMappingRecord): string {
  return norm(radensArtikel(m) || m.variants?.[0]?.supplierVariantId);
}

export function planeraVariantmal(inp: VariantmalIn): Variantmal {
  const { rad, givare, behall, behallVarianter } = inp;
  if (String(rad.toPath ?? "").includes("?")) return { status: "redan_variant" };
  if (!givare) return { status: "hoppad", skal: "givaren_hittas_inte" };
  const artikel = givarensArtikel(givare);
  if (!artikel) return { status: "hoppad", skal: "givarens_artikel_saknas" };
  if (!behall || !behallVarianter) return { status: "hoppad", skal: "sidan_hittas_inte" };

  const traffar = (behall.variants ?? []).filter((v) => norm(v.supplierVariantId) === artikel);
  if (traffar.length === 0) return { status: "hoppad", skal: "artikeln_inte_pa_sidan" };
  if (traffar.length > 1) return { status: "hoppad", skal: "artikeln_pa_flera_varianter" };
  const mv = traffar[0];

  // Variant-id:t ur mappningen, men bara om Wix har det. Saknas id:t (äldre
  // rader) får SKU:n avgöra — och bara en exakt, ensam träff räknas.
  let id = "";
  if (mv.wixVariantId && behallVarianter.some((v) => v.id === mv.wixVariantId)) {
    id = mv.wixVariantId;
  } else if (!mv.wixVariantId && mv.sku) {
    const viaSku = behallVarianter.filter((v) => v.sku === mv.sku);
    if (viaSku.length === 1) id = viaSku[0].id;
  }
  if (!id) return { status: "hoppad", skal: "varianten_inte_i_wix" };

  return { status: "nytt_mal", variantId: id, toPath: `${rad.toPath.trim()}?variant=${encodeURIComponent(id)}` };
}
