// Admin: hitta vilken AliExpress-produkt en importerad Wix-produkt är länkad till.
// Klistra in Wix-produkt-id, slug eller storefront-URL → få AliExpress-länken
// (slås upp i FyndplatsMappings). Ren läsning, inga skrivningar.

import Link from "next/link";
import { LookupClient } from "./lookup-client";

export const dynamic = "force-dynamic";

export default function SourceLookupPage() {
  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <Link href="/admin">← Tillbaka till admin</Link>
      </p>
      <h1>Hitta AliExpress-källa</h1>
      <p style={{ fontSize: 14, color: "#444" }}>
        Klistra in en produkts <b>Wix-produkt-id</b>, dess <b>slug</b> eller en hel{" "}
        <b>produkt-URL</b> (t.ex. <code>https://www.fyndplats.se/produkt/…</code>) så visas vilken
        AliExpress-produkt den importerades från. Slås upp i{" "}
        <code>FyndplatsMappings</code> — fungerar för alla produkter som importerats via verktyget.
      </p>

      <LookupClient />
    </main>
  );
}
