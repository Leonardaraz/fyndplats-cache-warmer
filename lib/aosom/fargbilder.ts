// Färgbilderna: varje färg på en sammanslagen sida får ALLA sina bilder
// (2026-09-30). Ren logik — inga anrop. Läsning och skrivning bor i
// ./fargbilder-kor.ts, rutten i app/api/admin/fargbilder.
//
// VARFÖR DEN FINNS
//
// Sammanslagningen (./sammanslagning.ts) lade ett utkast som en FÄRG på en
// publicerad sida, men bara givarens FÖRSTA bild följde med, som valets
// `linkedMedia`. Givaren pensionerades och ligger kvar dold i Wix med sina ~5
// bilder, och från ungefär 2026-10-11 kan den raderas. En tillagd färg visade
// alltså en bild i butiken, och resten fanns bara på ett utkast som snart är
// borta. Torrkörningen 2026-09-30: 516 sidor med givare för 796 tillagda val,
// aldrig mer än en givare per val.
//
// GIVAREN HITTAS VIA FILEN, INTE VIA SKU:N
//
// Den nya variantens SKU är sidans SKU plus färgen (sammanslagning.ts), inte
// givarens. Filen i valets `linkedMedia[0]` ligger däremot i exakt ett dolt
// utkasts galleri — samma fil-id, eftersom sammanslagningen länkar givarens fil
// i stället för att ladda upp en kopia. `hittaGivare` gör den uppslagningen,
// och två dolda produkter med samma fil är ett hinder, inte en gissning.
//
// SAMMA ÄGARREGLER SOM BUTIKEN
//
// Butiken (headless-site, lib/variant-bilder.ts) avgör vilken färg en bild
// visar: `linkedMedia` först; en olänkad bild vars alt-text nämner exakt en av
// färgerna hör till den; Fyndplats egna kort och måttbilder (`arKort`) och
// bilder som nämner flera färger är gemensamma; övriga olänkade foton hör till
// huvudbildens färg. Reglerna är kopierade hit ordagrant (repona delar ingen
// kod) och låsta med samma fall i fargbilder.test.ts. Efter en skrivning är
// varje färgs bilder LÄNKADE, så butiken behöver inte längre gissa.
//
// WIX TAR 15 BILDER PER PRODUKT — BUTIKEN FÅR ALLA
//
// `media.itemsInfo.items` tar högst 15 poster (Wix V3, "About Product Media").
// Galleriet får därför de gemensamma korten, varje länkad bild och sedan de
// första bilderna per färg, fördelade jämnt. Resten hamnar i `overflow` och
// sparas i motorns tabell `fargbilder`, som butiken läser via /api/fargbilder.
// Ingenting skärs bort, och bildstädningen räknar tabellens filer som använda.
//
// ☠️ EN LÄNKAD BILD TAPPAS ALDRIG. Varje bild ett val (vilken axel som helst)
// pekar på i dag står kvar i galleriet, och varje färgs nya lista BÖRJAR med
// dess nuvarande lista. `kontrolleraPlan` fäller en plan som bryter det, och
// återläsningen efter skrivningen (`kontrolleraEfter`) fäller en sida där Wix
// inte stämmer.
//
// ☠️ OPOLERADE GIVARES BILDER FRÅN POSITION 2 GRANSKAS. 46 % av feedens bilder
// bär tysk text inbränd, och en givare med tyskt namn eller tom alt-text har
// ingen människa tittat på. Sådana bilder skrivs inte utan `taMedGranskade`;
// de sparas i tabellen som `granskas`, så att filerna inte städas bort innan
// någon hunnit titta, men butiken får dem inte.

import { createHash } from "node:crypto";

// ── ägarreglerna, ordagrant ur butikens lib/variant-bilder.ts ────────────────

/** Bokstavsgränser som förstår å, ä och ö (JavaScripts \b gör inte det). */
const FORE = "(?<![\\p{L}\\p{N}])";
const EFTER = "(?![\\p{L}\\p{N}])";

/** "mot vit bakgrund" beskriver fotot, inte varan. Tas bort innan färgerna läses. */
const BAKGRUND = /(?<![\p{L}])(?:vit|vita|vitt|grå|gråa|grått|svart|svarta|ljus|ljusa|ljusgrå|beige)\s+(?:bakgrund|bakgrunden|studiobakgrund|yta|ytan)(?![\p{L}])/giu;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Böjningsformerna av ett svenskt färgord. Null när etiketten inte är ett ord. */
export function fargFormer(etikett: string): string[] | null {
  const w = (etikett || "").trim().toLowerCase();
  if (!/^\p{L}{3,}$/u.test(w)) return null;
  const former = new Set([w, w + "a", w + "t", w + "tt"]);
  if (w.endsWith("d")) former.add(w.slice(0, -1) + "tt"); // röd → rött
  if (w.endsWith("t")) former.add(w + "t"); // vit → vitt
  return [...former];
}

/** Vilka av etiketterna en alt-text nämner (efter att bakgrunden strukits). */
export function nammdaFarger(alt: string, etiketter: string[]): string[] {
  const text = (alt || "").replace(BAKGRUND, " ");
  const traffar: string[] = [];
  for (const e of etiketter) {
    const former = fargFormer(e);
    if (!former) continue;
    const re = new RegExp(`${FORE}(?:${former.map(esc).join("|")})${EFTER}`, "iu");
    if (re.test(text)) traffar.push(e);
  }
  return traffar;
}

/** Fyndplats egna kort och måttbilder — gemensamma för alla färger. */
export function arKort(alt: string): boolean {
  return (
    /^\s*(?:fyndplats|mått|specifikation)/i.test(alt) ||
    /(?:spec(?:ifikations)?|mått|färg|fakta|storleks)kort/i.test(alt) ||
    /mått(?:bild|ritning|skiss|skisser|uppgifter)/i.test(alt)
  );
}

// ── husets egna regler ───────────────────────────────────────────────────────

/** Wix tak för `media.itemsInfo.items` per produkt. */
export const WIX_BILDTAK = 15;

/**
 * Från den här positionen (1-baserat) granskas en opolerad givares bilder.
 * Position 1 är redan valets bild på sidan. Leonard vill granska varje annan
 * bild från en opolerad givare själv innan den publiceras (2026-09-30).
 */
export const GRANSKA_FRAN_POSITION = 2;

/**
 * Tyska i ett namn eller en alt-text. Svenskan har varken ß eller ü, och
 * orden nedan är inga svenska ord. Gränserna förstår å, ä och ö.
 */
const TYSKA = new RegExp(
  `${FORE}(?:für|mit|und|der|die|das|aus|zum|zur|einem|einer|eine|oder|ohne|stück|farbe|grau|schwarz|weiß|weiss|braun|holz|garten)${EFTER}|[ßü]`,
  "iu",
);

export function arTyska(text: string): boolean {
  return TYSKA.test(text || "");
}

/** En alt-text som får stå kvar: icke-tom och inte tysk. */
export function harSvenskAlt(alt: string): boolean {
  const a = (alt || "").trim();
  return a.length > 0 && !arTyska(a);
}

/** Opolerad givare: tyskt namn eller någon bild utan alt-text. */
export function arOpolerad(g: { namn: string; bilder: { alt: string }[] }): boolean {
  return arTyska(g.namn) || g.bilder.some((b) => !(b.alt || "").trim());
}

/**
 * Alt-texten en bild får när den saknar en svensk: "<sidans namn> i färgen
 * grå", och ", bild N" från den andra — samma form som sammanslagningen alltid
 * skrivit, så att två bilder på samma sida aldrig bär samma text.
 */
export function altFor(namn: string, val: { Färg?: string; Storlek?: string }, n: number): string {
  const delar: string[] = [];
  if (val.Färg) delar.push(`färgen ${val.Färg.toLowerCase()}`);
  if (val.Storlek) delar.push(`storleken ${val.Storlek}`);
  const bas = delar.length ? `${namn} i ${delar.join(" och ")}` : namn;
  return n === 1 ? bas : `${bas}, bild ${n}`;
}

const lika = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// ── typerna ──────────────────────────────────────────────────────────────────

export interface Bild {
  id: string;
  alt: string;
}

export interface FargVal {
  id: string;
  namn: string;
  /** `linkedMedia`, i Wix ordning. */
  lankade: string[];
}

export interface SidOption {
  namn: string;
  val: FargVal[];
}

export interface Givare {
  id: string;
  namn: string;
  /** Givarens galleri i ordning. */
  bilder: Bild[];
}

/** Var en fil i tabellen ligger. */
export type Plats = "galleri" | "overflow" | "granskas" | "gemensam";

export interface TabellRad {
  wixProductId: string;
  /** Tom för en gemensam bild. */
  choiceId: string;
  choiceName: string;
  ordning: number;
  filId: string;
  plats: Plats;
  givareId: string | null;
}

export interface SidaIn {
  id: string;
  namn: string;
  synlig: boolean;
  /** `media.itemsInfo.items` i ordning. Den första är produktens huvudbild. */
  bilder: Bild[];
  optioner: SidOption[];
  /** Val-id → givaren, ur `hittaGivare`. */
  givare: Record<string, Givare>;
  /** Val vars huvudbild ligger i mer än en dold produkt. */
  flerGivare: string[];
  /** Sidans rader i tabellen från en tidigare skrivning. */
  tabell: TabellRad[];
  /** Hinder som bara I/O kan se (öppen auktion). */
  hinder?: string[];
}

export type Kalla = "lankad" | "sida" | "givare" | "tabell";

export interface PlanBild {
  id: string;
  kalla: Kalla;
  /** Position i givarens galleri (1-baserat), bara för `givare`. */
  pos?: number;
  granskas: boolean;
  alt: string;
  /** Alt-texten är ny (saknade svensk). */
  altNy: boolean;
}

export interface ValPlan {
  valId: string;
  namn: string;
  ursprung: boolean;
  givareId: string | null;
  lankadeFore: string[];
  lankadeEfter: string[];
  /** Hela listan i ordning: galleriet, sedan overflow, sedan det som granskas. */
  bilder: PlanBild[];
  galleri: string[];
  overflow: string[];
  granskas: string[];
}

export interface SidPlan {
  id: string;
  hinder: string[];
  varningar: string[];
  taMedGranskade: boolean;
  val: ValPlan[];
  gemensamma: string[];
  /** Bilder som ett val på en ANNAN axel pekar på. De står kvar orörda. */
  fasta: string[];
  galleriFore: Bild[];
  galleriEfter: Bild[];
  /** Galleri, alt-texter eller länkar ändras i Wix. */
  andrarWix: boolean;
  /** Tabellen ändras. */
  andrarTabell: boolean;
  rader: TabellRad[];
  givarkort: number;
}

// ── givaren ──────────────────────────────────────────────────────────────────

/**
 * Fil-nyckel → de dolda produkter vars filer innehåller den. Byggs ur
 * katalogsvepet (`KatalogProdukt.nycklar`).
 */
export function doldaPerFil(katalog: readonly { id: string; visible: boolean; nycklar: string[] }[]): Map<string, string[]> {
  const ut = new Map<string, string[]>();
  for (const p of katalog) {
    if (p.visible) continue;
    for (const k of p.nycklar) {
      const lista = ut.get(k) ?? [];
      if (!lista.includes(p.id)) lista.push(p.id);
      ut.set(k, lista);
    }
  }
  return ut;
}

/** Filens nyckel: id-delen av en Wix-URL eller ett id. Samma som lib/wix/produkt-media.ts. */
export function filNyckel(s: string): string {
  const utan = (s || "").split("?")[0];
  return utan.split("/").pop() ?? utan;
}

/**
 * Givaren till varje färgval: den dolda produkt vars galleri bär valets
 * huvudbild. Ett val vars bild ligger i flera dolda produkter får ingen givare
 * och står i `flera` — en gissning där hade kunnat ge en färg fel varas bilder.
 */
export function hittaGivare(
  sidId: string,
  fargval: readonly FargVal[],
  dolda: ReadonlyMap<string, readonly string[]>,
): { givare: Record<string, string>; flera: string[] } {
  const givare: Record<string, string> = {};
  const flera: string[] = [];
  for (const v of fargval) {
    const huvud = v.lankade[0];
    if (!huvud) continue;
    const traffar = (dolda.get(filNyckel(huvud)) ?? []).filter((id) => id !== sidId);
    if (traffar.length === 1) givare[v.id] = traffar[0];
    else if (traffar.length > 1) flera.push(v.id);
  }
  return { givare, flera };
}

/**
 * Givarens bilder som kan följa med: galleriet i ordning, utan dubbletter och
 * utan givarens egna kort (sidans kort gäller alla färger). Position 1 följer
 * alltid med, för den är redan valets bild. En opolerad givares bilder från
 * position 2 (GRANSKA_FRAN_POSITION) flaggas `granskas`.
 */
export function givarensBilder(g: Givare): { bilder: { id: string; alt: string; pos: number; granskas: boolean }[]; kort: number } {
  const opolerad = arOpolerad(g);
  const sedda = new Set<string>();
  const bilder: { id: string; alt: string; pos: number; granskas: boolean }[] = [];
  let kort = 0;
  g.bilder.forEach((b, i) => {
    const pos = i + 1;
    if (!b.id || sedda.has(b.id)) return;
    sedda.add(b.id);
    if (pos > 1 && arKort(b.alt)) {
      kort++;
      return;
    }
    bilder.push({ id: b.id, alt: b.alt, pos, granskas: opolerad && pos >= GRANSKA_FRAN_POSITION });
  });
  return { bilder, kort };
}

// ── planen ───────────────────────────────────────────────────────────────────

function fargOption(optioner: readonly SidOption[]): SidOption | null {
  return optioner.find((o) => lika(o.namn, "Färg")) ?? null;
}

/**
 * Olänkade bilder på sidan → färgens namn, eller null för gemensam.
 * Butikens regler: kort är gemensamma, en alt-text som nämner exakt en färg
 * avgör, flera färger är gemensamt, och resten hör till huvudbildens färg.
 */
export function olankadeAgare(
  bilder: readonly Bild[],
  lankade: ReadonlySet<string>,
  farger: readonly string[],
  ursprung: string | null,
): Map<string, string | null> {
  const ut = new Map<string, string | null>();
  const etiketter = farger.filter((f) => fargFormer(f));
  for (const b of bilder) {
    if (lankade.has(b.id) || ut.has(b.id)) continue;
    if (arKort(b.alt)) {
      ut.set(b.id, null);
      continue;
    }
    const traffar = nammdaFarger(b.alt, etiketter);
    if (traffar.length === 1) ut.set(b.id, traffar[0]);
    else if (traffar.length > 1) ut.set(b.id, null);
    else ut.set(b.id, ursprung);
  }
  return ut;
}

/**
 * Planen för en sida. Deterministisk: samma indata ger samma plan, och
 * `planSha` av den är vad `skriv` kräver i `bekrafta`.
 */
export interface PlanOpts {
  /** Skriv även det som flaggats `granskas`. */
  taMedGranskade?: boolean;
  /**
   * Fil-id som en människa granskat och godkänt (Leonard 2026-10-01: "bilder
   * som kan ha tysk text får du kolla"). De skrivs fast de flaggats
   * `granskas`; alla andra flaggade står kvar. Ett godkännande står sedan i
   * tabellen som galleri/overflow och behöver inte ges igen.
   */
  godkanda?: ReadonlySet<string>;
  /**
   * Tillåt att sidans egna olänkade foton flyttas ur Wix galleri till
   * tabellen. Av som standard: butiken läser inte /api/fargbilder än, och
   * ett foto som bara står i tabellen syns då inte alls (hindret
   * `ur_galleriet_kraver_butiken`). Givarbilder som aldrig legat i galleriet
   * får alltid sparas i tabellen — de försvinner inte ur något.
   */
  tillatUrGalleriet?: boolean;
  /**
   * Kräv minst en givare eller tidigare rader i tabellen (`ingen_givare`).
   * Rutten sätter den när sidor anges för hand, så att en sida utan något att
   * flytta inte skrivs om i onödan.
   */
  kravGivare?: boolean;
}

export function planeraSida(s: SidaIn, opts: PlanOpts = {}): SidPlan {
  const taMedGranskade = opts.taMedGranskade === true;
  const hinder: string[] = [...(s.hinder ?? [])];
  const varningar: string[] = [];
  const hindra = (h: string) => {
    if (!hinder.includes(h)) hinder.push(h);
  };
  const galleriFore = s.bilder.filter((b) => b.id);
  const tom: SidPlan = {
    id: s.id,
    hinder,
    varningar,
    taMedGranskade,
    val: [],
    gemensamma: [],
    fasta: [],
    galleriFore,
    galleriEfter: galleriFore,
    andrarWix: false,
    andrarTabell: false,
    rader: [],
    givarkort: 0,
  };

  if (!s.synlig) hindra("ej_publicerad");
  const farg = fargOption(s.optioner);
  if (!farg || farg.val.length < 2) hindra("saknar_fargaxel");
  if (s.flerGivare.length > 0) hindra("flera_givare");
  if (opts.kravGivare && Object.keys(s.givare).length === 0 && !s.tabell.some((r) => r.choiceId)) {
    hindra("ingen_givare");
  }
  if (hinder.length > 0 || !farg) return tom;

  const iGalleriet = new Set(galleriFore.map((b) => b.id));
  const altAv = new Map(galleriFore.map((b) => [b.id, b.alt]));
  const allaLankade = new Set<string>();
  for (const o of s.optioner) for (const v of o.val) for (const id of v.lankade) allaLankade.add(id);
  if ([...allaLankade].some((id) => !iGalleriet.has(id))) {
    hindra("lankad_bild_saknas_i_galleriet");
    return tom;
  }
  const fasta = galleriFore
    .map((b) => b.id)
    .filter((id) => s.optioner.some((o) => o !== farg && o.val.some((v) => v.lankade.includes(id))));

  const huvudbild = galleriFore[0]?.id ?? null;
  const ursprungsVal = farg.val.find((v) => !!huvudbild && v.lankade.includes(huvudbild)) ?? null;
  if (!ursprungsVal) varningar.push("huvudbilden_saknar_farg");
  const agare = olankadeAgare(
    galleriFore.filter((b) => !fasta.includes(b.id)),
    allaLankade,
    farg.val.map((v) => v.namn),
    ursprungsVal?.namn ?? null,
  );
  const gemensamma = galleriFore.map((b) => b.id).filter((id) => agare.get(id) === null);

  // Tabellens rader för sidan: det som redan godkänts (galleri/overflow) och
  // det som väntar på granskning.
  const tabellPlats = new Map<string, Plats>();
  const tabellPerVal = new Map<string, TabellRad[]>();
  for (const r of [...s.tabell].sort((a, b) => a.ordning - b.ordning)) {
    if (!r.choiceId) continue;
    tabellPlats.set(`${r.choiceId}\u0000${r.filId}`, r.plats);
    const lista = tabellPerVal.get(r.choiceId) ?? [];
    lista.push(r);
    tabellPerVal.set(r.choiceId, lista);
  }

  // Varje fil tillhör högst en färg: den som tar den först. Ordningen är
  // länkade bilder, givarnas, tabellens och sist sidans olänkade. Filen är
  // starkare belägg än alt-texten: efter en körning som föll mellan galleriet
  // och länkarna ligger givarens foton olänkade på sidan, och ett foto vars
  // text inte nämner färgen hade annars gått till huvudbildens färg.
  const tagna = new Set<string>([...allaLankade, ...gemensamma, ...fasta]);
  let givarkort = 0;
  const utkast: { v: FargVal; ursprung: boolean; givareId: string | null; bilder: PlanBild[] }[] = [];
  for (const v of farg.val) {
    const bilder: PlanBild[] = v.lankade.map((id) => ({
      id, kalla: "lankad" as const, granskas: false, alt: altAv.get(id) ?? "", altNy: false,
    }));
    utkast.push({ v, ursprung: v === ursprungsVal, givareId: null, bilder });
  }
  for (const u of utkast) {
    const g = s.givare[u.v.id];
    if (!g || u.v.lankade.length === 0) continue;
    u.givareId = g.id;
    // Träffen ska vara givarens bild 1 — den sammanslagningen länkade. Är den
    // inte det kan filen vara delad med en annan vara; varna, blockera inte.
    if (g.bilder[0]?.id !== u.v.lankade[0]) varningar.push("givarens_traff_ar_inte_bild_1");
    const gb = givarensBilder(g);
    givarkort += gb.kort;
    for (const b of gb.bilder) {
      if (tagna.has(b.id)) continue;
      tagna.add(b.id);
      // Ett godkännande står i tabellen: en bild som en gång skrivits till
      // galleriet eller overflow granskas inte igen.
      // Och ett foto som redan ligger i sidans galleri är redan publicerat —
      // att flagga det hade tagit bort det ur galleriet.
      const godkand = ["galleri", "overflow"].includes(tabellPlats.get(`${u.v.id}\u0000${b.id}`) ?? "")
        || iGalleriet.has(b.id);
      u.bilder.push({
        id: b.id, kalla: "givare", pos: b.pos, granskas: b.granskas && !godkand, alt: altAv.get(b.id) ?? b.alt, altNy: false,
      });
    }
  }
  for (const u of utkast) {
    if (u.v.lankade.length === 0) continue;
    for (const r of tabellPerVal.get(u.v.id) ?? []) {
      if (tagna.has(r.filId)) continue;
      tagna.add(r.filId);
      u.bilder.push({ id: r.filId, kalla: "tabell", granskas: r.plats === "granskas", alt: altAv.get(r.filId) ?? "", altNy: false });
    }
  }
  // Foton som hör till en färg utan länkad bild står kvar orörda i galleriet.
  const orordaIGalleriet = new Set<string>();
  for (const b of galleriFore) {
    const namn = agare.get(b.id);
    if (!namn) continue;
    const u = utkast.find((x) => lika(x.v.namn, namn));
    if (tagna.has(b.id)) continue;
    // ☠️ En färg utan länkad bild får inga olänkade: den har ingen huvudbild
    // att visa dem efter. Men fotot får inte heller försvinna ur galleriet —
    // det står i ingen lista och ingen tabellrad, så det hade varit borta.
    if (!u || u.v.lankade.length === 0) {
      tagna.add(b.id);
      orordaIGalleriet.add(b.id);
      continue;
    }
    u.bilder.push({ id: b.id, kalla: "sida", granskas: false, alt: b.alt, altNy: false });
    tagna.add(b.id);
  }
  for (const u of utkast) if (u.v.lankade.length === 0) varningar.push("val_utan_bild");

  // ── 15-taket ─────────────────────────────────────────────────────────────
  // Kvar i galleriet oavsett: huvudbilden, de gemensamma, andra axlars bilder
  // och varje länkad bild. Resten fördelas en i taget till den färg som har
  // minst i galleriet.
  const fastaIGalleriet = new Set<string>([...gemensamma, ...fasta, ...allaLankade, ...orordaIGalleriet]);
  if (huvudbild) fastaIGalleriet.add(huvudbild);
  let rum = WIX_BILDTAK - fastaIGalleriet.size;
  if (rum < 0) {
    hindra("over_tak_redan");
    return { ...tom, hinder };
  }
  const godkanda = opts.godkanda ?? new Set<string>();
  const vald = (b: PlanBild) => !b.granskas || taMedGranskade || godkanda.has(b.id);
  const galleriPer = new Map<string, string[]>(
    utkast.map((u) => [u.v.id, u.bilder.filter((b) => fastaIGalleriet.has(b.id)).map((b) => b.id)]),
  );
  const kvar = new Map<string, PlanBild[]>(
    utkast.map((u) => [u.v.id, u.bilder.filter((b) => !fastaIGalleriet.has(b.id) && vald(b))]),
  );
  while (rum > 0) {
    let basta: (typeof utkast)[number] | null = null;
    for (const u of utkast) {
      if ((kvar.get(u.v.id) ?? []).length === 0) continue;
      if (!basta || galleriPer.get(u.v.id)!.length < galleriPer.get(basta.v.id)!.length) basta = u;
    }
    if (!basta) break;
    const nasta = kvar.get(basta.v.id)!.shift()!;
    galleriPer.get(basta.v.id)!.push(nasta.id);
    rum--;
  }

  // ── alt-texterna och valens listor ──────────────────────────────────────
  const val: ValPlan[] = utkast.map((u) => {
    const galleri = galleriPer.get(u.v.id)!;
    const iGal = new Set(galleri);
    const valda = u.bilder.filter((b) => iGal.has(b.id) || vald(b));
    const overflow = valda.filter((b) => !iGal.has(b.id)).map((b) => b.id);
    const granskas = u.bilder.filter((b) => !vald(b)).map((b) => b.id);
    const ordnade = [
      ...galleri.map((id) => u.bilder.find((b) => b.id === id)!),
      ...overflow.map((id) => u.bilder.find((b) => b.id === id)!),
      ...granskas.map((id) => u.bilder.find((b) => b.id === id)!),
    ].map((b, i) => {
      if (harSvenskAlt(b.alt)) return b;
      return { ...b, alt: altFor(s.namn, { Färg: u.v.namn }, i + 1), altNy: true };
    });
    return {
      valId: u.v.id,
      namn: u.v.namn,
      ursprung: u.ursprung,
      givareId: u.givareId,
      lankadeFore: [...u.v.lankade],
      lankadeEfter: u.v.lankade.length ? galleri : [],
      bilder: ordnade,
      galleri,
      overflow,
      granskas,
    };
  });

  // ── galleriet i Wix ──────────────────────────────────────────────────────
  // Det som står kvar behåller sin plats (huvudbilden först), och det nya
  // kommer efter, färg för färg.
  const altEfter = new Map<string, string>();
  for (const v of val) for (const b of v.bilder) altEfter.set(b.id, b.alt);
  const iGalleriEfter = new Set<string>([...fastaIGalleriet, ...val.flatMap((v) => v.galleri)]);
  const galleriEfter: Bild[] = [
    ...galleriFore.filter((b) => iGalleriEfter.has(b.id)).map((b) => ({ id: b.id, alt: altEfter.get(b.id) ?? b.alt })),
  ];
  for (const v of val) {
    for (const id of v.galleri) {
      if (!galleriEfter.some((b) => b.id === id)) galleriEfter.push({ id, alt: altEfter.get(id) ?? "" });
    }
  }

  const iEfter = new Set(galleriEfter.map((b) => b.id));
  if (!opts.tillatUrGalleriet && galleriFore.some((b) => !iEfter.has(b.id))) {
    hindra("ur_galleriet_kraver_butiken");
  }

  // ── tabellen ─────────────────────────────────────────────────────────────
  const rader: TabellRad[] = [];
  for (const v of val) {
    if (v.lankadeFore.length === 0) continue;
    const iGal = new Set(v.galleri);
    const iOver = new Set(v.overflow);
    v.bilder.forEach((b, i) => {
      rader.push({
        wixProductId: s.id,
        choiceId: v.valId,
        choiceName: v.namn,
        ordning: i,
        filId: b.id,
        plats: iGal.has(b.id) ? "galleri" : iOver.has(b.id) ? "overflow" : "granskas",
        givareId: v.givareId,
      });
    });
  }
  gemensamma.forEach((id, i) => {
    rader.push({ wixProductId: s.id, choiceId: "", choiceName: "", ordning: i, filId: id, plats: "gemensam", givareId: null });
  });

  const plan: SidPlan = {
    id: s.id,
    hinder,
    varningar: [...new Set(varningar)],
    taMedGranskade,
    val,
    gemensamma,
    fasta,
    galleriFore,
    galleriEfter,
    andrarWix: false,
    andrarTabell: false,
    rader,
    givarkort,
  };
  plan.andrarWix =
    JSON.stringify(galleriEfter) !== JSON.stringify(galleriFore)
    || val.some((v) => JSON.stringify(v.lankadeEfter) !== JSON.stringify(v.lankadeFore));
  plan.andrarTabell = JSON.stringify(normRader(rader)) !== JSON.stringify(normRader(s.tabell));
  const fel = kontrolleraPlan(s, plan);
  if (fel.length > 0) {
    hindra("plan_ogiltig");
    plan.varningar.push(...fel);
  }
  return plan;
}

function normRader(rader: readonly TabellRad[]): string[] {
  return rader
    .map((r) => [r.choiceId, String(r.ordning).padStart(3, "0"), r.filId, r.plats, r.givareId ?? "", r.choiceName].join("|"))
    .sort();
}

/**
 * Planens invarianter. Tom lista = planen går att skriva. Den körs på varje
 * plan, och en plan som bryter något blir `plan_ogiltig` — aldrig skriven.
 */
export function kontrolleraPlan(s: SidaIn, p: SidPlan): string[] {
  const fel: string[] = [];
  const galleri = p.galleriEfter.map((b) => b.id);
  const iGalleriet = new Set(galleri);
  if (galleri.length > WIX_BILDTAK) fel.push(`galleriet har ${galleri.length} bilder, Wix tar ${WIX_BILDTAK}`);
  if (iGalleriet.size !== galleri.length) fel.push("samma bild två gånger i galleriet");
  if (s.bilder[0] && galleri[0] !== s.bilder[0].id) fel.push("huvudbilden flyttas");
  for (const o of s.optioner) {
    for (const v of o.val) {
      for (const id of v.lankade) if (!iGalleriet.has(id)) fel.push("en länkad bild faller ur galleriet");
    }
  }
  for (const v of p.val) {
    if (v.lankadeEfter.slice(0, v.lankadeFore.length).join("|") !== v.lankadeFore.join("|")) {
      fel.push("ett vals nuvarande länkade bilder står inte först i dess nya lista");
    }
    for (const id of v.lankadeEfter) if (!iGalleriet.has(id)) fel.push("en länkad bild saknas i galleriet");
    for (const id of v.galleri) {
      if (!(p.galleriEfter.find((b) => b.id === id)?.alt ?? "").trim()) fel.push("en färgs bild saknar alt-text");
    }
  }
  return [...new Set(fel)];
}

/** sha256 av det som skrivs, i kanonisk form. Samma plan ger samma sha. */
export function planSha(
  planer: readonly SidPlan[],
  taMedGranskade: boolean,
  tillatUrGalleriet = false,
  godkanda: ReadonlySet<string> = new Set(),
): string {
  const kanon = {
    taMedGranskade,
    tillatUrGalleriet,
    // Med i sha:n bara när listan används, så äldre planers sha står sig.
    ...(godkanda.size ? { godkanda: [...godkanda].sort() } : {}),
    sidor: [...planer]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((p) => ({
        id: p.id,
        hinder: [...p.hinder].sort(),
        galleri: p.galleriEfter.map((b) => [b.id, b.alt]),
        val: p.val.map((v) => [v.valId, v.lankadeEfter, v.overflow, v.granskas]),
        rader: normRader(p.rader),
      })),
  };
  return createHash("sha256").update(JSON.stringify(kanon)).digest("hex");
}

/** Räknarna som får stå i en publik logg: wix-id, antal och hinder. */
export function raknare(p: SidPlan) {
  const iFore = new Set(p.galleriFore.map((b) => b.id));
  return {
    id: p.id,
    hinder: p.hinder,
    // Fasta koder och fasta meningar — aldrig ett namn eller en alt-text.
    varningar: p.varningar,
    andrarWix: p.andrarWix,
    andrarTabell: p.andrarTabell,
    val: p.val.length,
    givare: p.val.filter((v) => v.givareId).length,
    bilderFore: p.galleriFore.length,
    bilderEfter: p.galleriEfter.length,
    nyaIGalleriet: p.galleriEfter.filter((b) => !iFore.has(b.id)).length,
    urGalleriet: p.galleriFore.filter((b) => !p.galleriEfter.some((x) => x.id === b.id)).length,
    lankadeFore: p.val.reduce((n, v) => n + v.lankadeFore.length, 0),
    lankadeEfter: p.val.reduce((n, v) => n + v.lankadeEfter.length, 0),
    overflow: p.val.reduce((n, v) => n + v.overflow.length, 0),
    granskas: p.val.reduce((n, v) => n + v.granskas.length, 0),
    altNya: p.val.reduce((n, v) => n + v.bilder.filter((b) => b.altNy && !v.granskas.includes(b.id)).length, 0),
    givarkort: p.givarkort,
  };
}

// ── återläsningen ────────────────────────────────────────────────────────────

/**
 * Stämmer Wix med planen efter skrivningen? Tom lista = ja. Läser inget själv.
 * `fore` och `efter` är samma sida läst före och efter.
 */
/** En variant som återläsningen ser den. Pris, SKU och val jämförs när de finns. */
export interface VariantLage {
  id: string;
  synlig: boolean;
  sku?: string;
  pris?: string | null;
  /** Variantens val, t.ex. "Färg=Grå|Storlek=90 cm". */
  val?: string;
}

/**
 * Avvikelsen som betyder att länkarna ännu inte tagits emot. Bara den får
 * skrivningen försöka om; allt annat stoppar direkt.
 */
export const LANK_AVVIKELSE = "ett färgval pekar inte på de planerade bilderna";

export function kontrolleraEfter(
  plan: SidPlan,
  fore: { synlig: boolean; optioner: SidOption[]; varianter: VariantLage[] },
  efter: { synlig: boolean; bilder: Bild[]; optioner: SidOption[]; varianter: VariantLage[] },
): string[] {
  const fel: string[] = [];
  if (efter.synlig !== fore.synlig) fel.push("sidans synlighet ändrades");
  const galleri = efter.bilder.map((b) => b.id);
  const vantat = plan.galleriEfter.map((b) => b.id);
  if (galleri.join("|") !== vantat.join("|")) fel.push("galleriet är inte det planerade");
  for (const b of plan.galleriEfter) {
    const e = efter.bilder.find((x) => x.id === b.id);
    if (e && e.alt !== b.alt) {
      fel.push("en alt-text är inte den planerade");
      break;
    }
  }
  const iGalleriet = new Set(galleri);
  const farg = fargOption(efter.optioner);
  for (const v of plan.val) {
    const e = farg?.val.find((x) => x.id === v.valId);
    if (!e) {
      fel.push("ett färgval saknas efter skrivningen");
      continue;
    }
    if (e.lankade.join("|") !== v.lankadeEfter.join("|")) fel.push(LANK_AVVIKELSE);
  }
  for (const o of fore.optioner) {
    if (lika(o.namn, "Färg")) continue;
    const e = efter.optioner.find((x) => lika(x.namn, o.namn));
    for (const v of o.val) {
      const ev = e?.val.find((x) => x.id === v.id);
      if (!ev || ev.lankade.join("|") !== v.lankade.join("|")) fel.push("ett val på en annan axel ändrades");
    }
  }
  for (const o of efter.optioner) {
    for (const v of o.val) for (const id of v.lankade) if (!iGalleriet.has(id)) fel.push("en länkad bild saknas i galleriet");
  }
  if (efter.varianter.length !== fore.varianter.length) fel.push("antalet varianter ändrades");
  for (const v of fore.varianter) {
    const e = efter.varianter.find((x) => x.id === v.id);
    if (!e) {
      fel.push("en variant saknas efter skrivningen");
      continue;
    }
    if (v.synlig && !e.synlig) fel.push("en variant är inte längre synlig");
    // ☠️ Och åt andra hållet: en dold variant som blivit synlig säljer något
    // som hölls undan (en variantsInfo-PATCH kan publicera, CLAUDE.md).
    if (!v.synlig && e.synlig) fel.push("en dold variant har blivit synlig");
    if ((v.sku ?? "") !== (e.sku ?? "")) fel.push("en variants SKU ändrades");
    if ((v.pris ?? null) !== (e.pris ?? null)) fel.push("en variants pris ändrades");
    if ((v.val ?? "") !== (e.val ?? "")) fel.push("en variants val ändrades");
  }
  return [...new Set(fel)];
}

// ── urvalet ──────────────────────────────────────────────────────────────────

/**
 * Sidorna som behöver verktyget: publicerade, med minst två färgval, där något
 * val har en givare som tabellen inte redan räknat med. Sorterat på wix-id så
 * att `hogst` alltid tar samma sidor.
 */
export function valjSidor(
  katalog: readonly { id: string; visible: boolean; val?: { axel: string; id: string; forsta: string | null }[] }[],
  dolda: ReadonlyMap<string, readonly string[]>,
  skrivnaVal: ReadonlySet<string>,
  /**
   * Sidor med rader som Wix ännu inte bekräftat: skrivningen föll efter
   * tabellen (steg 0). De väljs igen oavsett givare, annars hade en halvskriven
   * sida räknats som klar och `kandidaterTotalt` nått noll för tidigt.
   */
  halvskrivna: ReadonlySet<string> = new Set(),
): string[] {
  const ut: string[] = [];
  for (const p of katalog) {
    if (!p.visible) continue;
    if (halvskrivna.has(p.id)) {
      ut.push(p.id);
      continue;
    }
    const farg = (p.val ?? []).filter((v) => lika(v.axel, "Färg"));
    if (farg.length < 2) continue;
    const behover = farg.some((v) => {
      if (!v.forsta) return false;
      const traffar = (dolda.get(filNyckel(v.forsta)) ?? []).filter((id) => id !== p.id);
      // Ett val utan id i svepet räknas som skrivet när sidan har rader alls —
      // annars hade samma sida valts om och om igen.
      const skriven = skrivnaVal.has(valNyckel(p.id, v.id || "*"));
      return traffar.length > 0 && !skriven;
    });
    if (behover) ut.push(p.id);
  }
  return ut.sort();
}

/**
 * Nyckeln `valjSidor` slår upp skrivna val med. `valNyckel(sida, "*")` betyder
 * att sidan har bekräftade rader alls. Bara rader Wix bekräftat räknas.
 */
export function valNyckel(wixProductId: string, choiceId: string): string {
  return `${wixProductId}\u0000${choiceId}`;
}

/**
 * Det butiken får: varje vals bilder i ordning (galleri, sedan overflow) och de
 * gemensamma. `granskas` lämnar aldrig motorn.
 */
export function forButiken(rader: readonly TabellRad[]): { val: Record<string, string[]>; gemensamma: string[] } {
  const val: Record<string, string[]> = {};
  const gemensamma: string[] = [];
  for (const r of [...rader].sort((a, b) => a.choiceId.localeCompare(b.choiceId) || a.ordning - b.ordning)) {
    if (r.plats === "gemensam") gemensamma.push(r.filId);
    else if (r.plats === "galleri" || r.plats === "overflow") (val[r.choiceName] ??= []).push(r.filId);
  }
  return { val, gemensamma };
}

/**
 * `godkanda` som fil-id i Wix form (`b379ce_<32 hex>~mv2.jpg`). Tar emot både
 * den formen och de 32 hextecknen. Null när något inte är ett fil-id.
 */
export function lasGodkanda(param: string): Set<string> | null {
  const ut = new Set<string>();
  for (const del of param.split(",").map((x) => x.trim()).filter(Boolean)) {
    const m = /^(?:b379ce_)?([0-9a-f]{32})(?:~mv2\.(?:jpg|jpeg|png|webp))?$/i.exec(del);
    if (!m) return null;
    const ext = /~mv2\.(jpg|jpeg|png|webp)$/i.exec(del)?.[1]?.toLowerCase() ?? "jpg";
    ut.add(`b379ce_${m[1].toLowerCase()}~mv2.${ext}`);
  }
  return ut;
}
