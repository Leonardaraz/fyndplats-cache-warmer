import { CartButton } from "./cart";
import { SearchBox } from "./searchbox";
import { MobileNav } from "./mobilenav";
import { getCollections } from "../lib/products";

const HEADER_NAV = [
  { label: "Elektronik", match: "Elektronik" },
  { label: "Hem", match: "Hem & Inredning" },
  { label: "Skönhet", match: "Hudvård & Ansikte" },
  { label: "Mode", match: "Mode & Accessoarer" },
  { label: "Husdjur", match: "Husdjur" },
];

export function Social({ className }: { className?: string }) {
  return (
    <span className={`social ${className || ""}`}>
      <a href="https://www.instagram.com/fyndplats/" target="_blank" rel="noopener noreferrer" aria-label="Fyndplats på Instagram">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" /></svg>
      </a>
      <a href="https://www.facebook.com/profile.php?id=100089607278056" target="_blank" rel="noopener noreferrer" aria-label="Fyndplats på Facebook">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.5l.5-3H14V9.5c0-.3.2-.5.5-.5Z" /></svg>
      </a>
    </span>
  );
}

export const Mark = ({ size = 34 }: { size?: number }) => (
  <svg className="mark" viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <polygon points="12,2.4 21.6,7.5 12,12.6 2.4,7.5" fill="#FFB078" />
    <polygon points="2.4,7.5 12,12.6 12,21.6 2.4,16.5" fill="#F84848" />
    <polygon points="21.6,7.5 12,12.6 12,21.6 21.6,16.5" fill="#F88048" />
  </svg>
);

export async function SiteHeader() {
  const cats = await getCollections();
  const catHref = (m: string) => {
    const c = cats.find((x) => x.name === m);
    return c ? `/kategori/${c.slug}` : "/butik";
  };
  return (
    <>
      <div className="promo">
        <div className="container promorow">
          <span className="promotext">🚚 Fri frakt över <b>499 kr</b> · Betala smidigt med <b>Klarna</b></span>
          <Social className="promo-social" />
        </div>
      </div>
      <header>
        <div className="container hrow">
          <a className="brand" href="/"><Mark />Fyndplats</a>
          <SearchBox />
          <nav className="nav">
            <a href="/butik">Butik</a>
            {HEADER_NAV.map((n) => <a key={n.label} href={catHref(n.match)}>{n.label}</a>)}
          </nav>
          <CartButton />
          <MobileNav />
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="container fgrid">
        <div>
          <div className="fbrand"><Mark size={30} />Fyndplats</div>
          <p style={{ fontSize: 13.5, color: "#a39c93", maxWidth: "30ch" }}>Trygg svensk e-handel med ett brett sortiment till låga priser.</p>
          <div className="grat">Google – 4,9 <span className="star">★★★★★</span> (20 omdömen)</div>
          <Social className="footer-social" />
        </div>
        <div className="fcol"><h4>Handla</h4><a href="/butik">Butik</a><a href="/omoss">Om oss</a><a href="/omdomen">Omdömen</a><a href="/blogg">Blogg</a></div>
        <div className="fcol"><h4>Kundservice</h4><a href="/vanliga-fragor">Vanliga frågor</a><a href="/returer">Returer &amp; ångerrätt</a><a href="/sparning">Spåra paket</a><a href="/kontaktaoss">Kontakta oss</a><a href="/kundtjanst">Kundtjänst</a></div>
        <div className="fcol"><h4>Kontakt &amp; betalning</h4><a href="mailto:info@fyndplats.com">info@fyndplats.com</a><a href="tel:+46736630990">+46 (0) 736 630 990</a><div className="pills"><span>Klarna</span><span>VISA</span><span>MC</span><span>Amex</span></div></div>
      </div>
      <div className="fbar">©2021–2026 Fyndplats · Trygg svensk e-handel · <a href="/sekretesspolicy">Sekretesspolicy</a> · <a href="/vara-butikspolicyer">Butikspolicyer</a></div>
    </footer>
  );
}
