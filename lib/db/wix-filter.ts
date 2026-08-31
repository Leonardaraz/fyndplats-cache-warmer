// Översätter de Wix Data-filter vår kod FAKTISKT använder till SQL.
//
// ☠️ SMAL MED FLIT, OCH KASTAR PÅ RESTEN. En generell översättare hade blivit
// en andra frågespråksdialekt att hålla i synk — och det farliga med en
// halvfärdig sådan är inte att den kraschar, utan att den TYST ignorerar en
// term den inte förstår och returnerar fel rader. En städning som läser fel
// rader raderar fel rader.
//
// Formerna som används i kodbasen är exakt sex, alla i lib/sync/sync-log.ts:
//
//   undefined
//   { productId: "…" }                                  likhet
//   { status: "open" }                                  likhet
//   { checkedAt: { $lt: iso } }                          jämförelse
//   { actionTaken: { $in: [...] }, checkedAt: { $gt: iso } }
//   { $or: [ { listingStatus: { $in: [...] } }, { errorStreak: { $gt: 0 } } ] }
//
// Allt annat är ett fel vid utveckling, inte i drift.

/** Fält → kolumn för en tabell. Fält som saknas här går inte att filtrera på. */
export type Kolumnkarta = Record<string, string>;

export interface Villkor {
  /** SQL-fragment med $1, $2 … */
  sql: string;
  värden: unknown[];
}

/**
 * Bygger WHERE-fragmentet (utan ordet WHERE). Tomt filter ger `sql: ""`.
 *
 * `nästaIndex` är numret nästa platshållare ska få, så anroparen kan lägga till
 * egna parametrar (limit) efter villkoren.
 */
export function byggVillkor(
  filter: Record<string, unknown> | undefined,
  kolumner: Kolumnkarta,
  nästaIndex = 1,
): Villkor {
  const värden: unknown[] = [];
  let i = nästaIndex;

  function param(v: unknown): string {
    värden.push(v);
    return `$${i++}`;
  }

  function kolumn(fält: string): string {
    const k = kolumner[fält];
    if (!k) {
      throw new Error(
        `Fältet "${fält}" går inte att filtrera på här. Lägg till det i kolumnkartan `
          + "i stället för att låta filtret tyst falla bort — ett ignorerat villkor ger fel rader.",
      );
    }
    return k;
  }

  function term(fält: string, villkor: unknown): string {
    if (villkor === null || typeof villkor !== "object") {
      return `${kolumn(fält)} = ${param(villkor)}`;
    }
    const poster = Object.entries(villkor as Record<string, unknown>);
    if (poster.length !== 1) {
      throw new Error(`Villkoret på "${fält}" har ${poster.length} operatorer — stöds inte.`);
    }
    const [op, v] = poster[0];
    const k = kolumn(fält);
    switch (op) {
      case "$in":
        if (!Array.isArray(v)) throw new Error(`$in på "${fält}" är inte en lista.`);
        // = any(…) i stället för IN (…): en enda parameter oavsett listans längd.
        return `${k} = any(${param(v)})`;
      case "$gt":
        return `${k} > ${param(v)}`;
      case "$gte":
        return `${k} >= ${param(v)}`;
      case "$lt":
        return `${k} < ${param(v)}`;
      case "$lte":
        return `${k} <= ${param(v)}`;
      case "$ne":
        return `${k} is distinct from ${param(v)}`;
      default:
        throw new Error(`Operatorn "${op}" på "${fält}" stöds inte av översättaren.`);
    }
  }

  if (!filter || Object.keys(filter).length === 0) return { sql: "", värden };

  const delar: string[] = [];
  for (const [nyckel, v] of Object.entries(filter)) {
    if (nyckel === "$or") {
      if (!Array.isArray(v) || v.length === 0) throw new Error("$or måste vara en icke-tom lista.");
      const grenar = v.map((gren) => {
        const poster = Object.entries(gren as Record<string, unknown>);
        if (poster.length !== 1) throw new Error("Varje $or-gren måste ha exakt ett fält.");
        return term(poster[0][0], poster[0][1]);
      });
      delar.push(`(${grenar.join(" or ")})`);
      continue;
    }
    if (nyckel.startsWith("$")) {
      throw new Error(`Toppnivå-operatorn "${nyckel}" stöds inte av översättaren.`);
    }
    delar.push(term(nyckel, v));
  }

  return { sql: delar.join(" and "), värden };
}

/** ORDER BY-fragment. Okända fält kastar, av samma skäl som filtret. */
export function byggSortering(
  sort: { fieldName: string; order: "ASC" | "DESC" }[] | undefined,
  kolumner: Kolumnkarta,
): string {
  if (!sort || sort.length === 0) return "";
  const delar = sort.map((s) => {
    const k = kolumner[s.fieldName];
    if (!k) throw new Error(`Går inte att sortera på "${s.fieldName}" — saknas i kolumnkartan.`);
    return `${k} ${s.order === "ASC" ? "asc" : "desc"} nulls last`;
  });
  return ` order by ${delar.join(", ")}`;
}
