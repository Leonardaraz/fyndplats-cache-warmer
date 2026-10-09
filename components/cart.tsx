"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import {
  stashPurchaseSnapshot,
  trackBeginCheckout,
  trackViewCart,
} from "../lib/analytics";
import type { RecoProduct } from "../lib/products";
import { tightFillUrl } from "../lib/wix-image";
import { DELIVERY_MAX_DAYS, DELIVERY_MIN_DAYS, DELIVERY_TIME, EU_STOCK_NOTE_SHORT, FREE_SHIPPING_FROM_KR, fraktKr } from "../lib/shipping";
import { leveransIntervall } from "../lib/leveransdatum";
import { skapaKassalankMinne, type Kassalank } from "../lib/kassalank";
import { normaliseraKundvagn, valdaAlternativ } from "../lib/cart-shape";
import { visaValnamn } from "../lib/variant-lage";
import { usePanelFokus } from "./use-panel-fokus";
import { formatPrice } from "../lib/price-range";
import { produktLankForRad } from "../lib/kundvagn-lank";
import { PaymentMarks } from "./payment-marks";

const STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
const HEADLESS_CLIENT_ID = "3d8fdd09-3b3c-475f-aac2-b6bfa9e05153";

function liImageUrl(x: any): string {
  const u: any = typeof x === "string" ? x : (x?.url || x?.id || "");
  if (!u || typeof u !== "string") return "";
  if (u.startsWith("http")) return u;
  const m = u.match(/wix:image:\/\/v1\/([^/#]+)/);
  if (m) return `https://static.wixstatic.com/media/${m[1]}`;
  if (/^[\w]+_[\w~.%-]+\.(jpg|jpeg|png|webp|gif)/i.test(u)) return `https://static.wixstatic.com/media/${u}`;
  return "";
}

// Round-3 perf: lazy-import @wix/sdk + @wix/ecom so the ~600 KB SDK doesn't
// ship in the main bundle. Module-level imports made every page (incl. blog)
// pay the SDK weight up front. Now it's fetched only on first cart interaction.
let clientPromise: Promise<{ client: any; currentCart: any }> | null = null;
function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      // Cart API v2 för vagnen, @wix/redirects kvar för kassa-adressen.
      //
      // Jag tog först bort redirects helt och byggde tacksides-returen på en
      // egen ?origin=-parameter. Det var fel: Redirects-API:t är INTE med i
      // det som tas bort 1 februari 2027 (bara Cart V1 och Checkout V1 är),
      // och createRedirectSession med callbacks är Wix DOKUMENTERADE sätt att
      // få tillbaka kunden till en egen tacksida. Min parameter var en gissning
      // som ersatte något som redan fungerade i produktion.
      const [sdk, ecom, redir] = await Promise.all([
        import("@wix/sdk"),
        import("@wix/ecom"),
        import("@wix/redirects"),
      ]);
      // redir.redirects, INTE redir: paketets toppnivå är ett hölje runt
      // namnrymden. Skickar man in modulen rakt av blir
      // client.redirects.createRedirectSession undefined, anropet kastar, och
      // catch:en nedan sväljer det tyst — varje köp hade tagit reservvägen
      // utan att någon märkt det. Samma uppackning som produktionen gör.
      const client = sdk.createClient({
        modules: { currentCart: ecom.currentCartV2, cart: ecom.cartV2, redirects: redir.redirects },
        auth: sdk.OAuthStrategy({
          clientId: HEADLESS_CLIENT_ID,
          tokens: JSON.parse(Cookies.get("session") || '{"accessToken":{},"refreshToken":{}}'),
        }),
      });
      return { client, currentCart: ecom.currentCartV2 };
    })();
  }
  return clientPromise;
}

// Besökarnyckeln hämtas en gång, även om förvärmningen och ett tryck kommer
// samtidigt. Utan nyckel i kakan skapar Wix en ny besökare per anrop.
let besokareLofte: Promise<void> | null = null;
function sakraBesokare(client: any): Promise<void> {
  if (Cookies.get("session")) return Promise.resolve();
  if (!besokareLofte) {
    besokareLofte = (async () => {
      try {
        const t = await client.auth.generateVisitorTokens();
        Cookies.set("session", JSON.stringify(t), { expires: 30 });
      } catch { /* som förut: tillägget försöker ändå */ }
    })().finally(() => { besokareLofte = null; });
  }
  return besokareLofte;
}

/** Laddar kassans kod och, med `nyckel`, besökarnyckeln innan kunden trycker.
 *  Mätt i butiken 2026-10-07 (mobil): första "Lägg i kundvagn" tog 2,4 s,
 *  varav 0,7 s kod och 0,9 s nyckel; senare tryck 0,7–0,8 s (Wix svar).
 *  Koden hämtas efter kundens första rörelse på produktsidan, nyckeln först
 *  vid avsikt (fingret på knappen), så att en ren titt varken laddar koden
 *  eller skapar en besökare hos Wix. */
export function forvarmKundvagn(nyckel = false): void {
  getClient().then(({ client }) => (nyckel ? sakraBesokare(client) : undefined)).catch(() => {});
}

function persistTokens(client: any) {
  try {
    const t = client?.auth?.getTokens?.();
    if (t) Cookies.set("session", JSON.stringify(t), { expires: 30 });
  } catch {}
}

/** Det kunden ser i lådan medan Wix bekräftar tillägget. */
/** `bild` visas som den är: helst adressen sidan redan visar, så att den
 *  ligger i webbläsarens cache och syns direkt. */
export type Forhandsrad = { namn: string; bild?: string; val?: string; prisNum?: number };
type Vantande = Forhandsrad & { nyckel: number; antal: number };

type Ctx = {
  cart: any;
  count: number;
  open: boolean;
  setOpen: (b: boolean) => void;
  /** true när Wix tagit emot varan. Med `forhand` öppnas lådan direkt, med
   *  raden som väntande, i stället för när Wix svarat. */
  add: (id: string, variantId?: string, quantity?: number, forhand?: Forhandsrad) => Promise<boolean>;
  vantande: Vantande[];
  fel: string | null;
  remove: (lineId: string) => Promise<void>;
  updateQty: (lineId: string, quantity: number) => Promise<void>;
  checkout: () => Promise<void>;
  busy: boolean;
};
const CartCtx = createContext<Ctx | null>(null);
export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
};

// Kassans adress förbereds när lådan visar en vagn med varor och hämtas
// härifrån vid trycket på "Till kassan" (lib/kassalank.ts).
const kassalankMinne = skapaKassalankMinne();

// Förbindelsen till kassans värd öppnas medan kunden tittar i lådan, så att
// kassan börjar laddas direkt efter trycket: uppslag, anslutning och
// kryptering är redan gjorda. En gång per värd och sida.
const forbundna = new Set<string>();
function forbindTill(adress: string): void {
  try {
    const origin = new URL(adress).origin;
    if (forbundna.has(origin)) return;
    forbundna.add(origin);
    const l = document.createElement("link");
    l.rel = "preconnect";
    l.href = origin;
    document.head.appendChild(l);
  } catch { /* oparsbar adress: ingen förbindelse, inget fel */ }
}

/** Kassans adress för den aktuella vagnen. `forvantatId` är vagnen lådan
 *  visar när adressen förbereds: har vagnen bytts under tiden byggs ingen
 *  adress, så att en förberedd adress aldrig pekar på fel vagn. */
async function byggKassalank(client: any, forvantatId?: string): Promise<Kassalank> {
  // v2 slog ihop kundvagn och kassa till EN entitet: det finns ingen
  // createCheckoutFromCurrentCart längre. Vagnens id ÄR kassans id, så
  // det som förut krävde ett extra anrop är nu bara en uppslagning.
  const aktuell: any = await client.currentCart.getCurrentCart();
  const cartId: string = aktuell?.cart?._id || aktuell?._id || "";
  if (!cartId) throw new Error("ingen kundvagn att gå till kassan med");
  if (forvantatId && cartId !== forvantatId) throw new Error("vagnen byttes medan kassan förbereddes");

  const origin = window.location.origin;
  const thankYouUrl = `${origin}/tack`;
  const shopUrl = `${origin}/butik`;

  // KASSA-ADRESSEN, i två steg med olika roller.
  //
  // FÖRST redirect-sessionen — exakt samma anrop som produktionen kör
  // idag. Wix migreringsguide säger rakt ut att "the checkout ID is the
  // cart ID in V2", så vagnens id går rakt in där checkoutId ska stå.
  // Callbacks är hela poängen: thankYouPageUrl är det som gör att kunden
  // kommer tillbaka till /tack MED ?orderId, och det är den mekanism som
  // bevisligen fungerar i skarp drift.
  //
  // Den returnerade fullUrl pekar på en IAM-endpoint som 404:ar på
  // primärdomänen, så vi plockar ut den inre riktiga checkout-länken —
  // samma utplock som produktionen gör.
  let target = "";
  let vag = "redirect-session";
  try {
    const redirect: any = await client.redirects.createRedirectSession({
      ecomCheckout: { checkoutId: cartId },
      callbacks: { thankYouPageUrl: thankYouUrl, postFlowUrl: origin, cartPageUrl: shopUrl },
    });
    const fullUrl: string = redirect?.redirectSession?.fullUrl || "";
    const inner = fullUrl ? new URL(fullUrl).searchParams.get("redirectUrl") : null;
    if (inner && inner.includes("/__ecom/checkout")) target = inner;
  } catch (e: any) {
    // Aldrig tyst: faller sessionen ska det gå att se VARFÖR, annars
    // används reservvägen i månader utan att någon märker det.
    console.warn("[kassa] redirect-sessionen föll:", e?.message || e);
  }

  // SEDAN v2-adressen som reserv. getCheckoutUrl tar även ett
  // `currencyCode` — hooken för flera valutor, oanvänd här.
  //
  // Den ger en naken ?checkoutId=-adress utan callbacks, så ?origin läggs
  // på för hand. Den vägen är OPROVAD mot ett riktigt köp; den finns för
  // att kassan ska öppnas även om redirect-sessionen strular, inte för att
  // den är likvärdig.
  if (!target) {
    vag = "getCheckoutUrl (reserv)";
    const svar: any = await client.cart.getCheckoutUrl(cartId);
    target = svar?.checkoutUrl || "";
    if (!target) throw new Error("kassan gav ingen adress");
    try {
      const u = new URL(target);
      if (!u.searchParams.has("origin")) u.searchParams.set("origin", thankYouUrl);
      target = u.toString();
    } catch { /* oparsbar adress → navigera ändå */ }
  }

  // hideLoginLogoutBar döljer inloggningsraden på den Wix-hostade kassan så
  // kunden alltid checkar ut som GÄST. Wix-supportens egen headless-
  // workaround (ärende juni 2026); utan den gav login/logout-bytet en bugg.
  // headlessClientId säger vilken headless-klient kassan öppnas för — v1
  // hade den alltid med. Båda sätts bara om de saknas.
  //
  // Fail-safe: går adressen inte att parsa navigerar vi oförändrat.
  try {
    const u = new URL(target);
    u.searchParams.set("hideLoginLogoutBar", "true");
    if (!u.searchParams.has("headlessClientId")) {
      u.searchParams.set("headlessClientId", HEADLESS_CLIENT_ID);
    }
    target = u.toString();
  } catch { /* oparsbar adress → navigera ändå */ }

  return { target, vag };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [vantande, setVantande] = useState<Vantande[]>([]);
  const [fel, setFel] = useState<string | null>(null);

  // GA4 view_cart — fires varje gång drawern går från stängd till öppen.
  // Cart-state läses via ref (inte i deps) så vi inte spam:ar view_cart vid
  // quantity-ändringar i öppen drawer, men ändå ser senaste cart efter `add()`
  // som triggar setOpen(true) direkt efter setCart.
  const cartRef = useRef<any>(null);
  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => {
    if (open) trackViewCart(cartRef.current);
  }, [open]);

  const refresh = useCallback(async () => {
    try {
      const { client } = await getClient();
      setCart(normaliseraKundvagn(await client.currentCart.getCurrentCart()));
    } catch { setCart(null); Cookies.remove("fp_cart"); }
  }, []);

  useEffect(() => {
    // Returvisitor med befintlig kundvagn → ladda SDK och hämta cart.
    // Nya besökare betalar 0 SDK-bytes tills de klickar "Lägg i kundvagn".
    // generateVisitorTokens flyttat till första add() — annars skulle vi
    // tvinga SDK-load även för rena katalogbesök.
    if (Cookies.get("fp_cart")) refresh();
  }, [refresh]);

  const add = useCallback(async (id: string, variantId?: string, quantity: number = 1, forhand?: Forhandsrad) => {
    const antal = Math.max(1, Math.floor(quantity));
    const nyckel = Date.now() + Math.random();
    setBusy(true);
    setFel(null);
    // Lådan öppnas i samma bild som trycket, med varan som väntande rad.
    // Wix svar ersätter raden i samma rendering (React batchar setCart och
    // borttagningen nedan), så den blinkar inte.
    if (forhand) { setVantande((v) => [...v, { ...forhand, nyckel, antal }]); setOpen(true); }
    try {
      const { client } = await getClient();
      await sakraBesokare(client);
      const ref: any = { appId: STORES_APP_ID, catalogItemId: id };
      if (variantId) ref.options = { variantId };
      // v2: fältet heter catalogItems (v1 kallade det lineItems).
      const res: any = await client.currentCart.addLineItemsToCurrentCart({
        catalogItems: [{ catalogReference: ref, quantity: antal }],
      });
      setCart(normaliseraKundvagn(res)); persistTokens(client); setOpen(true);
      Cookies.set("fp_cart", "1", { expires: 30 });
      return true;
    } catch {
      // Förut kastades felet vidare utan att kunden såg något. Nu står det i
      // lådan, och den väntande raden försvinner.
      setFel("Varan kunde inte läggas i varukorgen. Försök igen.");
      setOpen(true);
      return false;
    } finally {
      setVantande((v) => v.filter((x) => x.nyckel !== nyckel));
      setBusy(false);
    }
  }, []);

  const remove = useCallback(async (lineId: string) => {
    const { client } = await getClient();
    const res: any = await client.currentCart.removeLineItemsFromCurrentCart([lineId]);
    setCart(normaliseraKundvagn(res));
  }, []);

  const updateQty = useCallback(async (lineId: string, quantity: number) => {
    if (quantity < 1) { await remove(lineId); return; }
    setBusy(true);
    try {
      const { client } = await getClient();
      // v2: lineItemId (inte _id), och antalet ligger i { newQuantity }.
      const res: any = await client.currentCart.updateLineItemsInCurrentCart({
        lineItems: [{ lineItemId: lineId, quantity: { newQuantity: quantity } }],
      });
      setCart(normaliseraKundvagn(res));
    } finally { setBusy(false); }
  }, [remove]);

  const checkout = useCallback(async () => {
    setBusy(true);
    try {
      // Stasha cart-snapshot + fyra GA4 begin_checkout INNAN redirect. Wix
      // routar tillbaka till /tack utan items — purchase-eventet behöver det.
      trackBeginCheckout(cart);
      stashPurchaseSnapshot(cart);
      // Adressen förbereds när lådan öppnas (lib/kassalank.ts). Finns en för
      // just den här vagnen används den, annars byggs den nu, som förut.
      const kassaId: string = cart?._id || "";
      const forberedd = kassaId ? kassalankMinne.hamta(kassaId) : null;
      let lank: Kassalank | null = forberedd ? await forberedd.catch(() => null) : null;
      if (lank) {
        lank = { ...lank, vag: `${lank.vag}, förberedd` };
      } else {
        const { client } = await getClient();
        lank = await byggKassalank(client);
      }

      // Vilken väg som användes går annars bara att se genom att slutföra ett
      // köp. Raden gör det synligt i konsolen utan att någon betalar något.
      console.info(`[kassa] adress via ${lank.vag}`);

      window.location.href = lank.target;
    } catch (e: any) {
      alert("Kassan kunde inte öppnas: " + (e?.message || "okänt fel"));
    } finally { setBusy(false); }
  }, [cart]);

  // Förbered kassans adress så fort lådan visar en vagn med varor. Faller
  // det bygger trycket själv, så ett fel här märks aldrig av kunden.
  const kassaId: string = cart?._id || "";
  const harVaror = (cart?.lineItems?.length ?? 0) > 0;
  useEffect(() => {
    if (!open || !kassaId || !harVaror) return;
    kassalankMinne
      .forbered(kassaId, () => getClient().then(({ client }) => byggKassalank(client, kassaId)))
      .then((l) => forbindTill(l.target))
      .catch(() => {});
  }, [open, kassaId, harVaror]);

  const count = (cart?.lineItems || []).reduce((n: number, li: any) => n + (li.quantity || 0), 0)
    + vantande.reduce((n, v) => n + v.antal, 0);

  // Ett fel står kvar tills lådan stängs, inte till nästa gång den öppnas.
  const oppna = useCallback((b: boolean) => { setOpen(b); if (!b) setFel(null); }, []);

  return <CartCtx.Provider value={{ cart, count, open, setOpen: oppna, add, vantande, fel, remove, updateQty, checkout, busy }}>{children}</CartCtx.Provider>;
}

export function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button className="cartbtn" onClick={() => setOpen(true)} aria-label={count > 0 ? `Öppna varukorg, ${count} varor` : "Öppna varukorg"}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && <span className="cartcount">{count}</span>}
    </button>
  );
}

export function BuyBox({ id, variants }: { id: string; variants?: { id: string; label: string }[] }) {
  const { add, busy } = useCart();
  const vs = variants || [];
  const [vid, setVid] = useState(vs[0]?.id || "");
  const [added, setAdded] = useState(false);
  const needsVariant = vs.length > 0;
  return (
    <div className="buybox">
      {vs.length > 1 && (
        <label className="varpick">
          <span>Variant</span>
          <select value={vid} onChange={(e) => setVid(e.target.value)}>
            {vs.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </label>
      )}
      <button
        className="buy"
        disabled={busy || !id || (needsVariant && !vid)}
        onClick={async () => { if (await add(id, vid || undefined)) { setAdded(true); setTimeout(() => setAdded(false), 1500); } }}
      >
        {busy ? "Lägger till…" : added ? "✓ Tillagd i varukorgen" : "Lägg i kundvagn"}
      </button>
    </div>
  );
}

// Varukorgens förslag hämtas här, inte i layouten: förslag med pris i varje
// sidas data gjorde alla sidor "nya" så fort ett pris ändrades
// (app/api/kundvagn-forslag). De utgår från varorna i varukorgen och hämtas
// därför per varukorg: när webbläsaren är ledig efter en ändring, eller direkt
// när varukorgen öppnas. Svaret sparas per varukorg så länge sidan är öppen.
// Ett misslyckat anrop sparas inte, så nästa gång varukorgen öppnas försöker
// den igen.
const forslagLoften = new Map<string, Promise<RecoProduct[]>>();
function hamtaForslag(nyckel: string): Promise<RecoProduct[]> {
  let lofte = forslagLoften.get(nyckel);
  if (!lofte) {
    lofte = fetch(`/api/kundvagn-forslag?ids=${encodeURIComponent(nyckel)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((b: { forslag?: RecoProduct[] }) => (Array.isArray(b.forslag) ? b.forslag : []))
      .catch(() => {
        forslagLoften.delete(nyckel);
        return [];
      });
    forslagLoften.set(nyckel, lofte);
  }
  return lofte;
}

export function CartDrawer() {
  const { cart, open, setOpen, remove, updateQty, checkout, busy, count, vantande, fel } = useCart();
  const panelRef = useRef<HTMLElement>(null);
  // En ny vara läggs sist. Rulla dit, så att kunden ser den hamna i lådan.
  const kroppRef = useRef<HTMLDivElement>(null);
  const antalVantande = vantande.length;
  useEffect(() => {
    const k = kroppRef.current;
    if (antalVantande && k) k.scrollTop = k.scrollHeight;
  }, [antalVantande]);
  usePanelFokus(open, panelRef, () => setOpen(false));
  // Samma datum som produktsidan (lib/leveransdatum.ts), räknat när lådan
  // är öppen och aldrig på servern: lådan är stängd när sidan renderas där,
  // och då visas "3–6 arbetsdagar".
  const levIntervall = open ? leveransIntervall(new Date(), DELIVERY_MIN_DAYS, DELIVERY_MAX_DAYS) : DELIVERY_TIME;
  const items: any[] = cart?.lineItems || [];
  const cartIds = new Set<string>(items.map((li) => li?.catalogReference?.catalogItemId).filter(Boolean));
  // Samma varor ger samma nyckel, i vilken ordning de än lades i.
  const forslagNyckel = [...cartIds].sort().join(",");
  const [forslag, setForslag] = useState<{ nyckel: string; lista: RecoProduct[] }>({ nyckel: "", lista: [] });
  useEffect(() => {
    if (!forslagNyckel) return;
    let aktiv = true;
    const hamta = () => hamtaForslag(forslagNyckel).then((lista) => { if (aktiv) setForslag({ nyckel: forslagNyckel, lista }); });
    // Öppen varukorg: hämta direkt. Annars när webbläsaren är ledig; äldre
    // Safari saknar requestIdleCallback.
    if (open) {
      hamta();
      return () => { aktiv = false; };
    }
    const ledig = "requestIdleCallback" in window;
    const id = ledig ? window.requestIdleCallback(hamta) : window.setTimeout(hamta, 1500);
    return () => {
      aktiv = false;
      if (ledig) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [forslagNyckel, open]);
  // Högst tre förslag, bara för varukorgen som den ser ut nu och aldrig något
  // som redan ligger i den (matchas på Wix-katalog-id).
  const recos = forslag.nyckel === forslagNyckel ? forslag.lista.filter((r) => !cartIds.has(r.id)).slice(0, 3) : [];
  const subtotal = cart?.subtotal?.formattedAmount || cart?.priceSummary?.subtotal?.formattedAmount || "";
  const FREE_SHIP = FREE_SHIPPING_FROM_KR;
  // OBS INFÖR FLERA VALUTOR. Tröskeln är 500 KRONOR, så mätaren måste jämföra
  // mot butikens valuta — därför `amount` och inte det formaterade beloppet,
  // som visar KUNDENS valuta (v2 skiljer på de två; v1 gjorde det inte).
  // Så länge butiken bara säljer i SEK är de identiska. Slås flera valutor på
  // för merchen blir raden "Du är 200 kr från fri frakt" stående under en
  // summa i euro. Då ska tröskeln räknas om, inte beloppet bytas ut.
  // De väntande raderna räknas med, så att fri frakt-mätaren och delsumman
  // stämmer redan innan Wix svarat.
  const vantandeSumma = vantande.reduce((n, v) => n + (v.prisNum ?? 0) * v.antal, 0);
  const harRader = items.length > 0 || vantande.length > 0;
  const subNum = (parseFloat(cart?.priceSummary?.subtotal?.amount ?? cart?.subtotal?.amount ?? "0") || 0) + vantandeSumma;
  const remaining = Math.max(0, FREE_SHIP - subNum);
  const shipPct = Math.min(100, Math.round((subNum / FREE_SHIP) * 100));
  // Frakten är butikens enda regel (fraktKr, samma gräns som Wix-kassan), så
  // den och totalen kan stå här i stället för "beräknas i kassan". Rabattkoder
  // anges i kassan och dras där. Samma valutaförbehåll som mätaren ovan.
  const frakt = fraktKr(subNum);
  const totalt = subNum + frakt;
  return (
    <>
      <div className={`drawer-ov ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside ref={panelRef} className={`drawer ${open ? "show" : ""}`} role="dialog" aria-modal="true" aria-label="Varukorg" aria-hidden={!open} inert={!open}>
        <div className="drawer-head">
          <strong>Varukorg{count > 0 ? ` (${count})` : ""}</strong>
          <button className="drawer-x" onClick={() => setOpen(false)} aria-label="Stäng">✕</button>
        </div>
        {fel && <p className="drawer-fel" role="alert">{fel}</p>}
        {harRader && (
          <div className="freeship">
            {remaining > 0 ? (
              <p>Du är <b>{Math.round(remaining)} kr</b> från fri frakt!</p>
            ) : (
              <p className="reached">🎉 Du har fri frakt!</p>
            )}
            <div className={`fsbar ${remaining === 0 ? "done" : ""}`}><span style={{ width: `${shipPct}%` }} /></div>
          </div>
        )}
        <div className="drawer-body" ref={kroppRef}>
          {!harRader ? (
            <div className="cart-empty">
              <span className="cart-empty-ic" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </span>
              <p className="cart-empty-title">Din varukorg är tom</p>
              <p className="cart-empty-sub">Här samlar du dina favoritfynd.</p>
              <a className="cart-empty-cta" href="/butik" onClick={() => setOpen(false)}>Utforska butiken →</a>
            </div>
          ) : (
            items.map((li) => {
              const img = liImageUrl(li.image);
              const name = li.productName?.original || li.productName || "Produkt";
              // Namnet och bilden leder till produktsidan. Utan känd adress
              // visas de som förut, utan länk.
              const lank = produktLankForRad(li);
              const bild = img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="li-img" src={tightFillUrl(img, 160, 160)} alt={name} loading="lazy" />
              ) : (
                <div className="li-img" />
              );
              return (
                <div className="li" key={li._id}>
                  {lank ? (
                    <a className="li-lank" href={lank} onClick={() => setOpen(false)} tabIndex={-1} aria-hidden="true">{bild}</a>
                  ) : bild}
                  <div className="li-info">
                    {lank ? (
                      <a className="li-name li-lank" href={lank} onClick={() => setOpen(false)}>{name}</a>
                    ) : (
                      <div className="li-name">{name}</div>
                    )}
                    {/* Valt alternativ med samma namn som på produktsidan
                        (visaValnamn): "Svart · 177 cm". */}
                    {(() => {
                      const val = valdaAlternativ(li).map((v) => visaValnamn(v.varde)).filter(Boolean);
                      return val.length ? <div className="li-val">{val.join(" · ")}</div> : null;
                    })()}
                    <div className="li-meta">{li.price?.formattedAmount || ""}</div>
                    <div className="li-qty">
                      <button className="qbtn" onClick={() => updateQty(li._id, li.quantity - 1)} disabled={busy} aria-label="Minska antal">−</button>
                      <span className="qnum">{li.quantity}</span>
                      <button className="qbtn" onClick={() => updateQty(li._id, li.quantity + 1)} disabled={busy} aria-label="Öka antal">+</button>
                    </div>
                  </div>
                  <button className="li-x" onClick={() => remove(li._id)} aria-label="Ta bort">Ta bort</button>
                </div>
              );
            })
          )}
          {vantande.map((v) => (
            <div className="li li-vantar" key={v.nyckel} aria-busy="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {v.bild ? <img className="li-img" src={v.bild} alt={v.namn} /> : <div className="li-img" />}
              <div className="li-info">
                <div className="li-name">{v.namn}</div>
                {v.val && <div className="li-val">{v.val}</div>}
                {v.prisNum ? <div className="li-meta">{formatPrice(v.prisNum)}</div> : null}
                <div className="li-vantar-text">{v.antal > 1 ? `${v.antal} st · ` : ""}Läggs i varukorgen …</div>
              </div>
            </div>
          ))}
          {harRader && recos.length > 0 && (
            <div className="cart-recos">
              <div className="cart-recos-head">Komplettera ditt köp</div>
              {recos.map((r) => (
                <a className="cart-reco" key={r.slug} href={`/produkt/${r.slug}`} onClick={() => setOpen(false)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {r.img ? <img className="cart-reco-img" src={tightFillUrl(r.img, 160, 160)} alt={r.name} loading="lazy" /> : <span className="cart-reco-img" />}
                  <span className="cart-reco-info">
                    <span className="cart-reco-name">{r.name}</span>
                    <span className="cart-reco-price">{r.price}</span>
                  </span>
                  <span className="cart-reco-arr" aria-hidden="true">→</span>
                </a>
              ))}
            </div>
          )}
        </div>
        {harRader && (
          <div className="drawer-foot">
            {/* Som premiumbutikernas kassor (granskningen 2026-10-09): frakten och
                det kunden betalar står före knappen. Delsumman visas bara när
                den skiljer sig från totalen. */}
            <dl className="drawer-sum">
              {frakt > 0 && (
                <div><dt>Delsumma</dt><dd>{vantande.length || !subtotal ? formatPrice(subNum) : subtotal}</dd></div>
              )}
              <div><dt>Frakt</dt><dd className={frakt === 0 ? "fri" : undefined}>{frakt === 0 ? "Fri frakt" : formatPrice(frakt)}</dd></div>
              <div className="tot"><dt>Totalt <small>inkl. moms</small></dt><dd>{formatPrice(totalt)}</dd></div>
            </dl>
            <button className="buy" disabled={busy} onClick={checkout}>{busy ? "…" : "Till kassan →"}</button>
            <ul className="drawer-trygg">
              <li>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <circle cx="7" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="17.5" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" />
                </svg>
                <span>Beräknad leverans <b>{levIntervall}</b></span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 14 4 9l5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>30 dagars öppet köp</span>
              </li>
            </ul>
            <PaymentMarks />
            {/* Sista mikro-trygghet före extern Wix-kassa: ingen ny EU-importtull
                (1 juli 2026) eftersom allt skickas inom EU. Text = single source
                of truth (lib/shipping.ts); länkar till garanti-sidan. */}
            <p className="drawer-eu">
              <span aria-hidden="true">🇪🇺</span>
              <a href="/eu-lager-garanti">{EU_STOCK_NOTE_SHORT}</a>
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
