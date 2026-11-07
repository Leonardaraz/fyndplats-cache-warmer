"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { lasKontaktParams, type KontaktProdukt } from "../lib/kontakt/kontakt";
import type { SokTraff } from "../lib/sok-index";
import { hamtaValdProdukt, produktUrTraff, ProduktValjare } from "./kontakt-produkt";

type Status = "idle" | "sending" | "sent" | "error";

// Adressens sökdel läses utan effekt: tom på servern och vid hydreringen,
// sedan webbläsarens (useSyncExternalStore sköter bytet).
const ingenPrenumeration = () => () => {};
const lasSokdel = () => window.location.search;
const ingenSokdel = () => "";

export function ContactForm() {
  const [f, setF] = useState({ fornamn: "", efternamn: "", epost: "", meddelande: "", hp: "" });
  const [status, setStatus] = useState<Status>("idle");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  // Produkten frågan gäller (components/kontakt-produkt.tsx). Bara slugen och
  // variantens id skickas; servern slår upp resten (app/api/contact).
  const [produkt, setProdukt] = useState<KontaktProdukt | null>(null);
  const [valtId, setValtId] = useState<string | undefined>(undefined);
  const [skickadOm, setSkickadOm] = useState<string | null>(null);
  // Vilken produkt det senaste uppslaget gäller. Ett sent svar för en produkt
  // som kunden redan bytt bort kastas.
  const uppslag = useRef("");

  // Från produktsidans flik "Kontakta oss": ?produkt=<slug>&variant=<id>.
  const sokdel = useSyncExternalStore(ingenPrenumeration, lasSokdel, ingenSokdel);
  const forval = useMemo(() => lasKontaktParams(sokdel), [sokdel]);
  // Sant när förvalet är hämtat, eller när kunden själv valt eller tagit bort en produkt.
  const [forvalKlart, setForvalKlart] = useState(false);
  useEffect(() => {
    if (!forval) return;
    let aktuell = true;
    uppslag.current = forval.slug;
    void hamtaValdProdukt(forval.slug).then((p) => {
      if (!aktuell || uppslag.current !== forval.slug) return;
      setForvalKlart(true);
      if (!p) return;
      setProdukt(p);
      if (forval.variantId && p.val.some((v) => v.id === forval.variantId)) setValtId(forval.variantId);
    });
    return () => {
      aktuell = false;
    };
  }, [forval]);
  const produktLaddar = !!forval && !forvalKlart && !produkt;

  function valjTraff(h: SokTraff) {
    uppslag.current = h.s;
    setForvalKlart(true);
    setProdukt(produktUrTraff(h));
    setValtId(undefined);
    // Valen (färg, storlek …) kommer ur katalogen; kortet visas direkt ur sökträffen.
    void hamtaValdProdukt(h.s).then((p) => {
      if (uppslag.current === h.s && p) setProdukt(p);
    });
  }

  function rensaProdukt() {
    uppslag.current = "";
    setForvalKlart(true);
    setProdukt(null);
    setValtId(undefined);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...f, produkt: produkt?.slug, variant: valtId }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("send_failed");
      setStatus("sent");
      setSkickadOm(produkt?.namn ?? null);
      setF({ fornamn: "", efternamn: "", epost: "", meddelande: "", hp: "" });
      rensaProdukt();
    } catch {
      setStatus("error");
    } finally {
      clearTimeout(t);
    }
  }

  if (status === "sent") {
    return (
      <div className="callout" role="status" aria-live="polite">
        <p><strong>Tack för ditt meddelande!</strong> Vi har tagit emot det och återkommer normalt inom 24 timmar (vardagar 09–17).</p>
        {skickadOm && <p className="kprod-kvitto">Frågan gäller {skickadOm}.</p>}
      </div>
    );
  }

  return (
    <form className="cform" onSubmit={submit}>
      <div className="row">
        <label>Förnamn<input name="fornamn" autoComplete="given-name" required value={f.fornamn} onChange={set("fornamn")} /></label>
        <label>Efternamn<input name="efternamn" autoComplete="family-name" required value={f.efternamn} onChange={set("efternamn")} /></label>
      </div>
      <label>E-post<input type="email" name="epost" autoComplete="email" required value={f.epost} onChange={set("epost")} /></label>
      <ProduktValjare
        produkt={produkt}
        valtId={valtId}
        laddar={produktLaddar}
        onValj={valjTraff}
        onVariant={setValtId}
        onRensa={rensaProdukt}
      />
      <label>Meddelande<textarea name="meddelande" rows={5} required value={f.meddelande} onChange={set("meddelande")} /></label>

      {/* Honeypot — dolt för människor, fylls av bottar. Icke-semantiskt namn +
          autoComplete="off" så att webbläsar-/lösenordshanterar-autofyll inte
          råkar fylla det åt en riktig kund (skulle annars tappa meddelandet). */}
      <input
        type="text"
        name="hp_field"
        tabIndex={-1}
        autoComplete="off"
        value={f.hp}
        onChange={set("hp")}
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      <button className="buy" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Skickar…" : "Skicka meddelande"}
      </button>

      {status === "error" && (
        <p role="alert" style={{ color: "#C2410C", marginTop: 10 }}>
          Något gick fel när meddelandet skulle skickas. Försök igen, eller mejla oss direkt på{" "}
          <a href="mailto:info@fyndplats.com">info@fyndplats.com</a>.
        </p>
      )}
    </form>
  );
}
