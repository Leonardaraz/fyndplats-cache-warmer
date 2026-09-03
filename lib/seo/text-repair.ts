// Städar PUBLICERAD produkttext, hela katalogen igenom.
//
// Två saxar, båda hittade av svep och ingen av dem av en spärr:
//
//   1. Leverantörskoder (`leverantorskod.ts`) — 51 sidor 2026-09-03. Numret gör
//      våra sidor joinbara mot dealproffsens JSON-LD och därmed mot vad vi
//      betalar. Saxen TAR BORT en rad.
//      ☠️ Och en gång till samma dag, efter att svepet rapporterat "0 träffar":
//      saxen var blind för råimportens bockade form. Sedan dess bär svaret
//      `kodIText` — sidor som bär en kod EFTER saxen — så nästa blinda fläck
//      syns i siffrorna i stället för att räknas som en ren katalog.
//   2. Trasiga syskonlänkar (`relativa-lankar.ts`) — Wix skriver om en
//      rotrelativ `href="/produkt/x"` till `https:/produkt/x`, alltså
//      värdnamnet `produkt`. Saxen SKRIVER OM en href.
//
// Systerverktyg till `price-repair` och `aosom-image-repair`, byggd efter samma
// tre husregler:
//
//   1. Torrkörning är default. Utan `?dryRun=false` skrivs ingenting.
//   2. ☠️ Ett svar utan fel är inget kvitto. Varje skrivning läses TILLBAKA och
//      räknas efter; `lagade` stiger först när texten faktiskt är ren.
//   3. Spärren står mot MASSFEL, inte mot enskilda fel.

import { barKod, hittaKodrader, taBortKodrader } from "./leverantorskod";
import { hittaTrasigaLankar, lagaTrasigaLankar } from "./relativa-lankar";

export interface TextProdukt {
  id: string;
  slug: string;
  name: string;
  visible: boolean;
  plainDescription: string;
}

export interface TextRepairDeps {
  /** En sida ur katalogen. `cursor` saknas när listningen är slut. */
  listaProdukter(cursor?: string): Promise<{ produkter: TextProdukt[]; cursor?: string }>;
  /** Läser tillbaka EN produkt efter en skrivning — kvittot. */
  hamtaProdukt(id: string): Promise<{ revision: string; name: string; plainDescription: string } | null>;
  skrivBeskrivning(id: string, revision: string, html: string): Promise<{ revision: string }>;
  /** Produktens revision behövs för skrivningen och kommer inte ur listningen. */
  hamtaRevision(id: string): Promise<string | null>;
  nu(): number;
}

export interface TextTraff {
  wixProductId: string;
  slug: string;
  namn: string;
  kodrader: string[];
  trasigaLankar: string[];
}

export interface TextRepairSummary {
  torrkorning: boolean;
  lasta: number;
  traffar: number;
  medKod: number;
  medTrasigLank: number;
  lagade: number;
  misslyckade: number;
  /** Sidor där koden syns i NAMNET eller slug:en — kan inte lagas automatiskt. */
  kodINamn: string[];
  /**
   * ☠️ Sidor vars BESKRIVNING bär en kod som saxen inte når.
   *
   * Utan den här listan är detektorns blinda fläck osynlig: saknar `hittaKodrader`
   * en form räknas sidan varken som träff eller som problem, och svepet svarar
   * "0 träffar" — exakt det falska friskintyg som 2026-09-03 dolde en bockad rad
   * (`<li><p>✔ Artikelnummer: …</p></li>`) i katalogen. `barKod` läser HELA
   * fältet och delar inte antagande med saxen, så en kod saxen missar hamnar här
   * i stället för i tystnaden. Lagas av en människa, aldrig automatiskt.
   */
  kodIText: string[];
  plan: TextTraff[];
  fel: string[];
  cursor: string | null;
  fullstandig: boolean;
}

/**
 * ☠️ Över den här andelen KODTRÄFFAR är saxen trasig, inte katalogen.
 *
 * Mätt 2026-09-03: 51 av 1 627 publicerade sidor, alltså 3 %. En regex som
 * tappat sitt värdemönster matchar i stället varje spec-rad — och en körning
 * hade då tömt specifikationerna i hela butiken.
 *
 * Taket gäller MEDVETET bara kodsaxen. Länkfixen tar inte bort någonting: den
 * sätter tillbaka ett värdnamn, är idempotent, och en hög andel där betyder
 * bara att felet är utbrett — vilket är ett skäl att köra, inte att stoppa.
 */
export const MAX_ANDEL_KODTRAFFAR = 0.25;

/** Under så här få lästa produkter säger andelen ingenting. */
const MIN_LASTA_FOR_ANDEL = 50;

const TIDSBUDGET_MS = 240_000;

function liRader(html: string): number {
  return (html.match(/<li>/g) ?? []).length;
}

/** Saxarna i ordning. Exporterad så ett test kan visa att den är idempotent. */
export function stada(html: string): string {
  return lagaTrasigaLankar(taBortKodrader(html));
}

export async function runTextRepair(
  deps: TextRepairDeps,
  opts: { dryRun?: boolean; limit?: number; after?: string; onlyPublished?: boolean } = {},
): Promise<TextRepairSummary> {
  const torrkorning = opts.dryRun !== false;
  const tak = opts.limit && opts.limit > 0 ? opts.limit : Infinity;
  const endastPublicerade = opts.onlyPublished !== false;
  const start = deps.nu();

  const sum: TextRepairSummary = {
    torrkorning,
    lasta: 0,
    traffar: 0,
    medKod: 0,
    medTrasigLank: 0,
    lagade: 0,
    misslyckade: 0,
    kodINamn: [],
    kodIText: [],
    plan: [],
    fel: [],
    cursor: null,
    fullstandig: false,
  };

  let cursor = opts.after;
  for (let sida = 0; sida < 400; sida++) {
    if (deps.nu() - start > TIDSBUDGET_MS) {
      sum.cursor = cursor ?? null;
      return sum;
    }

    const { produkter, cursor: nasta } = await deps.listaProdukter(cursor);

    // ☠️ HELA SIDAN LÄSES FÖRE FÖRSTA SKRIVNINGEN, och det är inte en stilfråga.
    // Massfel-spärren kan bara skydda det som ännu inte skrivits — körs den mitt
    // i en skrivslinga hinner en trasig sax rensa halva sidan innan andelen ens
    // går att räkna. Testet visade 49 skrivningar innan spärren fällde.
    const attLaga: { p: TextProdukt; kodrader: string[]; lankar: string[] }[] = [];
    for (const p of produkter) {
      if (endastPublicerade && !p.visible) continue;
      sum.lasta++;
      // Koden i NAMNET eller slug:en är inte en rad att klippa — den kräver en
      // människa som skriver om rubriken. Rapporteras, lagas inte.
      if (barKod(p.name, p.slug)) sum.kodINamn.push(p.slug);

      const kodrader = hittaKodrader(p.plainDescription);
      const lankar = hittaTrasigaLankar(p.plainDescription);

      // ☠️ Frågan är inte "hittade saxen något?" utan "är texten ren EFTER
      // saxen?". De två är olika frågor så fort saxen har en blind fläck, och
      // bara den andra kan avslöja att den har en.
      if (barKod(taBortKodrader(p.plainDescription))) sum.kodIText.push(p.slug);

      if (kodrader.length === 0 && lankar.length === 0) continue;

      sum.traffar++;
      if (kodrader.length) sum.medKod++;
      if (lankar.length) sum.medTrasigLank++;
      sum.plan.push({
        wixProductId: p.id,
        slug: p.slug,
        namn: p.name,
        kodrader,
        trasigaLankar: lankar,
      });
      attLaga.push({ p, kodrader, lankar });
    }

    if (sum.lasta >= MIN_LASTA_FOR_ANDEL && sum.medKod / sum.lasta > MAX_ANDEL_KODTRAFFAR) {
      throw new Error(
        `Massfel: ${sum.medKod} kodträffar på ${sum.lasta} lästa produkter `
          + `(${Math.round((sum.medKod / sum.lasta) * 100)} %, tak ${Math.round(MAX_ANDEL_KODTRAFFAR * 100)} %). `
          + "Saxen är trasig — ingenting skrivet.",
      );
    }

    if (!torrkorning) {
      for (const { p, kodrader } of attLaga) {
        if (sum.lagade + sum.misslyckade >= tak) break;
        if (deps.nu() - start > TIDSBUDGET_MS) break;
        try {
          const ny = stada(p.plainDescription);
          const tappade = liRader(p.plainDescription) - liRader(ny);
          if (tappade !== kodrader.length) {
            throw new Error(`saxen tog ${tappade} li-rader men hittade ${kodrader.length}`);
          }
          const revision = await deps.hamtaRevision(p.id);
          if (!revision) throw new Error("ingen revision");
          await deps.skrivBeskrivning(p.id, revision, ny);

          // ☠️ KVITTOT. Skrivningen kan svara OK utan att ta — ett globalt
          // SYNC_DRY_RUN sväljer den till exempel tyst. Först läsningen räknas.
          const efter = await deps.hamtaProdukt(p.id);
          if (!efter) throw new Error("kunde inte läsas tillbaka");
          if (hittaKodrader(efter.plainDescription).length > 0) {
            throw new Error("koden står kvar efter skrivningen");
          }
          if (hittaTrasigaLankar(efter.plainDescription).length > 0) {
            throw new Error("den trasiga länken står kvar efter skrivningen");
          }
          if (liRader(efter.plainDescription) !== liRader(ny)) {
            throw new Error("antalet li-rader stämmer inte efter skrivningen");
          }
          sum.lagade++;
        } catch (e) {
          sum.misslyckade++;
          sum.fel.push(`${p.slug}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    cursor = nasta;
    if (!produkter.length || !nasta) {
      sum.fullstandig = true;
      sum.cursor = null;
      return sum;
    }
  }

  sum.cursor = cursor ?? null;
  return sum;
}

/**
 * Skarpa beroenden mot Wix.
 *
 * ☠️ `fields: ["PLAIN_DESCRIPTION"]` MÅSTE med. Utan fältet svarar V3 med en
 * produkt vars `plainDescription` är tom — inte ett fel, bara en tystare
 * projektion — och då ser hela katalogen ren ut. Samma fälla som
 * `getProductMedia` gick i med `MEDIA_ITEMS_INFO`.
 */
export async function liveDeps(): Promise<TextRepairDeps> {
  const { WIX_BASE, wixHeaders, getProductForEnrich, updateProductDescription } = await import(
    "@/lib/wix/client"
  );

  return {
    async listaProdukter(cursor?: string) {
      const cursorPaging: Record<string, unknown> = { limit: 100 };
      if (cursor) cursorPaging.cursor = cursor;
      const res = await fetch(`${WIX_BASE}/stores/v3/products/search`, {
        method: "POST",
        headers: wixHeaders(),
        body: JSON.stringify({ fields: ["PLAIN_DESCRIPTION"], search: { cursorPaging } }),
      });
      if (!res.ok) {
        throw new Error(
          `Wix product-search misslyckades (${res.status}): ${(await res.text()).slice(0, 300)}`,
        );
      }
      const data = (await res.json()) as {
        products?: Array<{
          id?: string;
          slug?: string;
          name?: string;
          visible?: boolean;
          plainDescription?: string;
        }>;
        pagingMetadata?: { cursors?: { next?: string } };
      };
      return {
        produkter: (data.products ?? [])
          .filter((p): p is { id: string } & typeof p => Boolean(p.id))
          .map((p) => ({
            id: p.id,
            slug: p.slug ?? "",
            name: p.name ?? "",
            visible: p.visible !== false,
            plainDescription: p.plainDescription ?? "",
          })),
        cursor: data.pagingMetadata?.cursors?.next,
      };
    },
    async hamtaRevision(id) {
      return (await getProductForEnrich(id))?.revision ?? null;
    },
    async hamtaProdukt(id) {
      const p = await getProductForEnrich(id);
      return p ? { revision: p.revision, name: p.name, plainDescription: p.plainDescription } : null;
    },
    async skrivBeskrivning(id, revision, html) {
      return updateProductDescription(id, revision, html);
    },
    nu: () => Date.now(),
  };
}
