// lib/kassa/epost-forslag.ts
//
// "Menade du namn@gmail.com?" under e-postfältet i kassan. En felstavad adress
// betyder att orderbekräftelsen, kvittot och spårningslänken aldrig kommer
// fram, och kunden hör av sig först när paketet dröjer. Förslaget är bara ett
// förslag: kunden väljer det med ett tryck eller struntar i det.
//
// Försiktigt med flit: bara stavfel i namnet på en känd tjänst (gmial.com),
// i dess toppdomän (gmail.con), en saknad punkt (gmailcom) och domäner som
// inte finns men ofta skrivs (gmail.se). En riktig adress hos en annan tjänst
// (hotmail.dk, foretaget.se) får aldrig något förslag.
//
// Ren modul (node --test).

/** Vanliga e-posttjänster. En adress hos någon av dem får aldrig ett förslag. */
export const KANDA_DOMANER: readonly string[] = [
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.se",
  "outlook.com",
  "live.se",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "yahoo.com",
  "yahoo.se",
  "telia.com",
  "bredband.net",
  "spray.se",
  "comhem.se",
  "bahnhof.se",
  "tele2.se",
  "gmx.com",
  "protonmail.com",
  "proton.me",
];

/** Domäner som inte är e-posttjänster men ofta skrivs i stället för en. */
const FINNS_INTE: Record<string, string> = {
  "gmail.se": "gmail.com",
  "gmail.nu": "gmail.com",
  "icloud.se": "icloud.com",
};

/** Felskrivna toppdomäner, per rätt toppdomän. */
const TOPPDOMAN_FEL: Record<string, readonly string[]> = {
  com: ["con", "cm", "co", "om", "cpm", "vom", "xom", "comm", "cim", "clm", "ocm", "coom", "c0m", "cmo"],
  se: ["s", "es", "see", "sse"],
  net: ["ne", "nt", "nett", "met", "bet", "ner"],
  me: ["m", "em"],
};

/**
 * Antal ändringar mellan två ord: infoga, ta bort, byta eller byta plats på
 * två bokstäver bredvid varandra ("gmial" → "gmail" är en).
 */
export function avstand(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const kostnad = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + kostnad);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** Namnet och toppdomänen: "gmail.com" → ["gmail", "com"]. Utan punkt: [hela, ""]. */
function delar(doman: string): [string, string] {
  const p = doman.lastIndexOf(".");
  return p < 0 ? [doman, ""] : [doman.slice(0, p), doman.slice(p + 1)];
}

/**
 * Hur många fel namnet på en känd tjänst får ha. Inga alls i namn på fyra
 * bokstäver eller färre (live, msn, me): love.se är inte live.se. Ett i namn
 * på fem eller sex (gmail, icloud), två i längre (hotmail, outlook).
 */
const maxNamnFel = (namn: string) => (namn.length <= 4 ? 0 : namn.length <= 6 ? 1 : 2);

/** Den kända tjänst som domänen troligen skulle vara, eller null. */
function rattDoman(doman: string, kanda: readonly string[]): string | null {
  if (kanda.includes(doman)) return null;
  if (FINNS_INTE[doman]) return FINNS_INTE[doman];
  const [namn, topp] = delar(doman);
  const traffar = new Set<string>();
  for (const k of kanda) {
    const [kNamn, kTopp] = delar(k);
    // Punkten saknas: "gmailcom".
    if (!topp && namn === kNamn + kTopp) {
      traffar.add(k);
      continue;
    }
    const namnFel = avstand(namn, kNamn);
    const toppRatt = topp === kTopp;
    const toppFelskriven = (TOPPDOMAN_FEL[kTopp] ?? []).includes(topp);
    // Stavfel i namnet, rätt toppdomän: "gmial.com", "hotmial.se".
    if (toppRatt && namnFel >= 1 && namnFel <= maxNamnFel(kNamn)) traffar.add(k);
    // Felskriven toppdomän, namnet rätt eller nästan: "gmail.con", "gmial.con".
    else if (toppFelskriven && namnFel <= 1) traffar.add(k);
  }
  // Två lika troliga tjänster: hellre inget förslag än fel förslag.
  return traffar.size === 1 ? [...traffar][0] : null;
}

/**
 * Förslaget till kunden: hela adressen med rättad domän, eller null. Delen före
 * @ lämnas som kunden skrev den; domänen skrivs med gemener. `kanda` är listan
 * över tjänster (proven skickar en egen).
 */
export function epostForslag(epost: string, kanda: readonly string[] = KANDA_DOMANER): string | null {
  const v = epost.trim();
  const at = v.lastIndexOf("@");
  if (at < 1 || at === v.length - 1 || /\s/.test(v)) return null;
  const lokal = v.slice(0, at);
  const doman = v.slice(at + 1).toLowerCase();
  const ratt = rattDoman(doman, kanda);
  return ratt && ratt !== doman ? `${lokal}@${ratt}` : null;
}
