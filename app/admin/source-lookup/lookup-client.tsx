"use client";

import { useState, useTransition } from "react";
import { lookupSourceAction, type FelRad, type KallRad, type LookupResult } from "./actions";

/** Hur uppslaget hittade produkten — skrivet för en människa. */
const MATCHNINGSNAMN: Record<string, string> = {
  id: "produkt-id",
  slug: "slug",
  order: "ordernummer",
  sku: "variant-SKU",
};

export function LookupClient() {
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<LookupResult | null>(null);
  const [kopierat, setKopierat] = useState<string | null>(null);

  function run() {
    if (!input.trim() || pending) return;
    setResult(null);
    setKopierat(null);
    startTransition(async () => {
      setResult(await lookupSourceAction(input));
    });
  }

  function kopiera(text: string, vad: string) {
    navigator.clipboard?.writeText(text).then(
      () => {
        setKopierat(vad);
        setTimeout(() => setKopierat(null), 2000);
      },
      () => {},
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run();
            }
          }}
          placeholder="Ordernummer, variant-SKU, Wix-produkt-id, slug eller produkt-URL"
          style={input_}
          disabled={pending}
          autoFocus
        />
        <button onClick={run} disabled={pending || !input.trim()} style={btnPrimary}>
          {pending ? "Söker…" : "Hitta källa"}
        </button>
      </div>

      {result && !result.ok ? <div style={boxError}>{result.error}</div> : null}

      {result && result.ok ? (
        <div>
          {result.order ? (
            <div style={{ marginTop: 14, fontSize: 14 }}>
              Order <b>{result.order}</b> · {result.rader.length} {result.rader.length === 1 ? "rad" : "rader"} ·
              matchad via {MATCHNINGSNAMN[result.matchedBy]}
            </div>
          ) : null}
          {result.rader.map((rad, i) =>
            "fel" in rad ? (
              <FelKort key={i} rad={rad} nr={result.order ? i + 1 : undefined} />
            ) : (
              <KallKort
                key={i}
                rad={rad}
                nr={result.order ? i + 1 : undefined}
                matchedBy={result.order ? undefined : MATCHNINGSNAMN[result.matchedBy]}
                kopierat={kopierat}
                kopiera={(text, vad) => kopiera(text, `${i}:${vad}`)}
                nyckel={`${i}:`}
              />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Orderraden: vad kunden köpte, så rätt variant beställs. */
function Orderrad({ rad, nr }: { rad: NonNullable<KallRad["orderrad"]>; nr?: number }) {
  return (
    <div style={{ marginTop: 8, padding: "8px 10px", background: "#f1f5ff", borderRadius: 6, fontSize: 13 }}>
      {nr ? <b>Rad {nr} · </b> : null}
      {rad.productName ? <>{rad.productName} · </> : null}
      {rad.quantity} st ·{" "}
      {rad.sku ? (
        <>
          variant <code>{rad.sku}</code>
        </>
      ) : (
        "variant saknas på orderraden"
      )}
    </div>
  );
}

function FelKort({ rad, nr }: { rad: FelRad; nr?: number }) {
  return (
    <div style={card}>
      {rad.orderrad ? <Orderrad rad={rad.orderrad} nr={nr} /> : null}
      <div style={boxError}>{rad.fel}</div>
    </div>
  );
}

function KallKort({
  rad,
  nr,
  matchedBy,
  kopierat,
  kopiera,
  nyckel,
}: {
  rad: KallRad;
  nr?: number;
  matchedBy?: string;
  kopierat: string | null;
  kopiera: (text: string, vad: "nummer" | "lank") => void;
  nyckel: string;
}) {
  return (
    <div style={card}>
      <div style={{ fontWeight: 600, fontSize: 15 }}>{rad.title ?? "(namnlös produkt)"}</div>
      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
        {rad.variantCount} varianter · Wix: <code>{rad.wixProductId}</code>
        {matchedBy ? <> · matchad via {matchedBy}</> : null}
      </div>

      {/* ⚠️ VILKEN VARIANT KUNDEN KÖPTE, inte bara vilken produkt. En sida
          med flera färger har en SKU per variant, och det är den raden som
          ska beställas — inte "produkten". */}
      {rad.orderrad ? <Orderrad rad={rad.orderrad} nr={nr} /> : null}
      {rad.varning ? <div style={boxWarn}>{rad.varning}</div> : null}

      <div style={{ marginTop: 10, fontSize: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span>
            {rad.leverantor}-artikelnummer: <code style={{ fontSize: 15, fontWeight: 600 }}>{rad.artikelnummer}</code>
          </span>
          {/* Numret, inte länken, är det som klistras in i Aosoms
              bulkorderformulär — därför en egen knapp för just det. */}
          <button onClick={() => kopiera(rad.artikelnummer, "nummer")} style={btn}>
            {kopierat === `${nyckel}nummer` ? "Kopierat ✓" : "Kopiera numret"}
          </button>
        </div>
        {rad.supplierName ? <div style={{ color: "#444", marginTop: 2 }}>Säljare: {rad.supplierName}</div> : null}
      </div>

      {rad.kallUrl ? (
        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
          <a href={rad.kallUrl} target="_blank" rel="noopener noreferrer" style={btnPrimary}>
            Öppna hos {rad.leverantor} ↗
          </a>
          <button onClick={() => kopiera(rad.kallUrl!, "lank")} style={btn}>
            {kopierat === `${nyckel}lank` ? "Kopierad ✓" : "Kopiera länk"}
          </button>
          <span style={{ fontSize: 12, color: "#888", wordBreak: "break-all" }}>{rad.kallUrl}</span>
        </div>
      ) : (
        <div style={boxError}>
          Mappningen saknar sourceUrl, så det går inte att bygga en länk till {rad.leverantor}. Artikelnumret ovan
          gäller ändå.
        </div>
      )}
    </div>
  );
}

const boxWarn: React.CSSProperties = {
  marginTop: 8,
  padding: "8px 10px",
  background: "#fff7e0",
  borderRadius: 6,
  fontSize: 13,
  color: "#7a5200",
};

const input_: React.CSSProperties = {
  flex: 1,
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 14,
};
const btn: React.CSSProperties = {
  padding: "8px 14px",
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
  textDecoration: "none",
  color: "#222",
};
const btnPrimary: React.CSSProperties = {
  padding: "8px 14px",
  border: "none",
  borderRadius: 4,
  background: "#F47A35",
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
};
const boxError: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  background: "#fde7e7",
  borderRadius: 6,
  fontSize: 13,
  color: "#a00",
};
const card: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#fff",
};
