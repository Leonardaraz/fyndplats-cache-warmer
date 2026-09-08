import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CONSENT_COOKIE,
  CONSENT_KEY,
  CONSENT_SIGNALS,
  consentBootstrapScript,
  consentState,
  marketingConsentFromCookie,
} from "./consent.ts";

// Granskning 2026-08-19: samtycket låg bara i localStorage, som servern inte
// kan läsa. /tack bygger Google-konfigurationen SERVER-side och den innehåller
// kundens e-postadress — utan en serverläsbar signal hamnade adressen i sidans
// RSC-payload även för den som valt "bara nödvändiga", tvärtemot vad
// sekretesspolicyn lovar.

describe("marketingConsentFromCookie", () => {
  it("bara exakt \"all\" räknas som samtycke", () => {
    assert.equal(marketingConsentFromCookie("all"), true);
    assert.equal(marketingConsentFromCookie(" all "), true);
  });

  it("nekar som default — saknad cookie är inte samtycke", () => {
    // Ett uteblivet enkätfönster är ett mycket mindre fel än en e-postadress
    // i HTML hos någon som sagt nej.
    for (const v of [null, undefined, "", "necessary", "ALL", "true", "yes"]) {
      assert.equal(marketingConsentFromCookie(v), false);
    }
  });

  it("cookienamnet ar HARLETT ur localStorage-nyckeln, inte skrivet tva ganger", () => {
    // Poängen är inte att de råkar vara lika just nu — CONSENT_COOKIE är
    // definierad SOM CONSENT_KEY, så den likheten kan inte brytas. Det testet
    // fanns här förut och var därmed värdelöst (granskning 2026-08-19).
    // Driften som faktiskt kunde uppstå var hårdkodade "fp_cookie_consent" i
    // cookieconsent.tsx; de läser nu konstanten. Kvar att låsa: att värdet
    // aldrig blir tomt, vilket hade gett en namnlös cookie.
    assert.equal(CONSENT_COOKIE, CONSENT_KEY);
    assert.ok(CONSENT_KEY.length > 0);
    assert.doesNotMatch(CONSENT_KEY, /[\s;=,]/, "cookienamn tål inte dessa tecken");
  });
});

// ---------------------------------------------------------------------------
// Consent Mode v2
// ---------------------------------------------------------------------------
// Mätning 2026-09-08: AW-11073697020 fyrade page_view och ga-audiences med en
// beständig annons-identifierare för en besökare som valt "Endast nödvändiga",
// eftersom ingen samtyckessignal någonsin skickades.

describe("consentState", () => {
  it("nekar ALLA FYRA för necessary — inklusive analytics_storage", () => {
    // Beslutet 2026-09-08: bannern lovar "Endast nödvändiga", så analysen får
    // inte köra vidare i bakgrunden. Kostar mätdata, men är det bannern säger.
    const s = consentState("necessary");
    for (const flagga of CONSENT_SIGNALS) assert.equal(s[flagga], "denied");
  });

  it("beviljar alla fyra för all", () => {
    const s = consentState("all");
    for (const flagga of CONSENT_SIGNALS) assert.equal(s[flagga], "granted");
  });

  it("saknat val nekar — samma nekande default som cookie-läsningen", () => {
    for (const v of [null, undefined]) {
      assert.equal(consentState(v).ad_storage, "denied");
    }
  });
});

describe("consentBootstrapScript", () => {
  const js = consentBootstrapScript("G-TESTAR123");

  it("sätter default till denied FÖRE config — en sen default är verkningslös", () => {
    const iDefault = js.indexOf("'consent','default'");
    const iConfig = js.indexOf("'config'");
    assert.ok(iDefault > -1 && iConfig > -1);
    assert.ok(iDefault < iConfig, "default måste komma före config");
  });

  it("nämner alla fyra signalerna", () => {
    for (const flagga of CONSENT_SIGNALS) assert.ok(js.includes(flagga), flagga);
  });

  it("beviljar synkront för den som redan sagt ja", () => {
    // Utan den här raden börjar VARJE sidladdning för en samtyckande kund i
    // denied och uppgraderas först efter hydrering — sidvisningen hinner då gå
    // iväg utan samtycke.
    assert.ok(js.includes(`localStorage.getItem('${CONSENT_KEY}')==='all'`));
    assert.ok(js.includes("'consent','update'"));
  });

  it("localStorage-läsningen är inbäddad i try/catch", () => {
    // Kastar i privat läge och med blockerade cookies. Kastar den, körs varken
    // gtag('js') eller config och HELA mätningen försvinner.
    assert.ok(js.includes("try{"), "läsningen måste vara skyddad");
    assert.ok(js.includes("catch(e){}"));
  });

  it("bäddar in mät-ID:t som gavs", () => {
    assert.ok(js.includes("G-TESTAR123"));
  });
});
