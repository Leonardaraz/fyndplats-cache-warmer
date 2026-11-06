// Bolagsverkets uppslag: numret, tolkningen av svaret (formen ur Bolagsverkets
// OpenAPI-beskrivning 2026-11-06, med påhittade företag), anropen och beslutet.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  BV_API,
  BV_SCOPE,
  BV_TOKEN_URL,
  beslutForAnsokan,
  glomBolagsverketToken,
  identitetsbeteckning,
  slaUppForetag,
  tolkaSvar,
} from "./bolagsverket.ts";

beforeEach(() => glomBolagsverketToken());

const NU = Date.UTC(2026, 10, 6, 15, 0, 0);

/** En organisation i svaret, som i Bolagsverkets exempel. */
function org(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    organisationsidentitet: { identitetsbeteckning: "5299999994", typ: { kod: "ORGANISATIONSNUMMER", klartext: "n/a" } },
    organisationsnamn: {
      organisationsnamnLista: [
        { namn: "Cykelbolaget AB", organisationsnamntyp: { kod: "FORETAGSNAMN", klartext: "Företagsnamn" }, registreringsdatum: 1584230400000 },
        { namn: "Mopedbolaget AB", organisationsnamntyp: { kod: "SARSKILT_FORETAGSNAMN", klartext: "Särskilt företagsnamn" } },
      ],
      dataproducent: "Bolagsverket",
      fel: null,
    },
    organisationsform: { kod: "AB", klartext: "Aktiebolag", dataproducent: "Bolagsverket", fel: null },
    avregistreradOrganisation: { avregistreringsdatum: null, dataproducent: "Bolagsverket", fel: null },
    pagaendeAvvecklingsEllerOmstruktureringsforfarande: {
      pagaendeAvvecklingsEllerOmstruktureringsforfarandeLista: [],
      dataproducent: "Bolagsverket",
      fel: null,
    },
    verksamOrganisation: { kod: "JA", dataproducent: "SCB", fel: null },
    ...over,
  };
}

const KALLA_SVARAR_INTE = { typ: "OTILLGANGLIG_UPPGIFTSKALLA", felBeskrivning: "Uppkoppling mot Bolagsverket misslyckades." };

test("numret: tio siffror för en juridisk person, personnumret med sekel för en enskild firma", () => {
  assert.equal(identitetsbeteckning("529999-9994", "juridisk", NU), "5299999994");
  assert.equal(identitetsbeteckning("850101-1234", "enskild", NU), "198501011234");
  assert.equal(identitetsbeteckning("121212-1212", "enskild", NU), "201212121212", "född 2012 är yngre än hundra år");
  assert.equal(identitetsbeteckning("261106-1234", "enskild", NU), "202611061234", "samma år räknas till 2000-talet");
  assert.equal(identitetsbeteckning("271106-1234", "enskild", NU), "192711061234");
  assert.equal(identitetsbeteckning("12345", "juridisk", NU), null);
});

test("ett aktivt aktiebolag: företagsnamnet, inte det särskilda, och inget som hindrar", () => {
  const u = tolkaSvar({ organisationer: [org()] });
  assert.equal(u.utfall, "hittad");
  if (u.utfall !== "hittad") return;
  assert.equal(u.namn, "Cykelbolaget AB");
  assert.equal(u.formKod, "AB");
  assert.equal(u.formText, "Aktiebolag");
  assert.equal(u.aktiv, true);
  assert.deepEqual(u.orsaker, []);
});

test("avregistrerat, konkurs och inte verksamt hindrar var för sig", () => {
  const avreg = tolkaSvar({ organisationer: [org({ avregistreradOrganisation: { avregistreringsdatum: 984614400000, fel: null } })] });
  assert.deepEqual(avreg.utfall === "hittad" && [avreg.aktiv, avreg.orsaker], [false, ["avregistrerad"]]);

  const konkurs = tolkaSvar({
    organisationer: [
      org({
        pagaendeAvvecklingsEllerOmstruktureringsforfarande: {
          pagaendeAvvecklingsEllerOmstruktureringsforfarandeLista: [{ kod: "KK", klartext: "Konkurs", fromDatum: 1700000000000 }],
          fel: null,
        },
      }),
    ],
  });
  assert.deepEqual(konkurs.utfall === "hittad" && [konkurs.aktiv, konkurs.orsaker, konkurs.forfaranden], [false, ["forfarande"], ["Konkurs"]]);

  const vilande = tolkaSvar({ organisationer: [org({ verksamOrganisation: { kod: "NEJ", fel: null } })] });
  assert.deepEqual(vilande.utfall === "hittad" && [vilande.aktiv, vilande.orsaker], [false, ["ej-verksam"]]);
});

test("en källa som inte svarade gör svaret osäkert, aldrig godkänt", () => {
  for (const falt of ["organisationsnamn", "avregistreradOrganisation", "pagaendeAvvecklingsEllerOmstruktureringsforfarande"]) {
    const u = tolkaSvar({ organisationer: [org({ [falt]: { fel: KALLA_SVARAR_INTE } })] });
    assert.equal(u.utfall, "hittad", falt);
    if (u.utfall !== "hittad") continue;
    assert.equal(u.aktiv, false, falt);
    assert.ok(u.orsaker.includes("osaker"), falt);
  }
  // SCB:s uppgift om verksamhet saknas: inget hinder (bara ett uttryckligt NEJ hindrar).
  const utanScb = tolkaSvar({ organisationer: [org({ verksamOrganisation: { kod: null, fel: KALLA_SVARAR_INTE } })] });
  assert.equal(utanScb.utfall === "hittad" && utanScb.aktiv, true);
});

test("tom lista är saknas, ett trasigt svar är fel", () => {
  assert.deepEqual(tolkaSvar({ organisationer: [] }), { utfall: "saknas" });
  assert.deepEqual(tolkaSvar({ organisationer: [{}] }), { utfall: "saknas" });
  assert.deepEqual(tolkaSvar({}), { utfall: "fel", orsak: "svar" });
  assert.deepEqual(tolkaSvar(null), { utfall: "fel", orsak: "svar" });
});

test("flera enskilda firmor på samma personnummer: kundens namn, annars en aktiv", () => {
  const firma = (namn: string, avreg: number | null) =>
    org({
      organisationsnamn: { organisationsnamnLista: [{ namn, organisationsnamntyp: { kod: "FORETAGSNAMN" } }], fel: null },
      organisationsform: { kod: "E", klartext: "Enskild näringsidkare", fel: null },
      avregistreradOrganisation: { avregistreringsdatum: avreg, fel: null },
    });
  const svar = { organisationer: [firma("Gamla Skor", 984614400000), firma("Nya Cyklar", null), firma("Tredje Firman", null)] };
  const valt = tolkaSvar(svar, "nya  cyklar");
  assert.equal(valt.utfall === "hittad" && valt.namn, "Nya Cyklar");
  const aktiv = tolkaSvar(svar, "Något annat");
  assert.equal(aktiv.utfall === "hittad" && aktiv.namn, "Nya Cyklar", "första aktiva när namnet inte stämmer");
  const avregValt = tolkaSvar(svar, "Gamla Skor");
  assert.equal(avregValt.utfall === "hittad" && avregValt.aktiv, false, "kundens namn går före, också avregistrerad");
});

/** En låtsad Bolagsverket: token och uppslag. */
function bolagsverket(uppslag: (n: number) => Response, token: () => Response = () => Response.json({ access_token: "t1", expires_in: 3600 })) {
  const anrop: { url: string; init: RequestInit }[] = [];
  let n = 0;
  const fetchImpl = (async (url: string, init: RequestInit) => {
    anrop.push({ url, init });
    if (url === BV_TOKEN_URL) return token();
    return uppslag(n++);
  }) as unknown as typeof fetch;
  return { anrop, fetchImpl };
}

test("anropet: token med klientuppgifterna i Basic, uppslaget med Bearer och numret med sekel", async () => {
  const bv = bolagsverket(() => Response.json({ organisationer: [org()] }));
  const u = await slaUppForetag("121212-1212", "enskild", { fetchImpl: bv.fetchImpl, klientId: "id", klientHemlighet: "hemlis", nuMs: NU });
  assert.equal(u.utfall, "hittad");
  const [tok, upp] = bv.anrop;
  assert.equal(tok.url, BV_TOKEN_URL);
  const th = tok.init.headers as Record<string, string>;
  assert.equal(th.authorization, `Basic ${btoa("id:hemlis")}`);
  assert.equal(tok.init.body, `grant_type=client_credentials&scope=${encodeURIComponent(BV_SCOPE)}`);
  assert.equal(upp.url, `${BV_API}/organisationer`);
  assert.equal((upp.init.headers as Record<string, string>).authorization, "Bearer t1");
  assert.deepEqual(JSON.parse(String(upp.init.body)), { identitetsbeteckning: "201212121212" });
  assert.equal(upp.init.cache, "no-store");
});

test("token återanvänds tills en minut före utgången", async () => {
  const bv = bolagsverket(() => Response.json({ organisationer: [org()] }), () => Response.json({ access_token: "t", expires_in: 600 }));
  const d = { fetchImpl: bv.fetchImpl, klientId: "id", klientHemlighet: "h" };
  await slaUppForetag("529999-9994", "juridisk", { ...d, nuMs: NU });
  await slaUppForetag("529999-9994", "juridisk", { ...d, nuMs: NU + 539_000 });
  assert.equal(bv.anrop.filter((a) => a.url === BV_TOKEN_URL).length, 1);
  await slaUppForetag("529999-9994", "juridisk", { ...d, nuMs: NU + 540_000 });
  assert.equal(bv.anrop.filter((a) => a.url === BV_TOKEN_URL).length, 2);
});

test("401 på uppslaget: ny token en gång, sedan svaret", async () => {
  const bv = bolagsverket((n) => (n === 0 ? new Response("{}", { status: 401 }) : Response.json({ organisationer: [org()] })));
  const u = await slaUppForetag("529999-9994", "juridisk", { fetchImpl: bv.fetchImpl, klientId: "id", klientHemlighet: "h", nuMs: NU });
  assert.equal(u.utfall, "hittad");
  assert.equal(bv.anrop.filter((a) => a.url === BV_TOKEN_URL).length, 2);
  const alltid401 = bolagsverket(() => new Response("{}", { status: 401 }));
  assert.deepEqual(
    await slaUppForetag("529999-9994", "juridisk", { fetchImpl: alltid401.fetchImpl, klientId: "id", klientHemlighet: "h", nuMs: NU }),
    { utfall: "fel", orsak: "status" },
  );
});

test("saknade nycklar, 404, 500, token som nekas och nätfel", async () => {
  let anropat = false;
  const ingen = (async () => {
    anropat = true;
    return Response.json({});
  }) as unknown as typeof fetch;
  assert.deepEqual(await slaUppForetag("529999-9994", "juridisk", { fetchImpl: ingen, klientId: undefined, klientHemlighet: "h" }), {
    utfall: "fel",
    orsak: "nycklar-saknas",
  });
  assert.equal(anropat, false, "utan nycklar går inget anrop");

  const d = { klientId: "id", klientHemlighet: "h", nuMs: NU };
  assert.deepEqual(await slaUppForetag("529999-9994", "juridisk", { ...d, fetchImpl: bolagsverket(() => new Response("{}", { status: 404 })).fetchImpl }), {
    utfall: "saknas",
  });
  glomBolagsverketToken();
  assert.deepEqual(await slaUppForetag("529999-9994", "juridisk", { ...d, fetchImpl: bolagsverket(() => new Response("{}", { status: 500 })).fetchImpl }), {
    utfall: "fel",
    orsak: "status",
  });
  glomBolagsverketToken();
  const nekad = bolagsverket(() => Response.json({}), () => new Response("{}", { status: 400 }));
  assert.deepEqual(await slaUppForetag("529999-9994", "juridisk", { ...d, fetchImpl: nekad.fetchImpl }), { utfall: "fel", orsak: "token" });
  const kast = (async () => {
    throw new Error("nere");
  }) as unknown as typeof fetch;
  assert.deepEqual(await slaUppForetag("529999-9994", "juridisk", { ...d, fetchImpl: kast }), { utfall: "fel", orsak: "natverk" });
});

test("☠️ personnumret hamnar aldrig i loggen", async () => {
  const rader: string[] = [];
  const forr = { warn: console.warn, error: console.error, log: console.log };
  console.warn = (...a: unknown[]) => void rader.push(a.join(" "));
  console.error = console.warn;
  console.log = console.warn;
  try {
    const d = { klientId: "id", klientHemlighet: "h", nuMs: NU };
    await slaUppForetag("121212-1212", "enskild", { ...d, fetchImpl: bolagsverket(() => new Response("{}", { status: 500 })).fetchImpl });
    glomBolagsverketToken();
    await slaUppForetag("121212-1212", "enskild", { ...d, fetchImpl: bolagsverket(() => Response.json({}), () => new Response("{}", { status: 503 })).fetchImpl });
    const kast = (async () => {
      throw new Error("121212-1212");
    }) as unknown as typeof fetch;
    await slaUppForetag("121212-1212", "enskild", { ...d, fetchImpl: kast });
  } finally {
    Object.assign(console, forr);
  }
  assert.ok(rader.length > 0, "felen loggas");
  for (const r of rader) assert.ok(!/1212/.test(r), `loggraden bär numret: ${r}`);
});

test("beslutet: aktivt godkänns med det registrerade namnet, allt annat går till kön med orsaken", () => {
  const aktiv = beslutForAnsokan(tolkaSvar({ organisationer: [org()] }), NU);
  assert.equal(aktiv.status, "aktiv");
  assert.deepEqual(aktiv.kontroll, { utfall: "hittad", namn: "Cykelbolaget AB", form: "Aktiebolag", orsaker: [], kontrollerad: new Date(NU).toISOString() });

  const konkurs = beslutForAnsokan(
    tolkaSvar({
      organisationer: [
        org({
          pagaendeAvvecklingsEllerOmstruktureringsforfarande: {
            pagaendeAvvecklingsEllerOmstruktureringsforfarandeLista: [{ kod: "KK", klartext: "Konkurs" }],
            fel: null,
          },
        }),
      ],
    }),
    NU,
  );
  assert.equal(konkurs.status, "granskas");
  assert.deepEqual(konkurs.kontroll.orsaker, ["forfarande", "förfarande: Konkurs"]);

  assert.deepEqual(beslutForAnsokan({ utfall: "saknas" }, NU), {
    status: "granskas",
    kontroll: { utfall: "saknas", orsaker: ["finns inte hos Bolagsverket"], kontrollerad: new Date(NU).toISOString() },
  });
  assert.equal(beslutForAnsokan({ utfall: "fel", orsak: "natverk" }, NU).status, "granskas");
  assert.equal(beslutForAnsokan({ utfall: "fel", orsak: "nycklar-saknas" }, NU).kontroll.orsaker[0], "uppslaget föll: nycklar-saknas");

  const utanNamn = beslutForAnsokan(tolkaSvar({ organisationer: [org({ organisationsnamn: { organisationsnamnLista: [], fel: null } })] }), NU);
  assert.equal(utanNamn.status, "granskas", "utan namn godkänns inget");
  // Beslutet kräver namnet också när uppslaget (felaktigt) sagt aktiv.
  const tomt = beslutForAnsokan({ utfall: "hittad", namn: "", formKod: "AB", formText: null, aktiv: true, orsaker: [], forfaranden: [] }, NU);
  assert.equal(tomt.status, "granskas");
});
