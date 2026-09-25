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
      "Prisvärda elektroniktillbehör: gamingstolar, laddare, kablar och mobiltillbehör. Skickas från EU-lager på 3–6 dagar. Fri frakt över 499 kr.",
  },
  "hem-inredning": {
    title: "Heminredning – förvaring, belysning & textil",
    description:
      "Heminredning till bra pris: förvaringsmöbler, golvlampor, hemtextil, hushållsapparater och verktyg. Leverans 3–6 dagar från EU-lager, 30 dagars öppet köp.",
  },
  "kok-husgerad": {
    title: "Köksredskap & köksmaskiner till hemmet",
    description:
      "Köksredskap, köksmaskiner och serveringsdetaljer till vardag och fest. Noga utvalda fynd med fri frakt över 499 kr och 30 dagars öppet köp.",
  },
  "barn-familj": {
    title: "Leksaker & babyprylar till barn",
    description:
      "Leksaker, elbilar, bilbanor och babyprylar för hela familjen. Åldersmärkning i varje beskrivning. Leverans 3–6 dagar, 30 dagars öppet köp.",
  },
  "skonhet-halsa": {
    title: "Hudvård, massage & frisörtillbehör",
    description:
      "Skönhet och hälsa till bra pris: ansiktsmasker, massagebänkar, frisörtillbehör och redskap för återhämtning. Fri frakt över 499 kr, Klarna.",
  },
  husdjur: {
    title: "Hundtillbehör & kattillbehör – allt för djuret",
    description:
      "Klösträd, hundgårdar, selar, hundvagnar och skålar till hund, katt och smådjur. Mått i varje beskrivning. Leverans 3–6 dagar från EU-lager.",
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
      "Väskor, necessärer, kepsar och accessoarer som håller säsong efter säsong. Skickas från EU-lager på 3–6 dagar med fri frakt över 499 kr.",
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
      "Ergonomiska kontorsstolar med nackstöd, fotstöd eller massage, samt knästolar, ritstolar och sadelpallar. Sitthöjd och maxvikt anges. Leverans 3–6 dagar.",
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
      "Matbord, klaffbord, matstolar i flerpack, barstolar och barbord. Sitthöjd, bordsmått och maxvikt i varje beskrivning. Leverans 3–6 dagar från EU-lager.",
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
      "Sängramar i furu, metall och stoppat tyg från 90 till 160 cm, sängbänkar med förvaring och madrass i gelmemoryskum. Maxvikt anges. Leverans 3–6 dagar.",
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
  baddfatoljer: {
    title: "Bäddfåtölj – fåtölj som blir gästsäng",
    description:
      "Bäddfåtöljer som fälls ut till en bädd på 180–193 cm och 60–98 cm bredd, i sammet, manchester och linnelook, med ryggen i tre till sex lägen.",
  },
  "badrum-hemtextil": {
    title: "Badrumstillbehör & hemtextil",
    description:
      "Badrumstillbehör, handdukar och hemtextil som lyfter känslan i badrum och sovrum. Mått och material anges. Fri frakt över 499 kr, 30 dagars öppet köp.",
  },
  badrumsskap: {
    title: "Badrumsskåp – högskåp, medicinskåp & spegelskåp",
    description:
      "Badrumsskåp i bambu, vitt och grått: smala skåp från 18 cm, högskåp upp till 185 cm, medicinskåp med kod- eller nyckellås och spegelskåp för väggen.",
  },
  badrumsspeglar: {
    title: "Badrumsspegel med belysning – LED och antiimma",
    description:
      "Badrumsspeglar med LED-belysning, antiimma och tre ljusfärger, flera med Bluetooth och klocka, och enkla speglar med hylla. Upp till 100 × 80 cm.",
  },
  barbord: {
    title: "Barbord med pallar, bardisk & höj- och sänkbart",
    description:
      "Barbord med två eller fyra pallar, barbord med stolar, höj- och sänkbara barbord, ett vridbart barbord med glasskåp och en hopfällbar bardisk.",
  },
  barnmobler: {
    title: "Barnfåtölj, barnsoffa, sminkbord & barngarderob",
    description:
      "Barnmöbler till barnrummet: barnfåtöljer och barnsoffor, barnbord med stolar, sminkbord för barn, låga barngarderober med spegel och stegpallar från 2 år.",
  },
  belysning: {
    title: "Taklampor, bordslampor & LED-belysning",
    description:
      "Taklampor i glas, kristall och linne, bordslampor i keramik och trä, LED-björkar, vägglampor för utomhus och LED-armatur till garaget. Sockel och IP-klass anges.",
  },
  "bil-cykel": {
    title: "Cykeltillbehör & biltillbehör",
    description:
      "Cykelpumpar, sadlar, cykelryggsäckar, barncyklar och garagedomkrafter. Specifikationer i varje beskrivning. Fri frakt över 499 kr, öppet köp 30 dagar.",
  },
  "blomstall-vaxthyllor": {
    title: "Växthylla & blomställ – blomhylla och blompall",
    description:
      "Blomställ, växthyllor och blompallar för krukväxter inne och ute: i trappform, för hörnet, hopfällbara eller med krokar för hängande krukor.",
  },
  bokhyllor: {
    title: "Bokhylla – smal, låg, kubhylla & barnbokhylla",
    description:
      "Bokhyllor och kubhyllor: smala från 30 cm bredd, låga med åtta fack, i trädform och på hjul, en med LED och barnbokhyllor där omslagen syns.",
  },
  boxningssackar: {
    title: "Boxningssäck, punchingboll & boxställ",
    description:
      "Fristående boxningssäckar med fot som fylls med vatten eller sand, boxsäcksställ med säck, punchingbollar och boxställ med speedball, 125–231 cm höga.",
  },
  "burar-klader-tillbehor": {
    title: "Hundgård, hundgrind & burar för smådjur",
    description:
      "Hopfällbara hundgårdar, hundgrindar, hundtrappor, kaninhagar och hamsterburar. Mått i varje beskrivning så du väljer rätt. Leverans 3–6 dagar.",
  },
  byraer: {
    title: "Byrå – smal eller bred, vit eller med tyglådor",
    description:
      "Byråer från smala modeller på 20 cm till breda på 130 cm, med vanliga lådor eller tyglådor. Flera har tippskydd, och två har eluttag ovanpå.",
  },
  "dator-gaming": {
    title: "Gamingstolar & datortillbehör",
    description:
      "Gamingstolar med fotstöd och tillbehör till datorn. Maxvikt och justermöjligheter anges i beskrivningen. Klarna, fri frakt över 499 kr.",
  },
  "dekoration-prydnad": {
    title: "Dekoration & prydnad till hemmet",
    description:
      "Konstgjorda växter, prydnadsdetaljer och dekoration som gör hemmet personligt. Mått och material anges. Leverans 3–6 dagar från EU-lager.",
  },
  "elbilar-for-barn": {
    title: "Elbil för barn – fyrhjuling, traktor & gokart",
    description:
      "Elbilar för barn från 18 månader till 12 år: 6, 12 och 24 V, elfyrhjulingar, elmotorcyklar med stödhjul och eltraktorer – många med fjärrkontroll.",
  },
  "eldkorgar-eldstader": {
    title: "Eldkorg & eldstad utomhus – rökfri och med grill",
    description:
      "Eldkorgar och eldstäder för uteplatsen, från Ø38 till Ø75 cm: rökfria modeller med sekundärförbränning, eldkorgar med grillgaller, eldbord och fyrfat.",
  },
  elementskydd: {
    title: "Elementskydd – spjälat radiatorskydd i MDF",
    description:
      "Elementskydd i MDF med spjälad front, 60 till 172 cm breda och 81 till 95,5 cm höga. Fyra är vita, och ett i ekton har två lådor i överkant.",
  },
  elkaminer: {
    title: "Elkamin – elektrisk kamin för vägg eller golv",
    description:
      "Elkaminer med LED-lågor och 1800–2000 W värme: väggkaminer för inbyggnad, fristående modeller och små elkaminer på ben. De flesta går utan värme.",
  },
  "forvaring-organisering": {
    title: "Förvaring – förvaringsbänk, skåp & hurts på hjul",
    description:
      "Förvaringsbänkar, skåp, kubhyllor, hurtsar på hjul och klädställ till hall, sovrum och kontor. Byråer, bokhyllor och tvättkorgar har egna sidor.",
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
  gnistskydd: {
    title: "Gnistskydd för öppen spis – svart eller guld",
    description:
      "Gnistskydd och brasskärmar för öppen spis i svart metall eller guldfärg, med två eller tre paneler, från 96 till 141 cm breda och 50 till 81 cm höga.",
  },
  golvlampor: {
    title: "Golvlampor – båglampor, LED och dimbara",
    description:
      "Golvlampor från 129 till 190 cm: båglampor med marmorfot, dimbara LED-lampor med fjärrkontroll, golvlampor med hyllor och trebenta lampor med tygskärm.",
  },
  "grill-utekok": {
    title: "Gasolgrill, kolgrill, plancha & kylbox",
    description:
      "Gasolgrillar med två till fem brännare, kolgrillar, planchor med regulator och slang, grillvagnar och kylboxar som håller kylan upp till 72 timmar.",
  },
  "gunghastar-gungdjur": {
    title: "Gunghäst för barn – i trä och plysch med ljud",
    description:
      "Gunghästar och gungdjur för barn från 12 månader – klassiska i trä och mjuka i plysch med ljud, bälte och ryggstöd, som häst, svan, giraff och dinosaurie.",
  },
  halloweendekoration: {
    title: "Halloweendekoration utomhus – spöken och skelett",
    description:
      "Halloweendekoration för trädgård och entré: uppblåsbara spöken, pumpor och liemän upp till 3,7 m, och animerade häxor och zombier med ljus och ljud.",
  },
  "hamsterburar-gnagarburar": {
    title: "Hamsterbur & gnagarbur – stora, i flera plan",
    description:
      "Hamsterburar i trä, akryl och glas, dvärghamsterbur, burar med rörsystem och gnagarburar för råtta, degu och chinchilla. Flera med djup bädd.",
  },
  "hantlar-hantelset": {
    title: "Hantlar & hantelset – justerbara och hexhantlar",
    description:
      "Hantelset med ställ, justerbara hantlar, gummerade hexhantlar, kettlebell och skivstång med viktskivor för hemmagymmet. Vikterna står i beskrivningen.",
  },
  "har-rakning": {
    title: "Frisörtillbehör & salongsutrustning",
    description:
      "Arbetsstolar för salong, torkhuvar, frisörväskor och redskap för hår och rakning. Höjdmått och effekt anges. Leverans 3–6 dagar, öppet köp.",
  },
  "honshus-honsgardar": {
    title: "Hönshus & hönsgård – för 2 till 30 höns",
    description:
      "Hönshus i trä med värprede, hönsgårdar i trä eller galvat stål upp till 24 m², hönsreden och en automatisk hönslucka. För 2 till 30 höns.",
  },
  hornskrivbord: {
    title: "Hörnskrivbord med laddstation, hyllor & lådor",
    description:
      "Hörnskrivbord i L-form med eluttag och USB, hylltorn, lådor eller skärmställ, ett gamingbord för två skärmar och två som också kan ställas raka.",
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
  hundvagnar: {
    title: "Hundvagn & cykelvagn för hund – upp till 45 kg",
    description:
      "Hundvagnar för hundar upp till 4, 10, 20, 25 eller 30 kg, cykelvagnar för hund upp till 45 kg och en vagn som blir bärväska. Flera är hopfällbara.",
  },
  hushallsapparater: {
    title: "Hushållsapparater & smarta maskiner",
    description:
      "Ultraljudstvättar och praktiska hushållsapparater som sparar tid. Kapacitet, effekt och mått anges. Leverans 3–6 dagar från EU-lager.",
  },
  juldekoration: {
    title: "Juldekoration utomhus – uppblåsbar tomte och ren",
    description:
      "Juldekoration för trädgård och entré: uppblåsbara tomtar, snögubbar och renar upp till 250 cm, ljusfigurer med LED samt julbyar och girlanger för inomhus.",
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
  "kaninburar-marsvinsburar": {
    title: "Kaninbur, kaninhus & marsvinsbur – inne och ute",
    description:
      "Kaninburar och kaninhus för trädgården, marsvinshyddor, smådjursstall med löpgård och hagar utan botten eller för inomhus, de flesta för kanin och marsvin.",
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
      "Baseballkepsar med lång skärm för sol och sommar. Storlek och material anges i beskrivningen. Leverans 3–6 dagar, 30 dagars öppet köp.",
  },
  "kladhangare-hallmobler": {
    title: "Klädhängare, klädställning, hallmöbel & hallbänk",
    description:
      "Klädhängare och klädställningar på hjul, med skohylla eller paraplyställ, hallmöbler med krokar och bänk samt hallbänkar som bär upp till 130 kg.",
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
  "koksoar-koksvagnar": {
    title: "Köksö & köksvagn på hjul – med förvaring",
    description:
      "Köksöar och köksvagnar på hjul från 53 till 129 cm, med utfällbar skiva, lådor, kryddhylla, vinställ eller handdukshängare och skiva i trä eller stenlook.",
  },
  "koksredskap-tillbehor": {
    title: "Köksredskap & kökstillbehör",
    description:
      "Köksredskap och tillbehör i hållbara material för vardagsmatlagningen. Material och skötselråd anges. Leverans 3–6 dagar, öppet köp 30 dagar.",
  },
  konstvaxter: {
    title: "Konstgjorda växter – buxbom, olivträd, monstera",
    description:
      "Konstväxter för inne och ute: buxbom och cypresser på jordspett, olivträd upp till 180 cm, monstera och bambu i kruka med cementfylld botten – utan vattning.",
  },
  "kropp-valbefinnande": {
    title: "Rollator, ljusterapilampa & sittdyna",
    description:
      "Hopfällbara rollatorer med sits som bär 136 kg, en ljusterapilampa på 10 000 lux, en sittdyna i memoryskum och en duschpall med stödhandtag.",
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
    title: "Uppresningsfåtölj & kontorsstol med massage",
    description:
      "Uppresningsfåtöljer med lyft, massage och värme, kontorsstolar med massage och fotstöd, reclinerfåtöljer och en fot- och vadmassage för hemmet.",
  },
  massagebankar: {
    title: "Massagebänk & behandlingsbänk – hopfällbar",
    description:
      "Hopfällbara massagebänkar och behandlingsbänkar i trä och aluminium: 60 eller 70 cm breda, med två eller tre zoner och en maxlast på 130 till 250 kg.",
  },
  massagestolar: {
    title: "Massagestolar & massagefåtöljer med värme",
    description:
      "Massagefåtöljer med vibration, värme och fotstöd, några med uppresningshjälp, och massagestolar med vibration eller knådning i ryggen. Bär upp till 160 kg.",
  },
  "mat-vattenskalar": {
    title: "Hundskålar & kattskålar",
    description:
      "Mat- och vattenskålar till hund och katt i praktiska material. Volym och mått anges i beskrivningen. Leverans 3–6 dagar från EU-lager.",
  },
  matgrupper: {
    title: "Matgrupp – matbord med stolar för två eller fyra",
    description:
      "Matgrupper med bord och två eller fyra stolar: kvadratiska, smala och ovala bord, ett klaffbord, ett glasbord och ett furubord från 60 till 120 cm.",
  },
  "miniugnar-airfryers": {
    title: "Miniugn & airfryer – varmluftsfritös och bänkugn",
    description:
      "Miniugnar från 9 till 36 liter, miniugnar med frityrkorg som fungerar som airfryer och bänkugnar med två kokplattor, för bakning, grill och fritering.",
  },
  mobiltillbehor: {
    title: "Mobiltillbehör – laddare, kablar & skal",
    description:
      "Mobiltillbehör till vardagen: laddare, kablar och skydd. Kolla anslutningstyp i beskrivningen så tillbehöret passar din telefon. Öppet köp 30 dagar.",
  },
  motionscyklar: {
    title: "Motionscykel, spinningcykel & pedaltränare",
    description:
      "Motionscyklar med magnetiskt motstånd i 8 steg, med ryggstöd eller hopfällbara, en spinningcykel och pedaltränare för armar och ben.",
  },
  "motorcyklar-for-barn": {
    title: "Motorcykel för barn – elmotorcykel 6, 12 & 24 V",
    description:
      "Elmotorcyklar för barn från 18 månader till 12 år: 6 V med stödhjul eller tre hjul, 12 V för 3–8 år och 24 V med 16 km/h, plus sparkfordon och trehjulingar.",
  },
  nattduksbord: {
    title: "Nattduksbord – svävande, med lådor & laddstation",
    description:
      "Nattduksbord och sängbord med lådor och öppna fack, svävande modeller för väggen, smala bord på 25 cm och sängbord med eluttag och USB, flera i par.",
  },
  odlingslador: {
    title: "Odlingslåda & planteringslåda – metall och trä",
    description:
      "Odlingslådor i galvaniserad metall, trä, träkomposit och plast, upp till 241 × 90,5 cm, och upphöjda lådor och odlingsbord där du slipper böja dig ner.",
  },
  oronlappsfatoljer: {
    title: "Öronlappsfåtölj – knappad rygg, sammet & linne",
    description:
      "Öronlappsfåtöljer med knappad rygg som bär 160 kg, fåtöljer med ländkudde och fotpall, gungstolar med öronlappsrygg och en uppresningsfåtölj.",
  },
  pallar: {
    title: "Pall – stegpall, duschpall, pianopall & rullpall",
    description:
      "Pallar till hem och verkstad: stegpallar, duschpallar som bär upp till 150 kg, pianopallar på 45–58 cm, rullpallar och sadelpallar på hjul och sittpallar i fyrpack.",
  },
  projektordukar: {
    title: "Projektorduk – motoriserad, manuell & på stativ",
    description:
      "Projektordukar på 84 till 120 tum: motoriserade med fjärrkontroll, manuella med autolås för vägg eller tak och dukar på stativ som ställs upp inne eller ute.",
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
      "Serveringsdetaljer och glas som lyfter dukningen till vardag och fest. Material och skötselråd anges. Leverans 3–6 dagar, 30 dagars öppet köp.",
  },
  "serveringsvagnar-rullvagnar": {
    title: "Serveringsvagn, barvagn & rullvagn på hjul",
    description:
      "Serveringsvagnar och barvagnar med två eller tre plan, och smala rullvagnar med korgar eller lådor, 13 till 26,5 cm djupa. De flesta har fyra hjul, två med broms.",
  },
  "sideboards-vitrinskap": {
    title: "Sideboard, skänk & vitrinskåp för vägg och golv",
    description:
      "Sideboards och skänkar i vitt, högglans, metall och rotting, de flesta med lådor och skåp, och vitrinskåp med glas- eller akryldörrar för vägg och golv.",
  },
  sidobord: {
    title: "Sidobord & avlastningsbord – runda och C-formade",
    description:
      "Sidobord och avlastningsbord: runda bord i metall, rotting och stenlook, C-format bord som skjuts in under soffan och sidobord med eluttag och USB.",
  },
  "sittpuffar-fotpallar": {
    title: "Sittpuff, fotpall & puff med förvaring",
    description:
      "Sittpuffar, fotpallar och förvaringspuffar i sammet, manchester, teddyfleece och sherpa. De flesta bär 120 kg, och de flesta har ett fack under locket.",
  },
  "skarmtak-entretak": {
    title: "Skärmtak & entrétak för ytterdörr och fönster",
    description:
      "Skärmtak och entrétak i polykarbonat för ytterdörr, dubbeldörr och fönster, från 100 till 303 cm breda, som skruvas fast i väggen med konsoler.",
  },
  "skoskap-skobankar": {
    title: "Skoskåp, skobänk & skohylla till hallen",
    description:
      "Skoskåp för 8 till 30 par, smala från 15 cm djup, skoskåp med spegeldörrar och tippfack, skobänkar med sittdyna och skohyllor i bambu och metall.",
  },
  snurrfatoljer: {
    title: "Snurrfåtölj – vrids 360°, på ben eller fast fot",
    description:
      "Snurrfåtöljer som vrids 360 grader: på ben eller på fot, med fotpall, med gaslyft eller med ryggstöd som fälls bakåt, och två reclinerfåtöljer.",
  },
  "solskydd-paviljonger": {
    title: "Paviljong 3x3, paviljongtak & pop up-tält",
    description:
      "Paviljonger och pop up-tält från 3 × 3 till 6 × 3 m, paviljongtak i 3 × 3 och 3 × 4 m, partytält, parasoll med fot, markiser och skärmtak i polykarbonat.",
  },
  soptunnor: {
    title: "Soptunna & sopsorteringskärl – sensor och pedal",
    description:
      "Soptunnor med sensor eller pedal, sopsorteringskärl med två eller tre fack och utdragbara sopsorterare för köksskåpet, från 20 till 72 liter.",
  },
  "sparkcyklar-for-barn": {
    title: "Sparkcykel för barn – stora hjul och broms",
    description:
      "Sparkcyklar för barn från 18 månader till 12 år – med stora hjul på upp till 16 tum, broms och justerbart styre, med luftdäck eller punkteringsfria hjul.",
  },
  speglar: {
    title: "Spegel – helkroppsspegel, väggspegel, golvspegel",
    description:
      "Speglar till hall, sovrum och badrum: helkroppsspeglar och golvspeglar på 148 till 180 cm, väggspeglar med svart eller guldfärgad ram och LED-speglar.",
  },
  terrarier: {
    title: "Terrarium i glas – för ödla, orm och spindel",
    description:
      "Terrarier i glas från 24 till 140 liter för ödlor, ormar, spindlar och grodor, med gallerlock och frontlucka eller skjutdörrar. Flera kan låsas.",
  },
  "terrassvarmare-infravarmare": {
    title: "Terrassvärmare & infravärmare – 2000 och 2500 W",
    description:
      "Terrassvärmare och infravärmare på 2000 och 2500 W för vägg, tak och stativ – med fjärrkontroll, app eller timer och effekt i upp till nio steg.",
  },
  "tradgardsdekor-belysning": {
    title: "Solcellslampor, trädgårdsfontäner & dekor",
    description:
      "Solcellslampor och solcellslyktor för trädgården, trädgårdsfontäner med pump, fågelmatare med kamera, spaljéer och blomställ – och säsongsdekor.",
  },
  "tradgardsskotsel-bevattning": {
    title: "Slangvagn, kompostkvarn & trädgårdsredskap",
    description:
      "Trädgårdsredskap och bevattning: slangvagnar och slangvinda, droppslang, kompostkvarn på 2500 W, gödselspridare, lövblås, häcksax och gräsklippare.",
  },
  "traning-gym": {
    title: "Hemmagym – chinsstång, stepbräda & pilates",
    description:
      "Träningsredskap för hemmagymmet: chinsstänger för vägg eller fristående, stepbrädor, pilatesbrädor, gymstationer med viktblock och vibrationsplattor.",
  },
  traningsbankar: {
    title: "Träningsbänk – hopfällbar, justerbar & scottbänk",
    description:
      "Träningsbänkar som fälls ihop, med ryggstöd i flera lägen, benrullar eller skivstångsställ, plus scottbänk, sit-up-bänk och sissy squat-bänk.",
  },
  "tv-bankar": {
    title: "TV-bänk – 80 till 200 cm, med lådor och LED",
    description:
      "TV-bänkar från 80 till 200 cm för tv upp till 75 tum: väggmonterade, på hjul, i högglans eller ektoner, med lådor, luckor, glashylla eller RGB-LED.",
  },
  tvattkorgar: {
    title: "Tvättkorg med lock – i bambu, vide och med fack",
    description:
      "Tvättkorgar med lock i bambu och vide, tvättsorterare med två till fyra fack och uttagbara påsar, och två tvättskåp. Från 64 till 144 liter.",
  },
  "utelek-spel": {
    title: "Studsmatta för barn, basketkorg & gungor",
    description:
      "Utelek för trädgården: studsmattor för barn med skyddsnät, basketkorgar och basketställ, gungställning och gungor, sandlådor, hoppborg och bollnät.",
  },
  utemobler: {
    title: "Utemöbler – loungeset, trädgårdsbänk & hängstol",
    description:
      "Utemöbler för altan, balkong och trädgård: loungeset i konstrotting, trädgårdsbänkar och bord, matgrupper, hängstolar med stativ, solsängar och dynboxar.",
  },
  "valphagar-hundhagar": {
    title: "Valphage & hundhage – inomhus och utomhus",
    description:
      "Valphagar och hundhagar i metall, 60 till 91 cm höga med dörr eller grind, och en hopfällbar hage i tyg med soltak. Flera har markpinnar för gräsmattan.",
  },
  varmeflaktar: {
    title: "Värmefläkt – för vägg eller som torn, 2000 W",
    description:
      "Värmefläktar på 2000–2200 W för väggen eller som torn, med termostat, timer, oscillation och överhettningsskydd. Flera har veckotimer och fönstervakt.",
  },
  "vaskor-necessarer": {
    title: "Väskor & necessärer",
    description:
      "Väskor och necessärer med smart förvaring för resan och vardagen. Mått och material anges i beskrivningen. Leverans 3–6 dagar, öppet köp.",
  },
  "vattenkokare-brodrostar": {
    title: "Vattenkokare, brödrost & frukostset",
    description:
      "Vattenkokare på 1,7 liter, brödrostar för två eller fyra skivor och frukostset där kokaren och rosten matchar, flera med temperaturval och varmhållning.",
  },
  "vaxthus-odling": {
    title: "Tunnelväxthus, väggväxthus & drivbänkar",
    description:
      "Tunnelväxthus och foliehus från 3 × 1 till 6 × 3 m, väggväxthus, växthus i aluminium och polykarbonat, drivbänkar och odlingslådor i metall och trä.",
  },
  "vedstall-vedbodar": {
    title: "Vedställ & vedbod – vedförvaring inne och ute",
    description:
      "Vedställ i svart stål för brasveden inne och ute, stora vedställ med vattentätt överdrag och vedbodar med lutande tak. Flera med eldstadsverktyg.",
  },
  "verktyg-hemmafix": {
    title: "Verktyg & hemmafix – vinschar och fräsar",
    description:
      "Handvinschar för båt och trailer, CNC-fräsar, laserstativ och garagehyllor för hemmafixaren. Kapacitet och mått anges. Fri frakt över 499 kr.",
  },
  "verktygsvagnar-verktygslador": {
    title: "Verktygsvagn & verktygslåda – med lås och lådor",
    description:
      "Verktygsvagnar i stål med upp till 16 lådor, lås och låsbara hjul, verkstadsvagnar i tre plan, verktygsskåp och verktygslådor med kullagerskenor.",
  },
  "vinstall-vinkylar": {
    title: "Vinställ, vinhylla & vinkyl – 6 till 72 flaskor",
    description:
      "Vinställ för golv och vägg, vinhyllor med glashållare, köksmöbler med vinställ och vinkylar för 12 till 20 flaskor som ställs mellan 5 och 18 °C.",
  },
};

/** Sökordsanpassad titel/beskrivning för en kategori-slug, annars undefined. */
export function categorySeo(slug: string): CategorySeo | undefined {
  return CATEGORY_SEO[slug];
}
