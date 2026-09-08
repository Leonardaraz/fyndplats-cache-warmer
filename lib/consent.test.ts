import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CONSENT_COOKIE,
  CONSENT_KEY,
  CONSENT_SIGNALS,
  consentBootstrapScript,
  consentState,
  marketingConsentFromCookie,
  pushConsentUpdate,
  CONSENT_REOPEN_EVENT,
  reopenConsentBanner,
  takeReopenRequest,
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

describe("consentBootstrapScript — härdning", () => {
  it("kastar på ett mät-ID som kan bryta ut ur script-taggen", () => {
    // Strängen renderas via dangerouslySetInnerHTML. Ett citattecken i ID:t
    // kör godtycklig kod på VARJE sida. I dag matas alltid modulkonstanten in,
    // men signaturen tar en string och ID:t kan flyttas till en env-variabel.
    for (const ont of [
      "G-X');alert(1);//",
      "G-X'}",
      "</script><script>alert(1)</script>",
      "G X",
      "",
    ]) {
      assert.throws(() => consentBootstrapScript(ont), /otillåtet mät-ID/);
    }
  });

  it("släpper igenom formen vi faktiskt använder", () => {
    assert.ok(consentBootstrapScript("G-W6NZ87CX2Q").includes("G-W6NZ87CX2Q"));
    assert.ok(consentBootstrapScript("AW-11073697020").includes("AW-11073697020"));
  });
});

describe("pushConsentUpdate", () => {
  // Funktionen som körs vid klick i bannern — vägen som gör att en
  // förstagångsbesökare någonsin uppgraderas från nekat till beviljat.
  const medFonster = (gtag: unknown, kropp: () => void) => {
    const fanns = "window" in globalThis;
    const original = (globalThis as Record<string, unknown>).window;
    (globalThis as Record<string, unknown>).window = { gtag };
    try {
      kropp();
    } finally {
      if (fanns) (globalThis as Record<string, unknown>).window = original;
      else delete (globalThis as Record<string, unknown>).window;
    }
  };

  it("skickar update med alla fyra beviljade vid \"all\"", () => {
    const anrop: unknown[][] = [];
    medFonster((...a: unknown[]) => anrop.push(a), () => pushConsentUpdate("all"));
    assert.equal(anrop.length, 1);
    assert.deepEqual(anrop[0]?.slice(0, 2), ["consent", "update"]);
    assert.deepEqual(anrop[0]?.[2], {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
    });
  });

  it("skickar update med alla fyra nekade vid \"necessary\"", () => {
    const anrop: unknown[][] = [];
    medFonster((...a: unknown[]) => anrop.push(a), () => pushConsentUpdate("necessary"));
    assert.deepEqual(anrop[0]?.[2], {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
  });

  it("är en no-op när gtag saknas — normalfallet utanför produktion", () => {
    // Preview och lokalt skrivs taggen inte ut alls, så window.gtag finns inte.
    // Bannern måste ändå fungera.
    medFonster(undefined, () => assert.doesNotThrow(() => pushConsentUpdate("all")));
  });

  it("sväljer ett gtag som kastar — mätning får aldrig fälla sidan", () => {
    medFonster(() => { throw new Error("gtag exploderade"); },
      () => assert.doesNotThrow(() => pushConsentUpdate("all")));
  });
});

describe("reopenConsentBanner / takeReopenRequest", () => {
  // Sekretesspolicyn lovar att samtycket går att ändra när som helst. Bannern
  // visar sig bara när localStorage är tomt, så utan den här vägen satt den
  // som valt en gång fast — och med Consent Mode blir valet bindande på riktigt.
  const medSession = (kropp: (butik: Map<string, string>, event: string[]) => void) => {
    const butik = new Map<string, string>();
    const event: string[] = [];
    const fanns = "window" in globalThis;
    const original = (globalThis as Record<string, unknown>).window;
    (globalThis as Record<string, unknown>).window = {
      sessionStorage: {
        getItem: (k: string) => butik.get(k) ?? null,
        setItem: (k: string, v: string) => void butik.set(k, v),
        removeItem: (k: string) => void butik.delete(k),
      },
      dispatchEvent: (e: { type: string }) => void event.push(e.type),
    };
    try {
      kropp(butik, event);
    } finally {
      if (fanns) (globalThis as Record<string, unknown>).window = original;
      else delete (globalThis as Record<string, unknown>).window;
    }
  };

  it("dispatchar eventet för en banner som redan lyssnar", () => {
    medSession((_butik, event) => {
      reopenConsentBanner();
      assert.deepEqual(event, [CONSENT_REOPEN_EVENT]);
    });
  });

  it("lämnar en flagga så klicket överlever att bannern inte monterat än", () => {
    // CookieConsent laddas ssr:false vid idle. Hinner besökaren scrolla till
    // sidfoten och trycka innan dess finns ingen lyssnare, och utan flaggan
    // hade knappen sett trasig ut.
    medSession(() => {
      reopenConsentBanner();
      assert.equal(takeReopenRequest(), true);
    });
  });

  it("begäran konsumeras EN gång — bannern ska inte öppnas om och om igen", () => {
    medSession(() => {
      reopenConsentBanner();
      assert.equal(takeReopenRequest(), true);
      assert.equal(takeReopenRequest(), false);
    });
  });

  it("utan klick finns ingen begäran att hämta", () => {
    medSession(() => assert.equal(takeReopenRequest(), false));
  });

  it("överlever att sessionStorage kastar — bannern får aldrig fälla sidfoten", () => {
    const fanns = "window" in globalThis;
    const original = (globalThis as Record<string, unknown>).window;
    const kastar = () => { throw new Error("sessionStorage blockerad"); };
    (globalThis as Record<string, unknown>).window = {
      sessionStorage: { getItem: kastar, setItem: kastar, removeItem: kastar },
      dispatchEvent: () => true,
    };
    try {
      assert.doesNotThrow(() => reopenConsentBanner());
      assert.equal(takeReopenRequest(), false);
    } finally {
      if (fanns) (globalThis as Record<string, unknown>).window = original;
      else delete (globalThis as Record<string, unknown>).window;
    }
  });
});
