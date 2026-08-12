// lib/category-seo.ts
// Sökordsanpassad <title> + metabeskrivning per kategori-SLUG.
//
// BAKGRUND (Search Console, aug 2026): kategorisidorna fick ihop 13 visningar
// totalt medan produktsidorna drog 1 566/dag. Orsaken var inte teknisk utan
// språklig — varje sida hette exakt som kategorin heter internt i Wix, och
// metabeskrivningen var en mall med bara namnet utbytt:
//
//   <title>Friluftsliv & Resa | Fyndplats</title>
//   <meta name="description" content="Köp Friluftsliv & Resa online hos …">
//
// "Friluftsliv & Resa" är en hyllskylt, ingen sökfras. Ingen googlar den. Här
// ligger i stället det KUNDER faktiskt söker på ("campingutrustning",
// "hundskål", "klösträd"), medan kategorins namn lever kvar oförändrat i menyn,
// brödsmulorna och sidans <h1> — bara det Google matchar mot byts ut.
//
// PRINCIPER
//  1. Nischat före brett. "campingutrustning" hellre än "camping"; "klösträd"
//     hellre än "husdjursprodukter". Breda kategoriord ägs av Clas Ohlson,
//     Jula, Biltema och Amazon — en ung domän rankar inte där, men på den
//     smalare frasen finns en verklig chans.
//  2. Sanningsenligt. Varje titel speglar vad som FAKTISKT finns i kategorin
//     (verifierat mot live-sortimentet 2026-08-12). Vi lovar inte "smycken" i
//     en kategori som bara har en sminkväska.
//  3. Unik beskrivning per sida. Mallen gav 36 nästan identiska beskrivningar;
//     Google visar sällan en sån och den skiljer inte sidorna åt.
//  4. Titel ≤ 48 tecken — layoutens template lägger på " | Fyndplats" (12), och
//     Google klipper runt 60. Beskrivning 120–160 tecken.
//
// NYCKEL = live-slug (verifierad mot sitemap.xml). Saknas en slug här faller
// sidan tillbaka på den gamla mallen — nya kategorier fungerar alltså direkt,
// bara utan sökordsoptimering tills de läggs till.

export type CategorySeo = { title: string; description: string };

export const CATEGORY_SEO: Record<string, CategorySeo> = {
  // ── Huvudkategorier ────────────────────────────────────────────────────────
  "elektronik-tillbehor": {
    title: "Elektroniktillbehör – gaming, mobil & ljud",
    description:
      "Prisvärda elektroniktillbehör: gamingstolar, laddare, kablar och mobiltillbehör. Skickas från EU-lager på 3–7 dagar. Fri frakt över 499 kr.",
  },
  "hem-inredning": {
    title: "Heminredning – förvaring, belysning & textil",
    description:
      "Heminredning till bra pris: förvaringsmöbler, golvlampor, hemtextil, hushållsapparater och verktyg. Leverans 3–7 dagar från EU-lager, 30 dagars öppet köp.",
  },
  "kok-husgerad": {
    title: "Köksredskap & köksmaskiner till hemmet",
    description:
      "Köksredskap, köksmaskiner och serveringsdetaljer till vardag och fest. Noga utvalda fynd med fri frakt över 499 kr och 30 dagars öppet köp.",
  },
  "barn-familj": {
    title: "Leksaker & babyprylar till barn",
    description:
      "Leksaker, elbilar, bilbanor och babyprylar för hela familjen. Åldersmärkning i varje beskrivning. Leverans 3–7 dagar, 30 dagars öppet köp.",
  },
  "skonhet-halsa": {
    title: "Hudvård, massage & frisörtillbehör",
    description:
      "Skönhet och hälsa till bra pris: ansiktsmasker, massagebänkar, frisörtillbehör och redskap för återhämtning. Fri frakt över 499 kr, Klarna.",
  },
  husdjur: {
    title: "Hundtillbehör & kattillbehör – allt för djuret",
    description:
      "Klösträd, hundgårdar, selar, hundvagnar och skålar till hund, katt och smådjur. Mått i varje beskrivning. Leverans 3–7 dagar från EU-lager.",
  },
  "sport-fritid": {
    title: "Träning, camping & cykeltillbehör",
    description:
      "Träningsutrustning för hemmagymmet, campingprylar och tillbehör till bil och cykel. Prisvärt och noga utvalt. Fri frakt över 499 kr.",
  },
  "tradgard-utemobler": {
    title: "Trädgård & utemöbler – odling och uteplats",
    description:
      "Odlingslådor, spaljéer och praktiska lösningar för balkong, altan och trädgård. Mått och material i varje beskrivning. 30 dagars öppet köp.",
  },
  "mode-accessoarer": {
    title: "Väskor, kepsar & accessoarer",
    description:
      "Väskor, necessärer, kepsar och accessoarer som håller säsong efter säsong. Skickas från EU-lager på 3–7 dagar med fri frakt över 499 kr.",
  },

  // ── Underkategorier ───────────────────────────────────────────────────────
  "baby-smabarn": {
    title: "Babybadkar, gunghästar & babyprylar",
    description:
      "Babybadkar, gunghästar och praktiska prylar till de minsta. Åldersrekommendation och material i varje beskrivning. Leverans 3–7 dagar, öppet köp.",
  },
  "badrum-hemtextil": {
    title: "Badrumstillbehör & hemtextil",
    description:
      "Badrumstillbehör, handdukar och hemtextil som lyfter känslan i badrum och sovrum. Mått och material anges. Fri frakt över 499 kr, 30 dagars öppet köp.",
  },
  belysning: {
    title: "Golvlampor, vägglampor & LED-belysning",
    description:
      "Golvlampor med hyllor, vägglampor för utomhus och LED-armaturer till garage och verkstad. Sockel och IP-klass anges. Leverans 3–7 dagar.",
  },
  "bil-cykel": {
    title: "Cykeltillbehör & biltillbehör",
    description:
      "Cykelpumpar, sadlar, cykelryggsäckar, barncyklar och garagedomkrafter. Specifikationer i varje beskrivning. Fri frakt över 499 kr, öppet köp 30 dagar.",
  },
  "burar-klader-tillbehor": {
    title: "Hundgård, hundgrind & burar för smådjur",
    description:
      "Hopfällbara hundgårdar, hundgrindar, hundtrappor, kaninhagar och hamsterburar. Mått i varje beskrivning så du väljer rätt. Leverans 3–7 dagar.",
  },
  "dator-gaming": {
    title: "Gamingstolar & datortillbehör",
    description:
      "Gamingstolar med fotstöd och tillbehör till datorn. Maxvikt och justermöjligheter anges i beskrivningen. Klarna, fri frakt över 499 kr.",
  },
  "dekoration-prydnad": {
    title: "Dekoration & prydnad till hemmet",
    description:
      "Konstgjorda växter, prydnadsdetaljer och dekoration som gör hemmet personligt. Mått och material anges. Leverans 3–7 dagar från EU-lager.",
  },
  "forvaring-organisering": {
    title: "Förvaring – byrå, skoskåp & garagehylla",
    description:
      "Byrålådor, skoskåp, garagehyllor, hurtsar och smarta förvaringslösningar till hall, kontor och garage. Mått anges alltid. 30 dagars öppet köp.",
  },
  "friluftsliv-resa": {
    title: "Campingutrustning & friluftsprylar",
    description:
      "Campingstolar, liggunderlag, campingvaskar, bryggstegar och solel till husvagnen. Vikt och mått i varje beskrivning. Fri frakt över 499 kr.",
  },
  "har-rakning": {
    title: "Frisörtillbehör & salongsutrustning",
    description:
      "Arbetsstolar för salong, torkhuvar, frisörväskor och redskap för hår och rakning. Höjdmått och effekt anges. Leverans 3–7 dagar, öppet köp.",
  },
  "hudvard-ansikte": {
    title: "Ansiktsmasker & hudvård",
    description:
      "Sheetmasks och hudvård för ansiktet till vardagsrutinen. Innehåll och användning anges i beskrivningen. Fri frakt över 499 kr, Klarna.",
  },
  hushallsapparater: {
    title: "Hushållsapparater & smarta maskiner",
    description:
      "Ultraljudstvättar och praktiska hushållsapparater som sparar tid. Kapacitet, effekt och mått anges. Leverans 3–7 dagar från EU-lager.",
  },
  "kalas-fest": {
    title: "Kalas & fest – sockervadd och partyprylar",
    description:
      "Sockervaddsmaskiner och partyprylar som gör kalaset minnesvärt. Effekt och användning anges i beskrivningen. Fri frakt över 499 kr.",
  },
  keps: {
    title: "Keps herr & dam – baseballkepsar",
    description:
      "Baseballkepsar med lång skärm för sol och sommar. Storlek och material anges i beskrivningen. Leverans 3–7 dagar, 30 dagars öppet köp.",
  },
  "koksmaskiner-apparater": {
    title: "Köksmaskiner & köksapparater",
    description:
      "Köksmaskiner och apparater som sparar tid i vardagen. Effekt, kapacitet och skötselråd anges i varje beskrivning. Fri frakt över 499 kr.",
  },
  "koksredskap-tillbehor": {
    title: "Köksredskap & kökstillbehör",
    description:
      "Köksredskap och tillbehör i hållbara material för vardagsmatlagningen. Material och skötselråd anges. Leverans 3–7 dagar, öppet köp 30 dagar.",
  },
  "kropp-valbefinnande": {
    title: "Massagebänkar & hjälpmedel för kroppen",
    description:
      "Hopfällbara massagebänkar, rollatorer och redskap för kropp och välbefinnande. Maxvikt och mått anges alltid. Fri frakt över 499 kr.",
  },
  "lek-tillbehor-for-husdjur": {
    title: "Klösträd, klöspelare & hundleksaker",
    description:
      "Klösträd med grotta och hängmatta, väggmonterade klöspelare och automatiska bollkastare för hund. Höjd och material anges. Leverans 3–7 dagar.",
  },
  "leksaker-spel": {
    title: "Leksaker – elbilar, bilbanor & spel",
    description:
      "Elbilar och eltraktorer för barn, bilbanor, rutschkanor och spel. Rekommenderad ålder anges alltid. Leverans 3–7 dagar, 30 dagars öppet köp.",
  },
  "massage-aterhamtning": {
    title: "Massagebänkar & massageutrustning",
    description:
      "Hopfällbara massagebänkar i trä och aluminium för behandling hemma eller i salong. Mått, vikt och sektioner anges. Fri frakt över 499 kr.",
  },
  "mat-vattenskalar": {
    title: "Hundskålar & kattskålar",
    description:
      "Mat- och vattenskålar till hund och katt i praktiska material. Volym och mått anges i beskrivningen. Leverans 3–7 dagar från EU-lager.",
  },
  mobiltillbehor: {
    title: "Mobiltillbehör – laddare, kablar & skal",
    description:
      "Mobiltillbehör till vardagen: laddare, kablar och skydd. Kolla anslutningstyp i beskrivningen så tillbehöret passar din telefon. Öppet köp 30 dagar.",
  },
  "selar-koppel-transport": {
    title: "Hundsele, koppel & hundtransport",
    description:
      "Hundselar, koppel, hundramper till bilen och cykelvagnar för hund. Bröstomfång och maxvikt anges så du väljer rätt storlek. Fri frakt över 499 kr.",
  },
  "servering-glas": {
    title: "Servering & glas till dukningen",
    description:
      "Serveringsdetaljer och glas som lyfter dukningen till vardag och fest. Material och skötselråd anges. Leverans 3–7 dagar, 30 dagars öppet köp.",
  },
  "traning-gym": {
    title: "Träningsutrustning hemma – hantlar & gym",
    description:
      "Hantelset, hexhantlar, motionscyklar och studsmattor till hemmagymmet. Vikt och maxbelastning anges alltid. Fri frakt över 499 kr, Klarna.",
  },
  "vaskor-necessarer": {
    title: "Väskor & necessärer",
    description:
      "Väskor och necessärer med smart förvaring för resan och vardagen. Mått och material anges i beskrivningen. Leverans 3–7 dagar, öppet köp.",
  },
  "verktyg-hemmafix": {
    title: "Verktyg & hemmafix – vinschar och fräsar",
    description:
      "Handvinschar för båt och trailer, CNC-fräsar, laserstativ och garagehyllor för hemmafixaren. Kapacitet och mått anges. Fri frakt över 499 kr.",
  },
};

/** Sökordsanpassad titel/beskrivning för en kategori-slug, annars undefined. */
export function categorySeo(slug: string): CategorySeo | undefined {
  return CATEGORY_SEO[slug];
}
