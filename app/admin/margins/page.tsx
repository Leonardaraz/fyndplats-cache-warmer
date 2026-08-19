// /admin/margins — marginalöversikt över hela katalogen.
//
// Kompletterar /admin/sync-alerts?filter=price, som är REAKTIV: den visar bara
// produkter där leverantören nyss höjt priset. Den svarar aldrig på "vilken
// marginal har mina produkter?", vilket är frågan den här sidan finns för.
//
// Tre vyer, i den ordning besluten faktiskt fattas:
//   1. Banden      — fördelningen, så man ser läget på tre sekunder.
//   2. Multiplarna — pris ÷ landad kostnad, grupperat. Avslöjar SYSTEMATISKA
//                    prissättningsfel som en procentspridning döljer.
//   3. Listan      — rankad på KRONOR per order, inte procent.
//
// Matten ligger i lib/pricing/margin-bands.ts med test — se motiveringen där.
//
// Datakälla: store.listMappings(). Varje variant bär redan landedCostSek och
// grossSek från importen, så sidan gör inga API-anrop mot AliExpress eller Wix.

import Link from "next/link";
import { getStore } from "@/lib/store/factory";
import { getPricingRules } from "@/lib/store/pricing-config";
import {
  BANDS,
  TARGET_MARGIN_PCT,
  biggestOpportunities,
  clusterByMultiple,
  summarizeBands,
  toMarginRow,
  type BandId,
  type MarginRow,
} from "@/lib/pricing/margin-bands";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const kr = (n: number) =>
  `${n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} kr`;
const pct = (n: number) => `${n.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} %`;

export default async function MarginsPage({
  searchParams,
}: {
  searchParams: Promise<{ band?: string; mult?: string }>;
}) {
  const params = await searchParams;
  const rules = await getPricingRules();
  const vat = rules.vatRatePercent;

  let mappings: Awaited<ReturnType<ReturnType<typeof getStore>["listMappings"]>> = [];
  let laddfel: string | null = null;
  try {
    mappings = await getStore().listMappings();
  } catch (err) {
    laddfel = err instanceof Error ? err.message : String(err);
  }

  // En rad per PRODUKT, räknad på den variant som har SÄMST marginal.
  // Varianter av samma produkt kan prissättas olika; den svagaste är den som
  // biter, och en snittad marginal hade dolt den.
  const rows: MarginRow[] = [];
  let okand = 0;
  for (const m of mappings) {
    const kandidater = (m.variants ?? [])
      .map((v) =>
        toMarginRow(
          {
            wixProductId: m.wixProductId,
            title: m.seoTitle || m.wixProductId,
            landedCostSek: v.landedCostSek,
            grossSek: v.grossSek,
          },
          vat,
        ),
      )
      .filter((r): r is MarginRow => r !== null);
    if (kandidater.length === 0) {
      okand += 1;
      continue;
    }
    rows.push(kandidater.reduce((a, b) => (b.marginPct < a.marginPct ? b : a)));
  }

  const band = summarizeBands(rows, okand);
  const kluster = clusterByMultiple(rows).slice(0, 8);

  const valtBand = BANDS.find((b) => b.id === params.band)?.id ?? null;
  const valdMult = params.mult ? Number(params.mult) : null;

  let lista = rows;
  if (valtBand) lista = lista.filter((r) => r.bandId === valtBand);
  if (valdMult !== null && Number.isFinite(valdMult)) {
    lista = lista.filter((r) => Math.round(r.multiple * 100) / 100 === valdMult);
  }
  const visade = valtBand || valdMult !== null
    ? [...lista].sort((a, b) => b.gapSek - a.gapSek)
    : biggestOpportunities(lista, 40);

  const totaltGap = rows.reduce((s, r) => s + r.gapSek, 0);
  const underMal = rows.filter((r) => r.gapSek > 0).length;

  return (
    <main style={{ maxWidth: 1080, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <Link href="/admin">← Tillbaka till admin</Link>
        {" · "}
        <Link href="/admin/sync-alerts?filter=price">Prishöjnings-alerts</Link>
        {" · "}
        <Link href="/admin/pricing">Prissättningsregler</Link>
      </p>

      <h1 style={{ marginBottom: 4 }}>Marginaler</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        Hela katalogen, räknad på landad kostnad mot pris inkl. {vat} % moms.
        Marginalen är av <strong>nettot</strong>. Produkter med flera varianter
        visas på den <strong>sämsta</strong> varianten — det är den som biter.
      </p>

      {laddfel ? (
        <p style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 12, borderRadius: 8 }}>
          Kunde inte läsa mappningarna: {laddfel}
        </p>
      ) : null}

      {/* ── Sammanfattning ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "20px 0" }}>
        <Kort etikett="Produkter" varde={String(rows.length + okand)} />
        <Kort etikett="Under målet" varde={String(underMal)} />
        <Kort
          etikett={`Att hämta per order (mål ${pct(TARGET_MARGIN_PCT)})`}
          varde={kr(totaltGap)}
          hint="Summan av vad varje produkt saknar upp till målmarginalen, per såld enhet."
        />
        {okand > 0 ? <Kort etikett="Utan kostnadsdata" varde={String(okand)} /> : null}
      </div>

      {/* ── 1. Banden ──────────────────────────────────────────────────── */}
      <h2 style={{ marginBottom: 8 }}>Fördelning</h2>
      <div style={{ display: "flex", height: 28, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb" }}>
        {band
          .filter((b) => b.count > 0)
          .map((b) => (
            <Link
              key={b.band.id}
              href={`/admin/margins?band=${b.band.id}`}
              title={`${b.band.label}: ${b.count} st (${pct(b.sharePct)})`}
              style={{
                width: `${b.sharePct}%`,
                background: b.band.color,
                display: "block",
                minWidth: 2,
              }}
            />
          ))}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 14 }}>
        <tbody>
          {band.map((b) => (
            <tr key={b.band.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "6px 8px", width: 16 }}>
                <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: b.band.color }} />
              </td>
              <td style={{ padding: "6px 8px", fontWeight: b.band.target ? 700 : 400 }}>
                {b.count > 0 ? (
                  <Link href={`/admin/margins?band=${b.band.id}`}>{b.band.label}</Link>
                ) : (
                  <span style={{ color: "#9ca3af" }}>{b.band.label}</span>
                )}
              </td>
              <td style={{ padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{b.count}</td>
              <td style={{ padding: "6px 8px", textAlign: "right", color: "#666", fontVariantNumeric: "tabular-nums" }}>
                {pct(b.sharePct)}
              </td>
              <td style={{ padding: "6px 8px", textAlign: "right", color: "#666", fontVariantNumeric: "tabular-nums" }}>
                {b.gapSek > 0 ? kr(b.gapSek) : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── 2. Multiplarna ─────────────────────────────────────────────── */}
      {kluster.length > 0 ? (
        <>
          <h2 style={{ marginTop: 32, marginBottom: 4 }}>Prismultiplar</h2>
          <p style={{ color: "#666", marginTop: 0, fontSize: 14 }}>
            Pris ÷ landad kostnad, grupperat. En stor klump på <em>exakt samma</em>{" "}
            multipel betyder att en och samma inställning satt priset på alla dem
            samtidigt — ett systematiskt fel, inte enskilda misstag.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ padding: "6px 8px" }}>Multipel</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>Produkter</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>Andel</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>Motsvarar marginal</th>
              </tr>
            </thead>
            <tbody>
              {kluster.map((k) => (
                <tr key={k.multiple} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "6px 8px", fontWeight: 600 }}>
                    <Link href={`/admin/margins?mult=${k.multiple}`}>
                      {k.multiple.toLocaleString("sv-SE", { minimumFractionDigits: 2 })}×
                    </Link>
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{k.count}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#666", fontVariantNumeric: "tabular-nums" }}>
                    {pct(k.sharePct)}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {pct(k.medianMarginPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      {/* ── 3. Listan ──────────────────────────────────────────────────── */}
      <h2 style={{ marginTop: 32, marginBottom: 4 }}>
        {valtBand
          ? `Produkter i ${BANDS.find((b) => b.id === valtBand)!.label}`
          : valdMult !== null
            ? `Produkter på ${valdMult.toLocaleString("sv-SE", { minimumFractionDigits: 2 })}×`
            : "Störst att hämta"}
      </h2>
      <p style={{ color: "#666", marginTop: 0, fontSize: 14 }}>
        Sorterad på <strong>kronor</strong> per order, inte procent. 8 % på en
        79-kronorspryl är sex kronor; 12 % på en soffa är hundralappar.
        {valtBand || valdMult !== null ? (
          <>
            {" "}
            <Link href="/admin/margins">Visa alla igen</Link>
          </>
        ) : null}
      </p>
      {visade.length === 0 ? (
        <p style={{ color: "#888" }}>Inga produkter matchar. </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ padding: "6px 8px" }}>Produkt</th>
              <th style={{ padding: "6px 8px", textAlign: "right" }}>Kostnad</th>
              <th style={{ padding: "6px 8px", textAlign: "right" }}>Pris</th>
              <th style={{ padding: "6px 8px", textAlign: "right" }}>Multipel</th>
              <th style={{ padding: "6px 8px", textAlign: "right" }}>Marginal</th>
              <th style={{ padding: "6px 8px", textAlign: "right" }}>Vinst/order</th>
              <th style={{ padding: "6px 8px", textAlign: "right" }}>Att hämta</th>
            </tr>
          </thead>
          <tbody>
            {visade.map((r) => {
              const f = BANDS.find((b) => b.id === r.bandId)!;
              return (
                <tr key={r.wixProductId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "6px 8px", maxWidth: 320 }}>{r.title}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{kr(r.landedCostSek)}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{kr(r.grossSek)}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {r.multiple.toLocaleString("sv-SE", { maximumFractionDigits: 2 })}×
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: f.color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {pct(r.marginPct)}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{kr(r.profitSek)}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {r.gapSek > 0 ? kr(r.gapSek) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}

function Kort({ etikett, varde, hint }: { etikett: string; varde: string; hint?: string }) {
  return (
    <div
      title={hint}
      style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", minWidth: 140 }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>{etikett}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{varde}</div>
    </div>
  );
}
