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

  // Möbler skapades i Wix 2026-09-23 (se MAIN_GROUPS i category-groups.ts).
  mobler: {
    title: "Möbler – fåtöljer, kontorsstolar & soffor",
    description:
      "Möbler till vardagsrum, kontor, kök och sovrum: fåtöljer, kontorsstolar, soffor, matbord och sängramar. Mått i varje beskrivning. Fri frakt över 499 kr.",
  },

  // ── Underkategorier ───────────────────────────────────────────────────────
  // ── Möbler (2026-09-23) ──────────────────────────────────────────────────
  kontorsstolar: {
    title: "Kontorsstolar – ergonomiska stolar & knästolar",
    description:
      "Ergonomiska kontorsstolar med nackstöd, fotstöd eller massage, samt knästolar, ritstolar och sadelpallar. Sitthöjd och maxvikt anges. Leverans 3–7 dagar.",
  },
  fatoljer: {
    title: "Fåtöljer – reclinerfåtöljer, gungstolar & mer",
    description:
      "Reclinerfåtöljer, TV-fåtöljer med fotpall, gungstolar, massagefåtöljer och uppresningsfåtöljer. Ryggvinkel och maxvikt anges. 30 dagars öppet köp.",
  },
  "soffor-baddsoffor": {
    title: "Soffor & bäddsoffor – hörnsoffa och modulsoffa",
    description:
      "Bäddsoffor med förvaring, hörnsoffor med schäslong, modulsoffor och U-soffor i manchester, linnelook och konstläder. Bäddmått anges. Fri frakt över 499 kr.",
  },
  "matbord-stolar": {
    title: "Matbord, matstolar & barstolar",
    description:
      "Matbord, klaffbord, matstolar i flerpack, barstolar och barbord. Sitthöjd, bordsmått och maxvikt i varje beskrivning. Leverans 3–7 dagar från EU-lager.",
  },
  skrivbord: {
    title: "Skrivbord – höj- och sänkbara & fällbara",
    description:
      "Elektriska höj- och sänkbara skrivbord med minnesfunktion, fällbara väggskrivbord och ståbord på hjul. Skivmått och höjdspann anges. 30 dagars öppet köp.",
  },
  "soffbord-smabord": {
    title: "Soffbord, satsbord, sängbord & konsolbord",
    description:
      "Soffbord med förvaring och lyftbar skiva, satsbord i glas och stål, sängbord och smala konsolbord för hallen. Mått anges alltid. Fri frakt över 499 kr.",
  },
  "sangar-sovrum": {
    title: "Sängramar & sängbänkar i furu och metall",
    description:
      "Sängramar i furu, metall och stoppat tyg från 90 till 160 cm, sängbänkar med förvaring och madrass i gelmemoryskum. Maxvikt anges. Leverans 3–7 dagar.",
  },
  rumsavdelare: {
    title: "Rumsavdelare – skärmväggar med 3 till 8 paneler",
    description:
      "Fristående rumsavdelare med tre till åtta paneler i flätad bambu, polypropenväv, tyg eller pappersrep, 120–320 cm breda. Mått anges. 30 dagars öppet köp.",
  },
  "baby-smabarn": {
    title: "Lekmatta, gåvagn & babygunga – för de minsta",
    description:
      "Lekmattor i skum, gåvagnar i trä, babygungor, hopfällbara babybadkar, lekhage och juniorsängar för de minsta – med ålder och mått i beskrivningen.",
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
  "elbilar-for-barn": {
    title: "Elbil för barn – fyrhjuling, motorcykel, traktor",
    description:
      "Elbilar för barn från 18 månader till 12 år: 6, 12 och 24 V, elfyrhjulingar, elmotorcyklar med stödhjul och eltraktorer – många med fjärrkontroll.",
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
  garagetalt: {
    title: "Garagetält för motorcykel, cyklar och redskap",
    description:
      "Garagetält från 120 × 179 cm till 300 × 300 cm – de flesta med stomme i galvaniserat stål och dörr som rullas upp, för motorcykel, cyklar och redskap.",
  },
  "gunghastar-gungdjur": {
    title: "Gunghäst för barn – i trä och plysch med ljud",
    description:
      "Gunghästar och gungdjur för barn från 12 månader – klassiska i trä och mjuka i plysch med ljud, bälte och ryggstöd, som häst, svan, giraff och dinosaurie.",
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
  "hundbaddar-hundsoffor": {
    title: "Hundbädd & hundsoffa – upphöjda och tvättbara",
    description:
      "Hundbäddar och hundsoffor med ben i furu, upphöjda hundsängar med nät för ute och inne och bäddar med tvättbart överdrag – upp till 122 × 92 cm.",
  },
  hundburar: {
    title: "Hundbur – möbelbur, metallbur och mjuk bur",
    description:
      "Hundburar för hundar upp till 30 kg: möbelburar i valnöt, ek och vitt med skiva som sidobord, burar i metall och mjuka burar i väv som viks ihop.",
  },
  hundkojor: {
    title: "Hundkoja & hundhus utomhus – i trä och plast",
    description:
      "Hundkojor i gran och plast för hundar upp till 30 kg – upphöjda, med veranda, asfalttak eller tak som fälls upp – och en inomhuskoja i MDF.",
  },
  hushallsapparater: {
    title: "Hushållsapparater & smarta maskiner",
    description:
      "Ultraljudstvättar och praktiska hushållsapparater som sparar tid. Kapacitet, effekt och mått anges. Leverans 3–7 dagar från EU-lager.",
  },
  julgranar: {
    title: "Konstgjord julgran – plastgranar 57–225 cm",
    description:
      "Konstgjorda julgranar från 57 till 225 cm: smala pelargranar, täta granar med över 2 000 grenspetsar, snötäckta modeller och granar med LED-belysning.",
  },
  "kalas-fest": {
    title: "Kalas & fest – sockervadd och partyprylar",
    description:
      "Sockervaddsmaskiner och partyprylar som gör kalaset minnesvärt. Effekt och användning anges i beskrivningen. Fri frakt över 499 kr.",
  },
  katthus: {
    title: "Katthus utomhus i trä – för balkong och trädgård",
    description:
      "Katthus i trä för balkong och trädgård – från små hus på 62 cm till hus i tre våningar på 140 cm, med asfalttak, fönster och tak som fälls upp.",
  },
  kattlador: {
    title: "Kattlåda med tak, rostfri & kattlådsmöbel",
    description:
      "Kattlådor med lock, tak och toppingång, rostfria kattlådor upp till 130 liter och kattlådsskåp som döljer lådan i en möbel – flera med kolfilter mot lukt.",
  },
  keps: {
    title: "Keps herr & dam – baseballkepsar",
    description:
      "Baseballkepsar med lång skärm för sol och sommar. Storlek och material anges i beskrivningen. Leverans 3–7 dagar, 30 dagars öppet köp.",
  },
  klostrad: {
    title: "Klösträd & kattträd – takhöga och klöspelare",
    description:
      "Klösträd och kattträd från 46 cm till takhöga modeller på 275 cm, klöspelare och klöstunnor i sisal, jute och naturfiber – med grottor och hängmattor.",
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
    title: "Hundtrappa, hundramp, agility & kattbädd",
    description:
      "Hundtrappor och hundramper till soffa och säng, agilityset för trädgården, kattbäddar och kattrappor samt aktiveringsleksaker för hund och katt.",
  },
  "leksaker-spel": {
    title: "Gåbil, balanscykel & klätterställning för barn",
    description:
      "Gåbilar och sparkbilar för de minsta, balanscyklar, klätterställningar för inomhusbruk, byggsatser, lasertag och spelbord för hela familjen.",
  },
  leksakskok: {
    title: "Leksakskök & barnkök i trä, MDF och plast",
    description:
      "Leksakskök och barnkök för barn från 3 år – i trä, MDF och plast, med ugn, diskho och ljud, flera med rinnande vatten och upp till 92 delar.",
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
  "redskapsbodar-forrad": {
    title: "Redskapsbod, förrådstält & trädgårdsskåp",
    description:
      "Redskapsbodar i galvad plåt och plast från 1,1 till 12,4 m², ett förrådstält på 13,4 m² och trädgårdsskåp i trä för verktyg och trädgårdsredskap.",
  },
  sandlador: {
    title: "Sandlåda med tak – sandlådor i trä för barn",
    description:
      "Sandlådor i barrträ för barn från 3 år – med soltak eller lekstugetak, lekkök och diskho, som piratskepp eller bil och med fiberduk i botten på flera.",
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
  "sparkcyklar-for-barn": {
    title: "Sparkcykel för barn – stora hjul och broms",
    description:
      "Sparkcyklar för barn från 18 månader till 12 år – med stora hjul på upp till 16 tum, broms och justerbart styre, med luftdäck eller punkteringsfria hjul.",
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
