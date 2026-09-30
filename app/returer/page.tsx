import type { Metadata } from "next";
import { jsonLdString } from "../../lib/seo";
import { TOTAL_SUMMARY, TOTAL_SHORT, TIMELINE, TRIGGER, STATUTORY, VOLUNTARY, COMMON, COMPLAINT, REFUND_SENTENCE, REFUND_TIME } from "../../lib/retur-policy";
import { SKRYMMANDE_RETURKOSTNAD } from "../../lib/retur-frakt";
import { Ikon, Svg } from "../../components/villkor-ikoner";
import s from "./returer.module.css";

// Returer (2026-09-30). Samma designspråk som /omoss: hero, faktarad, korta
// punkter överst och stegen som kort. Villkoren står ordagrant som förut; de
// kommer ur lib/retur-policy.ts och lib/retur-frakt.ts, och
// lib/retur-policy-global.test.ts kräver att den här sidan renderar dem själv
// (den är avtalstext och får inte bara peka vidare).

export const metadata: Metadata = {
  title: "Returer & ångerrätt",
  description: "Totalt 30 dagar att ångra eller returnera hos Fyndplats: 14 dagars ångerrätt, sedan öppet köp. Så anmäler, packar och skickar du din retur.",
  alternates: { canonical: "https://www.fyndplats.se/returer" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/returer", title: "Returer & ångerrätt", description: "Totalt 30 dagar att ångra eller returnera hos Fyndplats: 14 dagars ångerrätt, sedan öppet köp. Så anmäler, packar och skickar du din retur.", images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg"] },
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
    { "@type": "ListItem", position: 2, name: "Returer & ångerrätt", item: "https://www.fyndplats.se/returer" },
  ],
};

export default function Returer() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />

      <section className="om-hero">
        <div className={`container ${s.hero}`}>
          <div className="eyebrow">Kundservice</div>
          <h1>Så här gör du en retur</h1>
          <p className="om-lede">{TOTAL_SUMMARY}</p>
          <div className="om-cta">
            <a className="btn btn-primary" href="/angra-kop">Ångra köp</a>
            <a className="btn btn-ghost" href="#steg">Så gör du, steg för steg</a>
          </div>
        </div>
      </section>

      <section className="om-fakta" aria-label="Returer i korthet">
        <div className="container om-fakta-grid">
          <div className="om-fakta-kort">
            <b>30 dagar</b>
            <span>Totalt att ångra eller returnera</span>
          </div>
          {TIMELINE.map((t) => (
            <div className="om-fakta-kort" key={t.range}>
              <b style={{ whiteSpace: "nowrap" }}>{t.range}</b>
              <span>{t.label}</span>
            </div>
          ))}
          <div className="om-fakta-kort">
            {/* "2–3 arbetsdagar": talet stort, enheten liten, som på kundtjänst. */}
            <b>{REFUND_TIME.split(" ")[0]}<small> {REFUND_TIME.split(" ").slice(1).join(" ")}</small></b>
            <span>Till återbetalning, från att returen tagits emot och kontrollerats</span>
          </div>
        </div>
      </section>

      <section className="om-sektion">
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Sammanfattning</div>
              <h2>Det viktigaste i korthet</h2>
            </div>
          </div>
          <ul className={s.korthet}>
            <li>
              <span className={s.bock}><Svg d={Ikon.bock} /></span>
              <div>
                <h3>Anmälan avgör perioden</h3>
                <p>{TRIGGER}</p>
              </div>
            </li>
            <li>
              <span className={s.bock}><Svg d={Ikon.bock} /></span>
              <div>
                <h3>Ångra även innan paketet kommit</h3>
                <p>Ångerrätten gäller även innan paketet hunnit fram. Enklast anmäler du via vår <a href="/angra-kop">ångerfunktion</a>.</p>
              </div>
            </li>
            <li>
              <span className={s.bock}><Svg d={Ikon.bock} /></span>
              <div>
                <h3>Du står för returfrakten</h3>
                <p>Returfrakten betalas av kunden. Är varan trasig eller felaktig är det en reklamation, och då står Fyndplats för returkostnaden.</p>
              </div>
            </li>
            <li>
              <span className={s.bock}><Svg d={Ikon.bock} /></span>
              <div>
                <h3>Pengarna tillbaka</h3>
                <p>{REFUND_SENTENCE}</p>
              </div>
            </li>
            <li>
              <span className={s.bock}><Svg d={Ikon.bock} /></span>
              <div>
                <h3>Dag 15–30 har egna villkor</h3>
                <p>Det frivilliga öppna köpet har villkor och en avgift som inte gäller under den lagstadgade ångerfristen. <a href="#villkor">Se returvillkoren</a>.</p>
              </div>
            </li>
            <li>
              <span className={s.bock}><Svg d={Ikon.bock} /></span>
              <div>
                <h3>Fel på varan</h3>
                <p>Du har enligt konsumentköplagen (2022:260) tre års reklamationsrätt på fel som fanns vid leveransen. <a href="#reklamation">Så reklamerar du</a>.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section className={`om-sektion om-tid-sek ${s.anker}`} id="steg">
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Returen</div>
              <h2>Steg för steg</h2>
            </div>
          </div>

          <div className={s.notis}>
            <p><strong>Vill du ångra ditt köp?</strong> Enklast gör du det via vår <a href="/angra-kop">ångerfunktion</a> – fyll i din order, välj vilka artiklar du vill ångra och skicka. Du får direkt ett automatiskt mottagningskvitto med returadress och nästa steg. Ångerrätten gäller <strong>även innan paketet hunnit fram</strong>.</p>
          </div>

          <ol className={`om-tid ${s.steg}`}>
            <li>
              <span className="om-tid-nar">Steg 1</span>
              <h3>Anmäl returen</h3>
              <p>Använd vår <a href="/angra-kop">ångerfunktion</a>, eller mejla <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> med ditt <strong>ordernummer</strong>, <strong>vilken produkt</strong> du vill returnera och <strong>anledning</strong> (frivilligt). Du får en automatisk bekräftelse med returadressen och nästa steg.</p>
            </li>
            <li>
              <span className="om-tid-nar">Steg 2</span>
              <h3>Packa produkten säkert</h3>
              <p>Använd originalförpackningen när det går — den skyddar varan bäst på vägen tillbaka. Lägg med en lapp med ditt ordernummer och namn så vi kan koppla returen rätt.</p>
            </li>
            <li>
              <span className="om-tid-nar">Steg 3</span>
              <h3>Skicka tillbaka paketet</h3>
              <p>Skicka till returadressen du fick i bekräftelsemejlet. <strong>Returfrakten betalas av kunden</strong> — du bokar själv hos valfri transportör som tar emot varans storlek och vikt. Vi rekommenderar <strong>spårbar leverans</strong> så du har bevis på avsändning.</p>
              <p className={s.liten}>{SKRYMMANDE_RETURKOSTNAD}</p>
            </li>
            <li>
              <span className="om-tid-nar">Steg 4</span>
              <h3>Skicka oss spårningsnumret</h3>
              <p>Svara på bekräftelsemejlet med ditt spårningsnummer så håller vi koll på returen.</p>
            </li>
            <li>
              <span className="om-tid-nar">Steg 5</span>
              <h3>Återbetalning</h3>
              <p>{REFUND_SENTENCE}</p>
            </li>
          </ol>
        </div>
      </section>

      <section className={`om-sektion om-fragor-sek ${s.anker}`} id="villkor">
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Villkor</div>
              <h2>Returvillkor</h2>
            </div>
          </div>
          <div className={s.villkor}>
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
                {COMMON.map((p) => <li key={p}>{p}</li>)}
                <li>Skicka med spårning och spara inlämningskvittot. Kan du visa att paketet lämnats in står Fyndplats för risken om det försvinner på vägen.</li>
              </ul>
            </div>

            <div className={`${s.kort} ${s.anker}`} id="reklamation">
              <h3>{COMPLAINT.label}</h3>
              <p>{COMPLAINT.lead}</p>
              <ul>{COMPLAINT.points.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section className="om-slut">
        <div className={`container om-slut-inner ${s.slut}`}>
          <h2>Frågor om en retur?</h2>
          <p>Mejla <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> — vi svarar normalt inom 24 timmar på vardagar.</p>
          <div className="om-cta">
            <a className="btn btn-primary" href="/angra-kop">Ångra köp</a>
            <a className="btn om-btn-ljus" href="/kopvillkor">Köpvillkor</a>
          </div>
        </div>
      </section>
    </>
  );
}
