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
import { EU_STOCK_NOTE_SHORT } from "../lib/shipping";
import { normaliseraKundvagn } from "../lib/cart-shape";

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

function persistTokens(client: any) {
  try {
    const t = client?.auth?.getTokens?.();
    if (t) Cookies.set("session", JSON.stringify(t), { expires: 30 });
  } catch {}
}

type Ctx = {
  cart: any;
  count: number;
  open: boolean;
  setOpen: (b: boolean) => void;
  add: (id: string, variantId?: string, quantity?: number) => Promise<void>;
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

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

  const add = useCallback(async (id: string, variantId?: string, quantity: number = 1) => {
    setBusy(true);
    try {
      const { client } = await getClient();
      if (!Cookies.get("session")) {
        try {
          const t = await client.auth.generateVisitorTokens();
          Cookies.set("session", JSON.stringify(t), { expires: 30 });
        } catch {}
      }
      const ref: any = { appId: STORES_APP_ID, catalogItemId: id };
      if (variantId) ref.options = { variantId };
      // v2: fältet heter catalogItems (v1 kallade det lineItems).
      const res: any = await client.currentCart.addLineItemsToCurrentCart({
        catalogItems: [{ catalogReference: ref, quantity: Math.max(1, Math.floor(quantity)) }],
      });
      setCart(normaliseraKundvagn(res)); persistTokens(client); setOpen(true);
      Cookies.set("fp_cart", "1", { expires: 30 });
    } finally { setBusy(false); }
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
      const { client } = await getClient();

      // v2 slog ihop kundvagn och kassa till EN entitet: det finns ingen
      // createCheckoutFromCurrentCart längre. Vagnens id ÄR kassans id, så
      // det som förut krävde ett extra anrop är nu bara en uppslagning.
      const aktuell: any = await client.currentCart.getCurrentCart();
      const cartId: string = aktuell?.cart?._id || aktuell?._id || "";
      if (!cartId) throw new Error("ingen kundvagn att gå till kassan med");

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

      // Vilken väg som användes går annars bara att se genom att slutföra ett
      // köp. Raden gör det synligt i konsolen utan att någon betalar något.
      console.info(`[kassa] adress via ${vag}`);

      window.location.href = target;
    } catch (e: any) {
      alert("Kassan kunde inte öppnas: " + (e?.message || "okänt fel"));
    } finally { setBusy(false); }
  }, [cart]);

  const count = (cart?.lineItems || []).reduce((n: number, li: any) => n + (li.quantity || 0), 0);

  return <CartCtx.Provider value={{ cart, count, open, setOpen, add, remove, updateQty, checkout, busy }}>{children}</CartCtx.Provider>;
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
        onClick={async () => { await add(id, vid || undefined); setAdded(true); setTimeout(() => setAdded(false), 1500); }}
      >
        {busy ? "Lägger till…" : added ? "✓ Tillagd i varukorgen" : "Lägg i kundvagn"}
      </button>
    </div>
  );
}

export function CartDrawer({ recommendations = [] }: { recommendations?: RecoProduct[] }) {
  const { cart, open, setOpen, remove, updateQty, checkout, busy, count } = useCart();
  const items: any[] = cart?.lineItems || [];
  // "Andra köpte också": visa upp till 3 rekommendationer som inte redan ligger
  // i varukorgen (matchas på Wix-katalog-id). Hjälper att fylla fri-frakt-gapet.
  const cartIds = new Set(items.map((li) => li?.catalogReference?.catalogItemId).filter(Boolean));
  const recos = recommendations.filter((r) => !cartIds.has(r.id)).slice(0, 3);
  const subtotal = cart?.subtotal?.formattedAmount || cart?.priceSummary?.subtotal?.formattedAmount || "";
  const FREE_SHIP = 499;
  // OBS INFÖR FLERA VALUTOR. Tröskeln är 499 KRONOR, så mätaren måste jämföra
  // mot butikens valuta — därför `amount` och inte det formaterade beloppet,
  // som visar KUNDENS valuta (v2 skiljer på de två; v1 gjorde det inte).
  // Så länge butiken bara säljer i SEK är de identiska. Slås flera valutor på
  // för merchen blir raden "Du är 200 kr från fri frakt" stående under en
  // summa i euro. Då ska tröskeln räknas om, inte beloppet bytas ut.
  const subNum = parseFloat(cart?.priceSummary?.subtotal?.amount ?? cart?.subtotal?.amount ?? "0") || 0;
  const remaining = Math.max(0, FREE_SHIP - subNum);
  const shipPct = Math.min(100, Math.round((subNum / FREE_SHIP) * 100));
  return (
    <>
      <div className={`drawer-ov ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`drawer ${open ? "show" : ""}`} aria-hidden={!open} inert={!open}>
        <div className="drawer-head">
          <strong>Varukorg{count > 0 ? ` (${count})` : ""}</strong>
          <button className="drawer-x" onClick={() => setOpen(false)} aria-label="Stäng">✕</button>
        </div>
        {items.length > 0 && (
          <div className="freeship">
            {remaining > 0 ? (
              <p>Du är <b>{Math.round(remaining)} kr</b> från fri frakt!</p>
            ) : (
              <p className="reached">🎉 Du har fri frakt!</p>
            )}
            <div className={`fsbar ${remaining === 0 ? "done" : ""}`}><span style={{ width: `${shipPct}%` }} /></div>
          </div>
        )}
        <div className="drawer-body">
          {items.length === 0 ? (
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
              return (
                <div className="li" key={li._id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img ? <img className="li-img" src={tightFillUrl(img, 160, 160)} alt={name} loading="lazy" /> : <div className="li-img" />}
                  <div className="li-info">
                    <div className="li-name">{name}</div>
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
          {items.length > 0 && recos.length > 0 && (
            <div className="cart-recos">
              <div className="cart-recos-head">Andra köpte också</div>
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
        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="sub"><span>Delsumma</span><b>{subtotal}</b></div>
            <button className="buy" disabled={busy} onClick={checkout}>{busy ? "…" : "Till kassan →"}</button>
            <p className="drawer-note">Frakt och rabatter beräknas i kassan.</p>
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
