// lib/llms-txt.ts
//
// /llms.txt: en kort karta över butiken för språkmodeller och AI-sök.
//
// VARFÖR DEN FINNS. ChatGPT stod för omkring 40 % av köpen i GA4 (mätt
// 2026-11-07), och Semrush flaggade att filen saknades (2026-11-10). Formatet
// är det från llmstxt.org: en rubrik, ett citat som säger vad sajten är, och
// sedan länklistor under H2-rubriker.
//
// ☠️ INGA PRISER OCH INGA LÖFTEN SOM KAN BLI FEL. Villkoren kommer som
// parametrar ur samma konstanter som sidorna använder (lib/shipping.ts,
// lib/retur-policy.ts), så filen kan aldrig säga något annat än butiken.
//
// LÖVMODUL med flit, så att `node --test` kan ladda den.

export type LlmsUnderlag = {
  sajt: string;
  /** Huvudkategorier i menyns ordning, med underkategorier. */
  kategorier: { name: string; slug: string; subs?: { name: string; slug: string }[] }[];
  /** Köpguider och inlägg, nyast först. */
  guider: { title: string; slug: string; excerpt?: string }[];
  harRea: boolean;
  villkor: {
    /** T.ex. "3–6 arbetsdagar". */
    leveranstid: string;
    /** Fri frakt över så här många kronor. */
    friFraktOverKr: number;
    /** Frakt under gränsen, i kronor. */
    fraktKr: number;
    /** En mening om ångerrätt och öppet köp. */
    retur: string;
    /** En mening om EU-lagret. */
    euLager: string;
  };
};

/** Högst så många underkategorier per avdelning: filen ska gå att läsa i ett svep. */
const UNDER_PER_AVDELNING = 12;
/** Högst så många guider. */
const GUIDER_MAX = 40;

/** En rad i en länklista. Radbrytningar och hakparenteser i namn tas bort. */
function lank(namn: string, adress: string, beskrivning?: string): string {
  const rent = (s: string) => s.replace(/[[\]]/g, "").replace(/\s+/g, " ").trim();
  const text = beskrivning ? rent(beskrivning) : "";
  return `- [${rent(namn)}](${adress})${text ? `: ${text}` : ""}`;
}

export function byggLlmsTxt(u: LlmsUnderlag): string {
  const s = u.sajt.replace(/\/$/, "");
  const v = u.villkor;
  const rader: string[] = [
    "# Fyndplats",
    "",
    "> Fyndplats är en svensk nätbutik med möbler, heminredning, kök, trädgård, husdjur, barn, sport och verktyg."
      + ` ${v.euLager} Leveranstiden är ${v.leveranstid}. Frakten kostar ${v.fraktKr} kr och är fri över ${v.friFraktOverKr} kr.`,
    "",
    `Priser och lagerstatus ändras under dagen. Det som står på produktsidan gäller, och produktflödet nedan har aktuellt pris och lager för varje vara. ${v.retur}`,
    "",
    "## Handla",
    "",
    lank("Alla kategorier", `${s}/butik`, "ingången till hela sortimentet"),
    lank("Alla produkter", `${s}/alla-produkter`, "hela sortimentet, nyast först"),
  ];
  if (u.harRea) rader.push(lank("Rea", `${s}/rea`, "varor med sänkt pris just nu"));
  rader.push(lank("Fyndauktionen", `${s}/fyndauktion`, "dagens fynd, där priset sjunker varje timme tills någon köper"));

  if (u.kategorier.length > 0) {
    rader.push("", "## Kategorier", "");
    for (const k of u.kategorier) {
      const under = (k.subs ?? []).slice(0, UNDER_PER_AVDELNING).map((x) => x.name).join(", ");
      rader.push(lank(k.name, `${s}/kategori/${k.slug}`, under));
    }
  }

  if (u.guider.length > 0) {
    rader.push("", "## Köpguider", "", lank("Alla köpguider", `${s}/blogg`));
    for (const g of u.guider.slice(0, GUIDER_MAX)) rader.push(lank(g.title, `${s}/blogg/${g.slug}`, g.excerpt));
  }

  rader.push(
    "",
    "## Villkor och kundtjänst",
    "",
    lank("Köpvillkor", `${s}/kopvillkor`),
    lank("Returer och ångerrätt", `${s}/returer`, v.retur),
    lank("EU-lagergarantin", `${s}/eu-lager-garanti`, v.euLager),
    lank("Vanliga frågor", `${s}/vanliga-fragor`),
    lank("Spåra en order", `${s}/sparning`),
    lank("Kundtjänst", `${s}/kundtjanst`),
    lank("Kontakta oss", `${s}/kontaktaoss`),
    lank("Kundomdömen", `${s}/omdomen`),
    lank("Om Fyndplats", `${s}/omoss`),
    lank("Sekretesspolicy", `${s}/sekretesspolicy`),
    "",
    "## Maskinläsbart",
    "",
    lank("Sitemap", `${s}/sitemap.xml`, "alla sidor som får indexeras"),
    lank("Produktflöde", `${s}/feed/google.xml`, "varje vara och variant med pris, lager, bilder och länk (Google Merchant-format)"),
    "",
  );
  return rader.join("\n");
}
