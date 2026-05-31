// Deterministic restructurer for the 7 legacy Wix Blog posts.
//
// WHY: these 7 posts live in Wix Blog. The headless renderer for Wix posts
// (app/blogg/[slug]/page.tsx) only splits flat contentText into <p> — it can
// never emit <h2>/<ul>. The codebase already supports structured posts via local
// markdown (lib/local-blog.ts renderMarkdown) and local slugs WIN over Wix
// (lib/blog.ts getPost/getPosts). So we re-publish the same 7 posts as local
// markdown overrides — restructured into headings/lists/paragraphs.
//
// SAFETY: the structure below is data, not rewriting. For each post we assert the
// concatenation of all segment texts (whitespace-normalized) is byte-identical to
// the original Wix contentText we fetched from the live site. If a single word
// were added/removed/changed the assertion throws and nothing is written.
// Pure deterministic JS — no AI calls.

import { promises as fs } from "node:fs";
import path from "node:path";

const RAW = JSON.parse(await fs.readFile(path.join(process.cwd(), "outputs", "live-posts-raw.json"), "utf8"));
const bySlug = Object.fromEntries(RAW.map((p) => [p.slug, p]));

const MONTHS = { januari:1, februari:2, mars:3, april:4, maj:5, juni:6, juli:7, augusti:8, september:9, oktober:10, november:11, december:12 };
function isoDate(eyebrow) {
  const m = eyebrow.trim().match(/^(\d{1,2})\s+([a-zåäö]+)\s+(\d{4})$/i);
  if (!m) return "";
  const d = String(m[1]).padStart(2, "0");
  const mo = String(MONTHS[m[2].toLowerCase()] || 0).padStart(2, "0");
  return `${m[3]}-${mo}-${d}`;
}

// h2/h3 = heading, p = paragraph, ul = bullet list, ol = numbered list.
const h2 = (t) => ({ k: "h2", t });
const h3 = (t) => ({ k: "h3", t });
const p  = (t) => ({ k: "p",  t });
const ul = (items) => ({ k: "ul", items });

const POSTS = {
  "valkommen-till-fyndplats": {
    category: "Nyheter",
    segs: [
      p("Hej och välkommen till Fyndplats! Vi är glada att du hittat hit. Här samlar vi noga utvalda produkter till priser som faktiskt känns som riktiga fynd – allt för att göra vardagen lite enklare, roligare och mer prisvärd för dig och din familj."),
      h2("Vad är Fyndplats?"),
      p("Fyndplats är en svensk nätbutik med ett brett sortiment under samma tak. Oavsett om du letar efter den senaste hemelektroniken, något fint till hemmet, leksaker till barnen, produkter till husdjuret eller något som piggar upp din skönhetsrutin – så hittar du det hos oss. Tanken är enkel: du ska slippa surfa runt på tio olika sidor. Allt finns på ett och samma ställe."),
      h2("Shoppa efter kategori"),
      p("Klicka dig vidare till någon av våra populäraste kategorier:"),
      ul(["Utforska Elektronik →","Utforska Hem & Inredning →","Utforska Skönhet & Hälsa →","Utforska Leksaker, Barn & Bebisar →","Utforska Husdjur →","Utforska Sport & Fritid →","…och mycket mer."]),
      p("Se hela butiken →"),
      h2("Varför handla hos Fyndplats?"),
      ul(["Trygg betalning med Klarna – få varorna först och betala sen","Låg fraktkostnad – endast 19 kr i frakt","Nöjda kunder – vi har 4,9 av 5 i betyg på Google","Brett utbud – produkter för hela familjen, samlade på ett ställe"]),
      h2("Häng med oss framöver"),
      p("Här på bloggen delar vi köptips, guider och inspiration som hjälper dig att fynda smartare. Kika gärna in våra köpguider – till exempel hur du väljer rätt leksaker till barnen. Håll utkik, och följ oss gärna på sociala medier för de senaste nyheterna och erbjudandena. Tills dess: utforska hela butiken och hitta ditt nästa fynd!"),
      h2("Fler guider från Fyndplats"),
      ul(["Leksaker till barn – så väljer du rätt →","Husdjursägarens guide för hund och katt →","Bärbar projektor till hemmabio – köpguide →"]),
    ],
  },

  "barbar-projektor-kopguide-2026": {
    category: "Köpguider",
    segs: [
      p("Drömmer du om en riktig storbildsupplevelse i vardagsrummet, men utan att lägga en förmögenhet på en jätte-TV? Då är en bärbar projektor ett smart och prisvärt alternativ. Du får en bioduk rakt på väggen, kan ta med dig den ut på altanen en ljum sommarkväll och enkelt ställa undan den när den inte används. I den här guiden går vi igenom allt du behöver veta innan du köper din första projektor – så att du väljer rätt från början."),
      h2("Varför välja en projektor istället för en TV?"),
      p("En projektor ger dig betydligt större bild för pengarna än en TV i samma prisklass. Där en stor TV snabbt blir dyr och tar plats på väggen året om, kan en projektor skapa en bild på 100 tum eller mer – och plockas fram bara när du vill mysa med film, sport eller spel. Lägg till att en bärbar modell är lätt att flytta mellan rum (eller ta med till sommarstugan) så förstår du varför allt fler väljer projektor till hemmabion."),
      h2("5 saker att tänka på när du köper en projektor"),
      h3("1. Upplösning – 720p, 1080p eller 4K?"),
      p("Upplösningen avgör hur skarp bilden blir. För hemmabruk är Full HD (1080p) en bra utgångspunkt, medan modeller med 4K-stöd kan ta emot och visa material i högre upplösning. Tänk på skillnaden mellan en projektors nativa upplösning och vilket signalmaterial den stöder – båda är värda att kolla."),
      h3("2. Ljusstyrka (ANSI-lumen)"),
      p("Ljusstyrka mäts oftast i ANSI-lumen och är kanske det viktigaste värdet av alla. Ju fler lumen, desto ljusare bild – och desto bättre fungerar projektorn även i rum som inte är helmörka. För den mysiga hemmabion på kvällen i ett mörklagt rum räcker det långt med en mer prisvänlig modell, medan dagsljus kräver betydligt mer ljusstyrka."),
      h3("3. Anslutningar – WiFi, Bluetooth och HDMI"),
      p("Kontrollera att projektorn har de anslutningar du behöver. WiFi gör det enkelt att spegla mobilen eller streama trådlöst, Bluetooth låter dig koppla en extern högtalare för bättre ljud, och HDMI behövs för spelkonsoler och TV-boxar. En modern projektor har gärna alla tre."),
      h3("4. Autokeystone och autofokus"),
      p("Inget är så irriterande som en sned eller suddig bild. Funktioner som automatisk keystone-korrigering (som rätar upp bilden) och autofokus gör installationen barnsligt enkel – du slipper pilla manuellt varje gång du flyttar projektorn."),
      h3("5. Inbyggt ljud"),
      p("Många bärbara projektorer har inbyggda högtalare som räcker fint för avslappnat tittande. Vill du ha riktig biokänsla rekommenderar vi ändå att koppla en extern högtalare via Bluetooth eller kabel."),
      h2("Bärbar eller fast projektor?"),
      p("En fast (installerad) projektor passar dig som vill ha en permanent hemmabio i ett särskilt rum. En bärbar projektor är däremot mer flexibel: lätt att flytta, lätt att ställa undan och perfekt för dig som vill kunna ta med bion till olika rum – eller utomhus. För de allra flesta hem är en bärbar modell både smidigast och mest prisvärd."),
      h2("Så skapar du bästa bioupplevelsen hemma"),
      ul([
        "Mörklägg rummet. Ju mörkare rum, desto skarpare och mer mättad bild – särskilt viktigt för prisvänliga modeller.",
        "Använd en ljus, slät yta. En vit vägg fungerar bra, men en riktig projektorduk lyfter bilden ytterligare.",
        "Tänk på avståndet. Ju längre från väggen projektorn står, desto större blir bilden. Testa dig fram till rätt storlek.",
        "Förbättra ljudet. Koppla en Bluetooth-högtalare så får du både kraftigare och rymdigare ljud.",
      ]),
      h2("Vår rekommendation"),
      p("Letar du efter en bra allround-projektor till ett vänligt pris hittar du hos oss en bärbar projektor med 4K-stöd, WiFi och 300 ANSI-lumen. Den har Bluetooth 5.0 för trådlöst ljud och automatisk keystone-korrigering som gör installationen enkel – ett prisvärt sätt att komma igång med hemmabion, allra bäst i ett mörklagt rum. Vill du jämföra fler alternativ hittar du hela vårt utbud under Elektronik."),
      h2("Vanliga frågor om projektorer"),
      h3("Behöver jag ett helt mörkt rum?"),
      p("Inte nödvändigtvis, men ju mörkare rum desto bättre bild – särskilt för modeller med lägre ljusstyrka. För kvällsmys i ett mörklagt rum får du fin bild även med en prisvänlig projektor."),
      h3("Kan jag streama Netflix och YouTube?"),
      p("Ja. Med WiFi kan du spegla din mobil eller surfplatta, och med HDMI ansluter du enkelt en TV-box eller streamingenhet."),
      h3("Vilken duk behöver jag?"),
      p("En slät, vit vägg fungerar utmärkt till att börja med. Vill du ha det lilla extra ger en dedikerad projektorduk en jämnare och skarpare bild."),
      h2("Sammanfattning"),
      p("En bärbar projektor är ett prisvärt sätt att skapa storbildskänsla hemma. Tänk på upplösning, ljusstyrka och anslutningar när du väljer, mörklägg gärna rummet för bästa resultat – så är du redo för filmkvällen. Kika in i vårt sortiment och hitta din nästa favorit hos Fyndplats!"),
    ],
  },

  "husdjursguide-hund-och-katt": {
    category: "Husdjur",
    segs: [
      p("Ett husdjur ger sällskap, rutiner och massor av glädje – men en trygg och frisk fyrbening kräver också rätt omvårdnad och rätt utrustning. Oavsett om du precis skaffat hund eller katt, eller bara vill ge ditt djur en bättre vardag, går vi här igenom det viktigaste: mat, pälsvård, klor, lek och promenader – med konkreta tips och utvalda favoriter ur vårt sortiment."),
      h2("Mat och matdags"),
      p("Hur djuret äter är nästan lika viktigt som vad det äter. Många hundar och katter sätter i sig maten alldeles för fort, vilket kan ge magbesvär och i värsta fall uppkastningar. En skål som tvingar djuret att äta långsammare löser problemet och gör samtidigt måltiden till en liten hjärngympa."),
      ul(["Långsam hundskål med roterande boll – 170,99 kr · Se produkten →"]),
      h2("Päls och pälsvård"),
      p("Regelbunden borstning håller pälsen fri från trassel, minskar lossnande hår i hemmet och ger dig en chans att upptäcka fästingar, sår eller knölar tidigt. Korthåriga djur klarar sig med någon gång i veckan, medan långhåriga ofta behöver borstas varje dag under fällningsperioder."),
      ul(["Pälsborste för Hund & Katt – Rostfri Underullsborste – 106,99 kr · Se produkten →","Pälsborttagningshandske för Husdjur – 120,99 kr · Se produkten →"]),
      h2("Klor och daglig hygien"),
      p("För långa klor är obekväma och kan påverka hur djuret går. Klipp eller fila lite i taget och undvik den känsliga delen med blodkärl (det rosa partiet på ljusa klor). En tyst, elektrisk filare gör många djur lugnare än en klippare – ljudet och vibrationen skrämmer mindre."),
      ul(["Elektrisk Klovård för Hund & Katt – Tyst Nagelfil – 187,99 kr · Se produkten →"]),
      h2("Lek och aktivering"),
      p("Ett uttråkat djur blir lätt stressat eller stökigt. Daglig aktivering är särskilt viktigt för innekatter, som annars saknar utlopp för jaktinstinkten. Variera gärna mellan leksaker djuret kan använda själv och sådant ni gör tillsammans."),
      h3("För katten"),
      ul(["Speedy Tail 2.0 – Interaktiv Kattleksak – 107,99 kr · Se produkten →","Interaktiv Kattkanon med Färgglada Bollar – 180,99 kr · Se produkten →"]),
      h3("För hunden"),
      ul(["Mjuk Anka-leksak för Hund – Plysch Tuggleksak – 183,99 kr · Se produkten →"]),
      h2("Promenad, koppel och utflykter"),
      p("Rätt utrustning gör promenaden tryggare för er båda. En väl sittande sele fördelar trycket bättre än ett halsband och skonar nacken, och reflexer är ett måste under den mörka delen av året. Glöm inte bajspåsar – och för katter eller smådjur kan en luftig bärväska göra utflykter och vetbesök betydligt lugnare."),
      ul(["Hundsele med Koppel – Bekväm Västsele – 102,99 kr · Se produkten →","Reflekterande Hundkoppel med Stötdämpning – 207,99 kr · Se produkten →","Genomskinlig Katt-ryggsäck med Ventilation – 499,99 kr · Se produkten →"]),
      h2("Tänk på hälsa och trygghet"),
      p("Utöver rätt prylar finns några saker som lägger grunden för ett långt och friskt djurliv:"),
      ul([
        "Regelbundna vetbesök. Boka kontroll minst en gång om året och håll vaccinationer aktuella.",
        "ID-märkning och registrering. Ett chippat och registrerat djur har mycket större chans att hitta hem om det kommer bort.",
        "Introducera nytt i lugn takt. Ny utrustning, sele eller bärväska – låt djuret vänja sig stegvis och koppla det till något positivt.",
        "Håll koll på vikten. Övervikt är vanligt och påverkar både leder och livslängd. Aktivering och rätt portioner gör stor skillnad.",
      ]),
      p("Observera att det här är allmänna råd – vid sjukdom, skada eller oro för djurets hälsa ska du alltid kontakta en veterinär."),
      h2("Allt för husdjuret hos Fyndplats"),
      p("Hos oss hittar du noga utvalda produkter för hund, katt och smådjur – från mat och pälsvård till lek och promenad, med leverans i hela Sverige."),
      p("Se hela vårt husdjurssortiment här →"),
      h2("Få fler tips och nyheter"),
      p("Vill du ha fler guider och våra nyheter först? Prenumerera på Fyndplats nyhetsbrev, så landar tipsen och de senaste favoriterna direkt i din inkorg."),
      h2("Vanliga frågor om husdjur"),
      h3("Hur ofta ska jag borsta min hund eller katt?"),
      p("Korthåriga djur klarar sig oftast med en gång i veckan, medan långhåriga kan behöva borstas dagligen – särskilt under fällningsperioder på våren och hösten."),
      h3("Varför ska katten aktiveras inomhus?"),
      p("Innekatter saknar naturligt utlopp för sin jaktinstinkt. Daglig lek minskar stress, övervikt och stökigt beteende, och stärker bandet mellan er."),
      h3("Sele eller halsband till hunden?"),
      p("En väl sittande sele fördelar trycket över bröstet och skonar nacken, vilket ofta är bättre särskilt för hundar som drar i kopplet eller har känslig hals."),
      h3("Levererar ni i hela Sverige?"),
      p("Ja, vi levererar i hela landet. Leveranstiden ser du på varje produkt."),
      h2("Fler guider från Fyndplats"),
      ul(["Leksaker till barn – så väljer du rätt →","Bärbar projektor till hemmabio – köpguide →","Välkommen till Fyndplats →"]),
    ],
  },

  "leksaker-till-barn-guide": {
    category: "Leksaker",
    segs: [
      p("Vi har alla varit där: den efterlängtade leksaken packas upp, leks med i tjugo minuter – och hamnar sedan längst ner i lådan. Att välja leksaker som barn faktiskt fortsätter att leka med handlar mindre om pris och mer om att matcha rätt leksak med barnets ålder, intresse och lust att utforska. I den här guiden går vi igenom hur du tänker – och tipsar om favoriter ur vårt sortiment för olika typer av lek."),
      h2("Så väljer du en leksak som faktiskt blir lekt med"),
      p("Innan du köper, tänk igenom de här sakerna. De avgör om leksaken blir en långvarig favorit eller en dammsamlare:"),
      ul([
        "Utgå från barnets intresse. Ett barn som älskar att röra på sig tröttnar snabbt på något stillasittande – och tvärtom. Matcha leksaken med personligheten, inte med vad som är populärt just nu.",
        "Välj öppen lek framför enkelriktad. Leksaker som kan användas på många sätt – bygga, skapa, hitta på – håller intresset vid liv mycket längre än de som bara gör en enda sak.",
        "Tänk hållbarhet. En tålig leksak som klarar daglig lek är nästan alltid en bättre affär än en billig som spricker första veckan.",
        "Låt leksaken växa med barnet. Det bästa köpet är ofta något som kan användas på en enklare nivå nu och en mer avancerad nivå om ett år.",
        "Balansera skärmtid. Leksaker som lockar till fysisk eller kreativ lek ger ofta mer i längden än ännu en skärm.",
      ]),
      h2("Leksaker efter typ av lek"),
      p("Ett enkelt sätt att hitta rätt är att utgå från vilken sorts lek barnet dras till. Här är våra utvalda favoriter för fyra vanliga lektyper."),
      h3("Rörelse och aktivitet"),
      p("För barn med energi att bränna. Leksaker som får igång kroppen är perfekta för regniga dagar inomhus likaväl som ute i trädgården."),
      ul(["Automatisk Dartblaster med Mjuka Skumkulor – 249,99 kr · Se produkten →","Arcade Basketbollspel för Hemmet – 499,99 kr · Se produkten →"]),
      h3("Kreativitet och skapande"),
      p("För det lilla konstnärsproffset. Skapande lek tränar finmotorik och fantasi – och håller barnet sysselsatt långa stunder."),
      ul(["16-tums LCD Ritplatta för Barn – 177,99 kr · Se produkten →","3D Stickers – Fjärilar & Blommor – 52,99 kr · Se produkten →"]),
      h3("Lärande och koncentration"),
      p("För nyfikna små som gillar att lösa saker. Pedagogiska leksaker tränar problemlösning och fokus utan att kännas som plugg."),
      ul(["Montessori Sorteringsleksak – Färgglada Pärlor – 149,99 kr · Se produkten →"]),
      h3("Fantasi och rollek"),
      p("För drömmare och berättare. Rollek bygger språk, empati och social förmåga – och är några av de roligaste stunderna i ett barns dag."),
      ul(["Barnens Bilformade Lektält – 258,99 kr · Se produkten →","StarBeat Fashion Dolls – Samlardockor – 415,99 kr · Se produkten →"]),
      h2("Tänk på ålder, kvalitet och säkerhet"),
      p("Oavsett vilken leksak du väljer är det några saker som alltid är värda att dubbelkolla – särskilt för de yngsta:"),
      ul([
        "Åldersmärkningen. Den är inte bara en rekommendation – för små barn handlar den om säkerhet, till exempel risk för små delar.",
        "CE-märkning. Visar att leksaken uppfyller EU:s säkerhetskrav. Leta efter den, särskilt på leksaker till småbarn.",
        "Material och tålighet. Robusta material håller längre och tål både lek och tvätt. Det syns ofta direkt i produktbeskrivningen.",
        "Pris i förhållande till användning. En något dyrare leksak som leks med varje dag ger mer än en billig som glöms bort – räkna på kostnaden per lektimme, inte bara prislappen.",
      ]),
      h2("Hitta leksaker för hela familjen hos Fyndplats"),
      p("Hos oss hittar du noga utvalda leksaker för alla åldrar, samlade på ett ställe och med leverans i hela Sverige. Vi väljer ut produkter vi själva skulle köpa hem – roliga, prisvärda och gjorda för att lekas med. Se hela vårt leksakssortiment här →"),
      h2("Få fler tips och nyheter"),
      p("Vill du ha fler guider och få våra nyheter först? Prenumerera på Fyndplats nyhetsbrev, så landar tipsen och de senaste favoriterna direkt i din inkorg."),
      h2("Vanliga frågor om att välja leksaker"),
      h3("Hur vet jag vilken leksak som passar barnets ålder?"),
      p("Utgå från åldersmärkningen på produkten och barnets utvecklingsnivå. Många leksaker fungerar dessutom på flera nivåer och kan användas under flera år."),
      h3("Vad menas med \"öppen\" lek?"),
      p("Öppen lek är leksaker som kan användas på många olika sätt – bygga, skapa eller hitta på egna regler. De håller intresset vid liv längre än leksaker som bara gör en enda sak."),
      h3("Hur vet jag att en leksak är säker?"),
      p("Leta efter CE-märkning och följ åldersrekommendationen. För de yngsta är det extra viktigt att undvika små delar som kan sväljas."),
      h3("Levererar ni i hela Sverige?"),
      p("Ja, vi levererar i hela landet."),
      h2("Fler guider från Fyndplats"),
      ul(["Husdjursägarens guide för hund och katt →","Bärbar projektor till hemmabio – köpguide →","Välkommen till Fyndplats →"]),
    ],
  },

  "bladlos-nackflakt-kopguide-2026": {
    category: "Köpguider",
    segs: [
      p("När termometern stiger och AC inte är ett alternativ är en bärbar nackfläkt en av de billigaste lösningarna för att hålla sig sval – både hemma, på språng och på jobbet. Den här guiden går igenom vad du behöver veta innan du köper och hur du använder den på bästa sätt."),
      h2("Vad är en nackfläkt?"),
      p("En nackfläkt är en uppladdningsbar elektrisk fläkt som hängs runt halsen, ungefär som ett par stora hörlurar. Den blåser luft uppåt mot ansikte och hals och håller dig sval utan att du behöver hålla i något. Praktisk under arbete, pendling, träning, matlagning – eller helt enkelt hemma i värmen."),
      h2("Bladlös eller traditionell – vad är skillnaden?"),
      p("Det finns två huvudtyper:"),
      ul([
        "Med synliga blad – billigast, men hår, halsdukar eller fingrar kan fastna i de roterande bladen. Tenderar att låta mer.",
        "Bladlös – modernare design med inkapslade fläktelement. Säkrare för långt hår och barn, oftast tystare och med bättre batteritid.",
      ]),
      p("För de flesta är en bladlös nackfläkt det säkrare och bekvämare valet. Skillnaden i pris är liten, men säkerhet och komfort skiljer sig märkbart."),
      h2("Tre saker att kolla innan du köper"),
      h3("1. Hastighetslägen"),
      p("Minst tre lägen är standard. Låg räcker ofta inomhus; högre används vid 25+ grader eller fysisk aktivitet. Fler lägen (5–7) ger mer kontroll men är inte avgörande."),
      h3("2. Batteritid"),
      p("Räkna med 4–8 timmar per laddning enligt tillverkarspecifikation. En full kontorsdag behöver minst 6 timmar – kontrollera specifikationen. USB-laddning, gärna USB-C, är standard idag."),
      h3("3. Vikt"),
      p("Under 300 gram upplevs sällan som besvärande. Tyngre modeller börjar belasta nacken efter en stunds användning."),
      h2("Så använder du nackfläkten rätt"),
      ul([
        "Ladda fullt innan första användningen.",
        "Justera halsbygeln så den sitter bekvämt utan att klämma.",
        "Börja på låg hastighet och öka vid behov – det förlänger drifttiden.",
        "Använd inte i regn (få modeller är vattentäta) och rengör luftintaget från damm med jämna mellanrum för bästa luftflöde.",
      ]),
      h2("Vanliga frågor"),
      h3("Får jag ha med nackfläkten på flyget?"),
      p("USB-uppladdningsbara nackfläktar är i regel tillåtna i handbagaget och kan användas under flygning. Kontrollera alltid det aktuella flygbolagets regler innan resa."),
      h3("Kan den hjälpa vid värmevallningar?"),
      p("Många användare i klimakteriet rapporterar att nackfläktar ger upplevd nytta. Det riktade luftflödet mot ansikte och hals fokuserar svalkan där värmevallningar oftast känns mest."),
      h3("Är den användbar på vintern?"),
      p("Nej. Nackfläkten blåser bara rumstempererad luft och kyler inte aktivt. På vintern fungerar däremot en USB-driven fotvärmare för motsatt effekt."),
      h2("Sammanfattning"),
      p("En bladlös nackfläkt är en av sommarens prisvärdaste investeringar. Räkna med minst tre hastigheter, 4–8 timmars batteritid och en vikt under 300 gram. Vår Bladlösa nackfläkt uppfyller de kraven. Se hela vårt sortiment av svalkande produkter hos Fyndplats – från handfläktar till kylkudde och svalkande dusch-tillbehör."),
    ],
  },

  "massagepistol-kopguide-2026": {
    category: "Köpguider",
    segs: [
      p("Massagepistolen har gått från specialistredskap för elitidrottare till en vanlig vardagsprodukt på några år. Men hur väljer man rätt modell? Behöver man verkligen lägga 5 000 kronor, eller räcker en på under 1 000? Den här guiden går igenom vad som faktiskt spelar roll – och vad som mest är marknadsföring."),
      h2("Vad gör en massagepistol?"),
      p("En massagepistol arbetar med perkussionsmassage – snabba mekaniska slag mot muskeln, vanligen 2 000–3 200 slag per minut. Tekniken används bland annat av fysioterapeuter och syftar till att öka blodcirkulationen, mjuka upp spänd muskulatur och minska upplevd ömhet efter träning. Effekten varierar mellan individer; vid kronisk smärta bör en fysioterapeut konsulteras."),
      h2("Fyra saker som faktiskt spelar roll"),
      h3("1. Slagfrekvens (RPM)"),
      p("Bra modeller har minst tre hastighetslägen, gärna 5–30. Vår Massagepistol med LED-skärm har upp till 30 lägen, vilket täcker allt från uppvärmning till djupare återhämtning."),
      h3("2. Amplitud"),
      p("Amplituden är hur långt slaghuvudet rör sig per slag, vanligen 8–16 mm. Större amplitud ger djupare massage. 10–14 mm är en bra balans för hemmabruk."),
      h3("3. Ljudnivå"),
      p("Moderna borstlösa motorer ligger enligt tillverkarna i regel under 50 dB – ungefär som ett normalt samtal. Viktigt om du vill kunna se på TV samtidigt eller använda den på kvällen."),
      h3("4. Batteritid"),
      p("Räkna med minst 4 timmars drifttid per laddning. USB-C är dagens standard."),
      h2("Vad du kan strunta i"),
      ul([
        "Bluetooth-appar – trevligt att ha men påverkar inte själva massagekvaliteten.",
        "Trycksensorer – sitter främst på modeller över 3 000 kronor.",
        "12+ massagehuvuden – de flesta använder regelbundet 3–4 stycken. Sex bra huvuden är bättre än tolv av sämre kvalitet.",
      ]),
      h2("Så använder du den säkert"),
      p("Vanliga misstag är att massera för hårt och för länge på samma ställe. Grundregler:"),
      ul([
        "1–2 minuter per muskelgrupp, inte längre.",
        "Rör pistolen långsamt över muskeln, håll den inte stilla.",
        "Undvik leder, ben, halspulsåder och nedre delen av ländryggen.",
        "Börja på låg frekvens och öka först när du är van.",
      ]),
      p("Vid graviditet, blodförtunnande läkemedel eller känd skada – konsultera vårdpersonal innan användning."),
      h2("Vanliga frågor"),
      h3("Hjälper massagepistolen vid ryggont?"),
      p("Vid muskulärt orsakat ryggont och spänningar är pistolen ett bra hjälpmedel. Använd U-huvudet längs ryggmusklerna, inte direkt på ryggraden. Vid kronisk eller långvarig smärta – konsultera fysioterapeut innan användning."),
      h3("Hur ofta kan jag använda den?"),
      p("Daglig användning är OK för de flesta så länge du varierar muskelgrupp och håller dig till 1–2 minuter per område."),
      h3("Kan jag använda den före och efter träning?"),
      p("Ja. Före träning används den ofta som kort uppvärmning (cirka 30 sekunder per muskelgrupp) på låg frekvens. Efter träning kan du köra en längre och lugnare massage för återhämtning."),
      h2("Sammanfattning"),
      p("En kvalitetsmassagepistol med 5+ hastigheter, borstlös motor och cirka sex massagehuvuden täcker den absoluta majoriteten av hemmabehoven. Se vår Massagepistol med LED-skärm och resten av vårt sortiment inom hälsa och välmående."),
    ],
  },

  "stjarnprojektor-kopguide-2026": {
    category: "Köpguider",
    segs: [
      p("En stjärnprojektor förvandlar ett vanligt rum till en stjärnhimmel på sekunder. Det är en av de mest uppskattade nattlamporna i svenska barnrum just nu – men marknaden är full av modeller med stora skillnader i kvalitet. Den här guiden går igenom vad som faktiskt spelar roll innan du köper."),
      h2("Två typer av stjärnprojektor"),
      p("Det finns två huvudtyper på den svenska marknaden:"),
      ul([
        "Laserprojektor – enklare modeller som projicerar enfärgade ljuspunkter (oftast gröna). Ofta billigast, men ger en mer monoton upplevelse.",
        "Astronaut- och nebulosa-projektor – kombinerar stjärnpunkter med färgade ljuseffekter (grön, blå och röd nebulosa). Ger en mer atmosfärisk helhet och är den vanligaste varianten i barnrum idag.",
      ]),
      p("För barnrum rekommenderar vi nebulosa-modellen. Vår Astronaut Stjärnprojektor är ett klassiskt val i det här segmentet."),
      h2("Fyra saker att kolla innan du köper"),
      h3("1. Storlek på rummet"),
      p("De flesta stjärnprojektorer är optimerade för rum upp till cirka 20–25 m². I större rum blir effekten svagare längre bort från projektorn. För större ytor – vardagsrum, hobbyrum – behövs en kraftfullare modell."),
      h3("2. Fjärrkontroll och timer"),
      p("En fjärrkontroll med timer (vanligen 1, 2 eller 4 timmar) är nästan ett krav i ett barnrum. Annars behöver du gå upp för att stänga av lampan eller byta färg."),
      h3("3. Strömkälla"),
      p("USB-laddning gör projektorn portabel – praktiskt vid övernattningar eller resor. Modeller med inbyggt batteri (4–6 timmars drifttid) är att föredra framför de som kräver konstant USB-anslutning."),
      h3("4. Färgalternativ"),
      p("Minst tre nebulosa-färger (grön, blå och röd) som kan kombineras ger flexibilitet och längre intresse över tid."),
      h2("Så får du bäst upplevelse"),
      ul([
        "Mörklägg rummet. Projektionen kräver mörker för full effekt.",
        "Placera projektorn på en hylla eller byrå, gärna i ett hörn så ljuset når både tak och två väggar.",
        "Vrid projektor-hjälmen så att stjärnorna projiceras på taket och nebulosan på väggarna.",
        "Lägg på lugn musik eller sömnljud i bakgrunden – effekten upplevs då tydligt starkare.",
        "Använd timer-funktionen så projektorn stänger av efter att barnet somnat (sparar batteri och förlänger livslängden).",
      ]),
      h2("Andra nattlampor för barnrummet"),
      p("Astronauten är ett populärt val, men det finns fler alternativ:"),
      ul([
        "3D Kristallkula Nattlampa – en mer subtil lampa med graverad galax i en glaskula, fungerar bra på nattduksbordet.",
        "Solnedgångslampa – projektion av solnedgång i flera färger, populär i tonårsrum och vardagsrum.",
        "Trådlös LED-sensorlampa – nattlampa med rörelsesensor, praktisk för vägen till badrummet.",
      ]),
      h2("Vanliga frågor"),
      h3("Fungerar projektionen i ett ljust rum?"),
      p("Nej. Rummet behöver vara nästan helt mörklagt för att stjärnpunkterna ska synas tydligt."),
      h3("Kan projektionen störa sömnen?"),
      p("Mjuk färgad belysning på låg intensitet är sällan ett problem och upplevs ofta som rogivande. Använd timern för att stänga av efter att barnet somnat."),
      h3("Fungerar den i ett tonårsrum?"),
      p("Ja. Projektorn används flitigt även av äldre barn och vuxna för stämningsbelysning vid läsning, gaming eller avkoppling."),
      h3("Är den lämplig som present?"),
      p("Stjärnprojektorer är en av de mer populära presentkategorierna hos oss – till barnkalas, julklappar och högtider."),
      h3("Hur länge håller en LED-stjärnprojektor?"),
      p("Själva LED-elementet är enligt tillverkarna specat för 20 000–50 000 timmars drifttid. I praktiken är det oftast batteriet (efter cirka 2–3 år) eller fjärrkontrollens knappar som slits ut först."),
      h2("Sammanfattning"),
      p("En stjärnprojektor är ett enkelt sätt att skapa atmosfär i ett rum. För barnrum är fjärrkontroll, timer, USB-laddning och minst tre nebulosa-färger de viktigaste funktionerna att ha med. Se vår Astronaut Stjärnprojektor och resten av vårt sortiment inom nattlampor och stämningsbelysning."),
    ],
  },
};

const norm = (s) => s.replace(/\s+/g, " ").trim();
function segText(seg) {
  if (seg.k === "ul" || seg.k === "ol") return seg.items.join(" ");
  return seg.t;
}
function segToMd(seg) {
  if (seg.k === "h2") return `## ${seg.t}`;
  if (seg.k === "h3") return `### ${seg.t}`;
  if (seg.k === "ul") return seg.items.map((i) => `- ${i}`).join("\n");
  if (seg.k === "ol") return seg.items.map((i, n) => `${n + 1}. ${i}`).join("\n");
  return seg.t;
}
function metaDescription(lede, firstPara) {
  const l = (lede || "").trim();
  if (l && !/\.\.\.$|…$/.test(l) && l.length <= 200) return l;
  // derive: first paragraph cut to a sentence boundary <= 160 chars
  const fp = firstPara.trim();
  if (fp.length <= 160) return fp;
  const cut = fp.slice(0, 160);
  const lastDot = cut.lastIndexOf(". ");
  return (lastDot > 60 ? cut.slice(0, lastDot + 1) : cut.slice(0, cut.lastIndexOf(" "))).trim();
}

const DST = path.join(process.cwd(), "content", "blog");
const built = [];
let failures = 0;

for (const [slug, def] of Object.entries(POSTS)) {
  const raw = bySlug[slug];
  if (!raw) { console.error(`! ${slug}: no raw data`); failures++; continue; }
  const source = norm(raw.paragraphs.join(" "));
  const recon = norm(def.segs.map(segText).join(" "));
  if (source !== recon) {
    failures++;
    console.error(`\n✗ ${slug}: RECONSTRUCTION MISMATCH (no file will be written)`);
    // find first divergence
    let i = 0;
    while (i < source.length && i < recon.length && source[i] === recon[i]) i++;
    console.error(`  first diff at char ${i}:`);
    console.error(`    source: ...${source.slice(Math.max(0, i - 40), i + 60)}...`);
    console.error(`    recon : ...${recon.slice(Math.max(0, i - 40), i + 60)}...`);
    continue;
  }
  const date = isoDate(raw.eyebrow);
  const firstPara = def.segs.find((s) => s.k === "p")?.t || "";
  const md = metaDescription(raw.lede, firstPara);
  const fm = [
    "---",
    `title: "${raw.title.replace(/"/g, "'")}"`,
    `slug: ${slug}`,
    md ? `meta_description: "${md.replace(/"/g, "'")}"` : null,
    `category: ${def.category}`,
    `publish_date: ${date}`,
    raw.cover ? `cover: ${raw.cover}` : null,
    `alt: "${raw.title.replace(/"/g, "'")}"`,
    "---",
  ].filter(Boolean).join("\n");

  const body = def.segs.map(segToMd).join("\n\n");
  const out = `${fm}\n\n# ${raw.title}\n\n${body}\n`;
  const h2count = def.segs.filter((s) => s.k === "h2").length;
  built.push({ slug, out, h2count, chars: source.length });
  console.log(`✓ ${slug}: verified verbatim | h2=${h2count} | date=${date} | ${source.length} chars`);
}

if (failures > 0) {
  console.error(`\nABORT: ${failures} post(s) failed verification — nothing written.`);
  process.exit(1);
}

for (const b of built) {
  await fs.writeFile(path.join(DST, `${b.slug}.md`), b.out, "utf8");
  console.log(`  wrote content/blog/${b.slug}.md (h2=${b.h2count})`);
}
console.log(`\nDone — ${built.length} posts restructured & written.`);
