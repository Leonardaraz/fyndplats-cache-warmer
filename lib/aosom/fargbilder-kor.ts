// Färgbildsverktygets läsning och skrivning. Planen är ren (./fargbilder.ts);
// här bor Wix-anropen, i den ordning husets bildregler kräver.
//
// ☠️ BILDERNA BYTS I STEG, ALDRIG RAKT AV (docs/polish/bildmetoder.md). En
// kopplad bild som faller ur galleriet ger 404 PRODUCT_MEDIA_NOT_EXIST, och en
// koppling till en bild som ännu inte tagits emot faller likadant:
//
//   0. TABELLEN FÖRST, och den läses tillbaka. Varje fil planen rör — också
//      ett olänkat foto som ska ut ur galleriet — står då i tabellen innan
//      Wix ändras. Faller något senare finns fotot kvar där, bildstädningen
//      tar det inte, och omkörningen läser in det igen (planen bygger på
//      tabellens rader). Stämmer inte återläsningen rörs Wix inte alls.
//   1. Galleriet skrivs ENSAMT (fieldMask media). Planen behåller varje bild
//      något val pekar på, så det enda som kan falla ur galleriet är olänkade
//      foton — och de står redan i tabellen.
//   2. Valens `linkedMedia` skrivs med options + variantsInfo ordagrant ur
//      GET:en och `visible` med — en variantsInfo-PATCH publicerar annars ett
//      utkast, och utan options svarar Wix 428 (CLAUDE.md). Försöks om upp
//      till åtta gånger, men BARA vid 404 PRODUCT_MEDIA_NOT_EXIST eller 409
//      och bara när det enda som avviker är länkarna.
//   3. Återläsning: galleriet, alt-texterna, varje vals lista, synligheten och
//      varje variants synlighet, pris, SKU och val jämförs mot planen.
//      Stämmer något inte stannar körningen.
//
// En sida som föll i steg 1–3 är ofarlig: varje länkad bild sitter kvar,
// och allt annat står i tabellen. En omkörning ser läget och gör resten.

import { felText, type WixAnrop } from "../polish/skrivplan";
import { refreshVariantMedia, variantbildSteg } from "../wix/variant-media";
import type { FargbildLager } from "../store/fargbilder";
import {
  GALLERI_AVVIKELSE,
  LANK_AVVIKELSE,
  hittaGivare,
  kontrolleraEfter,
  type VariantLage,
  type Bild,
  type Givare,
  type SidaIn,
  type SidOption,
  type SidPlan,
  type TabellRad,
} from "./fargbilder";

type Obj = Record<string, unknown>;

const FALT = "fields=VARIANT_OPTION_CHOICE_NAMES&fields=MEDIA_ITEMS_INFO";
/**
 * En galleribild som PATCH:en skickar den. ☠️ En TOM alt-text skickas inte:
 * Wix svarar då 400 "altText has size 0, expected 1 or more" och vägrar hela
 * galleriet (sidan 6341b51a 2026-10-01, där en äldre bild saknade alt-text).
 * Utan fältet behåller bilden sin tomma alt-text, så återläsningen stämmer.
 */
export function mediaPost(b: { id: string; alt: string }): { id: string; altText?: string } {
  return b.alt ? { id: b.id, altText: b.alt } : { id: b.id };
}

export const KOPPLING_FORSOK = 8;
export const KOPPLING_PAUS_MS = 2500;
/**
 * Wix GET kan svara med galleriet från FÖRE PATCH:en en kort stund efteråt
 * (sidan 369b4b2c 2026-10-01: galleriet stod rätt en minut senare, men
 * återläsningen såg det gamla och stoppade körningen före länkarna). Läs om
 * så här många gånger innan avvikelsen räknas.
 */
export const GALLERI_OMLASNINGAR = 4;

/** En produkt som verktyget ser den. */
export interface ProduktLast {
  id: string;
  namn: string;
  synlig: boolean;
  revision: unknown;
  bilder: Bild[];
  optioner: SidOption[];
  varianter: VariantLage[];
  /** GET-svaret ordagrant — options och variantsInfo skickas tillbaka ur det. */
  ra: Obj;
}

function produktAv(svar: unknown): Obj | null {
  const p = ((svar ?? {}) as Obj).product;
  return p && typeof p === "object" ? (p as Obj) : null;
}

const str = (x: unknown) => (typeof x === "string" ? x : "");

/** V3-produkten i verktygets form. Exporterad för testerna. */
export function tolkaProdukt(p: Obj): ProduktLast {
  const items = ((((p.media as Obj | undefined)?.itemsInfo as Obj | undefined)?.items) ?? []) as Obj[];
  const optioner = ((p.options ?? []) as Obj[]).map((o) => ({
    namn: str(o.name),
    val: ((((o.choicesSettings as Obj | undefined)?.choices) ?? []) as Obj[]).map((c) => ({
      id: str(c.choiceId),
      namn: str(c.name),
      lankade: ((c.linkedMedia ?? []) as Obj[]).map((m) => str(m.id)).filter(Boolean),
    })),
  }));
  const varianter = ((((p.variantsInfo as Obj | undefined)?.variants) ?? []) as Obj[]).map((v) => {
    const pris = ((v.price as Obj | undefined)?.actualPrice as Obj | undefined)?.amount;
    const val = ((v.choices ?? []) as Obj[])
      .map((c) => c.optionChoiceNames as Obj | undefined)
      .filter((n): n is Obj => !!n)
      .map((n) => `${str(n.optionName)}=${str(n.choiceName)}`)
      .sort()
      .join("|");
    return {
      id: str(v.id),
      synlig: v.visible === true,
      sku: str(v.sku),
      pris: pris === undefined || pris === null ? null : String(pris),
      val,
    };
  });
  return {
    id: str(p.id),
    namn: str(p.name),
    synlig: p.visible === true,
    revision: p.revision,
    bilder: items.map((m) => ({ id: str(m.id), alt: str(m.altText) })).filter((b) => b.id),
    optioner,
    varianter,
    ra: p,
  };
}

export async function lasProdukt(wix: WixAnrop, id: string): Promise<ProduktLast | null> {
  try {
    const p = produktAv(await wix("GET", `/stores/v3/products/${encodeURIComponent(id)}?${FALT}`));
    return p ? tolkaProdukt(p) : null;
  } catch (e) {
    if (/Wix 404/.test(String((e as Error)?.message ?? e))) return null;
    throw e;
  }
}

/**
 * Sidan som planen behöver: produkten färskt ur Wix, givarna (hittade via
 * filen i `dolda`, katalogsvepets index över dolda produkter) och tabellens
 * rader. En givare som inte går att läsa är ett hinder — den kan ha raderats
 * mellan svepet och läsningen.
 */
export async function lasSidaIn(
  deps: { wix: WixAnrop; lager: FargbildLager },
  id: string,
  dolda: ReadonlyMap<string, readonly string[]>,
  hinder: string[],
): Promise<{ in: SidaIn; produkt: ProduktLast } | null> {
  const produkt = await lasProdukt(deps.wix, id);
  if (!produkt) return null;
  const farg = produkt.optioner.find((o) => o.namn.trim().toLowerCase() === "färg");
  const { givare: givarePerVal, flera: flerGivare } = hittaGivare(id, farg?.val ?? [], dolda);
  const givare: Record<string, Givare> = {};
  const extra = [...hinder];
  for (const [valId, gid] of Object.entries(givarePerVal)) {
    const g = await lasProdukt(deps.wix, gid);
    if (!g) {
      if (!extra.includes("givare_gick_inte_att_lasa")) extra.push("givare_gick_inte_att_lasa");
      continue;
    }
    if (g.synlig) {
      if (!extra.includes("givare_publicerad")) extra.push("givare_publicerad");
      continue;
    }
    givare[valId] = { id: g.id, namn: g.namn, bilder: g.bilder };
  }
  const tabell = await deps.lager.lasForProdukt(id);
  return {
    produkt,
    in: {
      id,
      namn: produkt.namn,
      synlig: produkt.synlig,
      bilder: produkt.bilder,
      optioner: produkt.optioner,
      givare,
      flerGivare,
      tabell,
      hinder: extra,
    },
  };
}

export interface SkrivDeps {
  wix: WixAnrop;
  lager: FargbildLager;
  vanta?: (ms: number) => Promise<void>;
}

export interface SkrivUtfall {
  id: string;
  ok: boolean;
  steg: string[];
  fel?: string;
}

const sammaLista = (a: readonly string[], b: readonly string[]) => a.join("|") === b.join("|");

/** Planens utgångsläge mot en färsk läsning: har sidan ändrats sedan planen? */
export function sammaUtgangslage(plan: SidPlan, p: ProduktLast): boolean {
  if (JSON.stringify(p.bilder) !== JSON.stringify(plan.galleriFore)) return false;
  const farg = p.optioner.find((o) => o.namn.trim().toLowerCase() === "färg");
  return plan.val.every((v) => sammaLista(farg?.val.find((x) => x.id === v.valId)?.lankade ?? [], v.lankadeFore));
}

function normTabell(rader: readonly TabellRad[]): string {
  return JSON.stringify(
    rader
      .map((r) => [r.choiceId, r.ordning, r.filId, r.plats, r.givareId ?? "", r.choiceName])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])) || Number(a[1]) - Number(b[1])),
  );
}

/** Valens nya `linkedMedia` i GET:ens options, allt annat ordagrant. */
export function optionerMedLankar(p: ProduktLast, plan: SidPlan): Obj[] {
  return ((p.ra.options ?? []) as Obj[]).map((o) => {
    if (str(o.name).trim().toLowerCase() !== "färg") return o;
    return {
      ...o,
      choicesSettings: {
        ...((o.choicesSettings as Obj | undefined) ?? {}),
        choices: ((((o.choicesSettings as Obj | undefined)?.choices) ?? []) as Obj[]).map((c) => {
          const v = plan.val.find((x) => x.valId === str(c.choiceId));
          if (!v || v.lankadeEfter.length === 0) return c;
          return { ...c, linkedMedia: v.lankadeEfter.map((id) => ({ id })) };
        }),
      },
    };
  });
}

/** Ett fel som betyder att Wix ännu tar emot bilderna — värt att försöka om. */
export function arOvergaende(e: unknown): boolean {
  const m = String((e as Error)?.message ?? e);
  return /Wix 409/.test(m) || (/Wix 404/.test(m) && /PRODUCT_MEDIA_NOT_EXIST/.test(m));
}

/**
 * Skriver en sidas plan och läser tillbaka. `ok: false` betyder att körningen
 * ska stanna: något stämmer inte, och ingen fler sida ska röras förrän någon
 * tittat.
 */
export async function skrivSida(plan: SidPlan, deps: SkrivDeps): Promise<SkrivUtfall> {
  const vanta = deps.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const steg: string[] = [];
  const fall = (fel: string): SkrivUtfall => ({ id: plan.id, ok: false, steg, fel });
  if (plan.hinder.length > 0) return fall(`hinder: ${plan.hinder.join(", ")}`);

  const fore = await lasProdukt(deps.wix, plan.id);
  if (!fore) return fall("sidan gick inte att läsa");
  if (!sammaUtgangslage(plan, fore)) return fall("sidan har ändrats sedan planen — kör planen igen");
  const foreLage = { synlig: fore.synlig, optioner: fore.optioner, varianter: fore.varianter };

  // ── 4: först när Wix läst tillbaka som planen räknas sidan som skriven ──
  // Raderna från steg 0 är obekräftade tills hit. Faller något däremellan
  // står sidan som halvskriven, och urvalet väljer den igen.
  async function bekrafta(): Promise<SkrivUtfall> {
    try {
      await deps.lager.bekraftaWix(plan.id);
      steg.push("wix bekräftad");
      return { id: plan.id, ok: true, steg };
    } catch (e) {
      return fall(`bekräftelsen föll: ${felText(e)} — Wix är skrivet, sidan väljs igen`);
    }
  }

  // ── 0: tabellen, före Wix ──────────────────────────────────────────────
  if (plan.andrarTabell || plan.andrarWix) {
    try {
      await deps.lager.ersattForProdukt(plan.id, plan.rader);
      const tillbaka = await deps.lager.lasForProdukt(plan.id);
      if (normTabell(tillbaka) !== normTabell(plan.rader)) {
        return fall("tabellen läste inte tillbaka som planen — Wix rördes INTE, kör om");
      }
      steg.push(`tabell: ${plan.rader.length} rader (återläst)`);
    } catch (e) {
      return fall(`tabellen föll: ${felText(e)} — Wix rördes INTE, kör om`);
    }
  }
  if (!plan.andrarWix) return bekrafta();

  // ── 1: galleriet, ensamt ───────────────────────────────────────────────
  let galleriPatchat = false;
  try {
    if (JSON.stringify(plan.galleriEfter) !== JSON.stringify(plan.galleriFore)) {
      await deps.wix("PATCH", `/stores/v3/products/${encodeURIComponent(plan.id)}`, {
        product: {
          revision: fore.revision,
          media: { itemsInfo: { items: plan.galleriEfter.map(mediaPost) } },
        },
        fieldMask: { paths: ["media"] },
      });
      galleriPatchat = true;
      steg.push(`galleri ${plan.galleriFore.length} → ${plan.galleriEfter.length}`);
    }
  } catch (e) {
    return fall(`galleriet föll: ${felText(e)} — tabellen är skriven, kör om`);
  }

  // ── 2 + 3: länkarna, med försök, och återläsningen ────────────────────
  const behoverLankar = plan.val.some((v) => !sammaLista(v.lankadeEfter, v.lankadeFore));
  const las = async () => {
    const p = await lasProdukt(deps.wix, plan.id);
    return { p, avvikelser: p ? kontrolleraEfter(plan, foreLage, p) : ["sidan gick inte att läsa efter skrivningen"] };
  };
  let sistaFel = "";
  let forsok = 0;
  try {
    let { p: efter, avvikelser } = await las();
    // Ett galleri som inte stämmer direkt efter vår egen PATCH kan vara en
    // gammal läsning. Läs om, men skriv ingenting; står det kvar stoppar det.
    let omlasningar = 0;
    while (galleriPatchat && efter && avvikelser.includes(GALLERI_AVVIKELSE) && omlasningar < GALLERI_OMLASNINGAR) {
      omlasningar++;
      await vanta(KOPPLING_PAUS_MS);
      ({ p: efter, avvikelser } = await las());
    }
    if (omlasningar > 0) steg.push(`galleriet omläst ${omlasningar} ${omlasningar === 1 ? "gång" : "gånger"}`);
    // Bara länkarna får vänta på Wix. Allt annat är en avvikelse som stoppar.
    const baraLankar = () => avvikelser.length > 0 && avvikelser.every((a) => a === LANK_AVVIKELSE);
    while (behoverLankar && efter && baraLankar() && forsok < KOPPLING_FORSOK) {
      forsok++;
      try {
        await deps.wix("PATCH", `/stores/v3/products/${encodeURIComponent(plan.id)}`, {
          product: {
            revision: efter.revision,
            visible: efter.ra.visible,
            options: optionerMedLankar(efter, plan),
            variantsInfo: efter.ra.variantsInfo,
          },
          fieldMask: { paths: ["options", "variantsInfo", "visible"] },
        });
      } catch (e) {
        sistaFel = felText(e);
        if (!arOvergaende(e)) {
          return fall(`länkningen föll: ${sistaFel} — tabellen är skriven, varje länkad bild sitter kvar`);
        }
      }
      await vanta(KOPPLING_PAUS_MS);
      ({ p: efter, avvikelser } = await las());
    }
    if (avvikelser.length > 0) {
      return fall(
        `Wix stämmer inte med planen (${avvikelser.join("; ")})${sistaFel ? ` — sista fel: ${sistaFel}` : ""}`
          + " — tabellen är skriven, kör om",
      );
    }
  } catch (e) {
    return fall(`återläsningen föll: ${felText(e)} — tabellen är skriven, kör om`);
  }
  if (behoverLankar) {
    steg.push(`länkar: ${plan.val.filter((v) => !sammaLista(v.lankadeEfter, v.lankadeFore)).length} val (${forsok} försök)`);
    // Länkarna skrevs med val-id, och då räknar Wix inte om variantens bild
    // (lib/wix/variant-media.ts). En avvikelse stoppar körningen.
    const vb = variantbildSteg(await refreshVariantMedia(deps.wix, plan.id, { vanta }));
    steg.push(vb.rad);
    if (vb.stopp) return fall(`${vb.rad} — tabellen och länkarna är skrivna, kontrollera sidan`);
  }
  return bekrafta();
}
