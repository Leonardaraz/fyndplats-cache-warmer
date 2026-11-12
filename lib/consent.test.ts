import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CONSENT_COOKIE,
  CONSENT_KEY,
  CONSENT_SIGNALS,
  consentBootstrapScript,
  MATVARD,
  consentState,
  marketingConsentFromCookie,
  pushConsentUpdate,
  CONSENT_REOPEN_EVENT,
  reopenConsentBanner,
  takeReopenRequest,
  taggLaddare,
  TAGG_DIREKT,
  TAGG_INTERAKTIONER,
  TAGG_RESERV_MS,
} from "./consent.ts";
import { readFileSync } from "node:fs";

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

describe("consentBootstrapScript — mäter bara på butikens adress", () => {
  const LANDNING = "https://www.fyndplats.se/produkt/x?utm_source=chatgpt.com&srsltid=abc";
  // Kör skriptet som i webbläsaren, med en påhittad window på en given värd.
  const kor = (vard: string) => {
    const s: Record<string, unknown> = {
      location: { hostname: vard, href: `${LANDNING}#galleri` },
      document: { referrer: "https://chatgpt.com/", title: "Produkt X" },
      localStorage: { getItem: () => null },
      Date,
    };
    s.window = s;
    new Function("s", `with (s) { ${consentBootstrapScript("G-TESTAR123")} }`)(s);
    return s as { dataLayer: IArguments[]; gtag: (...a: unknown[]) => void };
  };
  const forsta = (s: { dataLayer: IArguments[] }) =>
    s.dataLayer.map((a) => `${a[0]}:${typeof a[1] === "string" ? a[1] : "-"}`);

  it("på www.fyndplats.se köas samtycket före config och den första sidvisningen sist", () => {
    assert.equal(MATVARD, "www.fyndplats.se");
    const s = kor(MATVARD);
    assert.deepEqual(forsta(s), ["consent:default", "js:-", "config:G-TESTAR123", "event:page_view"]);
    s.gtag("event", "view_item");
    assert.equal(s.dataLayer.length, 5);
  });

  it("configens egen sidvisning är avstängd: taggen kommer sent, adressen kan ha bytts", () => {
    const s = kor(MATVARD);
    assert.deepEqual(s.dataLayer[2]?.[2], { send_page_view: false });
  });

  it("sidvisningen bär landningsadressen med utm och srsltid, hänvisaren och titeln", () => {
    // ChatGPT:s utm-parametrar och Googles srsltid är källan. Läses adressen
    // först när taggen kommer kan ett tryck på en länk redan ha bytt den.
    const s = kor(MATVARD);
    assert.deepEqual(s.dataLayer[3]?.[2], {
      page_location: LANDNING,
      page_referrer: "https://chatgpt.com/",
      page_title: "Produkt X",
    });
  });

  it("på ett bygges egen vercel.app-adress köas ingenting, inte heller senare händelser", () => {
    for (const vard of ["fyndplats-headless-7105jjz7a-leonardarazs-projects.vercel.app", "fyndplats.se", "localhost"]) {
      const s = kor(vard);
      assert.deepEqual(s.dataLayer, [], vard);
      s.gtag("event", "purchase", { value: 1 });
      assert.deepEqual(s.dataLayer, [], vard);
    }
  });
});

// ---------------------------------------------------------------------------
// Taggen hämtas när besökaren rör sidan (Leonard 2026-11-12)
// ---------------------------------------------------------------------------

type Lyssnare = { typ: string; fn: () => void; opt: { capture?: boolean; passive?: boolean } };
type Skript = { src: string; async: boolean; onload: null | (() => void) };

/** Kör laddaren i en påhittad webbläsare där tid, bildrutor och nätet styrs för hand. */
function laddare(l: { vard?: string; sokvag?: string; href?: string; laddad?: boolean } = {}) {
  const lyssnare: Lyssnare[] = [];
  const timers: { ms: number; fn: () => void }[] = [];
  const bildrutor: (() => void)[] = [];
  const skript: Skript[] = [];
  const gtagAnrop: unknown[][] = [];
  const loc = {
    hostname: l.vard ?? MATVARD,
    pathname: l.sokvag ?? "/produkt/a",
    href: l.href ?? "https://www.fyndplats.se/produkt/a?utm_source=chatgpt.com",
  };
  const s: Record<string, unknown> = {
    location: loc,
    document: {
      readyState: l.laddad ? "complete" : "loading",
      title: "Titel",
      createElement: () => ({ src: "", async: false, onload: null }),
      head: { appendChild: (el: Skript) => void skript.push(el) },
    },
    addEventListener: (typ: string, fn: () => void, opt: Lyssnare["opt"]) => void lyssnare.push({ typ, fn, opt }),
    removeEventListener: (typ: string, fn: () => void, opt: Lyssnare["opt"]) => {
      const i = lyssnare.findIndex((x) => x.typ === typ && x.fn === fn && x.opt?.capture === opt?.capture);
      if (i > -1) lyssnare.splice(i, 1);
    },
    setTimeout: (fn: () => void, ms: number) => void timers.push({ ms, fn }),
    requestAnimationFrame: (fn: () => void) => void bildrutor.push(fn),
    gtag: (...a: unknown[]) => void gtagAnrop.push(a),
  };
  s.window = s;
  new Function("s", `with (s) { ${taggLaddare("G-TESTAR123")} }`)(s);
  const interaktion = (typ: string) => {
    for (const x of lyssnare.filter((y) => y.typ === typ)) x.fn();
  };
  const ritaBildruta = () => { for (const f of bildrutor.splice(0)) f(); };
  const korTimers = (ms?: number) => {
    for (const t of timers.splice(0)) {
      if (ms === undefined || t.ms === ms) t.fn();
      else timers.push(t);
    }
  };
  return { lyssnare, timers, bildrutor, skript, gtagAnrop, loc, interaktion, ritaBildruta, korTimers };
}

describe("taggLaddare", () => {
  it("på en annan värd än butikens gör den ingenting", () => {
    for (const vard of ["fyndplats-headless-7105jjz7a-leonardarazs-projects.vercel.app", "fyndplats.se", "localhost"]) {
      const m = laddare({ vard, sokvag: "/tack" });
      assert.equal(m.skript.length, 0, vard);
      assert.equal(m.lyssnare.length, 0, vard);
      assert.equal(m.timers.length, 0, vard);
    }
  });

  it("på www väntar den: inget skript förrän besökaren rör sidan", () => {
    const m = laddare();
    assert.equal(m.skript.length, 0);
    const typer = m.lyssnare.filter((x) => x.typ !== "load").map((x) => x.typ).sort();
    assert.deepEqual(typer, [...TAGG_INTERAKTIONER].sort());
    for (const x of m.lyssnare.filter((y) => y.typ !== "load")) {
      // Fångstfasen ser också rullning i inre rutor; passiv stör aldrig rullningen.
      assert.deepEqual(x.opt, { capture: true, passive: true }, x.typ);
    }
  });

  it("aldrig på pointerdown eller touchstart: trycket ska hinna besvaras först", () => {
    // Ligger biblioteket i cachen körs det millisekunder efter att det begärts.
    // Begärt när fingret landar hade det kört före tryckets klick.
    for (const typ of ["pointerdown", "touchstart", "mousedown"]) {
      assert.ok(!(TAGG_INTERAKTIONER as readonly string[]).includes(typ), typ);
    }
    assert.ok((TAGG_INTERAKTIONER as readonly string[]).includes("pointerup"));
  });

  it("ett tryck hämtar taggen först efter nästa bildruta, och bara en gång", () => {
    const m = laddare();
    m.interaktion("pointerup");
    assert.equal(m.skript.length, 0, "inte i samma händelse som trycket");
    assert.equal(m.lyssnare.filter((x) => x.typ !== "load").length, 0, "lyssnarna tas bort direkt");
    m.ritaBildruta();
    assert.equal(m.skript.length, 0, "inte i bildrutans eget anrop heller");
    m.korTimers(0);
    assert.equal(m.skript.length, 1);
    assert.equal(m.skript[0]?.src, "https://www.googletagmanager.com/gtag/js?id=G-TESTAR123");
    assert.equal(m.skript[0]?.async, true);
    // Reserven efter load hittar taggen redan hämtad.
    m.interaktion("load");
    m.korTimers(TAGG_RESERV_MS);
    assert.equal(m.skript.length, 1);
  });

  it("rullning, tangent och musrörelse räknas också", () => {
    for (const typ of ["scroll", "wheel", "keydown", "mousemove", "touchend"]) {
      const m = laddare();
      m.interaktion(typ);
      m.ritaBildruta();
      m.korTimers(0);
      assert.equal(m.skript.length, 1, typ);
    }
  });

  it("utan interaktion hämtas taggen 10 s efter load", () => {
    assert.equal(TAGG_RESERV_MS, 10_000);
    const m = laddare();
    assert.equal(m.timers.length, 0, "klockan startar först vid load");
    m.interaktion("load");
    assert.deepEqual(m.timers.map((t) => t.ms), [TAGG_RESERV_MS]);
    m.korTimers(TAGG_RESERV_MS);
    assert.equal(m.skript.length, 1);
    assert.equal(m.lyssnare.filter((x) => x.typ !== "load").length, 0);
  });

  it("körs laddaren efter load startar klockan direkt", () => {
    const m = laddare({ laddad: true });
    assert.deepEqual(m.timers.map((t) => t.ms), [TAGG_RESERV_MS]);
  });

  it("på tacksidan hämtas taggen direkt: köpet skickas när sidan öppnas", () => {
    assert.deepEqual([...TAGG_DIREKT], ["/tack"]);
    for (const sokvag of ["/tack", "/tack/"]) {
      const m = laddare({ sokvag });
      assert.equal(m.skript.length, 1, sokvag);
      assert.equal(m.lyssnare.length, 0, sokvag);
    }
    const annan = laddare({ sokvag: "/tackkort" });
    assert.equal(annan.skript.length, 0, "/tackkort är inte tacksidan");
  });

  it("byttes adressen innan taggen kom, skickas en sidvisning för den nya sidan", () => {
    // Googles historiklyssnare fanns inte när länken trycktes och såg aldrig bytet.
    const m = laddare({ href: "https://www.fyndplats.se/produkt/a?utm_source=chatgpt.com#galleri" });
    m.interaktion("pointerup");
    m.ritaBildruta();
    m.korTimers(0);
    m.loc.href = "https://www.fyndplats.se/produkt/b";
    m.skript[0]?.onload?.();
    assert.deepEqual(m.gtagAnrop, [[
      "event",
      "page_view",
      {
        page_location: "https://www.fyndplats.se/produkt/b",
        page_referrer: "https://www.fyndplats.se/produkt/a?utm_source=chatgpt.com",
        page_title: "Titel",
      },
    ]]);
  });

  it("samma sida, också med en annan fragmentdel, ger ingen extra sidvisning", () => {
    const m = laddare({ href: "https://www.fyndplats.se/produkt/a" });
    m.interaktion("scroll");
    m.ritaBildruta();
    m.korTimers(0);
    m.loc.href = "https://www.fyndplats.se/produkt/a#recensioner";
    m.skript[0]?.onload?.();
    assert.deepEqual(m.gtagAnrop, []);
  });

  it("kastar på ett mät-ID som kan bryta ut ur script-taggen", () => {
    for (const ont of ["G-X');alert(1);//", "</script>", ""]) {
      assert.throws(() => taggLaddare(ont), /otillåtet mät-ID/);
    }
  });
});

describe("layouten skriver ut kön och laddaren i samma skript", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

  it("laddaren följer direkt efter kön, bara i produktion", () => {
    assert.match(
      layout,
      /IS_PRODUCTION && \(\s*<script\s+dangerouslySetInnerHTML=\{\{ __html: consentBootstrapScript\(GA_MEASUREMENT_ID\) \+ taggLaddare\(GA_MEASUREMENT_ID\) \}\}/,
    );
  });

  it("gtag.js skrivs inte ut en gång till med next/script", () => {
    // Två vägar in hade hämtat och kört biblioteket två gånger.
    assert.doesNotMatch(layout, /googletagmanager\.com\/gtag\/js/);
  });
});
