// lib/seo/programmatic-templates.ts
//
// Slot-fyllnads- och variations-motorn för det programmatiska SEO-ramverket
// (Pattern 1–3). INGA AI-anrop: ren mall + dina egna produkter/kategorier.
//
// Varför seedad variation? Två mål drar åt olika håll:
//   1. SEO: varje sida måste ha UNIK H1/meta/brödtext (annars thin/duplicate
//      content-straff).
//   2. Stabilitet: samma URL måste alltid ge samma text (annars ser Google en
//      sida som ändras varje crawl → tappar förtroende, ISR-cachen spricker).
// Lösningen: deterministisk hash av sluggen väljer variant ur 5–8 alternativ per
// slot. Samma slug → samma variant för alltid; olika slugs → spridning. Resultatet
// vävs ihop med RIKTIG data (produktnamn, prisspann, antal) så ingen sida blir en
// ren kopia av en annan.
//
// VARFÖR SÅ MÅNGA VARIANTER PER SLOT? En tidigare audit mätte 3-gram-överlapp
// INOM varje mönster: 32 % för /for-dig-som, 20–26 % för /basta-i-test, 18–24 %
// för /under-kr. Roten var att FAQ-SVAREN var EN enda fast sträng (bara FRÅGE-
// urvalet varierade) och att intro-slottarna bara hade 3–4 varianter. Med 5–8
// varianter per slot OCH seedade FAQ-svar (frakt/retur/leverans/pris) faller
// 3-gram-överlappen under 20 %, mätt i scripts/verify-slot-variation.ts.

// FNV-1a-liknande sträng-hash → stabilt heltal. Räcker gott för variantval.
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministiskt val ur en lista. `salt` gör att olika slots på SAMMA sida kan
// välja oberoende av varandra.
//
// VARFÖR EN HASH OCH INTE `(seed + salt*K) % len`? Med linjär salt kolliderar
// TVÅ slugs vars seed är kongruenta mod arr.length på SAMTLIGA slots av samma
// längd samtidigt — och eftersom de flesta varListor är 5–6 långa fick ~1/6 av
// alla sidpar identisk brödtext (mätt: max 3-gram-överlapp 94 %). Genom att i
// stället blanda (seed, salt) icke-linjärt (en liten avalanche-mix) blir varje
// slots index oberoende av övriga, så kongruenta seeds inte längre rör sig i lås.
// Fortfarande 100 % deterministiskt: samma (arr, seed, salt) → samma val.
export function pick<T>(arr: T[], seed: number, salt = 0): T {
  if (arr.length === 0) throw new Error("pick(): empty array");
  let h = (seed ^ Math.imul(salt + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0x297a2d39) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return arr[h % arr.length];
}

export function countWords(text: string): number {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

const YEAR = 2026;

// Versalisera första bokstaven (för rubriker som börjar med en slot).
function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Seedat variantval för META-TITLAR med längdbudget. Layouten suffixar varje
// titel med " | Fyndplats" (12 tecken) och Google kapar vid ~60 → titeldelen
// får max ~48 tecken. Varianterna slot-fylls med kategori-/typnamn av okänd
// längd, så en enskild variant kan svälla förbi budgeten ("Billig
// lek-tillbehör för husdjur under 1000 kr – smarta fynd" → kapad SERP-titel).
// Väljer därför seedat BLAND varianterna som ryms; ryms ingen tas den kortaste
// (hellre en kort kapning än en lång). Fortfarande deterministiskt per slug.
function pickTitle(v: string[], seed: number, salt: number, max = 48): string {
  const fits = v.filter((t) => t.length <= max);
  if (fits.length > 0) return pick(fits, seed, salt);
  return v.reduce((a, b) => (b.length < a.length ? b : a));
}

// ─────────────────────────────────────────────────────────────────────────
// Återanvändbara FAQ-svarsbanker (frakt/leverans + retur)
// ─────────────────────────────────────────────────────────────────────────
// Leverans och retur återkommer i BÅDE Pattern 1 och 3. Varje svar finns i 6
// varianter med olika ordval OCH meningsbyggnad, så att två sidor sällan delar
// samma 3-gram. Fakta hålls konstant: 3–7 arbetsdagar, spårning via mejl,
// frakt 19 kr (fri över 499 kr), 30 dagars öppet köp, oanvänd + originalför-
// packning, info@fyndplats.com. Anroparen ger en unik `salt` så svaret rör sig
// oberoende av övriga slots på sidan.

function deliveryAnswer(singular: string, seed: number, salt: number): string {
  const noun = singular ? `din ${singular}` : "ditt paket";
  const v = [
    `Normal leveranstid är 3–7 arbetsdagar, och du får alltid en spårningskod via mejl när ${noun} skickas. Frakten är 19 kr inom Sverige — eller helt fri vid köp över 499 kr.`,
    `Räkna med 3–7 arbetsdagar innan ${noun} är framme. Så fort paketet lämnar lagret mejlar vi en spårningslänk. Fri frakt gäller från 499 kr, annars en symbolisk peng på 19 kr.`,
    `De flesta paket är hos dig inom 3–7 arbetsdagar. Du följer leveransen hela vägen via spårningskoden vi skickar på mejl. Under 499 kr kostar frakten 19 kr; över den gränsen bjuder vi på den.`,
    `Leveransen tar vanligtvis 3–7 arbetsdagar. Spårning ingår alltid — koden landar i din inkorg när ordern packas. Frakt 19 kr, men gratis så fort du handlar för minst 499 kr.`,
    `Förvänta dig ${noun} inom 3–7 arbetsdagar. Vi skickar en spårningskod via e-post så du vet exakt var paketet är. Fraktavgiften är 19 kr och försvinner helt vid köp över 499 kr.`,
    `Vanlig leveranstid ligger på 3–7 arbetsdagar och varje order spåras — länken kommer på mejl vid avsändning. Handlar du för över 499 kr är frakten gratis, annars tillkommer 19 kr.`,
  ];
  return pick(v, seed, salt);
}

function returnAnswer(seed: number, salt: number): string {
  const v = [
    `Ja, du har 30 dagars öppet köp hos Fyndplats. Så länge produkten är oanvänd och i originalförpackning är det enkelt — mejla info@fyndplats.com med ditt ordernummer så hjälper vi dig vidare.`,
    `Absolut. Ångrar du köpet gäller 30 dagars öppet köp. Skicka bara ett mejl till info@fyndplats.com med ordernumret, så löser vi returen. Varan ska vara oanvänd och ligga kvar i originalförpackningen.`,
    `Självklart. Du kan returnera inom 30 dagar förutsatt att produkten är oanvänd och i sin originalförpackning. Hör av dig till info@fyndplats.com och uppge ditt ordernummer så ordnar vi resten.`,
    `Det går bra — 30 dagars öppet köp gäller på allt. Mejla info@fyndplats.com med ordernumret och se till att varan är oanvänd och i originalförpackningen, så tar vi hand om returen.`,
    `Ja. Passar något inte har du 30 dagar på dig att ångra köpet. Kontakta oss på info@fyndplats.com med ordernumret; produkten behöver bara vara oanvänd och kvar i originalförpackningen.`,
    `Returer är inga problem inom 30 dagar. Skicka ordernumret till info@fyndplats.com så guidar vi dig — kravet är att produkten är oanvänd och i originalförpackning.`,
  ];
  return pick(v, seed, salt);
}

// ─────────────────────────────────────────────────────────────────────────
// Pattern 1 — /basta-i-test/{type}
// ─────────────────────────────────────────────────────────────────────────

export function bestInTestH1(label: string, seed: number): string {
  const v = [
    `Bäst i test: ${label} ${YEAR} — vi har testat och jämfört`,
    `${cap(label)} ${YEAR}: bäst i test enligt oss`,
    `Bäst i test ${label} ${YEAR} — vår stora jämförelse`,
    `Vi har jämfört ${label} — här är bäst i test ${YEAR}`,
    `${cap(label)}: bäst i test och mest prisvärt ${YEAR}`,
    `Bäst i test ${label} ${YEAR} — våra favoriter rankade`,
    `${cap(label)} i test ${YEAR}: så valde vi vinnarna`,
  ];
  return pick(v, seed);
}

export function bestInTestMetaTitle(label: string, seed: number): string {
  const v = [
    `Bäst i test: ${label} ${YEAR}`,
    `${cap(label)} – bäst i test ${YEAR}`,
    `Bäst i test ${label} ${YEAR} – jämförelse`,
    `${cap(label)} ${YEAR}: vår topplista`,
  ];
  return pickTitle(v, seed, 7);
}

export function bestInTestMetaDesc(label: string, count: number, priceRange: string, seed: number): string {
  const v = [
    `Vi har jämfört ${count} ${label} till bra pris. Se vår topplista med betyg, pris (${priceRange}) och köpguide — hitta bäst i test ${YEAR} hos Fyndplats.`,
    `Bäst i test ${label} ${YEAR}: ${count} noga utvalda fynd jämförda sida vid sida. Pris från ${priceRange}, fri frakt över 499 kr. Hitta ditt val hos Fyndplats.`,
    `Letar du efter ${label}? Vår jämförelse av ${count} modeller (${priceRange}) hjälper dig välja rätt. Bäst i test, mest prisvärt och budgetval — allt samlat.`,
    `${count} ${label} testade och rankade ${YEAR}. Pris ${priceRange}, betyg och köpguide i ett — plus fri frakt över 499 kr. Se topplistan hos Fyndplats.`,
    // Plural ("Vilka X är bäst…") — den gamla naiva singulariseringen
    // (label.replace(/r$/,"")) gav trasig svenska ("massagepistole").
    `Vilka ${label.toLowerCase()} är bäst i test ${YEAR}? Vi jämför ${count} favoriter (${priceRange}) med betyg och tips. Allt samlat hos Fyndplats.`,
  ];
  return pick(v, seed, 11);
}

// Intro 200–300 ord (tre stycken, slot-fyllda + riktig data).
export function bestInTestIntro(p: {
  label: string;
  audience: string;
  painpoint: string;
  usp: string;
  count: number;
  priceRange: string;
  topName: string;
  seed: number;
}): string[] {
  const { label, audience, painpoint, usp, count, priceRange, topName, seed } = p;
  const open = [
    `Att välja rätt ${label} är inte alltid lätt — utbudet är stort och prisskillnaderna ännu större.`,
    `Det finns gott om ${label} där ute, men långt ifrån alla håller vad de lovar.`,
    `Ska du köpa ${label} men vet inte var du ska börja? Du är inte ensam.`,
    `Marknaden för ${label} svämmar över av alternativ, och det är svårt att veta vad som faktiskt är värt pengarna.`,
    `Med så många ${label} att välja mellan är det lätt att gå vilse — vi har gjort grovjobbet åt dig.`,
    `Vad skiljer egentligen bra ${label} från medelmåttiga? Det är sällan uppenbart vid första anblicken.`,
    `Letar du efter ${label} som faktiskt levererar? Då har du hamnat helt rätt.`,
  ];
  const mid = [
    `Därför har vi gått igenom vårt sortiment och plockat ut ${count} ${label} som vi själva skulle välja — alla noga utvalda för ${audience}.`,
    `Vi har jämfört ${count} ${label} sida vid sida, med fokus på det som faktiskt spelar roll för ${audience}.`,
    `I den här guiden jämför vi ${count} ${label} ur vårt sortiment, handplockade för ${audience}.`,
    `Vi har vägt ${count} ${label} mot varandra och valt ut dem som passar ${audience} bäst.`,
    `För att spara dig tid har vi kokat ner sortimentet till ${count} ${label} vi rekommenderar för ${audience}.`,
    `Resultatet är ${count} ${label} vi står bakom — alla utvalda med ${audience} i åtanke.`,
  ];
  const pain = [
    `Vi vet att ${painpoint} är en vanlig huvudvärk — och våra val är gjorda för att lösa just det.`,
    `Det handlar i grunden om ${painpoint}, och varje produkt här är vald med det i åtanke.`,
    `Gemensamt för våra favoriter: de tar tag i ${painpoint} på ett smart sätt.`,
    `Den röda tråden är ${painpoint} — det är problemet varje val på listan adresserar.`,
    `Oavsett modell är tanken densamma: att råda bot på ${painpoint} utan krångel.`,
    `Vad de har gemensamt? De gör något åt ${painpoint}, vilket är hela anledningen att de är med.`,
  ];
  const close = [
    `Längst ner hittar du en jämförelsetabell med pris (från ${priceRange}) och våra omdömen, följt av en närmare titt på varje favorit. Vårt toppval just nu: ${topName}. Allt med ${usp}.`,
    `I tabellen nedan ser du pris (${priceRange}) och betyg i en överblick, och längre ner går vi igenom varje produkt. Vi gillar ${topName} extra mycket — och allt levereras med ${usp}.`,
    `Scrolla vidare för vår jämförelsetabell (priser från ${priceRange}) och detaljerade omdömen. ${topName} sticker ut i toppen. Bakom varje val ligger samma löfte: ${usp}.`,
    `Nedan jämför vi allt sida vid sida (${priceRange}) och går sedan på djupet, produkt för produkt. ${topName} är vår nuvarande etta, och ${usp} följer med på köpet.`,
    `Börja med jämförelsetabellen (från ${priceRange}) för snabb överblick, fortsätt sedan till de utförliga omdömena. Just nu pekar vi på ${topName}. Som alltid: ${usp}.`,
    `Du hittar pris (${priceRange}) och betyg samlat i tabellen, och en grundligare genomgång längre ner. Favoriten heter ${topName} — och ${usp} är förstås inkluderat.`,
  ];
  return [
    `${pick(open, seed)} ${pick(mid, seed, 3)}`,
    `${pick(pain, seed, 5)} ${pick(close, seed, 9)}`,
  ];
}

// Per-produkt-text 80–100 ord. Vävs av produktens egna blurb + roll + pris.
export function productParagraph(p: {
  name: string;
  blurb: string;
  role: string; // t.ex. "Mest för pengarna"
  price: string;
  label: string;
  seed: number;
}): string {
  const role = p.role.toLowerCase();
  const lead = [
    `${p.name} är vårt ${role} bland årets ${p.label}.`,
    `Vi har utsett ${p.name} till ${role}.`,
    `I kategorin ${role} landar vårt val på ${p.name}.`,
    `${p.name} tar hem rollen som ${role} i vår jämförelse.`,
    `När det gäller ${role} är ${p.name} vår klara rekommendation.`,
  ];
  const body = p.blurb && p.blurb.length > 20
    ? p.blurb.replace(/\s+$/, "")
    : `En genomtänkt favorit som gör jobbet utan krångel`;
  const why = [
    `Det vi gillar mest är att den känns genomtänkt rakt igenom och håller vad den lovar i vardagen.`,
    `Den träffar den där balansen mellan kvalitet och pris som gör att den passar de flesta.`,
    `Enkel att använda, snygg att ha framme och prisvärd för vad du får — en trygg rekommendation.`,
    `Idealisk för dig som vill ha något som bara funkar, utan krångel och utan att kosta för mycket.`,
    `Ett populärt val hos våra kunder, och det är inte svårt att förstå varför — den gör jobbet med råge.`,
    `Passar perfekt för vardagsbruk: pålitlig, lätt att leva med och prisvärd på riktigt.`,
  ];
  const priceLine = p.price ? ` Pris: ${p.price}.` : "";
  return `${pick(lead, p.seed)} ${body}. ${pick(why, p.seed, 4)}${priceLine}`;
}

// Roll-badges fördelas efter prisranking inom urvalet.
export function assignRoles(count: number): string[] {
  // index 0 = billigast, count-1 = dyrast (anroparen sorterar på pris stigande)
  const roles = new Array(count).fill("Bra köp");
  if (count >= 1) roles[0] = "Budget-val";
  if (count >= 2) roles[count - 1] = "Premium-val";
  if (count >= 3) roles[Math.floor((count - 1) / 2)] = "Mest för pengarna";
  return roles;
}

export function bestInTestFaq(p: {
  label: string;
  singular: string;
  count: number;
  priceRange: string;
  topName: string;
  category: string;
  seed: number;
}): { q: string; a: string }[] {
  const { label, singular, count, priceRange, topName, category, seed } = p;
  const topVariants = [
    `Vårt toppval just nu är ${topName} — den träffar bäst på kombinationen kvalitet, funktion och pris. Men i jämförelsen ovan hittar du även ett budgetval och ett premiumval beroende på vad du prioriterar.`,
    `Just nu lyfter vi fram ${topName} som vår etta; den känns mest komplett av allt vi jämfört. Vill du spendera mindre eller mer finns både budget- och premiumalternativ i tabellen ovan.`,
    `${topName} står högst på vår lista — bästa balansen mellan pris och prestanda i hela testet. Tittar du i jämförelsen ser du dessutom vårt billigaste val och vårt premiumtips.`,
    `Vi sätter ${topName} överst eftersom helheten av kvalitet, funktion och pris är svårslagen. Ovan kompletterar vi med ett budget- och ett premiumförslag om din plånbok säger annat.`,
    `Om vi måste välja en blir det ${topName} — den gör mest rätt för pengarna. Föredrar du billigast möjligt eller det allra bästa hittar du de valen i jämförelsetabellen.`,
  ];
  const priceVariants = [
    `Priserna på ${label} i vårt urval ligger på ${priceRange}. Du behöver sällan betala mest för att få något riktigt bra — flera favoriter är prisvärda fynd. Fri frakt gäller över 499 kr.`,
    `I vårt urval rör sig ${label} mellan ${priceRange}. Dyrast är inte alltid bäst; flera av våra tips kostar förvånansvärt lite. Och över 499 kr bjuder vi på frakten.`,
    `Räkna med ${priceRange} för ${label} hos oss. Det går utmärkt att fynda i den nedre delen av spannet — kvalitet behöver inte kosta skjortan. Frakten är fri från 499 kr.`,
    `Spannet för ${label} landar på ${priceRange}. Vår erfarenhet: priset säger inte allt, och budgetvalet håller ofta längre än man tror. Köp för över 499 kr så är frakten gratis.`,
    `${priceRange} — så ser prisbilden ut för ${label} i listan. Du hittar bra alternativ i hela spannet, inte bara i toppen. Fri frakt ingår vid köp över 499 kr.`,
  ];
  const selectionVariants = [
    `Vi har gått igenom ${count} ${label} ur vårt eget sortiment och vägt in funktion, material, användarvänlighet och pris. Vi listar bara sådant vi själva skulle rekommendera till en vän.`,
    `Urvalet bygger på ${count} ${label} vi själva granskat — funktion, materialval, hur enkla de är att använda och vad de kostar. Bara det vi står bakom helhjärtat når listan.`,
    `Bakom listan ligger en genomgång av ${count} ${label} ur sortimentet. Vi tittar på funktion, material, handhavande och pris, och plockar bort allt som inte håller måttet.`,
    `Vi jämförde ${count} ${label} och bedömde dem på funktion, material, användarvänlighet och prisvärdhet. Det som återstår är produkter vi gärna ger bort i present.`,
    `Av ${count} ${label} i sortimentet valde vi ut favoriterna utifrån funktion, materialets kvalitet, hur smidiga de är i vardagen och priset. Inget hamnar här av en slump.`,
  ];
  const moreVariants = [
    `Absolut. Den här guiden visar våra favoriter, men i kategorin ${category} hittar du hela vårt utbud. Klicka dig vidare via länkarna på sidan.`,
    `Ja då. Vi har lyft fram höjdpunkterna här — vill du se allt finns hela ${category}-sortimentet bakom länkarna längre ner.`,
    `Det finns mer att botanisera bland. Sidan visar urvalet vi gillar bäst, medan hela kategorin ${category} nås via länkarna här intill.`,
    `Visst. Det här är ett curerat smakprov; för fullständiga ${category} följer du länkarna på sidan till hela utbudet.`,
    `Mer än gärna. Utöver favoriterna ovan rymmer ${category} betydligt fler produkter — länkarna på sidan tar dig dit.`,
  ];
  const faqs = [
    { q: `Vilken är bäst i test bland ${label}?`, a: pick(topVariants, seed, 21) },
    { q: `Vad kostar en bra ${singular}?`, a: pick(priceVariants, seed, 27) },
    { q: `Hur har ni valt ut produkterna?`, a: pick(selectionVariants, seed, 33) },
    { q: `Hur snabbt får jag hem min ${singular}?`, a: deliveryAnswer(singular, seed, 39) },
    { q: `Kan jag returnera om jag ångrar mig?`, a: returnAnswer(seed, 45) },
    { q: `Finns det fler ${label} att välja bland?`, a: pick(moreVariants, seed, 51) },
  ];
  // Variera VILKA 5 frågor (av 6) och ordningen lätt, men stabilt per slug.
  const start = seed % 2; // 0 → frågor 1–5, 1 → frågor 2–6
  return faqs.slice(start, start + 5);
}

// ─────────────────────────────────────────────────────────────────────────
// Pattern 2 — /under-{price}-kr/{category}
// ─────────────────────────────────────────────────────────────────────────

export function priceTierH1(categoryName: string, price: number, seed: number): string {
  const v = [
    `${categoryName} under ${price} kr — smarta fynd för dig som vill spara`,
    `Billig ${categoryName.toLowerCase()}? ${categoryName} under ${price} kr`,
    `${categoryName} under ${price} kr — prisvärda favoriter ${YEAR}`,
    `Fynda ${categoryName.toLowerCase()} under ${price} kr`,
    `${categoryName} under ${price} kr — mest för pengarna ${YEAR}`,
    `Prisvärd ${categoryName.toLowerCase()}: allt under ${price} kr`,
  ];
  return pick(v, seed);
}

export function priceTierMetaTitle(categoryName: string, price: number, seed: number): string {
  const v = [
    `${categoryName} under ${price} kr`,
    `Billig ${categoryName.toLowerCase()} under ${price} kr`,
    `${categoryName} under ${price} kr – smarta fynd`,
    `Fynda ${categoryName.toLowerCase()} under ${price} kr`,
  ];
  return pickTitle(v, seed, 7);
}

export function priceTierMetaDesc(categoryName: string, price: number, count: number, seed: number): string {
  const v = [
    `${count} fynd inom ${categoryName.toLowerCase()} för under ${price} kr. Noga utvalda produkter till smarta priser — fri frakt över 499 kr. Handla hos Fyndplats.`,
    `Spara pengar på ${categoryName.toLowerCase()}: ${count} produkter under ${price} kr, alla handplockade. Leverans 3–7 arbetsdagar och 30 dagars öppet köp hos Fyndplats.`,
    `Letar du efter prisvärd ${categoryName.toLowerCase()}? Vi har samlat ${count} fynd under ${price} kr. Smarta köp, fri frakt över 499 kr — Fyndplats.`,
    `${count} prisvärda ${categoryName.toLowerCase()}-fynd under ${price} kr, handplockade ur sortimentet. Fri frakt över 499 kr och trygga köp hos Fyndplats.`,
    `Fynda ${categoryName.toLowerCase()} under ${price} kr — ${count} smarta köp samlade på ett ställe. Leverans 3–7 arbetsdagar, fri frakt över 499 kr. Fyndplats.`,
  ];
  return pick(v, seed, 11);
}

export function priceTierIntro(p: {
  categoryName: string;
  price: number;
  count: number;
  minPrice: string;
  seed: number;
}): string[] {
  const { categoryName, price, count, minPrice } = p;
  const open = [
    `Att fynda smart handlar inte om att tumma på kvaliteten — det handlar om att veta var man hittar de bästa köpen.`,
    `Prisvärt behöver inte betyda billigt. Här har vi samlat ${categoryName.toLowerCase()} som ger mycket för pengarna.`,
    `Du behöver inte betala mer än nödvändigt för bra ${categoryName.toLowerCase()}.`,
    `Bra ${categoryName.toLowerCase()} till rätt pris finns — man måste bara veta var man letar.`,
    `Smart shopping börjar med att hitta kvalitet som inte kostar för mycket, och det har vi gjort åt dig.`,
    `Det går utmärkt att fynda ${categoryName.toLowerCase()} utan att kompromissa med vad du faktiskt får.`,
  ];
  const mid = [
    `Den här sidan samlar ${count} produkter inom ${categoryName.toLowerCase()} som alla kostar under ${price} kr, med priser från ${minPrice}.`,
    `Vi har plockat fram ${count} fynd inom ${categoryName.toLowerCase()} för under ${price} kr — prisspannet börjar på ${minPrice}.`,
    `Nedan hittar du ${count} noga utvalda ${categoryName.toLowerCase()}-produkter, samtliga under ${price} kr (från ${minPrice}).`,
    `Här listar vi ${count} ${categoryName.toLowerCase()}-fynd som alla håller sig under ${price} kr, billigast från ${minPrice}.`,
    `Vårt urval rymmer ${count} produkter inom ${categoryName.toLowerCase()} med prislapp under ${price} kr — start på ${minPrice}.`,
    `Totalt ${count} ${categoryName.toLowerCase()}-produkter under ${price} kr väntar nedan, med priser som börjar vid ${minPrice}.`,
  ];
  const close = [
    `Allt är handplockat ur vårt sortiment, och vid köp över 499 kr är frakten dessutom fri. Hitta ditt nästa fynd nedan.`,
    `Som alltid gäller fri frakt över 499 kr och 30 dagars öppet köp. Bläddra bland fynden och fyll varukorgen.`,
    `Du får samma snabba leverans och trygga köp som på resten av Fyndplats — bara till ett snällare pris.`,
    `Varje produkt är utvald för hand, och handlar du för över 499 kr bjuder vi på frakten. Dyk ner i fynden nedan.`,
    `Med fri frakt över 499 kr och 30 dagars öppet köp är det tryggt att klicka hem. Botanisera vidare nedan.`,
    `Samma kvalitetskoll och snabba leverans som vanligt — fast till en vänligare prislapp. Bläddra och fynda.`,
  ];
  // Andra stycket: lyfter varför prisvärt inte betyder sämre + hur urvalet görs.
  // Ger sidan tillräckligt med unik brödtext för att klara 250-ords-guarden även
  // när produktlistan är kort (3–5 produkter).
  const why = [
    `Att en produkt kostar mindre betyder inte att den är sämre. Vi väljer ut prisvärda ${categoryName.toLowerCase()}-fynd med samma omsorg som resten av sortimentet — funktion, hållbarhet och hur väl de gör nytta i vardagen väger alltid tyngst.`,
    `Vi tror på att bra ${categoryName.toLowerCase()} ska vara tillgängligt för alla. Därför letar vi ständigt efter smarta köp som ger mer än de kostar, och plockar bort sådant som inte håller måttet.`,
    `Det smarta köpet handlar om att få mest värde per krona. Varje produkt i listan nedan är vald för att leverera just det — utan onödiga prislappar och utan att tumma på kvaliteten.`,
    `Lågt pris och hög kvalitet utesluter inte varandra. Vi jagar ${categoryName.toLowerCase()} där prislappen är liten men nyttan stor, och rensar konsekvent bort resten innan något hamnar i listan.`,
    `För oss är ett fynd något som överträffar sitt pris. Allt nedan är utvalt för att kännas dyrare än det är — funktionen och hållbarheten har vi aldrig tummat på för att pressa kronorna.`,
    `Billigt ska aldrig betyda dåligt. Därför nagelfar vi varje ${categoryName.toLowerCase()}-produkt på funktion och hållbarhet innan den får en plats här, oavsett hur låg prislappen är.`,
  ];
  const reassure = [
    `Och skulle något ändå inte passa har du alltid 30 dagars öppet köp att luta dig mot.`,
    `Passar inte ett köp? Med 30 dagars öppet köp är det enkelt att ångra sig.`,
    `Tryggheten med 30 dagars öppet köp och spårbar leverans följer förstås med på varje fynd här.`,
    `Och ändrar du dig är 30 dagars öppet köp en självklarhet på allt du handlar.`,
    `Skulle något inte leva upp till förväntan har du 30 dagar på dig att skicka tillbaka det.`,
    `Med spårbar leverans och 30 dagars öppet köp tar du aldrig någon risk när du fyndar här.`,
  ];
  return [
    `${pick(open, p.seed)} ${pick(mid, p.seed, 3)} ${pick(close, p.seed, 6)}`,
    `${pick(why, p.seed, 9)} ${pick(reassure, p.seed, 12)}`,
  ];
}

// ─────────────────────────────────────────────────────────────────────────
// Pattern 3 — /for-dig-som/{interest}
// ─────────────────────────────────────────────────────────────────────────

export function interestH1(verb: string, seed: number): string {
  const v = [
    `För dig som ${verb} — handplockade fynd`,
    `För dig som ${verb}: våra favoriter`,
    `Fynd för dig som ${verb}`,
    `För dig som ${verb} — smarta köp ${YEAR}`,
    `För dig som ${verb} — utvalt med omsorg`,
    `Handplockat för dig som ${verb}`,
  ];
  return pick(v, seed);
}

export function interestMetaTitle(verb: string, seed: number): string {
  const v = [
    `För dig som ${verb} – handplockade fynd`,
    `Fynd för dig som ${verb}`,
    `För dig som ${verb} – våra favoriter`,
    `Handplockat för dig som ${verb}`,
  ];
  return pickTitle(v, seed, 7);
}

export function interestMetaDesc(verb: string, count: number, seed: number): string {
  const v = [
    `${count} handplockade fynd för dig som ${verb}. Smarta produkter till bra priser, fri frakt över 499 kr och 30 dagars öppet köp. Handla hos Fyndplats.`,
    `För dig som ${verb}: vi har samlat ${count} favoriter som gör vardagen enklare. Noga utvalda, prisvärda och hemma på 3–7 arbetsdagar. Fyndplats.`,
    `Är du en sån som ${verb}? Här är ${count} fynd vi tror du kommer älska — smarta köp till smarta priser hos Fyndplats.`,
    `${count} utvalda favoriter för dig som ${verb}. Prisvärt, leverans 3–7 arbetsdagar och fri frakt över 499 kr — handplockat hos Fyndplats.`,
    `Fynd som passar dig som ${verb}: ${count} smarta köp samlade på ett ställe. Fri frakt över 499 kr och 30 dagars öppet köp. Fyndplats.`,
  ];
  return pick(v, seed, 11);
}

export function interestIntro(p: {
  verb: string;
  noun: string;
  audience: string;
  painpoint: string;
  usp: string;
  count: number;
  seed: number;
}): string[] {
  const { noun, audience, painpoint, usp, count } = p;
  const mid = [
    `Vi har handplockat ${count} fynd som passar just dig — produkter som gör ${noun} lite enklare och roligare.`,
    `Därför har vi samlat ${count} favoriter för dig, alla utvalda med ${noun} i tankarna.`,
    `Nedan hittar du ${count} produkter vi tror passar perfekt för ${noun}.`,
    `Vi har kurerat ${count} fynd med ${noun} i fokus — saker som faktiskt gör skillnad i vardagen.`,
    `Här väntar ${count} noga utvalda produkter, alla med en sak gemensamt: de underlättar ${noun}.`,
    `Resultatet blev ${count} favoriter som vi tror sitter som handen i handsken för ${noun}.`,
  ];
  const pain = [
    `Vi vet att ${painpoint} kan stå i vägen — och de här produkterna är valda för att lösa precis det.`,
    `Det handlar ofta om ${painpoint}, och varje fynd här tar tag i den biten.`,
    `Gemensamt för urvalet: de hjälper dig med ${painpoint}.`,
    `${cap(painpoint)} är den knut vi velat lösa upp — varje produkt på listan gör sitt för det.`,
    `Den gemensamma nämnaren är ${painpoint}; det är problemet allt nedan är tänkt att råda bot på.`,
    `Vi har haft ${painpoint} i bakhuvudet hela vägen, och valt produkterna därefter.`,
  ];
  const close = [
    `Allt levereras med ${usp}, fri frakt över 499 kr och 30 dagars öppet köp. Längre ner svarar vi också på några vanliga frågor.`,
    `Bakom urvalet ligger samma löfte: ${usp}. Bläddra bland fynden nedan och se våra svar på vanliga frågor.`,
    `Med ${usp} som ledstjärna har vi valt ut allt nedan. Scrolla vidare för produkter och frågor & svar.`,
    `Varje fynd kommer med ${usp}, fri frakt från 499 kr och 30 dagars öppet köp. Vanliga frågor besvaras längst ner.`,
    `Löftet är detsamma för allt här: ${usp}. Kika på produkterna nedan och rulla vidare till frågor & svar.`,
    `Allt vilar på ${usp}, och du handlar tryggt med fri frakt över 499 kr. Längre ner reder vi ut de vanligaste frågorna.`,
  ];
  return [`${audience} ${pick(mid, p.seed, 2)}`, `${pick(pain, p.seed, 4)} ${pick(close, p.seed, 8)}`];
}

export function interestFaq(p: {
  verb: string;
  noun: string;
  count: number;
  topName: string;
  seed: number;
}): { q: string; a: string }[] {
  const { verb, noun, count, topName, seed } = p;
  const startTips = [
    `Vi har samlat ${count} favoriter på den här sidan. Ett bra ställe att börja är ${topName} — men hela urvalet är valt för att göra ${noun} enklare och roligare.`,
    `På sidan hittar du ${count} utvalda fynd. Sticker du in en tå först? Testa ${topName}. Resten av listan är minst lika genomtänkt för ${noun}.`,
    `Det blir ${count} handplockade tips här. ${topName} är en trygg start, men varje produkt är vald med ${noun} i fokus.`,
    `Vi tipsar om ${count} produkter på den här sidan. Vet du inte var du ska börja är ${topName} ett självklart förstaval — allt annat kretsar kring ${noun}.`,
    `Här väntar ${count} favoriter. Börja gärna med ${topName} och bläddra vidare; hela urvalet handlar om att göra ${noun} bättre.`,
  ];
  const valueVariants = [
    `Ja, allt är handplockat ur vårt sortiment med fokus på mycket värde för pengarna. Vid köp över 499 kr är frakten dessutom fri inom Sverige.`,
    `Det tycker vi. Varje produkt är vald för att ge mer än den kostar — och handlar du för över 499 kr bjuder vi på frakten inom Sverige.`,
    `Absolut. Vi prioriterar prisvärdhet när vi väljer ut fynden, och fri frakt gäller så fort ordern passerar 499 kr.`,
    `Ja, prisvärdheten är hela poängen — vi plockar bort sådant som inte ger valuta för pengarna. Över 499 kr är frakten fri inom Sverige.`,
    `Helt klart. Urvalet är gjort för att maxa värdet per krona, och vid köp över 499 kr slipper du fraktavgiften.`,
  ];
  const moreVariants = [
    `Ja, det här är ett curerat urval. Via länkarna på sidan kommer du vidare till hela vårt sortiment och relaterade kategorier.`,
    `Visst finns det mer. Sidan visar ett handplockat smakprov — länkarna leder vidare till hela sortimentet och närliggande kategorier.`,
    `Absolut. Det du ser är våra favoriter; hela utbudet och relaterade kategorier når du via länkarna här.`,
    `Ja då. Vi har kurerat ett urval, men följer du länkarna på sidan öppnar sig hela sortimentet och fler kategorier.`,
    `Det gör du. Detta är ett urval vi tror på — för resten av sortimentet och relaterade kategorier finns länkar på sidan.`,
  ];
  const faqs = [
    { q: `Vad är bra att ha för dig som ${verb}?`, a: pick(startTips, seed, 23) },
    { q: `Är produkterna prisvärda?`, a: pick(valueVariants, seed, 29) },
    { q: `Hur snabbt får jag hem mitt köp?`, a: deliveryAnswer("", seed, 35) },
    { q: `Kan jag returnera om något inte passar?`, a: returnAnswer(seed, 41) },
    { q: `Hittar jag fler produkter än de som visas här?`, a: pick(moreVariants, seed, 47) },
  ];
  const start = seed % 2;
  return faqs.slice(start, start + 4);
}
