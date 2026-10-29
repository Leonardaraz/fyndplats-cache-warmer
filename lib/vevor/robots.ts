// VEVOR:s robots.txt: vad läsaren får hämta. Läses om en gång per dygn.
//
// Leonard 2026-10-28: "Läs aldrig spärrade sökvägar och aldrig /api/*."
// Spärrarna läses ur VEVOR:s egen robots.txt, inte bara ur en lista i koden:
// lägger VEVOR till en spärr gäller den senast ett dygn senare. Det som stod i
// filen 2026-10-29, och /api/*, ligger dessutom kvar fast i `tillatenSokvag`
// (lib/vevor/hamtning.ts).
//
// Reglerna följer RFC 9309:
//   - gruppen för vår produkttoken (FyndplatsBot) gäller om filen har en,
//     annars gruppen för `*`. Googlebots grupp gäller alltså inte oss, men
//     /api/* är spärrat ändå (Leonard).
//   - den längsta matchande regeln vinner. Vid lika längd vinner Allow.
//   - `*` matchar vad som helst och `$` sist betyder slutet.
//   - en robots.txt som saknas (404, 410) betyder att allt är tillåtet.
//   - en robots.txt som inte går att läsa (5xx, nätfel) betyder att ingenting
//     är tillåtet. Läsaren läser då ingenting den körningen.
//
// Crawl-delay står inte i RFC 9309, men läsaren följer den om VEVOR sätter en.
// Den blir då minsta tid mellan två anrop, men aldrig under en sekund.
//
// Uppmätt 2026-10-29: filen har grupper för `*`, facebookcatalog och Googlebot.
// `*` spärrar /products/*, /collections/*, /product/*, wp-katalogerna och
// sorterings- och filterfrågor. Produktsidorna med `?lang=sv&currency=SEK`,
// sajtkartan och robots.txt är tillåtna.

export const ROBOTS_SOKVAG = "/robots.txt";

/** Vår produkttoken. Står först i User-Agent (lib/vevor/hamtning.ts). */
export const PRODUKTTOKEN = "FyndplatsBot";

/** Så mycket av filen som läses. RFC 9309 kräver minst 500 KiB. */
export const MAX_ROBOTS_BYTE = 512_000;

export interface Robotsregel {
  tillat: boolean;
  monster: string;
}

/** Reglerna som gäller oss. */
export interface Robotsregler {
  regler: Robotsregel[];
  crawlDelaySek: number | null;
}

interface Grupp {
  agenter: string[];
  regler: Robotsregel[];
  crawlDelaySek: number | null;
}

/** Filens grupper, i ordning. Rader före första User-agent hör inte till någon grupp. */
export function tolkaRobots(text: string): Grupp[] {
  const grupper: Grupp[] = [];
  let aktuell: Grupp | null = null;
  let iAgentrader = false;
  for (const radRa of text.slice(0, MAX_ROBOTS_BYTE).split(/\r\n|\r|\n/)) {
    const rad = radRa.replace(/#.*$/, "").trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(rad);
    if (!m) continue;
    const nyckel = m[1].toLowerCase();
    const varde = m[2].trim();
    if (nyckel === "user-agent") {
      // Flera User-agent-rader i följd delar grupp.
      if (!aktuell || !iAgentrader) {
        aktuell = { agenter: [], regler: [], crawlDelaySek: null };
        grupper.push(aktuell);
      }
      aktuell.agenter.push(varde);
      iAgentrader = true;
      continue;
    }
    if (nyckel === "sitemap") continue;
    iAgentrader = false;
    if (!aktuell) continue;
    if (nyckel === "allow" || nyckel === "disallow") {
      // En tom Disallow spärrar ingenting.
      if (varde !== "") aktuell.regler.push({ tillat: nyckel === "allow", monster: varde });
    } else if (nyckel === "crawl-delay") {
      const sek = Number(varde);
      if (Number.isFinite(sek) && sek >= 0) aktuell.crawlDelaySek = sek;
    }
  }
  return grupper;
}

/** Produkttokenen ur en User-agent-rad: de inledande bokstäverna, `_` och `-`. */
function token(varde: string): string {
  return (/^[A-Za-z_-]+/.exec(varde)?.[0] ?? varde).toLowerCase();
}

/** Reglerna för oss: våra egna grupper om filen har några, annars `*`. Inga grupper = inga regler. */
export function reglerFor(grupper: Grupp[], produkttoken = PRODUKTTOKEN): Robotsregler {
  const vart = produkttoken.toLowerCase();
  const egna = grupper.filter((g) => g.agenter.some((a) => token(a) === vart));
  const valda = egna.length > 0 ? egna : grupper.filter((g) => g.agenter.some((a) => a.trim() === "*"));
  let crawlDelaySek: number | null = null;
  for (const g of valda) {
    if (g.crawlDelaySek !== null) crawlDelaySek = Math.max(crawlDelaySek ?? 0, g.crawlDelaySek);
  }
  return { regler: valda.flatMap((g) => g.regler), crawlDelaySek };
}

/**
 * Matchar mönstret sökvägen? `*` är vad som helst, `$` sist är slutet, och
 * resten jämförs tecken för tecken från början. Utan reguljära uttryck: ett
 * mönster med många `*` kan inte få matchningen att skena.
 */
export function passar(monster: string, vag: string): boolean {
  const ankrad = monster.endsWith("$");
  const delar = (ankrad ? monster.slice(0, -1) : monster).split("*");
  if (!vag.startsWith(delar[0])) return false;
  let pos = delar[0].length;
  if (delar.length === 1) return !ankrad || pos === vag.length;
  for (let i = 1; i < delar.length - 1; i++) {
    const j = vag.indexOf(delar[i], pos);
    if (j < 0) return false;
    pos = j + delar[i].length;
  }
  const sista = delar[delar.length - 1];
  if (ankrad) return vag.length - sista.length >= pos && vag.endsWith(sista);
  return vag.indexOf(sista, pos) >= 0;
}

/** Får sökvägen (med fråga) hämtas enligt reglerna? robots.txt själv är alltid tillåten. */
export function tillatenAvRobots(r: Robotsregler, vagMedFraga: string): boolean {
  if (vagMedFraga === ROBOTS_SOKVAG) return true;
  let basta: Robotsregel | null = null;
  for (const regel of r.regler) {
    if (!passar(regel.monster, vagMedFraga)) continue;
    if (
      !basta ||
      regel.monster.length > basta.monster.length ||
      (regel.monster.length === basta.monster.length && regel.tillat && !basta.tillat)
    ) {
      basta = regel;
    }
  }
  return !basta || basta.tillat;
}
