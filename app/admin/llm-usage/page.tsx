// Admin-vy: LLM-användning (Claude vs Gemini), kostnad, cachehit-rate, budget.
// Server-renderad — läser direkt från lib/llm/{stats,budget,provider}.

import { getDailyStats } from "@/lib/llm/stats";
import { getBudgetCapUsd, getTodaysSpend } from "@/lib/llm/budget";
import { getProviderMode, isClaudeAvailable, isGeminiAvailable } from "@/lib/llm/provider";
import { setProviderModeAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LlmUsagePage() {
  const [days, todaySpend, cap, mode] = await Promise.all([
    getDailyStats(30),
    getTodaysSpend(),
    Promise.resolve(getBudgetCapUsd()),
    getProviderMode(),
  ]);

  const claudeOk = isClaudeAvailable();
  const geminiOk = isGeminiAvailable();
  const budgetPct = cap > 0 ? Math.min(100, Math.round((todaySpend.totalUsd / cap) * 100)) : 0;
  const overBudget = todaySpend.totalUsd >= cap;

  // Aggregerad totalsumma över de visade dagarna — bra för "har Leonard sparat
  // 80% genom att caten triggar Gemini?"-blick.
  let totalCalls = 0;
  let totalCacheHits = 0;
  let totalCostUsd = 0;
  let totalFailures = 0;
  for (const d of days) {
    totalCalls += d.totals.calls;
    totalCacheHits += d.totals.cacheHits;
    totalCostUsd += d.totals.costUsd;
    totalFailures += d.totals.failures;
  }
  const cacheHitRate = totalCalls > 0 ? Math.round((totalCacheHits / totalCalls) * 100) : 0;

  return (
    <main style={{ maxWidth: 960, margin: "40px auto", padding: "0 16px" }}>
      <h1>LLM-användning</h1>
      <p>
        Översikt över Claude- vs Gemini-trafik, kostnad, cachehit-rate och dagens budget.
        Routning sker i <code>lib/llm/router.ts</code>; admin-vy läser
        <code> FyndplatsLlmStats</code>-kollektionen.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>Provider-status</h2>
        <ul>
          <li>[{claudeOk ? "OK" : "saknas"}] ANTHROPIC_API_KEY</li>
          <li>[{geminiOk ? "OK" : "saknas"}] GEMINI_API_KEY (gratis-tier fallback)</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Dagens budget</h2>
        <p>
          <strong>${todaySpend.totalUsd.toFixed(4)}</strong> av <strong>${cap.toFixed(2)}</strong> USD ({budgetPct}%)
          {overBudget ? " — CAP NÅDD, Claude pausad till midnatt UTC." : ""}
        </p>
        <div
          style={{
            background: "#eee",
            borderRadius: 4,
            overflow: "hidden",
            height: 18,
            width: "100%",
          }}
        >
          <div
            style={{
              width: `${budgetPct}%`,
              height: "100%",
              background: overBudget ? "#d04444" : "#4a90e2",
              transition: "width 200ms",
            }}
          />
        </div>
        <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>
          Anrop i dag: Claude {todaySpend.callsByProvider.claude ?? 0} · Gemini{" "}
          {todaySpend.callsByProvider.gemini ?? 0}
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Provider-läge (override)</h2>
        <p style={{ fontSize: 13, color: "#666" }}>
          Aktivt läge: <code>{mode}</code>. Sätts av LLM_PROVIDER_DEFAULT i env men kan
          tvingas här utan deploy.
        </p>
        <form action={setProviderModeAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select name="mode" defaultValue={mode}>
            <option value="auto">auto (Claude → Gemini fallback)</option>
            <option value="claude">claude (bara Claude)</option>
            <option value="gemini">gemini (bara Gemini — gratis)</option>
          </select>
          <button type="submit">Sätt läge</button>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Sammanfattning (senaste 30 dagar)</h2>
        <ul>
          <li>Totalt antal anrop: {totalCalls}</li>
          <li>
            Cache-hits: {totalCacheHits} ({cacheHitRate}%)
          </li>
          <li>Failures: {totalFailures}</li>
          <li>Total kostnad: ${totalCostUsd.toFixed(4)} USD</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Per dag</h2>
        {days.length === 0 ? (
          <p>Inga anrop loggade ännu.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                <th style={{ padding: "6px 8px" }}>Dag</th>
                <th style={{ padding: "6px 8px" }}>Calls</th>
                <th style={{ padding: "6px 8px" }}>Cache</th>
                <th style={{ padding: "6px 8px" }}>Fail</th>
                <th style={{ padding: "6px 8px" }}>Claude $</th>
                <th style={{ padding: "6px 8px" }}>Gemini $</th>
                <th style={{ padding: "6px 8px" }}>Total $</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => {
                const claude = d.byProvider.claude;
                const gemini = d.byProvider.gemini;
                const cache = d.byProvider.cache;
                return (
                  <tr key={d.day} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "6px 8px" }}>{d.day}</td>
                    <td style={{ padding: "6px 8px" }}>{d.totals.calls}</td>
                    <td style={{ padding: "6px 8px" }}>{cache?.calls ?? 0}</td>
                    <td style={{ padding: "6px 8px" }}>{d.totals.failures}</td>
                    <td style={{ padding: "6px 8px" }}>${(claude?.costUsd ?? 0).toFixed(4)}</td>
                    <td style={{ padding: "6px 8px" }}>${(gemini?.costUsd ?? 0).toFixed(4)}</td>
                    <td style={{ padding: "6px 8px" }}>${d.totals.costUsd.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginTop: 24, fontSize: 13, color: "#666" }}>
        <p>
          Kostnadsberäkning baseras på <code>lib/llm/pricing.ts</code> (Claude Haiku 4.5:
          $1/M in, $5/M ut; Sonnet 4.5/4.6: $3/M in, $15/M ut; Gemini 2.0: $0 gratis-tier).
        </p>
        <p>
          Cache-träffar = inget provider-anrop alls. Persistent cache i Wix Data
          (FyndplatsClaudeCache, 30 dagar TTL).
        </p>
      </section>
    </main>
  );
}
