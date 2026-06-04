import { getCollections } from "../lib/products";

// Hämtar de FAKTISKA huvudkategorierna (parentlösa) ur katalogen i stället för
// hårdkodade slugs. Tidigare pekade 404-sidan på gamla/gissade slugs
// (/kategori/elektronik, hem-och-inredning, …) som själva 404:ade — en 404-sida
// som ledde till nya 404:or. Nu kan slugarna aldrig driva isär från katalogen.
export default async function NotFound() {
  let mains: { name: string; slug: string }[] = [];
  try {
    const cols = await getCollections();
    // getCollections() returnerar redan huvudkategorierna i MAIN_ORDER (se
    // lib/products.ts). Parentlösa kategorier har alla index 0, så en egen
    // index-sortering vore en no-op — behåll katalogens ordning.
    mains = cols
      .filter((c) => !c.parentId)
      .slice(0, 6)
      .map((c) => ({ name: c.name, slug: c.slug }));
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
