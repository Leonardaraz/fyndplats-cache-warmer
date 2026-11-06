"use client";
// Sparade varukorgar på Mina sidor (medlemskapet E3, lib/medlem/sparade.ts).
// Kunden sparar varukorgen som den är under ett namn och lägger den i
// varukorgen igen med ett tryck. Servern läser varukorgen själv; härifrån
// skickas bara korgens id och namnet.

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart";
import { kopIgenBesked, type KopIgenRad } from "@/lib/medlem/kop-igen";
import { MAX_KORGAR, NAMN_MAX, sparaFelText, type SparadKorgVy } from "@/lib/medlem/sparade";
import s from "./konto.module.css";

const INTE_NU = "Det gick inte just nu. Försök igen om en stund.";
const DATUM = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long", timeZone: "Europe/Stockholm" });
const varor = (n: number) => (n === 1 ? "1 vara" : `${n} varor`);

type Kopsvar = { ok: true; rader: KopIgenRad[]; slut: number; borta: number } | { ok: false; skal?: string };

/** `kanSpara`: växeln för E2/E3 (`sparadeSektion`); utan den syns bara korgar som redan finns. */
export function SparadeKorgar({ korgar, kanSpara }: { korgar: SparadKorgVy[]; kanSpara: boolean }) {
  const { cart, count, addMany, busy } = useCart();
  const router = useRouter();
  const [namn, setNamn] = useState("");
  const [sparar, setSparar] = useState(false);
  const [sparBesked, setSparBesked] = useState<string | null>(null);
  const [arbetar, setArbetar] = useState<string | null>(null);
  const [bekrafta, setBekrafta] = useState<string | null>(null);
  const [besked, setBesked] = useState<{ id: string; text: string } | null>(null);

  async function spara(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cart?._id) return;
    setSparar(true);
    setSparBesked(null);
    try {
      const r = await fetch("/api/konto/sparade", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cartId: cart._id, namn }),
        signal: AbortSignal.timeout(20_000),
      });
      const svar = (await r.json().catch(() => null)) as { ok?: boolean; skal?: string } | null;
      if (svar?.ok) {
        setNamn("");
        setSparBesked("Varukorgen är sparad.");
        router.refresh();
      } else {
        setSparBesked(sparaFelText(svar?.skal));
      }
    } catch {
      setSparBesked(sparaFelText(undefined));
    } finally {
      setSparar(false);
    }
  }

  async function lagg(id: string) {
    setArbetar(id);
    setBesked(null);
    try {
      const r = await fetch("/api/konto/sparade/kop", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
        signal: AbortSignal.timeout(20_000),
      });
      const svar = (await r.json().catch(() => null)) as Kopsvar | null;
      if (!svar?.ok) {
        setBesked({ id, text: svar && !svar.ok && svar.skal === "utloggad" ? "Du har loggats ut. Logga in igen." : INTE_NU });
        return;
      }
      if (svar.rader.length > 0) {
        const ok = await addMany(svar.rader.map((x) => ({ id: x.produktId, variantId: x.variantId, antal: x.antal })));
        // Ett fel i varukorgen står i lådan, som när en vara läggs i från produktsidan.
        if (!ok) return;
      }
      const text = kopIgenBesked(svar.rader.length, svar.slut, svar.borta, "korgen");
      if (text) setBesked({ id, text });
    } catch {
      setBesked({ id, text: INTE_NU });
    } finally {
      setArbetar(null);
    }
  }

  async function taBort(id: string) {
    setArbetar(id);
    setBesked(null);
    try {
      const r = await fetch(`/api/konto/sparade?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin",
        signal: AbortSignal.timeout(20_000),
      });
      if (r.ok) {
        setBekrafta(null);
        router.refresh();
      } else {
        setBesked({ id, text: INTE_NU });
      }
    } catch {
      setBesked({ id, text: INTE_NU });
    } finally {
      setArbetar(null);
    }
  }

  return (
    <section className={s.sparade} aria-labelledby="sparade-rubrik">
      <h2 id="sparade-rubrik" className={s.underrubrik}>
        Sparade varukorgar
      </h2>
      {korgar.length ? (
        <ul className={s.ordrar}>
          {korgar.map((k) => (
            <li key={k.id} className={s.sparadKorg}>
              <div className={s.sparadInfo}>
                <span className={s.sparadNamn}>{k.namn}</span>
                <span className={s.sparadRad}>
                  {varor(k.antalVaror)}
                  {k.skapad ? ` · sparad ${DATUM.format(new Date(k.skapad))}` : ""}
                </span>
                {k.forsta.length ? <span className={s.sparadVaror}>{k.forsta.join(", ")}</span> : null}
              </div>
              <div className={s.orderKnappar}>
                <button
                  type="button"
                  className={s.knappMork}
                  onClick={() => lagg(k.id)}
                  disabled={arbetar !== null || busy}
                  aria-busy={arbetar === k.id}
                >
                  {arbetar === k.id && bekrafta !== k.id ? "Lägger i varukorgen …" : "Lägg i varukorgen"}
                </button>
                {bekrafta === k.id ? (
                  <>
                    <button type="button" className={s.kopIgen} onClick={() => taBort(k.id)} disabled={arbetar !== null}>
                      Ja, ta bort
                    </button>
                    <button type="button" className={s.kopIgen} onClick={() => setBekrafta(null)} disabled={arbetar !== null}>
                      Avbryt
                    </button>
                  </>
                ) : (
                  <button type="button" className={s.kopIgen} onClick={() => setBekrafta(k.id)} disabled={arbetar !== null}>
                    Ta bort
                  </button>
                )}
                {besked?.id === k.id ? (
                  <p className={s.kopIgenBesked} role="status">
                    {besked.text}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.orderNot}>Spara en varukorg du köper ofta, så lägger du den i varukorgen igen med ett tryck.</p>
      )}
      {!kanSpara ? null : count > 0 && korgar.length < MAX_KORGAR ? (
        <form className={s.sparaForm} onSubmit={spara}>
          <label htmlFor="sparad-namn" className={s.sparaEtikett}>
            Spara varukorgen som den är nu ({varor(count)})
          </label>
          <div className={s.sparaRad}>
            <input
              id="sparad-namn"
              className={s.falt}
              value={namn}
              onChange={(e) => setNamn(e.target.value)}
              maxLength={NAMN_MAX}
              placeholder="Till exempel Kontoret"
              autoComplete="off"
            />
            <button type="submit" className={s.knappMork} disabled={sparar || busy} aria-busy={sparar}>
              {sparar ? "Sparar …" : "Spara"}
            </button>
          </div>
          {sparBesked ? (
            <p className={s.kopIgenBesked} role="status">
              {sparBesked}
            </p>
          ) : null}
        </form>
      ) : count > 0 ? (
        <p className={s.orderNot}>{sparaFelText("for-manga")}</p>
      ) : korgar.length ? (
        <p className={s.orderNot}>Lägg varor i varukorgen, så kan du spara den här.</p>
      ) : null}
    </section>
  );
}
