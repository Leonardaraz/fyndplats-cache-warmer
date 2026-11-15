// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Djupare google_product_category per vara (lib/feed/djupare-kategori.ts).
// Titlarna är riktiga varunamn ur Pinterest-flödet 2026-11-15, och de
// förväntade id:na är lästa ur Googles taxonomifil samma dag.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DJUPARE_KATEGORIER, djupareKategori } from "./djupare-kategori.ts";

describe("djupareKategori: varans namn väljer en djupare nod", () => {
  const fall: [string, string, number | undefined][] = [
    // Fåtöljer: rätt sorts stol, annars fåtölj.
    ["fatoljer", "Gungstol i chenille med medar i bok – 53 cm bred sits, bär 120 kg - Brun", 2002],
    ["fatoljer", "Gungstol med fotpall i fleece – öronlappsrygg, nackkudde och medar i bok - Beige", 2002],
    ["fatoljer", "Massagestol mörkgrå med USB – tvåpunktsmassage och fotstöd", 2919],
    ["fatoljer", "Golvfåtölj som fälls ut till 203 cm lång bädd – rygg i sex lägen, bär 120 kg - Grå", 500051],
    // Massagepunkterna står efter tankstrecket: det är en uppresningsfåtölj.
    ["fatoljer", "Uppresningsfåtölj i grå frotté – elektrisk lyft 60° och åtta massagepunkter", 6499],
    ["kontorsstolar", "Kontorsstol i mesh – justerbart nackstöd, svankstöd och gungfunktion, beige", 2045],
    // Matbord & stolar: barstol före stol, stol före bord.
    ["matbord-stolar", "Barstol på hjul med ryggstöd – beige konstläder, sitthöjd 72–95 cm", 1463],
    ["matbord-stolar", "Klaffbord på hjul med två hyllor – 133,4 × 80 cm, plats för fyra personer - Svart", 4355],
    ["matbord-stolar", "Runt matbord Ø80 cm med ekfärgad skiva och svarta korsade stålben – 75 cm högt", 4355],
    // Utemöbler: en grupp är en grupp, även när stolar och bord nämns.
    ["utemobler", "Bistroset i PE-rotting med två stolar och glasbord – stol 55 × 58 × 76 cm - Grå och ljusgrå", 6367],
    ["utemobler", "Balkongset 3 delar – två repstolar och bord Ø 50 cm", 6367],
    ["utemobler", "Soffbord för balkong och uteplats i svart stål med spjälad skiva", 2684],
    ["utemobler", "Bistrobord Ø60 cm med mosaikskiva i keramik och metallstativ – 71 cm högt", 2684],
    ["utemobler", "Tvåsitssoffa i konstrattan med nedfällbara armstöd – 129 cm - Grå", 4513],
    // Paviljong med myggnät är en paviljong; reservtaket är ett tillbehör.
    ["solskydd-paviljonger", "Paviljong 3 × 3 m med dubbeltak och myggnät - Mörkgrå", 716],
    ["solskydd-paviljonger", "Reservtak till paviljong 3 × 3 m med dubbeltak", 6105],
    // Träning: kläderna behåller sin kategori, aerobicsteppern är ingen trappmaskin.
    ["traning-gym", "Sömlösa leggings med låg ribbad midja – ankellånga i elva färger - Druva Lila / M", undefined],
    ["traning-gym", "Aerobicstepper 80 × 31 cm med tre höjder – bär 150 kg - Rosa", 237166],
    ["traning-gym", "Benpress med justerbart ryggstöd och förvaring för viktskivor – bär 455 kg", 3542],
    ["traning-gym", "Sissy squat-bänk 3-i-1 – justerbar magträningsbräda för squats och armhävningar - Svart", 499795],
    // Leksaker.
    ["leksaker-spel", "Elbil Audi e-tron Sportback för barn 3–5 år – 12 V, fjärrkontroll och musik - Röd", 2753],
    ["leksaker-spel", "Svängbil för barn 2–6 år – wigglebil med 16 melodier, ljus och dragrep, khaki", 2724],
    ["leksaker-spel", "Verktygsbänk för barn i trä med 15 verktyg, klocka och hylla – 88 cm", 3751],
    ["leksaker-spel", "Lasertag 4 spelare med USB-laddning – pistoler och västar", undefined],
    // Studsmatta med nät är en studsmatta; kantskyddet är ett tillbehör.
    ["utelek-spel", "Studsmatta 305 cm med skyddsnät och stege", 1738],
    ["utelek-spel", "Kantskydd till studsmatta 305 cm", 5524],
    ["klostrad", "Klöstunna 70 cm med tre hålor i spiral och liggyta överst - Ljusgrå", 4997],
    ["vaxthus-odling", "Tunnelväxthus 5,95 × 3 m – 17,9 m² med åtta nätfönster", 693],
    ["vaxthus-odling", "Låg odlingstunnel med nätfönster – 45 cm hög, i två längder - Grön / 200 cm", 693],
    // Förvaring: krokarna i smyckeskrinet gör det inte till en krokhängare.
    ["forvaring-organisering", "Smyckeskrin med spegel – 4 plan, 2 lådor och 8 krokar, vitt", undefined],
    ["forvaring-organisering", "Förvaringsbänk 112 cm i manchester med 84 liter - Beige", 6851],
    ["forvaring-organisering", "Rund förvaringspall i gräddvit manchester med lock som blir bricka – Ø56 cm", 458],
    ["forvaring-organisering", "Tyggarderob med dragkedjor – hängstänger på 40 cm och sex sidofickor - 212 cm", 4063],
    ["forvaring-organisering", "Mediahylla för DVD, CD & böcker – torn, skåp & bredhylla i flera färger - Smalt torn 16 fack – mörkbrun", 6358],
    // Belysning: taklampan är ingen lampa på golvet.
    ["belysning", "Taklampa i rotting med tre skärmar – 60 cm", 2524],
    ["belysning", "Golvlampa med tre hyllor och fotbrytare - Svart", 4636],
    // Handverktyg: en nyckelsats är nycklar, en gängsats är gängverktyg.
    ["handverktyg", "Spärrnyckelsats 8 delar, flexibelt huvud, metrisk 8 till 17 mm, rullficka", 1632],
    ["handverktyg", "F-klämmor med låsbar stång, 91,4 cm öppning, 4-pack eller 2-pack, blå - 2-pack", 2835],
    ["handverktyg", "Gängsats 80 delar, gängtappar och gängsnitt, metrisk och SAE, två väskor", 1184],
    ["selar-koppel-transport", "Hundvagn med fyra hjul och nätfönster – hopfällbar, för små hundar - Blå", 6276],

    // ── Fel som granskningen av träffarna hittade (2026-11-15) ──────────────
    // Ett ord längre bak i namnet får inte styra: "i tre delar" är en grupp,
    // fotpallen gör inte fåtöljen till en pall, parasollhålet gör inte bordet
    // till ett parasoll.
    ["utemobler", "Trädgårdsset i tre delar – två staplingsbara rottingstolar med dynor och bord", 6367],
    ["utemobler", "Äggformad trädgårdsfåtölj i PE-rotting med fotpall – 76 × 65 × 147 cm", 6828],
    ["utemobler", "Matbord för uteplatsen i stål med parasollhål, 1500 × 960 mm, svart", 2684],
    ["utemobler", "Hängstol med stativ och nackstöd – 120 kg, hopfällbar korg, ljusgrå", 7197],
    ["utemobler", "Utedagbädd 178 cm med soltak – fyra delar som blir soffa, bord och pallar", 6892],
    ["utemobler", "Hammocköverdrag i oxfordtyg – blixtlås, snörlås och två storlekar - Mörkgrå / 205 cm", 6964],
    // Dynor är dynor, inte stolen eller solsängen de ligger på.
    ["utemobler", "Sittdynor för stolar i fyrapack – 39,5 × 39,5 × 10 cm med knytband och halkskydd", 4453],
    ["utemobler", "Dyna till solsäng med nackkudde – grå, 198 × 53 × 5 cm", 4453],
    ["dekoration-prydnad", "Klockuppdragare för en automatisk klocka, med fem rotationslägen och LED-ljus", undefined],
    ["badrum-hemtextil", "Handdukshållare med två stänger 110 cm – fristående i svart metall", 586],
    ["badrum-hemtextil", "Stegformad badrumshylla i bambu med tre handdukspinnar och tvättkorg 48 L", 465],
    ["badrum-hemtextil", "Ergonomisk nackkudde i minnesskum med axelurtag", 2700],
    // Bandet som följer med gör inte vibrationsplattan till ett träningsband.
    ["traning-gym", "Vibrationsplatta med 120 hastigheter, träningsband, svart", 8066],
    ["traning-gym", "Hopfällbar pilatesreformer i gummiträ, 2430 × 655 × 730 mm, med hoppbräda", 3810],
    ["traning-gym", "Armhävningsbräda i trä med handtag och gummiband – även balansbräda", 8215],
    ["traning-gym", "Viktskivestativ med hjul för viktskivor på 50 mm, 450 kg, svart", 8083],
    ["traning-gym", "Boxsäckshållare för vägg med chinsstång – svart stål, bär 130 kg", 7129],
    ["friluftsliv-resa", "Campingkök med två förvaringsskåp och avtagbar vindskärm, 176 × 45 × 70 cm", 1014],
    // "tång" mitt i ett ord är ingen tång: mätstång, lyfttång, fyrkantsstänger.
    ["handverktyg", "Lasthöjdsmätstång i glasfiber med bärväska, två längder - 4,5 m", 1305],
    ["handverktyg", "Stocklyfttång med fyra klor och roterande lyftögla, 900 kg dynamisk last", undefined],
    ["handverktyg", "Manuell bockare för massiva rund- och fyrkantsstänger, 7 matriser", 1667],
    ["handverktyg", "Tångset med sju tänger för hem, bil och rörarbete", 1958],
    ["handverktyg", "Rörtång 24 tum i aluminium med justermutter, käftöppning 105 mm", 1632],
    ["handverktyg", "Lageravdragarsats för blindhål med glidhammare, 16 delar, 6 till 59 mm", undefined],
    ["handverktyg", "Hylsnyckelsats 1/2 tum, 33 delar, SAE och metrisk, spärrnyckel och förlängning", 1195],
    ["handverktyg", "Rörskärare 3 delar, 3/16 till 2 tum, med minirörskärare och gradningsverktyg", 2080],
    ["verktyg-hemmafix", "Ledstång för trappa med 2–3 steg – justerbar vinkel 0–45°, tål 50 kg", 499949],
    // Madrassen som följer med sängen gör den inte till en madrass.
    ["sangar-sovrum", "Extrasäng i två storlekar med 10 cm madrass – hopfällbar på hjul, bär 150 kg - 90 × 200 cm", 505764],
    ["sangar-sovrum", "Sängram 140 × 200 cm i beige sammet med ställbar, kanalstickad sänggavel", 505764],
    ["sangar-sovrum", "Hopfällbar madrass 90 × 200 cm, 15 cm tjock – gelmemoryskum och sidficka", 2696],
    ["sangar-sovrum", "Hopfällbart madrasstöd i plywood, 195 × 148 cm, med nylonband", 2720],
    ["sangar-sovrum", "Översängsbord i svart med justerbar längd och höjd och fyra hjul med bromsar", undefined],
    // Stativ, fodral, väskor och bänkar är tillbehör, inte instrumentet.
    ["hobby-musik", "Pianobänk i vitt med förvaringsfack – 76 × 36 × 50 cm, sits i konstläder", 505328],
    ["hobby-musik", "Hopfällbart gitarrstativ med tre ben och justerbar höjd, 900 till 1200 mm", 3646],
    ["hobby-musik", "Hårt gitarrfodral med lås, plyschfoder och tillbehörsfack, 1050 × 370 × 110 mm", 3882],
    ["hobby-musik", "Väska med hjul för elektroniskt trumset, 600D, med sex avtagbara avdelare", 7100],
    ["hobby-musik", "Cajon i björk med gitarrsträngar och justerbar axelrem, åttkantig", 7297],
    ["hobby-musik", "Klassisk gitarr för nybörjare, 960 mm, med nylonsträngar, gigbag och stämapparat", 80],
    ["hobby-musik", "Trumset för vuxna, 5 delar med 22 tums bastrumma, pall, pedal och cymbaler - Svart", 2518],
    ["tradgardsskotsel-bevattning", "Tryckspruta i rostfritt stål på 6 liter med sprutstav, slang och axelrem", 1967],
    ["tradgardsskotsel-bevattning", "Snöskyffel 45 cm med extra handtag – D-grepp, metallkant och aluminiumskaft", 5363],
    ["tradgardsskotsel-bevattning", "Batteridriven häcksax 51 cm – 20 V med batteri och laddare", 3120],
    ["spel-bordsspel", "Spelbord 5-i-1: biljard, bordtennis, bågskytte, hockey och basket", 7010],
    ["spel-bordsspel", "Hopfällbar bordsfotboll med 22 spelare för 2–4 personer – 118 × 107,5 × 78 cm", 3847],
    // En rebounder är ingen fotboll, och returnätet gör inte målet till en rebounder.
    ["bollsport", "Rebounder för fotboll – justerbar vinkel, hopfällbar stålram och allvädersnät - Röd", undefined],
    ["bollsport", "Fotbollsmål med returnät, 242 × 184 cm, vitt järnrör och polyesternät", 1113],
    ["bollsport", "Bollretur för basketkorg med 360° rotation, justerbara remmar och krokar", 499751],
    ["bollsport", "Volleybollträningsnät för serve och spike, justerbar höjd och vinkel", 499787],
    ["solskydd-paviljonger", "Viktplattor till parasoll – fyra plattor, 89 × 89 × 10,5 cm, fylls med sand", 6751],
    ["solskydd-paviljonger", "Myggnät till parasoll Ø 300 cm – 230 cm långt, med blixtlås", 6751],
    ["solskydd-paviljonger", "Parasoll Ø 265 cm med lutning och vev – himmelsblått med 15 cm volang", 719],
    ["solskydd-paviljonger", "Pergolamarkis 2,85 × 2 m – veckad reservduk, mörkgrå, utan stomme", 6105],
    // Tillbehör till maskinen är inte maskinen.
    ["verkstadsmaskiner", "Svarvchuck med fyra käftar, 96 mm, för träsvarv, med fem käftsatser och adapter", undefined],
    ["verkstadsmaskiner", "Spännhylssats ER40, 23 hylsor, 1/8–1 tum, för fräsmaskin och borrpress", undefined],
    ["elverktyg", "Plåtnibbler för borrmaskin med dubbla huvuden, 1,6 mm stål, stegborr", 1454],
    ["lek-tillbehor-for-husdjur", "Katthjul med klösmatta och broms – löphjul på 91 cm för katter under 5 kg - Grå", 5001],
    ["lek-tillbehor-for-husdjur", "Kattunnel i trä och trådnät med fyra dörrar, 200 cm", 4997],
    ["lek-tillbehor-for-husdjur", "Kattunnel i plysch, hopfällbar 3-i-1 med tvättbar kudde", 5001],
    ["bil-slap", "Verktygslåda för släpvagn i aluminium, 990 × 419 × 305 mm, med lås, tål 50 kg", 8378],
    ["barnmobler", "Barnnattduksbord i vitt med molnhandtag och förvaringsfack – 34 × 31 × 25 cm", 462],
    ["barnmobler", "Barnsittgrupp med två hopfällbara stolar, bord och parasoll i djungelmönster", 6349],
    ["baby-smabarn", "Mjukt klätterset med trappa, rutschkana och pall för barn 1–3 år - Vit och grå", 3172],
    ["lyft-transport", "Viltlyft i stativ med handvinsch och krok, tål 226,8 kg, höjd 2750 mm", 503768],
    // Skumklossar med tunnel är skumklossar; hoppborgen med rutschkana är en hoppborg.
    ["leksaker-spel", "Skumklossar 5 delar med tunnel – bågar som passar i varandra, ramp och trappa - Sand och turkos", 3172],
    ["leksaker-spel", "Mjuka byggklossar i skumgummi, sex delar – klätterset för barn från 1 år", 3172],
    ["leksaker-spel", "Klätterset i trä med prinsesskronor – triangel, båge och ramp, 18–48 månader", undefined],
    ["baby-smabarn", "Klätterset 4-i-1 i furu – båge, ramp med två sidor och dyna, 18–48 månader", undefined],
    ["leksaker-spel", "8-i-1-hoppborg med rutschkana, pool och klättervägg – 350 × 325 × 210 cm", 6396],
    ["leksaker-spel", "Kundvagn för barn i metall, rosa – med babydocka, korg och hylla", 8295],
    ["leksaker-spel", "Gåvagn i trä med aktivitetspanel – xylofon, formsortering, från 18 månader", 1241],
    ["bollsport", "Returnät för fotboll med justerbar vinkel och höjd – 123 × 73 × 178,5 cm", undefined],
    ["forvaring-organisering", "Utdragbar låda under skrivbordet i svart stål, tre storlekar - 84 cm", 503766],
    ["forvaring-organisering", "Paraplyställ med droppbricka i vitt – smalt 14 cm, fyra krokar", 5494],
    ["spel-bordsspel", "Biljardbord och pingisbord 2 i 1, 140 × 63 cm, höjdjusterbart och hopfällbart", 7010],
    ["verktyg-hemmafix", "Kabelskalare för borrmaskin och handvev – 6 hål, 3–17 mm", undefined],
    // Odlingslådan med spaljé eller växthusduk är en odlingslåda.
    ["vaxthus-odling", "Odlingslåda på hjul med spaljé för klätterväxter – 40 × 40 × 185 cm", 721],
    ["vaxthus-odling", "Odlingslåda med växthusduk och fyra spaljéer – 53 × 53 × 90 cm, stål", 721],
    ["vaxthus-odling", "Spaljé i A-form 180 cm med klätternät", 499894],
    ["utemobler", "Hängsoffa 2-sits i konstrotting – kedjor och dynor, stativ ingår inte", 718],

    // ── Standardnoden får inte ta det som inte hör dit (förhandsbygget 2026-11-15) ──
    // I Skrivbord ligger också skärmstöd, bordsskivor och arkivskåp.
    ["skrivbord", "Monitorställ i transparent akryl – 53 cm bred, med plats för tangentbordet under", 5489],
    ["skrivbord", "Datorbord med monitorställ och fyra hyllor, brunt trädekor och svart ram", 4191],
    ["skrivbord", "Elektrisk höj- och sänkbar skrivbordsram, 70 till 117 cm, tre minnesplatser", 503766],
    ["skrivbord", "Vit bordsskiva i spånskiva med runda hörn, 1397 × 711 × 25 mm", 6910],
    ["skrivbord", "Arkivskåp på hjul med två lådor och centrallås – hängmappar A4, 90 × 40 cm", 5938],
    ["skrivbord", "Ritbord med lutbar skiva 90 × 60 cm – höjd 70–90 cm i fem steg, svart", 2242],
    ["skrivbord", "Racingstativ för ratt & pedaler – hopfällbart, justerbart", undefined],
    ["skrivbord", "Hörnskrivbord 170 cm med tre lådor – svart", 4191],
    // I Pallar ligger pianopallar, sminkpallar och en trappall.
    ["pallar", "Pianopall i svart högglans, höjdjusterbar 45–56 cm", 505328],
    ["pallar", "Pall till sminkbord i ljusgrå sammet – Ø35 cm, på hjul, sitthöjd 49–61 cm", 4241],
    ["pallar", "Förvaringspall i sammetslook med lock som blir bricka – Ø 44 cm, bär 150 kg", 458],
    ["pallar", "Pall för barn med tre steg och handtag – ställs om till två steg, 2–5 år", 635],
    ["pallar", "Salongspall med fotring – sitthöjd 50–64 cm, bär 110 kg", 1463],
    ["hundburar", "Hundgård för utomhusbruk med tak, 2 × 2 m eller 2,3 × 2,3 m", 7274],
    ["soffbord-smabord", "Nattduksbord på hjul, tre hyllor – vitt med grå betonglook, 35 × 29,5 × 65,5 cm", 462],
    ["sandlador", "Vattenbord för barn med fiskespel och 9 tillbehör", 6464],
    ["sandlador", "Sensoriskt aktivitetsbord i trä för barn med 3 lådor och vändbar skiva", 6351],
    ["sandlador", "Sandlåda med lekkök och sandtratt – 154 × 80 cm, diskho", 2743],
    ["utelek-spel", "Driftkart för barn med musik och ljus – 3–8 km/h, 8–12 år", 2753],
    ["utelek-spel", "Trampgokart för barn i ljusblått med handbroms – 97 × 66 × 59 cm", 2724],
    ["utelek-spel", "Barntrampolin med justerbart handtag för två barn, hopfällbar, 1435 × 970 mm", 1738],
    ["utelek-spel", "Gungsits för barn i EVA, 2-pack – med belagda kedjor och karbinhakar", 6270],
    ["utelek-spel", "Mudkök för barn i trä – utomhus lekkök med 2 diskhoar och spishäll", 543622],
    // En häst på hjul gungar inte.
    ["gunghastar-gungdjur", "Åkhäst i plysch på hjul – för barn 3–5 år, bär 25 kg", 2724],
    ["gunghastar-gungdjur", "Gunghäst med ljud – handtag, stigbyglar och medar i trä, 12–36 mån", 3441],
    ["massage-aterhamtning", "Massagefåtölj i svart konstläder – åtta punkter och ländvärme", 1442],
    ["massage-aterhamtning", "Benmassager med luftkompression och värme – hela benet, 3 program och 3 styrkor", 543596],
    // Pälsvård för får och kor är inte husdjursvård.
    ["palsvard-skotsel", "Klippbord för får och getter med nosögla, höjdjusterbart, 130 × 59 cm", undefined],
    ["palsvard-skotsel", "Trimbord för hund, hopfällbart med galge, blått", 6383],
    ["rumsavdelare", "Skrivbordsavdelare med tre gröna paneler, 152 cm lång, med klämfästen", 6909],
    ["redskapsbodar-forrad", "Garage för robotgräsklippare i granträ med tak av takpapp – 75 × 76 × 70 cm", 4566],
    ["redskapsbodar-forrad", "Förvaringsbänk för uteplatsen i granträ, två sittplatser, bär 319,8 kg", 7310],
    // Kattsängar är kattsängar, i Katthus och i Hundbäddar.
    ["katthus", "Rund kattbädd med klämma för skrivbord – avtagbar och tvättbar", 4433],
    ["katthus", "Husdjurstrappa med kattgrotta och förvaring i ljusgrått tyg – 40,5 cm hög", 6973],
    ["katthus", "Modulär kattbur i svart stål med 3 nivåer, 71,1 × 35,5 × 104,1 cm", 5087],
    ["katthus", "Kattgård utomhus 191 cm – hus, rastgård och tre plattformar", 4997],
    ["hundbaddar-hundsoffor", "Kattbädd med kattöron 50 cm – öppen korg, avtagbar kudde", 4433],
    ["hundbaddar-hundsoffor", "Husdjurssoffa 70 cm i krämvitt – plysch och massiv fururam", 4434],
    // Utfodring för grisar och får är lantbruk.
    ["mat-vattenskalar", "Grisutfodringsautomat i galvaniserat stål med en foderlucka, för 5 grisar", 6990],
    ["mat-vattenskalar", "Fodertråg i galvaniserat stål, 74 liter, för 10 får eller getter", 6990],
    ["mat-vattenskalar", "Foderbehållare för torrfoder – vikbar, 25 liter, med lås och fuktfack", 5162],
    ["mat-vattenskalar", "Kattbrunn i keramik – 2,2 liter, fyrstegsfilter och tyst pump", 6252],

    // ── Varor som stod kvar grunda trots regler i kategorin ─────────────────
    ["utemobler", "Hollywoodgunga för tre med justerbart soltak och stålram – 198 × 118 × 168 cm", 718],
    ["utemobler", "3-i-1 hängmattestativ, hopfällbart, svart/silver", 6737],
    ["utemobler", "Tikiparasoll med halmtak, lutbart 30 grader, diameter 1981 mm", 719],
    ["utemobler", "Pallkuddar 120 × 80 × 12 cm – sitsdyna och ryggdyna i polyester med knappar - Ljusgrå", 4453],
    ["traning-gym", "Knäböjsställ med justerbar höjd och bredd och två J-krokar för hemmagymmet", 3542],
    ["traning-gym", "Väggmonterad pull up-stång i stål med två djupinställningar", 8215],
    ["traning-gym", "Gymgolv av 24 pusselplattor, 61 × 61 cm, 14 mm tjocka, två färger - Blå prickar", 4669],
    ["traning-gym", "Smart hula hoop med viktkula och räknare – 16 delar för midjor 76–113 cm - Ljusblå och vit", 3215],
    ["traning-gym", "Boxningsmaskin med musik och Bluetooth – för väggen, handskar ingår", 499720],
    ["leksaker-spel", "Krypmatta för baby, hopfällbar och dubbelsidig med dinosaurier och trafik - 200 × 180 cm", 1243],
    ["leksaker-spel", "Hjullastare att sitta på 78 cm – skopa fram och tippskydd", 2724],
    ["leksaker-spel", "Käpphäst enhörning i rosa plysch med hovslag och gnägg – 95 cm med hjul", 6407],
    ["leksaker-spel", "Fotbollsspel för barn i trä – 18 spelare, 6 stänger och manuell räknare", 3847],
    ["verktyg-hemmafix", "Garagedomkraft 2 ton – lyfthöjd 12–30 cm, för låga bilar, med överlastventil", 503771],
    ["verktyg-hemmafix", "Handvinsch för båt och trailer – 1588 kg med 2 växlar", 503772],
    ["verktyg-hemmafix", "Hopfällbar sackkärra i aluminium – bär 70 kg och väger 3 kg", 126],
    ["verktyg-hemmafix", "Bordsben i svart stål, 4 st – 73 cm höga med justerbara fötter, bär 200 kg", 6911],
    ["forvaring-organisering", "Hopfällbara förvaringslådor med lock, 3-pack, 45 liter per låda", 5631],
    ["friluftsliv-resa", "Kylbox 70 liter på hjul – håller kylan i 72 timmar", 1017],
    ["friluftsliv-resa", "Kajakställ för två kajaker eller SUP-brädor – fristående, bär 80 kg", 8172],
    ["vaxthus-odling", "Odlingslådor 2-pack, runda Ø 60 × 30 cm – galvaniserat stål med öppen botten", 721],
    ["vaxthus-odling", "Växttrappa i stål, fyra nivåer, 162 cm", 6428],
    ["vaxthus-odling", "Minidrivhus i trä 90 × 52 cm med uppfällbart lock på stötta - Natur", 693],
    ["matbord-stolar", "Sittpallar 4-pack stapelbara – rund sits, bär 120 kg - Gräddvit", 1463],
    ["hobby-musik", "Tenorsaxofon i mässing, stämd i B, 23 tangenter, med bärväska och tillbehör", 91],
    ["hobby-musik", "Xylofon med 37 toner, trätangenter och höjdjusterbart X-stativ", 7431],
    ["hobby-musik", "Violinfodral 4/4 i vattentät nylon med axelremmar och stråkhållare", 503039],
    ["hobby-musik", "Violin 4/4 i full storlek med fodral, stråke och stämapparat", 86],
    ["hobby-musik", "Lågvolymcymbaler i rostfritt stål, 4 delar: 14, 16, 18 och 20 tum, med väska", 3043],
    ["hobby-musik", "Teleskop 70 mm för nybörjare — två okular, ställbart stativ och väska", 165],
  ];
  for (const [slug, titel, id] of fall) {
    it(`${slug}: ${titel.slice(0, 60)}`, () => {
      assert.equal(djupareKategori(slug, titel), id);
    });
  }

  it("en underkategori utan regler, eller ingen alls, ger inget", () => {
    assert.equal(djupareKategori("okand-kategori", "Gungstol i ek"), undefined);
    assert.equal(djupareKategori(undefined, "Gungstol i ek"), undefined);
    // Objektets egna egenskaper räknas inte som underkategorier.
    assert.equal(djupareKategori("constructor", "Gungstol i ek"), undefined);
    assert.equal(djupareKategori("toString", "Gungstol i ek"), undefined);
  });

  it("underkategorins standardnod gäller också utan namn", () => {
    assert.equal(djupareKategori("klostrad", ""), 4997);
    assert.equal(djupareKategori("fatoljer", undefined), 6499);
  });
});

describe("DJUPARE_KATEGORIER: reglerna går att lita på", () => {
  it("en standardnod (utan ord) står sist i sin lista", () => {
    for (const [slug, regler] of Object.entries(DJUPARE_KATEGORIER)) {
      regler.forEach((r, i) => {
        if (r.ord === null) assert.equal(i, regler.length - 1, `${slug}: standardnoden står inte sist`);
      });
    }
  });

  it("samma id har alltid samma namn i taxonomin", () => {
    const namn = new Map<number, string>();
    for (const [slug, regler] of Object.entries(DJUPARE_KATEGORIER)) {
      for (const r of regler) {
        if (r.id === null) continue;
        const forut = namn.get(r.id);
        if (forut) assert.equal(r.namn, forut, `${slug}: id ${r.id}`);
        else namn.set(r.id, r.namn);
      }
    }
  });

  it("varje nod är minst tre nivåer djup, utom de få löv som är grundare", () => {
    // Googles taxonomi har inget djupare under de här: Sofas, Futons,
    // Ottomans, Room Dividers och Outdoor Play Equipment.
    const grundaLov = new Set([460, 450, 458, 4163, 1249]);
    for (const [slug, regler] of Object.entries(DJUPARE_KATEGORIER)) {
      for (const r of regler) {
        if (r.id === null) continue;
        const djup = r.namn.split(" > ").length;
        if (!grundaLov.has(r.id)) assert.ok(djup >= 3, `${slug}: ${r.id} ${r.namn} har ${djup} nivåer`);
      }
    }
  });
});
