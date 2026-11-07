// Tar bort felaktiga kategorilänkar från redan skrivna produkter (Leonard
// 2026-11-02: "Fixa punkt 2").
//
// Poleringens kategoristeg (lib/polish/skrivplan.ts) och "VEVOR — kategorier till
// utkasten" lägger bara till. En länk som importen la dit och som inte passar
// varan satt därför kvar tills någon tog bort den i Wix, och runbooken förbjuder
// handbyggda skrivningar. Det här är den egna åtgärden: en liten plan med vad som
// ska bort och vad som måste finnas kvar, ett torrt läge som visar utfallet, ett
// skarpt läge som kräver antalet, och ett läge som läser tillbaka.
//
// Fem egenskaper som inte ska tas bort:
//
// 1. ☠️ Planen säger också vad som ska FINNAS KVAR (`behall`). En länk tas bara bort
//    när varan ligger kvar i de kategorier den ska höra hemma i, och minst en av
//    dem är synlig. Annars kunde en rättning lämna varan utan avdelning. Kravet
//    skyddar också mot en tom projektion: `fields=DIRECT_CATEGORIES_INFO` som
//    Wix tyst ignorerar ger en tom lista, och då faller `behall` i stället för att
//    allt ser "redan borta" ut.
// 2. ☠️ Alla villkor prövas för ALLA rader före första skrivningen. Faller ett villkor
//    (okänd eller tvetydig kategori, en produkt som inte går att läsa, en `behall`
//    som inte är kopplad) skrivs ingenting för någon rad.
// 3. ☠️ Kategorier anges med SÖKVÄG (`Kök & Husgeråd > Köksmaskiner & Apparater`).
//    Samma namn finns under flera avdelningar, och en sökväg som finns två gånger i
//    trädet är tvetydig och avbryter.
// 4. ☠️ Skarpt läge kräver `bekrafta` = antalet länkar som tas bort enligt körningens
//    egen läsning. En spärr man måste komma ihåg glöms bort: antalet kommer ur
//    torrkörningen, inte ur minnet, och stämmer det inte skrivs ingenting.
// 5. ☠️ Läget `verifiera` läser tillbaka och fäller varje rad där en borttagen länk
//    finns kvar eller en `behall` saknas. Ett svar utan fel är inget kvitto.
//
// Rutten rör bara kategorilänkar. Ingen produkt-PATCH, så variantens `visible`,
// alt-texter, SKU och pris kan inte tappas.
//
// ☠️ SVARET GÅR TILL EN PUBLIK LOGG. Det bär kort-id, kategorinamn, utfall och antal.

import { type KategoriNod, lasKategoritradet, taBortFranKategori } from "@/lib/wix/kategoritrad";
import {
  artikelnummerformer,
  felText,
  HEX8,
  type Obj,
  produktAv,
  RUNDA,
  type StegRad,
  type StegUtfall,
  strang,
  summera,
  UUID,
  type WixAnrop,
} from "./skrivplan";

export const MAX_RADER = 30;
export const BORT_LAGEN = ["torr", "skriv", "verifiera"] as const;
export type BortLage = (typeof BORT_LAGEN)[number];

export interface BortRad {
  /** De åtta första tecknen i produktens id. */
  kort: string;
  pid: string;
  /** Sökvägar till kategorierna som ska bort. */
  bort: string[];
  /** Sökvägar till kategorierna varan ska ligga kvar i. Minst en synlig. */
  behall: string[];
}

export interface BortPlan {
  namn: string;
  rader: BortRad[];
}

export interface BortUtfall extends StegUtfall {
  /** Länkar som finns nu och tas bort (skriv) eller skulle tas bort (torr). */
  attTaBort: number;
}

const SOKVAG_MAX = 120;
const SEPARATOR = " > ";

// ── validering ──────────────────────────────────────────────────────────────

export function valideraBortPlan(x: unknown): { plan: BortPlan } | { fel: string[] } {
  const fel: string[] = [];
  if (typeof x !== "object" || x === null || Array.isArray(x)) return { fel: ["planen måste vara ett objekt"] };
  const p = x as Record<string, unknown>;
  if (!strang(p.namn, 60) || !RUNDA.test(p.namn)) fel.push("namn saknas eller har fel form");
  if (!Array.isArray(p.rader) || p.rader.length === 0) return { fel: [...fel, "rader saknas"] };
  if (p.rader.length > MAX_RADER) return { fel: [...fel, `högst ${MAX_RADER} rader per plan`] };

  const sedda = { kort: new Set<string>(), pid: new Set<string>() };
  p.rader.forEach((r: unknown, i: number) => {
    const d = (typeof r === "object" && r !== null ? r : {}) as Record<string, unknown>;
    const var_ = typeof d.kort === "string" && HEX8.test(d.kort) ? d.kort : `rad ${i + 1}`;
    const f = (t: string) => fel.push(`${var_}: ${t}`);

    if (!strang(d.kort, 8) || !HEX8.test(d.kort)) f("kort ska vara 8 hextecken");
    if (!strang(d.pid, 36) || !UUID.test(d.pid)) f("pid ska vara ett uuid");
    else if (typeof d.kort === "string" && !d.pid.startsWith(d.kort)) f("pid börjar inte med kort");

    const lista = (nyckel: "bort" | "behall", max: number) => {
      const v = d[nyckel];
      if (!Array.isArray(v) || v.length === 0 || v.length > max) {
        f(`${nyckel} ska vara 1–${max} kategorisökvägar`);
        return;
      }
      const lokala = new Set<string>();
      v.forEach((s: unknown, j: number) => {
        if (!strang(s, SOKVAG_MAX)) {
          f(`${nyckel} ${j + 1}: sökvägen saknas eller är för lång`);
          return;
        }
        if (s !== s.trim() || s.includes(`${SEPARATOR}${SEPARATOR}`)) f(`${nyckel} ${j + 1}: sökvägen har onödiga blanksteg`);
        if (artikelnummerformer(s) > 0) f(`${nyckel} ${j + 1} har artikelnummerform`);
        if (lokala.has(s)) f(`${nyckel} ${j + 1}: samma sökväg två gånger`);
        lokala.add(s);
      });
    };
    lista("bort", 6);
    lista("behall", 8);

    if (Array.isArray(d.bort) && Array.isArray(d.behall)) {
      const kvar = new Set(d.behall as unknown[]);
      for (const s of d.bort as unknown[]) if (kvar.has(s)) f("en sökväg står både i bort och behall");
    }

    for (const nyckel of ["kort", "pid"] as const) {
      const v = d[nyckel];
      if (typeof v !== "string") continue;
      if (sedda[nyckel].has(v)) f(`${nyckel} förekommer två gånger i planen`);
      sedda[nyckel].add(v);
    }
  });

  return fel.length ? { fel } : { plan: x as BortPlan };
}

// ── trädet ──────────────────────────────────────────────────────────────────

export interface Sokvagsnod {
  id: string;
  synlig: boolean;
}

/**
 * Sökväg → kategori, ur hela trädet med de dolda kategorierna. En sökväg som
 * finns två gånger blir `null` (tvetydig), och en kategori vars förälder saknas
 * i trädet får ingen sökväg alls, eftersom den inte går att avgöra.
 */
export function sokvagar(trad: readonly KategoriNod[]): Map<string, Sokvagsnod | null> {
  const perId = new Map(trad.map((k) => [k.id, k] as const));
  const ut = new Map<string, Sokvagsnod | null>();
  for (const k of trad) {
    const delar: string[] = [];
    let n: KategoriNod | undefined = k;
    let hel = true;
    for (let djup = 0; n; djup++) {
      if (djup >= 8) {
        hel = false;
        break;
      }
      delar.unshift(n.namn);
      if (!n.foralder) break;
      n = perId.get(n.foralder);
      if (!n) hel = false;
    }
    if (!hel) continue;
    const s = delar.join(SEPARATOR);
    ut.set(s, ut.has(s) ? null : { id: k.id, synlig: k.synlig });
  }
  return ut;
}

// ── läsningen ───────────────────────────────────────────────────────────────

/** Produktens DIREKTA kategorilänkar (id:n). Bara dem tar steget bort. */
async function lasLankar(wix: WixAnrop, pid: string): Promise<Set<string>> {
  const p = produktAv(await wix("GET", `/stores/v3/products/${pid}?fields=DIRECT_CATEGORIES_INFO`));
  const kat = (((p.directCategoriesInfo as Obj | undefined)?.categories ?? []) as Obj[]);
  return new Set(kat.map((c) => c.id).filter((i): i is string => typeof i === "string"));
}

function stopp(avbrutet: string, rader: StegRad[] = []): BortUtfall {
  return { ok: false, rader, avbrutet, sammanfattning: "0 skrivna", attTaBort: 0 };
}

// ── körningen ───────────────────────────────────────────────────────────────

export async function korBort(
  plan: BortPlan,
  wix: WixAnrop,
  lage: BortLage,
  bekrafta: number | null,
): Promise<BortUtfall> {
  const kat = sokvagar(await lasKategoritradet(wix));
  const behovda = [...new Set(plan.rader.flatMap((r) => [...r.bort, ...r.behall]))];
  const okanda = behovda.filter((s) => !kat.get(s));
  if (okanda.length) return stopp(`okänd eller tvetydig kategori: ${okanda.join("; ")} — ingenting skrivet`);
  const id = (s: string): string => kat.get(s)!.id;

  // Varje produkts länkar nu. Faller en läsning skrivs ingenting.
  const nu = new Map<string, Set<string>>();
  const lasfel: StegRad[] = [];
  for (const r of plan.rader) {
    try {
      nu.set(r.pid, await lasLankar(wix, r.pid));
    } catch (e) {
      lasfel.push({ kort: r.kort, ok: false, fel: `går inte att läsa: ${felText(e)}` });
    }
  }
  if (lasfel.length) return stopp("en produkt gick inte att läsa — ingenting skrivet", lasfel);

  if (lage === "verifiera") {
    const rader: StegRad[] = plan.rader.map((r) => {
      const har = nu.get(r.pid)!;
      const kvar = r.bort.filter((s) => har.has(id(s)));
      const saknas = r.behall.filter((s) => !har.has(id(s)));
      const fel = [
        ...(kvar.length ? [`länken finns kvar: ${kvar.join("; ")}`] : []),
        ...(saknas.length ? [`ska ligga kvar men saknas: ${saknas.join("; ")}`] : []),
      ];
      return fel.length
        ? { kort: r.kort, ok: false, fel: fel.join(" · "), lankar: har.size }
        : { kort: r.kort, ok: true, lankar: har.size };
    });
    return { ...summera(rader, "rader verifierade"), attTaBort: 0 };
  }

  // Villkoren, för alla rader, före första skrivningen.
  const att = new Map<string, string[]>();
  const villkor: StegRad[] = [];
  let attTaBort = 0;
  for (const r of plan.rader) {
    const har = nu.get(r.pid)!;
    const saknas = r.behall.filter((s) => !har.has(id(s)));
    if (saknas.length) {
      villkor.push({ kort: r.kort, ok: false, fel: `ska ligga kvar men är inte kopplad till: ${saknas.join("; ")}` });
    } else if (!r.behall.some((s) => kat.get(s)!.synlig)) {
      villkor.push({ kort: r.kort, ok: false, fel: "ingen av kategorierna som ska ligga kvar är synlig" });
    }
    const finns = r.bort.filter((s) => har.has(id(s)));
    att.set(r.pid, finns);
    attTaBort += finns.length;
  }
  if (villkor.length) return stopp("ett villkor föll — ingenting skrivet", villkor);

  if (lage === "torr") {
    const rader: StegRad[] = plan.rader.flatMap((r) =>
      r.bort.map((s) => ({
        kort: r.kort,
        kat: s,
        ok: true,
        torr: true,
        lankar: nu.get(r.pid)!.size,
        ...(att.get(r.pid)!.includes(s) ? {} : { redan: true }),
      })),
    );
    const totalt = plan.rader.reduce((n, r) => n + r.bort.length, 0);
    return { ok: true, rader, attTaBort, sammanfattning: `${attTaBort} länkar att ta bort, ${totalt - attTaBort} redan borta (torrt)` };
  }

  // Skarpt läge: antalet ska stämma med läsningen nu.
  if (bekrafta !== attTaBort) {
    return stopp(
      `bekrafta ska vara ${attTaBort} (länkar att ta bort enligt läsningen nu), inte ${bekrafta ?? "utelämnad"} — ingenting skrivet`,
    );
  }

  const perKat = new Map<string, string[]>();
  for (const r of plan.rader) for (const s of att.get(r.pid)!) perKat.set(s, [...(perKat.get(s) ?? []), r.pid]);

  const utfall = new Map<string, "ok" | { fel: string }>();
  for (const [s, pids] of perKat) {
    for (const [pid, u] of await taBortFranKategori(wix, id(s), pids)) utfall.set(`${pid}|${s}`, u);
  }

  let borta = 0;
  let redan = 0;
  const rader: StegRad[] = plan.rader.flatMap((r) =>
    r.bort.map((s): StegRad => {
      if (!att.get(r.pid)!.includes(s)) {
        redan++;
        return { kort: r.kort, kat: s, ok: true, redan: true };
      }
      const u = utfall.get(`${r.pid}|${s}`);
      if (u === "ok") {
        borta++;
        return { kort: r.kort, kat: s, ok: true };
      }
      return { kort: r.kort, kat: s, ok: false, fel: (u && u.fel) || "inget utfall för raden" };
    }),
  );
  const fel = rader.filter((r) => !r.ok).length;
  return {
    ok: fel === 0,
    rader,
    attTaBort,
    sammanfattning: `${borta} länkar borttagna, ${redan} redan borta, ${fel} fel`,
  };
}
