// /admin/medlemmar — medlemskapet (E1, Leonards beslut A3 2026-11-04).
//
// Sök på e-post eller ordernummer, se medlemskortet (nivå, K, orderliggaren,
// nivåbyten och logg), och gör manuella ändringar med orsakskod (E1-11).
// Överst: växeln (av, tyst, på) och nattens avstämning.

import { ORSAKSKODER, NIVAER, LAGEN, liggarraderForEpost, loggFor, maskeradEpost, medlemsId, nivabyten, oversikt, sokMedlem, type Rad } from "@/lib/medlem/admin";
import { lageAction, manuellNivaAction, sparrAction, taBortAction } from "./actions";

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
  const o = await oversikt();
  const sok = q ? await sokMedlem(q) : null;
  const medlem = sok?.medlem ?? null;
  const id = medlem ? String(medlem._id) : sok?.epost ? medlemsId(sok.epost) : "";
  const [rader, byten, logg] = sok?.epost
    ? await Promise.all([liggarraderForEpost(sok.epost), medlem ? nivabyten(id) : Promise.resolve([]), loggFor({ medlemsId: id }, 30)])
    : [[], [], []];

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

      <form method="get" style={{ margin: "16px 0" }}>
        <input name="q" defaultValue={q} placeholder="E-post eller ordernummer" style={{ width: 320 }} /> <button type="submit">Sök</button>
      </form>

      {q && !sok?.epost ? <p>Ingen träff. Sök på hela e-postadressen eller ett ordernummer.</p> : null}

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
