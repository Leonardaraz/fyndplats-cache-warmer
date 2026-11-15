// /konto — inloggning eller Mina sidor (medlemskapet E1, 2026-11-04).
//
// Alltid dynamisk och privat: sidan bär kundens köp och får aldrig hamna i
// ISR-cachen. Ingen länk dit från menyn förrän Leonard slår på läget "pa";
// i läget "tyst" fungerar den för den som har adressen.

import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { inloggad } from "@/lib/medlem/inloggad";
import type { Session } from "@/lib/medlem/session";
import { hamtaForetagsprofil, hamtaMedlem, medlemsHemlighet, medlemsLage, offerterFor, prisLage, prisOppet, sparadeKorgarFor, type Prislage } from "@/lib/medlem/lager";
import { sparadKorgVy, sparadeSektion } from "@/lib/medlem/sparade";
import { aktuellStatus, offertStatusText } from "@/lib/medlem/offert";
import { foretagsstatusText, kanHandlaSomForetag, VILLKOR_FORETAG_VERSION, type Foretagsprofil } from "@/lib/medlem/foretag";
import { minaSidor } from "@/lib/medlem/konto";
import { orderGuid, sakertMal } from "@/lib/medlem/inloggning";
import { visaForetagsvag } from "@/lib/medlem/foretagsstart";
import { getProdukterForId, getProducts, katalogenLaddad } from "@/lib/products";
import { KontoInloggning } from "./konto-inloggning";
import { MinaSidorSkelett, MinaSidorVy, type Produktbilder, type SparadeKorgarVy } from "./mina-sidor";
import { Formaner, Kortfacka } from "./formaner";
import { FornyaSession } from "./fornya";
import { TillAnkaret } from "./till-ankaret";
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

/** Så länge väntar Mina sidor på ordrarnas bilder; utan dem visas en paketikon. */
const BILDER_VANTAR_MS = 1500;

/**
 * Ordrarnas produktbilder. Har instansen katalogen i minnet kostar det ingen
 * tid. Annars frågas Wix om just ordrarnas produkter i ett anrop (~0,3 s,
 * getProdukterForId) i stället för att vänta in hela katalogen, som på en kall
 * instans tar 20–60 s: förut fick den kunden alltid vänta 1,5 s och sedan
 * ordrarna utan bilder (2026-11-15).
 */
async function produktbilder(idn: Set<string>): Promise<Produktbilder> {
  const ut: Produktbilder = {};
  if (idn.size === 0) return ut;
  try {
    const hamtning = katalogenLaddad() ? getProducts() : getProdukterForId([...idn]);
    const lista = await Promise.race([hamtning, new Promise<null>((r) => setTimeout(() => r(null), BILDER_VANTAR_MS))]);
    if (!lista) return ut;
    for (const p of lista) if (idn.has(p.id)) ut[p.id] = { img: p.img, slug: p.slug };
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
async function sparade(
  medlem: { id: string; testare?: boolean },
  korgarP: ReturnType<typeof sparadeKorgarFor>,
  lageP: Promise<Prislage>,
): Promise<SparadeKorgarVy | undefined> {
  try {
    const [korgar, lage] = await Promise.all([korgarP, lageP]);
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
  profilP: ReturnType<typeof hamtaForetagsprofil>,
  lageP: Promise<Prislage>,
): Promise<{ ruta: ReactNode; handlarSom: string | null }> {
  try {
    const [fp, lage] = await Promise.all([profilP, lageP]);
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

  // Inloggad: sidans ram och en skiss av Mina sidor går iväg direkt, och
  // innehållet strömmar in när Wix svarat (2026-11-15). Förut stod webbläsaren
  // på förra sidan tills allt var läst.
  const session = await inloggad();
  if (session) {
    return (
      <section className="sec">
        <Suspense fallback={<MinaSidorSkelett />}>
          <MinaSidorInnehall session={session} sp={sp} />
        </Suspense>
      </section>
    );
  }
  return (
    <section className="sec">
      <Inloggning sp={sp} />
    </section>
  );
}

/**
 * Mina sidor för den inloggade. Allt som bara behöver kontots id startar på en
 * gång: medlemsraden och orderliggaren (minaSidor), företaget, de sparade
 * korgarna och prisväxeln. Förut väntade sidan in dem en i taget, fem
 * Wix-frågor i rad, och sedan katalogen för bilderna (2026-11-15).
 */
async function MinaSidorInnehall({ session, sp }: { session: Session; sp: Sok }) {
  const profilP = hamtaForetagsprofil(session.sub);
  const korgarP = sparadeKorgarFor(session.sub);
  const lageP = prisLage();
  // Felen hanteras där svaren används; här bara så att ett fel inte blir ett
  // ohanterat avslag om sidan slutar tidigt (spärrad medlem, tekniskt fel).
  profilP.catch(() => {});
  korgarP.catch(() => {});

  let data: Awaited<ReturnType<typeof minaSidor>> = null;
  try {
    data = await minaSidor(session.sub, session.email);
  } catch (e) {
    console.error("[konto] Mina sidor gick inte att läsa:", e instanceof Error ? e.message.slice(0, 160) : e);
    return (
      <div className="container-narrow">
        <h1 className={`${s.rubrik} ${s.display}`}>Mina sidor</h1>
        <p className={s.ingress}>Mina sidor gick inte att läsa just nu. Försök igen om en stund.</p>
      </div>
    );
  }

  if (!data) {
    // Inloggad men spärrad: säg det direkt, i stället för inloggningen som ändå
    // hade nekat med samma besked först efter en ny kod.
    const medlem = await hamtaMedlem(session.sub).catch(() => null);
    if (medlem?.status === "sparrad") {
      return (
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
      );
    }
    // Kontot finns inte längre: inloggningen, och kakan förnyas bort.
    return <Inloggning sp={sp} medSession />;
  }

  const idn = new Set(data.ordrar.flatMap((o) => o.varor.map((v) => v.produktId).filter((x): x is string => Boolean(x))));
  const [bilder, ft, korgar, pl] = await Promise.all([
    produktbilder(idn),
    foretagsdel(data.medlem, session.profil, profilP, lageP),
    sparade(data.medlem, korgarP, lageP),
    lageP,
  ]);
  return (
    <>
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
      <TillAnkaret />
    </>
  );
}

/** Inloggningen och förmånerna, för den som inte är inloggad. */
async function Inloggning({ sp, medSession = false }: { sp: Sok; medSession?: boolean }) {
  const order = orderGuid(ett(sp.order)) ?? undefined;
  const mal = sakertMal(ett(sp.mal));
  const prisPa = (await prisLage()) === "pa";
  // Vägen till ett företagskonto (/konto/foretag) syns när det är öppet för alla.
  const foretagsvagOppen = visaForetagsvag(true, prisPa);
  return (
    <>
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
      {medSession ? <FornyaSession /> : null}
    </>
  );
}
