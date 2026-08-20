// lib/sync/warehouse-failover.ts
//
// LAGERBYTE NÄR VÅRT LAGER ÄR SLUT (men varan finns kvar i ett annat).
//
// AliExpress bakar in lagerlandet i själva SKU:n: "rosa garderob från Tyskland"
// och "rosa garderob från Spanien" är olika SKU:er med olika saldo och olika
// pris. Vid import sparar vi EN av dem. Synken speglar sedan just den SKU:ns
// saldo till Wix (resolveInventoryQuantities) — så när det tyska lagret tar
// slut blir varan slutsåld i butiken trots att säljaren har 42 kvar i Spanien
// och skickar därifrån till Sverige. Det är Leonards rapport 2026-08-20.
//
// Att bara VISA syskonets saldo vore fel: kundordern läggs fortfarande på vår
// sparade SKU, som är tom, och skulle avvisas i kassan hos AE. Därför pekar vi
// om mappningen i stället — då blir både lagersiffran och nästa order rätt.
//
// Samma manöver som fraktbarhetskontrollens failover (lib/sync/shippability.ts),
// men med en annan utlösare: den byter när lagret svarar NEJ på frakt, vi byter
// när lagret är TOMT. Syskonen hittas med samma funktion, warehouseAlternativeSkuIds.
//
// TRE SPÄRRAR, för att bytet inte ska kosta mer än det smakar:
//
//   1. BARA EU-LAGER. Ett amerikanskt lager kan ha 500 i saldo, men mot en
//      svensk kund betyder det tull och veckor i transit — en annan produkt i
//      praktiken. (Notera att isEuCountry här betyder "snabb leverans" och
//      inkluderar GB/NO, som ligger utanför tullunionen. Därför filtrerar vi på
//      EU_TULL, inte på isEuCountry.)
//
//   2. BARA MED KÄNT PRIS. Priset skiljer mellan lagren — i Leonards skärmbild
//      $113,74 från USA mot $119,99 inom EU. Byter vi utan att veta det nya
//      priset står `landedCostSek` kvar på det gamla, och då ljuger både
//      lönsamhetsöversikten och auktionens golvpris (lib/auction/seed.ts räknar
//      sitt lägsta bud ur just det fältet).
//
//   3. BARA OM MARGINALEN HÅLLER. Ett dyrare lager äter marginalen utan att
//      priset ändras. Att sälja med förlust är ett sämre utfall än att vara
//      slutsåld en vecka — så under golvet byter vi inte, vi rapporterar i
//      stället att det finns ett syskon att ta ställning till.
//
// Modulen är REN: inga anrop, ingen tid, inget I/O. Anroparen matar in
// mappningens varianter och DS-svarets SKU:er och får tillbaka nya varianter
// plus en beskrivning av vad som hände.

import { warehouseAlternativeSkuIds, type RepairDsVariant } from "./mapping-repair";
import { normalizeShipFromCode } from "../aliexpress/eu-countries";
import { namedValuesFromVariantId } from "../aliexpress/freight";

/**
 * EU:s TULLUNION — inte samma sak som `isEuCountry`, som betyder "snabb
 * leverans till Sverige" och därför räknar in GB och NO. För ett automatiskt
 * lagerbyte är tullfrågan det som avgör: en vara från Storbritannien kan bli
 * dyrare för kunden i tullen, och det priset syns aldrig i vår marginal.
 */
const EU_TULL = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR",
  "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK",
]);

/** Lägsta marginal (netto mot netto) vi accepterar efter ett byte. */
export const MIN_FAILOVER_MARGIN_PCT = 5;

/** Momssats på inköp och försäljning — samma antagande som lib/auction/seed.ts. */
const VAT_RATE = 0.25;

export interface FailoverVariant {
  supplierVariantId: string;
  sku: string;
  costUsd?: number;
  landedCostSek?: number;
  grossSek?: number;
  previousSupplierVariantId?: string;
  shipFromSwitchedAt?: string;
}

export interface WarehouseSwitch {
  sku: string;
  from: string;
  to: string;
  /** Landskod för det nya lagret, när DS-svaret gav den. */
  shipFrom?: string;
  fromStock: number;
  toStock: number;
  oldCostUsd: number;
  newCostUsd: number;
  oldLandedCostSek: number;
  newLandedCostSek: number;
  /** Marginal efter bytet, netto mot netto. */
  marginPct: number;
}

/** Ett syskon fanns men bytet gjordes inte — och varför. */
export interface WarehouseSkip {
  sku: string;
  reason:
    | "okänt-lager"
    | "inget-eu-syskon"
    | "pris-okänt"
    | "marginal-för-låg";
  /** Marginalen bytet HADE gett, när den gick att räkna ut. */
  marginPct?: number;
  toStock?: number;
}

export interface WarehouseFailoverResult<V> {
  changed: boolean;
  variants: V[];
  switches: WarehouseSwitch[];
  skipped: WarehouseSkip[];
}

function shipCodeOf(d: RepairDsVariant): string {
  const rå =
    d.shipFrom ??
    Object.entries(d.skuProps ?? {}).find(([axel]) => /ship|frakt|skicka|发货/i.test(axel))?.[1];
  return normalizeShipFromCode(rå);
}

/** Marginal netto mot netto. Både pris och landad kostnad bär moms. */
export function marginEfterByte(grossSek: number, landedCostSek: number): number | null {
  if (!(grossSek > 0) || !(landedCostSek >= 0)) return null;
  const nettoIntäkt = grossSek / (1 + VAT_RATE);
  const nettoKost = landedCostSek / (1 + VAT_RATE);
  if (!(nettoIntäkt > 0)) return null;
  return ((nettoIntäkt - nettoKost) / nettoIntäkt) * 100;
}

/**
 * Pekar om varianter vars sparade lager är TOMT till ett EU-syskon som har
 * saldo — och räknar om inköpspriset i samma andetag.
 *
 * Returnerar alltid en ny lista; `changed` säger om något faktiskt ändrades.
 * Inget kastas: en produkt vars DS-svar är oläsbart lämnas orörd.
 */
export function planWarehouseFailover<V extends FailoverVariant>(
  variants: ReadonlyArray<V>,
  dsVariants: ReadonlyArray<RepairDsVariant>,
  opts: { nowIso: string; minMarginPct?: number },
): WarehouseFailoverResult<V> {
  const minMargin = opts.minMarginPct ?? MIN_FAILOVER_MARGIN_PCT;
  const ut: V[] = [...variants];
  const switches: WarehouseSwitch[] = [];
  const skipped: WarehouseSkip[] = [];

  const ds = dsVariants.filter((d) => d.skuId && String(d.skuId).trim());
  if (ds.length === 0) return { changed: false, variants: ut, switches, skipped };

  const bySkuId = new Map(ds.map((d) => [String(d.skuId), d]));
  const bySkuAttr = new Map(
    ds.filter((d) => d.skuAttr?.trim()).map((d) => [String(d.skuAttr).trim(), d]),
  );

  for (let i = 0; i < ut.length; i++) {
    const v = ut[i];
    const id = String(v.supplierVariantId ?? "").trim();
    if (!id) continue;

    // Vår sparade SKU i DS-svaret. Hittas den inte vet vi ingenting om dess
    // saldo — och att gissa "tom" vore att peka om varianter i onödan.
    const egen = bySkuId.get(id) ?? bySkuAttr.get(id);
    if (!egen) continue;

    // Okänt saldo (fältet saknas) räknas som "i lager" överallt i den här
    // kodbasen — vi byter bara på ett känt, uttryckligt noll.
    if (typeof egen.stock !== "number" || egen.stock > 0) continue;

    const syskonIds = warehouseAlternativeSkuIds(
      { skuId: String(egen.skuId), choiceValues: namedValuesFromVariantId(id) },
      ds,
    );
    // warehouseAlternativeSkuIds rankar redan saldo>0 och EU först; vi
    // filtrerar hårt på tullunionen och kräver faktiskt saldo.
    const kandidat = syskonIds
      .map((sid) => bySkuId.get(sid))
      .find(
        (d): d is RepairDsVariant =>
          !!d && typeof d.stock === "number" && d.stock > 0 && EU_TULL.has(shipCodeOf(d)),
      );

    if (!kandidat) {
      if (syskonIds.length > 0) skipped.push({ sku: v.sku, reason: "inget-eu-syskon" });
      continue;
    }

    const nyttPris = kandidat.price;
    const gammaltPris = v.costUsd;
    if (!(nyttPris && nyttPris > 0) || !(gammaltPris && gammaltPris > 0)) {
      skipped.push({ sku: v.sku, reason: "pris-okänt", toStock: kandidat.stock });
      continue;
    }

    // Landad kostnad skalas med prisförändringen. Den bär moms, frakt och
    // valutakurs som vi inte kan räkna om här — men förhållandet mellan
    // SKU-pris och landad kostnad är detsamma för två SKU:er i samma listning.
    const gammalLandad = v.landedCostSek ?? 0;
    const nyLandad = gammalLandad > 0 ? (gammalLandad * nyttPris) / gammaltPris : 0;
    const marginal = v.grossSek ? marginEfterByte(v.grossSek, nyLandad) : null;

    if (marginal !== null && marginal < minMargin) {
      skipped.push({
        sku: v.sku,
        reason: "marginal-för-låg",
        marginPct: marginal,
        toStock: kandidat.stock,
      });
      continue;
    }

    const nyttId = kandidat.skuAttr?.trim() || String(kandidat.skuId);
    ut[i] = {
      ...v,
      supplierVariantId: nyttId,
      previousSupplierVariantId: v.supplierVariantId,
      shipFromSwitchedAt: opts.nowIso,
      costUsd: nyttPris,
      ...(nyLandad > 0 ? { landedCostSek: Math.round(nyLandad * 100) / 100 } : {}),
    };
    switches.push({
      sku: v.sku,
      from: v.supplierVariantId,
      to: nyttId,
      shipFrom: shipCodeOf(kandidat) || undefined,
      fromStock: 0,
      toStock: kandidat.stock ?? 0,
      oldCostUsd: gammaltPris,
      newCostUsd: nyttPris,
      oldLandedCostSek: gammalLandad,
      newLandedCostSek: Math.round(nyLandad * 100) / 100,
      marginPct: marginal ?? 0,
    });
  }

  return { changed: switches.length > 0, variants: ut, switches, skipped };
}
