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
import cropsData from "../data/image-crops.json";

const STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
const HEADLESS_CLIENT_ID = "3d8fdd09-3b3c-475f-aac2-b6bfa9e05153";

const __cartCrops: Record<string, { x: number; y: number; w: number; h: number }> =
  ((cropsData as { entries?: Record<string, { x: number; y: number; w: number; h: number }> }).entries) || {};

function liImageUrl(x: any): string {
  const u: any = typeof x === "string" ? x : (x?.url || x?.id || "");
  if (!u || typeof u !== "string") return "";
  let raw = "";
  if (u.startsWith("http")) raw = u;
  else {
    const m = u.match(/wix:image:\/\/v1\/([^/#]+)/);
    if (m) raw = `https://static.wixstatic.com/media/${m[1]}`;
    else if (/^[\w]+_[\w~.%-]+\.(jpg|jpeg|png|webp|gif)/i.test(u)) raw = `https://static.wixstatic.com/media/${u}`;
  }
  if (!raw) return "";
  // Applicera tight-crop när vi har data för bilden. Annars råa wixstatic-URL:n
  // (samma som tidigare beteende).
  const keyMatch = raw.match(/static\.wixstatic\.com\/media\/([^/?#]+)/);
  if (!keyMatch) return raw;
  const key = keyMatch[1];
  const c = __cartCrops[key];
  if (c) return `https://static.wixstatic.com/media/${key}/v1/crop/x_${c.x},y_${c.y},w_${c.w},h_${c.h}/file.webp`;
  return raw;
}

// Round-3 perf: lazy-import @wix/sdk + @wix/ecom so the ~600 KB SDK doesn't
// ship in the main bundle. Module-level imports made every page (incl. blog)
// pay the SDK weight up front. Now it's fetched only on first cart interaction.
let clientPromise: Promise<{ client: any; currentCart: any }> | null = null;
function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const [sdk, ecom, redir] = await Promise.all([
        import("@wix/sdk"),
        import("@wix/ecom"),
        import("@wix/redirects"),
      ]);
      const client = sdk.createClient({
        modules: { currentCart: ecom.currentCart, redirects: redir.redirects },
        auth: sdk.OAuthStrategy({
          clientId: HEADLESS_CLIENT_ID,
          tokens: JSON.parse(Cookies.get("session") || '{"accessToken":{},"refreshToken":{}}'),
        }),
      });
      return { client, currentCart: ecom.currentCart };
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
  add: (id: string, variantId?: string) => Promise<void>;
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
      setCart(await client.currentCart.getCurrentCart());
    } catch { setCart(null); Cookies.remove("fp_cart"); }
  }, []);

  useEffect(() => {
    // Returvisitor med befintlig kundvagn → ladda SDK och hämta cart.
    // Nya besökare betalar 0 SDK-bytes tills de klickar "Lägg i kundvagn".
    // generateVisitorTokens flyttat till första add() — annars skulle vi
    // tvinga SDK-load även för rena katalogbesök.
    if (Cookies.get("fp_cart")) refresh();
  }, [refresh]);

  const add = useCallback(async (id: string, variantId?: string) => {
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
      const res: any = await client.currentCart.addToCurrentCart({ lineItems: [{ catalogReference: ref, quantity: 1 }] });
      setCart(res.cart); persistTokens(client); setOpen(true);
      Cookies.set("fp_cart", "1", { expires: 30 });
    } finally { setBusy(false); }
  }, []);

  const remove = useCallback(async (lineId: string) => {
    const { client } = await getClient();
    const res: any = await client.currentCart.removeLineItemsFromCurrentCart([lineId]);
    setCart(res.cart);
  }, []);

  const updateQty = useCallback(async (lineId: string, quantity: number) => {
    if (quantity < 1) { await remove(lineId); return; }
    setBusy(true);
    try {
      const { client } = await getClient();
      const res: any = await client.currentCart.updateCurrentCartLineItemQuantity([{ _id: lineId, quantity }]);
      setCart(res.cart);
    } finally { setBusy(false); }
  }, [remove]);

  const checkout = useCallback(async () => {
    setBusy(true);
    try {
      // Stasha cart-snapshot + fyra GA4 begin_checkout INNAN redirect. Wix
      // routar tillbaka till /tack utan items — purchase-eventet behöver det.
      trackBeginCheckout(cart);
      stashPurchaseSnapshot(cart);
      const { client, currentCart: cc } = await getClient();
      const { checkoutId }: any = await client.currentCart.createCheckoutFromCurrentCart({ channelType: cc.ChannelType.WEB });
      const origin = window.location.origin;
      const thankYouUrl = `${origin}/tack`;
      const shopUrl = `${origin}/butik`;

      // createRedirectSession bygger den kanoniska checkout-URL:en med rätt
      // `headlessExternalUrls`. Callbacks → checkout-appens externa länkar:
      //   thankYouPageUrl → `ecom-typ`  = dit kunden skickas EFTER lyckat köp
      //                                   (med ?orderId — /tack spårar GA4 purchase)
      //   postFlowUrl     → `home`      = loggans länk + dit vid avbrutet köp (startsidan)
      //   cartPageUrl     → `ecom-cart` = dit "Fortsätt handla"-knappen går (butiken)
      // Den returnerade fullUrl pekar på IAM-cookie-endpointen som 404:ar på
      // primärdomänen — så vi plockar ut den INRE `redirectUrl` (den riktiga
      // __ecom/checkout-länken) och navigerar dit direkt. Behåller IAM-bypassen
      // men kopplar äntligen loggan + "Fortsätt handla" rätt (re-audit #2/#3).
      let target = "";
      try {
        const redirect: any = await client.redirects.createRedirectSession({
          ecomCheckout: { checkoutId },
          callbacks: { thankYouPageUrl: thankYouUrl, postFlowUrl: origin, cartPageUrl: shopUrl },
        });
        const fullUrl: string = redirect?.redirectSession?.fullUrl || "";
        const inner = fullUrl ? new URL(fullUrl).searchParams.get("redirectUrl") : null;
        // Använd den inre URL:en bara om den faktiskt är checkout-appen (inte IAM).
        if (inner && inner.includes("/__ecom/checkout")) target = inner;
      } catch { /* faller igenom till den manuella URL:en nedan */ }

      // Fallback: den beprövade direkt-URL:en (utan continue-shopping-koppling) om
      // redirect-sessionen strular — checkout fungerar fortfarande, oförändrat.
      if (!target) {
        target = `https://checkout.fyndplats.se/__ecom/checkout?checkoutId=${encodeURIComponent(checkoutId)}&origin=${encodeURIComponent(thankYouUrl)}&headlessClientId=${HEADLESS_CLIENT_ID}`;
      }
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
                  {img ? <img className="li-img" src={img} alt={name} loading="lazy" /> : <div className="li-img" />}
                  <div className="li-info">
                    <div className="li-name">{name}<