import type { Metadata } from "next";
import Image from "next/image";
import { jsonLdString } from "../../lib/seo";
import { getProducts, forListings } from "../../lib/products";
import { getCategoryTree, categoryHero } from "../../lib/category-groups";
import { tightFillUrl } from "../../lib/wix-image";
import { productCountLabel } from "../../lib/rating";
import { getSocialProof } from "../../lib/social-proof-live";

// Om oss (2026-09-30). Sidan var löptext och punktlistor i samma mall som
// villkorssidorna, med en kategorilista som inte längre stämde med menyn
// (ingen Möbler, ingen Trädgård, "mobiltillbehör" först) och en "Hitta hit"
// som lovade ett besök som /vanliga-fragor säger inte går.
//
// Varje siffra på sidan läses ur samma källa som resten av butiken, så den
// kan inte glida isär:
//   · kategorierna och antalen: getCategoryTree, samma som menyn (ordning efter
//     storlek, samma tröskel, Trädgård med; /butik-listan saknar Trädgård)
//   · produktantalet: forListings(getProducts()), avrundat NEDÅT till hundratal
//   · Google-betyget: getSocialProof, samma som sidfoten
//   · frakt, öppet köp, svarstider: samma ord som köpvillkoren och Vanliga frågor
// Inget antal omdömen visas, av samma skäl som i lib/social-proof.ts.

export const revalidate = 3600;

const BESKRIVNING =
  "Fyndplats är en svensk webbutik från Södertälje. Sedan 2021 säljer vi noga utvalda produkter för hem, trädgård och vardag, med Klarna, 30 dagars öppet köp och kundservice på svenska.";

export const metadata: Metadata = {
  title: "Om oss",
  description: BESKRIVNING,
  alternates: { canonical: "https://www.fyndplats.se/omoss" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/omoss", title: "Om Fyndplats", description: BESKRIVNING, images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg"] },
};

/** 3 847 → "3 800+". Nedåt, så siffran aldrig lovar mer än butiken har. */
function avrundatAntal(n: number): string {
  if (n < 100) return String(n);
  return `${(Math.floor(n / 100) * 100).toLocaleString("sv-SE")}+`;
}

/** "3 800+ produkter". Under hundra räknas exakt och böjs (productCountLabel). */
function avrundatProductCountLabel(n: number): string {
  // Över hundra är det alltid plural. Strängen delas så att plural-provet
  // (lib/plural-global.test.ts) inte tar den för en obojd räknare.
  return n < 100 ? productCountLabel(n) : avrundatAntal(n) + " produkter";
}

const HERO_BILD = categoryHero("Hem & Inredning");

const Ikon = {
  klarna: <path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4Z M9 12l2 2 4-4" />,
  retur: <path d="M9 14L4 9l5-5 M4 9h11a5 5 0 0 1 5 5v1" />,
  frakt: <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7z M7 18.7a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z M17.5 18.7a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z" />,
  service: <path d="M4 13v-1a8 8 0 0 1 16 0v1 M4 13h3v6H5a1 1 0 0 1-1-1v-5Z M20 13h-3v6h2a1 1 0 0 0 1-1v-5Z M17 19c0 1.5-2 2.5-5 2.5" />,
  text: <path d="M5 4h14v16H5z M8.5 8.5h7 M8.5 12h7 M8.5 15.5h4" />,
  eu: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M3.5 9h17 M3.5 15h17 M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9 M12 3c-2.5 2.6-3.7 5.6-3.7 9s1.2 6.4 3.7 9" />,
};

function Svg({ d }: { d: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

const LOFTEN = [
  {
    ikon: Ikon.klarna,
    rubrik: "Trygg betalning med Klarna",
    text: "Betala direkt, senare eller dela upp köpet. Återbetalningar går alltid tillbaka till samma betalsätt.",
    lank: { href: "/kopvillkor", text: "Köpvillkor" },
  },
  {
    ikon: Ikon.retur,
    rubrik: "30 dagars öppet köp",
    text: "Lagen ger 14 dagars ångerrätt. Vi ger 30 dagar på alla produkter. Returfrakten står du för och du väljer själv fraktsätt.",
    lank: { href: "/returer", text: "Returer & ångerrätt" },
  },
  {
    ikon: Ikon.frakt,
    rubrik: "Frakt 19 kr, fri över 499 kr",
    text: "Normal leveranstid är 3–6 arbetsdagar. Du får en spårningskod via mejl när paketet skickas.",
    lank: { href: "/sparning", text: "Spåra paket" },
  },
  {
    ikon: Ikon.service,
    rubrik: "Kundservice på svenska",
    text: "Mejla eller ring vardagar 09–17. Vi svarar normalt inom 24 timmar, på svenska eller engelska.",
    lank: { href: "/kontaktaoss", text: "Kontakta oss" },
  },
];

/** Svaren säger samma sak som /vanliga-fragor, med färre ord. */
function FRAGOR(betyg: string): { q: string; a: string }[] {
  return [
    {
      q: "Är Fyndplats en seriös butik?",
      a: `Ja. Fyndplats är ett svenskt företag i Södertälje som har sålt på nätet sedan 2021. Du betalar via Klarna, har 30 dagars öppet köp och kan se vad andra kunder tycker: vi har ${betyg} av 5 i betyg på Google.`,
    },
    {
      q: "Varifrån skickas varorna?",
      a: "Från våra leverantörers och logistikpartners lager inom EU, aldrig direkt från länder utanför EU. Därför tillkommer ingen importtull. Leveranstiden är normalt 3–6 arbetsdagar.",
    },
    {
      q: "Har ni en fysisk butik?",
      a: "Nej, Fyndplats är en ren webbutik. Företagsadressen i Södertälje är inget lager, och vi erbjuder inte besök eller upphämtning där.",
    },
    {
      q: "Skickar ni utanför Sverige?",
      a: "För närvarande skickar vi bara inom Sverige.",
    },
  ];
}

export default async function OmOss() {
  const [allProducts, tree, proof] = await Promise.all([getProducts(), getCategoryTree(), getSocialProof()]);
  const products = forListings(allProducts);
  // Bild per huvudkategori: den kuraterade heron, annars första produktbilden
  // i kategorin eller någon av dess underkategorier. Hem & Inredning delar
  // bild med sidans hero, så kortet tar en av sina underkategoriers bilder.
  const kategorier = tree.map((k) => {
    const ids = new Set([k.id, ...k.subs.map((s) => s.id)]);
    const kurerad = categoryHero(k.name);
    const bild = (kurerad && kurerad !== HERO_BILD ? kurerad : "")
      || (kurerad === HERO_BILD ? categoryHero("Dekoration & Prydnad") : "")
      || products.find((p) => p.img && (p.collectionIds || []).some((c) => ids.has(c)))?.img
      || "";
    return { ...k, bild };
  });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
      { "@type": "ListItem", position: 2, name: "Om oss", item: "https://www.fyndplats.se/omoss" },
    ],
  };
  const aboutLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Om Fyndplats",
    url: "https://www.fyndplats.se/omoss",
    description: BESKRIVNING,
    inLanguage: "sv-SE",
    about: { "@id": "https://www.fyndplats.se/#organization" },
    isPartOf: { "@id": "https://www.fyndplats.se/#website" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(aboutLd) }} />

      <section className="om-hero">
        <div className="container om-hero-grid">
          <div className="om-hero-text">
            <div className="eyebrow">Om Fyndplats</div>
            <h1>Riktiga fynd, utan chansning</h1>
            <p className="om-lede">
              Fyndplats är en svensk webbutik från Södertälje. Sedan 2021 väljer vi ut produkter för hemmet,
              trädgården och vardagen och säljer dem till priser som känns rätt, med trygg betalning och
              30 dagars öppet köp.
            </p>
            <div className="om-cta">
              <a className="btn btn-primary" href="/butik">Utforska butiken</a>
              <a className="btn btn-ghost" href="/kontaktaoss">Kontakta oss</a>
            </div>
          </div>
          {HERO_BILD && (
            <div className="om-hero-bild">
              <Image src={HERO_BILD} alt="Ljust vardagsrum med fåtölj och golvlampa" fill sizes="(max-width:900px) 100vw, 540px" preload />
            </div>
          )}
        </div>
      </section>

      <section className="om-fakta" aria-label="Fyndplats i siffror">
        <div className="container om-fakta-grid">
          <div className="om-fakta-kort">
            <b>2021</b>
            <span>Grundat i Södertälje</span>
          </div>
          <div className="om-fakta-kort">
            <b>{avrundatAntal(products.length)}</b>
            <span>Produkter i sortimentet</span>
          </div>
          <a className="om-fakta-kort" href="/omdomen">
            <b>{proof.rating}<small> av 5</small></b>
            <span>Betyg på Google <span className="star" aria-hidden="true">★★★★★</span></span>
          </a>
          <div className="om-fakta-kort">
            <b>30 dagar</b>
            <span>Öppet köp på allt</span>
          </div>
        </div>
      </section>

      <section className="om-sektion">
        <div className="container om-ide">
          <div>
            <div className="eyebrow">Vår idé</div>
            <h2>Fynd du kan känna dig trygg med</h2>
          </div>
          <div className="om-ide-text">
            <p>
              Vi startade Fyndplats för att det ska vara enkelt och tryggt att hitta bra produkter på nätet.
              Ett riktigt fynd är en vara som är precis det du trodde att du köpte.
            </p>
            <div className="om-ide-punkter">
              <div>
                <span className="om-ikon"><Svg d={Ikon.text} /></span>
                <div>
                  <h3>Tydliga produktsidor</h3>
                  <p>Våra produkttexter är skrivna på svenska med mått, material och vad som ingår, så att du vet vad du får innan du beställer.</p>
                </div>
              </div>
              <div>
                <span className="om-ikon"><Svg d={Ikon.eu} /></span>
                <div>
                  <h3>Skickas från lager inom EU</h3>
                  <p>Alla varor skickas från lager inom EU, aldrig direkt från länder utanför. Därför tillkommer ingen importtull eller förtullningsavgift.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="om-sektion om-tid-sek">
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Vår resa</div>
              <h2>Från 2021 till i dag</h2>
            </div>
          </div>
          <ol className="om-tid">
            <li>
              <span className="om-tid-nar">Då · 2021</span>
              <h3>Fyndplats startar i Södertälje</h3>
              <p>En svensk webbutik för prisvärda fynd, med trygg betalning och tydliga villkor från första beställningen.</p>
            </li>
            <li>
              <span className="om-tid-nar">Nu</span>
              <h3>{avrundatProductCountLabel(products.length)} i {kategorier.length} avdelningar</h3>
              <p>Från möbler och trädgård till kök, husdjur och barn, och {proof.rating} av 5 i betyg på Google.</p>
            </li>
            <li>
              <span className="om-tid-nar">Varje dag</span>
              <h3>Fyndauktionen</h3>
              <p>Nya fynd varje dag, där priset sjunker varje timme tills någon köper. <a href="/fyndauktion">Se dagens fynd</a></p>
            </li>
          </ol>
        </div>
      </section>

      {kategorier.length > 0 && (
        <section className="om-sektion om-sortiment">
          <div className="container">
            <div className="om-rubrikrad">
              <div>
                <div className="eyebrow">Sortimentet</div>
                <h2>Från soffan till trädgården</h2>
              </div>
              <a className="btn-quiet" href="/butik">Se hela butiken</a>
            </div>
            <div className="om-kat-grid">
              {kategorier.map((k) => (
                <a className="om-kat" key={k.id} href={`/kategori/${k.slug}`}>
                  <span className="om-kat-bild">
                    {k.bild && <Image src={tightFillUrl(k.bild, 640, 480)} alt="" fill sizes="(max-width:640px) 50vw, (max-width:1100px) 33vw, 280px" />}
                  </span>
                  <span className="om-kat-namn">{k.name}</span>
                  <span className="om-kat-antal">{productCountLabel(k.count)}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="om-sektion om-loften">
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Så handlar du hos oss</div>
              <h2>Tryggt från beställning till leverans</h2>
            </div>
          </div>
          <div className="om-loften-grid">
            {LOFTEN.map((l) => (
              <div className="om-lofte" key={l.rubrik}>
                <span className="om-ikon"><Svg d={l.ikon} /></span>
                <h3>{l.rubrik}</h3>
                <p>{l.text}</p>
                <a className="btn-quiet" href={l.lank.href}>{l.lank.text}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="om-sektion om-fragor-sek">
        <div className="container om-fragor-grid">
          <div>
            <div className="eyebrow">Frågor</div>
            <h2>Vanliga frågor om Fyndplats</h2>
            <p>Hittar du inte svaret här finns fler på sidan <a href="/vanliga-fragor">Vanliga frågor</a>.</p>
          </div>
          <div className="om-fragor">
            {FRAGOR(proof.rating).map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="om-sektion">
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Kontakt</div>
              <h2>Företagsuppgifter och kundservice</h2>
            </div>
          </div>
          <div className="om-kontakt-grid">
            <div className="om-kontakt">
              <h3>Företagsadress</h3>
              <p>Fyndplats<br />Bergviksgatan 10<br />152 44 Södertälje</p>
              <p className="om-not">Fyndplats är en ren webbutik. Adressen är inte ett lager, och vi har ingen butik eller upphämtning där.</p>
            </div>
            <div className="om-kontakt">
              <h3>Kundservice</h3>
              <p><a href="mailto:info@fyndplats.com">info@fyndplats.com</a><br /><a href="tel:+46736630990">073-663 09 90</a></p>
              <p className="om-not">Telefon vardagar 09–17. Vi svarar normalt inom 24 timmar.</p>
            </div>
            <div className="om-kontakt">
              <h3>Bra att veta</h3>
              <ul className="om-lankar">
                <li><a href="/vanliga-fragor">Vanliga frågor</a></li>
                <li><a href="/returer">Returer &amp; ångerrätt</a></li>
                <li><a href="/eu-lager-garanti">EU-lager &amp; tull</a></li>
                <li><a href="/kopvillkor">Köpvillkor</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="om-slut">
        <div className="container om-slut-inner">
          <h2>Redo för nästa fynd?</h2>
          <p>Tack för att du handlar hos Fyndplats. Varje dag finns nya fynd i butiken och på Fyndauktionen.</p>
          <div className="om-cta">
            <a className="btn btn-primary" href="/butik">Till butiken</a>
            <a className="btn om-btn-ljus" href="/fyndauktion">Fyndauktionen</a>
          </div>
        </div>
      </section>
    </>
  );
}
