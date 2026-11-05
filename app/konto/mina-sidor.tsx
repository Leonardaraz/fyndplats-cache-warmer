// Mina sidor (E1-8): medlemskortet, beloppet och vägen till nästa nivå, när
// nivån kan ändras, nivåstegen och ordrarna med det som räknas. Inga priser
// ändras ännu, och det står uttryckligen (specen, "E1 lanseras tyst").
//
// PREMIUM (Leonard 2026-11-04): kortet i nivåns egen färg, stapeln med
// nivåernas gränser, nyckeltal i stället för stycken, ordrarna med sina varor
// och produktbilder, och regeltexten hopfälld längst ner. Ordrarna och köpen
// som räknas var förut två listor med samma ordrar; nu bär varje order sitt
// bidrag till nivån.

import type { ReactNode } from "react";
import Image from "next/image";
import { dagSomText, kronor, stockholmsDag, type Nivalage } from "@/lib/medlem/niva";
import { maskeradEpost } from "@/lib/medlem/inloggning";
import type { MinaSidor, OrderPaMinaSidor } from "@/lib/medlem/konto";
import { arHogstaNivan, inteRaknadText, visaKvitto, visaSparningVantas, visaUppmaning } from "@/lib/medlem/visning";
import { Medlemskort, nivaNyckel } from "./medlemskort";
import { KopIgen } from "./kop-igen";
import { SparadeKorgar } from "./sparade-korgar";
import type { SparadKorgVy } from "@/lib/medlem/sparade";
import s from "./konto.module.css";

const STATUS: Record<OrderPaMinaSidor["status"], { text: string; ton: "ok" | "varning" | "neutral" }> = {
  betald: { text: "Betald", ton: "ok" },
  "delvis-aterbetald": { text: "Delvis återbetald", ton: "varning" },
  aterbetald: { text: "Återbetald", ton: "neutral" },
  avbruten: { text: "Avbruten", ton: "neutral" },
  obetald: { text: "Inte betald", ton: "varning" },
};

/** Texten tills medlemspriset finns i kassan (E2). */
export const RABATT_INTE_AN = "Medlemsrabatten gäller ännu inte i kassan.";

/** Produktens bild och adress ur katalogen, per Wix-produkt-id. */
export type Produktbilder = Record<string, { img?: string; slug?: string }>;

/** E3: kontots sparade varukorgar, och om nya får sparas (växeln för E2/E3). */
export type SparadeKorgarVy = { korgar: SparadKorgVy[]; kanSpara: boolean };

const MANAD_AR = new Intl.DateTimeFormat("sv-SE", { month: "long", year: "numeric", timeZone: "Europe/Stockholm" });

function andel(l: Nivalage): number {
  if (!l.nasta) return 1;
  const fran = l.niva.franOre;
  const till = l.nasta.niva.franOre;
  return Math.min(1, Math.max(0, (l.kOre - fran) / Math.max(1, till - fran)));
}

function Paket() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
      <path
        d="M12 2.5 3.5 7v10L12 21.5 20.5 17V7L12 2.5Zm0 2.3 5.9 3.1L12 11 6.1 7.9 12 4.8ZM5.5 9.6l5.5 2.9v6.3l-5.5-2.9V9.6Zm7.5 9.2v-6.3l5.5-2.9v6.3L13 18.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MinaSidorVy({
  data,
  bilder: produkter = {},
  foretag,
  handlarSom,
  sparade,
}: {
  data: MinaSidor;
  bilder?: Produktbilder;
  /** E3: företagskontots ruta, när prisväxeln släpper fram den. */
  foretag?: ReactNode;
  /** E3: företagets namn när kontot handlar som företaget. */
  handlarSom?: string | null;
  /** E3: sparade varukorgar; saknas när växeln är av och kontot inte har några, eller när de inte gick att läsa. */
  sparade?: SparadeKorgarVy;
}) {
  const { lage, regler, ordrar, medlem } = data;
  const raknas = new Map(lage.raknade.map((r) => [r.orderId, r]));
  const sedan = medlem.skapad && !Number.isNaN(Date.parse(medlem.skapad)) ? MANAD_AR.format(new Date(medlem.skapad)) : null;
  const nuIx = regler.nivaer.findIndex((n) => n.namn === lage.niva.namn);
  const procent = Math.round(andel(lage) * 100);
  const behalla = lage.sankning ? Math.max(0, lage.niva.franOre - lage.sankning.kOre) : 0;

  return (
    <div className={s.portal}>
      {/* En div, inte <header>: globals.css gör varje header klistrad (sidhuvudet). */}
      <div className={s.huvud}>
        <div>
          <p className={s.ogonbryn}>Mina sidor</p>
          <h1 className={s.rubrik}>Välkommen tillbaka</h1>
          <p className={s.vem}>Inloggad som {maskeradEpost(medlem.epost)}</p>
          {handlarSom ? (
            <p className={s.handlarSom}>
              Du handlar som <a href="#foretag">{handlarSom}</a>
            </p>
          ) : null}
        </div>
        <form action="/api/konto/ut" method="post">
          <button type="submit" className={s.utknapp}>
            Logga ut
          </button>
        </form>
      </div>

      <div className={s.topp}>
        <section aria-label="Ditt medlemskort" className={s.kortyta}>
          <Medlemskort niva={lage.niva.namn} rad1={maskeradEpost(medlem.epost)} rad2={sedan ? `Medlem sedan ${sedan}` : undefined} />
        </section>

        <section className={`${s.kort} ${s.summakort}`} aria-labelledby="ditt-belopp">
          <p className={s.liten_etikett} id="ditt-belopp">
            Handlat de senaste 365 dagarna
          </p>
          <p className={s.summa}>{kronor(lage.kOre)}</p>
          {lage.nasta ? (
            <>
              <div
                className={s.stapel}
                role="progressbar"
                aria-label={`Mot ${lage.nasta.niva.namn}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={procent}
              >
                <div className={s.stapelFyllning} style={{ width: `${Math.max(procent, 3)}%` }} />
              </div>
              <div className={s.stapelEtiketter}>
                <span>
                  {lage.niva.namn} · {kronor(lage.niva.franOre)}
                </span>
                <span>
                  {lage.nasta.niva.namn} · {kronor(lage.nasta.niva.franOre)}
                </span>
              </div>
              <p className={s.kvarStor}>
                <strong>{kronor(lage.nasta.kvarOre)}</strong> kvar till {lage.nasta.niva.namn}
              </p>
            </>
          ) : arHogstaNivan(lage, regler) ? (
            <p className={s.kvarStor}>Du har den högsta nivån. Tack för att du handlar hos oss.</p>
          ) : null}
          {lage.manuell ? (
            <p className={s.not}>
              Din nivå är satt av kundtjänst
              {lage.manuell.tillDag !== null ? ` till och med ${dagSomText(lage.manuell.tillDag)}` : ""}.
            </p>
          ) : null}
          <p className={s.snart}>
            <span className={s.snartPrick} aria-hidden="true" />
            Medlemspriser i kassan kommer snart. Din nivå räknas redan nu.
          </p>
        </section>
      </div>

      <dl className={s.fakta}>
        <div className={s.faktum}>
          <dt>Köp som räknas</dt>
          <dd>{lage.raknade.length}</dd>
        </div>
        <div className={s.faktum}>
          <dt>Äldsta köpet räknas till</dt>
          <dd>{lage.aldstaFallerUr !== null ? dagSomText(lage.aldstaFallerUr - 1) : "Inga köp än"}</dd>
        </div>
        <div className={s.faktum}>
          <dt>{lage.niva.namn} gäller till</dt>
          <dd>{lage.sankning ? dagSomText(lage.sankning.dag - 1) : "Tills vidare"}</dd>
        </div>
      </dl>

      {lage.sankning && visaUppmaning(lage.sankning.dag, lage.dag) ? (
        <p className={s.uppmaning}>
          Handla för <strong>{kronor(behalla)}</strong> före {dagSomText(lage.sankning.dag)} så behåller du {lage.niva.namn}.
          Annars blir din nivå {lage.sankning.niva.namn} den dagen. <a href="/butik">Till butiken</a>
        </p>
      ) : lage.raknade.length === 0 ? (
        <p className={s.uppmaning}>
          Ditt nästa köp räknas från dagen du betalar. <a href="/butik">Till butiken</a>
        </p>
      ) : null}

      <h2 className={s.underrubrik}>Nivåerna</h2>
      <ol className={s.stege}>
        {regler.nivaer.map((n, i) => (
          <li
            key={n.namn}
            className={s.steg}
            data-niva={nivaNyckel(n.namn)}
            data-tillstand={i < nuIx ? "uppnadd" : i === nuIx ? "din" : "kommande"}
            aria-current={i === nuIx ? "true" : undefined}
          >
            <span className={s.medalj} aria-hidden="true" />
            <span className={s.stegNamn}>
              {n.namn}
              {i === nuIx ? <span className={s.dinNiva}>Din nivå</span> : null}
            </span>
            <span className={s.stegFran}>{n.franOre === 0 ? "Alla medlemmar" : `Från ${kronor(n.franOre)}`}</span>
            <span className={s.stegRabatt}>{n.rabattProcent > 0 ? `${n.rabattProcent} % medlemsrabatt` : "Nivåns start"}</span>
          </li>
        ))}
      </ol>
      <p className={s.not}>{RABATT_INTE_AN} Rabatterna gäller från att medlemspriserna startar.</p>

      <h2 className={s.underrubrik}>Dina ordrar</h2>
      {ordrar.length ? (
        <ul className={s.ordrar}>
          {ordrar.map((o) => {
            const r = raknas.get(o.orderId);
            const st = STATUS[o.status];
            const bilder = o.varor
              .map((v) => (v.produktId ? produkter[v.produktId] : undefined))
              .filter((b): b is { img: string; slug?: string } => Boolean(b?.img))
              .slice(0, 3);
            const forsta = o.varor[0];
            const fler = o.varor.length - 1;
            const lank = forsta?.produktId ? produkter[forsta.produktId]?.slug : undefined;
            const alder = lage.dag - stockholmsDag(o.bestalld);
            return (
              <li key={o.orderId} className={s.order}>
                <div className={s.orderBilder} data-antal={bilder.length || 1}>
                  {bilder.length ? (
                    bilder.map((b, i) => <Image key={i} src={b.img} alt="" width={64} height={64} className={s.orderBild} />)
                  ) : (
                    <span className={s.orderIkon}>
                      <Paket />
                    </span>
                  )}
                </div>
                <div className={s.orderInfo}>
                  <div className={s.orderRad}>
                    <span className={s.orderNr}>Order {o.ordernummer}</span>
                    <span className={s.orderSumma}>{kronor(o.totaltOre)}</span>
                  </div>
                  <div className={s.orderRad2}>
                    <span>{dagSomText(stockholmsDag(o.bestalld))}</span>
                    <span className={s.chip} data-ton={st.ton}>
                      {st.text}
                    </span>
                  </div>
                  {forsta ? (
                    <p className={s.orderVaror}>
                      {/* Namnet kortas efter två rader; antalet och "och N varor till" står
                          på egen rad, så att de syns också efter ett långt namn. */}
                      <span className={s.orderVaraNamn}>{lank ? <a href={`/produkt/${lank}`}>{forsta.namn}</a> : forsta.namn}</span>
                      {forsta.antal > 1 || fler > 0 ? (
                        <span className={s.orderVaraFler}>
                          {[forsta.antal > 1 ? `${forsta.antal} st` : "", fler > 0 ? `och ${fler} ${fler === 1 ? "vara" : "varor"} till` : ""]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  <p className={s.orderRaknas} data-raknas={r ? "ja" : "nej"}>
                    {r ? (
                      <>
                        Räknas med <strong>{kronor(r.bidragOre)}</strong> till och med {dagSomText(r.fallerUrDag - 1)}
                      </>
                    ) : (
                      inteRaknadText(o.status, alder)
                    )}
                  </p>
                  {!o.sparning.length && visaSparningVantas(o.status, alder) ? (
                    <p className={s.orderNot}>Spårning kommer när paketet har skickats.</p>
                  ) : null}
                  {o.sparning.length || o.kopIgen || visaKvitto(o.status) ? (
                    <div className={s.orderKnappar}>
                      {o.sparning.map((tn, i) => (
                        <a key={tn} className={s.sparknapp} href={`/sparning?tn=${encodeURIComponent(tn)}`}>
                          Spåra paketet{o.sparning.length > 1 ? ` ${i + 1}` : ""}
                        </a>
                      ))}
                      {o.kopIgen ? <KopIgen ordernummer={o.ordernummer} /> : null}
                      {visaKvitto(o.status) ? (
                        <a
                          className={s.kopIgen}
                          href={`/api/konto/kvitto/${encodeURIComponent(o.ordernummer)}`}
                          target="_blank"
                          rel="noopener"
                          aria-label={`Kvitto för order ${o.ordernummer} som PDF`}
                        >
                          Kvitto (PDF)
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={`${s.kort} ${s.tomt}`}>
          <p className={s.tomRubrik}>Inga ordrar än</p>
          <p className={s.tom}>Ordrar du lägger med {maskeradEpost(medlem.epost)} visas här, med spårning och vad de räknas för.</p>
        </div>
      )}

      {sparade ? <SparadeKorgar korgar={sparade.korgar} kanSpara={sparade.kanSpara} /> : null}

      {foretag}

      {/* Mejlen om nivån går att stänga av (marknadsföringslagen); länken i
          mejlen leder hit eller till /konto/avregistrera. */}
      <div className={s.installning} id="mejl">
        <p className={s.installningText}>
          <strong>Mejl om din nivå: {medlem.nivamejl === false ? "av" : "på"}.</strong> Vi mejlar när du når en ny nivå och två
          veckor innan din nivå sjunker.
        </p>
        <form action="/api/konto/nivamejl" method="post">
          <input type="hidden" name="pa" value={medlem.nivamejl === false ? "1" : "0"} />
          <button type="submit" className={s.utknapp}>
            {medlem.nivamejl === false ? "Slå på" : "Stäng av"}
          </button>
        </form>
      </div>

      <details className={s.forklaring}>
        <summary>Så räknas din nivå</summary>
        <p>
          Beloppet är betalda varor med moms de senaste 365 dagarna, minus det du har fått tillbaka för returer. Frakt och
          avgifter räknas inte.
        </p>
        <p>
          Ett köp räknas från dagen du betalade och i 365 dagar. En återbetalning dras av från dagen den görs. Faller ett
          köp ur så att nivån sjunker, mejlar vi dig två veckor innan.
        </p>
      </details>

      <p className={s.hjalp}>
        Frågor om ditt konto eller en order? Mejla <a href="mailto:info@fyndplats.com">info@fyndplats.com</a>.
      </p>
    </div>
  );
}
