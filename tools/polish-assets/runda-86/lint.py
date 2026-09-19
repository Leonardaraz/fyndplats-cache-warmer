# -*- coding: utf-8 -*-
"""Runda 86 — grinden mot rundans egna texter, före något skrivs till Wix.

☠️ RUNDANS TYNGSTA GRIND ÄR MAXLASTEN, OCH DEN SPRIDER SIG ÖVER EN FAKTOR
   ÅTTA. 6 kg per hyllplan på de två låga, 6 kg på `1e11480e`, 20 kg per
   fack på `364bc564`, 40 kg på `8b00022f`, och TRE olika tal på `43e312b7`
   (5 / 30 / 10 kg). `d6666869` har inget tal alls. `MAXLAST` är därför en
   tabell per produkt, och grinden fäller både ett SAKNAT och ett FRÄMMANDE
   tal — ett syskons maxlast på ett hyllplan i gran är inte kosmetika.

☠️ `UTAN_MAXLAST` — `d6666869` får inte ha en maxlast, och avsaknaden får
   inte heller bli sidans rubrik. Samma regel som runda 84:s batteristorlek.

☠️ `FORANKRING` — bara `43e312b7` och `8b00022f` levereras med L-järn och
   markpinnar. Grinden fäller åt BÅDA håll: de två måste säga att det ingår,
   de fem andra måste säga att det INTE gör det. Ett 1,9 m högt skåp i gran
   som väger 24,5 kg är lätt för sin höjd, och "förankring ingår" är en
   mening som skriver sig själv när sex syskon står bredvid varandra.

☠️ `FARG` — importen satte fel färg på tre av sju. Grinden kräver att
   `Färg:`-raden bär rätt ord och fäller när en sida bär ett SYSKONS färgord
   som påstående.

☠️ `VIKTRAD` — den maskinsatta `Vikt`-raden är PAKETVIKT. Grinden kräver
   `Vikt med emballage:` på alla sju och tillåter en separat `Vikt:`-rad
   bara på `1e11480e`, som är den enda där produktvikten är känd.

☠️ `BYGGLOV_RE` — inget skåp får påstå något om bygglov, friggebod eller
   attefall. Fotavtrycket står i specen; bedömningen är kundens, och ett
   påstående i en produkttext blir juridisk rådgivning vi inte kan stå för.

☠️ `ABSOLUT_RE` — "vattentät" är sant bara om `8b00022f`s asfalttak, som är
   det enda källan kallar `wasserdicht`. "Helt tät", "regntät",
   "underhållsfri" och "rostfri" fälls överallt: det här är målad gran.
"""
import os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR)); sys.path.insert(0, HAR)
import texter                                                        # noqa: E402
from grindar import (TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR,   # noqa: E402
                     LAGERFRAS)

# ⚠️ `m²` är med. Utan den är en golvyta OSYNLIG för talgrinden — mätt:
#    en muterad `Golvyta: 0,43 m²` slapp rakt igenom.
TAL_RE = re.compile(r"(\d+(?:,\d+)?)\s*(cm|kg|%|°|m²)")
# ⚠️ Snedstrecket är med. Runbokens sifferstil skriver serier som
#    `10/20/30 cm`, och runda 85:s mönster kände bara `×`, `–` och `-` —
#    en spec-rad skriven i husets EGEN stil hade alltså fällts som
#    "tal som inte står i produktens egen spec".
KEDJA_RE = re.compile(r"((?:\d+(?:,\d+)?\s*(?:[×x/]|–|-)\s*)+\d+(?:,\d+)?)\s*(cm|kg|%|°|m²)")

# ☠️ Maxlasten per produkt — rundans skiljelinje. Talen är LÄSTA ur varje
#    källas `Technische Daten`, inte härledda ur varandra.
MAXLAST = {
    "c9a24404": [6], "bb112e08": [6], "1e11480e": [6],
    "43e312b7": [5, 30, 10], "364bc564": [20], "8b00022f": [40],
}
# ☠️ `d6666869` anger INGEN maxlast. Den får därför ingen.
UTAN_MAXLAST = {"d6666869"}

# ☠️ Bara två av sju levereras med förankring.
FORANKRING = {"43e312b7", "8b00022f"}

# Färgen per produkt, läst ur tyskans `Technische Daten` och bekräftad i
# bilden. Tre av de svenska raderna importen satte är fel.
FARG = {
    "c9a24404": "naturträ", "bb112e08": "grå", "1e11480e": "naturträ",
    "d6666869": "naturträ", "43e312b7": "grå", "364bc564": "naturträ",
    "8b00022f": "grå",
}
# ☠️ Ett syskons färgord som PÅSTÅENDE på fel sida. Bara de ord som faktiskt
#    skiljer familjen åt står här — "vit" är med i tre grå skåps lister och
#    kan därför inte fälla.
FEL_FARG_RE = {
    "naturträ": re.compile(r"\bgrå\s+(?:stomme|skåp|yta)|\bgrått\s+trädgårdsskåp", re.I),
    "grå": re.compile(r"\bnaturträfärgad|\bobehandl\w*", re.I),
}

# ☠️ Bygglov är inte vår fråga att svara på.
BYGGLOV_RE = re.compile(r"\bbygglov\w*|\bfriggebod\w*|\battefall\w*|"
                        r"\bbyggl(?:ovs|ovsfri)\w*", re.I)

# ☠️ Absoluta påståenden om målad gran. `8b00022f`s asfalttak är det ENDA
#    källan kallar vattentätt, och undantaget hanteras i grinden.
ABSOLUT_RE = re.compile(r"(helt\s+t(?:ä|a)t\w*|regnt(?:ä|a)t\w*|"
                        r"underh(?:å|a)llsfri\w*|rostfri\w*|"
                        r"h(?:å|a)ller\s+alltid\s+torrt|aldrig\s+r(?:ö|o)ta)", re.I)
VATTENTAT_RE = re.compile(r"vattent(?:ä|a)t\w*", re.I)

# ☠️ Familjens tyska ord. Skriven för TRÄDGÅRDSSKÅP — runda 85:s lista var
#    skriven för soptunnor och hade inte fällt ett enda av orden nedan.
#    Ord som INTE får stå här, eftersom de finns i VÅR EGEN text:
#      natur      vår text säger "naturträ" i varje färgrad
#      lamell     vår text säger "lamelldörrar"
#      bitumen    vår text säger "bitumenpapp" om taket
#      asfalt     vår text säger "asfalttak"
#    Självtestet nedan vägrar starta om något ord träffar vår text.
TYSKA_BANK = [
    "gartenschrank", "gartenschuppen", "geräteschuppen", "gerateschuppen",
    "geräteschrank", "gerateschrank", "gerätehaus", "geratehaus",
    "gartenhaus", "gartenhäuschen", "gartenhauschen", "schuppen",
    "lagerschuppen", "werkzeugschuppen", "gartenablage", "aufbewahrung",
    "stauraum", "regalboden", "regalböden", "regalbrett", "fachboden",
    "fachböden", "ablagefläche", "ablageflache", "satteldach", "pultdach",
    "schrägdach", "schragdach", "asphaltdach", "bitumendach", "lamellentür",
    "lamellenturen", "doppeltür", "doppeltur", "verriegelbar", "abschließbar",
    "abschliessbar", "wetterfest", "wetterbeständig", "wetterbestandig",
    "witterungsbeständig", "witterungsbestandig", "wasserabweisend",
    "wasserdicht", "tannenholz", "kiefernholz", "zedernholz", "massivholz",
    "tanne", "kiefer", "holzkonstruktion", "lackierung", "lasur",
    "bodennagel", "bodennägel", "bodennagel", "beschläge", "beschlage",
    "montage", "montageanleitung", "aufbauanleitung", "lieferumfang",
    "belastbarkeit", "gesamtmaße", "gesamtmasse", "gesamtgröße",
    "gesamtgrosse", "abmessungen", "grundfläche", "grundflache",
    # ⚠️ "material" och "grun" ströks efter att självtestet fällde dem:
    #    vår egen spec-rad heter `Material:` och vår text säger `grundyta`.
    #    Ett tyskt ord som också är svenskt fäller korrekta sidor — samma
    #    lärdom som runda 81:s `oxford` och `khaki`.
    "innenmaße", "innenmasse", "gewicht", "farbe",
    "werkzeug", "gartengerät", "gartengerate", "gartenzubehör",
    "gartenzubehor", "klapptisch", "pflanztisch", "fenster", "belüftung",
    "beluftung", "staunässe", "staunasse", "schwarz", "weiß", "weiss",
    "grau", "braun", "beige", "gelb", "grün", "naturholz",
    "praktisch", "hochwertig", "robust", "stabil", "kompakt",
]

# Tal som är LÄSTA på de länkade PUBLICERADE sidorna, inte på våra.
#   147 cm      `tradgardsforrad-147-cm-sex-hyllor`
#   105 / 55 / 179 cm, 30 kg   `tradgardsskap-tra-179-cm-tva-fack`
#   0,5 m²      `redskapsbod-gran-0-5-m2-tva-fonster`
EXTERN_TAL = {"147 cm", "105 cm", "55 cm", "179 cm", "30 kg", "0,5 m²"}

SYSKONTAL = {}
for _p in texter.PRODUKTER:
    SYSKONTAL[_p["slug"]] = _p["spec"]

FEL = []
PRODUKTER = texter.PRODUKTER

# ☠️ SJÄLVTEST av ordlistan mot VÅR EGEN text, innan en enda grind körs.
_egen = " ".join(
    " ".join([_p["name"], _p["title"], _p["meta"],
              re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", texter.bygg(_p)))])
    for _p in texter.PRODUKTER)
_traff = [_o for _o in TYSKA + TYSKA_BANK + HUSMARKEN + ATTRIBUTION
          if re.search(r"\b%s" % re.escape(_o), _egen, re.I)]
if _traff:
    raise SystemExit("ORDLISTAN TRÄFFAR VÅR EGEN TEXT: %s — grinden hade "
                     "fällt korrekta sidor (runda 81:s lärdom)"
                     % ", ".join(_traff))


def strip_taggar(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def tal_i(text):
    ut = set("%s %s" % (a, e) for a, e in TAL_RE.findall(text))
    for kedja, enhet in KEDJA_RE.findall(text):
        for d in re.findall(r"\d+(?:,\d+)?", kedja):
            ut.add("%s %s" % (d, enhet))
    return ut


def fal(k, m):
    FEL.append("%s: %s" % (k, m))


def kor():
  """Kör alla grindar mot PRODUKTER och fyller FEL. Mutationstestet byter ut
  PRODUKTER och läser FEL, så loopen får inte ligga på modulnivå."""
  sluggar, skuer = {}, {}
  for p in PRODUKTER:
      k = p["kort"]
      html = texter.bygg(p)
      text = strip_taggar(html)
      allt = " ".join([p["name"], p["title"], p["meta"], text])
      utan_lankar = strip_taggar(re.sub(r"<a\b[^>]*>.*?</a>", " ", html))

      # ── förbjudna ord ────────────────────────────────────────────────────
      for o in TYSKA + TYSKA_BANK + HUSMARKEN + ATTRIBUTION:
          if re.search(r"\b%s" % re.escape(o), allt, re.I):
              fal(k, "förbjudet ord: %r" % o)
      for o in LANDORD:
          if re.search(r"\b%s\b" % re.escape(o), allt, re.I):
              fal(k, "landsnamn: %r" % o)
      for f in LAGERFRAS:
          if re.search(re.escape(f), allt, re.I):
              fal(k, "lagerfras: %r" % f)
      if ARTNR.search(allt):
          fal(k, "artikelnummer i texten")

      # ── ☠️ RUNDANS EGNA GRINDAR ────────────────────────────────────────
      # En FRÅGA är inget påstående, och en NEKNING är det inte heller.
      # ☠️ Blockslut räknas som meningsslut. En punktlista har inga punkter,
      #    så utan det här blir HELA <ul>-listan en enda "mening" — och ett
      #    "ingår inte" i en punkt slog ut alla de andra ur nekningsfiltret.
      #    Uppmätt: en muterad punkt "Stomme i pulverlackerad metall" slapp
      #    igenom materialgrinden av precis det skälet.
      block = re.sub(r"</(li|p|h[1-6])>", ". ", html)
      utan_lankar = strip_taggar(re.sub(r"<a\b[^>]*>.*?</a>", " ", block))
      pastar_txt = " ".join(m for m in re.split(r"(?<=[.!?])\s+", utan_lankar)
                            if not m.rstrip().endswith("?"))
      pastar = " ".join([p["name"], p["title"], p["meta"], pastar_txt])
      spectext = " ".join(p["spec"])
      # ⚠️ En NEKNING är inget påstående. "Markpinnar ingår inte" och
      #    "inte helt tät" är precis de meningar rundan finns till för
      #    att skriva, och en grind som fäller dem hade tvingat fram
      #    tystnad om det som spelar mest roll.
      pastar_utan_nekning = " ".join(
          m for m in re.split(r"(?<=[.!?])\s+", pastar)
          if not re.search(r"\b(inte|inget|ingen|nej|utan)\b", m, re.I))

      # 1. ☠️ MAXLASTEN — rundans skiljelinje, faktor åtta mellan syskonen.
      lastrad = [r for r in p["spec"] if r.startswith("Maxlast:")]
      if k in UTAN_MAXLAST:
          if lastrad:
              fal(k, "har en maxlastrad %r — källan anger ingen för den här"
                     % lastrad[0])
          if re.search(r"\b(?:bär|tål|klarar|maxlast)\b[^.]{0,40}\d+\s*kg",
                       pastar, re.I):
              fal(k, "påstår en maxlast i kg — källan anger ingen")
          # ⚠️ Avsaknaden får INTE bli sidans rubrik (husets regel sedan
          #    runda 82). Den hör hemma bland de vanliga frågorna.
          if re.search(r"maxlast|ingen angiven", p["name"] + p["title"]
                       + p["meta"] + p["villkor"][0], re.I):
              fal(k, "avsaknaden av maxlast står i namn, titel, meta eller "
                     "rubrik — den hör hemma i en vanlig fråga")
          if not re.search(r"maxlast", " ".join(f + " " + b for f, b in p["faq"]),
                           re.I):
              fal(k, "ingen vanlig fråga tar upp att maxlast saknas")
      else:
          if len(lastrad) != 1:
              fal(k, "specen har %d 'Maxlast:'-rader" % len(lastrad))
          else:
              for tal in MAXLAST[k]:
                  if not re.search(r"\b%d kg\b" % tal, lastrad[0]):
                      fal(k, "'Maxlast:'-raden saknar %d kg" % tal)
          # ☠️ Ett SYSKONS maxlast får inte stå som påstående här.
          egna = set(MAXLAST[k])
          for annan_k, tal_lista in MAXLAST.items():
              if annan_k == k:
                  continue
              for tal in tal_lista:
                  if tal in egna:
                      continue
                  if re.search(r"\b%d kg\b" % tal, utan_lankar):
                      fal(k, "nämner %d kg — det är %s:s maxlast, inte den "
                             "här produktens" % (tal, annan_k))

      # 2. ☠️ FÖRANKRINGEN — fäller åt BÅDA håll.
      ingar = [r for r in p["spec"] if r.startswith("Ingår:")]
      if len(ingar) != 1:
          fal(k, "specen har %d 'Ingår:'-rader" % len(ingar))
      elif k in FORANKRING:
          if "markpinn" not in ingar[0].lower():
              fal(k, "levereras med markpinnar men 'Ingår:'-raden säger %r"
                     % ingar[0])
      else:
          if re.search(r"markpinn|l-järn|väggfäste", ingar[0], re.I):
              fal(k, "'Ingår:'-raden lovar förankring — källans Lieferumfang "
                     "har bara monteringsanvisning")
          faqtext = " ".join(f + " " + b for f, b in p["faq"])
          if not re.search(r"markpinn|väggfäste|förankr", faqtext, re.I):
              fal(k, "ingen vanlig fråga säger att förankring inte ingår")
          # Ett positivt påstående om att förankring ingår fälls.
          if re.search(r"(markpinnar|l-järn)[^.]{0,30}(ingår|följer med)",
                       pastar_utan_nekning, re.I):
              fal(k, "påstår att förankring ingår")

      # 3. ☠️ FÄRGEN — tre av sju importerade rader är fel.
      fargrad = [r for r in p["spec"] if r.startswith("Färg:")]
      if len(fargrad) != 1:
          fal(k, "specen har %d 'Färg:'-rader" % len(fargrad))
      elif FARG[k] not in fargrad[0].lower():
          fal(k, "'Färg:'-raden säger %r men färgen är %s"
                 % (fargrad[0], FARG[k]))
      fel_farg = FEL_FARG_RE.get(FARG[k])
      if fel_farg:
          for m in fel_farg.findall(pastar_utan_nekning):
              fal(k, "påstår färgen %r — den hör till ett SYSKON, den här är "
                     "%s" % (m if isinstance(m, str) else m[0], FARG[k]))

      # 4. ☠️ BYGGLOV — inte vår fråga att svara på.
      for m in BYGGLOV_RE.findall(allt):
          fal(k, "påstår något om bygglov: %r"
                 % (m if isinstance(m, str) else m[0]))

      # 5. ☠️ ABSOLUTA PÅSTÅENDEN om målad gran.
      for m in ABSOLUT_RE.findall(pastar):
          fal(k, "absolut påstående om målad gran: %r"
                 % (m if isinstance(m, str) else m[0]))
      # "Vattentät" är sant bara om `8b00022f`s asfalttak.
      for m in VATTENTAT_RE.finditer(pastar):
          if k != "8b00022f":
              fal(k, "påstår %r — bara asfalttaket på 8b00022f kallas "
                     "vattentätt av källan" % m.group(0))

      # 6. ☠️ MATERIALET — hela familjen är gran, och inget annat.
      matrad = [r for r in p["spec"] if r.startswith("Material:")]
      if len(matrad) != 1:
          fal(k, "specen har %d 'Material:'-rader" % len(matrad))
      elif "gran" not in matrad[0].lower():
          fal(k, "'Material:'-raden säger %r — familjen är gran" % matrad[0])
      for m in re.findall(r"\b(furu|ek|teak|bambu|plast|metall|stål|aluminium)\b",
                          pastar_utan_nekning, re.I):
          # Taket får vara asfalt eller bitumen; stommen är trä.
          fal(k, "påstår materialet %r — stommen är gran" % m)

      # 6b. ☠️ MÅTTET SOM SKILJER — familjen jämförs på bredd och höjd.
      for var, txt in (("namnet", p["name"]), ("sluggen", p["slug"]),
                       ("titeln", p["title"])):
          if not re.search(r"\d", txt):
              fal(k, "%s bär inget mått — familjen skiljs på bredd och höjd"
                     % var)

      # 6c. ☠️ ENHETSLÖSA JÄMFÖRELSETAL (runda 84:s grind 5b).
      for m in re.findall(r"mot\s+(\d+(?:,\d+)?\s*(?:–|-|till)\s*\d+(?:,\d+)?)"
                          r"(?!\s*(?:cm|kg|liter|%|°))", utan_lankar):
          fal(k, "enhetslöst jämförelsetal %r — andra produkters siffror hör "
                 "hemma i en LÄNK till de sidorna" % m)

      # 6d. ☠️ INTERN JARGONG I KUNDTEXT (runda 84:s grind 5c).
      for m in re.finditer(r"\brundan\b|\brundans\b|\bi rundan\b|"
                           r"\bpolering(?:en|ar)?\b|\butkast(?:et|en)?\b|"
                           r"\bmappning(?:en|ar)?\b|\bpoleringskön\b",
                           allt, re.I):
          fal(k, "intern jargong i kundtext: %r" % m.group(0))

      # ── härledda tal ─────────────────────────────────────────────────────
      tillatna = tal_i(" ".join(p["spec"]))
      for t in sorted(tal_i(utan_lankar) - tillatna):
          fal(k, "tal som inte står i produktens egen spec: %s" % t)
      for mal, ankare in re.findall(r'<a\b[^>]*href="[^"]*/([^"/]+)"[^>]*>(.*?)</a>', html):
          malets = tal_i(" ".join(SYSKONTAL.get(mal, []))) | EXTERN_TAL
          for t in sorted(tal_i(strip_taggar(ankare)) - malets):
              fal(k, "tal i länk till %s som inte är mätt för DEN sidan: %s" % (mal, t))
      for t in sorted(tal_i(p["meta"]) | tal_i(p["title"]) | tal_i(p["name"])):
          if t not in tillatna:
              fal(k, "tal i namn/titel/meta som inte står i specen: %s" % t)

      # ── kommalista av tal med enheten sist (runbokens sifferstil) ────────
      for yta, txt in (("namn", p["name"]), ("titel", p["title"]),
                       ("meta", p["meta"]), ("html", text)):
          for m in re.findall(r"\d+(?:,\d+)?, \d", txt):
              fal(k, "kommalista av tal i %s: %r" % (yta, m))

      # ── struktur ─────────────────────────────────────────────────────────
      if len(p["title"]) > 60:
          fal(k, "titeln är %d tecken (max 60)" % len(p["title"]))
      if not (120 <= len(p["meta"]) <= 160):
          fal(k, "metan är %d tecken (120-160)" % len(p["meta"]))
      for rubrik in ("Egenskaper", "Tekniska specifikationer",
                     "Användning och skötsel", "Vanliga frågor"):
          if rubrik not in text:
              fal(k, "avsnittet %r saknas" % rubrik)
      if "<br" in html:
          fal(k, "<br> — Wix strippar den")
      if len(p["faq"]) < 4:
          fal(k, "färre än fyra frågor i FAQ")
      for krav in ("Montering:", "Ingår:", "Vikt med emballage:", "Färg:",
                   "Material:", "Tak:"):
          if not any(r.startswith(krav) for r in p["spec"]):
              fal(k, "spec-tabellen saknar raden %r" % krav)

      # ── SKU: satt för hand, och måste vara giltig ────────────────────────
      if not p["sku"].startswith("FP-"):
          fal(k, "SKU saknar FP-prefix: %r" % p["sku"])
      if len(p["sku"]) > 40:
          fal(k, "SKU är %d tecken (max 40)" % len(p["sku"]))
      if not re.fullmatch(r"[A-Za-z0-9-]+", p["sku"]):
          fal(k, "SKU är inte ASCII utan specialtecken: %r" % p["sku"])

      # ── sökordet i namn, slug OCH titel ─────────────────────────────────
      def vik(t):
          return (t.lower().replace("å", "a").replace("ä", "a")
                           .replace("ö", "o").replace("é", "e"))
      huvud = p["slug"].split("-")[0]
      for var, txt in (("namn", p["name"]), ("titel", p["title"])):
          if huvud[:8] not in vik(txt):
              fal(k, "sökordet %r saknas i %s" % (huvud, var))

      sluggar.setdefault(p["slug"], []).append(k)
      skuer.setdefault(p["sku"], []).append(k)

  for s, ks in sluggar.items():
      if len(ks) > 1:
          for k in ks:
              FEL.append("%s: slug %r delas av %s" % (k, s, ks))
  for s, ks in skuer.items():
      if len(ks) > 1:
          for k in ks:
              FEL.append("%s: SKU %r delas av %s" % (k, s, ks))
  return FEL


if __name__ == "__main__":
    kor()
    print("%-9s %-36s %-30s %s" % ("id8", "slug", "SKU", "html"))
    for p in texter.PRODUKTER:
        print("%-9s %-36s %-30s %d" % (p["kort"], p["slug"], p["sku"],
                                       len(texter.bygg(p))))
    print()
    for f in FEL:
        print("FEL:", f)
    print("\n%d fel i %d produkter" % (len(FEL), len(texter.PRODUKTER)))
    raise SystemExit(1 if FEL else 0)
