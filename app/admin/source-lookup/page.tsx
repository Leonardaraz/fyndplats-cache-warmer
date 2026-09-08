// Admin: hitta vilken LEVERANTÖRSPRODUKT en importerad Wix-produkt är länkad till.
// Klistra in Wix-produkt-id, slug eller storefront-URL → få leverantör,
// artikelnummer och länk. Ren läsning, inga skrivningar.
//
// Det här är vägen till ett Aosom-artikelnummer när en order ska läggas för
// hand: numret bor på mappningsraden och får inte skrivas till en publik
// Actions-logg, men här är det bakom admin-inloggningen där det hör hemma.

import Link from "next/link";
import { LookupClient } from "./lookup-client";

export const dynamic = "force-dynamic";

export default function SourceLookupPage() {
  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <Link href="/admin">← Tillbaka till admin</Link>
      </p>
      <h1>Hitta leverantörskällan</h1>
      <p style={{ fontSize: 14, color: "#444" }}>
        Klistra in en produkts <b>Wix-produkt-id</b>, dess <b>slug</b> eller en hel{" "}
        <b>produkt-URL</b> (t.ex. <code>https://www.fyndplats.se/produkt/…</code>) så visas{" "}
        <b>leverantören</b>, <b>artikelnumret</b> och länken till produktsidan. Fungerar för både
        AliExpress och Aosom, och för alla produkter som importerats via verktyget.
      </p>

      <LookupClient />
    </main>
  );
}
