// Tömmer butikens cache för EN produktsida och värmer den direkt efteråt.
//
// Används före ett restock-mejl (lib/restock/notify.ts). Butikens produktsidor
// cachas i en timme (`revalidate = 3600` i app/produkt/[slug]/page.tsx på
// grenen `headless-site`), och bara en order tömmer cachen i förväg. Ett
// lagersaldo som synken skriver syns alltså inte förrän sidan byggts om. Utan
// det här steget kunde kunden klicka på "Nu finns den igen!" och landa på en
// sida som fortfarande säger "Slutsåld", med bevakningsformuläret under.
//
// ☠️ NYCKELN SKICKAS SOM KAKA, INTE SOM `?key=`. Butikens proxy.ts släpper igenom
// /api/admin/* på kakan `fp_admin`, eller på `?key=` genom en omdirigering som
// SÄTTER kakan. Node:s fetch följer omdirigeringen men sparar inga kakor, så
// `?key=`-vägen landar på proxyns 404. Rutten själv kontrollerar `?token=`.
//
// Stegen är best-effort och kastar aldrig: mejlet ska gå även om cachen inte
// gick att tömma. Utfallet räknas av anroparen, så en saknad nyckel syns.
//
// ADMIN_SECRET finns i två Vercel-projekt, butiken och motorn, och värdet går
// inte att läsa tillbaka i något av dem. Butikens statuskod är därför det enda
// som säger om nyckeln stämmer: `uppfriskaProduktsidaDetalj` bär den, och
// /api/admin/restock-prov provkör hela vägen utan att nyckeln syns.

const DEFAULT_BUTIK = "https://www.fyndplats.se";
const TIMEOUT_MS = 10_000;

export type Uppfriskning = "uppfriskad" | "ingen_nyckel" | "misslyckades";

export interface UppfriskningDetalj {
  utfall: Uppfriskning;
  /** Butikens svar på tömningen. Saknas när inget svar kom. */
  status?: number;
  /** Butikens svar på besöket som bygger om sidan. */
  varmning?: { status: number; cache: string | null; age: string | null };
}

/** Butikens adress, som motorn anropar den. */
export function butikensBas(): string {
  return (process.env.HEADLESS_BASE_URL || DEFAULT_BUTIK).replace(/\/$/, "");
}

export async function uppfriskaProduktsida(
  slug: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Uppfriskning> {
  return (await uppfriskaProduktsidaDetalj(slug, fetchImpl)).utfall;
}

export async function uppfriskaProduktsidaDetalj(
  slug: string,
  fetchImpl: typeof fetch = fetch,
): Promise<UppfriskningDetalj> {
  const nyckel = process.env.ADMIN_SECRET;
  if (!nyckel) return { utfall: "ingen_nyckel" };
  const s = slug.trim();
  if (!s) return { utfall: "misslyckades" };
  const bas = butikensBas();
  const sokvag = `/produkt/${encodeURIComponent(s)}`;

  let res: Response;
  try {
    res = await fetchImpl(
      `${bas}/api/admin/revalidate?token=${encodeURIComponent(nyckel)}&path=${encodeURIComponent(sokvag)}`,
      {
        method: "POST",
        headers: { cookie: `fp_admin=${nyckel}`, "user-agent": "fyndplats-cache-warmer/restock" },
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
  } catch {
    return { utfall: "misslyckades" };
  }
  if (!res.ok) return { utfall: "misslyckades", status: res.status };

  // Första besöket efter tömningen bygger om sidan. Det ska vara vårt, inte
  // kundens: sidan är färdigbyggd när mejlet kommer fram. Faller besöket är
  // cachen ändå tömd, och då bygger kundens besök om sidan.
  let varmning: UppfriskningDetalj["varmning"];
  try {
    const v = await fetchImpl(`${bas}${sokvag}`, {
      method: "GET",
      headers: { "user-agent": "fyndplats-cache-warmer/restock" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    varmning = { status: v.status, cache: v.headers.get("x-vercel-cache"), age: v.headers.get("age") };
  } catch {
    // Värmningen är en bonus.
  }
  return { utfall: "uppfriskad", status: res.status, ...(varmning ? { varmning } : {}) };
}

/**
 * Vad utfallet betyder, i klartext för den som provkör. Nyckelns värde nämns
 * aldrig, bara vilken sida som avvisade den.
 */
export function diagnosUppfriskning(d: UppfriskningDetalj): string {
  if (d.utfall === "uppfriskad") return "Butiken tog emot nyckeln och tömde sidans cache.";
  if (d.utfall === "ingen_nyckel") return "ADMIN_SECRET saknas i motorns miljö i den här deployen.";
  if (d.status === undefined) return "Butiken svarade inte (nätverksfel eller tidsgräns).";
  if (d.status === 404) {
    return "Butikens proxy avvisade nyckeln. Värdet skiljer sig från butikens, eller ADMIN_SECRET saknas i butiken.";
  }
  if (d.status === 401) return "Proxyn släppte igenom, men butikens rutt avvisade nyckeln.";
  if (d.status >= 300 && d.status < 400) {
    return "Adressen omdirigeras. HEADLESS_BASE_URL pekar inte på butikens egen domän.";
  }
  return `Butiken svarade ${d.status}.`;
}
