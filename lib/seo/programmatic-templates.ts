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
// Lösningen: deterministisk hash av sluggen väljer variant ur 5–10 alternativ per
// slot. Samma slug → samma variant för alltid; olika slugs → spridning. Resultatet
// vävs ihop med RIKTIG data (produktnamn, prisspann, antal) så ingen sida blir en
// ren kopia av en annan.

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
// välja oberoende av varandra (annars skulle alla slots röra sig i lås).
export function pick<T>(arr: T[], seed: number, salt = 0): T {
  if (arr.length === 0) throw new Error("pick(): empty array");
  return arr[(seed + salt * 2654435761) % arr.length];
}

export function countWords(text: string): number {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

const YEAR = 2026;

// Versalisera första bokstaven (för rubriker som börjar med en slot).
function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
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
  ];
  return pick(v, seed);
}

export function bestInTestMetaTitle(label: string, seed: number): string {
  const v = [
    `Bäst i test: ${label} ${YEAR} | Fyndplats`,
    `${cap(label)} – bäst i test ${YEAR} | Fyndplats`,
    `Bäst i test ${label} ${YEAR} – jämförelse | Fyndplats`,
  ];
  return pick(v, seed, 7);
}

export function bestInTestMetaDesc(label: string, count: number, priceRange: string, seed: number): string {
  const v = [
    `Vi har jämfört ${count} ${label} till bra pris. Se vår topplista med betyg, pris (${priceRange}) och köpguide — hitta bäst i test ${YEAR} hos Fyndplats.`,
    `Bäst i test ${label} ${YEAR}: ${count} noga utvalda fynd jämförda sida vid sida. Pris från ${priceRange}, fri frakt över 499 kr. Hitta ditt val hos Fyndplats.`,
    `Letar du efter ${label}? Vår jämförelse av ${count} modeller (${priceRange}) hjälper dig välja rätt. Bäst i test, mest prisvärt och budgetval — allt samlat.`,
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
    `Att välja rätt ${p.label} är inte alltid lätt — utbudet är stort och prisskillnaderna ännu större.`,
    `Det finns gott om ${p.label} där ute, men långt ifrån alla håller vad de lovar.`,
    `Ska du köpa ${p.label} men vet inte var du ska börja? Du är inte ensam.`,
    `Marknaden för ${p.label} svämmar över av alternativ, och det är svårt att veta vad som faktiskt är värt pengarna.`,
  ];
  const mid = [
    `Därför har vi gått igenom vårt sortiment och plockat ut ${count} ${label} som vi själva skulle välja — alla noga utvalda för ${audience}.`,
    `Vi har jämfört ${count} ${label} sida vid sida, med fokus på det som faktiskt spelar roll för ${audience}.`,
    `I den här guiden jämför vi ${count} ${label} ur vårt sortiment, handplockade för ${audience}.`,
  ];
  const pain = [
    `Vi vet att ${painpoint} är en vanlig huvudvärk — och våra val är gjorda för att lösa just det.`,
    `Det handlar i grunden om ${painpoint}, och varje produkt här är vald med det i åtanke.`,
    `Gemensamt för våra favoriter: de tar tag i ${painpoint} på ett smart sätt.`,
  ];
  const close = [
    `Längst ner hittar du en jämförelsetabell med pris (från ${priceRange}) och våra omdömen, följt av en närmare titt på varje favorit. Vårt toppval just nu: ${topName}. Allt med ${usp}.`,
    `I tabellen nedan ser du pris (${priceRange}) och betyg i en överblick, och längre ner går vi igenom varje produkt. Vi gillar ${topName} extra mycket — och allt levereras med ${usp}.`,
    `Scrolla vidare för vår jämförelsetabell (priser från ${priceRange}) och detaljerade omdömen. ${topName} sticker ut i toppen. Bakom varje val ligger samma löfte: ${usp}.`,
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
  const lead = [
    `${p.name} är vårt ${p.role.toLowerCase()} bland årets ${p.label}.`,
    `Vi har utsett ${p.name} till ${p.role.toLowerCase()}.`,
    `I kategorin ${p.role.toLowerCase()} landar vårt val på ${p.name}.`,
  ];
  const body = p.blurb && p.blurb.length > 20
    ? p.blurb.replace(/\s+$/, "")
    : `En genomtänkt favorit som gör jobbet utan krångel`;
  const why = [
    `Det vi gillar mest är att den känns genomtänkt rakt igenom och håller vad den lovar i vardagen.`,
    `Den träffar den där balansen mellan kvalitet och pris som gör att den passar de flesta.`,
    `Enkel att använda, snygg att ha framme och prisvärd för vad du får — en trygg rekommendation.`,
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
  const { label, singular, count, priceRange, topName, category } = p;
  const faqs = [
    {
      q: `Vilken är bäst i test bland ${label}?`,
      a: `Vårt toppval just nu är ${topName}. Det är den vi tycker träffar bäst på kombinationen kvalitet, funktion och pris — men i jämförelsen ovan hittar du även vårt budgetval och premiumval beroende på vad som passar dig bäst.`,
    },
    {
      q: `Vad kostar en bra ${singular}?`,
      a: `Priserna på ${label} i vårt urval ligger på ${priceRange}. Du behöver sällan betala mest för att få något riktigt bra — flera av våra favoriter är prisvärda fynd. Fri frakt gäller på köp över 499 kr.`,
    },
    {
      q: `Hur har ni valt ut produkterna?`,
      a: `Vi har gått igenom ${count} ${label} ur vårt eget sortiment och vägt in funktion, material, användarvänlighet och pris. Vi listar bara sådant vi själva skulle rekommendera till en vän.`,
    },
    {
      q: `Hur snabbt får jag hem min ${singular}?`,
      a: `Normal leveranstid är 5–15 arbetsdagar och du får alltid en spårningskod via mejl. Vid köp över 499 kr är frakten fri, annars 19 kr inom Sverige.`,
    },
    {
      q: `Kan jag returnera om jag ångrar mig?`,
      a: `Ja. Du har 30 dagars öppet köp hos Fyndplats. Produkten ska vara oanvänd och i originalförpackning — mejla info@fyndplats.com med ditt ordernummer så hjälper vi dig.`,
    },
    {
      q: `Finns det fler ${label} att välja bland?`,
      a: `Absolut. Den här guiden visar våra favoriter, men i kategorin ${category} hittar du hela vårt utbud. Klicka dig vidare via länkarna på sidan.`,
    },
  ];
  // Variera VILKA 5 frågor (av 6) och ordningen lätt, men stabilt per slug.
  const start = p.seed % 2; // 0 → frågor 1–5, 1 → frågor 2–6
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
  ];
  return pick(v, seed);
}

export function priceTierMetaTitle(categoryName: string, price: number, seed: number): string {
  const v = [
    `${categoryName} under ${price} kr | Fyndplats`,
    `Billig ${categoryName.toLowerCase()} under ${price} kr | Fyndplats`,
    `${categoryName} under ${price} kr – smarta fynd | Fyndplats`,
  ];
  return pick(v, seed, 7);
}

export function priceTierMetaDesc(categoryName: string, price: number, count: number, seed: number): string {
  const v = [
    `${count} fynd inom ${categoryName.toLowerCase()} för under ${price} kr. Noga utvalda produkter till smarta priser — fri frakt över 499 kr. Handla hos Fyndplats.`,
    `Spara pengar på ${categoryName.toLowerCase()}: ${count} produkter under ${price} kr, alla handplockade. Snabb leverans och 30 dagars öppet köp hos Fyndplats.`,
    `Letar du efter prisvärd ${categoryName.toLowerCase()}? Vi har samlat ${count} fynd under ${price} kr. Smarta köp, fri frakt över 499 kr — Fyndplats.`,
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
  ];
  const mid = [
    `Den här sidan samlar ${count} produkter inom ${categoryName.toLowerCase()} som alla kostar under ${price} kr, med priser från ${minPrice}.`,
    `Vi har plockat fram ${count} fynd inom ${categoryName.toLowerCase()} för under ${price} kr — prisspannet börjar på ${minPrice}.`,
    `Nedan hittar du ${count} noga utvalda ${categoryName.toLowerCase()}-produkter, samtliga under ${price} kr (från ${minPrice}).`,
  ];
  const close = [
    `Allt är handplockat ur vårt sortiment, och vid köp över 499 kr är frakten dessutom fri. Hitta ditt nästa fynd nedan.`,
    `Som alltid gäller fri frakt över 499 kr och 30 dagars öppet köp. Bläddra bland fynden och fyll varukorgen.`,
    `Du får samma snabba leverans och trygga köp som på resten av Fyndplats — bara till ett snällare pris.`,
  ];
  // Andra stycket: lyfter varför prisvärt inte betyder sämre + hur urvalet görs.
  // Ger sidan tillräckligt med unik brödtext för att klara 250-ords-guarden även
  // när produktlistan är kort (3–5 produkter).
  const why = [
    `Att en produkt kostar mindre betyder inte att den är sämre. Vi väljer ut prisvärda ${categoryName.toLowerCase()}-fynd med samma omsorg som resten av sortimentet — funktion, hållbarhet och hur väl de gör nytta i vardagen väger alltid tyngst.`,
    `Vi tror på att bra ${categoryName.toLowerCase()} ska vara tillgängligt för alla. Därför letar vi ständigt efter smarta köp som ger mer än de kostar, och plockar bort sådant som inte håller måttet.`,
    `Det smarta köpet handlar om att få mest värde per krona. Varje produkt i listan nedan är vald för att leverera just det — utan onödiga prislappar och utan att tumma på kvaliteten.`,
  ];
  const reassure = [
    `Och skulle något ändå inte passa har du alltid 30 dagars öppet köp att luta dig mot.`,
    `Passar inte ett köp? Med 30 dagars öppet köp är det enkelt att ångra sig.`,
    `Tryggheten med 30 dagars öppet köp och spårbar leverans följer förstås med på varje fynd här.`,
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
  ];
  return pick(v, seed);
}

export function interestMetaTitle(verb: string, seed: number): string {
  const v = [
    `För dig som ${verb} – handplockade fynd | Fyndplats`,
    `Fynd för dig som ${verb} | Fyndplats`,
    `För dig som ${verb} – våra favoriter | Fyndplats`,
  ];
  return pick(v, seed, 7);
}

export function interestMetaDesc(verb: string, count: number, seed: number): string {
  const v = [
    `${count} handplockade fynd för dig som ${verb}. Smarta produkter till bra priser, fri frakt över 499 kr och 30 dagars öppet köp. Handla hos Fyndplats.`,
    `För dig som ${verb}: vi har samlat ${count} favoriter som gör vardagen enklare. Noga utvalda, prisvärda och snabbt hemma. Fyndplats.`,
    `Är du en sån som ${verb}? Här är ${count} fynd vi tror du kommer älska — smarta köp till smarta priser hos Fyndplats.`,
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
  const { verb, noun, audience, painpoint, usp, count } = p;
  const mid = [
    `Vi har handplockat ${count} fynd som passar just dig — produkter som gör ${noun} lite enklare och roligare.`,
    `Därför har vi samlat ${count} favoriter för dig, alla utvalda med ${noun} i tankarna.`,
    `Nedan hittar du ${count} produkter vi tror passar perfekt för ${noun}.`,
  ];
  const pain = [
    `Vi vet att ${painpoint} kan stå i vägen — och de här produkterna är valda för att lösa precis det.`,
    `Det handlar ofta om ${painpoint}, och varje fynd här tar tag i den biten.`,
    `Gemensamt för urvalet: de hjälper dig med ${painpoint}.`,
  ];
  const close = [
    `Allt levereras med ${usp}, fri frakt över 499 kr och 30 dagars öppet köp. Längre ner svarar vi också på några vanliga frågor.`,
    `Bakom urvalet ligger samma löfte: ${usp}. Bläddra bland fynden nedan och se våra svar på vanliga frågor.`,
    `Med ${usp} som ledstjärna har vi valt ut allt nedan. Scrolla vidare för produkter och frågor & svar.`,
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
  const { verb, noun, count, topName } = p;
  const faqs = [
    {
      q: `Vad är bra att ha för dig som ${verb}?`,
      a: `Vi har samlat ${count} favoriter på den här sidan. Ett tips att börja med är ${topName} — men hela urvalet är valt för att göra ${noun} enklare och roligare.`,
    },
    {
      q: `Är produkterna prisvärda?`,
      a: `Ja, allt är handplockat ur vårt sortiment med fokus på mycket värde för pengarna. Vid köp över 499 kr är frakten dessutom fri inom Sverige.`,
    },
    {
      q: `Hur snabbt får jag hem mitt köp?`,
      a: `Normal leveranstid är 5–15 arbetsdagar och du får en spårningskod via mejl så snart paketet skickas. Frakten är 19 kr, eller fri över 499 kr.`,
    },
    {
      q: `Kan jag returnera om något inte passar?`,
      a: `Självklart. Du har 30 dagars öppet köp. Produkten ska vara oanvänd och i originalförpackning — mejla info@fyndplats.com med ditt ordernummer så löser vi det.`,
    },
    {
      q: `Hittar jag fler produkter än de som visas här?`,
      a: `Ja, det här är ett curerat urval. Via länkarna på sidan kommer du vidare till hela vårt sortiment och relaterade kategorier.`,
    },
  ];
  const start = p.seed % 2;
  return faqs.slice(start, start + 4);
}
