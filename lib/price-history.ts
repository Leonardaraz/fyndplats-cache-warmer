// lib/price-history.ts
//
// JÄMFÖRPRISET vid en prissänkning — uträknat, inte hämtat från Wix.
//
// LAGEN. 7 a § prisinformationslagen (2004:347), införd genom SFS 2022:654 och
// läst mot lagen.nu 2026-09-11:
//
//   "Om en produkt tillhandahålls med angivande av att priset har sänkts ska
//    även det tidigare priset anges. Det tidigare pris som ska anges ska vara
//    det LÄGSTA pris som näringsidkaren har tillämpat för produkten under de
//    senaste 30 dagarna före prissänkningen. Om priset under denna tid har
//    sänkts GRADVIS, ska i stället det pris som gällde FÖRE DEN FÖRSTA
//    prissänkningen anges."
//
// Två regler alltså, och den andra är inte valfri — lagen säger "ska".
//
// VAD VI GJORDE FÖRE DEN HÄR MODULEN. lib/products.ts satte originalPrice genom
// att jämföra Wix `price.price` mot `price.discountedPrice`. Det är butikens
// LISTPRIS, inte ett pris vi bevisligen tillämpat. Mätt i produktionen
// 2026-09-11: 15 av 150 svepta produktsidor (10,0 %, ca 250 av 2 569 produkter)
// visade Rea-badge och överstruket pris på den grunden.
//
// PRISET ÄR EN TRAPPA, INTE PUNKTER. En observation betyder "priset var X den
// dagen", och priset gäller sedan tills det ändras. Därför fyller vi framåt
// mellan observationer i stället för att kräva en rad per dag — ett missat
// cron-pass ska inte slå ut jämförpriset i en månad. Men fönstrets BÖRJAN måste
// vara täckt: finns ingen observation på eller före dag −30 vet vi inte vad
// priset var då, och då får ingen prissänkning påstås.
//
// NULL BETYDER "PÅSTÅ INGEN SÄNKNING". Samma säkra riktning som i
// lib/retur-frakt.ts: att avstå från ett påstående kostar konvertering, att
// göra ett påstående vi inte kan belägga kostar mer. En produkt som funnits
// kortare tid än 30 dagar visar alltså ingen rea förrän den kan beläggas —
// vilket är precis vad lagen kräver, eftersom kravet gäller PER PRODUKT.
//
// ÖREN, INTE KRONOR. Alla belopp är heltal i minor units. Prisjämförelser i
// flyttal ger 1498.9999999 och ett överstruket pris som är en krona fel.

/** Lagens fönster. */
export const FONSTER_DAGAR = 30;

/** En avläsning: priset som gällde den dagen. */
export type Observation = {
  /** ISO-datum, "2026-09-11". */
  datum: string;
  /** Faktiskt tillämpat pris i minor units — det kunden kunde betala. */
  prisMinor: number;
};

export type Jamforpris = {
  prisMinor: number;
  /** Vilken av 7 a §:s två regler som gav talet. Loggas, och syns i provet. */
  grund: "lagsta-30-dagar" | "fore-forsta-sankningen";
};

const DAG_MS = 86_400_000;

function tillDagtal(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [ar, man, dag] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(ar, man - 1, dag);
  if (!Number.isFinite(t)) return null;
  // Date.UTC RULLAR ÖVER: "2026-13-45" blir en giltig tidpunkt i februari 2027
  // i stället för ett fel. Formkontrollen ovan släpper alltså igenom datum som
  // inte finns. Rundgången nedan fångar dem — provet "ogiltig indata ger null"
  // föll på exakt det här.
  const d = new Date(t);
  if (d.getUTCFullYear() !== ar || d.getUTCMonth() !== man - 1 || d.getUTCDate() !== dag) {
    return null;
  }
  return Math.floor(t / DAG_MS);
}

function giltig(o: Observation): boolean {
  return (
    tillDagtal(o.datum) !== null &&
    Number.isInteger(o.prisMinor) &&
    o.prisMinor > 0
  );
}

/**
 * Räkna fram det tidigare pris som ska anges vid en prissänkning.
 *
 * @param observationer  avläsningar, i valfri ordning; dubbletter per dag
 *                       avgörs av den sista i listan
 * @param idag           dagen sänkningen gäller ("2026-09-11")
 * @param aktuelltMinor  dagens pris i minor units
 * @returns              jämförpriset, eller null när ingen sänkning får påstås
 */
export function jamforpris(
  observationer: Observation[],
  idag: string,
  aktuelltMinor: number,
): Jamforpris | null {
  const idagDag = tillDagtal(idag);
  if (idagDag === null) return null;
  if (!Number.isInteger(aktuelltMinor) || aktuelltMinor <= 0) return null;

  const forsta = idagDag - FONSTER_DAGAR;
  const sista = idagDag - 1;

  // En dag → ett pris. Senare rad för samma dag vinner.
  const perDag = new Map<number, number>();
  for (const o of observationer) {
    if (!giltig(o)) continue;
    const d = tillDagtal(o.datum) as number;
    // Dagens eget pris är inte sin egen historik. Spärren finns på TVÅ ställen
    // — här och i seriens övre gräns nedan — och det är med flit. Ett
    // mutationstest visade att var och en ensam är inert eftersom den andra
    // täcker samma fall; först när båda togs bort föll provet. Ta alltså inte
    // bort den ena för att den ser död ut.
    if (d > sista) continue;
    perDag.set(d, o.prisMinor);
  }
  if (perDag.size === 0) return null;

  // Fönstrets början måste vara täckt — annars vet vi inte vad priset var då.
  const dagar = Array.from(perDag.keys()).sort((a, b) => a - b);
  if ((dagar[0] as number) > forsta) return null;

  // Bygg trappan över fönstret genom att fylla framåt.
  const serie: number[] = [];
  let senast: number | null = null;
  let i = 0;
  for (let d = (dagar[0] as number); d <= sista; d++) {
    while (i < dagar.length && (dagar[i] as number) === d) {
      senast = perDag.get(dagar[i] as number) as number;
      i++;
    }
    if (d >= forsta && senast !== null) serie.push(senast);
  }
  if (serie.length === 0) return null;

  const lagsta = Math.min(...serie);

  // GRADVIS SÄNKNING. Gå baklänges från gårdagen så länge priset inte sjunker
  // när vi går bakåt — det är samma sak som att priset sjunker framåt. Där
  // körningen börjar låg priset som gällde före dess första sänkning.
  //
  // FÖRSTA VERSIONEN KRÄVDE ATT k > 0, alltså att körningen började strikt inne
  // i serien. Provet "gradvis sänkning" föll på det: ett pris som legat platt
  // sedan långt före fönstret och sedan trappas ned ger en körning som börjar
  // på index 0, och regeln slog aldrig till. Villkoret var fel formulerat —
  // lagen frågar efter sänkningar "under denna tid", och serie[0] ÄR priset som
  // gällde dag −30, alltså före varje sänkning som skett inom fönstret. Att
  // priset var något annat dag −31 är utanför vad 7 a § frågar om.
  let k = serie.length - 1;
  while (k > 0 && (serie[k - 1] as number) >= (serie[k] as number)) k--;
  const startPris = serie[k] as number;

  // Räkna distinkta sänkningar i körningen, dagens egen inräknad.
  let sankningar = aktuelltMinor < (serie[serie.length - 1] as number) ? 1 : 0;
  for (let j = k; j < serie.length - 1; j++) {
    if ((serie[j + 1] as number) < (serie[j] as number)) sankningar++;
  }

  // Minst TVÅ sänkningar krävs — en ensam sänkning är inte en nedtrappning, och
  // då gäller lägstaregeln. Skillnaden är pengar: gradvis-regeln ger alltid ett
  // högre jämförpris och därmed en större rabatt att skylta med, så tröskeln
  // ska vara den lagen sätter och inte lägre.
  const gradvis = sankningar >= 2;
  const tidigare = gradvis ? startPris : lagsta;

  // Ingen sänkning att påstå om dagens pris inte är lägre.
  if (aktuelltMinor >= tidigare) return null;

  return {
    prisMinor: tidigare,
    grund: gradvis ? "fore-forsta-sankningen" : "lagsta-30-dagar",
  };
}

/**
 * Dagens datum i Europe/Stockholm som ISO-dag.
 *
 * Serverns UTC-dygn ligger en eller två timmar fel mot butikens. Ett snapshot
 * som hamnar på fel datum ger en lucka den ena dagen och en dubblett den andra
 * — och en lucka i fönstrets början gör att ingen rea får visas alls.
 */
export function idagISO(nu: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(nu);
}

/** Kronor (decimaltal) → öre (heltal). Null för allt som inte är ett pris. */
export function tillMinor(kronor: number): number | null {
  if (typeof kronor !== "number" || !Number.isFinite(kronor) || kronor <= 0) return null;
  return Math.round(kronor * 100);
}

/** En rad på väg in i historiken. */
export type Rad = { produktId: string; prisMinor: number; valuta: string };

/**
 * Bygg en flerradig upsert: SQL-text med genererade platshållare, plus värdena
 * i rätt ordning. Ren funktion, i den här modulen enbart för att den ska gå att
 * testa — SQL:en körs från lib/price-snapshot.ts, som inte kan laddas i
 * node-testköraren.
 *
 * Numreringen är det som är lätt att få fel: $1 är alltid datumet, och varje
 * rad lägger till tre parametrar efter det. En förskjutning här skulle skriva
 * priser på fel produkter.
 */
export function byggUpsert(rader: Rad[]): { text: string; varden: unknown[] } | null {
  if (rader.length === 0) return null;
  const varden: unknown[] = [null]; // plats 1 reserveras för datumet
  const platser = rader.map((r, n) => {
    const b = 1 + n * 3;
    varden.push(r.produktId, r.prisMinor, r.valuta);
    return `($${b + 1}, $1::date, $${b + 2}, $${b + 3})`;
  });
  return {
    text:
      `INSERT INTO price_history (product_id, observed_on, price_minor, currency)\n` +
      `         VALUES ${platser.join(", ")}\n` +
      `         ON CONFLICT (product_id, observed_on)\n` +
      `         DO UPDATE SET price_minor = EXCLUDED.price_minor, recorded_at = NOW()`,
    varden,
  };
}
