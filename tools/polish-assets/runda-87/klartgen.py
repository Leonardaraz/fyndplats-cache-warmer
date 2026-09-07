# -*- coding: utf-8 -*-
"""Genererar klart-anropet (Steg 12): laser tillbaka alla atta ur Wix.

Facit-talen och de forvantade strangarna typas ALDRIG for hand in i anropet
— de genereras mekaniskt ur samma filer som linten godkant. Batch 64:s
matning: fil -> 0 fel, inline -> 9 fel.

Den tyska ordlistan ar sjalvtestad at BADA hallen (se TYSKA nedan): den far
inte traffa var egen text, och den maste falla verklig tysk leverantorstext.
Bara (a) ar ett bevis pa att grinden inte tittar.
"""
import json
import os
import re

HAR = os.path.dirname(os.path.abspath(__file__))
L = lambda n: json.load(open(os.path.join(HAR, n), encoding="utf-8"))

plan = L("skrivplan.json")
facit = L("facit.json")
vid = L("variantid.json")
media = L("media-plan.json")

kortfil = {r["kort"]: [p for p in r["poster"] if p["kort"]][0]["id"] for r in media}

# --- Tyska ordlistan -------------------------------------------------------
# Sammansatta stammar ar SUBSTRANGAR: \bzelt\b matchar aldrig "Zeltgarage".
# Korta funktionsord ar \b-ankrade. "den" och "dem" ar SVENSKA och far
# darfor inte sta har — de fallde 61 gonger i var egen text.
STAMMAR = ("zelt|schuppen|ger[aä]te|wetterfest|winterfest|wasserdicht|"
           "lieferumfang|abmess|rahmen|gro[sß]e|t[uü]r(?![a-zå-ö])|dach|"
           "schwarz|grau|wohn|garten|haus|stahl|kunststoff|regalb|"
           "beschicht|witterung|pulver|verschlie")
# ☠️ `\b` far INTE anvandas har: i JavaScript ar den ASCII-ONLY, sa "a"
# raknas som ICKE-ordtecken och \bder\b matchar mitt inne i "vader".
# Python:s `\b` ar Unicode-medveten och gor det INTE — sjalvtestet gick
# alltsa gront medan grinden fallde tre korrekta svenska texter.
# GRANS ar skriven som en explicit klass och beter sig LIKADANT i bada
# motorerna, sa sjalvtestet och grinden inte kan bli oense.
GRANS = r"[\wåäöÅÄÖ]"
ORD = r"(?<!%s)(?:mit|und|der|die|das|f[uü]r|ein|eine|nicht|auch|sind|ist|von)(?!%s)" % (GRANS, GRANS)
TYSKA = "(?:%s)|%s" % (STAMMAR, ORD)

# --- Sjalvtest (a): far inte traffa var egen text -------------------------
rx = re.compile(TYSKA, re.I)
tr = []
for r in plan:
    s = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", r["html"])).strip()
    tr += [(m.group(0), r["kort"]) for m in rx.finditer(s)]
    for falt in ("name", "title", "meta", "slug"):
        tr += [(m.group(0), r["kort"] + "/" + falt) for m in rx.finditer(r[falt])]
if tr:
    raise SystemExit("ORDLISTAN TRAFFAR VAR EGEN TEXT: %s" % sorted(set(tr))[:10])

# --- Sjalvtest (b): maste falla verklig tysk text -------------------------
# Prov at andra hallet: dessa svenska ord fick INTE falla. "vader"
# fallde pa \bder\b i JavaScript 2026-09-07 — den raden ar regressionen.
SVENSK_PROV = ["Det är vardagsväder på en öppen tomt.",
               "Mer duk fångar mer väder.",
               "Ett stadigt underlag och rejäl grund.",
               "Kläder och läder tål väta sämre än duk."]

TYSK_PROV = [
    "Geräteschuppen, Zeltgarage, große Tür, rostfreier Metallrahmen",
    "geräteschuppen zeltgarage große tür",
    "Garagenzelt wasserdicht Zeltgarage mit Tür UV-beständig",
    "Gartenhaus Gerätehaus mit Boden und Fenster, wetterfest",
    "Schwarz, Abmessungen 220 x 157 cm, Lieferumfang: 1 x Zelt",
]
slapper = [t for t in TYSK_PROV if not rx.search(t)]
if slapper:
    raise SystemExit("ORDLISTAN SLAPPER TYSK TEXT: %s" % slapper)
falskt = [(t, rx.search(t).group(0)) for t in SVENSK_PROV if rx.search(t)]
if falskt:
    raise SystemExit("ORDLISTAN FALLER SVENSK TEXT: %s" % falskt)
print("ordlistan: 0 traffar i egen text, %d/%d tyska prov faller, "
      "%d/%d svenska prov slapper igenom"
      % (len(TYSK_PROV), len(TYSK_PROV), len(SVENSK_PROV), len(SVENSK_PROV)))

rader = []
for r in plan:
    k = r["kort"]
    rader.append({
        "kort": k, "id": r["id"], "slug": r["slug"],
        "name": r["name"], "title": r["title"], "meta": r["meta"],
        "langd": facit[k]["synligLangd"], "hash": facit[k]["synligHash"],
        "sku": vid[k]["sku"], "variantId": vid[k]["variantId"],
        "kortFil": kortfil[k],
    })

HUVUD = """async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  const APP  = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
  const RADER = %s;
  const synlig = (h) => h.replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();
  const hasha = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) %% 1000000007; return h; };
  const TYSKA = new RegExp(%s, "i");
  const FLIKAR = ["Tekniska specifikationer", "Anv\\u00e4ndning och sk\\u00f6tsel", "Vanliga fr\\u00e5gor"];
  // ☠️ PLAIN_DESCRIPTION MASTE begaras — DESCRIPTION ger ett annat falt och
  //    lamnar plainDescription TOM. Kommaseparerat `fields` ger 400; upprepa.
  // ☠️ VARIANTS_INFO ar INGET giltigt faltvarde och ger 400 "Failed to parse
  //    JSON or deserialize protobuf message" — ett svar som laser som ett
  //    trasigt ANROP, inte som ett okant enum-varde. Varianterna kommer med
  //    i standardprojektionen anda (uppmatt: 1 variant i varje lyckat GET).
  const FALT = "?fields=MEDIA_ITEMS_INFO&fields=PLAIN_DESCRIPTION";
  const ut = {};
  for (const r of RADER) {
    const brister = [];
    const g = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id + FALT });
    const p = g.data.product;
    const html = p.plainDescription ?? "";

    // --- Text: facit pa BADE langd och hash ---
    const s = synlig(html);
    if (s.length !== r.langd) brister.push("langd " + s.length + " != " + r.langd);
    if (hasha(s) !== r.hash) brister.push("hash " + hasha(s) + " != " + r.hash);

    // --- Namn, slug, SEO ---
    const slug = typeof p.slug === "string" ? p.slug : ((p.slug && p.slug.name) || "");
    if (p.name !== r.name) brister.push("namn: " + p.name);
    if (slug !== r.slug) brister.push("slug: " + slug);
    const tags = p.seoData?.tags ?? [];
    const t = tags.find((x) => x.type === "title");
    const m = tags.find((x) => x.type === "meta" && x.props?.name === "description");
    if ((t?.children ?? "") !== r.title) brister.push("seo-titel: " + (t?.children ?? "SAKNAS"));
    if ((m?.props?.content ?? "") !== r.meta) brister.push("seo-meta: " + (m?.props?.content ?? "SAKNAS"));

    // Grinden laser HELA seoData — settings.keywords overlever annars hela
    // poleringen med leverantorens tyska rubrik (Steg 7 ror bara tags).
    const kw = (p.seoData?.settings?.keywords ?? [])
      .map((x) => (typeof x === "string" ? x : (x.term ?? ""))).join(" | ");
    if (TYSKA.test(kw)) brister.push("tyskt keyword: " + kw);

    // --- Ingen tysk text, inget "Skickas fran", ingen kommalista ---
    const tyskT = s.match(TYSKA);
    if (tyskT) brister.push("tyskt ord i texten: " + tyskT[0]);
    if (/Skickas fr\\u00e5n/i.test(html)) brister.push("Skickas fran");
    if (/(?:B\\u00f6r|Bra) att veta|beh\\u00f6ver veta innan du k\\u00f6per/i.test(s)) brister.push("varningsblock");
    if (/\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*cm/.test(s)) brister.push("kommalista av tal");
    if (/Artikelnummer|Modellreferens|Artikelnr/i.test(s)) brister.push("artikelnummer i texten");

    // Flikrubrikerna ORDAGRANT som RENA h2 — inte feta, inte span-lindade.
    for (const f of FLIKAR) {
      if (!new RegExp("<h2>\\\\s*" + f + "\\\\s*</h2>").test(html)) brister.push("flik ej ren h2: " + f);
    }

    // --- Bilder ---
    const items = p.media?.itemsInfo?.items ?? [];
    if (items.length !== 6) brister.push("bilder: " + items.length);
    if (items.filter((i) => !i.image?.url).length) brister.push("bild utan url");
    const alt = items.map((i) => i.image?.altText ?? "");
    if (alt.some((a) => !a)) brister.push("alt-text saknas");
    if (new Set(alt).size !== alt.length) brister.push("alt-text inte unik");
    if (!((items[2]?.image?.url ?? "").includes(r.kortFil))) brister.push("kortet inte pa plats 3");

    // --- Data: SKU pa RATT variant (aldrig pa position) ---
    const vs = p.variantsInfo?.variants ?? [];
    const v = vs.find((x) => x.id === r.variantId);
    if (!v) brister.push("variantId hittades inte: " + r.variantId);
    else if ((v.sku ?? "") !== r.sku) brister.push("sku: " + (v.sku ?? "SAKNAS"));

    // --- Kategorier: forlader + lov, last ur kategori-API:t ---
    const c = await wix.request({ scope: "site", siteId: SITE, method: "POST",
      url: "https://www.wixapis.com/categories/v1/categories/list-categories-for-item",
      body: { item: { catalogItemId: r.id, appId: APP },
              treeReference: { appNamespace: "@wix/stores" } } });
    const kat = c.data.directCategoryIds ?? [];
    for (const [id, namn] of [["653ab052-6952-4ce7-842d-ad691cd8206d", "Tradgard & Utemobler"],
                              ["1632eeea-c2ba-4f47-96c1-a77c254f3822", "Forvaring & Organisering"]]) {
      if (!kat.includes(id)) brister.push("kategori saknas: " + namn);
    }

    ut[r.kort] = { brister, revision: p.revision, synlig: p.visible,
                   variantSynlig: vs.map((x) => x.visible),
                   pris: v?.price?.actualPrice?.amount ?? null,
                   antalKategorier: kat.length, langd: s.length };
  }
  return ut;
}"""

js = HUVUD % (json.dumps(rader, ensure_ascii=False), json.dumps(TYSKA))
open(os.path.join(HAR, "klart.js"), "w", encoding="utf-8").write(js)
print("klart.js  %d tecken, %d produkter" % (len(js), len(rader)))

# ☠️ Sjalvtestet ovan kor i PYTHON, grinden kor i JAVASCRIPT. De tva
# motorerna ar OENSE om `\b`, och det gick gront i den ena medan den
# andra fallde tre korrekta svenska texter. Kor darfor samma prov en
# gang till i node MOT DEN GENERERADE FILEN — annars ar sjalvtestet ett
# bevis om fel motor.
import subprocess
p = subprocess.run(["node", os.path.join(HAR, "tyska-prov.js")],
                   cwd=HAR, capture_output=True, text=True)
print(p.stdout.strip())
if p.returncode != 0:
    raise SystemExit("JS-provet fallde — klart.js far inte koras: %s" % p.stderr[:300])
