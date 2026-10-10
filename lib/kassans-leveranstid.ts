// lib/kassans-leveranstid.ts
// Wix-kassans leveransval visar fraktalternativets `estimatedDeliveryTime` under
// namnet "Spårbar standardleverans". Där stod "3–6 arbetsdagar". Jobbet
// app/api/cron/leveransdatum-kassan skriver i stället samma datumintervall som
// produktsidan och varukorgen visar, "Beräknad leverans ons 14 – mån 19 oktober",
// och byter det när det svenska dygnet byts. Texten följer också med ordern.
//
// Uppmätt 2026-10-09 mot skarpa Wix: en PATCH med bara id, revision och
// estimatedDeliveryTime byter texten och lämnar priserna (19 kr, 0 kr från
// 500 kr), namnet och regionen orörda. Ändå läses alternativet om efter varje
// skrivning och jämförs med hur det såg ut före: ett alternativ utan priser är en
// kassa där ingen kan betala. Ändrades priserna läggs de gamla tillbaka direkt.
//
// Filen har inga importer, så att testerna kan köra den direkt. Wix-anropen
// skickas in.

export type Fraktalternativ = {
  id: string;
  revision: string;
  title?: string;
  estimatedDeliveryTime?: string;
  rates?: unknown;
  deliveryRegionIds?: unknown;
};

export type KassansLeveranstidDeps = {
  /** Alla fraktalternativ (Query Shipping Options). */
  lasAlla(): Promise<Fraktalternativ[]>;
  /** Ett alternativ, läst för sig efter skrivningen (Get Shipping Option). */
  las(id: string): Promise<Fraktalternativ>;
  /** Skriver bara texten: id, revision och estimatedDeliveryTime. */
  skrivText(id: string, revision: string, text: string): Promise<void>;
  /** Lägger tillbaka priserna som lästes före skrivningen. */
  aterstallPriser(id: string, revision: string, rates: unknown): Promise<void>;
};

export type Utfall = {
  /** "oforandrad" när allt redan stod rätt, "fel" så fort något gick snett. */
  status: "oforandrad" | "skriven" | "fel";
  text: string;
  skrivna: { id: string; fore: string }[];
  fel: string[];
};

export const LEVERANS_PREFIX = "Beräknad leverans";

export function kassansLeveranstext(intervall: string): string {
  return `${LEVERANS_PREFIX} ${intervall}`;
}

/**
 * Alternativen vars text jobbet äger: de som bär jobbets egen text, eller den
 * som stod där före jobbet ("3–6 arbetsdagar", med eller utan tankstreck). Ett
 * annat alternativ, till exempel ett expressval med en egen tid, rörs aldrig.
 */
export function agsAvJobbet(text: string | undefined, minDagar: number, maxDagar: number): boolean {
  if (!text) return false;
  if (text.startsWith(`${LEVERANS_PREFIX} `)) return true;
  return text === `${minDagar}–${maxDagar} arbetsdagar` || text === `${minDagar}-${maxDagar} arbetsdagar`;
}

/** JSON med sorterade nycklar, så att samma värde alltid ger samma sträng. */
function kanonisk(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(kanonisk).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${kanonisk(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

export async function uppdateraKassansLeveranstid(
  text: string,
  minDagar: number,
  maxDagar: number,
  deps: KassansLeveranstidDeps,
): Promise<Utfall> {
  const utfall: Utfall = { status: "oforandrad", text, skrivna: [], fel: [] };
  const alla = await deps.lasAlla();
  const vara = alla.filter((a) => agsAvJobbet(a.estimatedDeliveryTime, minDagar, maxDagar));
  if (vara.length === 0) {
    // Någon har skrivit en egen text i Wix, eller alternativet är borta. Hellre
    // ett fel varje timme än att skriva över ett beslut.
    utfall.status = "fel";
    utfall.fel.push(`inget fraktalternativ bär jobbets text (${alla.length} alternativ lästa)`);
    return utfall;
  }

  for (const fore of vara) {
    if (fore.estimatedDeliveryTime === text) continue;
    try {
      await deps.skrivText(fore.id, fore.revision, text);
      const efter = await deps.las(fore.id);
      if (kanonisk(efter.rates) !== kanonisk(fore.rates)) {
        utfall.fel.push(`${fore.id}: priserna ändrades av skrivningen, lägger tillbaka dem`);
        await deps.aterstallPriser(efter.id, efter.revision, fore.rates);
        const igen = await deps.las(fore.id);
        if (kanonisk(igen.rates) !== kanonisk(fore.rates)) {
          utfall.fel.push(`${fore.id}: KRITISKT, priserna gick inte att lägga tillbaka`);
        }
        continue;
      }
      if (efter.estimatedDeliveryTime !== text) {
        utfall.fel.push(`${fore.id}: läste tillbaka "${efter.estimatedDeliveryTime ?? ""}", inte texten`);
        continue;
      }
      if (efter.title !== fore.title || kanonisk(efter.deliveryRegionIds) !== kanonisk(fore.deliveryRegionIds)) {
        utfall.fel.push(`${fore.id}: namnet eller regionen ändrades av skrivningen`);
        continue;
      }
      utfall.skrivna.push({ id: fore.id, fore: fore.estimatedDeliveryTime ?? "" });
    } catch (err) {
      utfall.fel.push(`${fore.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (utfall.fel.length > 0) utfall.status = "fel";
  else if (utfall.skrivna.length > 0) utfall.status = "skriven";
  return utfall;
}
