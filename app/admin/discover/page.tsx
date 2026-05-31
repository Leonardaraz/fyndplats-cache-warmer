// /admin/discover — sök och importera EU-lager-produkter från AliExpress.
//
// Server-komponent som bara ramar in client-komponenten. Search-state och
// importköra lever client-side eftersom det är mycket interaktivt och vi
// vill undvika full page-refresh per sökning.

import Link from "next/link";
import DiscoverClient from "./DiscoverClient";

export const dynamic = "force-dynamic";

export default function DiscoverPage() {
  return (
    <main style={{ maxWidth: 1200, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <Link href="/admin">← Tillbaka till admin</Link>
      </p>
      <h1>Upptäck EU-lager-produkter</h1>
      <p style={{ fontSize: 14, color: "#444", maxWidth: 720 }}>
        Sök efter AliExpress-produkter att importera, prioriterat på snabba
        EU-warehouses (3–7 dagars leverans till Sverige). Klicka <b>Importera</b>{" "}
        på en träff för att köra hela import-flödet (SEO + översättning + bilder + Wix-skapande).
        Lägg sökord i <b>Bevakningslistan</b> om du vill att cron-jobbet ska
        mejla nya träffar dagligen.
      </p>
      <DiscoverClient />
    </main>
  );
}
