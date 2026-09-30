import { afterEach, describe, expect, it } from "vitest";
import { provaMejl, provaSidan, provmottagare, tvattaAdresser, type ProvDeps } from "./prov";
import type { RestockDeps } from "./notify";
import type { SendEmailInput, SendEmailResult } from "../email/resend";
import type { UppfriskningDetalj } from "../headless/produktsida";
import type { V3ProduktKort } from "../wix/v3-products";

const ID = "3f2c1a4e-9b7d-4c21-8e5f-0a1b2c3d4e5f";

const KORT: V3ProduktKort = {
  id: ID,
  namn: "Vägghängt sängbord 2-pack – svävande nattduksbord med RGB-LED",
  slug: "vagghangt-sangbord-rgb-led-2-pack",
  visible: true,
  bildUrl: "https://static.wixstatic.com/media/b379ce_ek~mv2.jpg",
  pris: { min: 1099, max: 1099 },
  varianter: [{ id: "v1", visible: true, namn: "", pris: 1099 }],
  harSynligVariant: true,
};

const forut = {
  OPS_ALERT_EMAIL: process.env.OPS_ALERT_EMAIL,
  HEALTH_ALERT_EMAIL: process.env.HEALTH_ALERT_EMAIL,
  HEADLESS_BASE_URL: process.env.HEADLESS_BASE_URL,
};
afterEach(() => {
  for (const [k, v] of Object.entries(forut)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

function fejk(o: {
  kort?: V3ProduktKort | null | (() => never);
  sidan?: UppfriskningDetalj;
  skicka?: (input: SendEmailInput) => Promise<SendEmailResult>;
} = {}) {
  const skickat: SendEmailInput[] = [];
  const tomda: string[] = [];
  const rordaListan: string[] = [];
  const kort = o.kort === undefined ? KORT : o.kort;
  const lasProdukt = async () => (typeof kort === "function" ? kort() : kort);
  const restock: RestockDeps = {
    // ☠️ Den riktiga bevakarlistan och stämplingen får aldrig nås av provet.
    listaVantande: async () => {
      rordaListan.push("lista");
      return [];
    },
    markeraMejlade: async () => {
      rordaListan.push("stampla");
    },
    lasProdukt,
    skicka: o.skicka ?? (async (input) => {
      skickat.push(input);
      return { id: "resend-123" };
    }),
    uppfriskaSida: async () => {
      rordaListan.push("sidan-utan-detalj");
      return "uppfriskad";
    },
    produktUrl: (slug) => `https://www.fyndplats.se/produkt/${slug}`,
  };
  const deps: ProvDeps = {
    lasProdukt,
    uppfriska: async (slug) => {
      tomda.push(slug);
      return o.sidan ?? { utfall: "uppfriskad", status: 200, varmning: { status: 200, cache: "MISS", age: "0" } };
    },
    restock,
  };
  return { deps, skickat, tomda, rordaListan };
}

describe("provaSidan", () => {
  it("tömmer produktsidans cache och säger att butiken tog emot nyckeln", async () => {
    delete process.env.HEADLESS_BASE_URL;
    const { deps, tomda } = fejk();
    const { http, svar } = await provaSidan(ID, deps);
    expect(http).toBe(200);
    expect(tomda).toEqual(["vagghangt-sangbord-rgb-led-2-pack"]);
    expect(svar).toMatchObject({
      ok: true,
      lage: "sidan",
      produkt: KORT.namn,
      stopp: null,
      butik: "www.fyndplats.se",
      utfall: "uppfriskad",
      status: 200,
      varmning: { status: 200, cache: "MISS", age: "0" },
    });
    expect(svar.diagnos).toMatch(/tog emot nyckeln/);
  });

  it("☠️ fel nyckel syns som butikens 404 — och svaret säger vilken sida som avvisade", async () => {
    const { deps } = fejk({ sidan: { utfall: "misslyckades", status: 404 } });
    const { http, svar } = await provaSidan(ID, deps);
    expect(http).toBe(200);
    expect(svar).toMatchObject({ ok: false, utfall: "misslyckades", status: 404 });
    expect(svar.diagnos).toMatch(/proxy avvisade nyckeln/);
  });

  it("saknad nyckel i motorn säger just det", async () => {
    const { deps } = fejk({ sidan: { utfall: "ingen_nyckel" } });
    const { svar } = await provaSidan(ID, deps);
    expect(svar).toMatchObject({ ok: false, utfall: "ingen_nyckel", status: null });
    expect(svar.diagnos).toMatch(/ADMIN_SECRET saknas i motorns miljö/);
  });

  it("en dold produkt töms ändå, men svaret säger att ett riktigt mejl inte hade gått", async () => {
    const { deps, tomda } = fejk({ kort: { ...KORT, visible: false } });
    const { svar } = await provaSidan(ID, deps);
    expect(tomda).toHaveLength(1);
    expect(svar).toMatchObject({ ok: true, stopp: "dold" });
  });

  it("en produkt som inte finns ger 404 utan något anrop till butiken", async () => {
    const { deps, tomda } = fejk({ kort: null });
    const { http, svar } = await provaSidan(ID, deps);
    expect(http).toBe(404);
    expect(tomda).toHaveLength(0);
    expect(svar).toMatchObject({ ok: false, stopp: "saknas_i_butiken" });
  });

  it("ett läsfel mot Wix ger 502, och adresser i felet tvättas bort", async () => {
    const { deps } = fejk({
      kort: () => {
        throw new Error("Wix 503 för kund@example.com");
      },
    });
    const { http, svar } = await provaSidan(ID, deps);
    expect(http).toBe(502);
    expect(svar.stopp).toBe("lasfel");
    expect(svar.diagnos).toContain("<adress>");
    expect(svar.diagnos).not.toContain("@");
  });
});

describe("provaMejl", () => {
  it("☠️ mejlet går till den interna adressen, bär [Prov] och rör aldrig bevakarlistan", async () => {
    process.env.OPS_ALERT_EMAIL = "drift@example.com";
    const { deps, skickat, tomda, rordaListan } = fejk();
    const { http, svar } = await provaMejl(ID, undefined, deps);
    expect(http).toBe(200);
    expect(skickat).toHaveLength(1);
    expect(skickat[0].to).toBe("drift@example.com");
    expect(skickat[0].mottagare).toBe("kund");
    expect(skickat[0].subject).toBe("[Prov] Tillbaka i lager: Vägghängt sängbord 2-pack");
    expect(skickat[0].bodyHtml).toContain("https://www.fyndplats.se/produkt/vagghangt-sangbord-rgb-led-2-pack");
    expect(tomda).toEqual(["vagghangt-sangbord-rgb-led-2-pack"]);
    expect(rordaListan).toEqual([]);
    expect(svar).toMatchObject({
      ok: true,
      lage: "mejl",
      mottagare: "OPS_ALERT_EMAIL",
      sandning: "skickat",
      resendId: "resend-123",
      utfall: "uppfriskad",
      status: 200,
    });
  });

  it("☠️ svaret bär aldrig adressen — loggen är publik", async () => {
    process.env.OPS_ALERT_EMAIL = "drift@example.com";
    const { deps } = fejk({
      skicka: async () => {
        throw new Error('Resend send misslyckades (403): {"message":"drift@example.com är inte tillåten"}');
      },
    });
    const { svar } = await provaMejl(ID, undefined, deps);
    expect(svar).toMatchObject({ ok: false, sandning: "fel" });
    expect(JSON.stringify(svar)).not.toContain("@");
    expect(svar.fel).toContain("(403)");
  });

  it("torrläge i motorns sändare är inget skickat mejl", async () => {
    const { deps } = fejk({ skicka: async () => ({ skipped: "dry_run" }) });
    const { svar } = await provaMejl(ID, undefined, deps);
    expect(svar).toMatchObject({ ok: false, sandning: "dry_run" });
    expect(svar.diagnos).toMatch(/SYNC_EMAIL_DRY_RUN/);
  });

  it("en variant som kom tillbaka ger variantmejlet", async () => {
    const sangbord: V3ProduktKort = {
      ...KORT,
      varianter: [
        { id: "v-ek", visible: true, namn: "Ekdekor", pris: 1099 },
        { id: "v-vit", visible: true, namn: "Vit", pris: 1149 },
      ],
    };
    const { deps, skickat } = fejk({ kort: sangbord });
    await provaMejl(ID, ["v-vit"], deps);
    expect(skickat[0].subject).toBe("[Prov] Tillbaka i lager: Vägghängt sängbord 2-pack – Vit");
  });

  it("en dold produkt får inget mejl, och svaret säger varför", async () => {
    const { deps, skickat, tomda } = fejk({ kort: { ...KORT, visible: false } });
    const { svar } = await provaMejl(ID, undefined, deps);
    expect(skickat).toHaveLength(0);
    expect(tomda).toHaveLength(0);
    expect(svar).toMatchObject({ ok: false, stopp: "dold", sandning: "ej_forsokt" });
  });
});

describe("provmottagare", () => {
  it("samma ordning som vaktens morgonmejl", () => {
    process.env.OPS_ALERT_EMAIL = "ops@example.com";
    process.env.HEALTH_ALERT_EMAIL = "halsa@example.com";
    expect(provmottagare()).toEqual({ adress: "ops@example.com", kalla: "OPS_ALERT_EMAIL" });
    delete process.env.OPS_ALERT_EMAIL;
    expect(provmottagare()).toEqual({ adress: "halsa@example.com", kalla: "HEALTH_ALERT_EMAIL" });
    delete process.env.HEALTH_ALERT_EMAIL;
    expect(provmottagare()).toEqual({ adress: "info@fyndplats.com", kalla: "kundtjanst" });
  });
});

describe("tvattaAdresser", () => {
  it("byter ut adresser, också inuti citattecken och JSON", () => {
    expect(tvattaAdresser('{"to":"a.b+c@exempel.se"} och <x@y.com>')).toBe('{"to":"<adress>"} och <<adress>>');
  });

  it("text utan adresser rörs inte", () => {
    expect(tvattaAdresser("Resend send misslyckades (403): domänen är inte verifierad")).toBe(
      "Resend send misslyckades (403): domänen är inte verifierad",
    );
  });
});
