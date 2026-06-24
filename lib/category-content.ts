// lib/category-content.ts
// Redaktionellt innehåll (intro-text + FAQ) per HUVUDKATEGORI, för att ge
// /kategori/<huvudslug>-sidorna riktig brödtext och long-tail-SEO i stället för
// bara en produktlistning (audit 2026-06-24, "tunn kategoritext").
//
// NYCKEL = exakt live-SLUG (verifierat mot www.fyndplats.se/sitemap.xml 2026-06-24),
// INTE namn — slugs är stabila och unika, så ingen åäö-/"&"-matchning kan slå fel.
// Renderas BARA när:
//   1) slugen finns här, OCH
//   2) det är en huvudkategori (active.parentId === null) i
//      app/kategori/[slug]/page.tsx.
// Subkategorier, REA/Populära och okända kategorier får alltså inget block
// (oförändrat beteende). En kategori som ännu inte är live (t.ex. Mode efter
// Kina-utfasningen) renderar inget förrän den får ≥1 synlig produkt och sidan
// slutar redirecta — då dyker innehållet upp automatiskt (self-revive-vänligt).
//
// Innehållet är medvetet UNIKT per kategori (egen P1/P2 + egna frågor) för att
// undvika duplicerad boilerplate; de gemensamma trygghets-/fraktfakta är
// omformulerade per kategori. Alla påståenden är sanna för Fyndplats: EU-lager
// med 3–7 arbetsdagars leverans, fri frakt över 499 kr, Klarna, 30 dagars öppet
// köp, svensk kundtjänst som svarar inom 24 h på vardagar.

export type CategoryContent = {
  intro: string[]; // stycken (~150–200 ord totalt)
  faq: { q: string; a: string }[]; // 3 frågor per kategori
};

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  "elektronik-tillbehor": {
    intro: [
      "Elektronik och smarta tillbehör ska göra vardagen enklare – inte krångligare. Hos Fyndplats hittar du noga utvalda prylar inom mobiltillbehör, laddare och kablar, dator och gaming samt hörlurar och ljud, till priser som inte sticker i ögonen. Vi väljer produkter som faktiskt håller måttet: laddare med rätt effekt, kablar i hållbara material och ljudtillbehör som låter bättre än prislappen antyder.",
      "När du handlar elektronik lönar det sig att tänka på kompatibilitet och anslutningar. Kontrollera vilken kontakt din enhet använder (USB-C, Lightning eller micro-USB), hur många watt din laddare behöver leverera och om tillbehöret ska tåla att slängas i väskan varje dag. I varje produktbeskrivning samlar vi specifikationerna så att du snabbt ser om prylen passar just din telefon, dator eller hörlur.",
      "Alla beställningar skickas från EU-lager med leverans inom 3–7 arbetsdagar, och du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur vet jag att ett tillbehör passar min telefon eller dator?",
        a: "Kolla anslutningstypen (USB-C, Lightning eller micro-USB) och eventuell modellkompatibilitet i produktbeskrivningen. Vi listar specifikationerna för varje produkt – är du osäker svarar vår svenska kundtjänst normalt inom 24 timmar på vardagar.",
      },
      {
        q: "Hur lång är leveranstiden på elektronik?",
        a: "Vi skickar från EU-lager, vilket ger en leveranstid på 3–7 arbetsdagar. Du får en spårbar leverans och kan följa paketet hela vägen hem.",
      },
      {
        q: "Vad gäller om en pryl inte fungerar som tänkt?",
        a: "Du har alltid 30 dagars öppet köp. Skulle något vara fel eller inte motsvara beskrivningen löser vi det – hör av dig till kundtjänst så hjälper vi dig vidare.",
      },
    ],
  },

  "hem-inredning": {
    intro: [
      "Ett hem blir personligt i detaljerna. Hos Fyndplats samlar vi prisvärda fynd för hela hemmet – belysning, förvaring och organisering, dekoration, badrum och hemtextil, smarta hushållsapparater och praktiska verktyg för hemmafixaren. Oavsett om du vill fräscha upp ett rum eller lösa ett vardagsproblem hittar du noga utvalda produkter som gör skillnad utan att kosta en förmögenhet.",
      "Tänk på rummets mått och ljus innan du köper. En golvlampa eller stämningsfull belysning sätter tonen i vardagsrummet, medan förvaringskorgar och hyllor skapar ordning i hallen och garderoben. För badrummet och sovrummet lyfter mjuk hemtextil i rätt färg känslan direkt. Mått och material står i varje produktbeskrivning så att du vet att det passar innan du beställer.",
      "Du handlar tryggt med Klarna och fri frakt över 499 kr. Beställningarna skickas från EU-lager med 3–7 arbetsdagars leverans, och du har alltid 30 dagars öppet köp om du ändrar dig.",
    ],
    faq: [
      {
        q: "Hur vet jag att inredningsdetaljen passar i mitt rum?",
        a: "Mått och material anges i varje produktbeskrivning. Mät ytan där produkten ska stå eller hänga innan du beställer, så slipper du överraskningar. Är du osäker hjälper vår kundtjänst dig gärna.",
      },
      {
        q: "Levererar ni större inredningsartiklar?",
        a: "Ja. Allt skickas från EU-lager med spårbar leverans inom 3–7 arbetsdagar. Frakten är fri vid köp över 499 kr.",
      },
      {
        q: "Kan jag ångra ett köp om färgen inte blev som jag tänkt mig?",
        a: "Absolut – du har 30 dagars öppet köp. Kontakta kundtjänst så hjälper vi dig med returen.",
      },
    ],
  },

  "kok-husgerad": {
    intro: [
      "Rätt redskap gör matlagningen roligare. I Kök & Husgeråd hittar du noga utvalda köksredskap och tillbehör, köksmaskiner och apparater samt servering och glas – prisvärda fynd för både vardagsmiddagen och när du dukar upp för gäster.",
      "När du fyller på köket lönar det sig att tänka långsiktigt. Knivar och skärbrädor i hållbara material håller i åratal, en bra köksmaskin sparar tid varje vecka och matchande glas och serveringsdetaljer lyfter dukningen. Vi anger material, mått och skötselråd i produktbeskrivningarna så att du enkelt väljer rätt – och så att dina favoriter håller länge.",
      "Alla beställningar skickas från EU-lager med leverans inom 3–7 arbetsdagar. Du betalar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Tål produkterna maskindisk?",
        a: "Det varierar mellan material. Vi anger skötselråd, inklusive om en produkt tål maskindisk, i produktbeskrivningen. Vid tveksamhet rekommenderar vi handdisk för längre livslängd.",
      },
      {
        q: "Hur snabbt får jag mina köksprylar?",
        a: "Leveranstiden är 3–7 arbetsdagar från vårt EU-lager, med spårbar frakt. Fri frakt gäller vid köp över 499 kr.",
      },
      {
        q: "Kan jag returnera en köksmaskin om den inte passar mina behov?",
        a: "Ja, du har 30 dagars öppet köp. Hör av dig till kundtjänst så hjälper vi dig med returen.",
      },
    ],
  },

  "barn-familj": {
    intro: [
      "Det bästa till barnen ska vara tryggt, hållbart och roligt. I Barn & Familj samlar vi genomtänkta favoriter inom baby och småbarn samt leksaker och spel – prisvärda fynd som tål lek och växer med barnet.",
      "När du handlar till barn är säkerhet och ålder viktigast. Kontrollera rekommenderad ålder och materialinnehåll i produktbeskrivningen, särskilt för de allra minsta. Pedagogiska träleksaker, aktivitetsleksaker och spel som tränar motorik och fantasi är populära val som håller längre än en snabb trend.",
      "Vi skickar från EU-lager med leverans inom 3–7 arbetsdagar och spårbar frakt. Du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp – så att du hinner känna efter att allt blev rätt.",
    ],
    faq: [
      {
        q: "Hur vet jag vilken ålder en leksak passar för?",
        a: "Rekommenderad ålder anges i produktbeskrivningen tillsammans med material. Följ alltid åldersmärkningen, särskilt för småbarn där smådelar kan vara olämpliga.",
      },
      {
        q: "Är leksakerna säkra och i bra material?",
        a: "Vi väljer produkter med fokus på hållbarhet och säkerhet och anger materialinnehåll i beskrivningen. Har du en specifik fråga svarar vår kundtjänst normalt inom 24 timmar.",
      },
      {
        q: "Vad gäller för leverans och retur?",
        a: "Leverans sker inom 3–7 arbetsdagar från EU-lager. Du har 30 dagars öppet köp om något inte passar.",
      },
    ],
  },

  "skonhet-halsa": {
    intro: [
      "Egentid behöver inte vara dyr. I Skönhet & Hälsa hittar du noga utvalda produkter inom hudvård och ansikte, massage och återhämtning, hår och rakning samt kropp och välbefinnande – för en enkel rutin som får dig att må bra i vardagen.",
      "Bygg din rutin utifrån dina behov. Till ansiktet lönar det sig att tänka på hudtyp och vad du vill åstadkomma, oavsett om det är återfuktning, rengöring eller lite extra lyster. Massageverktyg och redskap för återhämtning hjälper mot spänningar efter en lång dag. Vi beskriver användning och innehåll i varje produkt så att du vet vad du köper.",
      "Beställningarna skickas från EU-lager med 3–7 arbetsdagars leverans. Du betalar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur vet jag om en hudvårdsprodukt passar min hudtyp?",
        a: "Vi anger användningsområde och innehåll i produktbeskrivningen. Tänk på din hudtyp (torr, normal, blandhy eller känslig) och introducera gärna en ny produkt i taget. Är du osäker, börja försiktigt.",
      },
      {
        q: "Hur lång är leveranstiden?",
        a: "Vi skickar från EU-lager med en leveranstid på 3–7 arbetsdagar och spårbar frakt. Fri frakt gäller över 499 kr.",
      },
      {
        q: "Kan jag returnera skönhetsprodukter?",
        a: "Du har 30 dagars öppet köp. Av hygienskäl bör förseglade produkter vara oöppnade vid retur – hör av dig till kundtjänst så guidar vi dig.",
      },
    ],
  },

  "husdjur": {
    intro: [
      "Våra fyrbenta vänner förtjänar det bästa. I kategorin Husdjur samlar vi prisvärda fynd för hund och katt – allt från lek och tillbehör, selar, koppel och transport till pälsvård, mat- och vattenskålar samt mysiga bäddar och tillbehör.",
      "Tänk på storlek och vikt när du väljer. En sele eller bädd ska sitta rätt för att vara bekväm, och rätt skål eller matautomat gör vardagen smidigare för både dig och djuret. Vi anger mått och material i produktbeskrivningarna så att du hittar något som passar just din hund eller katt.",
      "Allt skickas från EU-lager med leverans inom 3–7 arbetsdagar och spårbar frakt. Du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur väljer jag rätt storlek på sele, koppel eller bädd?",
        a: "Mät ditt djur och jämför med måtten i produktbeskrivningen. För selar är bröstomfånget viktigast, för bäddar djurets längd. Är du mellan storlekar, välj gärna den större.",
      },
      {
        q: "Hur snabbt levereras husdjursprodukterna?",
        a: "Leveranstiden är 3–7 arbetsdagar från vårt EU-lager, med spårning hela vägen. Fri frakt över 499 kr.",
      },
      {
        q: "Kan jag byta om produkten inte passar mitt djur?",
        a: "Ja, du har 30 dagars öppet köp. Kontakta kundtjänst så hjälper vi dig med byte eller retur.",
      },
    ],
  },

  "sport-fritid": {
    intro: [
      "Vare sig du tränar hemma, packar för bilen eller ger dig ut i naturen ska utrustningen funka utan krångel. I Sport & Fritid hittar du smarta fynd inom träning och gym, friluftsliv och resa samt bil och cykel – prisvärt och noga utvalt.",
      "Tänk på hur och var du ska använda produkten. Till hemmaträningen är hållbarhet och rätt vikt avgörande, medan friluftsutrustning gärna ska vara lätt och tåla väder och vind. För bilen och cykeln gör rätt tillbehör resan tryggare och smidigare. Specifikationer som mått, material och kapacitet står i varje produktbeskrivning.",
      "Vi skickar från EU-lager med leverans inom 3–7 arbetsdagar. Du betalar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur vet jag att utrustningen håller för regelbunden träning?",
        a: "Vi anger material och i förekommande fall maxvikt eller belastning i produktbeskrivningen. Välj utifrån hur ofta och hårt du tränar – tveka inte att fråga kundtjänst om du vill ha råd.",
      },
      {
        q: "Hur lång är leveranstiden?",
        a: "Leverans sker inom 3–7 arbetsdagar från EU-lager, med spårbar frakt. Fri frakt gäller vid köp över 499 kr.",
      },
      {
        q: "Kan jag returnera om produkten inte motsvarar förväntningarna?",
        a: "Ja, du har 30 dagars öppet köp. Hör av dig så hjälper vi dig vidare.",
      },
    ],
  },

  "tradgard-utemobler": {
    intro: [
      "En fin uteplats och en grönskande odling gör hela skillnaden under den ljusa delen av året. I Trädgård & Utemöbler hittar du prisvärda fynd för balkongen, altanen och trädgården – från odlingslådor och spaljéer till praktiska lösningar som gör uterummet trivsammare.",
      "Tänk på utrymme och väder när du planerar. Mät ytan på balkongen eller altanen innan du köper, och välj material som tål att stå ute. En odlingslåda med spaljé tar vara på höjden i ett litet utrymme, medan smarta odlings- och förvaringslösningar gör det enklare att lyckas med grönsaker, örter och klätterväxter. Mått och material står i varje produktbeskrivning.",
      "Allt skickas från EU-lager med leverans inom 3–7 arbetsdagar och spårbar frakt. Du handlar tryggt med Klarna, fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Tål produkterna att stå ute året runt?",
        a: "Det beror på materialet. Vi anger om en produkt är avsedd för utomhusbruk i produktbeskrivningen. Många trädetaljer mår bra av att tas in eller skyddas under vintern för längre livslängd.",
      },
      {
        q: "Passar produkterna även på en liten balkong?",
        a: "Många av våra lösningar är gjorda för små ytor – mät din balkong och jämför med produktens mått. Odlingslådor med spaljé utnyttjar höjden och tar liten golvyta.",
      },
      {
        q: "Hur fungerar leverans och retur?",
        a: "Leverans sker inom 3–7 arbetsdagar från EU-lager. Du har 30 dagars öppet köp om du ändrar dig.",
      },
    ],
  },

  // Mode & Accessoarer är f.n. inte live (tömdes vid Kina-utfasningen och
  // redirectar till /butik). Innehållet ligger redo så att sidan får riktig
  // brödtext automatiskt så fort kategorin återupplivas med EU-produkter.
  "mode-accessoarer": {
    intro: [
      "Rätt accessoar lyfter en hel outfit. I Mode & Accessoarer hittar du tidlösa fynd inom smycken, klockor och solglasögon, väskor och necessärer samt accessoarer som kompletterar din stil – prisvärt och noga utvalt.",
      "Satsa på det som håller över tid. Ett slätt kedjehalsband, ett par klassiska solglasögon eller en väska i rätt storlek funkar säsong efter säsong. Tänk på material och mått i produktbeskrivningen, särskilt om du är känslig för vissa metaller eller vill ha en väska som rymmer det du bär varje dag.",
      "Vi skickar från EU-lager med leverans inom 3–7 arbetsdagar. Du betalar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilket material är smyckena gjorda av?",
        a: "Material anges i produktbeskrivningen. Är du känslig för vissa metaller, leta efter nickelfria alternativ och läs beskrivningen noga innan du köper.",
      },
      {
        q: "Hur snabbt levereras accessoarerna?",
        a: "Leveranstiden är 3–7 arbetsdagar från EU-lager, med spårbar frakt. Fri frakt över 499 kr.",
      },
      {
        q: "Kan jag returnera om något inte passar?",
        a: "Ja, du har 30 dagars öppet köp. Kontakta kundtjänst så hjälper vi dig med returen.",
      },
    ],
  },
};

/** Redaktionellt innehåll för en huvudkategori-slug, annars undefined. */
export function categoryContent(slug: string): CategoryContent | undefined {
  return CATEGORY_CONTENT[slug];
}
