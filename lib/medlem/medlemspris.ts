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

import { createClient, OAuthStrategy } from "@wix/sdk";
import { redirects } from "@wix/redirects";
import { wixFetch, WixApiError } from "@/lib/wix-client";
import { inloggad } from "./inloggad";
import { lageFor } from "./konto";
import {
  aktuellaRegler,
  hamtaMedlem,
  liggarraderForEpost,
  orderMedKopflode,
  prisbeslutUtanUtfall,
  prisLage,
  sattKorgutfall,
  sparaPrisbeslut,
  type Medlem,
} from "./lager";
import { stadaLastaKorgar, type Stadutfall } from "./korgstadning";
import { hamtaGolv } from "./golv-klient";
import { hogstaProcent, prissatt, radpris, type Begransning, type Prisbeslut, type Profil } from "./pris";
import {
  golvnyckel,
  kassaAdress,
  korgenBarPriserna,
  laastVarukorgKropp,
  lasWixVarukorg,
  prisrader,
  variantpriserUrV3,
} from "./varukorg";

/** Butikens publika headless-klient, samma som varukorgen (components/cart.tsx). */
const HEADLESS_CLIENT_ID = "3d8fdd09-3b3c-475f-aac2-b6bfa9e05153";

export type Utan = "av" | "utloggad" | "sparrad" | "inte-testare" | "fel";
export type Medlemsprofil = { medlem: Medlem; profil: Profil };

/** Medlemmens nivå räknas om högst var femte minut per instans. */
const PROFIL_CACHE_MS = 5 * 60_000;
const profiler = new Map<string, { v: Medlemsprofil; at: number }>();

/** Den inloggade medlemmens profil, eller varför medlemspris inte gäller. */
export async function medlemsprofil(): Promise<Medlemsprofil | { utan: Utan }> {
  const lage = await prisLage();
  if (lage === "av") return { utan: "av" };
  const session = await inloggad();
  if (!session) return { utan: "utloggad" };
  const c = profiler.get(session.sub);
  if (c && Date.now() - c.at < PROFIL_CACHE_MS) {
    if (lage === "test" && !c.v.medlem.testare) return { utan: "inte-testare" };
    return c.v;
  }
  try {
    const medlem = await hamtaMedlem(session.sub);
    if (!medlem || medlem.status !== "aktiv") return { utan: "sparrad" };
    if (lage === "test" && !medlem.testare) return { utan: "inte-testare" };
    const [regler, rader] = await Promise.all([aktuellaRegler(), liggarraderForEpost(medlem.epost)]);
    const l = lageFor(medlem, rader, regler);
    const v: Medlemsprofil = { medlem, profil: { typ: "privat", niva: l.niva.namn, nivaProcent: l.niva.rabattProcent } };
    profiler.set(session.sub, { v, at: Date.now() });
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
  /** Golvet begränsar: den högsta procent varan kan få. */
  hogstaProcent?: number;
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
  return varianter.map((v) => {
    const g = golv.get(golvnyckel(produktId, v.variantId));
    const golvOre = g?.golvOre ?? null;
    const { pOre, begransning } = radpris(v.aOre, golvOre, profil.nivaProcent);
    const hogsta = begransning === "golv" && golvOre !== null ? hogstaProcent(v.aOre, golvOre) : undefined;
    return {
      variantId: v.variantId,
      aOre: v.aOre,
      pOre,
      procent: golvOre === null ? 0 : profil.nivaProcent,
      begransning,
      ...(hogsta !== undefined ? { hogstaProcent: hogsta } : {}),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Kassan
// ─────────────────────────────────────────────────────────────────────────────

export type Kassasvar =
  | { ok: true; adress: string; beslut: Pick<Prisbeslut, "procent" | "niva" | "summaPOre" | "rabattOre" | "friFraktSkydd"> }
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
): Promise<Kassasvar> {
  let korg: unknown;
  try {
    korg = (await wixFetch<{ cart?: unknown }>({ path: `/ecom/v2/carts/${encodeURIComponent(besokarensKorg)}` }))?.cart;
  } catch (e) {
    console.warn(`[medlemskassa] besökarens korg gick inte att läsa (${e instanceof WixApiError ? e.status : "nät"})`);
    return { ok: false, skal: "oläslig" };
  }
  const rader = lasWixVarukorg(korg);
  if (!rader) return { ok: false, skal: "tom" };

  const golv = await hamtaGolv(rader.map((r) => ({ produktId: r.produktId, variantId: r.variantId })));
  const beslut = prissatt(prisrader(rader, golv), mp.profil);
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

  let adress: string | null = null;
  try {
    const klient = createClient({ modules: { redirects }, auth: OAuthStrategy({ clientId: HEADLESS_CLIENT_ID }) });
    const s = await klient.redirects.createRedirectSession({
      ecomCheckout: { checkoutId: cartId },
      callbacks: { thankYouPageUrl: `${bas}/tack`, postFlowUrl: bas, cartPageUrl: `${bas}/butik` },
    });
    adress = kassaAdress(s?.redirectSession?.fullUrl, HEADLESS_CLIENT_ID);
  } catch {
    console.error("[medlemskassa] redirect-sessionen föll");
  }
  if (!adress) {
    await wixFetch({ method: "DELETE", path: `/ecom/v2/carts/${cartId}` }).catch(() => {});
    return { ok: false, skal: "session" };
  }

  // Loggen före svaret: ett köp utan beslut går inte att förklara (E2-9).
  // Går den inte att spara tas korgen bort, och kunden får den vanliga kassan.
  const kostnad = (produktId: string, variantId: string | undefined) =>
    golv.get(golvnyckel(produktId, variantId ?? null))?.kostnadOre ?? undefined;
  const sparat = await sparaPrisbeslut({
    cartId,
    purchaseFlowId: typeof skapad?.purchaseFlowId === "string" ? skapad.purchaseFlowId : "",
    medlemsId: mp.medlem.id,
    profil: beslut.profil,
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
  }).then(
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
  };
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
