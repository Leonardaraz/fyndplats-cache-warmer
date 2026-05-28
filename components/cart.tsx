"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { currentCart } from "@wix/ecom";
import { redirects } from "@wix/redirects";

const STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";

function liImageUrl(x: any): string {
  const u: any = typeof x === "string" ? x : (x?.url || x?.id || "");
  if (!u || typeof u !== "string") return "";
  if (u.startsWith("http")) return u;
  const m = u.match(/wix:image:\/\/v1\/([^/#]+)/);
  if (m) return `https://static.wixstatic.com/media/${m[1]}`;
  if (/^[\w]+_[\w~.%-]+\.(jpg|jpeg|png|webp|gif)/i.test(u)) return `https://static.wixstatic.com/media/${u}`;
  return "";
}

function makeClient() {
  return createClient({
    modules: { currentCart, redirects },
    auth: OAuthStrategy({
      clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID || "3d8fdd09-3b3c-475f-aac2-b6bfa9e05153",
      tokens: JSON.parse(Cookies.get("session") || '{"accessToken":{},"refreshToken":{}}'),
    }),
  });
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
  const client = useMemo(makeClient, []);
  const [cart, setCart] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const persist = () => {
    try {
      const t = (client as any).auth.getTokens?.();
      if (t) Cookies.set("session", JSON.stringify(t), { expires: 30 });
    } catch {}
  };

  const refresh = useCallback(async () => {
    try { setCart(await client.currentCart.getCurrentCart()); }
    catch { setCart(null); Cookies.remove("fp_cart"); }
  }, [client]);

  useEffect(() => {
    (async () => {
      try {
        if (!Cookies.get("session")) {
          const t = await (client as any).auth.generateVisitorTokens();
          Cookies.set("session", JSON.stringify(t), { expires: 30 });
        }
      } catch {}
      // Only fetch the cart if this visitor has created one — avoids a 404 on the
      // empty-cart endpoint for first-time visitors (keeps the console clean).
      if (Cookies.get("fp_cart")) refresh();
    })();
  }, [client, refresh]);

  const add = useCallback(async (id: string, variantId?: string) => {
    setBusy(true);
    try {
      const ref: any = { appId: STORES_APP_ID, catalogItemId: id };
      if (variantId) ref.options = { variantId };
      const res: any = await client.currentCart.addToCurrentCart({ lineItems: [{ catalogReference: ref, quantity: 1 }] });
      setCart(res.cart); persist(); setOpen(true);
      Cookies.set("fp_cart", "1", { expires: 30 });
    } finally { setBusy(false); }
  }, [client]);

  const remove = useCallback(async (lineId: string) => {
    const res: any = await client.currentCart.removeLineItemsFromCurrentCart([lineId]);
    setCart(res.cart);
  }, [client]);

  const updateQty = useCallback(async (lineId: string, quantity: number) => {
    if (quantity < 1) { await remove(lineId); return; }
    setBusy(true);
    try {
      const res: any = await client.currentCart.updateCurrentCartLineItemQuantity([{ _id: lineId, quantity }]);
      setCart(res.cart);
    } finally { setBusy(false); }
  }, [client, remove]);

  const checkout = useCallback(async () => {
    setBusy(true);
    try {
      const { checkoutId }: any = await client.currentCart.createCheckoutFromCurrentCart({ channelType: (currentCart as any).ChannelType.WEB });
      const redirect: any = await client.redirects.createRedirectSession({ ecomCheckout: { checkoutId }, callbacks: { postFlowUrl: window.location.href } });
      const url = redirect?.redirectSession?.fullUrl;
      if (url) window.location.href = url;
      else alert("Kunde inte starta kassan. Är redirect-domänen godkänd i Wix Headless-inställningarna?");
    } catch (e: any) {
      alert("Kassan kunde inte öppnas: " + (e?.message || "okänt fel") + "\nKontrollera att din domän är godkänd i Wix Headless-inställningarna.");
    } finally { setBusy(false); }
  }, [client]);

  const count = (cart?.lineItems || []).reduce((n: number, li: any) => n + (li.quantity || 0), 0);

  return <CartCtx.Provider value={{ cart, count, open, setOpen, add, remove, updateQty, checkout, busy }}>{children}</CartCtx.Provider>;
}

export function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button className="cartbtn" onClick={() => setOpen(true)} aria-label={count > 0 ? `Öppna varukorg, ${count} varor` : "Öppna varukorg"}>
      <span aria-hidden="true">🛒 <span className="cartcount">{count}</span></span>
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

export function CartDrawer() {
  const { cart, open, setOpen, remove, updateQty, checkout, busy, count } = useCart();
  const items: any[] = cart?.lineItems || [];
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
          <strong>Varukorg ({count})</strong>
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
            <p className="empty">Din varukorg är tom.</p>
          ) : (
            items.map((li) => {
              const img = liImageUrl(li.image);
              const name = li.productName?.original || li.productName || "Produkt";
              return (
                <div className="li" key={li._id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img ? <img className="li-img" src={img} alt={name} loading="lazy" /> : <div className="li-img" />}
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
        </div>
        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="sub"><span>Delsumma</span><b>{subtotal}</b></div>
            <button className="buy" disabled={busy} onClick={checkout}>{busy ? "…" : "Till kassan →"}</button>
            <p className="drawer-note">Frakt och rabatter beräknas i kassan.</p>
          </div>
        )}
      </aside>
    </>
  );
}
