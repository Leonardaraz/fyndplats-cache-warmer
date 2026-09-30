import type { Metadata } from "next";
import AngraForm from "../../components/angra-form";
import { jsonLdString } from "../../lib/seo";
import { TOTAL_SUMMARY, TOTAL_SHORT, TRIGGER, STATUTORY, VOLUNTARY, COMMON, COMPLAINT, COMPLAINT_SHORT, REFUND_TIME } from "../../lib/retur-policy";
import { Ikon, Svg } from "../../components/villkor-ikoner";
import s from "./angra-kop.module.css";

// Ångra köp (2026-09-30). Samma designspråk som /omoss. Formuläret
// (components/angra-form.tsx) är oförändrat och ligger kvar i en .prose-ruta,
// så dess stilar gäller precis som förut. Villkorstexterna kommer ordagrant ur
// lib/retur-policy.ts.

export const metadata: Metadata = {
  title: "Ångra köp",
  description:
    "Ångra ditt köp hos Fyndplats direkt på sajten. Välj order och artiklar, så får du ett mottagningskvitto med returadress och nästa steg.",
  alternates: { canonical: "https://www.fyndplats.se/angra-kop" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: "Fyndplats",
    url: "https://www.fyndplats.se/angra-kop",
    title: "Ångra köp",
    description:
      TOTAL_SHORT,
    images: [
      "https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg",
    ],
  },
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
    { "@type": "ListItem", position: 2, name: "Ångra köp", item: "https://www.fyndplats.se/angra-kop" },
  ],
};

export default function AngraKop() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />

      <section className="om-hero">
        <div className={`container ${s.hero}`}>
          <div className="eyebrow">Ångerrätt</div>
          <h1>Ångra ditt köp</h1>
          <p className="om-lede">
            Ändrat dig? Du har rätt att ångra ditt köp – och det ska vara lika enkelt som att handla. Fyll i din order nedan, välj vad du vill ångra, så får du direkt ett mottagningskvitto med returadress och nästa steg.
          </p>
          <div className="om-cta">
            <a className="btn btn-primary" href="#formular">Till formuläret</a>
            <a className="btn btn-ghost" href="#villkor">Så fungerar ångerrätten</a>
          </div>
        </div>
      </section>

      <section className={s.formsek}>
        <div className={`container ${s.formgrid}`}>
          <div className={`prose ${s.formkol} ${s.anker}`} id="formular">
            <AngraForm />
          </div>

          <aside className={s.korthet} aria-labelledby="korthet-rubrik">
            <h2 className={s.rubrik} id="korthet-rubrik">Det viktigaste i korthet</h2>
            <ul>
              <li>
                <span className={s.bock}><Svg d={Ikon.kalender} /></span>
                <div>
                  <h3>Totalt 30 dagar</h3>
                  <p>{TOTAL_SHORT}</p>
                </div>
              </li>
              <li>
                <span className={s.bock}><Svg d={Ikon.bock} /></span>
                <div>
                  <h3>Anmälan räknas</h3>
                  <p>{TRIGGER}</p>
                </div>
              </li>
              <li>
                <span className={s.bock}><Svg d={Ikon.kvitto} /></span>
                <div>
                  <h3>Kvitto direkt</h3>
                  <p>När du skickar din ångeranmälan får du automatiskt ett mottagningskvitto via e-post med ett ärendenummer.</p>
                </div>
              </li>
              <li>
                <span className={s.bock}><Svg d={Ikon.pengar} /></span>
                <div>
                  <h3>Återbetalning inom {REFUND_TIME}</h3>
                  <p>Efter att vi tagit emot och kontrollerat returen, till ditt ursprungliga betalmedel. Hur snabbt pengarna syns på kontot beror sedan på din bank.</p>
                </div>
              </li>
              <li>
                <span className={s.bock}><Svg d={Ikon.verktyg} /></span>
                <div>
                  <h3>Fel på varan?</h3>
                  <p>{COMPLAINT_SHORT}</p>
                </div>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section className={`om-sektion om-fragor-sek ${s.anker}`} id="villkor">
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Villkor</div>
              <h2>Så fungerar ångerrätten</h2>
            </div>
          </div>
          <div className={s.villkor}>
            <p className={s.ingress}>{TOTAL_SUMMARY}</p>
            <p className={s.utlosare}>{TRIGGER}</p>

            <div className={s.perioder}>
              {[STATUTORY, VOLUNTARY].map((p) => (
                <div className={`${s.kort} ${s.period}`} key={p.range}>
                  <span className={s.range}>{p.range}</span>
                  <h3>{p.label}</h3>
                  <p>{p.lead}</p>
                  <ul>{p.points.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
              ))}
            </div>

            <div className={s.kort}>
              <h3>Gäller under hela perioden</h3>
              <ul>
                {COMMON.map((p) => (
                  <li key={p}>{p}</li>
                ))}
                <li>
                  <strong>Återbetalning inom {REFUND_TIME}</strong> efter att vi tagit emot och
                  kontrollerat returen, till ditt ursprungliga betalmedel. Hur snabbt pengarna syns
                  på kontot beror sedan på din bank.
                </li>
              </ul>
            </div>

            <div className={s.kort}>
              <h3>{COMPLAINT.label}</h3>
              <p>{COMPLAINT.lead}</p>
              <ul>
                {COMPLAINT.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>

            <p className={s.lankar}>
              Läs mer på <a href="/returer">Returer &amp; ångerrätt</a> och i{" "}
              <a href="/kopvillkor">köpvillkoren</a>.
            </p>
          </div>
        </div>
      </section>

      <section className="om-sektion">
        <div className={`container ${s.kvitto}`}>
          <span className="om-ikon"><Svg d={Ikon.kvitto} /></span>
          <div>
            <div className="eyebrow">Efter anmälan</div>
            <h2>Mottagningskvitto</h2>
            <p>
              När du skickar din ångeranmälan får du automatiskt ett mottagningskvitto via e-post med
              ett ärendenummer. Kvittot är ditt bevis på att du ångrat köpet i tid – men är inte ett
              godkännande av returen i sig; vi behandlar ärendet och återkommer.
            </p>
          </div>
        </div>
      </section>

      <section className="om-slut">
        <div className={`container om-slut-inner ${s.slut}`}>
          <h2>Hela villkoren</h2>
          <p>
            Se även våra fullständiga <a href="/kopvillkor">köpvillkor</a> och{" "}
            <a href="/returer">returvillkor</a>.
          </p>
          <div className="om-cta">
            <a className="btn btn-primary" href="/returer">Returer &amp; ångerrätt</a>
            <a className="btn om-btn-ljus" href="/kopvillkor">Köpvillkor</a>
          </div>
        </div>
      </section>
    </>
  );
}
