// Admin-skelett. Fylls i kommande faser (produktlista, lönsamhetsöversikt,
// order-/sync-köer). Just nu en statusöversikt över vad som är konfigurerat.

function envStatus() {
  return [
    { key: "ANTHROPIC_API_KEY", label: "Claude (översättning/SEO)" },
    { key: "WIX_API_TOKEN", label: "Wix Stores-token" },
    { key: "WIX_SITE_ID", label: "Wix site-ID" },
    { key: "EXTENSION_API_TOKEN", label: "Tilläggets API-token" },
  ].map((e) => ({ ...e, set: Boolean(process.env[e.key]) }));
}

export default function AdminPage() {
  const status = envStatus();
  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h1>Fyndplats — Import & Sync</h1>
      <p>Internt verktyg för produktimport, lagersync och orderhantering (DSers-ersättning).</p>

      <h2>Konfiguration</h2>
      <ul>
        {status.map((s) => (
          <li key={s.key}>
            [{s.set ? "OK" : "saknas"}] {s.label} <code>({s.key})</code>
          </li>
        ))}
      </ul>

      <h2>Fas 1: Import</h2>
      <p>
        Endpoint <code>POST /api/import</code> är aktiv och skyddad med{" "}
        <code>x-fyndplats-token</code>. Browser-tillägget i <code>/extension</code> postar hit
        produktdata från en AliExpress-sida.
      </p>
    </main>
  );
}
