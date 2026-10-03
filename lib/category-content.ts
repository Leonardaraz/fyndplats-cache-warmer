// lib/category-content.ts
// Redaktionellt innehåll (intro-text + FAQ) per KATEGORI, för att ge
// /kategori/<slug>-sidorna riktig brödtext och long-tail-SEO i stället för
// bara en produktlistning (audit 2026-06-24, "tunn kategoritext").
//
// UTÖKAD 2026-08-12: tidigare hade bara de 9 huvudkategorierna innehåll — de
// 27 underkategorierna renderade noll ord egen text och såg för Google ut som
// varianter av /alla-produkter. Nu har alla 36 live-kategorier innehåll, och
// gaten på `parentId === null` är borttagen i page.tsx: KARTAN är gaten, så en
// kategori får text exakt när den fått en post här.
//
// NYCKEL = exakt live-SLUG (verifierat mot www.fyndplats.se/sitemap.xml),
// INTE namn — slugs är stabila och unika, så ingen åäö-/"&"-matchning kan slå fel.
// REA/Populära och okända kategorier saknas medvetet → inget block (oförändrat).
// En kategori som ännu inte är live (t.ex. Mode efter Kina-utfasningen) renderar
// inget förrän den får ≥1 synlig produkt och sidan slutar redirecta — då dyker
// innehållet upp automatiskt (self-revive-vänligt).
//
// SANNINGSKRAV: texterna beskriver det sortiment som FAKTISKT ligger i kategorin
// (avstämt mot live-sidorna 2026-08-12). Skriv aldrig om produkttyper vi inte
// säljer — det ger besvikna besökare och studsar som Google mäter.
//
// Innehållet är medvetet UNIKT per kategori (egen P1/P2 + egna frågor) för att
// undvika duplicerad boilerplate; de gemensamma trygghets-/fraktfakta är
// omformulerade per kategori. Alla påståenden är sanna för Fyndplats: EU-lager
// med 3–6 arbetsdagars leverans, fri frakt över 499 kr, Klarna, 30 dagars öppet
// köp, svensk kundtjänst som svarar inom 24 h på vardagar.

export type CategoryContent = {
  intro: string[]; // stycken (~150–200 ord totalt)
  faq: { q: string; a: string }[]; // 3 frågor per kategori
};

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {

  "hem-inredning": {
    intro: [
      "Hem & Inredning samlar det som ger hemmet ljus, ordning och värme. Avdelningen har sex grupper: Inredning, Belysning, Förvaring, Badrum & tvätt, Värme och Teknik i hemmet. Soffor, bord, sängar och andra möbler finns i avdelningen Möbler.",
      "Under Inredning finns Dekoration & prydnad med väggdekor och växtställ, Konstväxter i kruka för inne och ute och Speglar för hallen, sovrummet och vardagsrummet. Belysning samlar taklampor, bordslampor, vägglampor och ljusslingor, och Golvlampor har en egen sida. Förvaring & organisering har förvaringsbänkar, skåp, kubhyllor och hurtsar på hjul.",
      "Badrum & tvätt består av Badrumsskåp, Badrumsspeglar, Badrum & hemtextil med medicinskåp och duschpallar, Tvättkorgar och Tvätt & städ med torktumlare, städvagnar och mopphinkar. Under Värme finns Elkaminer, Värmefläktar, Gnistskydd för den öppna spisen och Elementskydd som döljer elementet och ger en hylla ovanpå. Teknik i hemmet har Smart hem & säkerhet med hemlarm och övervakningskameror, Projektordukar och Hushållsapparater som klädångare och fönsterputsrobotar.",
      "Mät platsen innan du beställer. En spegel eller ett badrumsskåp ska passa väggen, ett elementskydd elementet och ett gnistskydd spisens öppning. För lampor är sockeln och färgtemperaturen det som avgör ljuset. Mått, material och teknisk data står i varje produktbeskrivning.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Var hittar jag möblerna?",
        a: "Soffor, fåtöljer, bord, sängar, byråer och bokhyllor ligger i avdelningen Möbler, ordnade efter rum. Här i Hem & Inredning finns det som kompletterar dem, som lampor, speglar, förvaring, textilier och värme.",
      },
      {
        q: "Hur väljer jag rätt ljus?",
        a: "Titta på färgtemperaturen i kelvin: ett lägre tal ger varmt, gulaktigt ljus och ett högre ger kallt, vitt ljus. Flera lampor är dimbara eller går att ställa i olika ljusfärger med fjärrkontroll. Kontrollera också vilken sockel lampan har och om ljuskällan ingår.",
      },
      {
        q: "Hur väljer jag värmare till ett rum?",
        a: "En elkamin ger flameffekt och värme, och de flesta går att köra som ren flameffekt utan värme. En värmefläkt eller väggvärmare värmer snabbt och har ofta timer och oscillation. Titta på effekten i watt och om värmaren har termostat, så att den håller den temperatur du ställt in.",
      },
    ],
  },

  "kok-husgerad": {
    intro: [
      "Kök & Husgeråd är avdelningen för det som används i köket varje dag. I menyn är den delad i två grupper: Apparater, med det som ska in i ett eluttag, och Kök & servering, med det som lagar, förvarar, bär och sorterar.",
      "Under Apparater hittar du Köksmaskiner & Apparater med espressomaskiner, kapselmaskiner, köksmaskiner med degkrok, bordsdiskmaskiner och ismaskiner. Vattenkokare & brödrostar har frukostset där kokare och rost matchar varandra, Miniugnar & airfryers har bänkugnar och varmluftsfritöser, och Kyl & frys har minifrysar, kylskåp, dryckeskylar och vinkylar.",
      "Under Kök & servering finns Köksredskap & Tillbehör med kastrullset och chafingdishar, Köksöar & köksvagnar för mer arbetsyta och förvaring på hjul, Serveringsvagnar & rullvagnar, Vinställ & vinkylar och Soptunnor med sensor, pedal eller flera fack för sortering. Mått, effekt och volym står i varje produktbeskrivning, så jämför dem med bänken, skåpet eller nischen innan du väljer.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Var hittar jag vinkylar?",
        a: "Vinkylarna finns både under Kyl & frys och under Vinställ & vinkylar, där de står tillsammans med vinställ och vinhyllor. Välj efter hur många flaskor du vill ha kalla och om kylen ska stå fritt eller under bänken.",
      },
      {
        q: "Vad är skillnaden mellan en miniugn och en airfryer?",
        a: "En miniugn är en liten elektrisk bänkugn, ofta med timer, galler och plåt. Flera modeller under Miniugnar & airfryers har också varmluft och fungerar som varmluftsfritös i samma låda. Jämför volym i liter och effekt i watt, så vet du hur mycket som får plats och hur snabbt den blir varm.",
      },
      {
        q: "Hur väljer jag soptunna?",
        a: "Under Soptunnor finns tunnor som öppnas med sensor eller pedal och modeller med två eller tre fack för sopsortering. Mät platsen där tunnan ska stå, och räkna med att locket behöver fritt utrymme ovanför för att kunna öppnas.",
      },
    ],
  },

  "barn-familj": {
    intro: [
      "Barn & Familj samlar det barnen leker med, åker på och sitter i, från de första månaderna till skolåldern. I menyn är avdelningen delad i tre grupper: Leksaker, Åkfordon och Barnrum & utelek.",
      "Under Leksaker finns Leksaker & Spel med byggklossar, rittavlor och gåbilar, Leksakskök med lekkök och diskmaskiner i trä, MDF och plast, Gunghästar & gungdjur i plysch och trä och Baby & Småbarn med babybadkar, babygungor och lekmattor. Åkfordon har Elbilar för barn, som bilar, traktorer och fyrhjulingar med fjärrkontroll, Motorcyklar för barn med stödhjul och Sparkcyklar för barn med luftdäck och bromsar.",
      "Barnrum & utelek har Barnmöbler, som barnfåtöljer, barnsoffor och leksakshyllor, Sandlådor med tak eller lekkök, och Utelek & Spel, som har flyttat hit från Trädgård. Där står studsmattor med skyddsnät, gungställningar, basketkorgar och bollnät för gräsmattan. Rekommenderad ålder och maxvikt står i varje produktbeskrivning, och det är dem du ska gå efter snarare än barnets längd eller hur stort det verkar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur vet jag vilken ålder en leksak passar för?",
        a: "Åldern står i produktnamnet eller i beskrivningen, till exempel för gunghästar, elbilar och lekkök. Följ den, särskilt för de minsta, eftersom leksaker för äldre barn kan ha smådelar. För åkfordon och studsmattor står också en maxvikt som ska hållas.",
      },
      {
        q: "Var hittar jag studsmattor och gungor?",
        a: "De ligger under Utelek & Spel i gruppen Barnrum & utelek, som har flyttat hit från Trädgård. Där finns också basketkorgar, bollnät och en hoppborg, och sandlådorna har en egen sida under Sandlådor.",
      },
      {
        q: "Vilket åkfordon passar mitt barn?",
        a: "De yngsta börjar ofta med en gåbil eller en elmotorcykel med tre hjul, och större barn klarar en sparkcykel med handbroms eller en elbil med högre hastighet. Många elbilar har fjärrkontroll, så att en vuxen kan styra tills barnet kör själv. Jämför ålder, hastighet och maxvikt i beskrivningen.",
      },
    ],
  },

  "skonhet-halsa": {
    intro: [
      "Skönhet & Hälsa samlar det som hör till hud, hår, massage och vardagens välmående. Avdelningen har fem underkategorier: Hudvård & Ansikte, Hår & Rakning, Massage & Återhämtning, Massagebänkar och Kropp & Välbefinnande.",
      "Hudvård & Ansikte har ett återfuktande hudvårdsset, en LED-lampa för ansiktet och små kylar för hudvård och kosmetika. Hår & Rakning har arbetsstolar och en sadelpall för salongen, en torkhuv på stativ, en frisörväska och en sminkväska med lås, och en IPL-apparat för hårborttagning hemma. Massage & Återhämtning har massagefåtöljer, uppresningsfåtöljer med massage och värme, benmassage med luftkompression och en muskelmassageapparat, och Massagebänkar har hopfällbara bänkar i trä och aluminium för hemmet och behandlingsrummet.",
      "Kropp & Välbefinnande har hjälpmedel för vardagen: rollatorer med sits, duschpallar och en duschstol, en toalettförhöjning, en ergonomisk sittdyna och en ljusterapilampa. Maxvikt, höjdintervall och mått står i varje produktbeskrivning, och det är dem du ska jämföra när stolen, pallen eller bänken ska passa en viss person.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad ska jag tänka på när jag väljer massagebänk?",
        a: "Titta på liggytans längd och bredd, på hur mycket bänken bär och på om höjden går att ställa. Hopfällbara bänkar med bärväska går att ta med hem till kunden. Om armstöd, nackkudde och väska ingår står i beskrivningen.",
      },
      {
        q: "Passar salongsutrustningen för hemmabruk?",
        a: "Ja. Arbetsstolarna och torkhuven på stativ fungerar lika bra för den som klipper hemma, och IPL-apparaten är gjord för hemmabruk. Jämför stolens höjdintervall med den som ska arbeta i den.",
      },
      {
        q: "Vilka hjälpmedel finns för badrummet?",
        a: "Under Kropp & Välbefinnande finns duschpallar som går att höja och sänka, en duschstol med rygg- och armstöd och en toalettförhöjning med armstöd. Jämför maxvikt och sitthöjd i beskrivningen innan du väljer.",
      },
    ],
  },

  husdjur: {
    intro: [
      "Husdjur är ordnad efter djuret. I menyn finns fyra grupper, Hund, Katt, Smådjur, fåglar & reptiler och För alla djur, så att du hittar det som gäller ditt djur utan att leta bland allt annat.",
      "Under Hund finns Hundbäddar & hundsoffor, Hundburar, Hundkojor i trä och plast, Hundgrindar för dörrar och trappor, Valphagar & hundhagar, Hundvagnar och Selar, Koppel & Transport, där hundgaller till bilen, hundtrappor och hundryggsäckar ligger. Under Katt finns Klösträd och klöstunnor, Kattlådor med tak eller som dolda kattlådsmöbler, och Katthus för både inomhus och balkong.",
      "Smådjur, fåglar & reptiler har Kaninburar & marsvinsburar, Hamsterburar & gnagarburar, Hönshus & hönsgårdar och Terrarier. För alla djur samlar Mat- och vattenskålar, med matskåp, foderautomater och vattenfontäner, Lek & tillbehör för husdjur, med trappor, ramper och kattgrottor, och Pälsvård & skötsel med trimbord för hund. Mät djuret och platsen innan du väljer: längd och vikt för bädden, buren och vagnen, golvytan för hagen och öppningen för grinden.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur väljer jag storlek på bur eller hage?",
        a: "Utgå från djurets längd och vikt och från golvytan där buren eller hagen ska stå. Djuret ska kunna stå, vända sig och ligga utsträckt. Mått, invändig höjd och maxvikt står i varje produktbeskrivning.",
      },
      {
        q: "Finns det tillbehör som passar både hund och katt?",
        a: "Ja, under För alla djur finns skålar, foderautomater, vattenfontäner, trappor och ramper som passar flera djur. Några hundgrindar har en kattlucka, och en del hundvagnar och hagar är gjorda för både hund och katt, vilket står i produktnamnet.",
      },
      {
        q: "Kan hönshuset och kaninburen stå ute?",
        a: "Många hönshus, hönsgårdar och kaninhus är gjorda för utomhus, med tak, rastgård och galvaniserat nät eller trä. Andra burar är för inomhus och har hjul eller utdragbar botten för städning. Beskrivningen säger vilket som gäller.",
      },
    ],
  },

  "sport-fritid": {
    intro: [
      "Sport & Fritid samlar det du tränar med hemma och det du tar med dig ut. I menyn är avdelningen delad i tre grupper: Träning, Spel & bollsport och Fritid. Bilprodukterna som tidigare låg här har flyttat till avdelningen Verktyg & Fordon.",
      "Under Träning finns Träning & Gym med gymstationer, spinningcyklar och stepbrädor, Hantlar & hantelset med hexhantlar, skivstänger och hantelställ, och Träningsbänkar som fälls ihop eller ställs i flera ryggvinklar. Motionscyklar har också pedaltränare för armar och ben, Boxningssäckar har boxställ och punchingbollar, och den nya underkategorin Träningskläder har yogabyxor, sport-bh och sömlösa träningsset i många färger.",
      "Gruppen Spel & bollsport har två nya underkategorier: Spel & bordsspel har pingisbord, biljardbord, pokerset och elektroniska darttavlor, och Bollsport har basketkorgar för väggen, basketställ, fotbollsmål och volleybollnät. Under Fritid finns Friluftsliv & Resa med tält, campingstolar och resväskor, Bil & Cykel med cykelkärror, cykelställ, cykellås och cykelväskor, och nya Hobby & musik med staffli, teleskop, metalldetektorer, tungtrummor och handpan.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Var hittar jag biltillbehören?",
        a: "De har flyttat till avdelningen Verktyg & Fordon. Där ligger takräcken, takkorgar, domkrafter, dieselvärmare och vinschar under Bil & släp, och laddare för elbil under Elbilsladdning & solenergi. Under Bil & Cykel här finns i huvudsak cykeltillbehör.",
      },
      {
        q: "Hur väljer jag träningsbänk och hantlar?",
        a: "Titta på maxvikten för bänken och på hur många ryggvinklar den har, så att du kan köra både plan press och lutande övningar. Justerbara hantlar och hantelset med ställ tar mindre plats än lösa par. Vikter och mått står i varje produktbeskrivning.",
      },
      {
        q: "Vad finns under Spel & bollsport?",
        a: "Spel & bordsspel har pingisbord och biljardbord som fälls ihop, pokerset i väska och elektroniska darttavlor. Bollsport har basketkorgar för väggmontering, flyttbara basketställ, fotbollsmål och nät för volleyboll.",
      },
    ],
  },

  "tradgard-utemobler": {
    intro: [
      "Trädgård & Utemöbler samlar det som hör till gräsmattan, altanen och balkongen. I menyn är avdelningen delad i fyra grupper: Uteplats, Odling, Förråd och Dekor. Utelek & Spel, med studsmattor, gungor och basketkorgar, har flyttat till Barn & Familj.",
      "Under Uteplats finns Utemöbler med trädgårdsbord, gungbänkar, solstolar och dynor, Solskydd & Paviljonger med paviljonger, reservtak och pergolatak, Grill & Utekök med gasolgrillar, kolgrillar, grillvagnar och kylboxar, Eldkorgar & eldstäder, Terrassvärmare & infravärmare för vägg eller stativ, och Skärmtak & entrétak i polykarbonat eller glas för dörr och fönster.",
      "Odling har Växthus & Odling med växthus i aluminium, väggväxthus, drivbänkar och miniväxthus, Odlingslådor i metall, trä och komposit, Blomställ & växthyllor och Trädgårdsskötsel & bevattning med slangvindor, snöskyfflar och en batteridriven lövblås. Förråd har Redskapsbodar & förråd, Garagetält och Vedställ & vedbodar, och Dekor har Trädgårdsdekor & belysning med rosenbågar, ljusslingor, konstgjorda buxbomsklot och konstgräsplattor. Mät ytan innan du väljer, och läs i beskrivningen om produkten ska stå ute året runt eller tas in över vintern.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Var hittar jag studsmattor och gungor?",
        a: "De har flyttat till Utelek & Spel under Barn & Familj, tillsammans med basketkorgar, bollnät och en hoppborg. Sandlådorna ligger också där, under Sandlådor.",
      },
      {
        q: "Vilket växthus passar en liten trädgård?",
        a: "Ett väggväxthus står mot husväggen och tar liten markyta, och drivbänkar och miniväxthus räcker för att förodla på altanen. De fristående växthusen i aluminium har skjutdörr och takfönster. Mät platsen och jämför med måtten i beskrivningen.",
      },
      {
        q: "Tål utemöblerna att stå ute på vintern?",
        a: "Det beror på materialet. Aluminium, galvaniserat stål och polyrotting klarar väder bättre än obehandlat trä, men dynor och tyg bör tas in eller täckas när säsongen är slut. Skötselråden står i produktbeskrivningen.",
      },
    ],
  },

  // Möbler skapades i Wix 2026-09-23 — se MAIN_GROUPS i category-groups.ts.
  // Texterna är skrivna mot de ~710 produkter som sorterades in samma kväll.
  mobler: {
    intro: [
      "Här samlar vi möblerna till hela hemmet, ordnade efter rum: Vardagsrum, Matplats, Sovrum, Hall och Kontor & gaming. Varje typ av möbel har sin egen sida, där du kan filtrera på mått, material, färg och pris och jämföra modellerna sida vid sida.",
      "Under Vardagsrum finns Soffor & bäddsoffor, Fåtöljer, Snurrfåtöljer, Öronlappsfåtöljer, Bäddfåtöljer och Massagestolar. Till dem hör Soffbord & småbord, Sidobord, TV-bänkar, Bokhyllor, Sideboards & vitrinskåp och Sittpuffar & fotpallar, och Rumsavdelare som skärmar av en del av rummet utan att du behöver bygga en vägg.",
      "Matplats samlar Matbord & stolar med klaffbord och utdragbara bord, färdiga Matgrupper, Barbord och Pallar. I Sovrum hittar du Sängar & sovrum med sängramar och sängbänkar, Nattduksbord, Byråer och Garderober & klädställ. Hallen har Skoskåp & skobänkar och Klädhängare & hallmöbler, och under Kontor & gaming finns Kontorsstolar, Gamingstolar, Skrivbord och Hörnskrivbord, bland annat elektriska höj- och sänkbara skrivbord.",
      "Mät innan du beställer. Bredd och djup avgör om möbeln ryms, men mät också dörrar och trapphus som den ska bäras igenom. För stolar och fåtöljer är sitthöjd och maxvikt lika viktiga, och en fåtölj med fällbar rygg behöver fritt utrymme bakom sig. Måtten står i varje produktbeskrivning.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Behöver möblerna monteras?",
        a: "De flesta möbler levereras omonterade i kartong, med beslag och monteringsanvisning. Stolar och fåtöljer är ofta klara när fot, rygg och armstöd skruvats fast, medan garderober, sängramar och större bord tar längre tid. Vad som ska monteras står i produktbeskrivningen.",
      },
      {
        q: "Hur vet jag att möbeln får plats?",
        a: "Mät golvytan där möbeln ska stå och jämför med måtten i beskrivningen. Räkna också med det som tar plats när möbeln används, till exempel en rygg som fälls bakåt, ett fotstöd som dras ut eller klaffar som fälls upp. Glöm inte att mäta dörröppningar och trappor på vägen in.",
      },
      {
        q: "Var hittar jag förvaring och utemöbler?",
        a: "Byråer, Bokhyllor, Garderober & klädställ och Sideboards & vitrinskåp ligger här under Möbler. Förvaringsbänkar, kubhyllor och hurtsar på hjul finns under Förvaring & organisering i avdelningen Hem & Inredning. Utemöblerna har en egen sida i avdelningen Trädgård & Utemöbler.",
      },
    ],
  },

  // ══ UNDERKATEGORIER (tillagda 2026-08-12) ═════════════════════════════════
  // Skrivna mot det faktiska sortimentet i respektive kategori. Tunna kategorier
  // (1–3 produkter) får kortare text som handlar om just de produkterna — hellre
  // ett stycke som stämmer än tre utfyllda som lovar ett sortiment vi inte har.

  "baby-smabarn": {
    intro: [
      "De första åren går fort, och prylarna ska hänga med. I Baby & Småbarn hittar du lekmattor i skum, gåvagnar i trä, babygungor, hopfällbara babybadkar, en lekhage med bollhavsbollar, juniorsängar och ett väggmonterat skötbord.",
      "Säkerhet och ålder går före allt annat när du handlar till småbarn. Kontrollera rekommenderad ålder och maxvikt i produktbeskrivningen, särskilt för sådant barnet sitter i, som babygungor med ryggstöd, säkerhetsbälte och bygel. En gåvagn i trä ger stöd när barnet tar sina första steg, och en lekmatta i XPE-skum dämpar när barnet ramlar.",
      "Babybadkaren viks ihop platt för förvaring och resa, och två av dem har inbyggd termometer som visar vattnets temperatur.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Från vilken ålder passar en gåvagn?",
        a: "Gåvagnarna i trä är gjorda för barn från 12 till 18 månader och ger stöd när barnet tar sina första steg. Låt barnet gå med vagnen under uppsikt på plant golv.",
      },
      {
        q: "Vad ska jag tänka på med en babygunga?",
        a: "Välj en gunga med ryggstöd, säkerhetsbälte och bygel framtill för de minsta. En av gungorna står på ett eget stativ och behöver ingen takmontering, och på en annan går ryggstöd och bygel att ta av när barnet växer.",
      },
      {
        q: "Tar ett babybadkar mycket plats?",
        a: "Nej, babybadkaren är hopfällbara och viks ihop platt för förvaring och resa. Ett av dem står på en hopfällbar ställning som lyfter badkaret till en bekväm höjd.",
      },
    ],
  },

  baddfatoljer: {
    intro: [
      "En bäddfåtölj är en fåtölj till vardags och en säng när någon sover över. Du fäller ut den, lägger ryggen plant och har en bädd som är lika lång som en vanlig säng, utan att gästrummet behöver en säng som står tom resten av året.",
      "De flesta bäddar är 180 till 193 cm långa, och tre låga fåtöljer som viks ut blir 203 eller 210 cm. Bredden är 57 till 102 cm. De smala fåtöljerna tar liten plats i ett litet rum, och de med 90 cm bred bädd ger gästen mer utrymme. Ryggen går att ställa i tre till sex lägen, så att du kan luta dig bakåt även när fåtöljen inte är bäddad.",
      "Klädseln är sammet, manchester, chenille eller tyg i linnelook, och flera har armstöd i gummiträ. Stommen är oftast av stål, och de flesta bär 120 kg. Till de flesta följer en kudde, och de flesta levereras omonterade med anvisning, medan fåtöljerna som viks i tre delar kommer färdiga.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur lång blir bädden?",
        a: "De flesta ger 183 till 190 cm, alltså en vanlig sänglängd. Tre låga fåtöljer som viks ut blir 203 eller 210 cm långa.",
      },
      {
        q: "Hur mycket bär en bäddfåtölj?",
        a: "De flesta bär 120 kg. En modell i manchester utan armstöd är byggd för 200 kg, och den trefaldiga golvmadrassen bär 240 kg.",
      },
      {
        q: "Går klädseln att tvätta?",
        a: "Kudden som följer med har avtagbart och tvättbart överdrag på flera modeller. Själva fåtöljen torkar du av, och skötselråden står i produktbeskrivningen.",
      },
    ],
  },

  "badrum-hemtextil": {
    intro: [
      "Här finns det som gör badrummet och tvättstugan lättare att använda: medicinskåp med lås, duschpallar och en duschstol, skåp och hyllor för tvätten, tvättkorgar och tvättsorterare i bambu, LED-speglar och en duschmatta i akaciaträ. Till hemtextilen hör mattor, en elektrisk värmefilt och en ställbar kilkudde för sängen.",
      "Duschpallarna ställs i höjd med en fjäderknapp i varje ben, sammanlagt från 39 till 56,5 cm, och sitsen har hål som släpper igenom vattnet. Den runda pallen är 32,5 cm i diameter och passar i en trång duschkabin, och duschstolen med rygg- och armstöd bär 158 kg. För toaletten finns en förhöjning med armstöd som höjer sitsen 9 cm och en hopfällbar toalettpall i bambu som bär 130 kg.",
      "Medicinskåpen hängs på väggen och låses med nyckel eller kodlås, och ett av dem är bara 20 cm brett och 12 cm djupt. Tvättsorteraren i bambu rymmer 83 liter i en tvättpåse och tre fack, och tvättskåpet på 70 × 38 cm har två korgar som fälls framåt. Flera LED-speglar har antiimma och är klassade IP44, och några har Bluetooth-högtalare och klocka i glaset.",
      "Mattorna finns från 160 × 120 till 160 × 230 cm. Värmefilten på 180 × 130 cm har 10 värmelägen mellan 24 och 42 °C och en timer som ställs på 1 till 10 timmar. Fler skåp och speglar finns på sidorna Badrumsskåp och Badrumsspeglar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken höjd ska duschpallen ha?",
        a: "Rätt höjd är den där fötterna når golvet och knäna ligger ungefär i höjd med höfterna, för då är det lättast att resa sig. Duschpallarna ställs från 39 till 56,5 cm. Ska du sätta dig på pallen vid badkaret och svänga in benen behöver den stå högt, eftersom ett badkar har en kanthöjd runt 55 cm.",
      },
      {
        q: "Vad skiljer ett medicinskåp från ett förbandsskåp?",
        a: "Medicinskåpen låses med nyckel eller kodlås, så att mediciner hålls utom räckhåll för barn. Förbandsskåpet stängs med en magnet och går lätt att öppna med en hand, men en magnet håller ingen borta. Ska innehållet vara oåtkomligt behöver du ett skåp med lås.",
      },
      {
        q: "Får tvättmaskinsskåpet plats över min tvättmaskin?",
        a: "En vanlig frontmatad tvättmaskin är 85 cm hög och 60 cm bred. Öppningen nedtill i tvättmaskinsskåpet är 94 cm hög och 63 cm bred, alltså med marginal åt båda hållen, och skåpet är 24 cm djupt. Samma öppning rymmer också en toalettstol.",
      },
      {
        q: "Går värmefilten att tvätta?",
        a: "Ja, filten går att tvätta i maskin när kontrollenheten är bortkopplad. Den har överhettningsskydd och en timer som ställs på 1 till 10 timmar.",
      },
    ],
  },

  badrumsskap: {
    intro: [
      "Ett badrumsskåp ska rymma mycket på liten yta och klara badrummets fukt. Här samlar vi smala skåp som får plats bredvid tvättstället, högskåp för handdukar och flaskor, tvättställsskåp, spegelskåp och medicinskåp som går att låsa.",
      "De smala skåpen börjar på 16 cm i bredd och högskåpen går upp till 185 cm, så de flesta badrum har en plats för ett. Stommarna är av lackerad MDF eller spånskiva, bambu eller rostfritt stål, och flera har justerbara hyllplan. Två av högskåpen har en inbyggd tvättkorg bakom en lucka, och på några skåp stängs dörrarna mjukt.",
      "Nästan alla medicinskåp låses med kod eller nyckel, så att mediciner hålls utom räckhåll för barn, och de flesta hängs på väggen. Till de höga skåpen följer tippskydd som ska fästas i väggen. Torka av skåpen med en lätt fuktad trasa och vädra badrummet efter duschen.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Passar ett badrumsskåp i ett litet badrum?",
        a: "Ja, välj efter bredden. De smala skåpen är från 16 cm breda och flera högskåp är bara 20 cm. Mät platsen bredvid tvättstället och räkna med utrymme för att öppna dörren.",
      },
      {
        q: "Går medicinskåpen att låsa?",
        a: "Ja, nästan alla. Fyra har kodlås och tio har nyckellås, och vilket lås skåpet har står i produktbeskrivningen.",
      },
      {
        q: "Behöver skåpen monteras?",
        a: "Ja, de flesta levereras omonterade och monteras efter anvisningen i paketet. De höga skåpen ska dessutom fästas i väggen med tippskyddet som följer med.",
      },
    ],
  },

  badrumsspeglar: {
    intro: [
      "Här hittar du badrumsspeglar med och utan belysning: rektangulära och bågformade LED-speglar, runda LED-speglar, en spegel med inbyggd förstoringsspegel, enkla speglar med hylla och spegelskåp, ett av dem med LED-belysning och antiimma.",
      "LED-speglarna har antiimma som håller en del av glaset fritt från imma efter duschen. Ljuset dimras och ställs i tre färgtemperaturer, 3 000, 4 500 och 6 500 K, och fyra av speglarna har också Bluetooth och klocka.",
      "Storlekarna går upp till 100 × 80 cm, och de flesta LED-speglarna har IP44, som tål vattenstänk. Placera ändå spegeln så att duschen inte sprutar direkt på den.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är antiimma?",
        a: "En platta eller folie bakom glaset som håller en del av spegeln fri från imma när badrummet är fullt av ånga. Storleken står i beskrivningen, till exempel 50 × 40 cm, och på den runda spegeln på 60 cm stänger den av sig själv.",
      },
      {
        q: "Vilken färgtemperatur ska jag välja?",
        a: "LED-speglarna ställs om mellan 3 000 K, som är varmt och mjukt, 4 500 K och 6 500 K, som liknar dagsljus. Det kallare ljuset visar färgerna tydligare vid sminkning och rakning.",
      },
      {
        q: "Har speglarna högtalare?",
        a: "Fyra av LED-speglarna har Bluetooth och klocka, och flera anger en högtalare på 6 W. Det står i beskrivningen vilka.",
      },
    ],
  },

  barbord: {
    intro: [
      "Här hittar du barbord för köket och vardagsrummet: set med två eller fyra pallar, set med två eller fyra stolar med ryggstöd, tre höj- och sänkbara barbord, ett vridbart barbord med glasskåp och en hopfällbar bardisk som packas i en väska. Här finns också barbord som säljs utan stolar och snurrbara barpallar med gaslyft.",
      "Borden i seten är 80 till 121,5 cm breda, och sitthöjden är 57 till 68 cm, alltså högre än vid ett matbord. Flera av seten har hyllor, och på ett av dem bär skivan 170 kg. Ett annat har vinställ och glashållare.",
      "De höj- och sänkbara barborden är runda, drygt 60 cm i diameter, och ställs mellan 70 och 90 cm, 67 och 93 cm eller 76 och 97 cm. Det vridbara barbordet på 150 cm har skåp med dörrar i räfflat glas och en sidomodul, och bardelen vrids ut i vinkel eller läggs rakt.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur högt är ett barbord?",
        a: "De flesta barbord i seten här är 87 till 95 cm höga, och sitthöjden är 57 till 68 cm. Ett vanligt matbord är lägre, så barbordet passar med pallar eller barstolar och inte med vanliga stolar.",
      },
      {
        q: "Hur mycket plats behöver ett barbord med pallar?",
        a: "Räkna med utrymme att dra ut pallarna. För setet på 105 cm anges en golvyta på minst 200 × 140 cm, och för setet med två hyllplan 1,5 × 1,5 meter.",
      },
      {
        q: "Vad är en bardisk?",
        a: "En disk att stå bakom och servera från. Bardisken här fälls upp utan verktyg, har en förvaringshylla och en front i tyg som går att ta av, och packas i en bärväska. Den finns i två längder, 98 och 110 cm.",
      },
    ],
  },

  barnmobler: {
    intro: [
      "Här hittar du barnmöbler: barnfåtöljer och barnsoffor, barnbord med stolar, barnskrivbord, stapelbara barnpallar, stegpallar, två barnsängar för en madrass på 140 × 70 cm, sminkbord för barn, bokhyllor och leksakshyllor med tygboxar och låga barngarderober med klädstång och spegel.",
      "Barnfåtöljerna finns i teddyfleece, manchester, linnelook och konstläder, och den med kronrygg och den med rutmönstrad rygg har en fotpall eller pall till. En har ett fällbart ryggstöd och blir 90 cm lång. Barnsoffan på 77 cm har plats för två barn och bär 80 kg.",
      "Sminkborden för barn har spegel och pall eller stol, och på flera är spegeln av akryl, som inte splittras. Tre blir skrivbord när spegeln tas av, och ett barnbord och tre sminkbord är testade enligt leksaksstandarden EN 71. Två av barnskrivborden är höj- och sänkbara och har en skiva som lutar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Från vilken ålder passar barnfåtöljerna?",
        a: "Det står i varje beskrivning. Fåtöljen i teddyfleece passar från 18 månader, och fåtöljerna i linnelook är gjorda för 3–5 år. Barnsoffan för två barn bär 80 kg.",
      },
      {
        q: "Vad är en utklädningsgarderob?",
        a: "En låg, öppen garderob med klädstång, hyllor och spegel i barnets höjd, så att barnet själv når kläderna. Två av dem är gjorda i trä efter Montessoriidén, och den rosa har två tyglådor.",
      },
      {
        q: "Behöver barnmöblerna monteras?",
        a: "De flesta monteras hemma, och till dem följer en anvisning. Barnsoffan i jordgubbsdesign kräver ingen montering.",
      },
    ],
  },

  belysning: {
    intro: [
      "Rätt ljus förändrar ett rum mer än de flesta möbler. I Belysning hittar du taklampor, bordslampor, vägglampor, takfläktar med belysning, dekorativa LED-björkar och ljusslingor och en bärbar LED-strålkastare för arbete ute och i verkstaden. Golvlamporna ligger också här, och de har dessutom en egen sida.",
      "Tre saker avgör valet. Sockeln måste matcha lampan du tänkt använda (E27 är vanligast). IP-klassen talar om hur mycket väta armaturen tål — utomhus och i garage vill du ha minst IP44. Ljusmängden mäts i lumen, inte watt: en LED-armatur drar en bråkdel av en gammal glödlampas effekt vid samma ljus. Allt detta anges i produktbeskrivningen.",
      "Taklamporna finns i kristall, med skärm i linne eller hampsnöre och som LED-lampor med fjärrkontroll. Bordslamporna är i keramik, trä och glas, flera har USB-uttag i foten och ett par är sladdlösa och laddbara, så att de kan stå där det saknas eluttag.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken lampsockel behöver jag?",
        a: "Sockeltypen anges för varje armatur, och E27 är den vanligaste i svenska hem. Har du redan lampor hemma, kontrollera att sockeln stämmer innan du beställer.",
      },
      {
        q: "Vilken belysning tål att stå ute?",
        a: "Det som är gjort för utomhusbruk har en IP-klass angiven, som IP44 på ljusslingan och flera LED-björkar och IP65 på LED-strålkastaren. Är ingen IP-klass angiven är armaturen tänkt för inomhusbruk.",
      },
      {
        q: "Passar en takfläkt med belysning i ett rum med lågt tak?",
        a: "Takfläkten med infällbara blad är 40 cm i diameter när den står still, och bladen fälls ut till 95 cm när den startar. Den med tre träblad är 117 cm i diameter och gjord för en takhöjd på 2,8–3 m, så mät takhöjd och yta först.",
      },
    ],
  },

  "bil-cykel": {
    intro: [
      "Här samlar vi tillbehör till cykeln och cyklisten: cykelkärror och en cykelvagn för last, pakethållarväskor, ramväskor och sadelväskor, cykellås, cykelpumpar, sadlar, pedaler och handtag, mekställ och cykelställ, en cykellyft för taket, ett cykeltält och två barncyklar. Här finns också displayer till elcykeln och några saker för bilen, som laddkablar och en elektrisk domkraft.",
      "Cykelkärrorna för last bär 40 kg och kopplas till de flesta cyklar med en universalkoppling. Kärran på 55 liter blir en dragvagn när du kopplar loss den. Pakethållarväskorna går att expandera, från 17 till 31 liter och från 20 till 35 liter, och ryggsäcken på 10 liter har plats för en vätskeblåsa. Golvpumpen har manometer och pumpar upp till 160 PSI, och den elektriska minipumpen stannar själv vid det tryck du ställt in.",
      "Låsen finns som kättinglås på 93 cm i 8 mm härdat stål och som vikbara lås på 78 och 80 cm. Golvställen håller cykeln upprätt, och ett av dem tar däck från 30 till 80 mm. Cykellyften hissar upp cyklar på upp till 60 kg i taket. Barncykeln på 20 tum har 7 växlar, och den på 12 tum har stödhjul som tas av när barnet klarar balansen.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Passar cykelpumpen min ventil?",
        a: "Golvpumpen har ett dubbelt pumphuvud för både Schrader- och Prestaventiler, och med de medföljande luftnålarna pumpar den även bollar. Kontrollera vilken ventil dina slangar har och vilket tryck som står på däckets sida innan du pumpar.",
      },
      {
        q: "Hur mycket rymmer en cykelkärra?",
        a: "Kärrorna för last bär 40 kg, och ett av lastutrymmena är 86 × 57 × 36 cm, vilket räcker till en back och två kassar. Kärran på 55 liter är mindre men fälls ihop till 33 × 30 × 72 cm. Lasta det tyngsta längst ner och över hjulaxeln, så att kärran går stadigt.",
      },
      {
        q: "Vilket cykellås ska jag välja?",
        a: "Ett kättinglås går runt hjul, ram och en fast stolpe på en gång, och kättingen på 93 cm är av 8 mm härdat stål med nylonhölje som skyddar lacken. De vikbara låsen fälls ihop till ett kompakt paket, och till det ena följer ett fäste för ramen. Lås alltid ramen, inte bara hjulet, mot något som sitter fast.",
      },
    ],
  },

  "blomstall-vaxthyllor": {
    intro: [
      "Ett blomställ samlar krukväxterna på liten yta och ger varje växt sitt eget ljus. Här samlar vi blomställ, växthyllor och blompallar för vardagsrummet, balkongen och altanen: i trappform, för hörnet, hopfällbara eller med krokar för hängande krukor.",
      "De flesta har en stomme av pulverlackerad eller rostskyddad metall och kan stå både inne och ute. Hyllor av galler släpper igenom vatten, och växtstället med tråg har en kant runt det övre planet och två dräneringshål, så att krukorna står kvar och vattnet inte blir stående.",
      "Titta på bärförmågan per plan. På de flesta ställ i metall bär varje plan 10 till 25 kg, medan blomstället i vitt med sju nivåer bär 2 kg per nivå och passar för mindre krukor. Blompallarna med mosaikskiva är tre stycken, 51, 61 och 71 cm höga, och de ryms i varandra när de ställs undan.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Kan blomstället stå ute?",
        a: "De flesta kan det. Stommen är pulverlackerad eller rostskyddad, och i beskrivningen står om stället är gjort för både inne och ute. Står det ute över vintern, ta in det eller ställ det under tak.",
      },
      {
        q: "Hur mycket bär ett blomställ?",
        a: "Det skiljer sig mycket. På de flesta ställ i metall bär varje plan 10 till 25 kg, blompallarna bär 30 till 50 kg och blomstället med sju nivåer 2 kg per nivå. Bärförmågan står i varje produktbeskrivning.",
      },
      {
        q: "Vad är skillnaden mellan ett blomställ och en växthylla?",
        a: "Ingen egentlig, det är två namn på samma sak: ett ställ med flera plan där krukväxterna står på olika höjd. Blompallar är lösa pallar för en kruka var, som kan ställas bredvid varandra som en trappa.",
      },
    ],
  },

  bokhyllor: {
    intro: [
      "Här hittar du bokhyllor till vardagsrummet, kontoret och barnrummet: smala och låga hyllor, kubhyllor med öppna fack, bokhyllor i trädform, en roterande kubhylla och hyllor på hjul.",
      "De höga bokhyllorna levereras med tippskydd som fäster dem i väggen. En av dem har LED-belysning i sju färger på varje plan.",
      "Barnbokhyllorna har lutande plan eller fack där omslagen syns i stället för ryggarna, så att ett barn som inte läser än hittar sin bok. Flera har formen av moln, hus eller björn, och två har tyglådor.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket tål hyllplanen?",
        a: "Det skiljer sig mycket och står i beskrivningen: från 2 kg per plan i mediahyllan och 3 kg per plan i en barnbokhylla till 20 kg per plan i den öppna bokhyllan med stålram.",
      },
      {
        q: "Måste bokhyllan fästas i väggen?",
        a: "En hög eller smal hylla ska alltid fästas, och de flesta bokhyllorna levereras med tippskydd. Skruva i väggmaterialet, inte bara i gipsskivan.",
      },
      {
        q: "Finns det bokhyllor för barn?",
        a: "Ja, med lutande plan där omslagen syns, i form av moln, hus och björn, och en kubhylla med tyglådor. Flera har rundade kanter.",
      },
    ],
  },

  boxningssackar: {
    intro: [
      "Med en boxningssäck hemma tränar du när det passar dig. Här samlar vi fristående boxningssäckar, boxsäcksställ med säck och speedball, punchingbollar på fjädrande stång, boxställ med två speedballs och ett väggfäste för en säck du redan har.",
      "De fristående säckarna står på en fot som fylls med vatten eller sand. Foten levereras tom och fylls först när säcken står på plats, och flera har sugproppar under foten som ger grepp mot ett slätt golv. Punchingbollarna och ställen går att höja och sänka, och höjderna går från 125 till 231 cm.",
      "Till flera följer boxhandskar med, och boxsäcksställen har plats för både säck och speedball. Väggfästet håller en säck på upp till 100 kg, 80 cm ut från väggen, men säcken köper du separat.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad fyller man foten med?",
        a: "Vatten, sand eller båda. Sand ger mest tyngd: i en av säckarna tar foten 120 kg sand eller 70 kg vatten. Sanden eller vattnet köper du själv, eftersom foten levereras tom.",
      },
      {
        q: "Behöver jag borra i väggen?",
        a: "Nej, de fristående säckarna och ställen står på golvet. Bara väggfästet skruvas i väggen.",
      },
      {
        q: "Vad är en speedball?",
        a: "En liten boll som sitter på en fjäder eller i ett ställ och studsar tillbaka när du slår, så att du tränar snabbhet och träffsäkerhet.",
      },
    ],
  },


  byraer: {
    intro: [
      "Här hittar du byråer till sovrummet, hallen och barnrummet: smala byråer från 20 cm bredd, breda byråer upp till 130 cm, en låg modell på 51,5 cm och höga byråer med fem lådor.",
      "Ungefär hälften har tyglådor på en stomme av stål, MDF eller bambu. Flera levereras med tippskydd som fäster byrån i väggen, och det står i beskrivningen vilka.",
      "Två byråer har eluttag och USB ovanpå, så att mobilen laddas på byrån. En byrå har ett skåp bredvid lådorna.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur djup är en smal byrå?",
        a: "Flera byråer är bara 29 eller 30 cm djupa och passar i hallen eller bredvid sängen. Djupet står alltid i måtten.",
      },
      {
        q: "Varför ska byrån fästas i väggen?",
        a: "En byrå med utdragna lådor kan välta framåt, till exempel om ett barn klättrar på den. Tippskyddet håller den mot väggen, och det följer med flera av byråerna.",
      },
      {
        q: "Behöver byrån monteras?",
        a: "Ja, byråerna levereras omonterade, med anvisning i kartongen.",
      },
    ],
  },


  "dekoration-prydnad": {
    intro: [
      "Här finns dekoration för väggar, golv och hörn: väggdekor i metall och 3D-tavlor, konstgjorda träd och buxbomar i kruka, LED-björkar med ljuset på grenarna, växtpiedestaler, växtställ och väggkrukor. Speglar och fler konstgjorda växter har egna sidor, Speglar och Konstväxter.",
      "Väggdekoren levereras med krokar och hänger nära väggen. Världskartan i svart metall består av tre paneler på 50 × 80 cm som tillsammans täcker 150 cm vägg och är 1,9 cm djupa, och dekoren med skålade cirklar i svart, blått och guld är ett enda stycke på 121 × 53 cm. 3D-tavlorna i vitt och ljusgrått är 80 × 80 cm var med laserskurna former i relief.",
      "De konstgjorda träden och buxbomarna levereras färdiga i kruka, och på många ligger cement i botten så att de står stadigt. Flera är UV-beständiga och kan stå ute vid entrén eller på balkongen, till exempel lavendelträden på 60 cm och cypresserna på 90 cm. LED-björkarna är 120 till 180 cm höga med 72 till 120 lampor, och flera är klassade IP44 för utomhus under tak.",
      "Växtpiedestalerna i svart stål är 50, 70 och 90 cm höga, och hörnblomstället har tre plan som bildar en trappa ut från hörnet. Väggkrukorna i svart stål har en front i akryl, så att jord och stenar syns.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur hänger jag upp väggdekoren?",
        a: "Väggdekoren levereras med krokar, och på flera sitter de redan på baksidan, så du behöver bara skruv eller spik i väggen. Världskartan hänger i tre delar, och avståndet mellan dem väljer du själv: tätt ihop blir det en sammanhängande karta, med glapp blir det tre tavlor. 3D-tavlorna levereras färdigmonterade med krokar på baksidan.",
      },
      {
        q: "Kan de konstgjorda träden stå utomhus?",
        a: "Många kan det. De UV-beständiga, som lavendelträden och cypresserna i kruka, står både inne och ute, och cementen i krukans botten ger tyngd så att de står kvar. LED-björkarna är gjorda för inomhus eller utomhus under tak.",
      },
      {
        q: "Hur mycket bär växtställen?",
        a: "Växtpiedestalerna bär 30 kg var, så även en stor kruka med jord får plats, och hörnblomstället bär också 30 kg. Växtstället på 60 cm har en kant runt det övre planet, så att krukorna inte glider av, och två dräneringshål i botten.",
      },
    ],
  },

  "elbilar-for-barn": {
    intro: [
      "En elbil ger barnet egen fart på gården, i parken och på uppfarten. Här samlar vi alla våra eldrivna åkfordon för barn: elbilar och terrängbilar, elfyrhjulingar, elmotorcyklar, Vespa-scootrar, eltraktorer med släp och elgokarts. Det finns modeller för barn från 18 månader upp till 12 år, och flera är licensierade modeller av riktiga bilar från Mercedes-Benz, Audi, BMW, Lamborghini och Toyota.",
      "Välj efter ålder och volt. 6 V passar de minsta: farten ligger oftast på 2,5–3 km/h, och de flesta motorcyklarna i klassen har stödhjul. 12 V är det vanligaste valet från tre år, med en toppfart på upp till 8 km/h, och nästan hälften av modellerna har en fjärrkontroll så att du kan styra tills barnet kör själv. 24 V ger mer kraft för äldre barn, upp till 18 km/h, och här finns också en tvåsitsig elfyrhjuling.",
      "En full laddning räcker till 30–70 minuters körning beroende på modell, underlag och barnets vikt, och laddningen tar oftast 8–12 timmar. Maxvikten går från 20 kg på de minsta fordonen till 65 kg på de största, och flera modeller har bälte, fjädring och mjukstart.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken elbil passar mitt barns ålder?",
        a: "För barn från 18 månader passar 6 V-fordon med låg fart, till exempel elfyrhjulingar och elmotorcyklar med stödhjul. Från tre år är 12 V det vanligaste valet, och för barn upp till 12 år finns 24 V-modeller med två hastighetslägen. Kontrollera åldersintervallet och maxvikten i produktbeskrivningen.",
      },
      {
        q: "Går det att styra elbilen med fjärrkontroll?",
        a: "Ja, nästan hälften av modellerna har en fjärrkontroll för föräldern. Med den styr du bilen tills barnet klarar det själv, och de flesta av de modellerna har dessutom bälte.",
      },
      {
        q: "Hur länge räcker batteriet?",
        a: "En full laddning ger 30–70 minuters körning, beroende på modell, underlag och barnets vikt. Laddningen tar oftast 8–12 timmar, så det enklaste är att ladda över natten.",
      },
    ],
  },

  "eldkorgar-eldstader": {
    intro: [
      "En eldkorg eller eldstad utomhus samlar sällskapet på uteplatsen, även när kvällarna blir kalla. Här samlar vi eldkorgar från Ø38 till Ø75 cm, rökfria modeller, eldkorgar med grillgaller och gnistkåpa, en eldkorg formad som ett torn, ett eldbord med bordsyta runt elden och ett fyrfat i stål.",
      "De rökfria eldkorgarna har sekundärförbränning, som bygger på lufthål i korgen. Täcks hålen slutar den att fungera, och den förutsätter torr ved: blöt ved ryker oavsett vad korgen gör.",
      "Flera eldkorgar har grillgaller och gnistskydd. Vad som ingår, till exempel gnistskydd, grillgaller och eldgaffel, står i produktbeskrivningen.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Varför ryker min rökfria eldkorg?",
        a: "Fuktig ved är den vanligaste orsaken – den ryker oavsett hur förbränningen är konstruerad. Elda med torr ved, och täck inte lufthålen, för då slutar den sekundära förbränningen att fungera.",
      },
      {
        q: "Kan jag grilla på eldkorgen?",
        a: "Ja, flera av eldkorgarna har ett grillgaller som läggs över elden. Vilka som har det står i produktbeskrivningen.",
      },
      {
        q: "Får jag elda när det är eldningsförbud?",
        a: "Under eldningsförbud gäller länsstyrelsens eller kommunens besked, och reglerna skiljer sig åt beroende på om du lagar mat eller bara eldar för värmen. Kontrollera vad som gäller där du bor innan du tänder.",
      },
    ],
  },

  elementskydd: {
    intro: [
      "Här hittar du elementskydd, också kallade radiatorskydd, som döljer elementet bakom en spjälad front. Fronten släpper igenom den varma luften, och ovansidan blir en hylla där du kan ställa lätta saker.",
      "Skydden är 60 till 201 cm breda, 18 till 19 cm djupa och 81 till 95,5 cm höga. Det vita på 60 eller 90 cm finns i två bredder, ett vitt skydd dras ut från 125 till 201 cm, och det på 172 cm täcker ett långt element under ett fönster.",
      "Elementskyddet i ekton har vågräta spjälor och två lådor i överkant, och gavlarna har ett förskuret urtag för golvlisten. Flera förankras i väggen med beslag, vältskydd eller väggclips som följer med.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mäter jag för ett elementskydd?",
        a: "Mät elementets bredd, höjd och djup, inklusive rör och termostat, och jämför med skyddets innermått. Det vita på 112 cm har till exempel innermåttet 106,8 × 16,8 × 80,3 cm.",
      },
      {
        q: "Minskar ett elementskydd värmen?",
        a: "Något, eftersom skyddet står framför elementet. Den spjälade fronten släpper ändå igenom den varma luften, så värmen når rummet.",
      },
      {
        q: "Hur mycket tål hyllan ovanpå?",
        a: "På det vita skyddet på 60 eller 90 cm tål toppskivan 5 kg. Ställ bara lätta saker där, som några böcker, och torka upp spill direkt, eftersom MDF inte tål väta.",
      },
    ],
  },

  elkaminer: {
    intro: [
      "En elkamin ger känslan av en brasa utan skorsten, ved eller aska. Lågorna är LED-ljus, och kaminen värmer rummet när du vill. Här samlar vi väggkaminer att hänga på väggen eller bygga in, fristående kaminer och konsolmodeller, en cylindrisk kamin och små elkaminer på ben.",
      "Effekten är 1200 till 2000 W, och de flesta har två värmelägen, så att du kan välja till exempel 1000 W en sval kväll och full effekt när det är kallt. De flesta går också att köra som ren flameffekt utan värme, och flera har fjärrkontroll, termostat, timer och överhettningsskydd.",
      "Väggkaminerna finns upp till 152 cm breda, och några är gjorda för att byggas in i en vägg eller nisch. Andra ska sitta utanpå väggen, och det står i beskrivningen. Ljudnivån ligger under 50 till 55 dB, alltså hörbar i ett tyst rum men inte påträngande.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Går elkaminen att använda utan värme?",
        a: "Ja, de flesta kan köras som ren flameffekt, så att du har lågorna året om utan att rummet blir varmt.",
      },
      {
        q: "Hur mycket värmer en elkamin?",
        a: "Effekten är 1200 till 2000 W, och de flesta har ett lägre läge. En av konsolmodellerna anges värma ett rum på upp till 30 kvadratmeter.",
      },
      {
        q: "Kan man bygga in en elkamin i väggen?",
        a: "Några väggkaminer är gjorda för inbyggnad, och det står i beskrivningen. Andra ska sitta utanpå väggen och ska inte byggas in i en nisch.",
      },
    ],
  },

  "forvaring-organisering": {
    intro: [
      "Här finns förvaring till hela hemmet: förvaringsbänkar och puffar med plats under locket, förvaringsskåp och köksskåp, hurtsar på hjul, hyllor i bambu och metall, klädställningar och modulgarderober, torkvagnar, mediahyllor, leksaksförvaring för barnrummet och shoppingvagnar. Byråer, bokhyllor, skoskåp och tvättkorgar har egna sidor.",
      "Förvaringsbänkarna är från 82 till 138 cm långa, och under locket ryms från 39 till 84 liter, nog för sängkläder och gästtäcken. Ottomanbänken på 125 cm har ett enda fack på 113 × 38 × 22 cm utan mittstöd. Förvaringspuffen i sammet rymmer 67 liter och fälls ihop till 7,5 cm när den inte behövs.",
      "Till kontoret finns hurtsar i stål med tre lådor på samma lås, och på den med hjul tar bottenlådan hängmappar i A4. Till köket finns smala skåp, som ett på 40 cm bredd och 180 cm höjd för luckan mellan kylen och väggen, köksvagnar med arbetsyta och en rullvagn som bara är 13 cm bred och ryms i glipor där inget annat får plats.",
      "Torkvagnen med fyra nivåer bär 60 kg tvätt och är 13 cm djup hopfälld, och det uppvärmda torkstället drar 230 W. Klädställningen på hjul ställs från 95 till 170 cm i höjd och från 86 till 160 cm i bredd. Mediahyllan på 175 cm rymmer upp till 640 cd, och leksakshyllorna är i höjd för barn mellan 3 och 8 år.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket ryms i en förvaringsbänk?",
        a: "Mät facket under locket, inte bänkens yttermått. Den ovala bänken på 82 cm rymmer 39 liter och bänken på 112 cm i manchester 84 liter. På flera håller en gaskolv eller ett stag locket uppe medan du packar.",
      },
      {
        q: "Kan hurtsen låsas?",
        a: "Ja, flera hurtsar låses, och på stålhurtsarna med tre lådor låses alla lådor med samma nyckel. Hurtsen på hjul är 60 cm hög och rullar in under skrivbordet, och bottenlådan har skenor för hängmappar i A4.",
      },
      {
        q: "Var hittar jag byråer och bokhyllor?",
        a: "Byråer, Bokhyllor och Skoskåp & skobänkar ligger under Möbler, och Tvättkorgar under Badrum & tvätt i Hem & Inredning. Här samlar vi den förvaring som inte hör till någon av dem.",
      },
    ],
  },

  "friluftsliv-resa": {
    intro: [
      "Här samlar vi utrustning för campingen, vandringen och resan: tält från lätta vandringstält till tunneltält för familjen, sovsäckar, liggunderlag och campingsängar, campingstolar och campingbord, kylboxar och en kylvagn, vandringsryggsäckar och vandringsstavar, resväskor, och tillbehör till husvagnen och båten som stödben, överdrag, bryggstege och fendrar.",
      "Tälten finns för en till åtta personer. Tvåmanstältet på 1,44 kg och cykeltältet för en person på 1,3 kg är gjorda för att bäras, medan tunneltälten har sovrum i ändarna och vardagsrum emellan, och det uppblåsbara tältet reses med pump i stället för stänger, med golvyta från 3 × 2 till 4 × 3 m. Mumiesovsäcken finns med komfort ned till plus 4 eller minus 5 °C, och kylboxarna på 42,6 och 70 liter håller kylan i upp till 72 timmar på is utan ström.",
      "Resväskorna har hårt skal, TSA-lås och fyra snurrhjul, från handbagagekofferten på 56 cm och 40 liter till den stora på 77 cm som rymmer 103 liter. För barnen finns en resväska på 26 liter som de kan sitta och åka på. Vandringsstavarna i kolfiber väger 193 g styck och ställs mellan 62 och 135 cm.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilket tält ska jag välja?",
        a: "Utgå från hur ni tar er fram. Bär du tältet i ryggsäcken eller på cykeln är vikt och packmått viktigast, och tvåmanstältet på 1,44 kg packas ner till en rulle på Ø 13 × 40 cm. Står ni med bilen på campingen passar ett tunneltält med sovrum och vardagsrum, eller ett uppblåsbart tält som står på 10–15 minuter.",
      },
      {
        q: "Vilken sovsäck behöver jag?",
        a: "Titta på komforttemperaturen, alltså den temperatur där du sover bekvämt. Mumiesovsäcken finns i en version för sommar och tidig höst med komfort ned till plus 4 °C och en varmare med komfort ned till minus 5 °C. Dunsovsäcken i kuvertmodell öppnas helt och kan användas som filt.",
      },
      {
        q: "Hur stor resväska behöver jag?",
        a: "Handbagagekofferten på 56 cm rymmer 40 liter, mellanstorleken på 66 cm rymmer 68 liter och den stora på 77 cm rymmer 103 liter, vilket räcker till en längre resa eller en familjs packning. Kontrollera flygbolagets mått för handbagage innan du packar. Mellanstorleken och den stora går att expandera när det behövs mer plats.",
      },
    ],
  },

  garagetalt: {
    intro: [
      "Ett garagetält ger motorcykeln, cyklarna och trädgårdsredskapen tak över huvudet utan att du behöver bygga något. Här samlar vi våra garagetält, från 120 × 179 cm för två cyklar eller en motorcykel till ett tält på 300 × 300 cm med 9 m² golvyta, och ett förrådstält på 300 × 447 cm med 13,4 m², där du går upprätt över hela golvet. För motorcykeln finns också ett motorcykelgarage i Oxfordtyg på 345 × 135 cm med en front som skjuts bakåt över taket.",
      "De flesta har stomme i galvaniserat stål och duk i PE eller polyester, och dörren rullas upp eller öppnas med dragkedja. Förankring följer med, oftast markankare eller jordspett och spännlinor, så att tältet står stadigt. Titta på snölasten – den står för varje modell, till exempel 5 eller 10 kg per kvadratmeter – och borsta av taket efter snöfall.",
      "Ett tält på 162 × 221,5 cm är djupt nog för en motorcykel eller ett par cyklar efter varandra.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Klarar garagetältet snö?",
        a: "Snölasten står för varje modell, till exempel 5 eller 10 kg per kvadratmeter. Det räcker för ett lätt snölager, så borsta av taket efter snöfall.",
      },
      {
        q: "Vad får plats i ett garagetält?",
        a: "Tältet på 120 × 179 cm rymmer två cyklar, en motorcykel eller trädgårdsredskap. Tältet på 162 × 221,5 cm är djupt nog för en motorcykel eller ett par cyklar efter varandra, och det stora tältet på 300 × 300 cm har 9 m² golvyta. I förrådstältet på 13,4 m² får en motorcykel och ett hyllställ plats samtidigt.",
      },
      {
        q: "Hur förankras tältet?",
        a: "Förankring följer med, oftast markankare eller jordspett och spännlinor. Garagetältet på 190 × 230 cm har dessutom expanderskruvar och motorcykelgaraget expanderpluggar för betong och annat hårt underlag.",
      },
    ],
  },

  gnistskydd: {
    intro: [
      "Här hittar du gnistskydd, också kallade brasskärmar, som ställs framför den öppna spisen och fångar gnistor och glöd som flyger ut ur elden. De står fritt och flyttas undan när du lägger in ved.",
      "De flesta har tre paneler, där sidopanelerna vinklas bakåt så att skyddet står stadigt och täcker även åt sidorna. Bredden är 96 till 141 cm och höjden 50 till 85 cm, så mät spisens öppning innan du väljer.",
      "Ett gnistskydd är guldfärgat och har dubbeldörrar i mitten, och ett har handtag och en välvd mittpanel. Gnistskyddet i smidesdesign på 128 cm levereras färdigmonterat, och flera går att fälla ihop när de inte används.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stort gnistskydd behöver jag?",
        a: "Skyddet ska vara bredare och högre än spisens öppning, så att det täcker hela eldstaden. Ett tredelat skydd tar mindre bredd när det vinklas: det som är 114 cm brett utfällt spänner 108 cm vinklat.",
      },
      {
        q: "Vad är skillnaden mellan gnistskydd och brasskärm?",
        a: "Ingen, det är två namn på samma sak: en skärm av metall som ställs framför en öppen eld och tar emot gnistorna.",
      },
      {
        q: "Blir gnistskyddet varmt?",
        a: "Ja, metallen blir varm när den står nära elden. Låt skyddet svalna innan du flyttar det, och håll barn och husdjur borta från det medan det brinner.",
      },
    ],
  },

  golvlampor: {
    intro: [
      "En golvlampa ger ljus där taklampan inte når: bredvid soffan, vid läsfåtöljen eller i ett mörkt hörn. Här samlar vi båglampor, golvlampor med inbyggd LED, lampor med skärm i tyg eller linnelook, golvlampor med hyllor och lampset där golvlampan har två bordslampor i samma stil.",
      "Lamporna är från 129 till 190 cm höga, och några går att höja och sänka. De flesta båglamporna har en tung fot i marmor som håller den långa armen stadig. Flera går att dimra, många har fjärrkontroll och de flesta har en fotbrytare, så att du tänder utan att böja dig.",
      "Titta på ljuskällan innan du beställer. I lamporna med inbyggd LED sitter ljuset fast, till några lampor med E27-sockel ingår lamporna och till andra köper du dem separat. Flera LED-lampor går att ställa om mellan varmt och kallt ljus, från 3000 till 6500 kelvin.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Ingår glödlampan?",
        a: "Det beror på lampan. I lamporna med inbyggd LED sitter ljuskällan fast. Till några lampor med E27-sockel ingår lamporna, till andra köps de separat, och det står i produktbeskrivningen.",
      },
      {
        q: "Vad är en båglampa?",
        a: "En golvlampa med en lång, böjd arm som når ut över soffan eller bordet, så att ljuset kommer ovanifrån. Foten är tung, ofta i marmor, så att lampan står stadigt.",
      },
      {
        q: "Kan jag ladda mobilen i lampan?",
        a: "Ja, i tre av golvlamporna med hyllor. Den med bambuhylla har USB-uttag, och två har både USB-A, USB-C och ett vanligt eluttag.",
      },
    ],
  },

  "grill-utekok": {
    intro: [
      "Grillen är samlingspunkten på altanen. Här samlar vi gasolgrillar, kolgrillar och planchor, grillvagnar och campingbord, kylboxar och kylvagnar för drycken, och tillbehör som grilltält och eldstadsverktyg. Eldkorgarna har en egen sida under Eldkorgar & eldstäder.",
      "Gasolgrillarna har från två till fem brännare, och en plancha är en stekhäll som värms av gasolbrännare. Till både gasolgrillarna och planchorna följer regulator och slang med, så du behöver bara en gasolflaska. Kolgrillarna finns på vagn och på hjul, och som portabla och hopfällbara modeller.",
      "Två av kylboxarna håller kylan i upp till 72 timmar på is, den ena helt utan el, och flera kylboxar och kylvagnar står på hjul.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Ingår regulator och slang?",
        a: "Ja, till både gasolgrillarna och planchorna ligger regulator och slang i kartongen. Gasolflaskan köper du separat.",
      },
      {
        q: "Hur länge håller kylboxen kylan?",
        a: "Det beror på modell och på hur mycket is du lägger i. Den som håller längst klarar upp till 72 timmar på is, och tiden anges i produktbeskrivningen.",
      },
      {
        q: "Kan jag grilla på en eldkorg?",
        a: "Ja, flera av eldkorgarna har grillgaller. De finns under Eldkorgar & eldstäder.",
      },
    ],
  },

  "gunghastar-gungdjur": {
    intro: [
      "En gunghäst tränar balansen utan att barnet tänker på det. Här samlar vi våra gunghästar och gungdjur: klassiska gunghästar i trä, mjuka hästar i plysch på medar och gungdjur formade som svan, giraff, ren, elefant, dinosaurie och nallebjörn – för barn från 12 månader upp till sex år. Här finns också två åkhästar i plysch, en på hjul och en elektrisk med fotpedal.",
      "För de minsta är ryggstöd och bälte viktigast. En klassisk gunghäst kräver att barnet kan hålla balansen sittande själv, medan gungdjur med ryggstöd och bälte passar redan från 18 månader. Många av plyschdjuren har ljud, som gnäggande eller melodier, och maxvikten går från 25 upp till 60 kg.",
      "Låt alltid en vuxen ha uppsikt när barnet gungar. På hästarna med ljud drivs ljudet av batterier, och den elektriska åkhästen har en plyschklädsel som går att ta av och tvätta i maskin.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Från vilken ålder passar en gunghäst?",
        a: "Gungdjur med ryggstöd och bälte passar från 18 månader, och flera gungdjur redan från 12 månader. En klassisk gunghäst utan ryggstöd kräver att barnet kan hålla balansen själv, och flera är gjorda för barn från två eller tre år.",
      },
      {
        q: "Trä eller plysch?",
        a: "En gunghäst i trä är lätt att torka av med en fuktad trasa. En plyschhäst är mjukare och har ofta ljud eller melodier, och på den elektriska åkhästen går klädseln att ta av och tvätta i maskin.",
      },
      {
        q: "Hur mycket får barnet väga?",
        a: "Maxvikten varierar mellan 25 och 60 kg på de modeller som anger den. Kontrollera den i beskrivningen innan du köper.",
      },
    ],
  },

  halloweendekoration: {
    intro: [
      "Halloweendekoration gör entrén och trädgården till en del av kvällen. Här samlar vi två sorters figurer: uppblåsbara spöken, pumpor, skelett och portar för gräsmattan, och animerade häxor, zombier, clowner och liemän som rör sig, lyser och låter när någon kommer nära.",
      "De uppblåsbara figurerna reser sig av sig själva när du kopplar in fläkten och håller formen så länge den går. De lyser inifrån, och de flesta har en duk som är IP44-klassad för regn och stänk. Till de flesta följer markpinnar och linor med för att förankra figuren i gräset. Fläkten behöver ström, så ställ figuren nära ett uttag eller använd en förlängningssladd för utomhusbruk.",
      "De animerade figurerna drivs med batterier och behöver ingen sladd. De flesta startar av rörelse, ljud eller beröring och tänder ögonen, rör sig och skriker, ylar eller skrattar. Många är gjorda för att stå inne eller under tak, till exempel i hallen eller på verandan.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Tål de uppblåsbara figurerna regn?",
        a: "De flesta har en duk som är IP44-klassad, vilket täcker regn och stänk. Förankra figuren med markpinnarna och linorna, och ta in den vid storm – en hög duk tar mycket vind.",
      },
      {
        q: "Ingår batterier i de animerade figurerna?",
        a: "I de flesta gör de inte. Vilka batterier figuren behöver står i produktbeskrivningen, så köp dem samtidigt om figuren ska vara igång samma kväll som paketet kommer.",
      },
      {
        q: "Varför startar figuren av sig själv?",
        a: "Sensorn är känslig med flit, så att den reagerar på ett barn som kommer gående. Blåst och trafikbuller kan därför också starta den. Står figuren blåsigt kan du slå av den mellan besöken och slå på den igen när det ringer på.",
      },
    ],
  },

  "hamsterburar-gnagarburar": {
    intro: [
      "Här finns hamsterburar i trä, en dvärghamsterbur, hamsterburar med rörsystem och tunnlar och större gnagarburar för råtta, degu och chinchilla. En stor hamsterbur i trä på ben mäter 110 cm och har ett enda öppet plan, och gnagarburen på 128 cm med fyra plan står på hjul.",
      "Hamstrar gräver, så bäddens djup spelar roll. Hamsterburen i trä med djup bädd har 31 cm fri höjd i bottenplanet, nog för en bädd där djuret kan gräva riktiga gångar, och gnagarburen på hjul har en 26 cm djup underdel i härdat glas. I dvärghamsterburen ger bottenvåningen plats för ett ordentligt lager strö.",
      "Gnagarburen i akryl och aluminium ger 0,50 m² bottenyta i ett enda plan. Flera burar kommer med hus, löphjul, matskål och vattenflaska, och i dvärghamsterburen sitter löphjulet och vattenflaskan redan på plats.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilka burar har djup bädd för grävning?",
        a: "Hamsterburen i trä med djup bädd har 31 cm fri höjd i bottenplanet, och gnagarburen på hjul har en 26 cm djup underdel i härdat glas. Gnagarburen i akryl har ett djupt bottenkar i ett enda plan på 0,50 m².",
      },
      {
        q: "Finns det burar för råtta, degu och chinchilla?",
        a: "Ja. Gnagarburen på 128 cm har fyra plan, ramper och en hängmatta, är byggd för chinchillor, råttor och degus och står på fyra hjul. Maskavståndet är 2,5 cm.",
      },
      {
        q: "Vad följer med buren?",
        a: "Det varierar. Flera levereras med hus, löphjul, matskål och vattenflaska, och vad som ingår står i beskrivningen. Löphjulet på 13 cm som följer med några av burarna är för litet: en dvärghamster behöver minst 20 cm och en guldhamster minst 28 cm.",
      },
    ],
  },

  "hantlar-hantelset": {
    intro: [
      "Här hittar du hantlar för hemmagymmet: hantelset med ställ, justerbara hantlar, gummerade hexhantlar och enskilda hantlar på 15 och 20 kg. Här finns också en kettlebell på 10 kg, en skivstång med viktskivor och ett hantelställ i två hyllor som bär 270 kg.",
      "Justerbara hantlar sparar plats. Den justerbara hanteln går från 2 till 11 kg i fem steg, 4-i-1-paret ställs om mellan 1, 1,5, 2 och 2,5 kg, och två hantlar på 20 kg sammanlagt blir en skivstång när du sätter ihop dem med förbindelsestången.",
      "Hexhantlarna har sexkantiga huvuden, så de ligger stilla där du lägger dem i stället för att rulla i väg, och på de gummerade skonar gummit golvet. Hantelsetet på 36 kg har sex gummerade hexhantlar och ett kompakt ställ, och setet med väska har fyra färgkodade par från 0,5 till 2 kg.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Justerbara hantlar eller fasta hexhantlar?",
        a: "Justerbara hantlar tar mindre plats och låter dig öka vikten utan att köpa nya. Fasta hexhantlar går snabbare att byta mellan under ett pass, eftersom varje vikt redan ligger färdig.",
      },
      {
        q: "Kan hantlarna ställas direkt på golvet?",
        a: "De gummerade hexhantlarna skonar underlaget, och hanteln på 20 kg är gummiklädd för att kunna sättas ned på ett trägolv. För förvaringen finns hantelstället, där varje hylla bär 135 kg.",
      },
      {
        q: "Finns det skivstång?",
        a: "Ja, en justerbar skivstång med viktskivor på 20 kg, och ett set där två hantlar blir en skivstång med en förbindelsestång.",
      },
    ],
  },

  "har-rakning": {
    intro: [
      "Hår & Rakning har utrustning för den som klipper, färgar och behandlar, i salongen eller hemma: arbetsstolar och en sadelpall på hjul, en torkhuv på stativ, en frisörväska och en sminkväska med lås, och en IPL-apparat för hårborttagning.",
      "Arbetsstolen med rygg går mellan 50 och 64 cm och bär 120 kg, och ryggstödet skruvas loss om du hellre vill ha en pall. Sadelpallen går mellan 49 och 61 cm och saknar rygg, så att du sitter med bäckenet framåt när du arbetar lutad över kunden. Båda har gaslift, fem hjul och en sits som snurrar 360 grader.",
      "Torkhuven höjs mellan 115 och 165 cm, har timer på 0–60 minuter och värme upp till 70 °C, och den rullas undan på fyra hjul. Den passar för torkning efter tvätt och för färgning, permanent och inpackningar. Frisörväskan har kodlås och plats för 8 saxar och 4 trimmrar, och IPL-apparaten har upp till 999 000 blixtar och används på ansikte, armhålor, armar, ben och bikinilinje.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Ska jag välja sadelpall eller arbetsstol med rygg?",
        a: "Sadelpallen passar när du arbetar framåtlutad, eftersom sadelformen öppnar vinkeln mellan lår och bål. Den har ingen rygg och passar därför inte för långa pass av passivt sittande. Vill du kunna vila mot en rygg är arbetsstolen med ryggstöd bättre.",
      },
      {
        q: "Hur varm blir torkhuven?",
        a: "Värmen ställs steglöst upp till 70 °C, men det är maxläget, så börja lågt. Timern går till 60 minuter och stänger av torken när tiden har gått ut.",
      },
      {
        q: "Fungerar IPL-hårborttagning på alla?",
        a: "Resultatet varierar med hud- och hårfärg, och IPL fungerar bäst på mörkt hår och ljusare hud. Med upprepad användning kan hårväxten bli glesare över tid. Apparaten är uppladdningsbar och gjord för hemmabruk.",
      },
    ],
  },

  "honshus-honsgardar": {
    intro: [
      "Här hittar du hönshus i trä, hönsgårdar att gå in i, ett hönsrede och en automatisk hönslucka. Flera anger hur många höns de är gjorda för, från hönshus för två höns till hönsgården på 10 m² för 10–15 höns. Här finns också ett ankhus för tre ankor, en aktivitetsställning med sittpinnar för höns och en lekplats och ett ställ för små fåglar och papegojor.",
      "De flesta hönshus har både värprede och sittpinnar, och flera har en rastgård i samma stycke. Städningen går fortare med en utdragbar bricka eller bottenlåda, och på ett av husen fälls både taket och värpredet upp.",
      "Hönsgårdarna ger hönsen yta att röra sig på under dagen, från 3,07 m² med ståhöjd upp till 24 m². De stora är byggda av galvaniserat stålrör med tak av duk mot sol och regn. Den automatiska hönsluckan öppnar på morgonen och stänger på kvällen, och hönsredet i trä har sex fack på två plan.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur många höns får plats?",
        a: "Det beror på modellen. Hönshusen är gjorda för två till tio höns, och hönsgårdarna i stål rymmer från 4–6 höns på 4 m² upp till 10–15 höns på 10 m². De flesta beskrivningar anger antalet.",
      },
      {
        q: "Vad är skillnaden mellan hönshus och hönsgård?",
        a: "I hönshuset sover och värper hönsen, med sittpinnar och värprede. Hönsgården är en inhägnad rastgård där de rör sig under dagen, i trä eller galvaniserat stål och ofta med tak. Flera hönshus har en mindre rastgård i samma stycke.",
      },
      {
        q: "Hur fungerar den automatiska hönsluckan?",
        a: "Den öppnar på morgonen och stänger på kvällen av sig själv. Du styr den med timer eller den inbyggda ljussensorn och kan öppna den manuellt med fjärrkontrollen.",
      },
    ],
  },

  hornskrivbord: {
    intro: [
      "Här hittar du hörnskrivbord som tar vara på ett hörn i rummet. De flesta är L-formade med en stor och en mindre skiva, så att du har datorn på den ena och papper eller en andra skärm på den andra.",
      "Tre har eluttag och USB i bordet, så att datorn och telefonen laddas vid skrivbordet. Ett av dem har ett hylltorn med fem plan, ett har tre lådor, och gamingbordet har ett skärmställ för två skärmar upp till 42 tum. Flera har ett skärmställ som höjer skärmen.",
      "Två kan byggas om till raka skrivbord. Det ena blir 240 cm långt, och det andra blir 150 cm och vrids på stället mellan hörnläge och rakt läge. Hörnskrivbordet på 150 × 150 cm har två lika stora arbetsytor på 90 × 55 cm.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stort hörn behöver ett hörnskrivbord?",
        a: "Mät längs båda väggarna. Gamingbordet tar 128 × 128 cm, bordet med tre lådor 170 × 100 cm och bordet med lika långa sidor 150 × 150 cm. Det vridbara skrivbordet tar 105 × 85 cm i hörnläge.",
      },
      {
        q: "Hur mycket tål skrivbordet?",
        a: "Det skiljer mellan modellerna. Gamingbordet tål 45 kg totalt, och bordet med hylltorn tål 135 kg totalt och 50 kg per bordsskiva.",
      },
      {
        q: "Har hörnskrivborden förvaring?",
        a: "De flesta har det. Ett har ett hylltorn med fem plan, ett har tre lådor och fyra hyllor, ett har hyllor och ett datorställ, och det vridbara skrivbordet har också förvaring. Hörnskrivbordet på 150 × 150 cm har bara arbetsytor.",
      },
    ],
  },

  "hudvard-ansikte": {
    intro: [
      "Hudvård & Ansikte samlar det som hör till ansiktsrutinen: ett återfuktande hudvårdsset, två små kylar som håller serum och krämer svala och en hopfällbar LED-lampa som lyser över ansiktet.",
      "Hudvårdssetet har 5 delar: rengöring, toner, serum, ögonkräm och ansiktskräm, med hyaluronsyra, niacinamid och algextrakt. Det blir en rutin i fem steg för morgon och kväll, och ögonkrämen är gjord för den känsliga huden runt ögonen.",
      "Kosmetikkylen rymmer 6 liter på två plan och kyler till 2–17 °C, och hela dörren är en spegel med LED-ljus i tre steg. Minikylen på 4 liter kyler till 2–16 °C eller värmer till 50–65 °C, till exempel handdukar och ansiktsmasker. Båda har termoelement i stället för kompressor och låter 26 dB. LED-lampan har 7 ljusfärger och en timer på 5–60 minuter, och ett pass tar 15–20 minuter.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur kall blir kosmetikkylen?",
        a: "Kosmetikkylen kyler till 2–17 °C och minikylen till 2–16 °C. Båda kyler mot rumstemperaturen och är gjorda för rum mellan 10 och 30 °C, så i ett varmt rum blir det inte lika kallt.",
      },
      {
        q: "Hur använder man LED-lampan?",
        a: "Du lägger dig ner och låter ljusbågen vila över ansiktet, utan någon mask mot huden. Välj en av de 7 ljusfärgerna på panelen och ställ timern, och räkna med ett pass på 15–20 minuter. Efteråt viks lampan ihop.",
      },
      {
        q: "Vad ingår i hudvårdssetet?",
        a: "Rengöring på 100 g, toner på 100 ml, serum på 30 ml, ögonkräm på 20 g och ansiktskräm på 55 g. Hela ingrediensförteckningen står på förpackningen, och setet passar också som present.",
      },
    ],
  },

  "hundbaddar-hundsoffor": {
    intro: [
      "En egen bädd ger hunden en fast plats att vila på. Här samlar vi våra hundbäddar och hundsoffor: soffor med ben i furu och dynor med tvättbart överdrag, upphöjda hundsängar med nät för ute och inne och hopfällbara bäddar med bärväska. För katten finns en korg med kattöron och en kattsäng på ben.",
      "En upphöjd bädd lyfter hunden från golvet. På hundsofforna lyfter furubenen bädden så att luften kommer åt underifrån, och på nätbäddarna cirkulerar luften under hunden så att den håller sig sval. En av nätbäddarna har dessutom tak som ger skugga och skydd mot regn.",
      "Välj storlek efter hunden: bäddarna finns från små sängar på Ø40,5 cm för katter och de minsta hundarna till XL-bäddar på 122 × 92 cm, och de största sofforna och bäddarna är gjorda för hundar upp till 30 kg.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Varför välja en upphöjd hundbädd?",
        a: "En upphöjd bädd lyfter hunden från golvet så att luften kommer åt underifrån. På bäddar med nät cirkulerar luften under hunden så att den håller sig sval, och de hopfällbara modellerna med bärväska är lätta att ta med.",
      },
      {
        q: "Går överdraget att tvätta?",
        a: "På de flesta sofforna och bäddarna går överdraget eller dynan att ta av och tvätta. Tvättråden står i beskrivningen.",
      },
      {
        q: "Vilken storlek behöver min hund?",
        a: "Hunden ska kunna ligga utsträckt, så mät den från nos till svansrot och jämför med liggytans mått. De minsta sofforna är gjorda för katter och små hundar upp till 4,5 kg, medan de största bäddarna och sofforna tar hundar upp till 30 kg.",
      },
    ],
  },

  hundburar: {
    intro: [
      "En hundbur ger hunden en egen plats hemma, i bilen och på resan. Här samlar vi våra hundburar: möbelburar i valnöt, ek och vitt som också fungerar som sidobord, en bur i metall med hjul och topplucka och mjuka burar i väv som viks ihop när de inte används.",
      "Mät hunden på längden, inte bara vikten: de flesta burarna anger både maxvikt och kroppslängd, oftast upp till 30 kg och 60 cm. Hunden ska kunna stå, vända sig och ligga utsträckt. En skjutdörr tar ingen plats framför buren, och möbelburarnas skiva ovanpå bär mellan 20 och 60 kg – plats för lampan och böckerna.",
      "Möbelburarna väger mellan 25,5 och 34,5 kg och monteras där de ska stå, medan den mjuka buren i väv viks ihop och följer med i bagageutrymmet. För två hundar finns en bur på 120 cm med mellanvägg och två skjutdörrar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor hundbur behöver min hund?",
        a: "Hunden ska kunna stå upp, vända sig och ligga utsträckt. Mät kroppslängden och jämför med burens innermått – de flesta burarna anger både maxvikt och kroppslängd, till exempel 30 kg och 60 cm.",
      },
      {
        q: "Vad är en möbelbur?",
        a: "En hundbur byggd som en möbel, med en hel skiva ovanpå som fungerar som sidobord. Den smälter in i rummet, och skivan bär mellan 20 och 60 kg.",
      },
      {
        q: "Vilken bur passar på resan?",
        a: "Den mjuka buren i väv finns 60, 76 och 90 cm lång och viks ihop till 42 × 20 × 20 cm i den minsta storleken, så den är lätt att ta med i bilen. Den hopfällbara buren i stål för små hundar viks ihop till 6,5 cm, och metallburen med hjul och bricka går också att fälla ihop.",
      },
    ],
  },

  hundkojor: {
    intro: [
      "En hundkoja ger hunden ett eget skydd mot regn, blåst och markfukt när den är ute på tomten. Här samlar vi våra hundkojor och hundhus i gran och plast för utomhusbruk, plus en koja i MDF för inomhus, i storlekar för hundar från 8 upp till 30 kilo.",
      "Välj storlek efter hunden: den ska kunna gå in, vända sig och ligga utsträckt, och de flesta kojorna anger hur stor hund de är byggda för. Ett upphöjt golv med luftspalt håller fukt och frost från marken borta, ett asfaltstak håller regnet ute och ett tak som fälls upp gör det lätt att göra rent. Några modeller har veranda framför dörren, och en har takterrass med trappa. Plastkojorna tar inte upp fukt och kan spolas rena.",
      "Utomhuskojorna är väderskydd, inte isolerade vinterbostäder. En hund som ska vara ute vintertid behöver en isolerad hydda.",
      "Du betalar tryggt med Klarna, med fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Klarar hundkojan svensk vinter?",
        a: "Inte som enda skydd. Kojorna skyddar mot regn, blåst och markfukt, men väggarna är oisolerade. En hund som ska vistas ute vintertid behöver en isolerad hydda.",
      },
      {
        q: "Hur stor hundkoja behöver min hund?",
        a: "Hunden ska kunna gå in, vända sig och ligga utsträckt. De flesta kojorna anger en maxvikt, från 8 kilo för de minsta till 30 kilo, och invändiga mått, så jämför med hundens längd och mankhöjd.",
      },
      {
        q: "Trä eller plast – vad ska jag välja?",
        a: "En koja i gran ger ett klassiskt hundhus, ofta med asfaltstak, veranda eller ett tak som fälls upp. Plast är lätt, tar inte upp fukt och kan spolas ren. Ingen av sorterna är isolerad.",
      },
    ],
  },

  hundvagnar: {
    intro: [
      "Här finns hundvagnar för allt från små hundar på upp till 4 kg till stora hundar på upp till 30 kg, och cykelvagnar för hund som bär upp till cirka 40 kg. Maxvikten står oftast redan i namnet, och flera anger också liggytan och hur lång hunden får vara.",
      "Flera är hopfällbara. En fälls i ett enda drag och lägger sig platt, och en annan blir bärväska: kabinen lossas från chassit och packas ned till 61 × 40 × 10 cm.",
      "Cykelvagnarna för hund dras efter cykeln, och modellerna 2-i-1 blir hundvagn när ni kommit fram: dragstaget hakas av och handtaget fälls upp. Joggingvagnen har ett låsbart framhjul, och på en vagn med tre hjul kan framhjulet svänga fritt eller låsas rakt fram.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor hund får plats i vagnen?",
        a: "Titta på maxvikten och liggytan. Vagnen med fyra hjul och sufflett för hundar upp till 4 kg har en liggyta på 52 × 32 cm, vagnen för mellanstora hundar har 93 × 52 cm liggyta och bär 25 kg, och de största hundvagnarna tar upp till 30 kg.",
      },
      {
        q: "Kan jag cykla med hundvagnen?",
        a: "Med cykelvagnarna för hund, ja. De dras efter cykeln, och på modellerna 2-i-1 hakas dragstaget av så att vagnen blir en hundvagn med handtag. Den hopfällbara cykelvagnen finns i en storlek för hundar upp till cirka 40 kg.",
      },
      {
        q: "Går vagnen att fälla ihop?",
        a: "Flera är hopfällbara, och det står i namnet. En vagn för hundar upp till 30 kg fälls i ett enda drag och lägger sig platt i 87 × 56 × 32 cm.",
      },
    ],
  },

  hushallsapparater: {
    intro: [
      "Här samlar vi apparater som tar hand om tvätten, strykningen och städningen: små torktumlare för badrummet och tvättstugan, ett uppvärmt torkställ, en klädångare och en ångstation, ultraljudstvättar, en handhållen ångtvätt, en fönsterputsrobot och en sladdlös handdammsugare. Här finns också en kosmetikkyl med spegeldörr och en takfläkt med lampa.",
      "Torktumlarna tar 2,5, 4 eller 5 kg tvätt och är 48 eller 49 cm breda, så de ryms på en bänk eller ovanpå tvättmaskinen, och tre av dem kan hängas på väggen. De flesta värmer upp till 60 °C och stannar om luckan öppnas. Det uppvärmda torkstället drar 230 W och håller 45–55 grader, vilket passar ull och syntet som inte ska i tumlaren.",
      "Klädångaren på 1800 W har en tank på 1,4 liter och släter ut vecken medan plagget hänger på galgen, och ångstationen på 2800 W har en tank på 2 liter som räcker till upp till 40 minuters strykning. Ultraljudstvättarna finns från 2 till 15 liter, med värme upp till 80 °C och timer. Fönsterputsroboten håller sig kvar på rutan med 5600 Pa och passar rutor från 45 × 45 cm.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor torktumlare behöver jag?",
        a: "Kapaciteten gäller blöt tvätt: 5 kg blöt tvätt motsvarar 3 kg torr, och tumlaren på 2,5 kg tar ungefär tio t-shirts eller ett set sängkläder. Mät platsen innan du väljer, eftersom modellerna är 48 eller 49 cm breda och mellan 56 och 61 cm höga.",
      },
      {
        q: "Ska jag välja klädångare eller ångstation?",
        a: "Klädångaren släter ut plagget där det hänger och kräver ingen strykbräda, så den passar skjortor, blusar och klänningar. Ångstationen är ett strykjärn med separat vattentank och ger en ångpuff på upp till 100 g/min, som tar djupare veck.",
      },
      {
        q: "Vad kan man rengöra i en ultraljudstvätt?",
        a: "Smycken, glasögon, klockor, tandproteser, verktyg, förgasardelar och kretskort. Välj storlek efter det största föremålet: de minsta tankarna räcker till smycken, medan verktyg och förgasardelar behöver 10 eller 15 liter. Använd det skonsamma effektläget för ömtåliga smycken och glasögon.",
      },
    ],
  },

  juldekoration: {
    intro: [
      "Juldekoration utomhus sätter stämningen redan vid grinden. Här samlar vi uppblåsbara tomtar, snögubbar, pepparkaksgubbar, renar och pingviner, ljusfigurer som renfamiljer och isbjörnar, och för inomhus julbyar i trä, girlanger och adventskalendrar.",
      "De uppblåsbara figurerna är upp till 250 cm höga och reser sig när du kopplar in fläkten. De lyser inifrån med LED, och de flesta är IP44-klassade, alltså skyddade mot stänk. Till de flesta följer markspett och linor med för att förankra figuren i gräsmattan, och vid kraftigt regn, snö eller hård vind tar du in den.",
      "Ljusfigurerna lyser med lysdioder – renfamiljen har 283 stycken – och de flesta är IP44-klassade för att stå ute. Flera har timer. För inomhus finns julbyar i trä med LED, girlanger och fyra adventskalendrar med 24 lådor att fylla.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Tål de uppblåsbara figurerna regn och snö?",
        a: "De flesta är IP44-klassade och skyddade mot stänk, så lätt regn går bra. Vid kraftigt regn, snö eller hård vind ska figuren tas in, och den håller längre om den står inne i dåligt väder.",
      },
      {
        q: "Hur länge får fläkten gå?",
        a: "Figuren håller formen bara medan fläkten går, så den ska vara på så länge figuren står uppe. För en del figurer anger produktbeskrivningen hur länge fläkten får gå i sträck, till exempel högst åtta timmar.",
      },
      {
        q: "Ingår batterier i julbyarna och adventskalendrarna?",
        a: "Nej, batterierna ingår inte. Vilka som behövs står i produktbeskrivningen.",
      },
    ],
  },

  julgranar: {
    intro: [
      "En konstgjord julgran – eller plastgran, som många säger – ställer du upp varje december i många år, utan barr på golvet och utan vattning. Här samlar vi alla våra julgranar: från små granar på 57 cm till granar på 225 cm för rum med högt i tak, och från smala pelarmodeller som bara är 46–54 cm breda till täta granar med över 2 000 grenspetsar.",
      "Välj efter rummet. Mät takhöjden och lämna plats för toppen, och tänk på bredden: en bred gran på 180 cm kan vara över en meter i diameter, medan en smal modell får plats bredvid soffan. Antalet grenspetsar säger hur tät granen blir – samma höjd finns från några hundra till flera tusen spetsar. Vill du ha en julgran med belysning finns granar där LED-lamporna redan sitter i grenverket, och de snötäckta modellerna ger vinterkänsla direkt.",
      "Du betalar tryggt med Klarna, frakten är fri över 499 kr och du har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur hög julgran ska jag välja?",
        a: "Utgå från takhöjden och dra av 20–30 cm för toppen och stjärnan. I ett rum med 2,4 meter i tak passar en gran på 180–210 cm. Har du ont om golvyta är en smal modell ofta rätt – en pelargran på 180 cm är bara 46 cm bred.",
      },
      {
        q: "Finns det julgranar med belysning?",
        a: "Ja. Flera av våra granar har varmvita LED-lampor som redan sitter i grenverket – från små granar med 50 LED till en 210 cm hög gran med 700 LED. Då slipper du linda en ljusslinga runt granen själv.",
      },
      {
        q: "Hur förvarar jag en konstgjord julgran?",
        a: "Många av våra granar delas i sektioner, och flera har en fot som fälls ihop – då ryms granen i en kartong till nästa jul. Förvara den torrt och fluffa upp grenarna när du ställer upp den igen.",
      },
    ],
  },

  "kalas-fest": {
    intro: [
      "Kalas & fest samlar det som behövs när festen flyttar ut i trädgården eller in i en festlokal: partytält och pop-up-tält, en kylvagn för drycken, en sockervaddsmaskin till barnkalaset och textilier för dukningen, som runda bordsdukar, stolsöverdrag och stolband med rosett.",
      "Partytälten har en stomme av stål- eller metallrör och vit PE-duk och finns i 3 × 3 m och 6 × 3 m. Pop-up-tälten fälls upp utan verktyg, finns från 3 × 3 m till 6 × 3 m och har höjden i tre lägen och tak av 210D Oxfordväv. Väggarna fästs med kardborre, så samma tält kan vara ett öppet skuggtak en varm dag och ett slutet rum när kvällen blir sval. Markpinnar och spännrep ingår, och till flera pop-up-tält även sandsäckar för altan och plattor.",
      "Kylvagnen rymmer 56 liter, cirka 60 burkar, och kyls med is eller kylklampar utan ström. Sockervaddsmaskinen på 450 W gör en sockervadd på cirka 2 minuter, och mätsked och 10 pinnar ingår. För dukningen finns runda vita bordsdukar på cirka 305 cm i 10-pack, stolsöverdrag i spandex i 30-pack och stolband i guldsatin i 50-pack.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken storlek på partytält behöver vi?",
        a: "Under ett tak på 3 × 3 m får ett långbord med åtta stolar plats. Pop-up-tältet på 6 × 3 m är gjort för 15–20 personer. Räkna också med fri yta runt tältet för spännrepen.",
      },
      {
        q: "Tål tälten regn och blåst?",
        a: "De flesta tälten har dräneringshål i taket, så att regnvatten inte samlas i en säck mitt i duken. Tältet ska alltid förankras med markpinnar och spännrep, eftersom ett stort tak tar vind som ett segel. Titta till taket vid ihållande regn.",
      },
      {
        q: "Behöver kylvagnen ström?",
        a: "Nej, du fyller den med is eller kylklampar. Locket öppnas i två halvor så att kylan stannar kvar i den del du inte använder, och när isen har smält tömmer du vagnen genom pluggen i botten.",
      },
      {
        q: "Hur fungerar sockervaddsmaskinen?",
        a: "Maskinen har 450 W och en skål i aluminium, och en sockervadd tar cirka 2 minuter. Mätsked och 10 pinnar ingår, och halkfria fötter håller den stadig på bordet.",
      },
    ],
  },

  "kaninburar-marsvinsburar": {
    intro: [
      "Här hittar du kaninburar och kaninhus för trädgården, burar på hjul, marsvinshyddor, smådjursstall med löpgård och hagar för kanin och marsvin. De flesta är gjorda för båda djuren, och vilka djur en bur passar för står i beskrivningen.",
      "Flera utomhusburar har tak av asfaltpapp eller bitumen, stomme i granträ och galler eller nät i galvaniserat stål. Många har två plan: ett stängt sovhus överst och en öppen rastgård under, med en ramp emellan. Smådjursstallen på 230 cm har löpgård åt båda håll och en tredje yta under själva huset.",
      "Hagarna utan botten ställs direkt på gräsmattan, så att djuren går på riktig mark och kan beta. För inomhus finns en modulhage av 47 trådpaneler som blir 175 × 105 cm och en modulär bur av 27 paneler. Den hopfällbara hagen på 110 × 105 cm viks ihop till 13,5 cm när den inte används.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Passar burarna både för kanin och marsvin?",
        a: "De flesta gör det, och flera av smådjursstallen nämner också råtta och degu. Vilka djur en bur är gjord för står i beskrivningen.",
      },
      {
        q: "Vad är skillnaden på en hydda och en hage?",
        a: "En hydda eller ett stall har tak och ett stängt sovhus, ofta med en rastgård bredvid eller under. En hage är en inhägnad där djuren rör sig, och flera har ett hus eller ett tak som fälls upp. Hagarna utan botten ställs på gräset, och modulhagarna för inomhus byggs av paneler.",
      },
      {
        q: "Hur ser jag hur stor buren är?",
        a: "Längd, djup och höjd står i beskrivningen, och flera anger bottenytan i kvadratmeter. Kaninhuset på 122 cm har en rastgård på 1,02 m², och modulhagen på 175 × 105 cm ger 1,84 m² på bottenplanet.",
      },
    ],
  },

  katthus: {
    intro: [
      "Ett katthus ger utekatten ett torrt och skyddat ställe att vila på, på balkongen, altanen eller i trädgården. Här samlar vi våra katthus i trä – från en kattstuga på 77 cm till hus i två och tre plan med balkong och fönster – ett upphöjt katthus i vattenavvisande väv, en kattgård med hus och rastgård och några katthus för inomhusbruk.",
      "Titta på tak, golv och öppning. Ett tak med asfalt eller takpapp leder bort regnet, och ett hus på ben med golvet några centimeter över marken slipper suga upp markfukt. Ett tak eller en lucka som fälls upp gör det lätt att göra rent, och ett hus med två plan ger katten både en skyddad sovplats och en utsiktsplats. Har du två katter finns också ett hus byggt för två, och kattgården på 191 cm är gjord för tre till fyra katter.",
      "I flera av utomhushusen ingår ingen bädd – lägg i halm, en filt eller en värmematta avsedd för djur.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Ingår det en bädd i katthuset?",
        a: "I flera av utomhushusen gör det inte. Lägg i halm, en filt eller en värmematta avsedd för djur. Några modeller, som det upphöjda katthuset på 62 cm, levereras med bädd.",
      },
      {
        q: "Hur gör jag rent katthuset?",
        a: "Flera av husen har ett tak eller en lucka som fälls upp, så du kommer åt hela insidan på en gång. Ett av husen har dessutom en botten som går att ta ur vid storstädningen.",
      },
      {
        q: "Finns det katthus för inomhusbruk?",
        a: "Ja, till exempel ett katthus i tv-design med kudde, en hopfällbar kattkoja med klöspelare i sisal, en katthåla i flätat rep och ett tipitält. Flera av trähusen kan också stå inne.",
      },
    ],
  },

  kattlador: {
    intro: [
      "En kattlåda ska vara lätt att hålla ren och stor nog för katten att vända sig och gräva i. Här samlar vi alla våra kattlådor: öppna lådor med höga kanter, täckta kattlådor med lock eller tak, lådor med toppingång och kattlådsskåp som döljer lådan i en möbel.",
      "Rostfritt stål är värt att titta på. Plast får med tiden repor från klor och skopa, och i reporna fastnar urin som luktar – ett kar i stål har ingen sådan yta och går att skura rent. Rostfria lådor finns här från 52 cm upp till en XXL-låda på 130 liter. En täckt låda eller en låda med toppingång håller mer av sanden kvar, och flera modeller har kolfilter eller luktfilter. En utdragbar låda gör det enklare att tömma.",
      "Kattlådsskåpen har en skiva ovanpå som tål vikt, så möbeln fungerar som sidobord eller hylla, och innermåtten står i beskrivningen så att du ser vilken låda som får plats.",
      "Du betalar tryggt med Klarna, frakten är fri över 499 kr och du har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Varför välja en kattlåda i rostfritt stål?",
        a: "Plast får med tiden repor från klor och skopa, och i reporna fastnar urin som luktar även efter rengöring. Rostfritt stål suger inte åt sig lukt på samma sätt och går att skura utan att ytan skadas.",
      },
      {
        q: "Hur stor kattlåda behöver min katt?",
        a: "Katten ska kunna vända sig och gräva utan att kliva ur. Jämför sandytans mått i beskrivningen med kattens längd – en stor katt eller flera katter behöver en XL- eller XXL-låda.",
      },
      {
        q: "Vad är ett kattlådsskåp?",
        a: "Ett kattlådsskåp är en möbel med plats för kattlådan inuti. Skivan ovanpå tål vikt, på en av modellerna 50 kg, och innermåtten står i beskrivningen, så att du ser vilken låda som får plats.",
      },
    ],
  },


  "kladhangare-hallmobler": {
    intro: [
      "Här hittar du klädhängare, klädställningar och hallmöbler: fristående klädhängare med krokar, klädställ på hjul, en öppen klädställning med tre stänger och hallmöbler som samlar krokar, bänk och skoförvaring i en och samma möbel. Här finns också öppna garderober, ett paraplyställ med droppskål, skoskåp och skobänkar till hallen.",
      "Klädhängaren i furu har åtta krokar på olika höjder. Klädstället med paraplyställ tar bara 30,5 × 30,5 cm golv och har tolv krokar på tre höjder. Klädställningen på hjul ställs i höjd mellan 95 och 170 cm och i bredd mellan 86 och 160 cm.",
      "Hallmöblerna har bänk, skobänk eller en tygkommod med sju lådor under krokarna. Hallmöbeln 3-i-1 har en bänk som bär 110 kg och levereras med tippskydd. Till den som vill sitta ner och ta på skorna finns också hallbänkar och sittbänkar, en med rullade armstöd och flera med förvaring under sitsen. Bänkarna bär mellan 120 och 330 kg.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket klarar en klädhängare?",
        a: "Det står per krok och totalt i beskrivningen. Klädhängaren i furu tar 5 kg per krok och 30 kg totalt, och den trädformade klädhängaren för väggen tar 5 kg per krok och 40 kg totalt.",
      },
      {
        q: "Får långa rockar plats på klädstället?",
        a: "Klädstället i vit metall har 133 cm fritt hängrum, vilket räcker för långrockar utan att de nuddar golvet. Den öppna klädställningen har hänghöjder på 132 och 85 cm.",
      },
      {
        q: "Vilken hallmöbel passar en smal hall?",
        a: "Klädstället med paraplyställ tar 30,5 × 30,5 cm golv, och hallmöbeln med tygkommod är bara 30 cm djup. Hallmöbeln med stoppad sits är 72,5 cm bred.",
      },
    ],
  },

  klostrad: {
    intro: [
      "Ett klösträd ger katten ett eget ställe att klösa, klättra och sova på. Här samlar vi alla våra klösträd och kattträd, från ett litet klösträd på 46 cm till takhöga modeller som spänns fast mellan golv och tak och når 275 cm. Här finns också klöspelare, klöstunnor med hålor att gömma sig i och väggklösträd som monteras på väggen.",
      "Välj efter katten och bostaden. Katter sitter gärna högt med uppsikt över rummet, så ett högt träd med flera plan används ofta mer än ett lågt. Har du ont om golvyta tar ett takhögt träd eller ett väggklösträd mindre plats. De flesta träden har sisal på stammarna, som tål klor bra, medan andra har jute eller naturfiber som vattenhyacint och sjögräs. Höga träd bör fästas i väggen, och flera levereras med tippskydd.",
      "Titta också på plattformarnas mått, så att katten kan ligga utsträckt, och på hur mycket trädet bär – flera modeller bär upp till 30 kg totalt.",
      "Du handlar tryggt med Klarna, med fri frakt över 499 kr och 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur högt ska ett klösträd vara?",
        a: "Katter sitter gärna högt, så ett träd på 130 cm eller mer används ofta mer än ett lågt. Har du flera katter är fler plan och en grotta att dra sig undan i värt mycket, medan kattungar och äldre katter klarar sig bra med ett lägre träd.",
      },
      {
        q: "Hur sitter ett takhögt klösträd fast?",
        a: "Ett takhögt klösträd har en justerbar del som spänns mot taket, så trädet står stadigt i hela sin höjd. Mät takhöjden innan du beställer – varje takhög modell har ett höjdspann, till exempel 228–260 cm.",
      },
      {
        q: "Vad är skillnaden mellan klösträd, klöspelare och klöstunna?",
        a: "Ett klösträd har flera plan, ofta med grotta, hängmatta och bädd. En klöspelare är en ensam stam att klösa och sträcka sig mot, och den tar liten plats. En klöstunna är en sluten tunna med hålor där katten kan gömma sig, med klösytor av sisal eller naturfiber.",
      },
    ],
  },

  "koksmaskiner-apparater": {
    intro: [
      "Köksmaskiner & Apparater samlar maskinerna som står på bänken: espressomaskiner, kapselmaskiner och en kaffekvarn, köksmaskiner för bak, bordsdiskmaskiner, ismaskiner, yoghurtmaskiner, en torkapparat, en elektrisk pizzaugn, en fritös och en keramikhäll med grill. Kylar och frysar har flyttat till Kyl & frys, och vattenkokare, brödrostar och miniugnar finns också samlade på egna sidor.",
      "Espressomaskinerna har 15 till 20 bars pumptryck och ångrör för mjölkskum, och den med 58 mm bärare har ställbar bryggtemperatur på 90–95 °C och en tryckmätare på fronten. Kapselmaskinerna tar flera sorters kapslar och också malet kaffe. Köksmaskinerna har motor på 1300 eller 1400 W, sex hastigheter och puls och skålar i rostfritt stål på 4,5 till 7 liter, med degkrok, visp och stänkskydd.",
      "Bordsdiskmaskinerna tar 4 kuvert och har en tank på 6 liter, och den med snabbprogram på 29 minuter behöver ingen vattenledning, så den fungerar i husbilen eller sommarstugan. Ismaskinerna gör 12 eller 20 kg is per dygn. Pizzaugnen går upp till 430 °C med en keramiksten på 12 tum, och yoghurtmaskinerna har 7 eller 8 glasburkar på 180 ml och timer upp till 48 timmar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Behöver bordsdiskmaskinen kopplas till vatten?",
        a: "Nej, tanken på 6 liter fylls uppifrån med en kanna, men slangar för anslutning till kranen ingår om du vill koppla in den fast. Maskinen mäter 45 × 44 × 45,8 cm, ungefär som en mikrovågsugn, och tar tallrikar upp till 20 cm i diameter.",
      },
      {
        q: "Vilken köksmaskin ska jag välja?",
        a: "Skålens storlek avgör hur stora satser du kan göra: 4,5, 5,5 eller 7 liter. Alla har sex hastigheter och puls och ett huvud som fälls upp. På flera tål skål och verktyg diskmaskin, men stänkskyddet ska diskas för hand.",
      },
      {
        q: "Hur mycket is gör ismaskinen?",
        a: "Den portabla ismaskinen gör upp till 12 kg per dygn, nio isbitar i taget, och den första omgången är klar efter 7 minuter. Den större gör 20 kg per dygn med 24 isbitar på 14–18 minuter. Du fyller vatten i tanken, och båda rengör sig själva.",
      },
    ],
  },

  "koksoar-koksvagnar": {
    intro: [
      "En köksö eller köksvagn ger köket mer arbetsyta och förvaring utan att du behöver bygga om. Här samlar vi köksöar med skåp och utfällbar skiva, köksvagnar med lådor och hyllor, smala vagnar med utdragskorgar och vagnar med kryddhylla eller vinställ. Här finns också ett mikrovågsugnsskåp och ett klaffbord med skåp, båda på hjul.",
      "Nästan alla står på hjul, och på de flesta har två av hjulen broms, så att vagnen står stilla när du arbetar och rullar undan när du städar. Köksöarna är från 113 till 129 cm breda, och de har en skiva som fälls ut eller brickor som dras ut när du behöver mer yta.",
      "Skivorna är av massivt gummiträ, furu eller i trälook och stenlook, och flera vagnar har kryddhylla, handdukshängare och plats för flaskor. Bärigheten står per modell och går upp till 112 kg på den största köksön. Vagnarna levereras omonterade med anvisning.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är skillnaden mellan en köksö och en köksvagn?",
        a: "Köksön är större, med skåp och en skiva som ger en ny arbetsplats mitt i köket. Köksvagnen är smalare och fungerar som extra förvaring och avlastningsyta som rullas åt sidan.",
      },
      {
        q: "Går hjulen att låsa?",
        a: "Ja, på de flesta köksöar och köksvagnar har två av hjulen broms. Lås dem när du skär eller kavlar på skivan, så att vagnen står still.",
      },
      {
        q: "Hur mycket tål skivan?",
        a: "Det står per modell. Den största köksön bär 112 kg totalt, och de smala vagnarna med utdragskorgar är gjorda för lättare saker som burkar och flaskor.",
      },
    ],
  },

  "koksredskap-tillbehor": {
    intro: [
      "Här samlar vi köksredskap och tillbehör för matlagning, förvaring och servering: ett kastrullset för alla spishällar, chafingdishar som håller buffén varm, lufttäta behållare för torrvaror, en hylla som ställs över mikrovågsugnen och en köksvagn på hjul.",
      "Kastrullsetet har 17 delar med kastruller, stekpannor, sautépanna och gryta med glaslock. Botten är av 2,5 mm aluminium och magnetisk, så kärlen fungerar på induktion, gas och el, och non-stick-ytan i granitlook är fri från bly, kadmium och PFOA. Chafing dish-setet består av fyra rostfria dishar som rymmer ca 7,5 liter var och håller maten varm med vattenbad och bränslehållare. Utan värme fungerar de för kall servering.",
      "Förvaringsbehållarna för torrvaror rymmer 15 liter var och har lock med dubbel silikonpackning och hjul i botten, så att en full behållare med mjöl eller husdjursfoder går att rulla fram. Mikrovågsugnshyllan dras ut från 39,5 till 64 cm och har 40 cm fritt under sig. Köksvagnen på 68 × 35 × 85 cm har tre plan och broms på två hjul, och den fälls ihop när den inte används.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Fungerar kastrullsetet på induktionshäll?",
        a: "Ja. Kärlen har magnetisk botten och fungerar på alla spishällar, också gas och el. Botten är 2,5 mm aluminium som värms snabbt och jämnt.",
      },
      {
        q: "Hur många gäster räcker en chafing dish till?",
        a: "Varje dish rymmer ca 7,5 liter och räcker till minst 8 gäster. Med fyra dishar kan du ställa fram flera varma rätter samtidigt, och stället fälls ihop när festen är över.",
      },
      {
        q: "Hur mycket bär köksvagnen och mikrovågsugnshyllan?",
        a: "Köksvagnen bär 15 kg totalt och 5 kg per plan, och mikrovågsugnshyllan bär 15 kg. Lägg de tunga sakerna på vagnens nedre plan, så står den stadigare på sina fyra hjul.",
      },
    ],
  },

  konstvaxter: {
    intro: [
      "Konstväxter ger grönska där riktiga växter har det svårt, som i ett mörkt hörn eller vid en entré där ingen hinner vattna. Här samlar vi konstgjorda växter för inne och ute, från buxbomsklot, cypresser och lavendelträd till olivträd, monstera, bambu och palmer, de högsta 180 cm, och häck på rulle.",
      "Många står färdiga i en kruka med cementfylld botten som håller dem stadiga, och några står på jordspett för rabatten. Växterna behöver varken vattnas eller beskäras, och de klarar sig där det är mörkt.",
      "Ska växten stå ute, välj en som är UV-beständig, så att färgen inte bleks i solen. Många av växterna passar både inne och ute, men några är gjorda för inomhusbruk, så kontrollera i produktbeskrivningen.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Kan konstväxterna stå ute?",
        a: "Många kan det, och de UV-beständiga tappar inte färgen i solen. Några är gjorda för inomhusbruk, så kontrollera i produktbeskrivningen innan du ställer växten ute.",
      },
      {
        q: "Hur gör jag rent en konstväxt?",
        a: "Damma av bladen då och då med en mjuk borste eller en lätt fuktad trasa. Vissa kan också sköljas försiktigt med ljummet vatten – låt dem torka efteråt.",
      },
      {
        q: "Välter växten om det blåser?",
        a: "Många står i en kruka med cementfylld botten som håller dem stadiga, och några står på jordspett som sätts ner i marken.",
      },
    ],
  },

  "kropp-valbefinnande": {
    intro: [
      "Här hittar du hjälpmedel för kropp och vardag: hopfällbara rollatorer med sits, duschpallar och en duschstol, en toalettförhöjning med armstöd, en ljusterapilampa, en ergonomisk sittdyna och en hopfällbar massagebänk.",
      "Båda rollatorerna har fyra hjul och sits, fälls ihop och bär 136 kg. Den ena har fjädring i chassit, handbroms i båda handtagen och hjul på 20 cm. Den andra har korg och bricka, och handtagen ställs mellan 82 och 97 cm.",
      "För badrummet finns duschpallar i aluminium och bambu och en duschstol med ryggstöd och armstöd. Aluminiumpallarna ställs i höjd med fjäderknappar, från 34,8 till 56,5 cm, och bär 135 eller 150 kg, och duschstolen bär 158 kg. Den runda pallen på 32,5 cm i diameter passar i en trång duschkabin, och pallen med U-formad sits har ett stödhandtag med vakuumfäste. Toalettförhöjningen höjer sitsen 9 cm och har vadderade armstöd.",
      "Ljusterapilampan ger upp till 10 000 lux och har tre färgtemperaturer, fem ljusstyrkor och timer. Sittdynan är av memoryskum med ett urtag för svanskotan och mäter 44 × 39 × 13 cm.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken höjd ska en duschpall ha?",
        a: "Rätt höjd är den där fötterna når golvet och knäna ligger ungefär i höjd med höfterna, eftersom det gör det lättast att resa sig. Pallarna i aluminium ställs mellan 34,8 och 56,5 cm. Ska du sätta dig från badkarskanten räcker det översta läget på 56,5 cm för ett badkar med kanthöjd runt 55 cm.",
      },
      {
        q: "Hur högt ska handtagen på en rollator sitta?",
        a: "En vanlig tumregel är att handtagen ska vara i höjd med handleden när du står rak med armarna hängande. På rollatorn med korg och bricka ställs handtagen mellan 82 och 97 cm, och rollatorn med fjädring passar en brukare på 160 till 190 cm.",
      },
      {
        q: "Vad betyder 10 000 lux?",
        a: "Lux mäter hur mycket ljus som når en yta, och värdet sjunker ju längre från lampan du sitter. 10 000 lux är den ljusstyrka som brukar användas vid ljusterapi. Lampan har fem ljusstyrkor, så den kan också användas svagare.",
      },
    ],
  },

  "lek-tillbehor-for-husdjur": {
    intro: [
      "Här samlar vi tillbehör för lek, träning och vila för hund och katt: hundtrappor och hundramper upp till soffan, sängen och bilen, agilityhinder och agilityset för trädgården, och för katten kojor, trappor, katthjul, en kattunnel och en automatisk kattleksak. Det finns också ett hönsgym med gungor och stege.",
      "Hopp ner från soffan eller sängen sliter på leder och rygg, särskilt hos äldre djur och kortbenta raser, och en trappa eller ramp tar bort just det. Välj höjd efter möbeln och titta på maxvikten: trapporna når från 20 till 59 cm och bär från 4,5 upp till 50 kg. Hundrampen till sängen ställs i fyra lägen från 26 till 61 cm, och hundtrappan till bilen har tio steg och når en lastkant på upp till 82 cm.",
      "Agilityseten finns från tre delar upp till elva delar med två tunnlar, och de flesta levereras med bärväska. För en bana som står kvar i trädgården finns hinder i barrträ: ett A-hinder som ställs mellan 66 och 90 cm, en balansbom på 335 cm, en hundvippa på 180 cm och en hundbro, och de bär 30 eller 40 kg.",
      "För katten finns kojor och grottor i vattenhyacint och flätat material, en hängmatta för fönsterbrädan, katthyllor för väggen, kattrappor och två katthjul, varav ett på 91 cm med klösmattor och broms. Den automatiska kattleksaken drar en leksak längs en bana som du spänner upp själv och styrs med fjärrkontroll på upp till 15 m.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Trappa eller ramp – vad passar min hund?",
        a: "En ramp har inga steg och passar hundar som har svårt att kliva, till exempel en äldre hund med stela leder. En trappa tar mindre plats på golvet. Mät höjden på soffan eller sängen innan du väljer, och ta en ramp med plattform högst upp om hunden behöver stanna och vända innan den går ner.",
      },
      {
        q: "Vad ingår i ett agilityset?",
        a: "Seten består av hopphinder, tunnlar, hoppringar och slalomkäppar i olika kombinationer, från tre till elva delar. Det största har två tunnlar, och de flesta levereras med bärväska. På flera av hindren fylls fötterna med vatten eller sand, så att de står stadigt på gräsmattan.",
      },
      {
        q: "Finns det något för katten?",
        a: "Ja, kattkojor och en upphöjd kattgrotta som tål 10 kg, kattrappor, en hängmatta för fönsterbrädan och katthyllor för väggen. Katthjulet med klösmattor är gjort för katter under 5 kg, och den automatiska kattleksaken styrs med fjärrkontroll.",
      },
    ],
  },

  "leksaker-spel": {
    intro: [
      "Här samlar vi leksaker för barn i olika åldrar: gåbilar, sparkbilar och trehjulingar för de minsta, springcyklar och balanscyklar, trampgokarts och grävmaskiner att sitta på, klätterställningar, rutschkanor och skumklossar för lek inomhus, staffli och rittavlor, tågbanor i trä, byggsatser, lasertag och fotbollsspel.",
      "Rekommenderad ålder står på varje leksak, och den är viktig både för smådelar och för att barnet ska klara leken. Gåbilarna för 12–36 månader har skjutstång, så att du kan styra medan barnet sitter, och balanscykeln med tre hjul har en sitthöjd på 26,5 cm. Klätterställningarna i trä och skumklossarna är gjorda för lek inomhus, och flera fälls ihop efteråt. Trampgokartsen har pedaler och passar barn från 2 till 8 år.",
      "För större barn finns byggsatser från 478 till 4 706 delar, bland dem motorcyklar, stridsvagnar och skepp i skala, tågbanor i trä med upp till 133 delar och lasertag för fyra spelare. Elbilar, sparkcyklar, gunghästar, leksakskök och sandlådor har egna kategorier.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är skillnaden mellan gåbil, sparkbil och trampbil?",
        a: "En gåbil har en skjutstång så att en vuxen kan skjuta på, en sparkbil drivs framåt med fötterna och en trampbil har pedaler. Gåbilarna och sparkbilarna passar från 12 till 36 månader, och trampbilarna från 3 år.",
      },
      {
        q: "Vilken springcykel passar mitt barn?",
        a: "Springcyklarna finns för barn från 1 till 5 år. Balanscykeln med tre hjul är gjord för 12–36 månader och har en sitthöjd på 26,5 cm, och springcykeln i trä passar 3–5 år. Välj en där barnet når marken med hela foten när det sitter.",
      },
      {
        q: "Kan klätterställningarna stå inomhus?",
        a: "Ja, flera är gjorda för inomhusbruk, bland dem klätterställningen 7-i-1 och klätterställningen 6-i-1 i trä med nät, ringar och rutschkana. Klätterställningen 3-i-1 i trä fälls ihop efter leken. Lägg en mjuk matta under där barnet klättrar.",
      },
    ],
  },

  leksakskok: {
    intro: [
      "I ett leksakskök lagas låtsasmat, diskas och dukas. Här samlar vi våra leksakskök och barnkök för barn från tre år: kök i trä och MDF med ugn och diskho, kök i plast med ljud och ljus, ett hörnkök och en leksaksdiskmaskin.",
      "Några av köken har rinnande vatten: en batteridriven kran pumpar upp vatten ur diskhon så att det går runt i kretslopp. Andra har en diskho med kran men utan vatten, och det står i beskrivningen vilket som gäller. Kök med ljud, ljus och vatten drivs med AA-batterier, som inte alltid ingår.",
      "Titta också på höjden och tillbehören – köken kommer med allt från några få tillbehör upp till 92 delar. Köken i MDF tål avtorkning men inte blötläggning, så torka upp vattenspill direkt.",
      "Du betalar tryggt med Klarna, frakten är fri över 499 kr och du har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Har leksaksköken riktigt vatten?",
        a: "Några har det. I dem pumpar en batteridriven kran upp vatten ur diskhon så att det rinner i kretslopp. Andra har en diskho med kran men utan vatten – det står i beskrivningen.",
      },
      {
        q: "Från vilken ålder passar ett leksakskök?",
        a: "De flesta köken är gjorda för barn från tre år, och flera upp till sex eller åtta år. Följ åldersrekommendationen i beskrivningen.",
      },
      {
        q: "Behöver köket batterier?",
        a: "Kök med ljud, ljus eller rinnande vatten drivs med AA-batterier, som inte alltid ingår. Kök utan elektronik behöver inga batterier.",
      },
    ],
  },

  "massage-aterhamtning": {
    intro: [
      "Här hittar du massage för hemmet: uppresningsfåtöljer och reclinerfåtöljer med massage, massagefåtöljer med fotpall, massagestolar med utdragbart fotstöd, en gungstol och en schäslong med massage, hopfällbara massagebänkar och massage för ben och fötter med luftkompression.",
      "En uppresningsfåtölj lyfter och tippar sitsen framåt, så att det blir lättare att resa sig. De flesta här lyfts elektriskt 45 grader, en lyfter 60 grader och en har hydraulisk lyft. Alla har värme och massage i åtta punkter, och ryggen fälls till mellan 135 och 155 grader. Två har uttag för USB-A och USB-C, och den cremevita behöver bara 35 cm fritt mot väggen.",
      "De flesta massagefåtöljer har åtta eller tio vibrationspunkter fördelade över rygg, ländrygg, lår och ben, ryggen fälls till 135 eller 145 grader, och de bär 120 till 160 kg. Flera har en fristående fotpall. Reclinerfåtöljerna fälls till 135 eller 150 grader och har massage i åtta punkter och ländvärme.",
      "Massagestolarna har sex vibrationspunkter, fyra knådpunkter eller tvåpunktsmassage i ländryggen, de flesta har utdragbart fotstöd, och sitthöjden går från 41 till 68 cm. Massagebänkarna har ansiktsöppning, ställs i höjd mellan 59 och 92 cm och bär 130 till 250 kg. Fot- och vadmassagen och benmassagern har luftkompression och värme i tre program och tre styrkor.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är en uppresningsfåtölj?",
        a: "En fåtölj med uppresningshjälp: sitsen lyfts och tippas framåt, så att du kommer upp utan att ta spjärn. De flesta här lyfts av en motor, medan en har en hydraulisk lyft som arbetar tyst utan elmotor. Alla fälls också bakåt till liggläge.",
      },
      {
        q: "Hur mycket plats behöver en uppresningsfåtölj?",
        a: "Räkna med utrymme både bakåt och framåt. Den ljusgrå med 155 graders liggläge är 165 cm lång utfälld, och den hydrauliska reser sig till 142 cm i lyft läge. Den cremevita behöver bara 35 cm fritt mot väggen och reclinerfåtöljen med 28 cm ryggdyna 45 cm.",
      },
      {
        q: "Hur hög ska en massagebänk vara?",
        a: "Bänken ska stå så att den som masserar arbetar med raka armar utan att böja ryggen, ungefär i höjd med handlederna när armarna hänger. Bänkarna här ställs mellan 59 och 92 cm. Behöver den som ligger mer plats för armarna finns bänkar med 70 cm bred liggyta.",
      },
    ],
  },

  massagebankar: {
    intro: [
      "Här hittar du hopfällbara massagebänkar, som också kallas massagebord, massagesäng eller behandlingsbänk. De fälls ihop till ett platt paket och passar både för behandling hemma och för hembesök hos kunden.",
      "Stommen är av trä, aluminium eller stål. Träbänken med bärväska bär 250 kg, och väskan följer med i kartongen. På bänkarna med tre zoner fälls rygg, mitt och ben var för sig, och två av dem kan ställas i halvsittande läge.",
      "Liggytan är 60 cm bred, och två bänkar har en liggyta på 70 cm som ger mer plats för armarna. Med ansiktsstödet på är de flesta 210 till 215 cm långa, och höjden går att ställa på alla. Den 70 cm breda med armstöd och handbrädor har en 9 cm tjock dyna.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken höjd ska en massagebänk ha?",
        a: "En tumregel är att bänken ska nå ungefär till knogarna när du står bredvid den med armarna rakt ner. Höjden går att ställa på alla bänkarna här. Är du lång, titta efter en bänk som går högt: träbänken med bärväska går upp till 92 cm.",
      },
      {
        q: "Trä eller aluminium?",
        a: "Titta hellre på maxlast, bredd och höjd än på material. Aluminiumramen är lätt att bära och stabil att arbeta på, och tvåzonsbänken med träställ väger 13 kg.",
      },
      {
        q: "Hur mycket bär en massagebänk?",
        a: "Det skiljer mellan modellerna. Där maxlasten står ligger den mellan 130 och 250 kg: den 70 cm breda bänken med armstöd och handbrädor bär 130 kg, flera bänkar bär 225 kg och träbänken med bärväska 250 kg.",
      },
    ],
  },

  massagestolar: {
    intro: [
      "En massagefåtölj är en fåtölj att vila i, med vibration och värme i ryggen och ett fotstöd som fälls upp. Här samlar vi massagefåtöljer för vardagsrummet och massagestolar, där flera är kontorsstolar med massage i ryggen för dig som sitter länge vid skrivbordet.",
      "De flesta har både värme och vibration, och några har knådande massage i stället för vibration. Massagen och värmen styrs med en fjärr- eller handkontroll, och flera har timer som stänger av av sig själv. Många går att vrida runt, några har gungfunktion och flera har mugghållare och sidofickor för kontrollen.",
      "Några fåtöljer har uppresningshjälp: en elmotor lyfter sitsen och hjälper dig upp när du ska resa dig. Fåtöljerna bär upp till 160 kg, och klädseln är konstläder, mikrofiber, sammet, chenille eller tyg i linnelook. Kör massagen i korta pass i stället för i timmar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är skillnaden mellan en massagestol och en massagefåtölj?",
        a: "Massagefåtöljen är en vilfåtölj med fotstöd och ryggläge. Flera av massagestolarna är kontorsstolar, med vibration eller knådning i ryggen, som du sitter i vid skrivbordet.",
      },
      {
        q: "Finns det massagefåtöljer som hjälper en upp?",
        a: "Ja, några har uppresningshjälp. Samma handkontroll styr uppresningen, liggläget och massagen.",
      },
      {
        q: "Hur mycket bär en massagefåtölj?",
        a: "Det står per modell. De flesta bär 120 kg, flera 135 eller 150 kg, och en modell, som finns i fyra färger, är byggd för 160 kg.",
      },
    ],
  },

  "mat-vattenskalar": {
    intro: [
      "Mat- och vattenskålar samlar matplatsen för hund och katt: matskåp och matställ med skålar i rostfritt stål, foderautomater som serverar på fasta tider och vattenfontäner för katt. Till resan finns en hundväska med två foderbehållare och en hopfällbar skål.",
      "Matskåpen är 60 × 30 cm och mellan 34 och 46 cm höga, med två rostfria skålar på 2 liter infällda i skivan och förvaring under för foder, koppel och godis, från 21 till 50 liter. Välj höjd efter hunden: skåpen är gjorda för en mankhöjd från 50–60 cm upp till 60–75 cm, och det står i varje beskrivning. För mindre hundar och valpar finns ställ där höjden ställs steglöst mellan 11 och 33 cm, eller i fyra lägen mellan 13 och 31,5 cm.",
      "Foderautomaterna rymmer 4 eller 6 liter torrfoder och styrs från en display eller från mobilen över wifi, och de har batterier som reserv vid strömavbrott. Vattenfontänerna i rostfritt stål rymmer 2,5 och 3,2 liter och håller vattnet i rörelse, vilket får de flesta katter att dricka oftare. Den mindre räcker en katt i upp till fem dagar och den större i ungefär en vecka.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken höjd ska matskålen ha?",
        a: "Utgå från hundens mankhöjd. Varje matskåp och matställ anger vilken mankhöjd det är gjort för, till exempel 50–60 cm för skåpet som är 36 cm högt. Ett ställ som ställs steglöst mellan 11 och 33 cm kan följa med en valp som växer.",
      },
      {
        q: "Går skålarna att diska i maskin?",
        a: "Skålarna är i rostfritt stål och lyfts ur uppifrån, och i flera matskåp och ställ tål de maskindisk. På foderautomaterna tas lock, behållare och skålar loss och rengörs var för sig.",
      },
      {
        q: "Hur länge räcker en foderautomat?",
        a: "Behållaren på 4 liter rymmer omkring 16 koppar torrfoder, och för en katt räcker det över en långhelg. Automaten på 6 liter delar varje portion i två skålar och ställs på 1–10 mål per dag. Alla har batterier som reserv, så att schemat gäller även vid ett strömavbrott.",
      },
    ],
  },

  matgrupper: {
    intro: [
      "Här hittar du matgrupper, alltså matbord som säljs tillsammans med stolar. Sex är tredelade med ett bord och två stolar, och fem är femdelade med ett bord och fyra stolar.",
      "De små grupperna passar i köket eller i en liten lägenhet: ett kvadratiskt bord på 60 cm, ett på 70 × 70 cm, ett smalt bord på 90 × 47 cm och ett ovalt bord på 80 cm med en hylla under skivan. Klaffbordet fälls ut från 70 till 110 cm, och i en av grupperna har stolarna stoppad klädsel.",
      "Grupperna för fyra har bord på 100 till 120 cm: två i MDF och metall, ett glasbord med stolar i konstläder och två grupper där både bord och stolar är av furu.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket plats behöver en matgrupp?",
        a: "Räkna med bordets mått plus utrymme att dra ut stolarna. För glasbordet för fyra anges en golvyta på 180 × 170 cm, och för gruppen med bord på 80 × 60 cm minst 2,5 kvadratmeter.",
      },
      {
        q: "Hur höga är bordet och stolarna?",
        a: "Borden är 74,5 till 76,5 cm höga och sitthöjden är 43,5 till 47,5 cm där den anges. Det är vanlig höjd för ett matbord, och ett barbord är högre.",
      },
      {
        q: "Hur mycket bär stolarna?",
        a: "Mellan 100 och 120 kg per stol där maxlasten anges, och de flesta bär 120 kg. Borden tål mellan 30 och 100 kg.",
      },
    ],
  },

  "miniugnar-airfryers": {
    intro: [
      "Här hittar du miniugnar och bänkugnar för köksbänken, och miniugnar med frityrkorg som fungerar som airfryer. De rymmer från 9 till 46 liter och tar mindre plats än en vanlig ugn, så de passar i ett litet kök eller som en extra ugn.",
      "Sju av ugnarna har frityrkorg och varmluft. Maten ligger i korgen och den varma luften cirkulerar runt den, så att den blir krispig med betydligt mindre olja än i en vanlig fritös. Ugnarna med frityrkorg rymmer från 10 till 36 liter.",
      "De vanliga miniugnarna har timer och flera har tre värmelägen: övervärme, undervärme eller båda. Två bänkugnar har två kokplattor ovanpå, så att du kan koka och baka samtidigt, och fyra ugnar har grillspett.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Är en varmluftsfritös samma sak som en airfryer?",
        a: "Ja, varmluftsfritös är det svenska ordet för airfryer. Här är funktionen inbyggd i en miniugn: maten ligger i en frityrkorg och varm luft blåser runt den. Samma ugn bakar också, och flera av dem kan grilla.",
      },
      {
        q: "Hur stor miniugn behöver jag?",
        a: "Titta på innermåttet och på bakplåten. Ugnen på 9 liter tar en bakplåt på 25 × 20 cm, medan ugnarna på 36 liter har en bakplåt på 37,8 × 28 cm. Innermåtten står i varje beskrivning.",
      },
      {
        q: "Hur varm blir en miniugn?",
        a: "Upp till 230 °C på de ugnar där temperaturen anges, och flera börjar redan på 80 eller 90 °C. Timern går upp till 60 minuter på de flesta.",
      },
    ],
  },


  motionscyklar: {
    intro: [
      "Här hittar du motionscyklar för träning hemma, bland dem en liggande modell och en hopfällbar modell med ryggstöd, en spinningcykel och pedaltränare som ställs på golvet framför en stol eller soffa.",
      "Motionscyklarna har magnetiskt motstånd i 8 steg och en LCD-display, och två av dem har Bluetooth. Maxvikten är 120 kg på de två som anger den. Spinningcykeln har filtbroms och steglöst motstånd, och sadeln ställs mellan 78 och 93 cm över golvet.",
      "Pedaltränarna används sittande och tränar både armar och ben, med steglöst motstånd och en display som visar bland annat tid och kalorier. En av dem har handvevar upptill som ställs i 6 höjdlägen, och pedaltränaren i silver ställs på golvet för benen eller på ett bord för armarna.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur tung får jag vara?",
        a: "Maxvikten står i beskrivningen: 120 kg för den hopfällbara motionscykeln och motionscykeln med Bluetooth och sadel på 65–91 cm, och 100 kg för spinningcykeln. Pedaltränaren i silver bär 120 kg, precis som motionscyklarna.",
      },
      {
        q: "Finns det motionscykel med ryggstöd?",
        a: "Ja. På den liggande motionscykeln sitter du tillbakalutat med stöd för ryggen, och den hopfällbara modellen har ett ryggstöd som fälls undan när du vill sitta upprätt.",
      },
      {
        q: "Vad är en pedaltränare?",
        a: "En liten trampmaskin som du använder sittande, framför en stol eller soffa. Den tränar både ben och armar, och motståndet ställs steglöst med en ratt.",
      },
    ],
  },

  "motorcyklar-for-barn": {
    intro: [
      "En motorcykel för barn är ofta det första egna fordonet med gas och styre. Här samlar vi elmotorcyklar för barn från 18 månader upp till 12 år, bland dem licensierade modeller av BMW och Honda. För de allra minsta finns också ett sparkfordon och två trehjulingar i motorcykelform, som drivs med fötterna eller med pedaler.",
      "Välj efter ålder. För barn på 18–36 månader finns elmotorcyklar på 6 V med en toppfart på 2,4–3 km/h, antingen med två avtagbara stödhjul eller med tre hjul som står stadigt utan stödhjul. För 3–8 år finns modeller på 12 V med stödhjul, flera med fjädring, som går i upp till 5 till 8 km/h.",
      "Elmotorcykeln på 24 V är gjord för 8–12 år och kräver att barnet redan kan cykla: den har två farter, 8 och 16 km/h, luftfyllda bakdäck och en maxlast på 65 kg. En laddning räcker i 30 minuter till en timme beroende på modell, och laddningen tar oftast 8–12 timmar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Från vilken ålder passar en elmotorcykel?",
        a: "De minsta modellerna på 6 V är gjorda för barn från 18 månader och går i 2,4–3 km/h. Från tre år passar modellerna på 12 V, och för barn på 8–12 år finns en elmotorcykel på 24 V. Rekommenderad ålder står i varje produktbeskrivning, och på de flesta också maxvikten.",
      },
      {
        q: "Går stödhjulen att ta bort?",
        a: "Ja, på de flesta modellerna med stödhjul skruvas de av när barnet håller balansen själv. Elmotorcyklarna med tre hjul har inga stödhjul, eftersom de står stadigt ändå.",
      },
      {
        q: "Hur länge räcker batteriet?",
        a: "Mellan 30 minuter och en timme per laddning, beroende på modell, underlag och barnets vikt. Laddningen tar oftast 8–12 timmar, så det enklaste är att ladda över natten.",
      },
    ],
  },

  nattduksbord: {
    intro: [
      "Nattduksbordet håller lampan, mobilen och boken inom räckhåll från sängen. Här hittar du nattduksbord och sängbord med lådor, öppna fack och hyllor, svävande modeller som skruvas fast i väggen och smala bord för trånga sovrum.",
      "Flera säljs två och två, så att båda sidorna av sängen matchar. Två sängbord har inbyggda eluttag och USB-uttag, och ett nattduksbord har RGB-belysning dold i en springa.",
      "De svävande borden sitter på väggen utan ben, så golvet under dem blir fritt. Maxlasten står i beskrivningen, till exempel 20 kg per bord.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Är nattduksbord och sängbord samma sak?",
        a: "Ja, det är två namn på samma möbel: det lilla bordet bredvid sängen. Vi använder båda namnen.",
      },
      {
        q: "Hur högt ska ett nattduksbord vara?",
        a: "Ungefär i höjd med madrassens överkant, så att du når lampan och mobilen när du ligger. Mät sängen innan du väljer, höjden står i beskrivningen.",
      },
      {
        q: "Hur sätts ett svävande nattduksbord upp?",
        a: "Det skruvas fast direkt i väggen, med skruv och plugg som passar väggens material. Kontrollera maxlasten i beskrivningen innan du ställer tunga saker på det.",
      },
    ],
  },

  odlingslador: {
    intro: [
      "En odlingslåda gör det enkelt att odla grönsaker, kryddor och blommor även utan trädgårdsland, på gräsmattan, uteplatsen eller balkongen. Här samlar vi odlingslådor och planteringslådor i galvaniserad metall, trä, träkomposit, plast och konstrotting, från lådor som står direkt på marken till upphöjda odlingsbord.",
      "Flera lådor i metall och plast har öppen botten och ställs direkt på marken, så att rötterna når jorden under. Metallådan på 241 × 90,5 cm kan också byggas som en kortare låda på 126 cm av samma delar, och du väljer formen när du monterar. Flera av lådorna i trä har en fiberduk på insidan.",
      "Vill du slippa böja dig finns upphöjda lådor och odlingsbord, några på hjul eller med skåp eller hylla under. Andra har spaljé för klätterväxter, en foliekåpa som rullas upp eller ett nät som håller fåglarna borta.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Behöver odlingslådan en botten?",
        a: "Nej, inte om den står på marken. Flera av lådorna har öppen botten, så att rötterna når jorden under. På altanen eller balkongen passar en låda med botten och dräneringshål bättre, till exempel de upphöjda lådorna med vattenmagasin eller lådan på hjul.",
      },
      {
        q: "Vilket material ska jag välja?",
        a: "Galvaniserad metall och träkomposit ruttnar inte och står ute år efter år. Trä ger ett varmare intryck men behöver skötas, och plast är lätt. Flera av lådorna i plast monteras utan verktyg.",
      },
      {
        q: "Hur mycket jord går det åt?",
        a: "Räkna längd gånger bredd gånger djup på odlingsytan. Odlingsbordet med drivbänk rymmer cirka 75 liter jord och lådan med skåp 131 liter, och för de andra står odlingsytans mått i beskrivningen.",
      },
    ],
  },

  oronlappsfatoljer: {
    intro: [
      "Här hittar du öronlappsfåtöljer, fåtöljer med hög rygg och sidostycken i huvudhöjd som ger stöd när du lutar dig åt sidan. Här finns också en gungstol och en uppresningsfåtölj med samma rygg.",
      "Tre av fåtöljerna har samma form: 102 cm höga, 74 cm breda, med knappad rygg och en maxlast på 160 kg. Tillsammans finns de i grått, grå sammet, cremevit flanell, blått, mörkgrönt, mörkgrått och brunt. På den mörkgrå och den bruna går klädseln att ta av och tvätta, och på den blå går sitsdynans överdrag att tvätta.",
      "Tre fåtöljer har ländkudde: den med fotpall i grått eller gult, den beige i linnelook, som är 110 cm hög och står på ben i gummiträ, och den i manchester med 18 cm tjock sits. Gungstolen i fleece har fotpall, nackkudde och ryggkudde, och uppresningsfåtöljen har två motorer och fälls till 155 grader.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är en öronlappsfåtölj?",
        a: "En fåtölj med hög rygg och sidostycken i överkant, öronlapparna, som ger stöd åt huvudet när du lutar dig åt sidan. Öronlappsfåtöljerna här är 78 till 110 cm höga.",
      },
      {
        q: "Hur mycket bär en öronlappsfåtölj?",
        a: "De med knappad rygg bär 160 kg. De andra fåtöljerna, gungstolen och uppresningsfåtöljen bär 120 kg.",
      },
      {
        q: "Går klädseln att tvätta?",
        a: "På den mörkgrå och den bruna öronlappsfåtöljen går klädseln att ta av och tvätta i maskin, och på den blå går sitsdynans överdrag att tvätta. Hur de andra sköts står under Användning och skötsel i varje beskrivning.",
      },
    ],
  },

  pallar: {
    intro: [
      "Här hittar du pallar till hela hemmet: stegpallar, pianopallar och pianobänkar, rullpallar och sadelpallar på hjul, salongspallar, barpallar, sminkpallar, stoppade pallar och stapelbara sittpallar i fyrpack. Det finns också verkstadspallar med verktygsfack eller verktygsbricka, en knäpall för trädgården och en trädgårdspall på hjul.",
      "Pianopallarna ställs i höjd mellan 45 och 58 cm, och pianopallen med notförvaring har ett fack under sitsen. Pianobänken för två har två sitsar som ställs i höjd var för sig och bär 220 kg. Rullpallarna, sadelpallarna och salongspallarna är höj- och sänkbara, de flesta med gaslyft, från 43 upp till 73 cm, och flera har ryggstöd eller fotring. För ståbordet finns en ståpall som gungar och snurrar och en pendelpall med vippande sits.",
      "Stegpallen i stål fälls ihop med ett knapptryck och bär 150 kg, och till barnen finns stegpallar med två och tre steg. De stapelbara pallarna kommer i fyrpack, och de flesta bär 120 kg per pall. Verkstadspallarna har en fast sitthöjd på 35 och 37 cm, för arbete nere vid golvet.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken höjd ska en pianopall ha?",
        a: "Underarmarna ska vara ungefär vågräta när fingrarna vilar på tangenterna. Pianopallarna här ställs i höjd mellan 45 och 58 cm, så sitsen kan följa den som spelar. På pianobänken för två ställs sitsarna var för sig, mellan 48 och 58 cm.",
      },
      {
        q: "Vad är skillnaden på en sadelpall och en rullpall?",
        a: "En sadelpall har en sits formad som en ridsadel, högre fram och i sidorna och nedsänkt i mitten, så att du sitter med bäckenet framåtlutat. En rullpall har en rund sits, och flera har ryggstöd eller fotring.",
      },
      {
        q: "Vilken sitthöjd ska en rullpall ha?",
        a: "Utgå från bordet eller bänken du ska arbeta vid, så att underarmarna vilar ungefär i bordshöjd. Rullpallarna här går från 43 till 67 cm och sadelpallarna upp till 71 cm. Den snurrbara pallen med förvaring ställs mellan 49 och 65 cm och passar bänkar och bord på 80 till 99 cm.",
      },
    ],
  },

  projektordukar: {
    intro: [
      "Här hittar du projektordukar på 84 till 120 tum: motoriserade dukar som körs upp och ner med fjärrkontroll, manuella dukar som dras ner för hand och låser sig där du släpper dem, och dukar på stativ som ställs upp utan att något skruvas i väggen.",
      "Dukarna finns i tre bildformat. 16:9 är formatet för film, tv och spel, 4:3 passar presentationer och äldre material, och en kvadratisk duk i 1:1 kan visa båda, eftersom bilden då bara fyller en del av höjden.",
      "De motoriserade dukarna går på 230 V och drar 25 W, och fjärrkontrollen är trådlös. Både de motoriserade och de manuella skruvas i vägg eller tak och är gjorda för inomhusbruk. Stativduken på 84 tum står på ett trebent stativ och flyttas mellan rummen, och 120-tumsduken förankras med markankare och stormlinor i gräsmattan.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor projektorduk behöver jag?",
        a: "Utgå från rummet och avståndet. I projektorns manual står hur bred bilden blir på ett visst avstånd, och det avgör var projektorn ska stå för att fylla duken. Dukarna här är 152 till 263 cm breda, och ingen av dem har egen elektronik som behöver matcha projektorn.",
      },
      {
        q: "Vad betyder 84 tum?",
        a: "Tum anger dukens diagonal, alltså avståndet från hörn till hörn. En duk på 84 tum i formatet 4:3 är 171 cm bred och 128 till 131 cm hög, och duken på 120 tum i 16:9 är 263 × 148 cm.",
      },
      {
        q: "Kan duken användas utomhus?",
        a: "Duken på 120 tum kan det. Den ställs upp på gräsmattan och förankras med markankare och stormlinor, medan duken på trebent stativ är gjord för att flyttas mellan rummen. De motoriserade och de manuella dukarna skruvas i vägg eller tak och är gjorda för inomhusbruk.",
      },
    ],
  },

  "redskapsbodar-forrad": {
    intro: [
      "En redskapsbod ger gräsklipparen, cyklarna och trädgårdsredskapen ett eget tak. Här samlar vi våra redskapsbodar, förråd och trädgårdsskåp: bodar i galvad plåt och plast från 1,1 upp till 12,4 m², ett förrådstält på 13,4 m², cykelförråd och cykeltält och trädgårdsskåp i trä för spadar, krattor och annat trädgårdsredskap.",
      "Börja med yta och höjd. Vill du kunna gå in, titta på nockhöjden: bodarna på 4,1 m² har 2,28 meter i nock och de på 12,4 m² har två meter, och skjutdörrar behöver ingen plats framför boden. Plåtbodarna levereras oftast utan golv och ska stå på ett plant, bärande underlag, till exempel en gjuten platta eller en ram i tryckimpregnerat virke, medan de flesta plastbodarna har golv eller bottenplatta – läs i beskrivningen vad som ingår.",
      "Välj material efter hur mycket underhåll du vill ha. Galvaniserad plåt har ett zinkskikt som skyddar stålet, plastbodarna är genomfärgade och ska inte målas, och trä behöver målas eller laseras innan det tas i bruk.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Behöver jag bygglov för en redskapsbod?",
        a: "Mindre bodar kan ofta byggas som friggebod utan bygglov. Enligt Boverket får en friggebod vara högst 15 kvadratmeter och 3 meter hög, och den får inte stå närmare tomtgränsen än 4,5 meter utan grannens medgivande. Kommunen kan ha egna regler, så kontrollera alltid med din kommun innan du beställer.",
      },
      {
        q: "Ingår golv i redskapsboden?",
        a: "Det beror på modellen. Plåtbodarna levereras oftast utan golv och ska stå på ett plant, bärande underlag, till exempel en gjuten platta eller en ram i tryckimpregnerat virke. Plastbodarna har golv eller bottenplatta, utom boden på 1,1 m² som finns både med och utan golv, och två av metallbodarna levereras med golvfundament. Läs i beskrivningen vad som ingår.",
      },
      {
        q: "Redskapsbod, förrådstält eller trädgårdsskåp?",
        a: "En redskapsbod är ett litet hus som du går in i. Förrådstältet täcker 13,4 m² och har 255 cm i nock, så du går upprätt över hela golvet. Ett trädgårdsskåp tar minst plats och har hyllor och fack för redskap – bra när ytan är liten.",
      },
    ],
  },

  sandlador: {
    intro: [
      "En sandlåda med tak ger skugga under leken och kan skydda sanden mellan gångerna. Här samlar vi våra sandlådor i barrträ för barn från tre år: låga sandlådor med lekkök och diskho, sandlådor med soltak, justerbart tak eller lekstugetak och sandlådor formade som ett piratskepp och en bil.",
      "Titta på tak och botten. På flera modeller täcker duken hela sandytan, och på en kan taket sänkas ända ner till 18 cm så att det fungerar som lock – det håller regn, löv och katter borta. Sandlådan med soltak har fiberduk i botten och sandlådan med lekstugetak en duk som släpper igenom vatten, medan piratskeppet saknar botten så att regnvattnet rinner undan.",
      "Sandytan och djupet avgör hur mycket sand som går åt: sandlådan med höjdjusterbart tak tar ungefär fyra säckar om 30 kg, och sandlådan med soltak omkring 300 kg. Sand ingår inte. Måla eller olja träet en gång om året.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Behöver sandlådan ett lock?",
        a: "Ett lock eller ett skynke håller löv, regn och katter borta när ingen leker, och torr sand är trevligare att gräva i. På en av lådorna sänks taket ner till 18 cm och fungerar som lock.",
      },
      {
        q: "Hur mycket sand behövs?",
        a: "Det beror på sandytan och djupet. Sandlådan med soltak har en sandyta på 104 × 96 cm som är 20 cm djup och rymmer omkring 300 kg sand, och lådan med lekstugetak rymmer upp till 113 kg. Sandytans mått står i beskrivningen.",
      },
      {
        q: "Vilken ålder passar sandlådorna för?",
        a: "De är gjorda för barn från tre år, och sandlådan med lekstugetak och piratskeppet för 3–7 år. Den låga sandlådan med lekkök och två sandfack är så låg att ett treårigt barn kliver i själv.",
      },
    ],
  },

  "selar-koppel-transport": {
    intro: [
      "Här samlar vi det som behövs när hunden ska följa med i bilen, på cykeln eller på ryggen: hundgaller och bagagerumsgaller, en hundtrappa och en hundramp till bakluckan, cykelkärror och cykelvagnar för hund, hundvagnar, en hopfällbar hundbur och en hundryggsäck.",
      "Hundgallren skiljer bagageutrymmet från kupén utan att något borras i bilen. De låga hakas fast i nackstöden och dras ut från 90 till 120 cm eller från 91 till 152 cm, och de som spänns mellan golv och tak ställs mellan 87 och 135 cm på bredden. Mät höjden i bilen: gallret för 60–105 cm passar de flesta kombibilar, och det för 85–120 cm är gjort för SUV och minibuss. Maskorna är 5 × 5 cm eller rören 9 cm isär, så att hunden inte tar sig igenom.",
      "Hundtrappan har tio steg, når en lastkant på upp till 82 cm och bär 25 kg, och hundrampen på 155 cm har konstgräs och bär upp till 90 kg. Cykelvagnarna 2-i-1 kopplas till bakhjulets nav och blir hundvagnar när ni kommit fram, för hundar upp till 20 eller 30 kg och cyklar med 24 till 28 tums hjul. Hundryggsäcken bär upp till 10 kg och har en sida som fälls ut till en liggdel. Hundvagnarna finns också samlade under Hundvagnar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilket hundgaller passar min bil?",
        a: "Mät bredden mellan sidorna och höjden från golv till tak där gallret ska sitta. Galler som hakas i nackstöden passar de flesta kombibilar och SUV:ar, och galler som spänns mellan golv och tak finns för höjder mellan 60 och 105 cm eller 85 och 120 cm. Inget av dem kräver borrning.",
      },
      {
        q: "Ska jag välja hundtrappa eller hundramp till bilen?",
        a: "Trappan har plana steg för en hund som går säkert i trappor, och den bär 25 kg. Rampen på 155 cm ger en jämn lutning som skonar lederna och bär upp till 90 kg, så den passar äldre och tyngre hundar. Båda fälls ihop på mitten och får plats i bagageutrymmet.",
      },
      {
        q: "Hur stor hund får plats i cykelvagnen?",
        a: "Titta både på maxvikten och på hundens längd. Cykelvagnen för 20 kg tar hundar med en kroppslängd under 50 cm, mätt från bröstbenet till svansroten, och den större tar hundar upp till 30 kg i en kabin på 85 × 62 × 63 cm. Cykelkärran med universalkoppling bär 20 kg.",
      },
    ],
  },


  "serveringsvagnar-rullvagnar": {
    intro: [
      "En vagn på hjul tar det du behöver dit du behöver det och rullar undan efteråt. Här samlar vi serveringsvagnar för kök och vardagsrum, barvagnar för glas och flaskor och smala rullvagnar som ger förvaring i glipan mellan kylen och skåpet, bredvid tvättmaskinen eller i badrummet.",
      "Serveringsvagnarna har tre plan, och på den ena går mittplanet att flytta i höjdled. De flesta barvagnarna har flaskställ eller flaskplatser, och den runda barvagnen i konstrotting har en bricka som lyfts av och bärs in. Barvagnen i gran är gjord för uteplatsen, med en arbetsyta på 88 × 61 cm som bär 50 kg per hylla, och barvagnen i bambu fälls ihop när festen är över.",
      "Rullvagnarna är 13 till 26,5 cm djupa och har korgar i metallnät, utdragslådor eller hyllplan med kant, och de bär 9 till 15 kg totalt. De flesta vagnarna har fyra hjul, där två har broms som håller vagnen på plats.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är skillnaden mellan en serveringsvagn och en rullvagn?",
        a: "En serveringsvagn har hela plan att ställa brickor, tallrikar och glas på och används för att servera. En rullvagn är oftast smal, med korgar eller lådor, och används som förvaring i trånga utrymmen i kök, badrum och tvättstuga.",
      },
      {
        q: "Får en rullvagn plats mellan kylen och väggen?",
        a: "Ofta, ja. Rullvagnen med fem plan är bara 13 cm på den smala sidan, och flera andra är 20 till 24 cm djupa. Mät glipan och jämför med måtten i beskrivningen.",
      },
      {
        q: "Har vagnarna broms?",
        a: "De flesta har fyra hjul, varav två med broms. Barvagnen i gran för uteplatsen har två hjul i ena änden och ett handtag i den andra, så den rullas som en skottkärra och står still när den ställs ner.",
      },
    ],
  },

  "sideboards-vitrinskap": {
    intro: [
      "Här hittar du sideboards, skänkar och vitrinskåp: sideboards i vitt, högglans, metall och flätad rotting, en skänk med guldfärgade ben, köksskänkar och höga köksskåp med arbetsyta, flera i lantstil och med glasdörrar, och vitrinskåp för väggen och golvet.",
      "Sideboardsen och skänkarna är 68,6 till 140 cm breda, och de flesta har både lådor och skåp. Flera har dörrar med soft close, och ett har eluttag, USB-portar och en LED-list som lyser i sju färger. Flera levereras med tippskydd eller tippband.",
      "Vitrinskåpen för väggen är 9,5 cm djupa, har glasdörrar och hyllplan som kan flyttas och passar samlarfigurer och modeller. Det fristående vitrinskåpet är 139 cm högt med fyra fack och luckor i akryl som fälls upp och glider in ovanför facket.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är skillnaden på ett sideboard och en skänk?",
        a: "Orden betyder i stort sett samma sak: en låg förvaringsmöbel med lådor och skåp. Skänk är det svenska ordet och sideboard det engelska. De flesta sideboards och skänkar här är 74 till 86 cm höga, medan köksskåpen är 159 till 182,5 cm.",
      },
      {
        q: "Hur mycket tål skivan?",
        a: "Det står i beskrivningen. Skänken med guldben tål 94 kg ovanpå, och sideboardet på 120 cm med tre lådor och tippskydd tål 30 kg på skivan och 65 kg totalt. Hyllplanen i vitrinskåpen för väggen tål 2 kg vardera.",
      },
      {
        q: "Hur sätter jag upp ett vitrinskåp på väggen?",
        a: "Med skruv och plugg som passar väggen. Det fristående vitrinskåpet har ett väggfäste som ingår, så att det står säkert även när facken är fulla.",
      },
    ],
  },

  sidobord: {
    intro: [
      "Ett sidobord håller lampan, koppen och mobilen nära där du sitter. Här hittar du runda sidobord i metall, rotting, stenlook och marmorlook, sidobord i industristil med hylla eller skåp och C-formade bord som ställs tätt intill soffan.",
      "Av de C-formade borden står fyra på hjul, och flera skjuts in under soffan eller sängen, så att skivan hamnar där du sitter. Två av dem på hjul går att höja, mellan 68 och 78 cm respektive 72 och 82 cm, och fungerar också som sängbord eller litet rullbord.",
      "Fyra sidobord har eluttag och USB, så att mobilen laddas där den ligger, och flera runda bord av metall och rotting klarar både inne och ute. De runda borden är 32 till 50 cm i diameter.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur högt ska ett sidobord vara?",
        a: "Ungefär i höjd med soffans armstöd, så att du når koppen utan att luta dig fram. Sidoborden här är 35 till 82 cm höga, och höjden står i beskrivningen.",
      },
      {
        q: "Är sidobord och avlastningsbord samma sak?",
        a: "Ja, det är två ord för samma möbel: ett litet bord bredvid soffan, fåtöljen eller sängen.",
      },
      {
        q: "Går borden att ha ute?",
        a: "Några av de runda borden i metall och rotting passar både inne och ute. Det står i beskrivningen vilka.",
      },
    ],
  },

  "sittpuffar-fotpallar": {
    intro: [
      "Här hittar du sittpuffar, fotpallar och puffar med förvaring. De är klädda i sammet, manchester, chenille, teddyfleece eller sherpa, och en sittpuff är flätad i vattenhyacint. Här finns också sittbänkar med förvaring under sitsen, 100 till 120 cm långa.",
      "De flesta har ett förvaringsfack under locket, från 13,5 liter i den minsta förvaringspallen till 97 liter i den största förvaringspuffen. På flera är locket vändbart, med en mjuk sida att sitta på och en hård sida som fungerar som bricka eller avlastningsbord.",
      "Fotpallarna är 45 till 70 cm breda, och fyra av de fem bär 120 kg, så de går också att sitta på. En fotpall och en sittpuff har plats för katten inuti, och till setet med två sittpallar hör förvaring i den stora.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är skillnaden på en sittpuff och en fotpall?",
        a: "En fotpall är oftast avlång och gjord för att vila benen på, medan en sittpuff oftast är rund eller oval. Fyra av fotpallarna här bär ändå 120 kg, så de går lika bra att sitta på.",
      },
      {
        q: "Hur mycket får plats i en förvaringspuff?",
        a: "Från 13,5 liter i den minsta förvaringspallen till 97 liter i förvaringspuffen på 60 cm i diameter. Det räcker till filtar, leksaker eller ett par kuddar.",
      },
      {
        q: "Går det att sitta på puffen?",
        a: "De flesta puffar och pallar bär 120 kg, och förvaringspallen i sammetslook med lock som blir bricka bär 150 kg. Fotpallen med kattbädd är gjord för benen och bär 30 kg ovanpå, och sittpuffen i vattenhyacint bär 80 kg.",
      },
    ],
  },

  "skarmtak-entretak": {
    intro: [
      "Här hittar du skärmtak och entrétak som monteras på väggen ovanför ytterdörren eller ett fönster och skyddar mot regn. Takskivan är av polykarbonat, en slagtålig plast, eller på ett av entrétaken av härdat glas, och på de flesta är den genomskinlig så att entrén inte blir mörk.",
      "De minsta är 100 till 122 cm breda och passar över en enkeldörr eller ett fönster. Entrétaket på 195 cm räcker över en dubbeldörr, och de två längsta är 295 och 303 cm. Entrétaket i glas finns 150 och 200 cm brett och hålls uppe av dragstag i rostfritt stål.",
      "Entrétaken på 122 och 195 cm har en takskiva av hålkammarplast på 5 mm och levereras med expanderbultar och täckproppar. Skärmtaket på 110 × 60 cm hänger på två väggkonsoler utan stolpe, klarar en snölast på 5 cm och ska sitta minst 30 cm ovanför öppningen.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur brett skärmtak ska jag välja?",
        a: "Välj ett tak som är bredare än dörren, så att det skyddar även när du står och letar efter nycklarna. För en enkeldörr finns tak på 100 till 122 cm, och för en dubbeldörr entrétaket på 195 cm.",
      },
      {
        q: "Hur monteras ett skärmtak?",
        a: "Det skruvas fast i väggen med konsoler eller fästen. Till entrétaken i polykarbonat följer expanderbultar med, till glastaket skruvar och pluggar för betongvägg, och monteringen kräver att du borrar i fasaden. Skärmtaket på 110 × 60 cm ska sitta minst 30 cm ovanför dörr- eller fönsteröppningen.",
      },
      {
        q: "Vad är polykarbonat?",
        a: "En slagtålig plast som väger mycket mindre än glas, så att taket kan hänga på väggkonsoler. Skärmtaket för dörr och fönster på 100 × 75 cm har ett UV-skikt som skyddar skivan mot solen.",
      },
    ],
  },

  "skoskap-skobankar": {
    intro: [
      "Skor vid ytterdörren blir snabbt en hög. Här samlar vi skoskåp med tippfack eller luckor, skobänkar att sitta på medan du knyter skorna, öppna skohyllor och skoställ, och hallmöbler där skohylla, sittplats och krokar sitter ihop.",
      "Skoskåpen rymmer från 8 till 30 par, och de smalaste är bara 15 till 26 cm djupa, så att de får plats i en trång hall. I ett skåp med tippfack står skorna lutade bakom en lucka som fälls ut, och flera skåp har spegeldörrar, så att hallen får en stor spegel på köpet.",
      "Skobänkarna har sittyta, flera med dyna eller stoppad sits, och bär mellan 120 och 220 kg. De höga skoskåpen levereras med tippskydd som ska fästas i väggen, och de flesta möbler monteras efter anvisningen i paketet. Den hopfällbara skohyllan i bambu behöver ingen montering alls.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur många par skor rymmer ett skoskåp?",
        a: "Det står per modell, från 8 par i de smalaste skåpen till 30 par i det största. Stövlar och stora storlekar tar mer plats än antalet par räknar med.",
      },
      {
        q: "Vad är ett tippfack?",
        a: "Ett fack där skorna står snett bakom en lucka som fälls ut nedtill. Det gör att skåpet kan vara grunt, och skorna tar liten plats i djupled.",
      },
      {
        q: "Passar ett skoskåp i en smal hall?",
        a: "Ja, välj efter djupet. Det smalaste skoskåpet är 15 cm djupt och flera andra är 24 till 26 cm. Mät väggen och räkna med plats att fälla ut luckan.",
      },
    ],
  },

  snurrfatoljer: {
    intro: [
      "Här hittar du snurrfåtöljer som vrids 360 grader, på ben eller på en fot i mitten. Många har en fotpall, och flera är reclinerfåtöljer vars rygg fälls bakåt, några också med gungfunktion.",
      "Tre snurrfåtöljer i linnelook har gaslyft, så att sitsen ställs mellan 45 och 57 cm, och de står på en rund kromad fot utan hjul. Fåtöljen med lös fotpall på rund stålfot bär 150 kg, och på den snurrar sitsen ovanpå foten. Snurrfåtöljen med knappad rygg är 60 cm bred och passar där det är ont om plats.",
      "En armlös snurrfåtölj i chenille har en 35 cm tjock sittdyna, och på fåtöljen med höjdjusterbar fotpall snurrar både stolen och pallen. En reclinerfåtölj i konstläder har en rygg som låses i önskad vinkel med ett vred.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket plats behöver en snurrfåtölj?",
        a: "Eftersom stolen vrids behövs utrymme runt om, inte bara framför. Fåtöljen med lös fotpall på stålfot tar 71 × 69 cm i golvyta men blir 93 cm djup när ryggen fälls, och en reclinerfåtölj med snurrfot behöver 80 cm fritt bakom sig.",
      },
      {
        q: "Hur mycket bär en snurrfåtölj?",
        a: "De flesta bär 120 kg. Snurrfåtöljerna i linnelook med gaslyft bär 136 kg, flera reclinerfåtöljer och fåtöljen med lös fotpall på stålfot 150 kg, och en reclinerfåtölj i konstläder och papasanfåtöljen i konstrotting 160 kg.",
      },
      {
        q: "Kan fåtöljen fällas bakåt?",
        a: "Flera kan det. Reclinerfåtöljerna fälls till mellan 130 och 150 grader, en av dem låses med ett vred i den vinkel du vill ha, och fåtöljen med lös fotpall på stålfot har ett bakåtlutat läge.",
      },
    ],
  },

  "solskydd-paviljonger": {
    intro: [
      "Tak och skugga över uteplatsen gör den användbar i både sol och regn. Här samlar vi paviljonger, pop up-tält och partytält, reservtak till paviljonger och pergolor, parasoll med fot och vikter, markiser och skärmtak i polykarbonat.",
      "Är duken på paviljongen sliten behöver du inte byta hela paviljongen. Reservtaken finns i 3 × 3 och 3 × 4 m och sätts på den stomme du redan har, flera har en ventilerad topp så att varmluften slipper ut, och några är i Oxfordväv. Kontrollera stommens mått innan du beställer.",
      "Ett pop up-tält fälls ut på några minuter, och flera har väggar eller myggnät. Vid kraftig vind eller storm ska tältet tas ner, och markisen vevas in när det blåser.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Passar paviljongtaket min paviljong?",
        a: "Reservtaken finns i 3 × 3 och 3 × 4 m och sätts på den stomme du redan har. Kontrollera stommens mått och form innan du beställer.",
      },
      {
        q: "Tål paviljongen blåst?",
        a: "Förankra tältet ordentligt, och ta ner det vid kraftig vind eller storm. En markis ska vevas in när det blåser, oavsett väder.",
      },
      {
        q: "Vilken parasollfot behöver jag?",
        a: "Det finns parasollfötter i cement på 12 kg, en fot för markmontering och vikter till hängparasoll. Kontrollera att foten passar parasollets stång.",
      },
    ],
  },

  soptunnor: {
    intro: [
      "Här hittar du soptunnor för köket: sensortunnor som öppnar locket när du håller handen över dem, pedaltunnor med mjukstängande lock, sopsorteringskärl med två eller tre fack och utdragbara sopsorterare som sitter i köksskåpet.",
      "Sensortunnorna rymmer från 20 till 68 liter och finns i rostfritt stål eller i svart. De flesta går på fyra AA-batterier och några på fyra D-batterier, och batterierna ingår inte. På flera går locket också att öppna med en knapp. Sopsorteringstunnan med sensor har ett stort fack på 47 liter och två mindre under.",
      "Sopsorteringskärlen har två fack på 15 till 30 liter eller tre fack på 15 eller 20 liter, och på flera har varje fack en egen pedal. Flera har ett fack för doftblock eller luktfilter i locket. Behöver du en smal tunna finns en som är 40 cm bred och en som är 30 cm djup. De utdragbara sopsorterarna har två eller tre fack och dras ut ur köksskåpet.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur fungerar en soptunna med sensor?",
        a: "En sensor i locket känner av handen och öppnar locket, och efter några sekunder stänger det sig självt. Räckvidden är 15 till 20 centimeter på de tunnor där den anges. Tunnan går på batterier som inte ingår, så köp dem samtidigt.",
      },
      {
        q: "Hur många fack behöver jag för sopsortering?",
        a: "Två fack räcker för matavfall och restavfall, och med tre fack får förpackningarna ett eget. Facken är ofta lika stora medan soporna inte är det, så det fack som fylls först bestämmer hur ofta du tömmer. Den utdragbara sopsorteraren med tre fack har ett stort fack på 15 liter och två på 8 liter.",
      },
      {
        q: "Ryms en utdragbar sopsorterare i mitt köksskåp?",
        a: "Mät skåpets insida och jämför med ramens mått i beskrivningen. Ramen är 47 × 33 × 32 cm på den med tre fack och 52 × 26 × 40,8 cm på dem med 20 plus 10 liter. Tre av dem levereras förmonterade, och den med tre fack skruvas fast i skåpbotten med skruvarna som följer med.",
      },
    ],
  },

  "sparkcyklar-for-barn": {
    intro: [
      "En sparkcykel med stora hjul tar sig lätt över trottoarkanter och grus och passar både skolvägen och cykelbanan. Här samlar vi alla våra sparkcyklar för barn: modeller med hjul på 12–16 tum för barn från fem år, sparkcyklar med korg och stänkskärmar och trehjuliga sparkcyklar för de minsta, från 18 månader.",
      "Välj hjul efter var barnet åker. Luftdäck dämpar skarvar, grus och kullersten men behöver pumpas då och då, medan massiva EVA-hjul aldrig punkterar och aldrig behöver pumpas. Nästan alla har broms – handbroms, bakbroms eller broms på båda hjulen – och styret går att justera på nästan alla, så sparkcykeln växer med barnet.",
      "Maxvikten är 50 kg på modellerna för 5–12 år och 100 kg på de större, och flera har stödben så att sparkcykeln står själv.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Från vilken ålder passar en sparkcykel?",
        a: "För de minsta, från 18 månader, finns en trehjulig sparkcykel med sits och föräldrahandtag. De flesta modellerna med stora hjul är gjorda för barn från fem år, och flera upp till tolv år.",
      },
      {
        q: "Luftdäck eller massiva hjul?",
        a: "Luftdäck dämpar skarvar och grus bättre men tappar tryck när sparkcykeln står still, så de behöver pumpas. Massiva EVA-hjul punkterar aldrig och behöver aldrig pumpas, men ger en hårdare åktur på ojämn mark.",
      },
      {
        q: "Hur vet jag vilken storlek som passar?",
        a: "Utgå från barnets ålder och vikt: modellerna för 5–12 år bär 50 kg och de större 100 kg. Styrets höjd står i beskrivningen, till exempel 80–88 cm, och går att justera på nästan alla.",
      },
    ],
  },

  speglar: {
    intro: [
      "Här hittar du speglar till hela hemmet: helkroppsspeglar och golvspeglar, väggspeglar med ram i svart metall, guld eller furufaner, fönsterspeglar med spröjs och badrumsspeglar med LED-belysning.",
      "Helkroppsspeglarna och golvspeglarna är 120 till 180 cm höga. Fyra av dem har ett stöd som fälls ut, så att spegeln står på golvet, och två har dimbar LED-belysning.",
      "Väggspeglarna finns i flera storlekar och former, och flera hängs stående eller liggande. Till badrummet finns speglar med LED-belysning och antiimma, samlade på sidan Badrumsspeglar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor spegel behöver jag för att se hela mig?",
        a: "En plan spegel behöver vara ungefär hälften så hög som du för att du ska se hela kroppen, om den sitter på rätt höjd. Helkropps- och golvspeglarna här är 120 till 180 cm höga.",
      },
      {
        q: "Hur hänger jag upp en tung spegel?",
        a: "Med skruv och plugg som passar väggen, och skruvarna ska sitta i väggmaterialet, inte bara i gipsskivan. Flera väggspeglar väger runt 10 kg, och vikten står i beskrivningen.",
      },
      {
        q: "Kan spegeln hänga liggande?",
        a: "Flera väggspeglar kan hängas både stående och liggande. Spegeln med nio fält har fyra krokar på baksidan för just det.",
      },
    ],
  },

  terrarier: {
    intro: [
      "Här finns terrarier i glas från 24 till 140 liter: kuber på 30 × 30 × 30 cm, ett lågt och ett högre terrarium på 50 × 30 cm och ett terrarium på 86 liter med skjutdörrar. Terrariet på 140 liter står på egna träben i stället för på ett bord. För sköldpaddan finns sköldpaddshus i trä, och här finns också ett akvarium på 41 liter och en reptilinkubator.",
      "Välj efter hur djuret lever. Det låga terrariet på 50 × 30 × 25 cm har samma golvyta som 48-litersmodellen på 50 × 30 × 35 cm men lägre höjd och passar en art som lever på marken, medan det högre ger plats för klättring. Terrariet på 86 liter har 60 × 45 cm golvyta och glas på alla fyra sidor.",
      "Flera öppnas framifrån, med skjutdörrar eller en frontlucka med knapplås som ett djur inte kan trycka upp, och de har lock av galler eller nät. Två modeller har en strukturerad bakvägg som djuret kan klättra på.",
      "Sköldpaddshusen är 81 till 120 cm långa, med ett skyddat rum och en del under nät eller helt öppen ovansida, och flera har en hållare för värme- eller UV-lampa. Reptilinkubatorn på 25 liter både kyler och värmer, mellan 5 och 42 °C.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilka djur passar terrarierna för?",
        a: "Terrarierna i glas är gjorda för ödlor, ormar, spindlar och grodor, och terrariet på 86 liter räcker för mindre arter som leopardgecko och dvärggecko. Sköldpaddor hör hemma i sköldpaddshusen. Välj höjd efter om djuret klättrar eller lever på marken och golvyta efter hur stort det är.",
      },
      {
        q: "Går terrarierna att låsa?",
        a: "Flera gör det. Terrariet på 86 liter har två lås, ett på dörren och ett på ovansidan, och flera av de mindre har en frontlucka med knapplås.",
      },
      {
        q: "Hur stor sköldpadda räcker sköldpaddshuset till?",
        a: "Det beror på golvytan. Husen på 81, 91 och 104 cm räcker till en landsköldpadda med en skallängd upp till 15 cm, och huset på 120 cm med 0,53 m² till en på upp till 20 cm. Skallängden mäts rakt från främre till bakre skalkant.",
      },
    ],
  },

  "terrassvarmare-infravarmare": {
    intro: [
      "En terrassvärmare gör altanen och balkongen användbar även en sval kväll. Här samlar vi elektriska värmare: en terrassvärmare på stativ på 2500 W, en terrassvärmare med oscillering och infravärmare för vägg, en av dem med stativ som alternativ.",
      "Karbonfiberröret på stativvärmaren värmer 10–15 m², och infravärmaren för vägg eller stativ 15–20 m². Effekten ställs i steg, upp till nio, med vred, touchpanel, fjärrkontroll eller app, och stativvärmaren och infravärmaren med app har timer på upp till 24 timmar.",
      "Tre av värmarna är IP65-klassade, och till båda infravärmarna följer ett skyddshölje för vintern. Infravärmaren med app bygger bara 8 cm ut från väggen och passar därför också på en smal balkong.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor yta värmer en terrassvärmare?",
        a: "Det beror på effekt och placering. Stativvärmaren med karbonfiberrör värmer 10–15 m² och infravärmaren för vägg eller stativ 15–20 m².",
      },
      {
        q: "Tål värmarna väder?",
        a: "Tre av dem är IP65-klassade, och till båda infravärmarna följer ett skyddshölje för vintern. Terrassvärmaren med oscillering är IP45-klassad och tål vattenstrålar men är inte dammtät.",
      },
      {
        q: "Hur styr jag värmen?",
        a: "Med vred, touchpanel, fjärrkontroll eller app beroende på modell. Infravärmaren för vägg med app ställs i nio steg från telefonen, och den och stativvärmaren har timer på upp till 24 timmar.",
      },
    ],
  },

  "tradgardsdekor-belysning": {
    intro: [
      "Här samlar vi belysning och dekor för trädgården, uteplatsen och balkongen: solcellslampor och solcellslyktor, en pollarlampa och en ljusslinga, trädgårdsfontäner, konstgjorda buxbomsklot, cypresser och häckar på rulle, spaljéer och en rosenbåge, fågelmatare, en trädgårdsbro, en vedförvaringshylla och plattor av konstgräs och akacia att lägga på altanen.",
      "Solcellslamporna laddas av solen och tänds själva när det skymmer, så de behöver ingen elkabel. De finns från små lyktor i konstrotting på 35 och 45 cm till lyktstolpar på 195 cm, flera med planteringskruka i foten. Lyktorna i konstrotting ger 15 lumen stämningsljus och lyser i åtta timmar efter fem timmar i sol, medan de starkaste stolparna ger 200 lumen på högsta läget. Pollarlampan på 90 cm är klassad IP65, och ljusslingan på 18 m har 50 LED-lampor.",
      "Trädgårdsfontänen på 60 cm har fyra skålar och en pump som för vattnet runt. De konstgjorda kloten och träden står på spett i gräsmattan eller i kruka, och häckarna på rulle, 300 cm långa och 100 eller 150 cm höga, blir insynsskydd på balkongräcket eller staketet. Rosenbågen är 240 cm hög och förankras med fyra markspett.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur länge lyser en solcellslampa?",
        a: "Det beror på modellen och på hur mycket sol panelen får. Lyktorna i konstrotting lyser i åtta timmar efter fem timmar i sol, och ett par solcellslyktor lyser i sex timmar på full laddning. På vintern är dagarna för korta för en full laddning, så räkna med kortare kvällar då. Ställ lampan där panelen får sol mitt på dagen.",
      },
      {
        q: "Tål solcellslamporna regn?",
        a: "Ja, lyktorna i konstrotting är klassade IP44 och tål regn och snöglopp från alla håll, men de ska inte stå i vatten. Pollarlampan är klassad IP65 och tål vattenstrålar.",
      },
      {
        q: "Var hittar jag figurer för jul och halloween?",
        a: "De ligger under avdelningen Jul & Högtider, i Juldekoration och Halloweendekoration. Där finns uppblåsbara tomtar, snögubbar och spöken med LED för trädgården och entrén.",
      },
    ],
  },

  "tradgardsskotsel-bevattning": {
    intro: [
      "Här samlar vi det som håller trädgården i ordning: slangvagnar och en väggmonterad slangvinda för bevattningen, en kompostbehållare på 240 liter, gödselspridare och gräsmattsluftare, batteridriven lövblås, häcksax och gräsklippare, en högtryckstvätt, en sopmaskin, en hopfällbar vattentank och trädgårdsskåp för redskapen. Inför vintern finns snöskyfflar och snökäppar för infarten.",
      "De batteridrivna maskinerna slipper sladd. Lövblåsen levereras med två batterier, medan gräsklipparen är gjord för ett 36 V-batteri, så kontrollera vad som ingår innan du beställer.",
      "Trädgårdsskåpen finns också under Redskapsbodar & förråd, där bodarna och förrådstälten ligger.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Ingår slang i slangvagnen?",
        a: "En av slangvagnarna levereras med 45 m slang och munstycke, och den väggmonterade slangvindan rymmer 10 m. Kontrollera i produktbeskrivningen om slang ingår i den modell du väljer.",
      },
      {
        q: "Hur luftar jag gräsmattan?",
        a: "Med en gräsmattsluftare som du rullar över gräsmattan, så att piggarna gör hål som släpper ner luft, vatten och näring till rötterna. Luftaren med spikvals har trettio piggar och 45 cm arbetsbredd, och den med spikvält är 42,5 cm bred. Hösten är en bra tid att lufta.",
      },
      {
        q: "Ingår batteri till maskinerna?",
        a: "Till lövblåsen följer två batterier på 20 V och en laddare, och häcksaxen levereras med ett 20 V-batteri och laddare. Gräsklipparen levereras utan batteri och laddare och tar ett 36 V-batteri.",
      },
    ],
  },

  "traning-gym": {
    intro: [
      "Här samlar vi utrustning för hemmagymmet: gymstationer och multigym med viktblock, en smithmaskin, chinsstänger och dipsställningar, stepbrädor, plyoboxar, pilatesbrädor, roddmaskiner, steppers, vibrationsplattor, inversionsbänkar och små studsmattor för träning. Här finns också gymnastikmattor, balansbommar och gymnastikräck för barn. Hantlar, träningsbänkar, motionscyklar och boxningssäckar ligger både här och på egna sidor.",
      "Den fristående chinsstången ställs i 12 höjdlägen mellan 176 och 227 cm och bär 120 kg, och den väggmonterade är chinsstång och dipsställning i ett. Stepbrädorna ställs i tre höjder, från 10 till 25 cm beroende på modell, och de största bär 250 kg. Pilatesbrädan Reformer i trä är 165 cm lång och har motståndsband. Vibrationsplattorna har upp till 120 hastigheter.",
      "Gymstationerna har viktblock på 45 eller 65 kg, och den kompakta på 162 × 162 cm samlar latsdrag och butterfly på liten yta. Smithmaskinen med power rack är 215 cm hög och har dubbla kabeldrag. Roddmaskinerna finns med vattentank på 6–11 liter eller med hydrauliskt motstånd i 12 nivåer, och steppers och ministeppers bär 100 kg.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken chinsstång passar mig?",
        a: "Den fristående kräver inga hål i väggen, ställs i 12 höjdlägen mellan 176 och 227 cm och har dips. Den väggmonterade tar mindre golvyta och har dipsställning i samma fäste, men den ska skruvas i en bärande vägg.",
      },
      {
        q: "Vad passar om jag har lite plats?",
        a: "Den väggmonterade chinsstången, stepbrädorna och steppers tar lite golvyta, och flera redskap fälls ihop efter passet, som inversionsbänken, magtränaren och pilatesbrädan med tillbehör. Den kompakta gymstationen samlar flera övningar på 162 × 162 cm.",
      },
      {
        q: "Var hittar jag hantlarna och träningskläderna?",
        a: "Hantlar, träningsbänkar, motionscyklar och boxningssäckar har egna sidor under Sport & Fritid och finns också här. Yogabyxor, sport-bh och andra träningskläder finns under Träningskläder.",
      },
    ],
  },

  traningsbankar: {
    intro: [
      "Här hittar du träningsbänkar för hemmagymmet: hopfällbara bänkar med justerbart ryggstöd, bänkar med benrullar och bensträckare, bänkar med skivstångsställ och specialbänkar som scottbänk och sit-up-bänkar, och en bänk i trä med hantelfack.",
      "Ryggstödet ställs i tre till sju lägen på de flesta. En bänk har i stället en plan, fast dyna och ett fristående ställ, och många fälls ihop mellan passen så att de går att ställa undan.",
      "Den vita bänken med skivstångsställ, bröstpress och benpress har ställ i sex höjder mellan 107,5 och 130 cm och ett armstöd för bicepscurl. På scottbänken vilar armarna mot en lutande dyna, och du curlar uppåt för biceps eller pressar nedåt för triceps. Maxvikten för användaren är oftast 120 kg.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket klarar bänken?",
        a: "Maxvikten för användaren är oftast 120 kg och som mest 150 kg. Bänken med benrullar och gummiband tål 350 kg total belastning, alltså du och vikterna tillsammans.",
      },
      {
        q: "Går bänken att fälla ihop?",
        a: "Många gör det, och det står i namnet eller beskrivningen. Bänken med fristående ställ fälls ihop i två delar, var för sig.",
      },
      {
        q: "Vad är en scottbänk?",
        a: "En bänk för armträning där överarmen vilar mot en lutande dyna. Scottbänken här är 2-i-1: du curlar uppåt för biceps och pressar nedåt för triceps.",
      },
    ],
  },

  "tv-bankar": {
    intro: [
      "En tv-bänk ska bära tv:n, gömma sladdarna och ge plats för spelkonsol, router och fjärrkontroller. Här samlar vi tv-bänkar från 80 till 200 cm, en väggmonterad bänk som svävar över golvet, en liten bänk på hjul och bänkar med lådor, luckor och öppna fack. Här finns också två tv-stativ på hjul för tv från 32 till 75 tum, där tv:n hängs på en stolpe som höjs och sänks.",
      "Titta på tv:ns storlek och vikt. Flera bänkar anger vilken tv som får plats, upp till 82 tum, och bärigheten står per modell, upp till 100 kg för hela bänken. Bänken på hjul har kabelhål i bakstycket, och under bänkar med ben kan sladdarna dras i stället för bakom.",
      "Stommarna är av spånskiva eller MDF, i vitt, svart, högglans eller ektoner, och några har ben i metall. Tre bänkar har luckor som stängs mjukt, och en har RGB-LED och glashylla. De flesta levereras omonterade med anvisning.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor tv passar på bänken?",
        a: "Det står i produktbeskrivningen. Den väggmonterade bänken på 180 cm tar en tv på upp till 82 tum och flera andra upp till 75 tum, och bärigheten för skivan anges för sig.",
      },
      {
        q: "Finns det tv-bänk att hänga på väggen?",
        a: "Ja, en tv-bänk på 180 cm är gjord för väggmontering och har tre nedfällbara luckor med mjukstängande gångjärn.",
      },
      {
        q: "Hur mycket bär en tv-bänk?",
        a: "Det står per modell, och skivan och hyllorna anges var för sig. Den som bär mest klarar 100 kg totalt, varav 50 kg på skivan.",
      },
    ],
  },

  tvattkorgar: {
    intro: [
      "Här hittar du tvättkorgar med lock i bambu och vide, tvättsorterare med två, tre eller fyra fack och två tvättskåp där korgarna tippas ut.",
      "I en tvättsorterare hamnar vitt, kulört och mörkt i olika fack redan när tvätten läggs i. De flesta har en påse som lyfts ur och bärs till maskinen, och på flera kan påsen tvättas.",
      "Volymen går från 64 till 144 liter. En tvättsorterare på 108 liter står på fyra hjul, två med broms, och tvättskåpen i vit MDF har tippbara korgar, det höga skåpet också lådor och hyllor.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är en tvättsorterare?",
        a: "En tvättkorg med två eller flera fack, så att vitt, kulört och mörkt sorteras redan i korgen. Här finns sorterare med två, tre och fyra fack.",
      },
      {
        q: "Kan påsen tvättas?",
        a: "Ja, på flera modeller kan innerpåsen tas ur och tvättas. Se respektive produktbeskrivning.",
      },
      {
        q: "Hur sköter jag en tvättkorg i bambu?",
        a: "Torka av den med en fuktad trasa och torka torrt, och låt inte blöta handdukar bli liggande i korgen.",
      },
    ],
  },

  "utelek-spel": {
    intro: [
      "Utelek & Spel har flyttat från Trädgård till Barn & Familj och samlar det som får barnen ut på gräsmattan: studsmattor, basketkorgar och ett flyttbart basketställ, en gungställning och flera gungor, en hoppborg med pool, ett returnät och nät för badminton och volleyboll, trampfordon och sandlådor med tak eller lekkök.",
      "Studsmattorna för barn saknar metallfjädrar, och hoppytan hänger i elastiska band eller rep. Den sexkantiga på 122 cm har en hoppyta på 93 × 81 cm, den på 140 cm hoppytan Ø108 cm och den på Ø163 cm hoppytan Ø110 cm, och alla har ett skyddsnät på 150 cm med dragkedja. De två större har också en bygel att hålla i och nät runt benen, och de är gjorda för barn 3–10 år.",
      "Basketkorgarna för väggmontering har en ryggskiva på 110 till 113 cm i bredd och en ring på Ø45 cm, och de passar både inne och ute. På basketstället ställs korghöjden mellan 156 och 210 cm, och foten fylls med vatten eller sand. Gungställningen på 280 cm har två gungor och en glidgunga för två och bär 180 kg, och fågelbogungan på Ø110 cm bär 100 kg. Hoppborgen mäter 380 × 340 cm uppblåst, har en rutschkana ner i poolen och är gjord för tre barn mellan 3 och 8 år.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken storlek på studsmatta passar?",
        a: "Den sexkantiga på 122 cm har smal ram men behöver drygt 163 cm golvyta mellan fotändarna. Den på 140 cm har hoppytan 35 cm över golvet, lågt nog för en treåring att kliva upp själv, och den på Ø163 cm har hoppytan Ø110 cm. Kontrollera ålder och maxlast i beskrivningen.",
      },
      {
        q: "Hur högt sitter basketkorgen?",
        a: "På det flyttbara basketstället ställs korghöjden mellan 156 och 210 cm, och foten tar upp till 45 kg vatten och sand. Korgarna för väggmontering sitter där du skruvar upp dem, i en vägg av betong, tegel eller massivt trä. De sticker ut 23 till 61 cm från väggen.",
      },
      {
        q: "Finns det gungor för de minsta?",
        a: "Ja, babygungan har ryggstöd, säkerhetsbälte och en främre bygel och passar barn mellan 9 och 36 månader. Repen ställs mellan 120 och 180 cm, och sitsen ska hänga minst 35 cm över marken. Barngungan med tak har plats för två barn 3–6 år.",
      },
    ],
  },

  utemobler: {
    intro: [
      "Utemöbler gör altanen, balkongen och trädgården till ett rum till. Här samlar vi loungeset och matgrupper, trädgårdsbord och trädgårdsstolar, trädgårdsbänkar i trä, metall och konstrotting, hängstolar och gungbänkar, solsängar och solstolar, hammockar och dynboxar för dynorna.",
      "De flesta möblerna tål att stå ute, men de får längre livslängd om du skyddar dem vid hårt väder och förvarar dem skyddat vintertid. Det finns skyddsöverdrag både för utemöbler och för hammock.",
      "Hängstolarna har eget stativ, och flera rymmer två personer. Kontrollera maxvikten i produktbeskrivningen, och läs också vad som följer med: till en del loungeset och solsängar ingår dynor, medan andra möbler är gjorda för att användas utan.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Kan utemöblerna stå ute hela året?",
        a: "De tål att stå ute, men de håller längre om du skyddar dem vid hårt väder och förvarar dem skyddat vintertid. Det finns skyddsöverdrag för utemöbler och för hammock.",
      },
      {
        q: "Ingår dynor?",
        a: "Det varierar. Till en del loungeset och solsängar följer dynor med, medan andra möbler har flätad sits och används som de är. Vad som ingår står i produktbeskrivningen.",
      },
      {
        q: "Var förvarar jag dynorna?",
        a: "I en dynbox. Vi har dynboxar i stål på 295 och 350 liter, och förvaringsboxar på 93 och 253 liter.",
      },
    ],
  },

  "valphagar-hundhagar": {
    intro: [
      "En valphage ger valpen en egen plats att leka och vila på, utan att den kommer åt sladdar, skor och trappor. Här samlar vi valphagar och hundhagar i metall, en hundgård med tak för utomhusbruk och hopfällbara hagar, för både inomhus och utomhus. Några passar också för katt, kanin och marsvin.",
      "Valphagarna och hundhagarna i metall är 60 till 91 cm höga och har en dörr eller en grind. Panelerna går att vinkla efter rummet, till exempel till en åttkant mitt på golvet, en rektangel längs väggen eller en rak avspärrning, och de flesta fälls ihop när hagen inte används. Hagarna på 366 och 488 cm har en grind som svänger 180 grader och stänger sig själv. Hundgården på 141 × 141 cm är 151 cm hög och har en vridbar hållare med två matskålar som fylls på utifrån.",
      "Välj höjd efter hunden, eftersom en hund som når överkanten med framtassarna tar sig över förr eller senare. Valphagen på 91 cm är gjord för hundar med en mankhöjd upp till 46 cm. Hundhagen i metall med tak har ett tak av Oxfordväv och nät som öppnas med dragkedja, och av de hopfällbara hagarna har den ena, i väv, soltak och myggnät runt om och den andra nätfönster, två dörrar och en topplucka.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur hög valphage behöver jag?",
        a: "Hagen ska vara så hög att hunden inte når överkanten med framtassarna. Valphagarna och hundhagarna i metall är 60 till 91 cm höga och hundgården med tak 151 cm, och i de flesta beskrivningar står vilken mankhöjd hagen är gjord för, till exempel upp till 46 cm för valphagen på 91 cm.",
      },
      {
        q: "Kan hagen stå utomhus?",
        a: "Ja, flera är gjorda för både inne och ute. Till dem ingår markpinnar eller markkrokar som förankrar hagen i gräsmattan, så att den varken glider eller lyfter när hunden trycker mot sidan.",
      },
      {
        q: "Passar hagen för andra djur än hund?",
        a: "Några gör det. Hundhagen i metall med tak passar också katt, kanin och marsvin, flera metallhagar fungerar för kanin och marsvin, och de hopfällbara hagarna är gjorda för både hund och katt.",
      },
    ],
  },

  varmeflaktar: {
    intro: [
      "En värmefläkt ger snabb värme där elementen inte räcker: i hallen, i ett kallt sovrum eller i hemmakontoret. Här samlar vi värmefläktar som sitter på väggen och tornmodeller som står på golvet, alla med termostat och överhettningsskydd och de flesta med timer. Här finns också ett elelement på 1500 W för vägg eller golv, som styrs med en app via wifi.",
      "Värmefläktarna ger 2000 W, och de två tornen på 73 cm ger 2200 W. Du väljer mellan flera effektlägen, till exempel 1000 eller 2000 W, och fläkten sveper fram och tillbaka så att värmen sprids i rummet. De flesta har ett värmeelement av keramik och styrs med fjärrkontroll.",
      "Flera väggmodeller har veckotimer, så att värmen går på när du behöver den, och fönstervakt som stänger av när du vädrar. Flera av tornmodellerna har vältskydd som bryter strömmen om de välter. Kapslingsklassen står i varje produktbeskrivning, och den avgör var värmefläkten får sitta.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Får värmefläkten sitta i badrummet?",
        a: "Det beror på modell och placering. Kapslingsklassen står i varje produktbeskrivning, och i badrummet finns regler för hur nära dusch och badkar en elapparat får sitta. Fråga en elektriker om du är osäker.",
      },
      {
        q: "Vad gör fönstervakten?",
        a: "Den stänger av värmen automatiskt när du vädrar, så att du inte värmer upp luften som går ut genom fönstret.",
      },
      {
        q: "Hur stort rum värmer en värmefläkt?",
        a: "Det står per modell. Väggmodellen på 50 cm anges för 20 till 25 kvadratmeter.",
      },
    ],
  },


  "vattenkokare-brodrostar": {
    intro: [
      "Här hittar du vattenkokare, brödrostar och frukostset där vattenkokaren och brödrosten har samma färg och form. Seten finns i bland annat svart, grått, gräddvitt, rosa och rostfritt, och två har bikakemönster.",
      "Alla vattenkokare rymmer 1,7 liter. Flera har temperaturval, till exempel mellan 40 och 100 °C, och flera håller vattnet varmt i upp till tre timmar. Det passar till te, som ofta ska ha lägre temperatur än kokande vatten.",
      "Brödrostarna tar två eller fyra skivor, de flesta har sju rostlägen, och ett set har också en äggkokare.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket rymmer vattenkokarna?",
        a: "Alla rymmer 1,7 liter, och på flera ska det vara minst 500 ml i kannan när den slås på.",
      },
      {
        q: "Varför välja temperaturval?",
        a: "Grönt och vitt te blir bäst under kokpunkten, medan svart te vill ha kokande vatten. Med temperaturval stannar kokaren vid den temperatur du valt.",
      },
      {
        q: "Vad ingår i ett frukostset?",
        a: "En vattenkokare och en brödrost i samma utförande. Ett set har dessutom en äggkokare.",
      },
    ],
  },

  "vaxthus-odling": {
    intro: [
      "Ett växthus ger plantorna ett skyddat ställe tidigt på våren och sent på hösten, och en odlingslåda gör det enkelt att odla även utan trädgårdsland. Här samlar vi tunnelväxthus och foliehus, väggväxthus mot husväggen, växthus i aluminium med polykarbonat, miniväxthus och drivbänkar, odlingslådor i metall, trä och plast, och blomställ, spaljéer och reservöverdrag.",
      "Tunnelväxthusen och foliehusen har en duk av PE-plast, och de flesta har rullbar dörr och nätfönster. Vid kraftig vind ska växthuset förankras, och till flera av dem ingår jordankare, spännlinor och markpinnar. Växthusen i aluminium har väggar av polykarbonat och takfönster.",
      "Odlingslådorna finns i galvaniserad metall, trä, träkomposit, plast och konstrotting, upp till 241 × 90 cm, och några har spaljé, foliekåpa eller fågelnät. Ett odlingsbord eller en upphöjd låda ger en arbetshöjd där du slipper böja dig ner till marken.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Måste tunnelväxthuset förankras?",
        a: "Ja, vid kraftig vind ska det förankras eller ställas mot en vägg. Till flera av växthusen ingår jordankare, spännlinor och markpinnar – vad som ingår står i produktbeskrivningen.",
      },
      {
        q: "Finns det reservöverdrag till växthusen?",
        a: "Ja, det finns reservöverdrag till tunnelväxthus på 6 × 3 × 2 m och 3 × 2 × 2 m, ett reservhölje och en växthusduk på 300 × 200 cm.",
      },
      {
        q: "Vad är en drivbänk?",
        a: "En låg låda med genomskinligt lock, där du drar upp plantor tidigt på våren innan de planteras ut. De flesta av våra drivbänkar är i trä med lock av polykarbonat som fälls upp.",
      },
    ],
  },

  "vedstall-vedbodar": {
    intro: [
      "Här hittar du vedställ för brasveden vid kaminen, större vedställ med vattentätt överdrag och vedförråd för trädgården. I ett vedställ ligger veden på en ram i stället för direkt på golvet eller marken, vilket skyddar den mot fukt underifrån, och flera är gjorda för både inne och ute.",
      "De flesta vedställ i svart stål bär 100 kg. De stora ställen med överdrag rymmer 0,33 eller 0,6 m³ ved och håller den torr, och det mindre av dem har en bärväska i canvas. Flera vedställ levereras med eldstadsverktyg, till exempel skyffel, eldgaffel, tång och borste på krokar längs sidan.",
      "Vedboden är av galvaniserat stål med lutande tak och upphöjd botten för luftcirkulation, och den finns 150 och 213 cm bred med 0,77 respektive 1,12 m² golvyta. Redskapsskåpet i trä med vedförråd har ett skåp för redskapen och ett vedförråd som är öppet framtill och bär 50 kg ved.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Kan vedstället stå ute?",
        a: "Flera kan det. Vedstället på 60 × 100 cm och det smala på 40 × 100 cm är gjorda för både inne och ute, och de stora ställen har ett vattentätt överdrag. Vedboden och redskapsskåpet med vedförråd har lutande tak.",
      },
      {
        q: "Hur mycket ved rymmer ett vedställ?",
        a: "De stora ställen med överdrag rymmer 0,33 och 0,6 m³ ved. För de andra står måtten och hur mycket de bär, oftast 100 kg.",
      },
      {
        q: "Ingår eldstadsverktyg?",
        a: "Till några vedställ, ja: skyffel, eldgaffel, tång och borste som hänger på krokar. Vad som ingår står i produktnamnet eller beskrivningen.",
      },
    ],
  },

  "verktyg-hemmafix": {
    intro: [
      "Här samlar vi verktyg och tillbehör för verkstaden, garaget och projekten hemma: sågbockar, arbetsbockar och verkstadsbänkar, kapsågsstativ, verktygsskåp och verktygslådor, väggfräsar, svets och en CNC-fräs, skjutdörrsbeslag, säckkärror och transportvagnar, stegar, en högtryckstvätt och en våt- och torrdammsugare, och verktyg för el och rör. Handvinscharna för båt och trailer finns här och under Bil & släp.",
      "Sågbockarna och arbetsbockarna säljs i par och bär från 100 till 580 kg per bock. Flera ställs i höjd, till exempel i sju lägen mellan 64 och 81 cm, och de flesta fälls ihop platt och ställs mot väggen. Verkstadsbänken på hjul viks ihop till 9 cm bredd, och garagehyllorna i stål har fyra eller fem hyllplan som bär upp till 272 kg vardera vid jämnt fördelad last.",
      "Väggfräsarna på 4000 och 4800 W fräser raka spår för el och rör i betong, tegel och sten, och vattenpumpen som följer med binder dammet. MIG-svetsen 4-i-1 svetsar med och utan gas, med pinne och med Lift TIG. Skjutdörrsbeslagen finns både för dörrar och för möbler, med skenor från 122 till 244 cm, och de trappklättrande säckkärrorna tar upp till 120 kg.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket bär en sågbock?",
        a: "Bärförmågan gäller per bock, från 100 kg för de lätta hopfällbara till 580 kg för de röda arbetsbockarna. Läs noga: för ett av paren gäller 200 kg för båda bockarna tillsammans. Välj med marginal om en tung skiva ska ligga över paret, och ställ bockarna i samma höjd så att arbetsstycket ligger plant.",
      },
      {
        q: "Vilket skjutdörrsbeslag passar min dörr?",
        a: "Utgå från dörrens bredd, tjocklek och vikt. Beslaget med skena på 183 eller 244 cm passar en trädörr upp till 90 cm bred och 35–45 mm tjock och bär 200 kg, medan möbelbeslaget på 200 cm är gjort för skåp och sideboards. Skruva skenan i en bärande vägg, inte i en lättvägg.",
      },
      {
        q: "Vad behöver jag för att fräsa spår för el i väggen?",
        a: "En väggfräs fräser raka spår i betong, tegel och sten utan att du behöver bila. Med upp till fem klingor ställer du spårets bredd, och på modellen med 4000 W går djupet att ställa upp till 3,5 cm. Använd vattenpumpen eller anslut en dammsugare, eftersom stendammet är fint och sprids i hela rummet.",
      },
    ],
  },
  // ── Möbler (2026-09-23) ──────────────────────────────────────────────────
  "verktygsvagnar-verktygslador": {
    intro: [
      "En verktygsvagn samlar verktygen på ett ställe och rullar dit du jobbar, i garaget, verkstaden eller förrådet. Här samlar vi verktygsvagnar med lådor, verkstadsvagnar med öppna plan, verktygsskåp på hjul och för väggen, verktygslådor att ställa på vagnen eller bänken och en låsbar låda för lastbilsflak.",
      "Vagnarna är av pulverlackerat stål och har upp till 16 lådor. I många modeller löper lådorna på kullagerskenor, och flera har inlägg i lådorna som skyddar verktygen. De flesta vagnar och skåp går att låsa, och på de flesta vagnar går två av hjulen att låsa, så att vagnen står still när du arbetar.",
      "Bärigheten står per modell och går upp till 150 kg på vagnarna. Några har en arbetsyta på toppen, en av dem utdragbar från 70 till 130 cm, och verktygsskåpen med hålplatta ger plats för det som ska hänga synligt.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Går lådorna att låsa?",
        a: "På de flesta modeller, ja. Vagnarna har nyckellås eller cylinderlås, och verktygslådorna har nyckellås eller öglor för hänglås. Vilket lås det är står i produktbeskrivningen.",
      },
      {
        q: "Hur mycket bär en verktygsvagn?",
        a: "Upp till 150 kg, beroende på modell. Maxlasten per låda och per plan är lägre och står i produktbeskrivningen.",
      },
      {
        q: "Behöver vagnen monteras?",
        a: "Ja, de flesta levereras omonterade. Skruva ihop stommen på ett plant golv och montera hjulen sist.",
      },
    ],
  },

  "vinstall-vinkylar": {
    intro: [
      "Här hittar du vinställ, vinhyllor och vinkylar: stapelbara vinställ i metall och bambu, vinställ för väggen i svart stålrör, en vinhylla med glashållare och köksmöbler med inbyggt vinställ, som ett köksskåp, en köksvagn, en köksö och ett barbord.",
      "Vinställen tar från sex flaskor på väggen till 72 flaskor i stället i bambu, som staplas i moduler och monteras på ungefär fem minuter utan verktyg. Vinhyllan på 148 cm har plats för 12 flaskor och 9 glas.",
      "Vinkylarna rymmer 12, 16, 18 eller 20 flaskor på 75 cl. Tre av dem ställs mellan 5 och 18 °C och den för 12 flaskor mellan 8 och 18 °C. Vinkylen för 12 flaskor är 26,5 cm bred, och den för 16 flaskor är 56,5 cm hög och får plats under en bänk.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken temperatur ska vin förvaras i?",
        a: "För lagring brukar en jämn temperatur runt 10 till 14 °C rekommenderas, och det viktigaste är att den inte svänger. Vinkylarna här ställs mellan 5 eller 8 och 18 °C, så samma kyl kan både lagra vin och hålla vitt vin kallt.",
      },
      {
        q: "Hur mycket el drar en vinkyl?",
        a: "Det står i beskrivningen. Vinkylarna här drar 75 till 133 kWh om året. Den för 12 flaskor har energiklass E, och de tre andra har energiklass G.",
      },
      {
        q: "Hur mycket bär ett vinställ?",
        a: "Vinstället i bambu för 16 flaskor bär 75 kg och det i metall för 16 flaskor 32 kg. I köksvagnen tar varje vinfack 3 kg, vilket räcker för en vanlig flaska.",
      },
    ],
  },

  kontorsstolar: {
    intro: [
      "Här finns kontorsstolar för hemmakontoret och arbetsplatsen: stolar med nätrygg och nackstöd, stoppade stolar i linnelook, bouclé och konstläder, chefsstolar med utdragbart fotstöd och kontorsstolar med massage och värme. För den som vill variera sittställningen finns knästolar, ritstolar med fotring för höga bänkar, rullpallar och sadelpallar.",
      "Börja med sitthöjden. Kontorsstolarna ställs med gaslyft, och spannet börjar på 40 cm på de lägre modellerna, så jämför med bordshöjden och med att fötterna når golvet. Ritstolarna går upp till 87 cm och har en fotring som flyttas i höjd, till exempel mellan 18 och 46 cm, så att fötterna har stöd vid ett ståbord.",
      "De flesta stolar bär 120 kg, och flera är byggda för 135 till 220 kg. Titta då också på sitsen: stolen som bär 220 kg har en sits på 62 × 56 cm, medan de flesta kontorsstolar ligger runt 50 × 46 cm. För den som är kortare finns en liten skrivbordsstol med nätrygg, gjord för upp till 170 cm.",
      "På stolarna med fotstöd fälls ryggen till mellan 135 och 160°, och en av dem blir då 173 cm lång. Massagestolarna har upp till sju vibrationspunkter med fjärrkontroll, och flera har värme i ländryggen. Knästolarna har framåtlutande sits och delar tyngden mellan sittbenen och smalbenen, och en av dem gungar på böjda medar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken sitthöjd behöver jag?",
        a: "Sitt med fötterna i golvet och knäna i ungefär rät vinkel, med armbågarna i höjd med skrivbordsskivan. Jämför sitthöjdens spann med ditt bord: vid ett vanligt skrivbord räcker en kontorsstol, vid ett ståbord eller en hög bänk behövs en ritstol med fotring. Ritstolarna går upp till 87 cm.",
      },
      {
        q: "Vad är skillnaden mellan vippfunktion och fällbar rygg?",
        a: "Vippfunktionen är ett fjädrande bakåtläge som du gungar i medan du sitter. En fällbar rygg låses i en vinkel, antingen steglöst eller i fasta lägen som 105°, 120° och 135°. På en del stolar går vippfunktionen och liggläget inte att använda samtidigt.",
      },
      {
        q: "Vad är skillnaden mellan en knästol och en kontorsstol?",
        a: "På en knästol lutar sitsen framåt och smalbenen vilar mot en knädyna, så att tyngden delas mellan sittbenen och smalbenen. Det ger en mer upprätt hållning, och många använder den omväxlande med en vanlig kontorsstol.",
      },
    ],
  },

  fatoljer: {
    intro: [
      "Här finns fåtöljer att luta sig bakåt, gunga eller bara sitta bra i: reclinerfåtöljer och tv-fåtöljer med fotstöd, gungstolar, vilstolar i böjd björk, golvfåtöljer, loungefåtöljer och fåtöljer med lös fotpall. Hit hör också fåtöljer med motor för uppresning och massage, och barnfåtöljer för 3–5 år.",
      "På en reclinerfåtölj fälls ryggen bakåt, ofta till 135° och på biofåtöljen med fjäderkärna ända till 160°, medan fotstödet fälls ut ur framkanten. Räkna med golvytan: tv-fåtöljen som är 96 cm djup upprätt blir 165 cm djup tillbakalutad, och ryggen behöver 30 till 80 cm fritt mot väggen beroende på modell. Många snurrar 360°, och några gungar också när ryggen står upprätt.",
      "Gungstolarna finns i manchester, chenille, teddy och linnelook, flera på medar i böjd bok, och bär 120 till 150 kg. Ställ en gungstol med minst 20 cm fritt bakom, så att medarna kan rulla. Vilstolarna har ram i böjd björk och ett fotstöd i fem lägen, och golvfåtöljen på tygklädd sockel har 37 cm sitthöjd och vrider ett helt varv.",
      "Uppresningsfåtöljerna lyfter och tippar sitsen framåt upp till 45° med en knapptryckning, så att du nästan står när du reser dig, och en av dem bär 200 kg. Massagefåtöljerna har upp till tio massagepunkter och styrs med fjärrkontroll. Fler modeller finns på sidorna Snurrfåtöljer, Öronlappsfåtöljer, Bäddfåtöljer och Massagestolar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket plats tar en reclinerfåtölj?",
        a: "Mer än den gör upprätt. Tv-fåtöljen som är 96 cm djup upprätt blir 165 cm djup med ryggen fälld och fotstödet ute, och biofåtöljen går från 86 till 161 cm. Ryggen behöver dessutom 30 till 80 cm fritt mot väggen, så mät från väggen och fram.",
      },
      {
        q: "Vad är en uppresningsfåtölj?",
        a: "En fåtölj med elmotor som lyfter och tippar sitsen framåt, så att det blir lättare att resa sig. Samma fjärrkontroll fäller ryggen bakåt till liggläge. Den passar den som är äldre eller återhämtar sig efter en skada.",
      },
      {
        q: "Kan man gunga med ryggen fälld bakåt?",
        a: "Nej, fäll upp ryggen först och gunga sedan. Med ryggen fälld ligger tyngden längre bak än gungningen är gjord för.",
      },
    ],
  },

  "soffor-baddsoffor": {
    intro: [
      "Här finns soffor för vardagsrummet och gästrummet: tvåsitssoffor för små rum, raka tresitssoffor, hörnsoffor med vändbar schäslong, modulsoffor i U-form, bäddsoffor och golvsoffor som blir säng, reclinersoffor och djupa schäslonger. Klädslarna är manchester, chenille, linnelook, sammet, sherpafleece och konstläder.",
      "Tvåsitssofforna börjar på 110 cm i bredd och passar i en etta, ett sovrum eller en hall. Tresitssofforna är upp till 260 cm breda, och modulsofforna i U-form 294 till 369 cm. Hörnsofforna har en schäslong som monteras på höger eller vänster sida, och på flera finns förvaring under schäslongen eller i ottomanen.",
      "Bäddsofforna fälls ut på olika sätt: sitsen dras fram på hjul och ryggen fälls ner, eller så viks moduler och dynor ut till en liggyta. Bäddarna går från 160 × 93 cm, som räcker för en, till 188 × 140 cm och mer, och modulsoffan på 369 cm blir en liggyta på 248 × 187 cm. Titta också på längden: en bädd på 190 cm räcker för en gäst som är 185 cm lång.",
      "En vanlig soffdyna är 15 till 20 cm tjock, men de ramlösa sofforna har sittdynor på upp till 42 cm, och flera av dem kräver ingen montering. På reclinersoffan lutas varje sits för sig, upp till 145°. Tresitssofforna bär 240 till 450 kg.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor blir bädden i en bäddsoffa?",
        a: "Det varierar, så jämför med en säng. En bädd på 160 × 93 cm är gjord för en person, medan 140 cm bredd räcker för två, som bäddsoffan med en bädd på 188 × 140 cm. Längden spelar lika stor roll, för är du längre än bädden hamnar fötterna utanför.",
      },
      {
        q: "Går schäslongen att flytta till andra sidan?",
        a: "På hörnsofforna med vändbar schäslong monteras den på höger eller vänster sida, och på flera går den att flytta senare. På hörnsoffan med lös schäslongmodul står modulen intill soffan och kan dras undan helt.",
      },
      {
        q: "Får soffan plats genom dörren?",
        a: "Mät dörröppningar, trapphus och hiss på vägen in, inte bara väggen där soffan ska stå. Flera soffor levereras i två kartonger, och den böjda soffan på 260 cm kommer komprimerad och behöver inte monteras.",
      },
    ],
  },

  "matbord-stolar": {
    intro: [
      "Här finns det som behövs runt matbordet: matbord i trä och glas, runda köksbord för två, klaffbord och utdragbara bord som växer när gästerna kommer, matstolar i 2- och 4-pack, fällstolar, matbänkar, stapelbara pallar och barstolar till köksön. Färdiga set med bord och stolar finns på sidorna Matgrupper och Barbord.",
      "Räkna med 55 till 60 cm bordskant per kuvert. De runda borden går från Ø70 cm, som är ett bord för två, till Ø120 cm för fyra. De utdragbara borden går från 120 till 200 cm, och på flera förvaras iläggsskivan under bordsskivan. Klaffborden står mot väggen när de inte används, och ett av dem är 23 cm djupt hopfällt men tar sex personer utfällt.",
      "Matstolarna har en sitthöjd på 45 till 50,5 cm och bär oftast 120 kg. Fällstolarna är 9 cm tjocka hopfällda, och matbänken i massiv furu på 150 cm har plats för tre och bär 330 kg. Barstolarna ska passa en annan höjd: en köksö ligger oftast på 90 till 92 cm, och de höj- och sänkbara barstolarna ställs med gaslyft, till exempel mellan 59 och 79 cm, så att samma stol passar både köksö och barbord.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur många får plats vid bordet?",
        a: "Räkna med 55 till 60 cm bordskant per kuvert. Ett runt bord på Ø70 cm är gjort för två, ett på Ø120 cm ger fyra gott om plats, och de utdragbara borden tar sex till åtta när de är utdragna. Ett klaffbord ger fler platser för varje klaff som fälls upp.",
      },
      {
        q: "Vilken sitthöjd ska barstolen ha?",
        a: "Mellan sitsen och bänkskivans undersida bör det vara drygt två decimeter, så en stol med 67 cm sitthöjd passar en köksö på 90 till 92 cm. Barstolen med 60,2 cm sitthöjd är gjord för bord på 89 till 99 cm, och till en bardisk på 105 till 110 cm behövs en högre stol. De höj- och sänkbara barstolarna täcker båda, till exempel från 62 till 83 cm.",
      },
      {
        q: "Säljs matstolarna styckvis?",
        a: "De flesta matstolar säljs i 2- eller 4-pack, och antalet står i produktnamnet. Priset gäller hela förpackningen.",
      },
    ],
  },

  skrivbord: {
    intro: [
      "Här finns skrivbord för hemmakontoret, läxorna och spelhörnan: elektriska höj- och sänkbara skrivbord, ståbord på hjul, fällbara skrivbord och väggskrivbord för små rum, raka skrivbord med lådor och hyllor, gamingbord med LED och eluttag och ett barnskrivbord som växer med barnet. Fler bord i L-form finns på sidan Hörnskrivbord.",
      "De elektriska skrivborden har skivor från 120 × 60 till 140 × 70 cm och går mellan 72 och 116 eller 118 cm. Panelen sparar tre eller fyra höjder, och borden bär 70 kg. Har du redan en skiva finns ett stativ med dubbelmotor för skivor som är 120 till 200 cm breda.",
      "Ståborden på hjul höjs med gaslyft utan sladd, till exempel mellan 71 och 107 cm, och på ett av dem lutar skivan upp till 90° och blir ett läsställ. De hopfällbara skrivborden viks ihop till 9,5 cm, och ett annat blir en 30 cm djup bokhylla när skivan fälls ner. Väggskrivbordet sitter som ett väggskåp på 60 × 16 cm tills du fäller ned skivan.",
      "Gamingborden har LED, eluttag och skärmhylla, och det L-formade på 165 cm bär 120 kg. För en lång rak arbetsyta finns skrivbord på 180 och 200 cm, och skrivbordet med två klaffar går från 100 till 170 cm. Barnskrivbordet höjs mellan 53 och 71 cm och har en skiva som lutar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken höjd ska ett skrivbord ha?",
        a: "Underarmarna ska vila vågrätt på skivan med axlarna avslappnade, både när du sitter och när du står. De fasta skrivborden är 71,5 till 76 cm höga, och ett elektriskt bord som går mellan 72 och 116 cm täcker både sittande och stående arbetshöjd för de flesta.",
      },
      {
        q: "Vad betyder minnesfunktion?",
        a: "Panelen sparar förinställda höjder, till exempel din sitt- och ståhöjd, så att bordet åker till rätt läge med en knapptryckning. De elektriska skrivborden sparar tre eller fyra höjder. Kollisionsskyddet stoppar rörelsen om något kommer i vägen.",
      },
      {
        q: "Får ett skrivbord plats i ett litet rum?",
        a: "Ja, välj ett fällbart skrivbord eller ett på hjul. De hopfällbara viks till 9,5 cm och ställs undan, väggskrivbordet sitter som ett väggskåp på 60 × 16 cm, och det elektriska skrivbordet på 120 × 60 cm är gjort för rum där ett fullstort bord inte får plats.",
      },
    ],
  },

  "soffbord-smabord": {
    intro: [
      "Här finns de mindre borden till vardagsrummet, hallen och sovrummet: soffbord med förvaring, lyftbar eller skjutbar skiva och LED, satsbord i glas, marmorlook och trä, runda brickbord, bord i C-form på hjul, konsolbord för hallen och sängbord att ställa på golvet eller hänga på väggen.",
      "På de lyftbara soffborden lyfts skivan med en dämpad mekanism, på flera 14 cm, så att den hamnar i bekväm höjd för laptopen eller middagen i soffan, och under skivan finns dolda fack för filtar och fjärrkontroller. På andra glider skivan isär eller ut på metallskenor. Soffborden med LED har en ljuslist i flera färger som styrs med fjärrkontroll.",
      "Satsborden är två eller tre bord där de mindre skjuts in under det största, till exempel Ø70 och Ø54 cm i glas och svart stål, eller tre bord från 34 till 45 cm i trämönster. Borden i C-form på hjul har foten på ena sidan och rullas in under soffan eller sängen, och ett av dem ställs mellan 68 och 78 cm i höjd.",
      "Konsolborden är 24 till 30 cm djupa och gjorda för hallen eller bakom soffan, och ett av dem dras ut från 48 till 240 cm och blir ett matbord för åtta. Bland sängborden finns vägghängda modeller som lämnar golvet fritt, smala sängbord på 25 cm och sängbord med eluttag och USB-C.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur fungerar ett lyftbart soffbord?",
        a: "Skivan lyfts upp och fram, på flera modeller 14 cm, så att den hamnar i bekväm höjd för dator eller middag i soffan. Soffbordet i vit högglans går från 40 till 54,5 cm med en gaslyft som bär 30 kg. Under skivan finns ett dolt förvaringsfack.",
      },
      {
        q: "Vilken höjd ska soffbordet ha?",
        a: "Ett soffbord sitter bäst ungefär i höjd med soffans sits eller något lägre. Flera av soffborden är 42 till 45 cm höga, och de lyftbara går att höja när du äter eller arbetar.",
      },
      {
        q: "Vad är ett satsbord?",
        a: "Två eller tre bord i olika storlek och höjd, där de mindre skjuts in under det största när de inte används. Ihopskjutna tar de ett bords golvyta, och isärdragna blir de extra avställningsytor vid soffan eller fåtöljerna.",
      },
    ],
  },

  "sangar-sovrum": {
    intro: [
      "Här finns det som hör sovrummet till: sängramar i furu och metall, stoppade sängramar med ställbar gavel, en sängram med lådor, en lös sänggavel, madrasser, sängbänkar och förvaringsbänkar för fotändan och extrasängar som fälls ihop när gästerna har åkt. Nattduksbord har en egen sida.",
      "Sängramarna finns för madrasser från 90 × 190 till 160 × 200 cm, och ramen ska ha exakt madrassens mått. På metallramarna är det upp till 31,6 cm fritt under sängen, så att lådor och korgar får plats, och sängramen i furu med två lådor på hjul har förvaringen inbyggd. Maxlasten går från 120 kg på sängramen i furu till 300 kg på de stoppade sängramarna.",
      "De stoppade sängramarna i 140 × 200 cm har en gavel som ställs i höjd, till exempel mellan 110 och 115 cm för madrasser som är 25 till 30 cm tjocka. Sänggaveln i grå sammet för 135 och 140 cm breda sängar ställs i tre höjder: 106, 116 och 126 cm.",
      "Sängbänkarna är 80 till 138 cm långa, och på många är sitsen ett lock med förvaring under, till exempel 65 liter i bänken i teddyfleece. Extrasängen på 80 × 200 cm har en madrass på 10 cm, bär 150 kg och rullas undan hopfälld, och gästsängen 4-i-1 blir säng, vilfåtölj, fåtölj eller pall. Madrassen på 140 × 200 cm är 20 cm hög med 4 cm gelmemoryskum överst.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Ingår madrass i sängramen?",
        a: "Nej, sängramarna säljs utan madrass, men här finns madrasser i 90 × 200 och 140 × 200 cm. Välj en madrass i exakt samma mått som ramen. Extrasängen och den hopfällbara sängen levereras med madrass.",
      },
      {
        q: "Behöver jag en resårbotten?",
        a: "Inte till ramarna med ribbor. På de stoppade sängramarna ligger madrassen direkt på 12 ribbor av plywood, och flera metallramar har ribbor i metall. Gaveln ska sitta rätt i förhållande till madrassen, och därför går den att ställa i höjd på flera modeller.",
      },
      {
        q: "Hur mycket förvaring får jag under sängen?",
        a: "Det beror på ramen. Metallramarna har upp till 31,6 cm fritt under, fururamen med spjälgavel 23 cm och de stoppade ramarna 15 cm. Sängramen i furu med lådor har två lådor på hjul som är 86 × 42 × 12,5 cm invändigt.",
      },
    ],
  },

  rumsavdelare: {
    intro: [
      "En rumsavdelare skärmar av en del av rummet utan att du behöver bygga något: en arbetshörna i vardagsrummet, en avskild sovplats i en etta eller en skärm framför det som inte ska synas. Här finns vikbara skärmväggar med tre till åtta paneler i bambuväv, flätad bambu, polypropenväv på tallram, pappersrep och tyg, och en konstgjord bambu i avlång kruka som blir en grön vägg när flera står i rad.",
      "Bredden räknas utfälld i rak linje och går från 120 till 320 cm. Panelerna är oftast 40 eller 45 cm breda, så antalet paneler avgör bredden: fyra paneler på 40 cm täcker 160 cm och åtta täcker 320 cm. Höjden är 170 till 182 cm, så sittande ser man inte över kanten.",
      "De flesta skärmar kommer färdigmonterade, och du viker bara ut dem. Flätningen och väven bryter blicken men släpper igenom ljus, och på flera är ovankanten svängd i en båge över varje panel. Skärmen i furu har vit tygfyllning bakom ett galler av smala trälister, och den i svart polyester har tre paneler på 84 cm, står på egna bågformade fötter och skruvas ihop.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Står en rumsavdelare stadigt utan att fästas?",
        a: "Ja, en vikskärm bär sig själv på formen. Utvikt i en mjuk sicksack står den stadigt, gärna med ena änden mot en vägg, men rakt utdragen har den inget stöd i sidled. Den är en avskärmning och ska inte användas för att stänga inne barn eller djur.",
      },
      {
        q: "Släpper rumsavdelaren igenom ljus?",
        a: "Ja, de flätade och vävda panelerna bryter blicken men släpper igenom ljus, så i motljus anas konturer. De skymmer insyn men mörklägger inte. Skärmen i vävt pappersrep är dessutom öppen upptill och nedtill, så att luften cirkulerar.",
      },
      {
        q: "Hur bred rumsavdelare behöver jag?",
        a: "Utgå från ytan du vill skärma av och lägg till lite, eftersom skärmen blir kortare när den står i vinkel. Fyra paneler täcker 160 till 180 cm i rak linje, och för en längre sträcka finns sex paneler på 240 cm och åtta på 320 cm. Hopfälld är skärmen i furu bara 40 cm bred.",
      },
    ],
  },

  "bil-slap": {
    intro: [
      "Här samlar vi utrustning för bilen, släpet, husbilen och motorcykeln: domkrafter och bilramper för service hemma, takräcke, takkorg och takväska för lasten på taket, handvinschar för båt och trailer, lyftar och stöd för motorcykeln, dieselvärmare för kupén, spännband, lastramper, starthjälp och däckpumpar.",
      "Garagedomkraften lyfter 2,5 ton och har en låg profil som går in under bilar med lågt markfrigång. Luftdomkraften för 3 eller 5 ton drivs med tryckluft från kompressorn, och bilramperna med inbyggd domkraft höjer hjulet från 23 till 32,5 cm. På taket bär takräcket och takkorgen 90 kg, och takväskan rymmer 425 eller 595 liter.",
      "Handvinscharna drar från 272 till 1588 kg. De största har två växlar: 8:1 när lasten är tung och 4:1 för att dra in bandet snabbt. För motorcykeln finns saxlyftar som bär 500 och 680 kg, en lyftbock, framhjulsstöd och paddockstöd. Dieselvärmarna finns på 2, 5 och 8 kW och värmer kupén utan att motorn går. Spännbanden har spärr och finns i 25 och 40 mm bredd.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur stor domkraft behöver jag?",
        a: "Domkraften lyfter bara en del av bilen, men välj ändå en som klarar bilens vikt med marginal. Garagedomkraften bär 2,5 ton och luftdomkraften 3 eller 5 ton. Ställ alltid bilen på pallbockar eller ramper innan du lägger dig under den.",
      },
      {
        q: "Vilken handvinsch passar min båt?",
        a: "Utgå från vikten på båten och trailern och lägg till marginal för rampens lutning. Vinschen på 272 kg är gjord för mindre båtar, jetski och kajaker, och för tyngre båtar finns modeller på 725 och 1588 kg. De med nylonhölje skyddar mekaniken mot salt och vatten.",
      },
      {
        q: "Vad får jag lasta på takräcket?",
        a: "Takräcket och takkorgen bär 90 kg, och takväskan bär 50 kg. Räkna med vikten på korgen eller boxen själv och fördela lasten jämnt. Kontrollera också hur mycket bilens tak får belastas, och håll lägre fart med last på taket.",
      },
    ],
  },
  bollsport: {
    intro: [
      "Här samlar vi utrustning för bollspel på gräsmattan, uppfarten och i källaren: fotbollsmål och ett studsnät, basketkorgar för vägg, basketställ och ett basketspel med två ringar, volleybollnät med stolpar, tennisbollsvagnar och ett träningsnät för baseboll.",
      "Fotbollsmålen finns från ett pop-up-mål på 150 × 110 cm, som reser sig själv ur väskan, till mål på 240 × 160 och 300 × 200 cm för villatomten. De två större har ramrör klädda i EPE-skum under ett PVC-överdrag och förankras med markpinnar. Studsnätet är dubbelsidigt, så två spelare kan träna skott och mottagning samtidigt.",
      "Basketkorgarna för vägg har en ring på Ø45 cm och en ryggplatta från 110 × 70 till 113 × 73 cm, och två av dem har en fjädrande ring som ger efter vid en dunk. Det flyttbara basketstället ställs med korghöjd mellan 156 och 210 cm, och foten fylls med vatten eller sand. För de minsta finns ett ställ 5-i-1 med höjd mellan 134 och 152 cm. Volleybollnätet ställs i tre höjder, från 2,26 m för damer till 2,44 m för herrar, och tennisbollsvagnarna rymmer från 120 till 200 bollar.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilket fotbollsmål passar i trädgården?",
        a: "Mät gräsmattan först och lämna plats bakom målet. Pop-up-målet på 150 × 110 cm är ett träningsmål som viks ihop i en väska, och målen på 240 × 160 och 300 × 200 cm passar en villatomt. Förankra målet med de medföljande markpinnarna, så att det inte välter när någon hänger i ribban.",
      },
      {
        q: "Basketkorg på väggen eller ett flyttbart ställ?",
        a: "En korg på väggen tar ingen markyta men kräver en stadig vägg av betong, tegel eller trä. Det flyttbara stället rullas dit där ni spelar, och korghöjden ställs mellan 156 och 210 cm så att barn och ungdomar når. Fyll foten med vatten eller sand, eftersom en tyngre fot gör att stället står stilla.",
      },
      {
        q: "Går volleybollnätet att ställa i rätt höjd?",
        a: "Ja, nätet har tre lägen: cirka 2,26 m för damer, 2,38 m för mixat spel och 2,44 m för herrar. Stolparna är av stål och kopplas ihop utan verktyg, och allt packas i en bärväska.",
      },
    ],
  },
  "elbilsladdning-solenergi": {
    intro: [
      "Här samlar vi det som laddar bilen och det som ger egen el: portabla elbilsladdare och en laddkabel med Typ 2-kontakt, solpaneler för husbil, båt och fritidshus, en hopfällbar solpanel för mobilen och en hybridväxelriktare för ett eget elsystem.",
      "De portabla laddarna ansluts till ett vanligt jordat vägguttag och laddar med upp till 3,7 kW. Laddströmmen ställs mellan 6 och 16 A, så att du kan anpassa den efter uttaget, och den ena har en timer på 1–12 timmar för laddning på natten. Laddkabeln har Typ 2 i båda ändar och är till för laddbox och publika laddstolpar, med upp till 22 kW trefas. Kablarna är 5 eller 7,5 m långa, och alla tre tål väder enligt IP65 eller IP66.",
      "Den stela solpanelen är gjord för 12V-batterisystem och finns från 100 till 260 W, och laddningsregulatorn beställs som egen artikel. Den hopfällbara panelen ger 20 W via USB och räcker till telefon, powerbank eller GPS. Hybridväxelriktaren på 5–12 kW samlar solcellsregulator, växelriktare och batteriladdare i en enhet för fritidshus, verkstad eller gård.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Kan jag ladda elbilen i ett vanligt vägguttag?",
        a: "Ja, med de portabla laddarna, som har stickpropp för jordat vägguttag och Typ 2-kontakt mot bilen. Sänk laddströmmen om uttaget är gammalt eller delar säkring med annat, eftersom strömmen går att ställa mellan 6 och 16 A. Laddkabeln med Typ 2 i båda ändar behöver däremot en laddbox eller en laddstolpe.",
      },
      {
        q: "Vilken solpanel passar husbilen eller båten?",
        a: "Den stela monokristallina panelen är gjord för 12V-batterisystem och finns från 100 till 260 W, med fästen och kablar. Välj effekt efter förbrukningen och ytan på taket, och beställ en PWM-laddningsregulator på 10, 20 eller 60 A som egen artikel.",
      },
      {
        q: "Kan jag sälja el med hybridväxelriktaren?",
        a: "Nej, den är fristående och kan inte mata ut överskott på elnätet. Den är gjord för att försörja ett eget elsystem och arbetar mot en batteribank på 24 eller 48 V, eller direkt på sol och nät utan batteri.",
      },
    ],
  },
  gamingstolar: {
    intro: [
      "En gamingstol har hög rygg, går att luta långt bakåt och har ett fotstöd för pauserna, så att du sitter rakt när du spelar och kan vila mellan passen. Här finns stolar i klassisk racingform i svart och rött eller rosa och vitt, och stolar med kattöron eller kaninöron. Alla snurrar och rullar på hjul, och de flesta har en nackkudde och en ländkudde som går att ta av.",
      "På de flesta fälls ryggen bakåt till 135 grader, och på flera följer armstöden med så att armarna behåller sin vinkel. Stolen i svart och rött går till 170 grader, vilket är i praktiken plant. Fotstödet fälls ned framåt på racingstolen i rosa och vitt och dras ut under sitsen på de andra, så att det inte tar plats när du sitter upp.",
      "Välj efter sitthöjd och sits. Höjden ställs mellan 44 och 55 cm över golvet, och sitsen är från 50 × 48 cm på stolen med kaninöron till 55 × 53 cm på stolen som fälls till 170 grader. Alla bär 120 kg, och de flesta är klädda i konstläder som är lätt att torka av.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur högt ska en gamingstol gå att ställa?",
        a: "Sitsen ska stå så högt att fötterna vilar plant på golvet och knäna är i ungefär rät vinkel. Stolarna här ställs mellan 44 och 55 cm. Stolarna med kattöron och kaninöron går ner till 44 cm och passar den som är kortare.",
      },
      {
        q: "Vad är skillnaden på 135 och 170 graders lutning?",
        a: "Vid 135 grader lutar du dig bakåt för en paus, vid 170 grader ligger du i praktiken ner. Stolen som fälls till 170 grader har ett fotstöd som sitter 38 cm under sitsnivån, alltså i höjd med underbenen när du lutar dig bakåt.",
      },
      {
        q: "Hur mycket bär en gamingstol?",
        a: "Alla stolar här bär 120 kg. Racingstolen i rosa och vitt väger själv 17,6 kg och stolen som fälls till 170 grader väger 22 kg. Båda levereras omonterade.",
      },
    ],
  },
  "garderober-kladstall": {
    intro: [
      "En garderob behöver inte vara inbyggd. Här finns tyggarderober och modulgarderober i plast som ger ett helt hängutrymme där det saknas en fast garderob, en öppen garderob med spegel i trä, ett låsbart klädskåp i svart metall och klädställ, en klädhängare och en väggarderob för hallen.",
      "Tyggarderoberna har ett överdrag i tyg som stängs med dragkedja och rullas upp med kardborreband när du vill ha öppet, och de flesta har en stomme av stålrör. De är från 103 till 212 cm breda och 42,5 till 45 cm djupa. De svarta och mörkgrå på hjul har två hängutrymmen och tio fack, rullar på tio hjul varav fem med broms och bär 50 kg.",
      "Modulgarderoberna byggs av plastpaneler som fogas ihop med kopplingar, så att du kan bygga en låg rad längs väggen eller en smal pelare. De är 111 cm breda och 145 eller 183 cm höga, och de två hängfacken är 105 cm höga. Klädskåpet i metall är 179 cm högt och står på ben med 15 cm fri höjd, och garderoben med spegel är bara 30 cm djup.",
      "För hallen och sovrummet finns klädställ i bambu och vit metall, två av dem på hjul och flera med skohylla, och ett klädställ med tolv krokar och paraplyställ som tar 30,5 × 30,5 cm golv. Klädställningen på hjul ställs från 95 till 170 cm i höjd och från 86 till 160 cm i bredd.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Hur mycket rymmer en tyggarderob?",
        a: "Räkna efter maxlasten, inte bara efter måtten. Tyggarderoberna med två hängutrymmen och tio fack bär 50 kg totalt, och den ljusgrå bär 45 kg, varav 15 kg på hängstången och 5 kg per hyllplan. Fördela tunga plagg så att ingen stång tar all vikt.",
      },
      {
        q: "Hur långa plagg får plats?",
        a: "Titta på det fria hängrummet under stången. Klädstället i vit metall har 133 cm fritt hängrum, och i den svarta tyggarderoben med dragkedjor är det 117 cm från stången ner till hyllan, så en lång rock eller klänning hänger fritt. Modulgarderobernas hängfack är 105 cm höga och passar bättre för skjortor och kavajer.",
      },
      {
        q: "Hur monteras en tyggarderob eller modulgarderob?",
        a: "Tyggarderoberna på hjul monteras utan verktyg med märkta delar. Modulgarderoberna fogas ihop med kopplingar, och en klubba ingår. Klädskåpet i metall och garderoben med spegel har tippskydd, så att de står säkert.",
      },
    ],
  },
  "hobby-musik": {
    intro: [
      "Här samlar vi saker för fritidsintressen: stafflier i bokträ för måleriet, en handpan och tungtrummor för den som vill spela utan noter, metalldetektorer för skattjakt, ett teleskop för nybörjare, en drönare med kamera, en provdocka och primärtyg för tuftning till den som syr och tuftar, och ett ljudkort för livesändning och podd.",
      "Stafflierna är av bokträ och går att fälla ihop. Det mindre har en låda för penslar och tuber och blir upp till 190 cm högt, och golvstaffliet ställs mellan 180 och 235 cm och tar dukar upp till 120 cm. Handpannan är 55 cm i diameter och stämd i D-moll, så att alla tonfält hör till samma skala. Tungtrummorna finns från 6 till 13 tum med 11 till 15 toner, och även där klingar tonerna rent tillsammans.",
      "Metalldetektorerna har en vattentät sökspole enligt IP68, LCD-skärm och teleskopiskt skaft, och den ena viks ihop till en väska. Teleskopet har ett objektiv på 70 mm och två okular för 16 och 40 gångers förstoring. Drönaren väger under 249 g och filmar i 4K, och provdockan ställs mellan 130 och 168 cm.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilket staffli ska jag välja?",
        a: "Utgå från dukarna du målar på. Staffliet med låda tar dukar upp till 92 cm höga och har plats för penslar och tuber, och golvstaffliet tar dukar upp till 120 cm. Båda går att ställa så att du kan måla sittande eller stående, och vinkeln går att justera.",
      },
      {
        q: "Kan man spela handpan utan att kunna noter?",
        a: "Ja. Alla tonfält ligger i samma skala, så två toner som slås samtidigt låter aldrig fel. Du slår med fingertopparna och hittar melodier genom att prova dig fram. Tungtrumman fungerar på samma sätt och kan också spelas med klubbor.",
      },
      {
        q: "Hur djupt söker metalldetektorn?",
        a: "Modellen med fem söklägen söker ner till 20 cm. Sökspolen tål blöt mark och grunt vatten, men kontrollboxen med skärmen ska hållas torr. Ställ skaftet efter din längd, mellan 48 och 130 cm på den ena modellen och mellan 70 och 139 cm på den andra.",
      },
    ],
  },
  hundgrindar: {
    intro: [
      "En hundgrind stänger av köket, hallen eller trappan så att hunden stannar där den ska, utan att du behöver stänga dörren. Här finns dörrgrindar som kläms fast eller skruvas i karmen, fristående grindar i trä, furu och metall som ställs upp var som helst, och grindar med kattlucka.",
      "Dörrgrindarna täcker öppningar från 67 till 147,5 cm med förlängningar som ingår. De flesta kläms fast mellan väggarna utan borrning och har en dörr i mitten som öppnas med en hand, och flera stänger sig själva. Dörrgrinden med skruvmontage har ingen tröskel och är gjord för att sitta överst i en trappa. Den låga grinden på 45 cm är till för små hundar som inte hoppar, så att du kan kliva över den.",
      "Tre grindar har kattlucka, så att katten går fritt medan hunden stannar. Luckan är 22,4 × 27 cm på de två självstängande grindarna, och på dörrgrinden för 75 till 85 cm har den ett fyrvägslås som bestämmer åt vilket håll katten får passera.",
      "De fristående grindarna står på stödfötter och ställs i sicksack, i vinkel eller runt ett hörn, och fälls ihop när de inte behövs. De är från 104 till 432 cm breda och 61 till 91,5 cm höga, och den på 300 cm kan vikas ihop till en hage med självstängande dörr. I de flesta beskrivningar står vilken mankhöjd grinden är gjord för.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Klämmontage eller skruvmontage?",
        a: "En klämd grind hålls på plats av trycket mot två väggar och lämnar inga hål, och den passar i en dörröppning. Överst i en trappa ska grinden skruvas fast, eftersom en skruvad grind sitter kvar även om någon lutar sig mot den. Dörrgrinden för 74,5 till 111,5 cm skruvas i karmen med medföljande beslag.",
      },
      {
        q: "Hur hög hundgrind behöver jag?",
        a: "Utgå från hundens mankhöjd, mätt från golvet till skulderbladens högsta punkt. Furugrinden på 70 cm är gjord för hundar upp till 48 cm i mankhöjd, och den fristående grinden med dörr finns i 91,5 cm för hundar under 60 cm. En hund som hoppar behöver en grind i full höjd, inte den låga på 45 cm.",
      },
      {
        q: "Hur mäter jag öppningen?",
        a: "Mät öppningen på det smalaste stället och jämför med grindens spann med och utan förlängningar. Den låga grinden täcker till exempel 67 till 73,5 cm utan förlängning och 87,5 till 93,5 cm med båda. Grindarna med dörr ger en passage på 40 till 54 cm, vilket är värt att jämföra om du ofta bär saker förbi.",
      },
    ],
  },
  "jul-hogtider": {
    intro: [
      "Jul & Högtider samlar det som hör årets fester till: konstgjorda granar, pynt och belysning för julen, figurer för halloween och det som behövs när ni ska ha kalas. Avdelningen har fyra underkategorier: Julgranar, Juldekoration, Halloweendekoration och Kalas & Fest.",
      "Under Julgranar finns konstgjorda granar i smala och breda modeller, med eller utan konstsnö, kottar och bär, granar med inbyggd LED-belysning, små granar i kruka, set med tre granar och en julgranskrage i trä som döljer foten. Juldekoration har uppblåsbara tomtar, snögubbar, pepparkaksgubbar och renar med LED för trädgården och entrén, lysande figurer, julbyar i trä, adventskalendrar med lådor, julgirlanger och julkransar.",
      "Halloweendekoration har animerade figurer som rör sig, låter och lyser, flera med rörelsesensor som startar dem när någon går förbi, hängande spöken och skelett, och uppblåsbara spökträd, pumpor och portar för trädgården. Kalas & Fest samlar partytält och pop-up-tält, runda bordsdukar, stolsöverdrag och stolband, en sockervaddsmaskin och en kylvagn på hjul.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken julgran ska jag välja?",
        a: "Utgå från takhöjden och golvytan. En smal gran tar lite plats i en hall eller ett litet vardagsrum, medan en bred gran fyller ett hörn. Vill du slippa ljusslingor finns granar med inbyggd LED-belysning, och till bordet eller entrén finns små granar i kruka.",
      },
      {
        q: "Klarar den uppblåsbara dekorationen att stå ute?",
        a: "De flesta uppblåsbara figurerna är gjorda för trädgården, och en inbyggd fläkt håller dem uppblåsta. Förankra dem med linor och markpinnar, så att de står kvar när det blåser, och ta in dem vid hård vind och när säsongen är slut.",
      },
      {
        q: "Vad är skillnaden mellan partytält och pop-up-tält?",
        a: "Ett pop-up-tält fälls upp och låser sig utan verktyg, så det står klart på några minuter. Partytälten har en stomme av rör som monteras, och de har vit duk och flera väggar med dörrar och fönster. Räkna med att gästerna ska kunna sitta vid bord när du väljer storlek.",
      },
    ],
  },
  "kyl-frys": {
    intro: [
      "Här finns små kylar och frysar för platser där ett vanligt kylskåp inte får plats eller inte behövs: ett kylskåp med frysfack, minifrysar, en dryckeskyl, en minikyl för hudvård och dryck och vinkylar med glasdörr.",
      "Kylskåpet rymmer 91 liter, varav 10 liter i frysfacket överst, och är 47,5 cm brett och 84 cm högt. Termostaten går från 0 till 10 °C, hyllplanen flyttas i höjd och bär 15 kg var, och dörren kan hängas om. Minifrysarna på 35 liter har två fack och fem temperaturlägen mellan minus 14 och minus 24 °C, och den ena har nyckellås för garaget eller kontorsköket.",
      "Dryckeskylen på 44 liter håller 4 till 18 °C och är gjord för läsk, öl och hudvård snarare än färskvaror. Minikylen på 4 liter kyler till 2 till 16 °C eller värmer till 50 till 65 °C och låter 26 dB. Vinkylarna tar 12 till 20 flaskor, har dubbelglasad dörr med UV-skydd och håller 5 till 18 °C, den smala 8 till 18 °C.",
      "Ska kylen stå i ett sovrum eller vardagsrum, titta på ljudnivån: kylskåpet och frysarna ligger på 41 dB och dryckeskylen på 35 dB. Alla utom minikylen har kompressor, och kylskåpet och frysarna frostas av för hand.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Kan jag förvara mat i dryckeskylen?",
        a: "Den passar inte för färskvaror, eftersom den håller 4 till 18 °C, alltså dryckestemperatur snarare än kylskåpstemperatur. För mat passar kylskåpet på 91 liter bättre, med en termostat mellan 0 och 10 °C.",
      },
      {
        q: "Vilken temperatur ska minifrysen stå på?",
        a: "Minus 18 °C är det vanliga läget för mat som ska förvaras länge. Frysarna har fem lägen mellan minus 14 och minus 24 °C, så du kan ställa kallare när frysen är full eller dörren öppnas ofta.",
      },
      {
        q: "Hur många flaskor får plats i en vinkyl?",
        a: "Kapaciteten räknas på standardflaskor om 750 ml. Flaskor med bredare form tar mer plats, så blandar du former får du in färre. Trådhyllorna går att ta ut, så att höga flaskor kan stå i ett fack utan hylla.",
      },
    ],
  },
  "palsvard-skotsel": {
    intro: [
      "Ett trimbord lyfter upp hunden i arbetshöjd, så att du slipper klippa och kamma på golvet eller i badkaret. Här finns hopfällbara trimbord med galge eller bygel, en trimningsarm som fästs på ett bord och ett pälsvårdsset som klipper, suger upp håret och torkar pälsen.",
      "Trimborden har en gummerad skiva som är halkfri och tål klor, och på de flesta är skivan 90 × 60 eller 107 × 60 cm, arbetshöjden 75 eller 76 cm och maxlasten 100 eller 150 kg. Galgen eller bygeln ställs mellan 20 och 100 cm över skivan och har remmar eller en trimögla som håller hunden kvar medan du klipper. Under tre av borden sitter en trådkorg eller gallerhylla för sax, kam och trimmer, och benen fälls ihop när bordet ska ställas undan.",
      "Trimningsarmen fästs med en klämma på en bordsskiva som är upp till 2,7 cm tjock, når 65 cm över bordet och är gjord för hundar upp till 20 kg. Pälsvårdssetet klipper pälsen, suger upp håret i en behållare på 1,8 liter och torkar med varmluft på 45 till 55 °C i fyra lägen på 50 dB.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vilken höjd ska ett trimbord ha?",
        a: "Skivan ska sitta så högt att du kan klippa och kamma utan att böja ryggen. De flesta trimbord här har en arbetshöjd på 75 eller 76 cm, ungefär bordshöjd. Galgen ställs sedan efter hundens storlek, mellan 20 och 100 cm över skivan.",
      },
      {
        q: "Behövs en galge eller bygel?",
        a: "För en hund som gärna kliver av mitt i klippningen, ja. Remmarna går runt halsen och midjan och håller hunden på plats utan att du behöver hålla fast den med handen. På bordet med aluminiumram går stropparna att ta bort helt när de inte behövs.",
      },
      {
        q: "Kan jag använda ett vanligt bord?",
        a: "Ja, med trimningsarmen, som fästs med en klämma på en bordsskiva upp till 2,7 cm tjock. Den passar hundar upp till 20 kg med en mankhöjd under 50 cm. För större hundar passar ett trimbord som bär 100 eller 150 kg bättre.",
      },
    ],
  },
  "smart-hem-sakerhet": {
    intro: [
      "Här finns det som håller koll på hemmet när du inte är där: trådlösa hemlarm som styrs från mobilen, övervakningskameror för inomhus och utomhus och en väderstation med en sensor som sitter ute.",
      "Båda hemlarmen har en larmpanel som kopplas upp via både WiFi och 4G, så att larmet når telefonen även när internet ligger nere. Rörelsevakter och dörr- och fönstersensorer paras ihop trådlöst utan kablar, och du larmar på och av med app, RFID-bricka eller fjärrkontroll. Det ena har en pekskärm på 4,3 tum och en inbyggd siren på 85 dB, det andra har knappsats och sabotageskydd som larmar om någon försöker bända loss panelen. Välj paket efter hur många rum och dörrar du vill täcka.",
      "Utomhuskamerorna är byggda för att sitta ute, och alla har nattseende, rörelselarm och tvåvägsljud. En har tre linser och visar tre bilder samtidigt, med WiFi eller 4G. En är nätdriven med 5 MP bild, och en laddas av en solpanel på 3 W och behöver ingen strömkabel. De två sista vrids 355 grader i sidled från appen. Inomhuskameran fungerar också som babyvakt, har 360 graders vy och skickar en notis när den känner av rörelse eller ljud.",
      "Väderstationens sensor mäter temperatur, luftfuktighet, vind, nederbörd och lufttryck och visar värdena på en färgskärm på 7 tum och i mobilen. Sensorn drivs av solcell och batteri och når skärmen på upp till 100 m.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Fungerar hemlarmet om internet ligger nere?",
        a: "Ja, båda hemlarmen kopplas upp via både WiFi och 4G. Med ett SIM-kort i panelen når larmet telefonen även när bredbandet är nere.",
      },
      {
        q: "Behöver övervakningskameran ström?",
        a: "Kameran på 5 MP är nätdriven och ansluts med den medföljande kontakten. Kameran med solpanel laddar sitt inbyggda batteri via en panel på 3 W och klarar upp till 180 dagars standby på full laddning. Sätt solpanelen där den får sol större delen av dagen.",
      },
      {
        q: "Var sparas inspelningarna?",
        a: "Inomhuskameran och två av utomhuskamerorna spelar in på ett microSD-kort eller i molnet. För de två utomhuskamerorna köps kortet separat, upp till 128 GB, och de har 7 dagars gratis molnlagring. Kameran med tre linser i 4G-utförande behöver ett eget SIM-kort.",
      },
    ],
  },
  "spel-bordsspel": {
    intro: [
      "Här samlar vi spel för hemmet och spelkvällen: elektroniska darttavlor och en darttavla i sisal, pingisbord, ett hopfällbart biljardbord, fotbollsbord, ett spelbord 3 i 1 med biljard, airhockey och fotbollsspel, ett basketspel för två och pokerset i väska.",
      "De elektroniska darttavlorna räknar poängen själva och har från 18 till 31 spel för upp till 8 spelare, en av dem för upp till 16. Modellerna med skåp eller dörrar skyddar väggen mot felkast och håller pilarna när ni inte spelar. Några drivs med nätadapter, andra med AA-batterier som inte ingår. Tavlan i sisal är Ø45,5 cm, tar pilar med stålspetsar och har en skyddsring som gör den 71,5 cm i diameter.",
      "Pingisbordet i fullstorlek är 274 × 152,5 cm och fälls ihop till 137 × 76,3 × 10 cm, och det mindre på 152 × 76 cm viks till en 12 cm tjock skiva som ryms bakom en dörr. Biljardbordet på 140 × 63 cm ställs i höjd mellan 55 och 75 cm, så att både barn och vuxna når. Fotbollsbordet har långa och korta ben och kan stå på golvet eller på ett annat bord. Pokerseten har 300, 400 eller 500 marker med kortlekar och tärningar i en väska.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Ska jag välja en elektronisk darttavla eller en i sisal?",
        a: "En elektronisk tavla räknar poängen och används med mjuka spetsar, så den passar i vardagsrummet och när barnen är med. Tavlan i sisal tar pilar med stålspetsar, och fibrerna sluter sig igen när pilen dras ut. Häng den med skyddsringen runt om, så att missade kast inte hamnar i väggen.",
      },
      {
        q: "Hur mycket plats tar ett pingisbord?",
        a: "Bordet i fullstorlek är 274 × 152,5 cm, och spelarna behöver fritt utrymme bakom kortsidorna. Det mindre bordet på 152 × 76 cm har halva måttet och passar i en lägenhet. Båda fälls ihop, och när nätet lyfts av går bordet att använda som vanligt bord.",
      },
      {
        q: "Hur många kan spela med pokersetet?",
        a: "Setet med 300 marker räcker till Texas Hold'em för upp till 8 spelare och setet med 400 marker för upp till 10. Alla tre seten har två kortlekar, fem tärningar och en dealerknapp, och markerna är Ø40 mm.",
      },
    ],
  },
  traningsklader: {
    intro: [
      "Här samlar vi träningskläder för yoga, pilates och gymmet: yogabyxor med raka eller utsvängda ben, träningsset i två delar, sport-bh med lätt stöd, träningslinnen och yogalinnen, halterneck-toppar och cykelshorts med hög midja. De flesta är sömlöst stickade i nylon, så att inga sömmar skaver i en knäböj eller ett utfall.",
      "Yogabyxorna med raka ben faller vida från höften och har en hög elastisk midja, medan de utsvängda sitter tight över låret och vidgar sig från knät. Cykelshortsen slutar mitt på låret, med en benlängd på cirka 11 cm, och har ett brett linningsband som stannar på plats. Träningsseten består av en topp och ett par flares i samma färg, så att nyansen stämmer mellan delarna.",
      "Välj stöd efter passet. Sport-bh:n och seten har lätt stöd och passar yoga och lugnare pass, och träningslinnet med inbyggd bh ersätter två plagg med ett. Halterneck-toppen och halterneck-linnet har bandet runt halsen och lämnar ryggen fri, så att inga band skär över axlarna. Storlekarna går från XS till XL, och färgerna varierar från tre till 29 per plagg.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Vad är skillnaden mellan yogabyxor med raka ben och flares?",
        a: "Yogabyxorna med raka ben hänger löst kring låret och knät och faller rakt ner från höften. Flares sitter tight över låret och vidgar sig från knät, så att benet faller över skon. Båda har hög midja och finns i storlek XS till XL.",
      },
      {
        q: "Vilken storlek ska jag välja?",
        a: "Läs storleksrådet på varje plagg. Yogabyxorna med raka ben och träningsseten med långtopp sitter normalt i storleken, medan sport-bh:n och yogalinnet är tilltagna, så där väljer du en storlek mindre. Cykelshortsen och halterneck-linnet finns i XS till L.",
      },
      {
        q: "Passar plaggen för löpning?",
        a: "Sport-bh:n och seten har lätt stöd och är gjorda för yoga, pilates, styrketräning och promenader, och träningslinnet med inbyggd bh ger lätt till mellanstarkt stöd. Ska du springa eller hoppa behöver du en sport-bh med fast stöd och breda band. Byxorna och cykelshortsen fungerar däremot till de flesta pass.",
      },
    ],
  },
  "tvatt-stad": {
    intro: [
      "Här samlar vi det som tar hand om tvätten och städningen: kompakta torktumlare, torkställ och torktorn, en ångstation och en klädångare, städvagnar, moppvagnar och mopphinkar. Här finns också maskiner för det som är svårt att få rent, som en handhållen ångtvätt, en ultraljudstvätt, en fönsterputsrobot och en sladdlös handdammsugare.",
      "Torktumlarna tar från 2,5 till 5 kg tvätt och får plats på en bänk, ovanpå tvättmaskinen eller på väggen. Tre av dem är 48 eller 49 cm breda, och effekten är 800 W på de flesta och 1000 W på den för 5 kg, som har fuktgivare som stoppar programmet när tvätten är torr. Den lilla för väggen har kapslingsklass IPX4 och tål vattenstänk i badrummet. Utan tumlare finns ett uppvärmt torkställ på 230 W som håller 45 till 55 grader, en torkställning på hjul och ett torktorn med åtta nivåer som bara är 35 cm djupt.",
      "Städvagnarna är 111 till 122 cm långa och har tre plan och en sopsäck med lock, och två av dem har hink och press. Moppvagnarna och mopphinkarna rullar på hjul och har press, med hinkar på 20, 25 och 26 liter. I moppvagnen med dubbla hinkar och i hinken med skiljevägg hålls rent och smutsigt vatten isär.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Behöver en liten torktumlare frånluft?",
        a: "Tre av torktumlarna har frånluft, och den fuktiga luften leds ut genom en medföljande slang eller anslutning som dras till ett fönster eller en ventil. Någon annan installation behövs inte, och kontakten sätts i ett vanligt uttag.",
      },
      {
        q: "Hur mycket tvätt tar en kompakt torktumlare?",
        a: "Kapaciteten räknas på blöt tvätt. Maskinen för 5 kg blött tar 3 kg torr tvätt, och den för 2,5 kg rymmer ungefär tio t-shirts eller ett set sängkläder. Fyll inte trumman helt, så torkar tvätten jämnare.",
      },
      {
        q: "Vilken städvagn ska jag välja?",
        a: "Ska du moppa stora golv, välj en vagn med hink och press, som städvagnen på 122 cm eller den på 111 cm med två hinkar på 18 liter. Städvagnen på 122 cm tål 70 kg och har en sopsäck på 70 liter. Den på 121 cm har ingen hink och är till för trasor, flaskor och skyltar.",
      },
    ],
  },
  "verktyg-fordon": {
    intro: [
      "Verktyg & Fordon samlar det som behövs i verkstaden och garaget och det som hör bilen, släpet och den egna elen till. Avdelningen har två delar i menyn: Verktyg, med Verktygsvagnar & verktygslådor och Verktyg & Hemmafix, och Fordon, med Bil & släp och Elbilsladdning & solenergi.",
      "Under Verktygsvagnar & verktygslådor finns vagnar och skåp på hjul med låsbara lådor, verkstadsvagnar med öppna plan, verktygslådor att bära och väggskåp i stål. Verktyg & Hemmafix har sågbockar och verkstadsbänkar, väggfräsar och svets, skjutdörrsbeslag, säckkärror, stegar och verktyg för el och rör.",
      "Bil & släp samlar domkrafter och bilramper, takräcke, takkorg och takväska, handvinschar för båt och trailer, lyftar och stöd för motorcykeln, dieselvärmare, spännband och starthjälp. Under Elbilsladdning & solenergi finns portabla elbilsladdare för vanligt vägguttag, en laddkabel till laddboxen, solpaneler för husbil, båt och fritidshus och en hybridväxelriktare för ett eget elsystem.",
      "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    ],
    faq: [
      {
        q: "Var hittar jag verktygslådor och förvaring för verktyg?",
        a: "Under Verktygsvagnar & verktygslådor. Där finns både vagnar med lådor och nyckellås, öppna verkstadsvagnar och bärbara lådor. Väggskåp och garagehyllor i stål finns också under Verktyg & Hemmafix.",
      },
      {
        q: "Var ligger handvinscharna?",
        a: "Handvinscharna för båt och trailer finns under Bil & släp och även under Verktyg & Hemmafix. Välj efter vikten på båten och trailern, med marginal för rampens lutning.",
      },
      {
        q: "Kan jag ladda elbilen utan laddbox?",
        a: "Ja, de portabla elbilsladdarna under Elbilsladdning & solenergi ansluts till ett vanligt jordat vägguttag. Laddkabeln med samma kontakt i båda ändar behöver däremot en laddbox eller en laddstolpe.",
      },
    ],
  },
};

/** Redaktionellt innehåll för en kategori-slug, annars undefined. */
export function categoryContent(slug: string): CategoryContent | undefined {
  return CATEGORY_CONTENT[slug];
}
