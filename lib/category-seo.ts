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
  "hem-inredning": {
    title: "Heminredning – belysning, förvaring & badrum",
    description:
      "Heminredning utöver möblerna: dekoration, konstväxter och speglar, lampor, förvaring, badrum och tvätt, elkaminer och värmefläktar, hemlarm och projektordukar.",
  },
  "kok-husgerad": {
    title: "Husgeråd & köksutrustning till hemmet",
    description:
      "Köksmaskiner, vattenkokare, miniugnar, kyl och frys, köksredskap, köksvagnar, serveringsvagnar, vinställ och soptunnor, samlat i Kök & husgeråd.",
  },
  "barn-familj": {
    title: "Leksaker & babyprylar till barn och familj",
    description:
      "Leksaker, lekkök, gunghästar och babyprylar, elbilar och sparkcyklar för barn, barnmöbler samt sandlådor, studsmattor och gungor för trädgården.",
  },
  "skonhet-halsa": {
    title: "Skönhetsprodukter & hälsa – salong och välmående",
    description:
      "Hudvårdsset, kosmetikkyl, IPL, salongsstolar och torkhuv, massagefåtöljer, massagebänkar, rollatorer, duschpallar och en ljusterapilampa.",
  },
  husdjur: {
    title: "Hundtillbehör, kattillbehör & smådjur",
    description:
      "Hundbäddar, hundburar, hundgrindar, klösträd, kattlådor, burar för kanin och hamster, hönshus, terrarier, matskåp och trimbord, ordnat efter djuret.",
  },
  "sport-fritid": {
    title: "Träningsutrustning, sport & fritid",
    description:
      "Hantlar, träningsbänkar, motionscyklar, boxningssäckar och träningskläder, pingisbord och dart, bollsport, camping, cykeltillbehör och hobby som teleskop.",
  },
  "tradgard-utemobler": {
    title: "Trädgård & uteplats – odling, förråd och dekor",
    description:
      "Utemöbler, paviljonger, grillar, eldkorgar, terrassvärmare, växthus, odlingslådor, blomställ, redskapsbodar, garagetält, vedställ och trädgårdsdekor.",
  },

  // Möbler skapades i Wix 2026-09-23 (se MAIN_GROUPS i category-groups.ts).
  mobler: {
    title: "Möbler till vardagsrum, sovrum, hall & kontor",
    description:
      "Möbler ordnade efter rum: soffor och fåtöljer, matbord och barstolar, sängramar och byråer, skoskåp för hallen, kontorsstolar och skrivbord.",
  },

  // ── Underkategorier ───────────────────────────────────────────────────────
  // ── Möbler (2026-09-23) ──────────────────────────────────────────────────
  kontorsstolar: {
    title: "Kontorsstol – ergonomisk stol, ritstol & knästol",
    description:
      "Kontorsstolar med nätrygg, nackstöd, fotstöd eller massage, stolar som bär upp till 220 kg, knästolar, ritstolar med fotring och sadelpallar.",
  },
  fatoljer: {
    title: "Fåtölj – reclinerfåtölj, gungstol & tv-fåtölj",
    description:
      "Reclinerfåtöljer och tv-fåtöljer med fotstöd, gungstolar på bokmedar, vilstolar i böjd björk, golvfåtöljer och fåtöljer med motor som hjälper dig upp.",
  },
  "soffor-baddsoffor": {
    title: "Soffa & bäddsoffa – hörnsoffa och modulsoffa",
    description:
      "Tvåsitssoffor från 110 cm, tresitssoffor, hörnsoffor med vändbar schäslong, modulsoffor i U-form, bäddsoffor och reclinersoffor i manchester och chenille.",
  },
  "matbord-stolar": {
    title: "Matbord & matstolar – klaffbord och barstolar",
    description:
      "Matbord i trä och glas, runda köksbord, klaffbord och utdragbara bord från 120 till 200 cm, matstolar i 2- och 4-pack, matbänkar och barstolar.",
  },
  skrivbord: {
    title: "Skrivbord – höj- och sänkbart, fällbart & gaming",
    description:
      "Elektriska höj- och sänkbara skrivbord med minnesfunktion, ståbord på hjul, fällbara skrivbord och väggskrivbord, gamingbord med LED och barnskrivbord.",
  },
  "soffbord-smabord": {
    title: "Soffbord, satsbord, sängbord & konsolbord",
    description:
      "Lyftbara soffbord med dolda fack, soffbord med LED, satsbord i glas och marmorlook, bord i C-form på hjul, smala konsolbord och vägghängda sängbord.",
  },
  "sangar-sovrum": {
    title: "Sängram & sängbänk i furu, metall och tyg",
    description:
      "Sängramar i furu, metall och stoppat tyg från 90 × 190 till 160 × 200 cm, sänggavel, madrasser, sängbänkar med förvaring och extrasängar på hjul.",
  },
  rumsavdelare: {
    title: "Rumsavdelare – vikbar skärmvägg med 3–8 paneler",
    description:
      "Vikbara rumsavdelare med tre till åtta paneler i bambu, polypropenväv, pappersrep och tyg, 120 till 320 cm breda och 170 till 182 cm höga.",
  },
  "baby-smabarn": {
    title: "Lekmatta, gåvagn & babygunga – för de minsta",
    description:
      "Lekmattor i skum, gåvagnar i trä, babygungor, hopfällbara babybadkar, lekhage och juniorsängar för de minsta – med ålder och mått i beskrivningen.",
  },
  baddfatoljer: {
    title: "Bäddfåtölj – fåtölj som blir gästsäng",
    description:
      "Bäddfåtöljer som fälls ut till en bädd på upp till 210 cm och 57–102 cm bredd, i sammet, manchester och linnelook, med ryggen i tre till sex lägen.",
  },
  "badrum-hemtextil": {
    title: "Badrumstillbehör, tvättskåp & hemtextil",
    description:
      "Medicinskåp med lås, duschpallar och duschstol, tvättskåp och tvättkorgar i bambu, LED-speglar, mattor och en elektrisk värmefilt.",
  },
  badrumsskap: {
    title: "Badrumsskåp – högskåp, medicinskåp & spegelskåp",
    description:
      "Badrumsskåp i bambu, vitt och grått: smala skåp från 16 cm, högskåp upp till 185 cm, medicinskåp med kod- eller nyckellås och spegelskåp för väggen.",
  },
  badrumsspeglar: {
    title: "Badrumsspegel med belysning – LED och antiimma",
    description:
      "Badrumsspeglar med LED-belysning, antiimma och tre ljusfärger, flera med Bluetooth och klocka, och enkla speglar med hylla och spegelskåp. Upp till 100 × 80 cm.",
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
      "Taklampor i kristall, linne och hampsnöre, bordslampor i keramik och trä, golvlampor, takfläktar med lampa, LED-björkar och en LED-strålkastare för arbete.",
  },
  "bil-cykel": {
    title: "Cykeltillbehör – cykelkärra, cykellås och pump",
    description:
      "Cykelkärror för last, pakethållarväskor, cykellås, cykelpumpar, sadlar, pedaler, mekställ och cykelställ, barncyklar och displayer till elcykeln.",
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
  byraer: {
    title: "Byrå – smal eller bred, vit eller med tyglådor",
    description:
      "Byråer från smala modeller på 20 cm till breda på 130 cm, med vanliga lådor eller tyglådor. Flera har tippskydd, och två har eluttag ovanpå.",
  },
  "dekoration-prydnad": {
    title: "Dekoration till hemmet – väggdekor & växtställ",
    description:
      "Väggdekor i metall, 3D-tavlor, konstgjorda träd och buxbomar i kruka, LED-björkar, växtpiedestaler och väggkrukor för inne och ute.",
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
      "Elementskydd i MDF med spjälad front, 60 till 201 cm breda och 81 till 95,5 cm höga. Sex är vita, och ett i ekton har två lådor i överkant.",
  },
  elkaminer: {
    title: "Elkamin – elektrisk kamin för vägg eller golv",
    description:
      "Elkaminer med LED-lågor och 1200–2000 W värme: väggkaminer för inbyggnad, fristående modeller och små elkaminer på ben. De flesta går utan värme.",
  },
  "forvaring-organisering": {
    title: "Förvaring – förvaringsbänk, skåp & hurts på hjul",
    description:
      "Förvaringsbänkar och puffar med plats under locket, förvaringsskåp, låsbara hurtsar, smala köksskåp, torkvagnar, klädställningar och leksaksförvaring.",
  },
  "friluftsliv-resa": {
    title: "Campingutrustning – tält, sovsäckar, resväskor",
    description:
      "Tält för en till åtta personer, sovsäckar och liggunderlag, campingstolar och bord, kylboxar, vandringsryggsäckar, resväskor och tillbehör till husvagnen.",
  },
  garagetalt: {
    title: "Garagetält för motorcykel, cyklar och redskap",
    description:
      "Garagetält från 120 × 179 cm till 300 × 300 cm – de flesta med stomme i galvaniserat stål och dörr som rullas upp, för motorcykel, cyklar och redskap.",
  },
  gnistskydd: {
    title: "Gnistskydd för öppen spis – svart eller guld",
    description:
      "Gnistskydd och brasskärmar för öppen spis i svart metall eller guldfärg, med två eller tre paneler, från 96 till 141 cm breda och 50 till 85 cm höga.",
  },
  golvlampor: {
    title: "Golvlampor – båglampor, LED och dimbara",
    description:
      "Golvlampor från 129 till 190 cm: båglampor med marmorfot, dimbara LED-lampor med fjärrkontroll, golvlampor med hyllor och lampset med två bordslampor.",
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
    title: "Frisörtillbehör, torkhuv & IPL hårborttagning",
    description:
      "Arbetsstolar och sadelpall för salongen, torkhuv på stativ med timer, frisörväska och sminkväska med lås, och IPL för hårborttagning hemma.",
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
    title: "Kosmetikkyl & hudvårdsset – hudvård för ansiktet",
    description:
      "Kosmetikkyl med spegeldörr och LED, minikyl som kyler och värmer, återfuktande hudvårdsset i 5 delar och en hopfällbar LED-lampa för ansiktet.",
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
    title: "Klädångare, ångstation & ultraljudstvätt",
    description:
      "Små torktumlare för väggen eller bänken, uppvärmt torkställ, klädångare och ångstation, ultraljudstvättar, fönsterputsrobot och sladdlös handdammsugare.",
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
    title: "Partytält, sockervaddsmaskin & festdukning",
    description:
      "Partytält och pop-up-tält från 3 × 3 till 6 × 3 m, kylvagn på hjul, sockervaddsmaskin, runda bordsdukar, stolsöverdrag och stolband för fest och bröllop.",
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
  "kladhangare-hallmobler": {
    title: "Klädhängare, klädställning, hallmöbel & hallbänk",
    description:
      "Klädhängare och klädställningar på hjul, med skohylla eller paraplyställ, hallmöbler med krokar och bänk samt hallbänkar och sittbänkar med förvaring.",
  },
  klostrad: {
    title: "Klösträd & kattträd – takhöga och klöspelare",
    description:
      "Klösträd och kattträd från 46 cm till takhöga modeller på 275 cm, klöspelare och klöstunnor i sisal, jute och naturfiber – med grottor och hängmattor.",
  },
  "koksmaskiner-apparater": {
    title: "Köksmaskin, espressomaskin & köksapparater",
    description:
      "Espressomaskiner och kapselmaskiner, köksmaskiner på 1300–1400 W, bordsdiskmaskiner med egen vattentank, ismaskiner, yoghurtmaskiner och en pizzaugn.",
  },
  "koksoar-koksvagnar": {
    title: "Köksö & köksvagn på hjul – med förvaring",
    description:
      "Köksöar och köksvagnar på hjul från 53 till 129 cm, med utfällbar skiva, lådor, kryddhylla, vinställ eller handdukshängare och skiva i trä eller stenlook.",
  },
  "koksredskap-tillbehor": {
    title: "Köksredskap, kastrullset & chafing dish",
    description:
      "Kastrullset med 17 delar för induktion, chafing dish-set för buffén, lufttäta behållare för torrvaror, mikrovågsugnshylla och vikbar köksvagn.",
  },
  konstvaxter: {
    title: "Konstgjorda växter – buxbom, olivträd, monstera",
    description:
      "Konstväxter för inne och ute: buxbom och cypresser på jordspett, olivträd upp till 180 cm, monstera och bambu i kruka med cementfylld botten – utan vattning.",
  },
  "kropp-valbefinnande": {
    title: "Rollator & duschpall – duschstol och ljusterapi",
    description:
      "Hopfällbara rollatorer som bär 136 kg, duschpallar och en duschstol som bär upp till 158 kg, toalettförhöjning, ljusterapilampa på 10 000 lux och sittdyna.",
  },
  "lek-tillbehor-for-husdjur": {
    title: "Hundtrappa, hundramp, agility & kattbädd",
    description:
      "Hundtrappor och hundramper till soffa, säng och bil, agilityset och agilityhinder i trä, kattkojor, kattrappor, katthjul och en automatisk kattleksak.",
  },
  "leksaker-spel": {
    title: "Gåbil, balanscykel & klätterställning för barn",
    description:
      "Gåbilar och sparkbilar för de minsta, springcyklar, klätterställningar och skumklossar för inomhus, tågbanor i trä, byggsatser och lasertag för större barn.",
  },
  leksakskok: {
    title: "Leksakskök & barnkök i trä, MDF och plast",
    description:
      "Leksakskök och barnkök för barn från 3 år – i trä, MDF och plast, med ugn, diskho och ljud, flera med rinnande vatten och upp till 92 delar.",
  },
  "massage-aterhamtning": {
    title: "Uppresningsfåtölj med massage – värme och lyft",
    description:
      "Uppresningsfåtöljer med lyft, massage och ländvärme, massagefåtöljer med fotpall, reclinerfåtöljer, massagestolar på hjul, massagebänkar och benmassage.",
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
    title: "Matskåp för hund, hundskålar & foderautomat",
    description:
      "Matskåp för hund med infällda rostfria skålar och förvaring, upphöjda matställ, foderautomater med app eller timer och vattenfontäner för katt.",
  },
  matgrupper: {
    title: "Matgrupp – matbord med stolar för två eller fyra",
    description:
      "Matgrupper med bord och två eller fyra stolar: kvadratiska, smala och ovala bord, ett klaffbord, ett glasbord och två furubord, från 60 till 120 cm.",
  },
  "miniugnar-airfryers": {
    title: "Miniugn & airfryer – varmluftsfritös och bänkugn",
    description:
      "Miniugnar från 9 till 46 liter, miniugnar med frityrkorg som fungerar som airfryer och bänkugnar med två kokplattor, för bakning, grill och fritering.",
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
      "Öronlappsfåtöljer med knappad rygg som bär 160 kg, fåtöljer med ländkudde och fotpall, en gungstol med öronlappsrygg och en uppresningsfåtölj.",
  },
  pallar: {
    title: "Pall – stegpall, pianopall, rullpall & sadelpall",
    description:
      "Stegpallar, pianopallar på 45–58 cm, rullpallar och sadelpallar på hjul, salongspallar, barpallar, verkstadspallar och stapelbara sittpallar i fyrpack.",
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
    title: "Hundgaller till bil & hundtransport",
    description:
      "Hundgaller och bagagerumsgaller för bilen, hundtrappa och hundramp till bakluckan, cykelkärror och cykelvagnar för hund, hundvagnar och en hundryggsäck.",
  },
  "serveringsvagnar-rullvagnar": {
    title: "Serveringsvagn, barvagn & rullvagn på hjul",
    description:
      "Serveringsvagnar och barvagnar med två eller tre plan, och smala rullvagnar med korgar eller lådor, 13 till 26,5 cm djupa. De flesta har fyra hjul, två med broms.",
  },
  "sideboards-vitrinskap": {
    title: "Sideboard, skänk & vitrinskåp för vägg och golv",
    description:
      "Sideboards, skänkar och höga köksskåp i vitt, högglans, metall och rotting, med lådor och skåp, och vitrinskåp med glas- eller akryldörrar för vägg och golv.",
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
      "Snurrfåtöljer som vrids 360 grader: på ben eller på fot, med fotpall, med gaslyft eller med ryggstöd som fälls bakåt, och flera reclinerfåtöljer.",
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
      "Speglar till hall, sovrum och badrum: helkroppsspeglar och golvspeglar på 120 till 180 cm, väggspeglar med svart eller guldfärgad ram och LED-speglar.",
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
      "Solcellslampor och lyktstolpar upp till 195 cm, pollarlampa och ljusslinga, trädgårdsfontäner, konstgjorda klot och häckar, spaljéer, rosenbåge och fågelmatare.",
  },
  "tradgardsskotsel-bevattning": {
    title: "Slangvagn, kompostkvarn & trädgårdsredskap",
    description:
      "Trädgårdsredskap och bevattning: slangvagnar och slangvinda, droppslang, kompostkvarn på 2500 W, gödselspridare, lövblås, häcksax och gräsklippare.",
  },
  "traning-gym": {
    title: "Hemmagym – chinsstång, stepbräda & pilates",
    description:
      "Gymstationer med viktblock, chinsstänger och dipsställningar, stepbrädor, plyoboxar, pilatesbrädor, roddmaskiner, steppers och vibrationsplattor för hemmet.",
  },
  traningsbankar: {
    title: "Träningsbänk – hopfällbar, justerbar & scottbänk",
    description:
      "Träningsbänkar som fälls ihop, med ryggstöd i flera lägen, benrullar eller skivstångsställ, plus scottbänk, sit-up-bänk och sissy squat-bänk.",
  },
  "tv-bankar": {
    title: "TV-bänk – 80 till 200 cm, med lådor och LED",
    description:
      "TV-bänkar från 80 till 200 cm för tv upp till 82 tum: väggmonterade, på hjul, i högglans eller ektoner, med lådor, luckor, glashylla eller RGB-LED.",
  },
  tvattkorgar: {
    title: "Tvättkorg med lock – i bambu, vide och med fack",
    description:
      "Tvättkorgar med lock i bambu och vide, tvättsorterare med två till fyra fack och uttagbara påsar, och två tvättskåp. Från 64 till 144 liter.",
  },
  "utelek-spel": {
    title: "Studsmatta för barn, basketkorg & gungor",
    description:
      "Studsmattor för barn med skyddsnät, basketkorgar för väggen, flyttbart basketställ, gungställning, fågelbogunga, hoppborg med pool och sandlådor.",
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
    title: "Värmefläkt för vägg eller som torn, 2000–2200 W",
    description:
      "Värmefläktar på 2000–2200 W för väggen eller som torn, med termostat, oscillation och överhettningsskydd, och ett elelement med wifi. Flera har veckotimer.",
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
    title: "Verktyg & hemmafix – sågbockar, svets och fräs",
    description:
      "Sågbockar och verkstadsbänkar, väggfräsar, MIG-svets, skjutdörrsbeslag, säckkärror, garagehyllor och verktygsskåp för garaget, verkstaden och projekten hemma.",
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
  "bil-slap": {
    title: "Domkraft, takräcke & handvinsch – bil och släp",
    description:
      "Garagedomkrafter och luftdomkrafter, takräcke, takkorg och takväska, handvinschar för båt och trailer, mc-lyftar, dieselvärmare, spännband och lastramper.",
  },
  bollsport: {
    title: "Fotbollsmål & basketställ – volleyboll, tennis",
    description:
      "Fotbollsmål från 150 × 110 till 300 × 200 cm, basketställ och korgar för vägg, volleybollnät med stolpar, tennisbollsvagnar och träningsnät för baseboll.",
  },
  "elbilsladdning-solenergi": {
    title: "Elbilsladdare & solpanel – laddkabel och solel",
    description:
      "Portabla elbilsladdare med Typ 2 för vanligt vägguttag, laddkabel till laddbox, solpaneler från 20 till 260 W och en hybridväxelriktare för eget elsystem.",
  },
  gamingstolar: {
    title: "Gamingstol med fotstöd – upp till 170° lutning",
    description:
      "Gamingstolar med fotstöd under sitsen, rygg som fälls 135 till 170 grader och sitthöjd 44–55 cm. Racingform eller kattöron och kaninöron, alla bär 120 kg.",
  },
  "garderober-kladstall": {
    title: "Garderob & tyggarderob – modulgarderob, klädskåp",
    description:
      "Tyggarderober med dragkedja och hjul, modulgarderober i plast, ett låsbart klädskåp i metall, en garderob med spegel och klädställ i bambu och metall.",
  },
  "hobby-musik": {
    title: "Staffli, handpan & metalldetektor – hobby",
    description:
      "Staffli i bokträ, handpan och tungtrumma, metalldetektorer med vattentät spole, teleskop för nybörjare, drönare, provdocka, tuftningstyg och ljudkort.",
  },
  hundgrindar: {
    title: "Hundgrind – för dörr, trappa eller fristående",
    description:
      "Hundgrindar som kläms fast eller skruvas i karmen, fristående grindar i trä och metall upp till 432 cm breda och grindar med kattlucka för katten.",
  },
  "jul-hogtider": {
    title: "Jul & högtider – granar, pynt och fest",
    description:
      "Konstgjorda julgranar, uppblåsbara tomtar och snögubbar, adventskalendrar, animerade skräckfigurer, partytält och det som behövs till kalaset.",
  },
  "kyl-frys": {
    title: "Minikyl, kylskåp & minifrys – kompakta modeller",
    description:
      "Ett kylskåp på 91 liter med frysfack, minifrysar på 35 liter, en dryckeskyl, en minikyl som också värmer och kylar med glasdörr för 12 till 20 flaskor.",
  },
  "palsvard-skotsel": {
    title: "Trimbord för hund – hopfällbart med galge",
    description:
      "Hopfällbara trimbord för hund med gummiskiva, galge och remmar, en trimningsarm med bordsklämma och ett pälsvårdsset som klipper, suger och torkar.",
  },
  "smart-hem-sakerhet": {
    title: "Hemlarm & övervakningskamera – trådlöst med app",
    description:
      "Trådlösa hemlarm med WiFi och 4G, övervakningskameror för inne och ute med nattseende, en kamera med solpanel och en väderstation med 7 tums skärm.",
  },
  "spel-bordsspel": {
    title: "Darttavla & pingisbord – biljard och poker",
    description:
      "Elektroniska darttavlor och darttavla i sisal, hopfällbara pingisbord, biljardbord, fotbollsbord, spelbord 3 i 1 och pokerset med 300 till 500 marker.",
  },
  traningsklader: {
    title: "Träningskläder & yogabyxor – sömlösa set",
    description:
      "Yogabyxor med raka eller utsvängda ben, sömlösa träningsset, sport-bh, träningslinnen med inbyggd bh, halterneck-toppar och cykelshorts i storlek XS till XL.",
  },
  "tvatt-stad": {
    title: "Torktumlare & städvagn – mopphink, torkställ",
    description:
      "Kompakta torktumlare för 2,5 till 5 kg, torkställ och torktorn, städvagnar och mopphinkar med press, ångstation, klädångare och en fönsterputsrobot.",
  },
  "verktyg-fordon": {
    title: "Verkstad & fordon – maskiner, bil och solel",
    description:
      "Verktygslådor och verktygsskåp, sågbockar och fräsar, domkrafter och takräcken, handvinschar, elbilsladdare och solpaneler samlade under en avdelning.",
  },
};

/** Sökordsanpassad titel/beskrivning för en kategori-slug, annars undefined. */
export function categorySeo(slug: string): CategorySeo | undefined {
  return CATEGORY_SEO[slug];
}
