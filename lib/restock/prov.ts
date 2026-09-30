// Provkörningen av restock-mejlet (/api/admin/restock-prov, workflowen
// "Restock — provkör sidans cache och mejlet").
//
// Restock-mejlet har två beroenden som ingen test här kan se, bara drift:
//
//   sidan  Butikens cache för produktsidan töms före utskicket. Det kräver att
//          ADMIN_SECRET har samma värde i motorn som i butiken. De är två
//          Vercel-projekt med var sin variabel, ingenting synkar dem, och
//          värdet är märkt Sensitive, så det går inte att läsa tillbaka i
//          något av dem. Butikens proxy svarar 404 på fel nyckel och 200 på
//          rätt, så ett försök avgör saken utan att någon ser värdet.
//   mejl   Resend ska ta emot mejlet från butikens avsändare med motorns
//          nyckel. Provmejlet går genom exakt samma kod som synkerna.
//
// ☠️ PROVMEJLET GÅR BARA TILL DEN INTERNA ADRESSEN, samma som vaktens
// morgonmejl. Anropet kan inte ange någon annan mottagare.
//
// ☠️ INGEN BEVAKARE RÖRS. Mejlet går genom mejlaBevakare med en påhittad
// bevakare och en stämpling som inte gör någonting, så restock-listan är orörd.
//
// ☠️ SVARET GÅR TILL EN PUBLIK LOGG. Det bär wix-id, butikens namn, utfall och
// statuskoder, aldrig nyckeln eller en adress.

import { KUND_BRAND } from "../email/kundmejl";
import {
  butikensBas,
  diagnosUppfriskning,
  uppfriskaProduktsidaDetalj,
  type Uppfriskning,
  type UppfriskningDetalj,
} from "../headless/produktsida";
import type { V3ProduktKort } from "../wix/v3-products";
import {
  mejlaBevakare,
  restockStopp,
  standardRestockDeps,
  type RestockDeps,
  type RestockStopp,
  type RestockUtskick,
} from "./notify";

export type ProvLage = "sidan" | "mejl";

export interface ProvSvar {
  ok: boolean;
  lage: ProvLage;
  wixProductId: string;
  /** Butikens namn på varan. */
  produkt: string | null;
  /** Varför ett riktigt restock-mejl inte hade gått, om det inte hade det. */
  stopp: RestockStopp | null;
  /** Butikens domän, som motorn anropar den. */
  butik: string;
  utfall: Uppfriskning | null;
  /** Butikens svar på tömningen. */
  status: number | null;
  varmning: UppfriskningDetalj["varmning"] | null;
  diagnos: string;
  /** Bara läget mejl. Varifrån mottagaren kom, aldrig adressen. */
  mottagare?: "OPS_ALERT_EMAIL" | "HEALTH_ALERT_EMAIL" | "kundtjanst";
  sandning?: "skickat" | "dry_run" | "no_api_key" | "fel" | "ej_forsokt";
  resendId?: string;
  fel?: string;
}

export interface ProvDeps {
  lasProdukt: (wixProductId: string) => Promise<V3ProduktKort | null>;
  uppfriska: (slug: string) => Promise<UppfriskningDetalj>;
  /** Restock-kedjans beroenden. Bevakarlistan, stämplingen och tömningen ersätts. */
  restock: RestockDeps;
}

export function standardProvDeps(): ProvDeps {
  const restock = standardRestockDeps();
  return {
    lasProdukt: restock.lasProdukt,
    uppfriska: (slug) => uppfriskaProduktsidaDetalj(slug),
    restock,
  };
}

/** Den interna mottagaren, i samma ordning som vaktens morgonmejl. */
export function provmottagare(): { adress: string; kalla: NonNullable<ProvSvar["mottagare"]> } {
  const ops = process.env.OPS_ALERT_EMAIL?.trim();
  if (ops) return { adress: ops, kalla: "OPS_ALERT_EMAIL" };
  const halsa = process.env.HEALTH_ALERT_EMAIL?.trim();
  if (halsa) return { adress: halsa, kalla: "HEALTH_ALERT_EMAIL" };
  return { adress: KUND_BRAND.supportEmail, kalla: "kundtjanst" };
}

/** Byter allt som ser ut som en e-postadress mot `<adress>`. Loggen är publik. */
export function tvattaAdresser(text: string): string {
  return text.replace(/[^\s"'<>(),;:[\]]+@[^\s"'<>(),;:[\]]+/g, "<adress>").slice(0, 300);
}

function butiksdoman(): string {
  try {
    return new URL(butikensBas()).host;
  } catch {
    return "ogiltig adress";
  }
}

function felmeddelande(e: unknown): string {
  return tvattaAdresser(e instanceof Error ? e.message : String(e));
}

type Last =
  | { kort: V3ProduktKort; svar?: undefined; http?: undefined }
  | { kort?: undefined; svar: ProvSvar; http: number };

async function lasKort(lage: ProvLage, wixProductId: string, deps: ProvDeps): Promise<Last> {
  const tom: ProvSvar = {
    ok: false,
    lage,
    wixProductId,
    produkt: null,
    stopp: null,
    butik: butiksdoman(),
    utfall: null,
    status: null,
    varmning: null,
    diagnos: "",
  };
  let kort: V3ProduktKort | null;
  try {
    kort = await deps.lasProdukt(wixProductId);
  } catch (e) {
    return { svar: { ...tom, stopp: "lasfel", diagnos: `Produkten gick inte att läsa ur Wix: ${felmeddelande(e)}` }, http: 502 };
  }
  if (!kort) {
    return { svar: { ...tom, stopp: "saknas_i_butiken", diagnos: "Produkten finns inte i butiken." }, http: 404 };
  }
  return { kort };
}

/**
 * Tömmer produktsidans cache i butiken med samma anrop som före ett
 * restock-mejl. En dold produkt töms också, för provet gäller nyckeln och inte
 * sidan, men `stopp` säger att ett riktigt mejl inte hade gått.
 */
export async function provaSidan(
  wixProductId: string,
  deps: ProvDeps = standardProvDeps(),
): Promise<{ http: number; svar: ProvSvar }> {
  const last = await lasKort("sidan", wixProductId, deps);
  if (!last.kort) return { http: last.http, svar: last.svar };
  const { kort } = last;
  if (!kort.slug) {
    return {
      http: 422,
      svar: {
        ok: false,
        lage: "sidan",
        wixProductId,
        produkt: kort.namn || null,
        stopp: "saknar_adress",
        butik: butiksdoman(),
        utfall: null,
        status: null,
        varmning: null,
        diagnos: "Produkten har ingen adress i butiken.",
      },
    };
  }
  const d = await deps.uppfriska(kort.slug);
  return {
    http: 200,
    svar: {
      ok: d.utfall === "uppfriskad",
      lage: "sidan",
      wixProductId,
      produkt: kort.namn || null,
      stopp: restockStopp(kort),
      butik: butiksdoman(),
      utfall: d.utfall,
      status: d.status ?? null,
      varmning: d.varmning ?? null,
      diagnos: diagnosUppfriskning(d),
    },
  };
}

/**
 * Skickar restock-mejlet för produkten till den interna adressen, genom
 * mejlaBevakare. Ämnesraden börjar med "[Prov]", annars är mejlet det som en
 * bevakare hade fått.
 */
export async function provaMejl(
  wixProductId: string,
  varianter: string[] | undefined,
  deps: ProvDeps = standardProvDeps(),
): Promise<{ http: number; svar: ProvSvar }> {
  const last = await lasKort("mejl", wixProductId, deps);
  if (!last.kort) return { http: last.http, svar: last.svar };
  const { kort } = last;

  const mottagare = provmottagare();
  let sidan: UppfriskningDetalj | undefined;
  // Sätts inne i sändaren nedan. `as` håller typen bred: utan den låser
  // TypeScript värdet vid "ej_forsokt", för tilldelningen sker i en closure.
  let sandning = "ej_forsokt" as NonNullable<ProvSvar["sandning"]>;
  let resendId: string | undefined;
  let fel: string | undefined;

  const utskick: RestockUtskick = await mejlaBevakare(
    wixProductId,
    { varianter },
    {
      ...deps.restock,
      // Produkten är redan läst. Samma kort, så provet och svaret talar om samma sak.
      lasProdukt: async () => kort,
      listaVantande: async () => [
        {
          id: "prov",
          productId: wixProductId,
          email: mottagare.adress,
          subscribedAt: new Date().toISOString(),
          notifiedAt: null,
        },
      ],
      markeraMejlade: async () => {},
      uppfriskaSida: async (slug) => {
        sidan = await deps.uppfriska(slug);
        return sidan.utfall;
      },
      skicka: async (input) => {
        try {
          const r = await deps.restock.skicka({ ...input, subject: `[Prov] ${input.subject}` });
          if (r.skipped) sandning = r.skipped;
          else {
            sandning = "skickat";
            resendId = r.id;
          }
          return r;
        } catch (e) {
          sandning = "fel";
          fel = felmeddelande(e);
          throw e;
        }
      },
    },
  );

  const diagnoser: string[] = [];
  if (utskick.stopp) diagnoser.push(`Mejlet byggdes inte: ${utskick.stopp}.`);
  if (sandning === "skickat") diagnoser.push("Resend tog emot mejlet.");
  else if (sandning === "dry_run") diagnoser.push("SYNC_EMAIL_DRY_RUN är på i motorn, så inget mejl gick.");
  else if (sandning === "no_api_key") diagnoser.push("RESEND_API_KEY saknas i motorn.");
  else if (sandning === "fel") diagnoser.push(`Resend avvisade mejlet: ${fel}`);
  if (sidan) diagnoser.push(`Sidans cache: ${diagnosUppfriskning(sidan)}`);

  return {
    http: 200,
    svar: {
      ok: sandning === "skickat",
      lage: "mejl",
      wixProductId,
      produkt: kort.namn || null,
      stopp: utskick.stopp ?? null,
      butik: butiksdoman(),
      utfall: sidan?.utfall ?? null,
      status: sidan?.status ?? null,
      varmning: sidan?.varmning ?? null,
      diagnos: diagnoser.join(" "),
      mottagare: mottagare.kalla,
      sandning,
      ...(resendId ? { resendId } : {}),
      ...(fel ? { fel } : {}),
    },
  };
}
