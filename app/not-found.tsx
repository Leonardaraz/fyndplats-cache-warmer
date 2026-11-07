import { MAIN_ORDER } from "../lib/products";
import { sidhuvudsdata } from "../lib/sidhuvud-data";
import { populara } from "../lib/sidhuvud-val";

// Hämtar de FAKTISKA huvudkategorierna ur menyn i stället för hårdkodade slugs.
// Tidigare pekade 404-sidan på gamla/gissade slugs (/kategori/elektronik,
// hem-och-inredning, …) som själva 404:ade — en 404-sida som ledde till nya
// 404:or. Nu kan slugarna aldrig driva isär från menyn.
//
// ☠️ NEXT BYGGER DEN HÄR SIDAN MED VARJE SIDA, också när ingen 404 visas: den är
// gränsen för notFound() runt hela layouten. När den läste kategorierna ur
// katalogen (getCollections) väntade en ny instans in hela katalogen, 21–34 s,
// innan sidans ström stängdes. Mätt på förhandsbygget 2026-11-07: /konto syntes
// efter 2 s men blev klar först efter 26 s. Därför samma källa som sidhuvudet:
// en varm instans bygger ur katalogen, en kall läser den färdiga menyn
// (lib/sidhuvud-data.ts).
export default async function NotFound() {
  let mains: { name: string; slug: string }[] = [];
  try {
    const { tree } = await sidhuvudsdata();
    // De sex första i MAIN_ORDER, som getCollections() sorterade dem förut.
    mains = populara(tree, MAIN_ORDER).map((c) => ({ name: c.name, slug: c.slug }));
  } catch {
    mains = []; // fail-soft: hellre ingen kategori-rad än en trasig 404-sida
  }

  return (
    <div className="container nf-wrap">
      <div className="nf">
        <div className="nf-num">404</div>
        <h1 className="nf-title">Sidan kunde inte hittas</h1>
        <p className="nf-text">Den här sidan finns inte – eller så har vi flyttat den. Här är några vägar tillbaka in i butiken:</p>
        <div className="nf-actions">
          <a className="btn btn-primary" href="/">← Tillbaka till startsidan</a>
          <a className="btn btn-ghost" href="/butik">Se hela sortimentet</a>
        </div>
        {mains.length > 0 && (
          <div className="nf-cats">
            <div className="nf-cats-label">Populära kategorier</div>
            <div className="nf-cats-row">
              {mains.map((c) => (
                <a key={c.slug} href={`/kategori/${c.slug}`}>{c.name}</a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
