// /admin/medlemmar — medlemskapet (E1, Leonards beslut A3 2026-11-04).
//
// Sök på e-post eller ordernummer, se medlemskortet (nivå, K, orderliggaren,
// nivåbyten och logg), och gör manuella ändringar med orsakskod (E1-11).
// Överst: växeln (av, tyst, på) och nattens avstämning.

import {
  ORSAKSKODER,
  NIVAER,
  LAGEN,
  foretagFor,
  foretagsko,
  liggarraderForEpost,
  loggFor,
  maskeradEpost,
  medlemsId,
  nivabyten,
  oversikt,
  sokMedlem,
  type Rad,
} from "@/lib/medlem/admin";
import { offertko, senasteOfferter, type OffertIKon } from "@/lib/medlem/offert-admin";
import { varorUtanMedlemspris, type FlaggadVara } from "@/lib/medlem/ej-medlemspris";
import { ejMedlemsprisAction, foretagAction, lageAction, manuellNivaAction, offertAction, sparrAction, taBortAction } from "./actions";

export const dynamic = "force-dynamic";

const kr = (ore: unknown) =>
  typeof ore === "number" ? `${(ore / 100).toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kr` : "–";
const dag = (iso: unknown) => (typeof iso === "string" && iso ? iso.slice(0, 10) : "–");
const text = (v: unknown) => (typeof v === "string" && v ? v : "–");

const KORT = { border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, margin: "16px 0", background: "#fff" } as const;
const TABELL = { borderCollapse: "collapse" as const, width: "100%", fontSize: 13 };
const CELL = { borderBottom: "1px solid #eee", padding: "6px 8px", textAlign: "left" as const, verticalAlign: "top" as const };

function Orsaksfalt() {
  return (
    <>
      <select name="orsakKod" defaultValue="" required>
        <option value="" disabled>
          Orsakskod…
        </option>
        {Object.entries(ORSAKSKODER).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>{" "}
      <input name="orsakText" placeholder="Orsak (syns i loggen)" required minLength={5} maxLength={500} style={{ width: 280 }} />
    </>
  );
}

const adress = (a: unknown) => {
  const r = (a ?? {}) as Record<string, unknown>;
  const p = typeof r.postnr === "string" && /^\d{5}$/.test(r.postnr) ? `${r.postnr.slice(0, 3)} ${r.postnr.slice(3)}` : text(r.postnr);
  return r.gata ? `${text(r.gata)}, ${p} ${text(r.ort)}` : "–";
};

/**
 * Bolagsverkets besked från butikens uppslag (butikens lib/medlem/bolagsverket.ts,
 * sedan 2026-11-06): ett aktivt företag godkändes direkt (`beslutAv`), annars
 * står orsaken här. Profiler från före uppslaget saknar fältet.
 */
function Bolagsverket({ profil }: { profil: Rad }) {
  const k = (profil.bolagsverket ?? null) as Record<string, unknown> | null;
  const stil = { margin: "0 0 6px", fontSize: 13, color: "#555" } as const;
  if (!k) {
    return (
      <p style={stil}>
        Kontrollera hos Bolagsverket att numret hör till namnet och att bolaget är aktivt (enskilda firmor finns inte alltid där).
      </p>
    );
  }
  const orsaker = Array.isArray(k.orsaker) ? k.orsaker.filter((o): o is string => typeof o === "string") : [];
  const angivet = typeof profil.namnAngivet === "string" && profil.namnAngivet ? ` · kunden skrev "${profil.namnAngivet}"` : "";
  if (profil.beslutAv === "bolagsverket") {
    return (
      <p style={stil}>
        ✅ Godkänt direkt: aktivt hos Bolagsverket{typeof k.form === "string" ? ` (${k.form})` : ""}, registrerat namn{angivet}. Kontrollerat {dag(k.kontrollerad)}.
      </p>
    );
  }
  const utfall = k.utfall === "hittad" ? "hittat" : k.utfall === "saknas" ? "finns inte" : "uppslaget föll";
  return (
    <p style={stil}>
      ⚠️ Bolagsverket: {utfall}
      {typeof k.namn === "string" ? ` som "${k.namn}"` : ""}
      {orsaker.length ? ` · ${orsaker.join(", ")}` : ""}
      {angivet} · kontrollerat {dag(k.kontrollerad)}. Granska för hand.
    </p>
  );
}

/** Ett företags uppgifter och beslutsknapparna (E3). Hela numret syns bara här i admin. */
function Foretaget({ profil, q, epost }: { profil: Rad; q: string; epost?: string }) {
  const status = text(profil.status);
  const id = text(profil.medlemsId);
  return (
    <div style={{ borderTop: "1px solid #eee", padding: "10px 0" }}>
      <p style={{ margin: "0 0 6px" }}>
        <b>{text(profil.namn)}</b> · {text(profil.orgnr)} ({profil.form === "enskild" ? "enskild firma, numret är ett personnummer" : "juridisk person"}) ·
        status <b>{status}</b> · ansökt {dag(profil.ansokt)}
        {profil.beslutad ? ` · beslut ${dag(profil.beslutad)}` : ""} · villkor v{text(profil.villkorVersion)}
        {epost ? (
          <>
            {" "}
            · konto <a href={`/admin/medlemmar?q=${encodeURIComponent(epost)}`}>{epost}</a>
          </>
        ) : null}
      </p>
      <p style={{ margin: "0 0 6px", fontSize: 13, color: "#555" }}>
        Faktura: {adress(profil.faktura)}
        {profil.leverans ? ` · Leverans: ${adress(profil.leverans)}` : " · Leverans till fakturaadressen"}
      </p>
      <Bolagsverket profil={profil} />
      {status !== "aktiv" ? (
        <form action={foretagAction} style={{ display: "inline-block", marginRight: 12 }}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="beslut" value="aktiv" />
          <Orsaksfalt /> <button type="submit">Godkänn</button>
        </form>
      ) : null}
      {status !== "nekad" ? (
        <form action={foretagAction} style={{ display: "inline-block", marginTop: 6 }}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="beslut" value="nekad" />
          <Orsaksfalt /> <button type="submit">{status === "aktiv" ? "Återkalla" : "Neka"}</button>
        </form>
      ) : null}
    </div>
  );
}

const krTal = (ore: number) => (ore / 100).toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** En förfrågan med listpris och golv per rad, och prisfälten (E3-10). */
function Offerten({ o, q }: { o: OffertIKon; q: string }) {
  const lista = o.rader.reduce((s, r) => s + r.aOre * r.antal, 0);
  return (
    <div style={{ borderTop: "1px solid #eee", padding: "10px 0" }}>
      <p style={{ margin: "0 0 6px" }}>
        <b>{o.foretagNamn || "Företag"}</b> · begärd {dag(o.skapad)} · listpris {kr(lista)} inkl. moms
        {o.epost ? (
          <>
            {" "}
            · konto <a href={`/admin/medlemmar?q=${encodeURIComponent(o.epost)}`}>{o.epost}</a>
          </>
        ) : null}
      </p>
      {o.meddelande ? <p style={{ margin: "0 0 6px", fontStyle: "italic" }}>”{o.meddelande}”</p> : null}
      <form action={offertAction}>
        <input type="hidden" name="id" value={o.id} />
        <input type="hidden" name="q" value={q} />
        <input type="hidden" name="beslut" value="prissatt" />
        <table style={TABELL}>
          <thead>
            <tr>
              <th style={CELL}>Vara</th>
              <th style={CELL}>Antal</th>
              <th style={CELL}>Listpris/st</th>
              <th style={CELL}>Golv/st</th>
              <th style={CELL}>Offertpris/st inkl. moms (kr)</th>
            </tr>
          </thead>
          <tbody>
            {o.rader.map((r, i) => (
              <tr key={`${r.produktId}-${i}`}>
                <td style={CELL}>{r.namn}</td>
                <td style={CELL}>{r.antal}</td>
                <td style={CELL}>{kr(r.aOre)}</td>
                <td style={CELL}>{r.golvOre === null ? "saknas (bara listpris)" : kr(r.golvOre)}</td>
                <td style={CELL}>
                  <input name={`pris_${i}`} defaultValue={krTal(r.aOre)} required style={{ width: 110 }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: "8px 0" }}>
          <Orsaksfalt /> <button type="submit">Skicka offerten (gäller 14 dagar)</button>
        </p>
      </form>
      <form action={offertAction}>
        <input type="hidden" name="id" value={o.id} />
        <input type="hidden" name="q" value={q} />
        <input type="hidden" name="beslut" value="avboj" />
        <Orsaksfalt /> <button type="submit">Avböj</button>
      </form>
    </div>
  );
}

function Logg({ rader }: { rader: Rad[] }) {
  if (!rader.length) return <p style={{ color: "#666" }}>Ingenting loggat.</p>;
  return (
    <table style={TABELL}>
      <thead>
        <tr>
          <th style={CELL}>Tid</th>
          <th style={CELL}>Område</th>
          <th style={CELL}>Händelse</th>
          <th style={CELL}>Före → efter</th>
          <th style={CELL}>Orsak</th>
        </tr>
      </thead>
      <tbody>
        {rader.map((r) => (
          <tr key={String(r._id ?? r.tid)}>
            <td style={CELL}>{String(r.tid ?? "").replace("T", " ").slice(0, 16)}</td>
            <td style={CELL}>{text(r.omrade)}</td>
            <td style={CELL}>
              {text(r.typ)}
              {Array.isArray(r.falt) && r.falt.length ? ` (${r.falt.join(", ")})` : ""}
            </td>
            <td style={CELL}>
              {r.fore || r.efter ? `${JSON.stringify(r.fore ?? {})} → ${JSON.stringify(r.efter ?? {})}` : "–"}
            </td>
            <td style={CELL}>{r.orsakKod ? `${String(r.orsakKod)}: ${text(r.orsakText)}` : "–"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function Medlemmar({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const meddelande = sp.m ?? "";
  const [o, ko, offerter, senaste, flaggade] = await Promise.all([
    oversikt(),
    foretagsko(),
    offertko().catch(() => [] as OffertIKon[]),
    senasteOfferter().catch(() => [] as Rad[]),
    varorUtanMedlemspris().catch(() => null as FlaggadVara[] | null),
  ]);
  const sok = q ? await sokMedlem(q) : null;
  const medlem = sok?.medlem ?? null;
  const id = medlem ? String(medlem._id) : sok?.epost ? medlemsId(sok.epost) : "";
  const [rader, byten, logg, foretag] = sok?.epost
    ? await Promise.all([
        liggarraderForEpost(sok.epost),
        medlem ? nivabyten(id) : Promise.resolve([]),
        loggFor({ medlemsId: id }, 30),
        medlem ? foretagFor(id) : Promise.resolve(null),
      ])
    : [[], [], [], null];

  return (
    <main style={{ padding: 24, maxWidth: 1100, fontFamily: "system-ui, sans-serif" }}>
      <p>
        <a href="/admin">← Admin</a>
      </p>
      <h1>Medlemmar</h1>
      {meddelande ? <p style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: 10, borderRadius: 6 }}>{meddelande}</p> : null}

      <section style={KORT}>
        <h2 style={{ marginTop: 0 }}>Läget</h2>
        <p>
          Medlemskapet är i läget <b>{o.lage}</b>. Konton: <b>{o.medlemmar}</b>. Orderliggaren:{" "}
          {o.liggare
            ? `startad ${dag(o.liggare.startad)}, bakåtläsningen ${o.liggare.bakatKlar === true ? "klar" : "pågår"}, senast avstämd ${String(o.liggare.senastAvstamd ?? "–").replace("T", " ").slice(0, 16)} UTC`
            : "ännu inte startad (nattjobbet 04:40 UTC)"}
          .
        </p>
        <p style={{ color: "#555", fontSize: 13 }}>
          <b>av</b>: ingen kan logga in, orderliggaren fylls ändå. <b>tyst</b>: /konto fungerar för den som har adressen. <b>pa</b>: tacksidan erbjuder
          konto. Slå på <b>pa</b> först när integritetstexten är publicerad.
        </p>
        <form action={lageAction}>
          <select name="lage" defaultValue={o.lage}>
            {LAGEN.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>{" "}
          <Orsaksfalt /> <button type="submit">Byt läge</button>
        </form>
        <h3>Avstämningens avvikelser (senaste 20)</h3>
        <Logg rader={o.avvikelser} />
      </section>

      <section style={KORT} id="foretag">
        <h2 style={{ marginTop: 0 }}>Företag att granska ({ko.length})</h2>
        {ko.length ? (
          ko.map(({ profil, epost }) => <Foretaget key={String(profil._id)} profil={profil} q={q} epost={epost} />)
        ) : (
          <p style={{ color: "#666" }}>Inga företag väntar. Butiken mejlar info@ när en ansökan kommer in.</p>
        )}
      </section>

      <section style={KORT} id="offerter">
        <h2 style={{ marginTop: 0 }}>Offerter att prissätta ({offerter.length})</h2>
        <p style={{ color: "#555", fontSize: 13 }}>
          Priset skrivs per styck inkl. moms. Aldrig under golvet och aldrig över listpriset; en vara utan golv får bara
          listpriset. Offerten gäller i 14 dagar, och kunden får ett mejl inom en timme.
        </p>
        {offerter.length ? offerter.map((x) => <Offerten key={x.id} o={x} q={q} />) : <p style={{ color: "#666" }}>Inga förfrågningar väntar.</p>}
        {senaste.length ? (
          <>
            <h3>Senaste offerterna</h3>
            <table style={TABELL}>
              <thead>
                <tr>
                  <th style={CELL}>Begärd</th>
                  <th style={CELL}>Företag</th>
                  <th style={CELL}>Status</th>
                  <th style={CELL}>Gäller till</th>
                </tr>
              </thead>
              <tbody>
                {senaste.map((x) => (
                  <tr key={String(x._id)}>
                    <td style={CELL}>{dag(x.skapad)}</td>
                    <td style={CELL}>{text(x.foretagNamn)}</td>
                    <td style={CELL}>{text(x.status)}</td>
                    <td style={CELL}>{dag(x.giltigTill)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}
      </section>

      <section style={KORT} id="ej-medlemspris">
        <h2 style={{ marginTop: 0 }}>Varor utan medlemspris ({flaggade ? flaggade.length : "?"})</h2>
        <p style={{ color: "#555", fontSize: 13 }}>
          En flaggad vara får aldrig medlemspris: golvrutten ger den inget golv, och butiken visar listpriset. AliExpress-varor,
          levande fynd, reavaror och varor utan känd kostnad är redan undantagna och behöver ingen flagga.
        </p>
        {flaggade === null ? (
          <p style={{ color: "#b91c1c" }}>Listan gick inte att läsa just nu.</p>
        ) : flaggade.length ? (
          <table style={TABELL}>
            <thead>
              <tr>
                <th style={CELL}>Vara</th>
                <th style={CELL}>Leverantör</th>
                <th style={CELL}>Ta bort flaggan</th>
              </tr>
            </thead>
            <tbody>
              {flaggade.map((v) => (
                <tr key={v.wixProductId}>
                  <td style={CELL}>
                    {v.namn || "(ej polerad)"}
                    <br />
                    <code style={{ fontSize: 12 }}>{v.wixProductId}</code>
                  </td>
                  <td style={CELL}>{text(v.leverantor)}</td>
                  <td style={CELL}>
                    <form action={ejMedlemsprisAction}>
                      <input type="hidden" name="q" value={q} />
                      <input type="hidden" name="produkt" value={v.wixProductId} />
                      <input type="hidden" name="ej" value="0" />
                      <Orsaksfalt /> <button type="submit">Ge medlemspris igen</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#666" }}>Ingen vara är flaggad.</p>
        )}
        <h3>Flagga en vara</h3>
        <form action={ejMedlemsprisAction}>
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="ej" value="1" />
          <input name="produkt" placeholder="Produktens id i Wix, eller adressen i Wix-panelen" required style={{ width: 360 }} /> <Orsaksfalt />{" "}
          <button type="submit">Flagga</button>
        </form>
      </section>

      <form method="get" style={{ margin: "16px 0" }}>
        <input name="q" defaultValue={q} placeholder="E-post, ordernummer eller organisationsnummer" style={{ width: 360 }} /> <button type="submit">Sök</button>
      </form>

      {q && !sok?.epost ? <p>Ingen träff. Sök på hela e-postadressen, ett ordernummer eller ett organisationsnummer.</p> : null}

      {sok?.epost ? (
        <section style={KORT}>
          <h2 style={{ marginTop: 0 }}>{sok.epost}</h2>
          {medlem ? (
            <>
              <p>
                Status <b>{text(medlem.status)}</b> · nivå <b>{text(medlem.niva)}</b> · K <b>{kr(medlem.kOre)}</b> (räknad {dag(medlem.beraknad)}) ·
                konto skapat {dag(medlem.skapad)} · senast inloggad {dag(medlem.senastInloggad)}
                {medlem.manuellNiva ? (
                  <>
                    {" "}
                    · <b>manuell nivå {String(medlem.manuellNiva)}</b>
                    {medlem.manuellTill ? ` till och med ${String(medlem.manuellTill)}` : ""}
                  </>
                ) : null}
              </p>
              <h3>Manuell nivå</h3>
              <form action={manuellNivaAction}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="q" value={q} />
                <select name="niva" defaultValue={typeof medlem.manuellNiva === "string" ? medlem.manuellNiva : ""}>
                  <option value="">Ingen (räknad nivå)</option>
                  {NIVAER.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>{" "}
                <input name="till" placeholder="Till och med ÅÅÅÅ-MM-DD (valfritt)" style={{ width: 230 }} /> <Orsaksfalt />{" "}
                <button type="submit">Spara</button>
              </form>
              <h3>Företag</h3>
              {foretag && foretag.typ === "foretag" ? <Foretaget profil={foretag} q={q} /> : <p style={{ color: "#666" }}>Inget företag på kontot.</p>}
              <h3>Spärra eller ta bort</h3>
              <form action={sparrAction} style={{ marginBottom: 8 }}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="q" value={q} />
                <input type="hidden" name="sparrad" value={medlem.status === "sparrad" ? "0" : "1"} />
                <Orsaksfalt /> <button type="submit">{medlem.status === "sparrad" ? "Aktivera kontot" : "Spärra kontot"}</button>
              </form>
              <form action={taBortAction}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="q" value={q} />
                <Orsaksfalt /> <input name="bekrafta" placeholder="Skriv TA BORT" style={{ width: 120 }} />{" "}
                <button type="submit">Ta bort kontot</button>
              </form>
            </>
          ) : (
            <p>Inget konto på adressen. Ordrarna nedan räknas när kunden skapar ett.</p>
          )}

          <h3>Orderliggaren ({rader.length})</h3>
          {rader.length ? (
            <table style={TABELL}>
              <thead>
                <tr>
                  <th style={CELL}>Order</th>
                  <th style={CELL}>Beställd</th>
                  <th style={CELL}>Betald</th>
                  <th style={CELL}>Status</th>
                  <th style={CELL}>Varor</th>
                  <th style={CELL}>Återbetalt</th>
                  <th style={CELL}>Räknas</th>
                  <th style={CELL}>Källa</th>
                </tr>
              </thead>
              <tbody>
                {rader.map((r) => (
                  <tr key={String(r._id)}>
                    <td style={CELL}>{text(r.ordernummer)}</td>
                    <td style={CELL}>{dag(r.bestalld)}</td>
                    <td style={CELL}>{dag(r.betald)}</td>
                    <td style={CELL}>
                      {text(r.orderstatus)} / {text(r.betalstatus)}
                    </td>
                    <td style={CELL}>{kr(r.varorOre)}</td>
                    <td style={CELL}>{kr(r.aterbetaltVarorOre)}</td>
                    <td style={CELL}>
                      {r.raknas === true ? "ja" : `nej (${text(r.orsak)})`}
                      {r.summaStammer === false ? " · summan stämmer inte" : ""}
                    </td>
                    <td style={CELL}>{text(r.kalla)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "#666" }}>Inga ordrar på adressen.</p>
          )}

          {medlem ? (
            <>
              <h3>Nivåbyten</h3>
              {byten.length ? (
                <ul>
                  {byten.map((b) => (
                    <li key={String(b._id)}>
                      {text(b.datum)}: {text(b.fran)} → {text(b.till)} ({kr(b.kOre)})
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#666" }}>Inga nivåbyten än.</p>
              )}
              <h3>Logg</h3>
              <Logg rader={logg} />
            </>
          ) : null}
          <p style={{ color: "#888", fontSize: 12 }}>Medlemmens id: {id || "–"} · visas som {maskeradEpost(sok.epost)} i loggar.</p>
        </section>
      ) : null}
    </main>
  );
}
