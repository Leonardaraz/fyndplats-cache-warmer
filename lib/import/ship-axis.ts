// Lager-axeln ("Ships From") är ingen kundvals-axel.
//
// Bakgrund (måleritältet 1005007857803500, Leonard 2026-08-18): AliExpress
// säljer samma vara ur flera EU-lager och bakar in lagret i SKU:n. Listningen
// har fem storlekar × sex lager = trettio SKU:er, och tillägget bockar i alla
// EU-rader som default.
//
// Vad som hände utan det här steget (uppmätt på just den listningen):
//
//   25 ibockade SKU:er → 25 Wix-varianter, kvarvarande axlar: Size, Ships From
//
// Alltså en rullista "Skickas från: Frankrike / Tjeckien / Tyskland / Spanien /
// Polen" på produktsidan. Det är fel på tre sätt: kunden ska inte välja vårt
// lager, prisskillnaden mellan lager (upp till 186 USD på samma storlek) blir
// ett kundval i stället för ett inköpsbeslut, och den delade "Storlek"-listan i
// Wix fylls med varianter som är samma vara.
//
// Att det inte bitit förr är ren tur: alla 348 mappningar som bär en lager-
// axel har hittills haft EXAKT ett lager ibockat, och då plockar
// splitConstantAxes bort axeln som en spec-rad ("Skickas från: Spanien").
//
// Den här modulen rör därför BARA fallet som faktiskt är trasigt — två eller
// fler lager. Ett lager lämnas orört, precis som i dag.
//
// Sync-sidan modellerar redan samma sak: mapping-repair räknar bort lager-axeln
// ur varusignaturen (`goodsKeyFromSkuAttr`) och behandlar syskon-SKU:er i andra
// lager som failover-alternativ. Importen matchar nu den bilden i stället för
// att skapa varianter som sync anser vara samma vara.

import { isEuCustomsUnion, normalizeShipFromCode } from "../aliexpress/eu-countries";

/** Axelnamn som betyder "vilket lager", på de former AE och vår översättning
 *  faktiskt producerar. Samma uppsättning som mapping-repair och
 *  variant-reconcile filtrerar på — de tre måste hållas i synk. */
export const SHIP_AXIS_RE = /ships?\s*from|ship\s*country|skickas\s*från|levereras\s*från|发货地|送货|发货/i;

export function isShipAxis(name: string): boolean {
  return SHIP_AXIS_RE.test(String(name ?? ""));
}

export interface ShipAxisVariant {
  options: Record<string, string>;
  costUsd?: number;
  stock?: number;
  shipFrom?: string;
}

export interface CollapseShipAxisResult<V> {
  /** Varianterna att importera — högst en per vara. Det valda lagret ligger på
   *  `shipFrom` även när indata saknade fältet (axeln bar då koden). */
  variants: Array<V & { shipFrom?: string }>;
  /** Distinkta lagerkoder bland de BEHÅLLNA varianterna. */
  warehouses: string[];
  /** Antal SKU:er som föll bort som dubbletter av samma vara i annat lager. */
  collapsed: number;
  /** true = vi rörde något (flera lager fanns). */
  applied: boolean;
}

/** Varans identitet utan lager-axeln: "Size=33ft" oavsett vilket land. */
function goodsSignature(options: Record<string, string>): string {
  return Object.entries(options ?? {})
    .filter(([axis, v]) => !isShipAxis(axis) && String(v ?? "").trim())
    .map(([axis, v]) => `${axis.trim().toLowerCase()}=${String(v).trim().toLowerCase()}`)
    .sort()
    .join(";");
}

/** Lagerkoden för en variant: fältet shipFrom om satt, annars axelns värde. */
function shipCode(v: ShipAxisVariant): string {
  const raw =
    v.shipFrom || Object.entries(v.options ?? {}).find(([axis]) => isShipAxis(axis))?.[1];
  return normalizeShipFromCode(raw);
}

/**
 * Väljer lager bland SKU:er som är samma vara.
 *
 * Ordning: saldo först, TULLUNIONEN före allt annat, därefter LÄGST inköpspris.
 * Samma rangordning som sync:ens `sortByWarehousePreference`, med priset som ny
 * sista grund — vid import har vi ett val att göra som sync inte har, och två
 * lager med samma vara skiljer sig bara i vad varan kostar oss.
 *
 * TULLUNIONEN, INTE `isEuCountry` (Leonards rapport 2026-08-21). Den här raden
 * poängsatte tidigare på `isEuCountry`, som betyder "snabb leverans" och räknar
 * in GB och NO. Ett brittiskt lager rankades alltså exakt lika bra som ett
 * spanskt — trots tulldeklaration och importmoms för en svensk kund, kostnader
 * som aldrig syns i marginalen. Lagerbytet vid slutsålt filtrerade redan rätt;
 * det var importen som valde fel. Nu läser båda samma lista.
 *
 * Saldo som saknas räknas som "i lager": annars skulle degraderad AE-data
 * straffa alla kandidater lika godtyckligt (lärdomen från audit 2026-08-09,
 * där ren EU-först låste en variant på ett tomt lager).
 */
function pickWarehouse<V extends ShipAxisVariant>(candidates: V[]): V {
  const score = (v: V) =>
    (typeof v.stock !== "number" || v.stock > 0 ? 2 : 0) + (isEuCustomsUnion(shipCode(v)) ? 1 : 0);
  return [...candidates].sort((a, b) => {
    const d = score(b) - score(a);
    if (d) return d;
    const ca = Number(a.costUsd);
    const cb = Number(b.costUsd);
    const aOk = Number.isFinite(ca) && ca > 0;
    const bOk = Number.isFinite(cb) && cb > 0;
    if (aOk && bOk && ca !== cb) return ca - cb;
    if (aOk !== bOk) return aOk ? -1 : 1;
    return 0; // stabil sort → först sedd vinner
  })[0];
}

/**
 * Slår ihop SKU:er som är samma vara i olika lager till en variant per vara.
 *
 * Rör INGENTING när listningen bara har ett lager — då är dagens väg redan
 * rätt (splitConstantAxes gör axeln till en spec-rad "Skickas från: Spanien").
 *
 * När flera lager finns:
 *   • en variant per vara behålls, vald av pickWarehouse,
 *   • varje behållen variant får sitt lager i `shipFrom` (per variant — olika
 *     storlekar kan mycket väl ha olika billigaste lager),
 *   • lager-axeln tas bort ur `options` om de behållna varianterna INTE delar
 *     lager. Delar de lager lämnas axeln kvar, så splitConstantAxes gör sin
 *     spec-rad precis som vanligt och kunden får se varifrån det skickas.
 *
 * Deterministisk. Muterar aldrig indata.
 */
export function collapseShipFromAxis<V extends ShipAxisVariant>(
  variants: readonly V[],
): CollapseShipAxisResult<V> {
  const tom: CollapseShipAxisResult<V> = {
    variants: [...variants],
    warehouses: [],
    collapsed: 0,
    applied: false,
  };
  if (!variants?.length) return tom;

  const harAxel = variants.some((v) => Object.keys(v.options ?? {}).some(isShipAxis));
  if (!harAxel) return tom;

  const distinkta = new Set(variants.map(shipCode).filter(Boolean));
  // Ett (eller inget läsbart) lager → dagens beteende, orört.
  if (distinkta.size <= 1) {
    return { ...tom, warehouses: [...distinkta] };
  }

  const grupper = new Map<string, V[]>();
  for (const v of variants) {
    const nyckel = goodsSignature(v.options);
    const g = grupper.get(nyckel);
    if (g) g.push(v);
    else grupper.set(nyckel, [v]);
  }

  const valda = [...grupper.values()].map((g) => {
    const vald = pickWarehouse(g);
    return { ...vald, shipFrom: shipCode(vald) || vald.shipFrom } as V;
  });

  const kvarvarandeLager = new Set(valda.map(shipCode).filter(Boolean));
  const behållAxeln = kvarvarandeLager.size <= 1;

  const ut = behållAxeln
    ? valda
    : valda.map((v) => {
        const options: Record<string, string> = {};
        for (const [axis, value] of Object.entries(v.options ?? {})) {
          if (!isShipAxis(axis)) options[axis] = value;
        }
        return { ...v, options } as V;
      });

  return {
    variants: ut,
    warehouses: [...kvarvarandeLager],
    collapsed: variants.length - ut.length,
    applied: true,
  };
}
