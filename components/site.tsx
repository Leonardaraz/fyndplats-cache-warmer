import { CartButton } from "./cart";
import { WishlistButton } from "./wishlist";
import { SearchBox } from "./searchbox";
import { MobileNav } from "./mobilenav";
import { MegaNav } from "./meganav";
import { getCategoryTree } from "../lib/category-groups";
import { getPosts } from "../lib/blog";
import { TrustBox, TRUSTBOX_TEMPLATES } from "./trustpilot";
import { GOOGLE_RATING, GOOGLE_REVIEWS_LABEL } from "../lib/social-proof";
import { PaymentMarks } from "./payment-marks";

export function GoogleG({ size = 16 }: { size?: number }) {
  return (
    <svg className="g-icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function Social({ className }: { className?: string }) {
  return (
    <span className={`social ${className || ""}`}>
      <a className="soc-ig" href="https://www.instagram.com/fyndplats/" target="_blank" rel="noopener noreferrer" aria-label="Fyndplats på Instagram">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" fillRule="evenodd" clipRule="evenodd" aria-hidden><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm5.4-3.3a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" /></svg>
      </a>
      <a className="soc-fb" href="https://www.facebook.com/profile.php?id=100089607278056" target="_blank" rel="noopener noreferrer" aria-label="Fyndplats på Facebook">
        <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden><path d="M13.4 22v-8.4h2.8l.4-3.3h-3.2V8.2c0-.95.32-1.6 1.7-1.6h1.8V3.65c-.3-.04-1.34-.13-2.55-.13-2.52 0-4.25 1.54-4.25 4.36v2.42H7.3v3.3h2.8V22h3.3Z" /></svg>
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
  const tree = await getCategoryTree();
  const hasBlog = (await getPosts()).length > 0; // dölj blogg-länk tills det finns inlägg
  return (
    <>
      <div className="promo">
        <div className="container promorow">
          <span className="promotext">🚚 Fri frakt över <b>499 kr</b> · Betala smidigt med <b className="klarna-mark">Klarna</b></span>
          <Social className="promo-social" />
        </div>
      </div>
      <header>
        <div className="container hrow">
          <a className="brand" href="/"><Mark />Fyndplats</a>
          <SearchBox />
          <MegaNav tree={tree} hasBlog={hasBlog} />
          <WishlistButton />
          <CartButton />
          <MobileNav tree={tree} hasBlog={hasBlog} />
        </div>
        {/* Egen sökrad på mobil — alltid synlig högt upp, utan att öppna menyn */}
        <div className="hsearch-mobile">
          <div className="container"><SearchBox /></div>
        </div>
      </header>
    </>
  );
}

export async function SiteFooter() {
  const hasBlog = (await getPosts()).length > 0;
  // Trustpilot Mini TrustBox — bara när Leonard fyllt i business unit-ID:t i
  // Vercel. Tom env → ingen widget, inget Trustpilot-script (noll extra request).
  const trustpilotBU = (process.env.TRUSTPILOT_BUSINESS_UNIT_ID || "").trim();
  return (
    <footer>
      <div className="container fgrid">
        <div>
          <div className="fbrand"><Mark size={30} />Fyndplats</div>
          <p style={{ fontSize: 14, color: "#a39c93", maxWidth: "30ch" }}>Trygg svensk e-handel med ett brett sortiment till låga priser.</p>
          <div className="grat"><span className="g-badge"><GoogleG size={15} /> Google</span> <b className="g-score">{GOOGLE_RATING}</b> <span className="star">★★★★★</span> <span className="g-count">({GOOGLE_REVIEWS_LABEL})</span></div>
          {trustpilotBU && (
            <TrustBox
              businessUnitId={trustpilotBU}
              templateId={TRUSTBOX_TEMPLATES.mini}
              height="150px"
              className="footer-trustbox"
            />
          )}
          <Social className="footer-social" />
        </div>
        <div className="fcol"><div className="fhead">Handla</div><a href="/butik">Butik</a><a href="/omoss">Om oss</a><a href="/omdomen">Omdömen</a>{hasBlog && <a href="/blogg">Blogg</a>}</div>
        <div className="fcol"><div className="fhead">Kundservice</div><a href="/vanliga-fragor">Vanliga frågor</a><a href="/returer">Returer &amp; ångerrätt</a><a href="/angra-kop">Ångra köp</a><a href="/eu-lager-garanti">EU-lager &amp; tull</a><a href="/kopvillkor">Köpvillkor</a><a href="/sparning">Spåra paket</a><a href="/kontaktaoss">Kontakta oss</a><a href="/kundtjanst">Kundtjänst</a></div>
        <div className="fcol"><div className="fhead">Kontakt &amp; betalning</div><a href="mailto:info@fyndplats.com">info@fyndplats.com</a><a href="tel:+46736630990">+46 (0) 736 630 990</a><PaymentMarks /></div>
      </div>
      <div className="fbar">©2021–2026 Fyndplats · Trygg svensk e-handel · <a href="/kopvillkor">Köpvillkor</a> · <a href="/sekretesspolicy">Sekretesspolicy</a> · <a href="/vara-butikspolicyer">Butikspolicyer</a> · <a href="/integritetspolicy-app">Integritetspolicy (app)</a> · <a href="/anvandarvillkor-app">Användarvillkor (app)</a></div>
    </footer>
  );
}
