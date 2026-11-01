"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ProductReview } from "../lib/reviews";
import { ratingSummary } from "../lib/rating";
import { klamppas, klampenDoljer, visaUtfallningsknapp } from "../lib/review-utfallning";
import { Stars } from "./stars";

export function ProductReviews({
  reviews,
  count,
  average,
}: {
  reviews: ProductReview[];
  count: number;
  average: number | null;
}) {
  const [showAll, setShowAll] = useState(false);
  // Förstorad kundbild. null = stängd. Samma mönster som galleriets lightbox:
  // portal, Escape stänger, bakgrundsscroll låses.
  const [photo, setPhoto] = useState<{ url: string; alt: string } | null>(null);
  // Utfällda recensioner. Långa texter klamppas till några rader så listan går
  // att skumma; utan det dominerar ett enda utförligt omdöme hela sektionen.
  // Importfiltret släpper igenom upp till 1200 tecken sedan 2026-08-19 — förut
  // 300, vilket sorterade bort just de genomtänkta omdömena.
  const [utfallda, setUtfallda] = useState<Set<string>>(() => new Set());
  // Bilder som inte gick att ladda. lib/review-images reparerar den kända
  // orsaken (kontoprefix som saknas i sparade adresser), men en adress kan
  // falla av andra skäl — borttagen fil, moderering, CDN-fel. Utan det här
  // renderas <button> med en brusten bild inuti: en tom, klickbar knapp.
  // Precis den symptombilden rapporterades 2026-08-22.
  const [trasigaBilder, setTrasigaBilder] = useState<Set<string>>(() => new Set());
  const close = useCallback(() => setPhoto(null), []);

  useEffect(() => {
    if (!photo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [photo, close]);

  if (count === 0) return null;

  const INITIAL = 5;
  const shown = showAll ? reviews : reviews.slice(0, INITIAL);
  const summary = ratingSummary(count, average);

  return (
    <section className="sec revsec" id="recensioner">
      <div className="container">
        <div className="sechead">
          <div className="eyebrow">Vad kunderna säger</div>
          <h2>Kundrecensioner</h2>
        </div>

        {summary && (
          <div className="rev-summary">
            <Stars rating={summary.exact} />
            <strong>{summary.value}</strong> av 5
            <span className="rev-count"> · {summary.label}</span>
          </div>
        )}


        <ul className="rev-list">
          {shown.map((r) => {
            const alt = `Kundbild från ${r.displayName || "kund"}`;
            const utfalld = utfallda.has(r.reviewIdAE);
            return (
              <li key={r.reviewIdAE} className="rev-item">
                <div className="rev-item-head">
                  <Stars rating={r.rating} />
                  <span className="rev-author">{r.displayName}</span>
                  {/* ☠️ INGEN RAD MÄRKS. Raderna såg olika ut: egna kunders bar
                      "✓ Verifierat köp", övriga ingenting — så det enda omdöme
                      butiken själv fått stack ut ur en lista på tjugo.
                      Butiksägarens beslut 2026-09-19: alla omdömen gäller ett
                      genomfört köp, och listan ska se likadan ut hela vägen ned.
                      Upplysningen bärs av fotnoten under listan.
                      ☠️ Kommer märkningen tillbaka får den ALDRIG sättas på en
                      importerad rad — "✓ Verifierat köp" betyder ett köp i VÅR
                      butik, verifierat med token per order. Se
                      lib/review-source.ts, som fortfarande håller den regeln. */}
                  {r.date ? <span className="rev-date">{r.date.slice(0, 10)}</span> : null}
                </div>
                {/* Varianten recensenten köpte, på sidor med flera varianter
                    (lib/review-kopt.ts). Ingen märkning av vem som skrev. */}
                {r.kopt ? <div className="rev-kopt">Köpt: {r.kopt}</div> : null}
                <RecensionsText
                  text={r.text}
                  utfalld={utfalld}
                  onVaxla={() =>
                    setUtfallda((f) => {
                      const n = new Set(f);
                      if (n.has(r.reviewIdAE)) n.delete(r.reviewIdAE);
                      else n.add(r.reviewIdAE);
                      return n;
                    })
                  }
                />
                {r.imageUrls.some((u) => !trasigaBilder.has(u)) ? (
                  // En remsa, inte en enda bild. AliExpress-recensenter postar
                  // ofta flera foton och importen slängde alla utom den första
                  // fram till 2026-08-19; kunder som skriver hos oss kan bifoga
                  // upp till tre. För möbler — butikens dyraste kategori — är
                  // det skillnaden mellan en produktbild och att se varan
                  // monterad, i ett rum och i rätt skala.
                  //
                  // <button> och inte <img onClick>: tangentbord och skärmläsare
                  // behöver veta att bilderna går att öppna.
                  <div className="rev-photos">
                    {(() => {
                      // Räkna på de bilder som FAKTISKT visas. Annars säger
                      // skärmläsaren "bild 1 av 3" när en av dem är dold.
                      const synliga = r.imageUrls.filter((u) => !trasigaBilder.has(u));
                      return synliga.map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        className="rev-photo-btn"
                        onClick={() => setPhoto({ url, alt })}
                        aria-label={
                          synliga.length > 1
                            ? `${alt} – bild ${i + 1} av ${synliga.length}, visa större`
                            : `${alt} – visa större`
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="rev-photo"
                          src={url}
                          alt={alt}
                          loading="lazy"
                          onError={() =>
                            setTrasigaBilder((f) => (f.has(url) ? f : new Set(f).add(url)))
                          }
                        />
                      </button>
                      ));
                    })()}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {count > INITIAL && !showAll ? (
          <button type="button" className="rev-more" onClick={() => setShowAll(true)}>
            Visa alla {count} recensioner
          </button>
        ) : null}

        <p className="rev-disclaimer">
          Omdömen om produkten, skrivna av verifierade köpare.
        </p>
      </div>

      {/* Portal: revsec ligger i ett stacking-context, och utan portal skulle
          overlayen fångas där i stället för att täcka sidan. */}
      {photo && typeof document !== "undefined"
        ? createPortal(
            <div
              className="lightbox rev-lightbox"
              onClick={close}
              role="dialog"
              aria-modal="true"
              aria-label={photo.alt}
            >
              <button type="button" className="rev-lb-close" onClick={close} aria-label="Stäng">
                ×
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="rev-lb-img"
                src={photo.url}
                alt={photo.alt}
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}

/**
 * Textens hela höjd och höjden i klampen.
 *
 * ☠️ MÄT INTE MED scrollHeight I KLAMPEN. I dag räknar Chromium, WebKit och
 * Gecko de dolda raderna i scrollHeight, men CSS Overflow 4 säger att de inte
 * ska göra det, och Chromium har aviserat att -webkit-line-clamp ska följa
 * specen. Då hade scrollHeight blivit lika med clientHeight, och knappen hade
 * försvunnit från varje lång recension utan ett fel någonstans. Därför tas
 * klampen bort och läggs tillbaka i samma synkrona steg. Webbläsaren hinner
 * aldrig rita stycket utan klamp, och storleken är densamma igen innan
 * ResizeObserver tittar.
 */
function helOchKlampad(p: HTMLElement): { hel: number; klampad: number } {
  // Lägg aldrig på en klamp som inte fanns: en text utan klamp döljer ingenting.
  if (!p.classList.contains("rev-text-klamp")) return { hel: p.scrollHeight, klampad: p.scrollHeight };
  const klampad = p.clientHeight;
  p.classList.remove("rev-text-klamp");
  const hel = p.scrollHeight;
  p.classList.add("rev-text-klamp");
  return { hel, klampad };
}

/**
 * En recensions text med "Visa mer" bara där klampen faktiskt döljer något.
 * Regeln och varför den mäter står i lib/review-utfallning.ts.
 *
 * Mätningen görs bara när texten är hopfälld: en utfälld text klipps aldrig.
 * Den görs innan webbläsaren ritar (useLayoutEffect), så en recension som
 * renderas i webbläsaren, till exempel vid byte av produktsida, aldrig hinner
 * visa knappen först. En ResizeObserver mäter om när bredden ändras, till
 * exempel när mobilen vrids, så knappen kan komma tillbaka. Typsnittet kan
 * byta radbrytningar efter laddningen utan att stycket byter höjd, därför mäts
 * det också då.
 *
 * Tas knappen bort medan den har fokus, till exempel när en utfälld text fälls
 * ihop i en bredd där den ryms, hamnar fokus annars på <body> och en
 * skärmläsare tappar platsen. Stycket tar då emot fokus (tabIndex -1, alltså
 * inte i tabbordningen).
 */
function RecensionsText({
  text,
  utfalld,
  onVaxla,
}: {
  text: string;
  utfalld: boolean;
  onVaxla: () => void;
}) {
  const lang = klamppas(text);
  const ref = useRef<HTMLParagraphElement>(null);
  const knappRef = useRef<HTMLButtonElement>(null);
  const [doljer, setDoljer] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    const p = ref.current;
    if (!lang || utfalld || !p) return;
    let aktiv = true;
    const mat = () => {
      if (!aktiv) return;
      const doljerNu = klampenDoljer(helOchKlampad(p));
      if (!doljerNu && document.activeElement === knappRef.current) p.focus({ preventScroll: true });
      setDoljer(doljerNu);
    };
    mat();
    // En webbläsare utan ResizeObserver mäts en gång, i stället för att
    // komponenten kastar och tar sidan med sig.
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(mat);
    ro?.observe(p);
    document.fonts?.ready.then(mat, () => {});
    return () => {
      aktiv = false;
      ro?.disconnect();
    };
  }, [lang, utfalld, text]);

  return (
    <>
      <p ref={ref} tabIndex={-1} className={`rev-text${lang && !utfalld ? " rev-text-klamp" : ""}`}>
        {text}
      </p>
      {visaUtfallningsknapp({ lang, utfalld, doljer }) ? (
        <button ref={knappRef} type="button" className="rev-expand" aria-expanded={utfalld} onClick={onVaxla}>
          {utfalld ? "Visa mindre" : "Visa mer"}
        </button>
      ) : null}
    </>
  );
}
