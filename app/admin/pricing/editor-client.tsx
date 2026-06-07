"use client";

import { useMemo, useState, useTransition } from "react";
import { computePriceWithRules } from "@/lib/import/pricing";
import type { PricingRules, PricingTier, RoundingStrategy } from "@/lib/import/types";
import { savePricingRulesAction } from "./actions";

export interface PricingSample {
  name: string;
  costUsd: number;
  category: string | null;
  /** Nuvarande säljpris (från senaste import) — null om okänt. */
  currentGrossSek: number | null;
}

const ROUNDING_OPTIONS: { value: RoundingStrategy; label: string }[] = [
  { value: "charm9", label: "Avrunda upp till närmaste 9 (t.ex. 499, 489, 579 kr)" },
  { value: "nearest10", label: "Avrunda upp till närmaste hela 10-krona" },
  { value: "charm90", label: "Avrunda till .90 (t.ex. 249,90 kr)" },
  { value: "integer", label: "Avrunda till närmaste hela krona" },
  { value: "none", label: "Inte avrunda alls" },
];

const orange = "#F47A35";

export function PricingEditor({
  rules: initial,
  categoryNames,
  samples,
}: {
  rules: PricingRules;
  categoryNames: string[];
  samples: PricingSample[];
}) {
  const [rules, setRules] = useState<PricingRules>(initial);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [useFixed, setUseFixed] = useState<boolean>(initial.fixedSurchargeSek > 0);

  function patch(p: Partial<PricingRules>) {
    setRules((r) => ({ ...r, ...p }));
    setStatus(null);
  }

  function setCategoryMultiplier(name: string, value: number | null) {
    setRules((r) => {
      const next = { ...r.categoryMultipliers };
      if (value == null || !Number.isFinite(value)) delete next[name];
      else next[name] = value;
      return { ...r, categoryMultipliers: next };
    });
    setStatus(null);
  }

  function setTier(i: number, p: Partial<PricingTier>) {
    setRules((r) => {
      const tiers = r.tiers.map((t, idx) => (idx === i ? { ...t, ...p } : t));
      return { ...r, tiers };
    });
    setStatus(null);
  }

  function addTier() {
    setRules((r) => ({
      ...r,
      tiers: [...r.tiers, { minCostSek: 0, maxCostSek: null, multiplier: r.defaultMultiplier }],
    }));
  }

  function removeTier(i: number) {
    setRules((r) => ({ ...r, tiers: r.tiers.filter((_, idx) => idx !== i) }));
  }

  function save() {
    const toSave: PricingRules = {
      ...rules,
      fixedSurchargeSek: useFixed ? rules.fixedSurchargeSek : 0,
    };
    startTransition(async () => {
      const res = await savePricingRulesAction(toSave);
      setStatus(
        res.ok
          ? { ok: true, msg: "Sparat — gäller från nästa import." }
          : { ok: false, msg: res.error ?? "Okänt fel vid sparande." },
      );
    });
  }

  // Live-förhandsgranskning med (ev. osparade) regler. Använder importpipelinens
  // riktiga prisfunktion → kan aldrig drifta från det faktiska importpriset.
  const previewRules: PricingRules = useMemo(
    () => ({ ...rules, fixedSurchargeSek: useFixed ? rules.fixedSurchargeSek : 0 }),
    [rules, useFixed],
  );

  return (
    <div style={{ marginTop: 16 }}>
      {/* --- Standardregel --- */}
      <Section title="Standardregel">
        <label style={rowStyle}>
          <span style={{ flex: "1 1 auto" }}>Multiplicera inköp (landad SEK-kostnad) med</span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={rules.defaultMultiplier}
            onChange={(e) => patch({ defaultMultiplier: Number(e.target.value) })}
            style={numInput}
          />
          <span>×</span>
        </label>

        <label style={rowStyle}>
          <input
            type="checkbox"
            checked={useFixed}
            onChange={(e) => setUseFixed(e.target.checked)}
          />
          <span style={{ flex: "1 1 auto" }}>Lägg på fast påslag (exkl. moms)</span>
          <input
            type="number"
            step="1"
            min="0"
            disabled={!useFixed}
            value={rules.fixedSurchargeSek}
            onChange={(e) => patch({ fixedSurchargeSek: Number(e.target.value) })}
            style={numInput}
          />
          <span>kr</span>
        </label>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
          <label style={{ fontSize: 13 }}>
            USD→SEK-kurs:{" "}
            <input
              type="number"
              step="0.1"
              min="0"
              value={rules.usdToSek}
              onChange={(e) => patch({ usdToSek: Number(e.target.value) })}
              style={numInput}
            />
          </label>
          <label style={{ fontSize: 13 }}>
            Moms %:{" "}
            <input
              type="number"
              step="1"
              min="0"
              value={rules.vatRatePercent}
              onChange={(e) => patch({ vatRatePercent: Number(e.target.value) })}
              style={numInput}
            />
          </label>
        </div>
      </Section>

      {/* --- Per-kategori-regler --- */}
      <Section title="Per-kategori-regler">
        <p style={hint}>
          Multiplikator per kategori (Wix-kollektionens namn). Tom = använd
          standardmultiplikatorn. Gäller produkter vars kategori auto-sätts vid import.
        </p>
        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f1f1f1", textAlign: "left" }}>
              <th style={th}>Kategori</th>
              <th style={th}>Påslag (×)</th>
            </tr>
          </thead>
          <tbody>
            {categoryNames.map((name) => (
              <tr key={name} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td}>{name}</td>
                <td style={td}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder={`${rules.defaultMultiplier} (standard)`}
                    value={rules.categoryMultipliers[name] ?? ""}
                    onChange={(e) =>
                      setCategoryMultiplier(name, e.target.value === "" ? null : Number(e.target.value))
                    }
                    style={numInput}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* --- Avancerade regler (intervall) --- */}
      <Section title="Avancerade regler (per inköpspris-intervall)">
        <label style={{ ...rowStyle, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={rules.tiersEnabled}
            onChange={(e) => patch({ tiersEnabled: e.target.checked })}
          />
          <span>
            <b>Aktivera intervall-baserad prissättning</b> (åsidosätter kategori- och
            standardregeln när ett intervall matchar)
          </span>
        </label>
        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse", opacity: rules.tiersEnabled ? 1 : 0.5 }}>
          <thead>
            <tr style={{ background: "#f1f1f1", textAlign: "left" }}>
              <th style={th}>Från (kr)</th>
              <th style={th}>Till (kr, tomt = ∞)</th>
              <th style={th}>Påslag (×)</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {rules.tiers.map((t, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td}>
                  <input
                    type="number" min="0" step="1" disabled={!rules.tiersEnabled}
                    value={t.minCostSek}
                    onChange={(e) => setTier(i, { minCostSek: Number(e.target.value) })}
                    style={numInput}
                  />
                </td>
                <td style={td}>
                  <input
                    type="number" min="0" step="1" disabled={!rules.tiersEnabled}
                    value={t.maxCostSek ?? ""}
                    placeholder="∞"
                    onChange={(e) => setTier(i, { maxCostSek: e.target.value === "" ? null : Number(e.target.value) })}
                    style={numInput}
                  />
                </td>
                <td style={td}>
                  <input
                    type="number" min="0" step="0.1" disabled={!rules.tiersEnabled}
                    value={t.multiplier}
                    onChange={(e) => setTier(i, { multiplier: Number(e.target.value) })}
                    style={numInput}
                  />
                </td>
                <td style={td}>
                  <button type="button" onClick={() => removeTier(i)} disabled={!rules.tiersEnabled} style={linkBtn}>
                    Ta bort
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={addTier} disabled={!rules.tiersEnabled} style={{ ...linkBtn, marginTop: 6 }}>
          + Lägg till intervall
        </button>
      </Section>

      {/* --- Avrundning --- */}
      <Section title="Avrundning">
        {ROUNDING_OPTIONS.map((o) => (
          <label key={o.value} style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
            <input
              type="radio"
              name="rounding"
              checked={rules.rounding === o.value}
              onChange={() => patch({ rounding: o.value })}
            />{" "}
            {o.label}
          </label>
        ))}
      </Section>

      {/* --- Spara --- */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0 24px" }}>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          style={{
            background: orange, color: "#fff", border: "none", padding: "8px 18px",
            borderRadius: 6, cursor: pending ? "default" : "pointer", fontWeight: 700, fontSize: 14,
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Sparar…" : "Spara"}
        </button>
        {status ? (
          <span style={{ fontSize: 13, color: status.ok ? "#070" : "#a00" }}>{status.msg}</span>
        ) : null}
      </div>

      {/* --- Förhandsgranskning --- */}
      <Section title="Förhandsgranska">
        {samples.length === 0 ? (
          <p style={hint}>
            Inga importerade produkter med känd inköpskostnad att förhandsgranska ännu.
          </p>
        ) : (
          <>
            <p style={hint}>
              Live-beräkning med reglerna ovan (innan du sparar). Nuvarande = senaste
              importerade pris.
            </p>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f1f1f1", textAlign: "left" }}>
                  <th style={th}>Produkt</th>
                  <th style={th}>Kategori</th>
                  <th style={th}>Inköp (USD)</th>
                  <th style={th}>Nuvarande pris</th>
                  <th style={th}>Nytt pris</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((s, i) => {
                  const next = computePriceWithRules(s.costUsd, previewRules, s.category).grossSek;
                  const changed = s.currentGrossSek != null && Math.abs(next - s.currentGrossSek) >= 0.01;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={td}>{s.name.slice(0, 50)}</td>
                      <td style={td}>{s.category ?? <span style={{ color: "#999" }}>—</span>}</td>
                      <td style={td}>${s.costUsd.toFixed(2)}</td>
                      <td style={td}>{s.currentGrossSek != null ? `${s.currentGrossSek.toFixed(2)} kr` : "—"}</td>
                      <td style={{ ...td, fontWeight: 600, color: changed ? orange : "#222" }}>
                        {next.toFixed(2)} kr
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 20, padding: 16, background: "#fff", border: "1px solid #e3e3e3", borderRadius: 8 }}>
      <h2 style={{ marginTop: 0, fontSize: 16 }}>{title}</h2>
      {children}
    </section>
  );
}

const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 6 };
const numInput: React.CSSProperties = { width: 90, padding: "4px 6px", border: "1px solid #ccc", borderRadius: 4, fontSize: 13 };
const th: React.CSSProperties = { padding: "6px 8px", fontSize: 13 };
const td: React.CSSProperties = { padding: "6px 8px" };
const hint: React.CSSProperties = { fontSize: 12, color: "#666", marginTop: 0 };
const linkBtn: React.CSSProperties = { background: "none", border: "none", color: "#F47A35", cursor: "pointer", fontSize: 13, padding: 0 };
