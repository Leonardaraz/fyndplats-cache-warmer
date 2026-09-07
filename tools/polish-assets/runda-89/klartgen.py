# -*- coding: utf-8 -*-
"""Runda 89 — klart-anropet (Steg 12): läser tillbaka alla sex ur Wix.

Facit-talen och de förväntade strängarna typas ALDRIG för hand in i anropet
— de genereras mekaniskt ur samma filer som linten godkänt.

☠️ Ordlistan är DELAD med linten (`grindar.TYSKA` + rundans `TYSKA_BANK`),
   inte en tvilling. Två kopior av samma lista glider isär.

☠️ `\\b` FÅR INTE ANVÄNDAS. I JavaScript är den ASCII-only, så `ä` räknas
   som icke-ordtecken och `\\bder\\b` matchar mitt inne i "väder". Python:s
   är Unicode-medveten och gör det inte — självtestet gick alltså grönt i
   Python medan grinden fällde tre korrekta svenska texter i JS. GRANS är
   en explicit klass och beter sig likadant i båda motorerna.
"""
import json
import os
import re
import subprocess
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)
L = lambda n: json.load(open(os.path.join(HAR, n), encoding="utf-8"))

from grindar import TYSKA as TYSKA_HUS                               # noqa: E402
from lint import TYSKA_BANK, GRANS                                   # noqa: E402

plan = L("skrivplan.json")
mediaplan = {r["kort"]: r["items"] for r in L("media-plan.json")}
facit = L("facit.json")
vid = L("variantid.json")
kortfil = L("kort-ids.json")

# Sammansatta stammar är SUBSTRÄNGAR (kickroller finns inne i "Kickroller"),
# korta funktionsord är gränsankrade.
STAMMAR = "|".join(sorted(TYSKA_BANK, key=len, reverse=True))
ORD = r"(?<!%s)(?:%s)(?!%s)" % (GRANS, "|".join(sorted(TYSKA_HUS, key=len,
                                                       reverse=True)), GRANS)
TYSKA = "(?:%s)|%s" % (STAMMAR, ORD)

# --- Självtest (a): får inte träffa vår egen text -------------------------
rx = re.compile(TYSKA, re.I)
tr = []
for r in plan:
    s = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", r["html"])).strip()
    tr += [(m.group(0), r["kort"]) for m in rx.finditer(s)]
    for falt in ("name", "title", "meta", "slug"):
        tr += [(m.group(0), r["kort"] + "/" + falt) for m in rx.finditer(r[falt])]
if tr:
    raise SystemExit("ORDLISTAN TRÄFFAR VÅR EGEN TEXT: %s" % sorted(set(tr))[:10])

# --- Självtest (b): måste fälla verklig tysk leverantörstext --------------
TYSK_PROV = [
    "Ein Tretroller für die ganze Familie mit Luftbereifung und V-Bremsen",
    "Kugelgelagerter, höhenverstellbarer Lenker von 92 auf max. 100 cm",
    "Langlebige aufblasbare Gummiräder im Fußballdesign für drinnen",
    "Stahlrahmen mit rostbeständiger Pulverbeschichtung, belastbar 100 kg",
    "Duales Bremssystem für Vorderrad und Hinterrad, rutschfestes Trittbrett",
]
SVENSK_PROV = ["Det är vardagsväder på en öppen gata.",
               "Ett stadigt underlag och rejäl fotplatta.",
               "Kläder och läder tål väta sämre än lack.",
               "Den som bromsar sent hinner inte stanna."]
slapper = [t for t in TYSK_PROV if not rx.search(t)]
if slapper:
    raise SystemExit("ORDLISTAN SLÄPPER TYSK TEXT: %s" % slapper)
falskt = [(t, rx.search(t).group(0)) for t in SVENSK_PROV if rx.search(t)]
if falskt:
    raise SystemExit("ORDLISTAN FÄLLER SVENSK TEXT: %s" % falskt)
print("ordlistan: 0 träffar i egen text, %d/%d tyska prov faller, "
      "%d/%d svenska prov släpper igenom"
      % (len(TYSK_PROV), len(TYSK_PROV), len(SVENSK_PROV), len(SVENSK_PROV)))

rader = [{"kort": r["kort"], "id": vid[r["kort"]]["id"], "slug": r["slug"],
          "name": r["name"], "title": r["title"], "meta": r["meta"],
          "langd": facit[r["kort"]]["synligLangd"],
          "hash": facit[r["kort"]]["synligHash"],
          "sku": vid[r["kort"]]["sku"], "variantId": vid[r["kort"]]["variantId"],
          "kortFil": kortfil[r["kort"]],
          # ☠️ Bildantalet är PER PRODUKT. `c4375606` tappade sin fjärde bild
          #    (tysk text inbränd i pixlarna) och har inte heller någon
          #    måttritning — fem bilder, inte sex. En hårdkodad sexa hade
          #    fällt en korrekt sida, och en grind som fäller rätt text lär
          #    mottagaren att sluta läsa.
          "antalBilder": len(mediaplan[r["kort"]])} for r in plan]

HUVUD = """async () => {
  const SITE = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
  const APP  = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
  const RADER = %s;
  const synlig = (h) => h.replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();
  const hasha = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) %% 1000000007; return h; };
  const TYSKA = new RegExp(%s, "i");
  const FLIKAR = ["Tekniska specifikationer", "Anv\\u00e4ndning och sk\\u00f6tsel", "Vanliga fr\\u00e5gor"];
  // ☠️ PLAIN_DESCRIPTION MASTE begaras — DESCRIPTION ar ett annat falt och
  //    lamnar plainDescription TOM. Kommaseparerat `fields` ger 400; upprepa.
  // ☠️ VARIANTS_INFO ar INGET giltigt faltvarde och ger 400 "Failed to parse
  //    JSON or deserialize protobuf message". Varianterna kommer anda med.
  const FALT = "?fields=MEDIA_ITEMS_INFO&fields=PLAIN_DESCRIPTION";
  const ut = {};
  for (const r of RADER) {
    const brister = [];
    const g = await wix.request({ scope: "site", siteId: SITE, method: "GET",
      url: "https://www.wixapis.com/stores/v3/products/" + r.id + FALT });
    const p = g.data.product;
    const html = p.plainDescription ?? "";

    const s = synlig(html);
    if (s.length !== r.langd) brister.push("langd " + s.length + " != " + r.langd);
    if (hasha(s) !== r.hash) brister.push("hash " + hasha(s) + " != " + r.hash);

    const slug = typeof p.slug === "string" ? p.slug : ((p.slug && p.slug.name) || "");
    if (p.name !== r.name) brister.push("namn: " + p.name);
    if (slug !== r.slug) brister.push("slug: " + slug);
    const tags = p.seoData?.tags ?? [];
    const t = tags.find((x) => x.type === "title");
    const m = tags.find((x) => x.type === "meta" && x.props?.name === "description");
    if ((t?.children ?? "") !== r.title) brister.push("seo-titel: " + (t?.children ?? "SAKNAS"));
    if ((m?.props?.content ?? "") !== r.meta) brister.push("seo-meta: " + (m?.props?.content ?? "SAKNAS"));

    // Grinden laser HELA seoData — settings.keywords overlever annars hela
    // poleringen med leverantorens tyska rubrik.
    const kw = (p.seoData?.settings?.keywords ?? [])
      .map((x) => (typeof x === "string" ? x : (x.term ?? ""))).join(" | ");
    if (TYSKA.test(kw)) brister.push("tyskt keyword: " + kw);

    const tyskT = s.match(TYSKA);
    if (tyskT) brister.push("tyskt ord i texten: " + tyskT[0]);
    if (/Skickas fr\\u00e5n/i.test(html)) brister.push("Skickas fran");
    if (/(?:B\\u00f6r|Bra) att veta|beh\\u00f6ver veta innan du k\\u00f6per/i.test(s)) brister.push("varningsblock");
    if (/\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*cm/.test(s)) brister.push("kommalista av tal");
    if (/Artikelnummer|Modellreferens|Artikelnr/i.test(s)) brister.push("artikelnummer i texten");
    // ☠️ Rundans tre signaturgrindar, mot det som FAKTISKT ligger i Wix.
    if (/fotboll|f[uo]tball|bollm\u00f6nster/i.test(s)) brister.push("OBELAGT FOTBOLLSMONSTER");
    const massiv = s.match(/punkteringsfri|EVA[- ]|slangl[\u00f6o]s|ing(?:enting|et) att pumpa|beh[\u00f6o]ver aldrig pumpas|utan innerslang/i);
    if (massiv) brister.push("massivt-hjul-pastaende: " + massiv[0]);
    const falg = s.match(/(?:r[\u00f6o]d|bl[\u00e5a]|gr[\u00f6o]n|rosa|orange|turkos|svart|vit)\w*\s+f[\u00e4a]lg/i);
    if (falg) brister.push("OMATT FALGFARG: " + falg[0]);
    if (/elsparkcykel|elscooter|eldriven|km\/h|batteri/i.test(s)) brister.push("elfordonsord");
    if (/\bEN\s*\d{2,5}|certifierad|CE-m[\u00e4a]rkt|testad enligt/i.test(s)) brister.push("obelagd standard");
    if (!/hj[\u00e4a]lm/i.test(s)) brister.push("hjalmradet saknas");
    for (const f of FLIKAR) {
      if (!new RegExp("<h2>\\\\s*" + f + "\\\\s*</h2>").test(html)) brister.push("flik ej ren h2: " + f);
    }

    const items = p.media?.itemsInfo?.items ?? [];
    if (items.length !== r.antalBilder) brister.push("bilder: " + items.length + " != " + r.antalBilder);
    if (items.filter((i) => !i.image?.url).length) brister.push("bild utan url");
    const alt = items.map((i) => i.image?.altText ?? "");
    if (alt.some((a) => !a)) brister.push("alt-text saknas");
    if (new Set(alt).size !== alt.length) brister.push("alt-text inte unik");
    if (!((items[2]?.image?.url ?? "").includes(r.kortFil))) brister.push("kortet inte pa plats 3");

    // ☠️ SKU pa RATT variant — aldrig pa position.
    const vs = p.variantsInfo?.variants ?? [];
    const v = vs.find((x) => x.id === r.variantId);
    if (!v) brister.push("variantId hittades inte: " + r.variantId);
    else if ((v.sku ?? "") !== r.sku) brister.push("sku: " + (v.sku ?? "SAKNAS"));

    // ☠️ Kategorier gar inte att lasa ur produkten — bade search och GET
    //    svarar med tomma directCategoriesInfo. Lasaren ar kategori-API:t,
    //    och svarsnyckeln heter `directCategoryIds`, inte `categories`.
    const c = await wix.request({ scope: "site", siteId: SITE, method: "POST",
      url: "https://www.wixapis.com/categories/v1/categories/list-categories-for-item",
      body: { item: { catalogItemId: r.id, appId: APP },
              treeReference: { appNamespace: "@wix/stores" } } });
    const kat = c.data.directCategoryIds ?? [];
    if (kat.length < 3) brister.push("for fa kategorier: " + kat.length);
    for (const c of ["83c8248a-2d41-42fe-a8c8-0202a4630686",
                     "21b366b8-fd1a-4b3c-993c-9574711f5293"]) {
      if (!kat.includes(c)) brister.push("saknar kategori " + c.slice(0, 8));
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

# ☠️ Sjalvtestet ovan kor i PYTHON, grinden i JAVASCRIPT. Kor samma prov en
# gang till i node MOT DEN GENERERADE FILEN — annars ar det ett bevis om
# fel motor.
p = subprocess.run(["node", os.path.join(HAR, "tyska-prov.js")],
                   cwd=HAR, capture_output=True, text=True)
print(p.stdout.strip())
if p.returncode != 0:
    raise SystemExit("JS-provet fallde — klart.js far inte koras: %s"
                     % (p.stderr[:300] or p.stdout[-300:]))
