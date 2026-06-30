import type { Metadata } from "next";
import { ContentPage } from "../../components/content";

export const metadata: Metadata = {
  title: "Vanliga frågor",
  description: "Svar på vanliga frågor om beställning, betalning, frakt och returer hos Fyndplats. Hitta hjälpen du behöver snabbt.",
  alternates: { canonical: "https://www.fyndplats.se/vanliga-fragor" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/vanliga-fragor", title: "Vanliga frågor", description: "Svar på vanliga frågor om beställning, betalning, frakt och returer hos Fyndplats. Hitta hjälpen du behöver snabbt.", images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85,enc_avif/file.jpg"] },
};

const faqs: { q: string; a: string }[] = [
  { q: "Vad kostar frakten?", a: "Standardfrakt är 19 kr inom Sverige. Vid köp över 499 kr är frakten helt fri. Vi skickar med spårbar leverans hela vägen hem." },
  { q: "Hur lång är leveranstiden?", a: "Vanlig leveranstid är 3–7 arbetsdagar från beställning. Du får en spårningskod via mejl så snart paketet lämnar vårt lager. Under storhelger kan det ta något längre." },
  { q: "Måste jag betala tull eller importavgift på min beställning?", a: "Nej. Alla våra produkter skickas från lager inom EU, så EU:s nya importtull och förtullningsavgift för paket som skickas in i EU utifrån (från 1 juli 2026) tillkommer inte på din beställning. Moms (25 %) ingår alltid i priset du ser, och frakten är fri över 499 kr – under det visas fraktavgiften tydligt i kassan. Mer om detta finns på sidan EU-lager-garanti (fyndplats.se/eu-lager-garanti)." },
  { q: "Varifrån skickas varorna – kommer något utanför EU?", a: "Alla våra produkter kommer garanterat från lager inom EU. Vi skickar aldrig direkt från länder utanför EU, så du slipper ny importtull, förtullningsavgift och extra väntan i tull." },
  { q: "Vilka betalningsmetoder accepterar ni?", a: "Vi använder Klarna för alla betalningar – betala direkt (kort, Swish, autogiro, banköverföring), faktura 14 dagar eller dela upp betalningen." },
  { q: "Kan jag ångra mitt köp / returnera?", a: "Ja, du har 30 dagars öppet köp hos Fyndplats. Svensk distansavtalslag ger 14 dagars ångerrätt – vi förlänger frivilligt till 30 dagar. Enklast ångrar du direkt på sidan Ångra köp (fyndplats.se/angra-kop): fyll i din order, välj vilka artiklar du vill ångra och skicka, så får du ett automatiskt mottagningskvitto med returadressen. Ångerrätten gäller även innan paketet hunnit fram. Returfrakten betalas av kunden (välj valfri leveranstjänst, gärna spårbar) och produkten ska vara oanvänd och i originalförpackning. Vi återbetalar inom 5–10 bankdagar efter mottagen retur. Är varan trasig eller fel är det istället en reklamation – då står Fyndplats för returfrakten." },
  { q: "Erbjuder ni faktura?", a: "Ja, via Klarna kan du välja faktura med 14 dagars betalningstid. Du får först varan och betalar sen – ingen extra avgift för faktura." },
  { q: "Vad gör jag om produkten är skadad vid leverans?", a: "Kontakta oss inom 7 dagar på info@fyndplats.com med ditt ordernummer och en bild på skadan. Vi löser det snabbt – antingen genom ny produkt eller återbetalning via Klarna." },
  { q: "Hur spårar jag min beställning?", a: "När ditt paket lämnar vårt lager skickar vi en mejlbekräftelse med en spårningskod. Klicka på länken i mejlet eller gå till transportörens webbplats och ange koden." },
  { q: "Vad händer om jag inte hämtar mitt paket?", a: "Paket som inte hämtas inom utlämningstiden returneras till oss. Vi kan då ta ut en administrativ avgift på upp till 160 kr för leverantörens hanterings- och fraktkostnad. Avgiften gäller dock inte om du har ångrat köpet – då är det en retur enligt din ångerrätt. Hör av dig direkt om du fått förhinder." },
  { q: "Skickar ni utanför Sverige?", a: "För närvarande skickar vi bara inom Sverige. Vi tittar på att utöka till resten av Norden – håll utkik på vår Facebook- och Instagramsida." },
  { q: "Har ni en fysisk butik?", a: "Fyndplats är en renodlad webbutik – allt sker online via fyndplats.se. Vårt kontor och lager finns på Bergviksgatan 10 i Södertälje, men vi tar inte emot besök eller upphämtning där." },
  { q: "Hur skyddar ni mina personuppgifter?", a: "Vi följer GDPR och svensk dataskyddslag. Dina uppgifter används endast för att hantera din beställning, kundkontakt och nyhetsbrev. Vi delar aldrig uppgifter med tredje part utöver det som krävs för leverans och betalning. Läs hela vår sekretesspolicy på fyndplats.se/sekretesspolicy." },
  { q: "Hur kontaktar jag kundtjänst?", a: "Snabbast når du oss via mejl: info@fyndplats.com. Du kan också ringa 073-663 09 90 vardagar 09:00–17:00, eller använda kontaktformuläret på sidan Kontakta oss. Vi svarar normalt inom 24 timmar." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function VanligaFragor() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContentPage
        eyebrow="Kundservice"
        title="Vanliga frågor"
        lead="Du frågar, vi svarar. Här hittar du snabbt svar om beställning, betalning, frakt och returer."
      >
        <div className="faq">
          {faqs.map((f, i) => (
            <details key={i} {...(i === 0 ? { open: true } : {})}>
              <summary>{f.q}</summary>
              <div className="ans">{f.a}</div>
            </details>
          ))}
        </div>
      </ContentPage>
    </>
  );
}
