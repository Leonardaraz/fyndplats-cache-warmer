// lib/medlem/medlemspris.ts
//
// Medlemspriset på servern (E2): vem som får det, vad varje variant kostar för
// medlemmen på produktsidan, och den låsta varukorgen till kassan.
//
// Allt räknas här och i prismotorn (pris.ts); webbläsaren får bara radpriset,
// procenten och skälet till en begränsning. Golvet och kostnaden lämnar aldrig
// servern.
//
// Det felar åt det säkra hållet. Går något inte att läsa (växeln, medlemmen,
// orderliggaren, motorns golv) får kunden listpriset och den vanliga kassan,
// aldrig ett medlemspris som inte går att förklara.

import { randomBytes } from "node:crypto";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { redirects } from "@wix/redirects";
import { wixFetch, WixApiError } from "@/lib/wix-client";
import { inloggad } from "./inloggad";
import { lageFor } from "./konto";
import {
  aktuellaRegler,
  hamtaForetagsprofil,
  hamtaMedlem,
  hamtaOffert,
  loggaTyst,
  obesvaradeOfferter,
  offertIKassan,
  skapaOffert,
  liggarraderForEpost,
  orderMedKopflode,
  prisbeslutUtanUtfall,
  prisLage,
  sattForskottsorder,
  sattKorgutfall,
  slappForskottsbeslut,
  sparaPrisbeslut,
  taForskottsbeslut,
  type Medlem,
  type Prisbeslutspost,
} from "./lager";
import { stadaLastaKorgar, type Stadutfall } from "./korgstadning";
import { hamtaGolv } from "./golv-klient";
import { ettPris, jamforelseForMedlem } from "./jamforelse";
import { jamforprisFor } from "@/lib/price-snapshot";
import {
  ORDERTRAPPA,
  exklMoms,
  hogstaProcent,
  prissatt,
  radpris,
  type Begransning,
  type NastaSteg,
  type Prisbeslut,
  type Profil,
} from "./pris";
import { kanHandlaSomForetag } from "./foretag";
import { MAX_OBESVARADE, kanBetalas, offertId, offertSummor, type Offert } from "./offert";
import { skickaOffertForfragan } from "./mejl";
import type { ForetagPaBeslut, Golvsvar, Varukorgsrad } from "./varukorg";
import {
  STORES_APP_ID,
  foretagPaBeslut,
  forskottskund,
  forskottsorderKropp,
  golvnyckel,
  kassaAdress,
  kontrolleraForskottsorder,
  korgenBarPriserna,
  korgenBarRaderna,
  laastVarukorgKropp,
  lastKorgKropp,
  lasWixVarukorg,
  prisrader,
  variantpriserUrV3,
  type Lastrad,
} from "./varukorg";
import { fraktKr } from "@/lib/shipping";

/** Butikens publika headless-klient, samma som varukorgen (components/cart.tsx). */
const HEADLESS_CLIENT_ID = "3d8fdd09-3b3c-475f-aac2-b6bfa9e05153";

export type Utan = "av" | "utloggad" | "sparrad" | "inte-testare" | "fel";
/** `foretag`: kontot handlar som sitt godkända företag (E3); priset räknas då
 *  med företagsprofilen och visas exkl. moms. */
export type Medlemsprofil = {
  medlem: Medlem;
  profil: Profil;
  /** `kvitto`: det som sparas på prisbeslutet till motorns kvitto (villkoren
   *  5.2). Bara servern läser det; webbläsaren får namnet. */
  foretag?: { namn: string; kvitto: ForetagPaBeslut };
};

/** Momsen på hela sortimentet i dag (samma som prisrader() i varukorg.ts). */
export const MOMS_PROCENT = 25;

/** Medlemmens nivå räknas om högst var femte minut per instans. */
const PROFIL_CACHE_MS = 5 * 60_000;
const profiler = new Map<string, { v: Medlemsprofil; at: number }>();

/** Den inloggade medlemmens profil, eller varför medlemspris inte gäller. */
export async function medlemsprofil(): Promise<Medlemsprofil | { utan: Utan }> {
  const lage = await prisLage();
  if (lage === "av") return { utan: "av" };
  const session = await inloggad();
  if (!session) return { utan: "utloggad" };
  // E3-11: profilvalet ingår i nyckeln, så att ett byte räknar om direkt.
  const villForetag = session.profil === "foretag";
  const nyckel = `${session.sub}|${villForetag ? "f" : "p"}`;
  const c = profiler.get(nyckel);
  if (c && Date.now() - c.at < PROFIL_CACHE_MS) {
    if (lage === "test" && !c.v.medlem.testare) return { utan: "inte-testare" };
    return c.v;
  }
  try {
    const medlem = await hamtaMedlem(session.sub);
    if (!medlem || medlem.status !== "aktiv") return { utan: "sparrad" };
    if (lage === "test" && !medlem.testare) return { utan: "inte-testare" };
    const [regler, rader, fp] = await Promise.all([
      aktuellaRegler(),
      liggarraderForEpost(medlem.epost),
      villForetag ? hamtaForetagsprofil(medlem.id) : Promise.resolve(null),
    ]);
    const l = lageFor(medlem, rader, regler);
    const niva = { niva: l.niva.namn, nivaProcent: l.niva.rabattProcent };
    // Ett företag som inte längre är godkänt, eller vars villkor är gamla
    // (E3-12), prissätts som privatperson tills det är rättat.
    const v: Medlemsprofil =
      villForetag && kanHandlaSomForetag(fp)
        ? { medlem, profil: { typ: "foretag", ...niva }, foretag: { namn: fp.namn, kvitto: foretagPaBeslut(fp) } }
        : { medlem, profil: { typ: "privat", ...niva } };
    profiler.set(nyckel, { v, at: Date.now() });
    return v;
  } catch (e) {
    console.error("[medlemspris] profilen gick inte att läsa:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return { utan: "fel" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Produktsidan
// ─────────────────────────────────────────────────────────────────────────────

export interface Variantmedlemspris {
  variantId: string;
  aOre: number;
  pOre: number;
  procent: number;
  begransning: Begransning;
  /** Golvet begränsar: den högsta procent varan kan få. För företag också när
   *  golvet stoppar ordertrappan under 5 % (E3-8). */
  hogstaProcent?: number;
  /** Varför varianten inte får medlemspris, när det är något kunden ska få veta. */
  orsak?: "rea";
  /** Det belagda tidigare priset (lägsta de senaste 30 dagarna), lib/medlem/jamforelse.ts. */
  tidigareOre?: number;
  /** Får nivåns procent stå i rutan? Bara när det tidigare priset är listpriset. */
  visaProcent?: boolean;
  /** Företag: samma belopp exkl. moms (E3-4). */
  aOreExMoms?: number;
  pOreExMoms?: number;
}

/** Jämförpriset för ett medlemspris, sparat en kort stund per produkt och pris. */
const JAMFOR_CACHE_MS = 10 * 60_000;
const jamforCache = new Map<string, { ore: number | null; at: number }>();

async function tidigarePris(produktId: string, pOre: number): Promise<number | null> {
  const nyckel = `${produktId}|${pOre}`;
  const c = jamforCache.get(nyckel);
  if (c && Date.now() - c.at < JAMFOR_CACHE_MS) return c.ore;
  // jamforprisFor sväljer sina egna fel och ger då null: ingen jämförelse
  // hellre än en som inte går att belägga.
  const jf = await jamforprisFor(produktId, pOre / 100);
  const ore = jf ? jf.prisMinor : null;
  jamforCache.set(nyckel, { ore, at: Date.now() });
  return ore;
}

/** Medlemspriset för varje variant av en produkt, räknat på Wix färska pris. */
export async function medlemsprisForProdukt(
  produktId: string,
  profil: Profil,
): Promise<Variantmedlemspris[] | null> {
  let produkt: unknown;
  try {
    produkt = (await wixFetch<{ product?: unknown }>({ path: `/stores/v3/products/${encodeURIComponent(produktId)}` }))?.product;
  } catch (e) {
    console.warn(`[medlemspris] produkten gick inte att läsa (${e instanceof WixApiError ? e.status : "nät"})`);
    return null;
  }
  const varianter = variantpriserUrV3(produkt);
  if (varianter.length === 0) return null;
  const golv = await hamtaGolv(varianter.map((v) => ({ produktId, variantId: v.variantId })));
  const foretag = profil.typ === "foretag";
  const trappansTak = ORDERTRAPPA[ORDERTRAPPA.length - 1].procent;
  const exMoms = (aOre: number, pOre: number) =>
    foretag ? { aOreExMoms: exklMoms(aOre, MOMS_PROCENT), pOreExMoms: exklMoms(pOre, MOMS_PROCENT) } : {};
  const rader: Variantmedlemspris[] = varianter.map((v) => {
    // 2.1: en reavara får reapriset, aldrig ett medlemspris ovanpå.
    if (v.rea) {
      return {
        variantId: v.variantId,
        aOre: v.aOre,
        pOre: v.aOre,
        procent: 0,
        begransning: "ej-berattigad",
        orsak: "rea",
        ...exMoms(v.aOre, v.aOre),
      };
    }
    const g = golv.get(golvnyckel(produktId, v.variantId));
    const golvOre = g?.golvOre ?? null;
    const { pOre, begransning } = radpris(v.aOre, golvOre, profil.nivaProcent);
    let hogsta = begransning === "golv" && golvOre !== null ? hogstaProcent(v.aOre, golvOre) : undefined;
    if (foretag && hogsta === undefined && golvOre !== null) {
      const tak = hogstaProcent(v.aOre, golvOre);
      if (tak < trappansTak) hogsta = tak;
    }
    return {
      variantId: v.variantId,
      aOre: v.aOre,
      pOre,
      procent: golvOre === null ? 0 : profil.nivaProcent,
      begransning,
      ...(hogsta !== undefined ? { hogstaProcent: hogsta } : {}),
      ...exMoms(v.aOre, pOre),
    };
  });
  // Jämförelsen med det tidigare priset, som kedjorna visar (jamforelse.ts).
  // Bara när varianterna har ett och samma pris: prishistoriken är produktens.
  // Inte för företag: deras pris visas exkl. moms, prishistoriken är inkl.
  // moms, och prisinformationslagen gäller köp av konsumenter.
  if (foretag || !ettPris(rader.map((r) => r.aOre))) return rader;
  for (const r of rader) {
    if (r.orsak || r.pOre >= r.aOre) continue;
    const j = jamforelseForMedlem(r.aOre, r.pOre, await tidigarePris(produktId, r.pOre));
    if (j.tidigareOre !== undefined) r.tidigareOre = j.tidigareOre;
    r.visaProcent = j.visaProcent;
  }
  return rader;
}

// ─────────────────────────────────────────────────────────────────────────────
// Kassan
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Besökarens varukorg prissatt för medlemmen, utan att något låses. Kassan
 * och förhandsvisningen i varukorgen räknar med samma funktion, så att de
 * aldrig visar olika priser.
 */
async function prissattKorg(
  besokarensKorg: string,
  mp: Medlemsprofil,
): Promise<{ rader: Varukorgsrad[]; golv: Map<string, Golvsvar>; beslut: Prisbeslut } | { skal: "tom" | "oläslig" }> {
  let korg: unknown;
  try {
    korg = (await wixFetch<{ cart?: unknown }>({ path: `/ecom/v2/carts/${encodeURIComponent(besokarensKorg)}` }))?.cart;
  } catch (e) {
    console.warn(`[medlemskassa] besökarens korg gick inte att läsa (${e instanceof WixApiError ? e.status : "nät"})`);
    return { skal: "oläslig" };
  }
  const rader = lasWixVarukorg(korg);
  if (!rader) return { skal: "tom" };
  const golv = await hamtaGolv(rader.map((r) => ({ produktId: r.produktId, variantId: r.variantId })));
  return { rader, golv, beslut: prissatt(prisrader(rader, golv), mp.profil) };
}

/** Förhandsvisningen i varukorgen: summorna med medlemspris, inget låses. */
export interface Korgpris {
  niva: string;
  procent: number;
  summaAOre: number;
  summaPOre: number;
  rabattOre: number;
  friFraktSkydd: boolean;
  /** E3: företagets vy, när kontot handlar som företaget. */
  foretag?: Foretagskorg;
}

export interface Foretagskorg {
  namn: string;
  /** Var procenten kommer ifrån: nivån eller ordertrappan (aldrig båda). */
  kalla: Prisbeslut["kalla"];
  trappaProcent: number;
  basOreExMoms: number;
  summaPOreExMoms: number;
  nastaSteg: NastaSteg | null;
  /** "Begär offert" visas (F7). */
  offert: boolean;
  /** Varje rad med sitt styckpris, inkl. och exkl. moms, på radens id i Wix. */
  rader: { id: string; pOre: number; pOreExMoms: number; procent: number; begransning: Begransning }[];
}

export async function medlemsprisForKorg(besokarensKorg: string, mp: Medlemsprofil): Promise<Korgpris | null> {
  const r = await prissattKorg(besokarensKorg, mp);
  if ("skal" in r) return null;
  const b = r.beslut;
  const pris: Korgpris = { niva: b.niva, procent: b.procent, summaAOre: b.summaAOre, summaPOre: b.summaPOre, rabattOre: b.rabattOre, friFraktSkydd: b.friFraktSkydd };
  if (b.profil === "foretag" && mp.foretag) {
    pris.foretag = {
      namn: mp.foretag.namn,
      kalla: b.kalla,
      trappaProcent: b.trappaProcent ?? 0,
      basOreExMoms: b.basOreExMoms,
      summaPOreExMoms: exklMoms(b.summaPOre, MOMS_PROCENT),
      nastaSteg: b.nastaSteg,
      offert: b.offert,
      rader: b.rader.map((x) => ({ id: x.id, pOre: x.pOre, pOreExMoms: exklMoms(x.pOre, MOMS_PROCENT), procent: x.procent, begransning: x.begransning })),
    };
  }
  return pris;
}

/** Wix-kassans adress för en låst korg, via butikens publika headless-klient (E0). */
async function kassansAdress(cartId: string, bas: string): Promise<string | null> {
  try {
    const klient = createClient({ modules: { redirects }, auth: OAuthStrategy({ clientId: HEADLESS_CLIENT_ID }) });
    const s = await klient.redirects.createRedirectSession({
      ecomCheckout: { checkoutId: cartId },
      callbacks: { thankYouPageUrl: `${bas}/tack`, postFlowUrl: bas, cartPageUrl: `${bas}/butik` },
    });
    return kassaAdress(s?.redirectSession?.fullUrl, HEADLESS_CLIENT_ID);
  } catch {
    console.error("[medlemskassa] redirect-sessionen föll");
    return null;
  }
}

/**
 * Vart kassan går. `egen`: vår kassa med Stripe gäller för besökaren
 * (lib/kassa/lage.ts och harStripe()); den låsta korgen betalas då på /kassa,
 * utpekad av kakan fp_kassa_korg (lib/kassa/lastkorg.ts). Annars Wix kassa som
 * förut.
 */
export interface Kassaval {
  egen?: boolean;
}

export type Kassasvar =
  | {
      ok: true;
      adress: string;
      beslut: Pick<Prisbeslut, "procent" | "niva" | "summaPOre" | "rabattOre" | "friFraktSkydd">;
      /** Den låsta korgen, när kassan är vår: rutten sätter kakan. */
      korg?: string;
    }
  | { ok: false; skal: "tom" | "oläslig" | "ingen-rabatt" | "wix" | "kontroll" | "session" | "logg" };

/**
 * Bygger den låsta varukorgen ur besökarens varukorg och skapar kassans
 * adress. `ingen-rabatt`: korgen ger inget medlemspris, och den vanliga
 * kassan används (gäller också rader som bara har listpris).
 */
export async function medlemskassa(
  besokarensKorg: string,
  mp: Medlemsprofil,
  bas: string,
  val: Kassaval = {},
): Promise<Kassasvar> {
  const korgen = await prissattKorg(besokarensKorg, mp);
  if ("skal" in korgen) return { ok: false, skal: korgen.skal };
  const { rader, golv, beslut } = korgen;
  if (beslut.rabattOre === 0) return { ok: false, skal: "ingen-rabatt" };

  let skapad: { id?: unknown; purchaseFlowId?: unknown; lineItems?: unknown } | undefined;
  try {
    skapad = (await wixFetch<{ cart?: { id?: unknown; purchaseFlowId?: unknown; lineItems?: unknown } }>({
      method: "POST",
      path: "/ecom/v2/carts",
      body: laastVarukorgKropp(beslut, rader, mp.medlem.epost),
    }))?.cart;
  } catch (e) {
    console.error(`[medlemskassa] Wix skapade ingen korg (${e instanceof WixApiError ? e.status : "nät"})`);
    return { ok: false, skal: "wix" };
  }
  const cartId = typeof skapad?.id === "string" ? skapad.id : "";
  if (!cartId || !korgenBarPriserna(beslut, rader, skapad)) {
    // En korg som inte bär våra priser får aldrig gå till kassan.
    if (cartId) await wixFetch({ method: "DELETE", path: `/ecom/v2/carts/${cartId}` }).catch(() => {});
    console.error("[medlemskassa] korgen bar inte medlemspriserna; vanlig kassa");
    return { ok: false, skal: "kontroll" };
  }

  const adress = val.egen ? "/kassa" : await kassansAdress(cartId, bas);
  if (!adress) {
    await wixFetch({ method: "DELETE", path: `/ecom/v2/carts/${cartId}` }).catch(() => {});
    return { ok: false, skal: "session" };
  }

  // Loggen före svaret: ett köp utan beslut går inte att förklara (E2-9).
  // Går den inte att spara tas korgen bort, och kunden får den vanliga kassan.
  const sparat = await sparaPrisbeslut(
    beslutspost(cartId, typeof skapad?.purchaseFlowId === "string" ? skapad.purchaseFlowId : "", mp, beslut, golv, besokarensKorg),
  ).then(
    () => true,
    () => false,
  );
  if (!sparat) {
    console.error("[medlemskassa] prisbeslutet gick inte att spara; vanlig kassa");
    await wixFetch({ method: "DELETE", path: `/ecom/v2/carts/${cartId}` }).catch(() => {});
    return { ok: false, skal: "logg" };
  }

  return {
    ok: true,
    adress,
    beslut: { procent: beslut.procent, niva: beslut.niva, summaPOre: beslut.summaPOre, rabattOre: beslut.rabattOre, friFraktSkydd: beslut.friFraktSkydd },
    ...(val.egen ? { korg: cartId } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Offerten (E3-9, E3-10)
// ─────────────────────────────────────────────────────────────────────────────

export type Forfragningssvar =
  | { ok: true; id: string }
  | { ok: false; skal: "inte-foretag" | "for-manga" | "tom" | "oläslig" | "under-gransen" };

/**
 * En offertförfrågan ur besökarens varukorg. Bara ett godkänt företag, bara
 * när prismotorn säger att korgen når gränsen (F7), och bara rader från Wix
 * Stores. Listpriset per rad sparas; admin sätter styckpriserna i motorn.
 */
export async function offertForfragan(besokarensKorg: string, mp: Medlemsprofil, meddelande: string): Promise<Forfragningssvar> {
  if (mp.profil.typ !== "foretag" || !mp.foretag) return { ok: false, skal: "inte-foretag" };
  if ((await obesvaradeOfferter(mp.medlem.id)) >= MAX_OBESVARADE) return { ok: false, skal: "for-manga" };
  const korgen = await prissattKorg(besokarensKorg, mp);
  if ("skal" in korgen) return { ok: false, skal: korgen.skal };
  if (!korgen.beslut.offert) return { ok: false, skal: "under-gransen" };
  const rader = korgen.rader
    .filter((r) => r.appId === STORES_APP_ID)
    .map((r) => ({ produktId: r.produktId, ...(r.variantId ? { variantId: r.variantId } : {}), appId: r.appId, namn: r.namn || "Vara", antal: r.antal, aOre: r.aOre }));
  if (rader.length === 0) return { ok: false, skal: "tom" };
  const o: Offert = {
    id: offertId(randomBytes(8).toString("hex")),
    medlemsId: mp.medlem.id,
    foretagNamn: mp.foretag.namn,
    status: "skickad",
    rader,
    ...(meddelande ? { meddelande } : {}),
    skapad: new Date().toISOString(),
  };
  await skapaOffert(o);
  await loggaTyst({ omrade: "offert", typ: "forfragan", medlemsId: mp.medlem.id, aktor: "kund", efter: { offertId: o.id, rader: rader.length } });
  await skickaOffertForfragan({
    foretagNamn: o.foretagNamn,
    antalRader: rader.length,
    antalVaror: rader.reduce((n, r) => n + r.antal, 0),
    listaOre: offertSummor(o).listaOre,
    ...(meddelande ? { meddelande } : {}),
  });
  return { ok: true, id: o.id };
}

export type Offertkassasvar =
  | { ok: true; adress: string; korg?: string }
  | { ok: false; skal: "saknas" | "inte-giltig" | "inte-foretag" | "wix" | "kontroll" | "session" | "logg" };

/**
 * Kassan för en prissatt offert: en låst Cart V2 med offertens styckpriser,
 * samma regler som medlemskorgen. Bara kontots eget godkända företag, och bara
 * inom giltighetstiden (E3-10, E3-12). Prisbeslutet sparas med kalla "offert"
 * och offertens id innan kunden får adressen.
 */
export async function offertKassa(id: string, mp: Medlemsprofil, bas: string, val: Kassaval = {}): Promise<Offertkassasvar> {
  const o = await hamtaOffert(id);
  if (!o || o.medlemsId !== mp.medlem.id) return { ok: false, skal: "saknas" };
  if (!kanBetalas(o, Date.now())) return { ok: false, skal: "inte-giltig" };
  if (mp.profil.typ !== "foretag" || !mp.foretag) return { ok: false, skal: "inte-foretag" };
  const rader: Lastrad[] = o.rader.map((r) => ({
    produktId: r.produktId,
    variantId: r.variantId ?? null,
    appId: r.appId,
    antal: r.antal,
    pOre: r.offertOre as number,
  }));

  let skapad: { id?: unknown; purchaseFlowId?: unknown; lineItems?: unknown } | undefined;
  try {
    skapad = (await wixFetch<{ cart?: { id?: unknown; purchaseFlowId?: unknown; lineItems?: unknown } }>({
      method: "POST",
      path: "/ecom/v2/carts",
      body: lastKorgKropp(rader, mp.medlem.epost),
    }))?.cart;
  } catch (e) {
    console.error(`[offertkassa] Wix skapade ingen korg (${e instanceof WixApiError ? e.status : "nät"})`);
    return { ok: false, skal: "wix" };
  }
  const cartId = typeof skapad?.id === "string" ? skapad.id : "";
  if (!cartId || !korgenBarRaderna(rader, skapad)) {
    if (cartId) await wixFetch({ method: "DELETE", path: `/ecom/v2/carts/${cartId}` }).catch(() => {});
    console.error("[offertkassa] korgen bar inte offertens priser");
    return { ok: false, skal: "kontroll" };
  }
  const adress = val.egen ? "/kassa" : await kassansAdress(cartId, bas);
  if (!adress) {
    await wixFetch({ method: "DELETE", path: `/ecom/v2/carts/${cartId}` }).catch(() => {});
    return { ok: false, skal: "session" };
  }

  const purchaseFlowId = typeof skapad?.purchaseFlowId === "string" ? skapad.purchaseFlowId : "";
  const summor = offertSummor(o);
  const summaPOre = summor.offertOre ?? 0;
  const sparat = await sparaPrisbeslut({
    cartId,
    purchaseFlowId,
    medlemsId: mp.medlem.id,
    profil: "foretag",
    ...mp.foretag.kvitto,
    offertId: o.id,
    niva: mp.profil.niva,
    procent: 0,
    kalla: "offert",
    basOreExMoms: exklMoms(summor.listaOre, MOMS_PROCENT),
    summaAOre: summor.listaOre,
    summaPOre,
    rabattOre: summor.listaOre - summaPOre,
    friFraktSkydd: false,
    rader: o.rader.map((r) => ({
      produktId: r.produktId,
      variantId: r.variantId,
      antal: r.antal,
      aOre: r.aOre,
      procent: 0,
      pOre: r.offertOre as number,
      begransning: "offert",
    })),
    skapad: new Date().toISOString(),
  }).then(
    () => true,
    () => false,
  );
  if (!sparat) {
    await wixFetch({ method: "DELETE", path: `/ecom/v2/carts/${cartId}` }).catch(() => {});
    return { ok: false, skal: "logg" };
  }
  await offertIKassan(o.id, cartId, purchaseFlowId).catch(() => {
    console.error("[offertkassa] offerten gick inte att märka som öppnad");
  });
  return { ok: true, adress, ...(val.egen ? { korg: cartId } : {}) };
}

/** Prisbeslutet som det sparas (E2-9), för medlemskassan och förskottsordern. */
function beslutspost(
  cartId: string,
  purchaseFlowId: string,
  mp: Medlemsprofil,
  beslut: Prisbeslut,
  golv: Map<string, Golvsvar>,
  besokarensKorg?: string,
): Prisbeslutspost {
  const kostnad = (produktId: string, variantId: string | undefined) =>
    golv.get(golvnyckel(produktId, variantId ?? null))?.kostnadOre ?? undefined;
  return {
    cartId,
    purchaseFlowId,
    medlemsId: mp.medlem.id,
    ...(besokarensKorg ? { besokarensKorg } : {}),
    profil: beslut.profil,
    ...(mp.foretag && beslut.profil === "foretag" ? mp.foretag.kvitto : {}),
    niva: beslut.niva,
    procent: beslut.procent,
    kalla: beslut.kalla,
    basOreExMoms: beslut.basOreExMoms,
    summaAOre: beslut.summaAOre,
    summaPOre: beslut.summaPOre,
    rabattOre: beslut.rabattOre,
    friFraktSkydd: beslut.friFraktSkydd,
    rader: beslut.rader.map((r) => ({
      produktId: r.produktId,
      variantId: r.variantId,
      antal: r.antal,
      aOre: r.aOre,
      kostnadOre: kostnad(r.produktId, r.variantId),
      golvOre: r.golvOre ?? undefined,
      procent: r.procent,
      pOre: r.pOre,
      begransning: r.begransning,
      undantag: r.undantag,
    })),
    skapad: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Förskottsfakturan (E3, villkoren 5.1, Leonards svar 3.3)
// ─────────────────────────────────────────────────────────────────────────────

export type Forskottssvar =
  | { ok: true; nummer: string; totalOre: number }
  | {
      ok: false;
      skal: "inte-foretag" | "tom" | "oläslig" | "ej-forskott" | "pagar" | "upptaget" | "wix" | "kontroll" | "logg";
    };

/**
 * Ett godkänt företag köper varukorgen mot förskottsfaktura. Butiken skapar
 * ordern obetald och handlagd med företagets priser (varukorg.ts,
 * "Förskottsordern"); motorn skickar fakturan och håller inne
 * leverantörsuppgifterna tills ordern är betald. Besökarens varukorg tas bort
 * när ordern finns.
 */
export async function forskottsorder(besokarensKorg: string, mp: Medlemsprofil): Promise<Forskottssvar> {
  if (mp.profil.typ !== "foretag" || !mp.foretag) return { ok: false, skal: "inte-foretag" };
  // Profilen läses färsk: adressen och numret ska vara de som gäller nu, och
  // samma prövning som prissättningen gäller (E3-12).
  const fp = await hamtaForetagsprofil(mp.medlem.id).catch(() => null);
  if (!fp || !kanHandlaSomForetag(fp)) return { ok: false, skal: "inte-foretag" };

  const korgen = await prissattKorg(besokarensKorg, mp);
  if ("skal" in korgen) return { ok: false, skal: korgen.skal };
  const { rader, golv, beslut } = korgen;
  if (beslut.profil !== "foretag") return { ok: false, skal: "inte-foretag" };
  if (rader.some((r) => r.appId !== STORES_APP_ID)) return { ok: false, skal: "ej-forskott" };

  const fraktOre = Math.round(fraktKr(beslut.summaPOre / 100) * 100);
  // ☠️ En enskild firmas nummer är ett personnummer och skrivs aldrig i ordern (forskottskund).
  const { kropp, summor } = forskottsorderKropp(beslut, rader, forskottskund(fp, mp.medlem.epost), fraktOre, exklMoms);

  // Beslutet före ordern (E2-9), och som spärr mot två ordrar ur samma korg.
  const nyckel = `forskott_${besokarensKorg}`;
  let tagen: "tagen" | "fanns";
  try {
    tagen = await taForskottsbeslut({ ...beslutspost(nyckel, "", mp, beslut, golv), betalsatt: "forskott", utfall: "forskott" });
  } catch (e) {
    console.error("[forskott] beslutet gick inte att spara:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return { ok: false, skal: "logg" };
  }
  if (tagen === "fanns") return { ok: false, skal: "pagar" };

  let skapad: unknown;
  try {
    skapad = (await wixFetch<{ order?: unknown }>({ method: "POST", path: "/ecom/v1/orders", body: kropp }))?.order;
  } catch (e) {
    const status = e instanceof WixApiError ? e.status : 0;
    console.error(`[forskott] Wix skapade ingen order (${status || "nät"})`);
    // Ett tydligt nej (4xx) betyder att ingen order finns: spärren släpps så att
    // kunden kan försöka igen. Vid tystnad eller 5xx kan ordern ändå finnas,
    // och då står spärren kvar hellre än att en andra order skapas.
    if (status >= 400 && status < 500) await slappForskottsbeslut(nyckel).catch(() => {});
    return { ok: false, skal: status === 429 ? "upptaget" : "wix" };
  }

  const k = kontrolleraForskottsorder(summor, beslut.rader, skapad);
  if (!k.ok) {
    // En order som inte bär förskottets villkor får aldrig stå kvar: den
    // avbryts, varorna läggs tillbaka i lager och kunden får inget mejl.
    console.error(`[forskott] ordern bar inte förskottets villkor (${k.fel}); den avbryts`);
    const id = (skapad as { id?: unknown } | null)?.id;
    if (typeof id === "string") {
      await wixFetch({
        method: "POST",
        path: `/ecom/v1/orders/${encodeURIComponent(id)}/cancel`,
        body: { sendOrderCanceledEmail: false, restockAllItems: true },
      }).catch(() => console.error("[forskott] ordern gick inte att avbryta; avbryt den för hand"));
    }
    return { ok: false, skal: "kontroll" };
  }

  await sattForskottsorder(nyckel, k.orderId, k.nummer).catch(() =>
    console.error(`[forskott] order ${k.nummer} skapad, men beslutet saknar ordern`),
  );
  // Besökarens varukorg är köpt: den tas bort, så att samma varor inte köps igen.
  await wixFetch({ method: "DELETE", path: `/ecom/v2/carts/${encodeURIComponent(besokarensKorg)}` }).catch(() => {});
  await loggaTyst({
    omrade: "foretag",
    typ: "forskott",
    medlemsId: mp.medlem.id,
    aktor: "kund",
    efter: { order: k.nummer, rader: rader.length },
  });
  return { ok: true, nummer: k.nummer, totalOre: summor.totalOre };
}

// ─────────────────────────────────────────────────────────────────────────────
// Låsta korgar äldre än ett dygn (lib/medlem/korgstadning.ts)
// ─────────────────────────────────────────────────────────────────────────────

/** Tar bort en låst korg i Wix. 404: den fanns inte längre. */
export async function taBortLastKorg(cartId: string): Promise<"borttagen" | "saknades"> {
  try {
    await wixFetch({ method: "DELETE", path: `/ecom/v2/carts/${encodeURIComponent(cartId)}` });
    return "borttagen";
  } catch (e) {
    if (e instanceof WixApiError && e.status === 404) return "saknades";
    throw e;
  }
}

/** Timjobbet /api/cron/medlemskorgar. */
export function stadaMedlemskorgar(nuMs = Date.now()): Promise<Stadutfall> {
  return stadaLastaKorgar(nuMs, {
    utanUtfall: prisbeslutUtanUtfall,
    orderFinns: orderMedKopflode,
    taBortKorg: taBortLastKorg,
    sattUtfall: sattKorgutfall,
  });
}
