// /konto — inloggning eller Mina sidor (medlemskapet E1, 2026-11-04).
//
// Alltid dynamisk och privat: sidan bär kundens köp och får aldrig hamna i
// ISR-cachen. Ingen länk dit från menyn förrän Leonard slår på läget "pa";
// i läget "tyst" fungerar den för den som har adressen.

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { inloggad } from "@/lib/medlem/inloggad";
import { hamtaForetagsprofil, hamtaMedlem, medlemsHemlighet, medlemsLage, offerterFor, prisLage, prisOppet, sparadeKorgarFor } from "@/lib/medlem/lager";
import { sparadKorgVy, sparadeSektion } from "@/lib/medlem/sparade";
import { aktuellStatus, offertStatusText } from "@/lib/medlem/offert";
import { foretagsstatusText, kanHandlaSomForetag, VILLKOR_FORETAG_VERSION, type Foretagsprofil } from "@/lib/medlem/foretag";
import { minaSidor } from "@/lib/medlem/konto";
import { orderGuid, sakertMal } from "@/lib/medlem/inloggning";
import { visaForetagsvag } from "@/lib/medlem/foretagsstart";
import { getProducts } from "@/lib/products";
import { KontoInloggning } from "./konto-inloggning";
import { MinaSidorVy, type Produktbilder, type SparadeKorgarVy } from "./mina-sidor";
import { Formaner, Kortfacka } from "./formaner";
import { FornyaSession } from "./fornya";
import { Foretagskonto, type ForetagVy, type OffertPaMinaSidor } from "./foretag";
import { Foretagsrad, Kontotyp } from "./kontotyp";
import s from "./konto.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mina sidor",
  description: "Logga in på ditt konto hos Fyndplats och se din medlemsnivå, dina köp och dina ordrar.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.fyndplats.se/konto" },
};

type Sok = Record<string, string | string[] | undefined>;
const ett = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Så länge väntar Mina sidor på katalogen för ordrarnas bilder. En kall instans
 *  laddar hela katalogen; då visas ordrarna utan bilder hellre än sent. */
const BILDER_VANTAR_MS = 1500;

async function produktbilder(idn: Set<string>): Promise<Produktbilder> {
  const ut: Produktbilder = {};
  if (idn.size === 0) return ut;
  try {
    const alla = await Promise.race([getProducts(), new Promise<null>((r) => setTimeout(() => r(null), BILDER_VANTAR_MS))]);
    if (!alla) return ut;
    for (const p of alla) if (idn.has(p.id)) ut[p.id] = { img: p.img, slug: p.slug };
  } catch {
    // Bilderna är en bonus: utan dem visas ordrarna med en paketikon.
  }
  return ut;
}

const DATUM = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", timeZone: "Europe/Stockholm" });

/**
 * Kontots sparade varukorgar, och om nya får sparas (växeln för E2/E3,
 * `sparadeSektion`). Går de inte att läsa visas inte sektionen, hellre än en
 * trasig.
 */
async function sparade(medlem: { id: string; testare?: boolean }): Promise<SparadeKorgarVy | undefined> {
  try {
    const [korgar, lage] = await Promise.all([sparadeKorgarFor(medlem.id), prisLage()]);
    const { visas, kanSpara } = sparadeSektion(korgar.length, prisOppet(lage, medlem));
    return visas ? { korgar: korgar.map(sparadKorgVy), kanSpara } : undefined;
  } catch (e) {
    console.error("[konto] sparade varukorgar gick inte att läsa:", e instanceof Error ? e.message.slice(0, 120) : e);
    return undefined;
  }
}

/** Det Mina sidor får veta om företaget. ☠️ Aldrig hela numret för en enskild firma. */
function foretagVy(p: Foretagsprofil): ForetagVy {
  return {
    status: p.status,
    namn: p.namn,
    orgnrVisas: p.orgnrVisas,
    form: p.form,
    faktura: p.faktura,
    ...(p.leverans ? { leverans: p.leverans } : {}),
    villkorAktuellt: p.villkorVersion === VILLKOR_FORETAG_VERSION,
    statustext: foretagsstatusText(p),
  };
}

/** Företagets ruta och namnet i sidhuvudet. Felar läsningen visas Mina sidor utan rutan. */
async function foretagsdel(
  medlem: { id: string; testare?: boolean },
  sessionProfil: "foretag" | undefined,
): Promise<{ ruta: ReactNode; handlarSom: string | null }> {
  try {
    const [fp, lage] = await Promise.all([hamtaForetagsprofil(medlem.id), prisLage()]);
    if (!fp && !prisOppet(lage, medlem)) return { ruta: null, handlarSom: null };
    const aktiv = sessionProfil === "foretag" && kanHandlaSomForetag(fp) ? "foretag" : "privat";
    const nu = Date.now();
    const offerter: OffertPaMinaSidor[] = kanHandlaSomForetag(fp)
      ? (await offerterFor(medlem.id, 10).catch(() => [])).map((o) => {
          const st = aktuellStatus(o, nu);
          return {
            id: o.id,
            datum: o.skapad ? DATUM.format(new Date(o.skapad)) : "–",
            status: offertStatusText(o, nu),
            visa: st === "prissatt" || st === "accepterad" || st === "betald",
          };
        })
      : [];
    return {
      ruta: <Foretagskonto foretag={fp ? foretagVy(fp) : null} aktivProfil={aktiv} offerter={offerter} />,
      handlarSom: aktiv === "foretag" && fp ? fp.namn : null,
    };
  } catch (e) {
    console.error("[konto] företaget gick inte att läsa:", e instanceof Error ? e.message.slice(0, 120) : e);
    return { ruta: null, handlarSom: null };
  }
}

export default async function Konto({ searchParams }: { searchParams: Promise<Sok> }) {
  const sp = await searchParams;
  const oppen = Boolean(medlemsHemlighet()) && (await medlemsLage()) !== "av";

  if (!oppen) {
    return (
      <section className="sec">
        <div className={`container ${s.ram}`}>
          <div className={s.inloggYta}>
            <div>
              <p className={s.ogonbryn}>Fyndplats medlem</p>
              <h1 className={`${s.rubrik} ${s.display}`}>Mina sidor</h1>
              <p className={s.ingress}>
                Medlemskontot öppnar snart. Då ser du din nivå, dina köp och dina paket på ett ställe. Frågor om en order
                besvarar kundtjänst som vanligt på <a href="mailto:info@fyndplats.com">info@fyndplats.com</a>.
              </p>
            </div>
            <aside className={s.formaner}>
              <Kortfacka />
            </aside>
          </div>
        </div>
      </section>
    );
  }

  const session = await inloggad();
  let data: Awaited<ReturnType<typeof minaSidor>> = null;
  let tekniskt = false;
  if (session) {
    try {
      data = await minaSidor(session.sub);
    } catch (e) {
      tekniskt = true;
      console.error("[konto] Mina sidor gick inte att läsa:", e instanceof Error ? e.message.slice(0, 160) : e);
    }
  }
  if (tekniskt) {
    return (
      <section className="sec">
        <div className="container-narrow">
          <h1 className={`${s.rubrik} ${s.display}`}>Mina sidor</h1>
          <p className={s.ingress}>Mina sidor gick inte att läsa just nu. Försök igen om en stund.</p>
        </div>
      </section>
    );
  }
  // Inloggad men spärrad: säg det direkt, i stället för inloggningen som ändå
  // hade nekat med samma besked först efter en ny kod.
  if (session && !data) {
    const medlem = await hamtaMedlem(session.sub).catch(() => null);
    if (medlem?.status === "sparrad") {
      return (
        <section className="sec">
          <div className="container-narrow">
            <h1 className={`${s.rubrik} ${s.display}`}>Mina sidor</h1>
            <p className={s.ingress}>
              Ditt konto är spärrat. Mejla <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> så hjälper vi dig. Dina
              ordrar och köp finns kvar.
            </p>
            <form action="/api/konto/ut" method="post">
              <button type="submit" className={s.utknapp}>
                Logga ut
              </button>
            </form>
          </div>
        </section>
      );
    }
  }
  if (session && data) {
    const idn = new Set(data.ordrar.flatMap((o) => o.varor.map((v) => v.produktId).filter((x): x is string => Boolean(x))));
    const [bilder, ft, korgar, pl] = await Promise.all([
      produktbilder(idn),
      foretagsdel(data.medlem, session.profil),
      sparade(data.medlem),
      prisLage(),
    ]);
    return (
      <section className="sec">
        <div className={`container ${s.ram}`}>
          <MinaSidorVy
            data={data}
            bilder={bilder}
            foretag={ft.ruta}
            handlarSom={ft.handlarSom}
            sparade={korgar}
            prisOppet={prisOppet(pl, data.medlem)}
          />
        </div>
        <FornyaSession />
      </section>
    );
  }

  const order = orderGuid(ett(sp.order)) ?? undefined;
  const mal = sakertMal(ett(sp.mal));
  const prisPa = (await prisLage()) === "pa";
  // Vägen till ett företagskonto (/konto/foretag) syns när det är öppet för alla.
  const foretagsvagOppen = visaForetagsvag(oppen, prisPa);
  return (
    <section className="sec">
      <div className={`container ${s.ram}`}>
        <div className={s.inloggYta}>
          <div>
            {foretagsvagOppen ? <Kontotyp aktiv="privat" /> : null}
            <p className={s.ogonbryn}>Fyndplats medlem</p>
            <h1 className={`${s.rubrik} ${s.display}`}>
              {ett(sp.fran) === "tack" ? "Skapa konto – köpet räknas" : "Bli medlem eller logga in"}
            </h1>
            <p className={s.ingress}>
              Du loggar in med en kod som vi mejlar, utan lösenord. Köp du gjort med samma e-post det senaste året räknas
              direkt.
            </p>
            <KontoInloggning order={order} mal={mal === "/konto" ? undefined : mal} fel={ett(sp.fel) ?? null} />
            {foretagsvagOppen ? <Foretagsrad /> : null}
            <p className={s.liten}>
              När du skapar ett konto sparar vi din e-postadress och räknar ihop dina köp för medlemsnivån. Läs mer i vår{" "}
              <a href="/sekretesspolicy">sekretesspolicy</a>.
            </p>
          </div>
          <aside className={s.formaner} aria-label="Det här får du som medlem">
            <Kortfacka />
            <Formaner prisPa={prisPa} />
          </aside>
        </div>
      </div>
      {session ? <FornyaSession /> : null}
    </section>
  );
}
