# -*- coding: utf-8 -*-
"""Runda 87 — grinden mot rundans egna texter, före något skrivs till Wix.

☠️ RUNDANS TYNGSTA GRIND ÄR SNÖLASTEN. Bara `0f5e3fea` (5 kg/m²) och paret
   `5f6592ad`/`20c0942e` (10 kg/m²) anger en siffra; fem av åtta anger
   ingen. `SNOLAST` är därför en tabell per produkt, och grinden fäller både
   ett SAKNAT och ett FRÄMMANDE tal. Ett syskons snölast på fel duktak är
   inte kosmetika.

☠️ `VINTER_RE` — tyskan kallar `0f5e3fea` en "winterfeste Lösung" och
   `95a9d7cc` ett "winterfestes Lagerzelt". ORDEN "VINTERKLAR",
   "VINTERSÄKER" OCH "VINTERFAST" FÄLLS PÅ ALLA ÅTTA SIDOR. En duk som
   klarar 5 kg/m² är inte vinterklar i Sverige, och det ordet är skillnaden
   mellan ett tält som töms i november och ett tak som ger vika i februari.

☠️ `FORANKRING` — leveransinnehållet skiljer sig radikalt, och `8bdba748`
   levereras UTAN förankring över huvud taget. Grinden fäller åt båda håll:
   varje sida måste ange sin egen mängd, `8bdba748` måste säga att ingen
   ingår, och ingen får låna en grannes.

☠️ `FONSTER` — bara `95a9d7cc` har ett fönster som syns på bild OCH står i
   måttritningen. `6a419d8b`:s Technische Daten anger ett på 47 × 40 cm som
   ingen av fem bilder visar. Grinden prövar produktens EGNA ytor (namn,
   titel, meta, egenskaper, spec) — en jämförelse med syskonet i en vanlig
   fråga är inget påstående om den här varan.

☠️ `VATTENTAT_TILLATEN` — fem av åtta kallas `wasserdicht` av källan. De två
   minsta får bara `UV-beständige Plane`, alltså inget täthetslöfte alls,
   och `0f5e3fea` säger emot sig själv (namnet `Wasserabweisend`, texten
   `wasserdicht`). Den sidan måste säga VATTENAVVISANDE och får inte säga
   vattentät.

☠️ `TAKFORM` — `8bdba748` är den enda med bågformat tak, och det är den
   formen som gör den låg och bred. Grinden kräver rätt takform per produkt
   och fäller den som lånar en annans.

☠️ `BYGGLOV_RE` — inget tält får påstå något om bygglov, friggebod eller
   attefall. Måtten står i specen; bedömningen är kundens.

⚠️ TALGRINDEN KÄNNER `m` SEDAN DEN HÄR RUNDAN. Utan enheten var varje
   metertal osynligt: `2,2 m i nock` i ett namn hade aldrig prövats mot
   specens `220 cm`. Samma hål som `m²` var i runda 86. `kvadratmeter`
   normaliseras dessutom till `m²` innan mätningen, annars är
   "nio kvadratmeter" osynligt på samma sätt.
"""
import os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR)); sys.path.insert(0, HAR)
import texter                                                        # noqa: E402
from grindar import (TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR,   # noqa: E402
                     LAGERFRAS)

# ⚠️ `m` är med sedan runda 87 — se modulens docstring. Ordningen i
#    alternationen spelar roll: `cm` och `m²` måste stå FÖRE `m`, annars
#    matchar `m` halva `cm`… nej, `m` kan aldrig matcha `cm`:s c, men
#    `m²` skulle kapas till `m` och tappa tvåan.
TAL_RE = re.compile(r"(\d+(?:,\d+)?)\s*(cm|kg|m²|m|%|°)(?![a-zå-ö²])")
KEDJA_RE = re.compile(r"((?:\d+(?:,\d+)?\s*(?:[×x/]|–|-)\s*)+\d+(?:,\d+)?)"
                      r"\s*(cm|kg|m²|m|%|°)(?![a-zå-ö²])")

# ☠️ Snölasten per produkt — rundans skiljelinje. Talen är LÄSTA ur varje
#    källas `Technische Daten`, inte härledda ur varandra.
SNOLAST = {"0f5e3fea": 5, "5f6592ad": 10, "20c0942e": 10}
UTAN_SNOLAST = {"72051417", "a165b178", "8bdba748", "6a419d8b", "95a9d7cc"}

# ☠️ Vinterlöften. Källan använder `winterfest` om två av dem; vi gör det
#    inte om någon.
VINTER_RE = re.compile(r"vinterklar\w*|vinters(?:ä|a)ker\w*|vinterfast\w*|"
                       r"vintert(?:å|a)lig\w*|klarar\s+vintern", re.I)

# ☠️ Förankringen per produkt, läst ur varje `Lieferumfang`. `8bdba748` får
#    ingen alls.
FORANKRING = {
    "72051417": ["6 markankare", "6 skruvar", "15 spännlinor"],
    "a165b178": ["6 markankare", "6 skruvar", "15 spännlinor"],
    "5f6592ad": ["6 markankare"],
    "20c0942e": ["6 markankare"],
    "0f5e3fea": ["16 markankare", "12 expanderskruvar", "4 spännlinor",
                 "12 gummispännare"],
    "6a419d8b": ["4 jordspett", "4 spännlinor"],
    "95a9d7cc": ["20 jordspett", "28 gummiband"],
}
UTAN_FORANKRING = {"8bdba748"}

# ⚠️ Räkneorden som svarar mot mängderna ovan — se grinden.
RAKNEORD = {"4": "fyra", "6": "sex", "12": "tolv", "15": "femton",
            "16": "sexton", "20": "tjugo", "28": "tjugoåtta"}

# Bara den här har ett fönster som både syns på bild och står i ritningen.
FONSTER = {"95a9d7cc"}

# Fem av åtta kallas `wasserdicht` av källan.
VATTENTAT_TILLATEN = {"5f6592ad", "20c0942e", "8bdba748", "6a419d8b", "95a9d7cc"}
# ☠️ Den här MÅSTE säga vattenavvisande — källan säger emot sig själv.
MASTE_VATTENAVVISANDE = {"0f5e3fea"}

TAKFORM = {
    "72051417": "sadeltak", "a165b178": "sadeltak", "5f6592ad": "sadeltak",
    "20c0942e": "sadeltak", "8bdba748": "bågformat", "0f5e3fea": "sadeltak",
    "6a419d8b": "sadeltak", "95a9d7cc": "sadeltak",
}

FARG = {
    "72051417": "ljusgrå", "a165b178": "mörkgrå", "5f6592ad": "mörkgrå",
    "20c0942e": "ljusgrå", "8bdba748": "mörkgrå", "0f5e3fea": "mörkgrå",
    "6a419d8b": "mörkgrå", "95a9d7cc": "ljusgrå",
}

BYGGLOV_RE = re.compile(r"\bbygglov\w*|\bfriggebod\w*|\battefall\w*", re.I)

# ☠️ Absoluta påståenden om en duk på en stålstomme.
ABSOLUT_RE = re.compile(r"(helt\s+t(?:ä|a)t\w*|stormsäker\w*|stormtålig\w*|"
                        r"underh(?:å|a)llsfri\w*|rostfri\w*|orubblig\w*|"
                        r"h(?:å|a)ller\s+alltid\s+torrt|t(?:å|a)l\s+all\s+v(?:ä|a)der)",
                        re.I)
VATTENTAT_RE = re.compile(r"vattent(?:ä|a)t\w*", re.I)

# ☠️ Familjens tyska ord. Skriven för TÄLT — runda 86:s lista var skriven
#    för trädgårdsskåp i trä och hade inte fällt ett enda av orden nedan.
#    Ord som INTE får stå här, eftersom de finns i VÅR EGEN text:
#      plane      "plan" i "någorlunda plan" — och `\bplane` matchar inte,
#                 men marginalen är för liten att lita på
#      rand       vår text säger inget "rand", men "randen" är för nära
#      grau       vår text säger "grå" — inte samma sträng, men `\bgrau`
#                 är precis den sortens ord som glider
#    Självtestet nedan vägrar starta om något ord träffar vår text.
TYSKA_BANK = [
    "garagenzelt", "gerätezelt", "geratezelt", "lagerzelt", "zeltgarage",
    "fahrradzelt", "fahrradgarage", "fahrradschuppen", "aufbewahrungszelt",
    "gartenschuppen", "geräteschuppen", "gerateschuppen", "gerätehaus",
    "geratehaus", "gartenhaus", "schuppen", "unterstand", "stauraum",
    "satteldach", "schrägdach", "schragdach", "pultdach", "traufhöhe",
    "traufhohe", "rolltür", "rolltur", "reißverschluss", "reissverschluss",
    "bodenanker", "erdspieß", "erdspiess", "spannleine", "abspannseil",
    "gummispanner", "spreizschraube", "heringe", "ratschenspann",
    "windresistenz", "windbeständigkeit", "windbestandigkeit", "schneelast",
    "winterfest", "wetterfest", "wetterbeständig", "wetterbestandig",
    "wasserdicht", "wasserabweisend", "wasserfest", "witterung",
    "verzinkt", "stahlrahmen", "stahlrohr", "metallgestell", "metallrahmen",
    # ⚠️ "polyester" ströks efter att självtestet fällde det: ordet
    #    stavas likadant på svenska och står i VÅR egen dukrad.
    "gewebe", "abdeckung", "kunststoff", "lieferumfang",
    "gesamtabmessungen", "gesamtmaße", "gesamtmasse", "innenabmessungen",
    "innenmaße", "innenmasse", "basisabmessungen", "bodenmaße", "bodenmasse",
    "türmaße", "turmasse", "türabmessungen", "turabmessungen",
    "fensterabmessungen", "bodenfläche", "bodenflache", "randbreite",
    "belüftung", "belüftungsfenster", "beluftung", "netzfenster",
    "gebrauchsanleitung", "bedienungsanleitung", "montage", "hinweis",
    "hellgrau", "dunkelgrau", "gewicht", "farbe", "fenster",
    "geräumig", "geraumig", "robust", "stabil", "praktisch", "hochwertig",
    "tragbar", "vielseitig",
]

# Tal som är LÄSTA på de länkade PUBLICERADE sidorna, inte på våra.
#   30 kg      `platbod-240x206-cm-snolast-30-kg-las-9-stodpelare`
EXTERN_TAL = {"30 kg"}

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
    # ⚠️ "nio kvadratmeter" är osynligt för ett mönster som bara känner `m²`.
    text = re.sub(r"\bkvadratmeter\b", "m²", text, flags=re.I)
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
      # ☠️ Blockslut räknas som meningsslut (runda 86:s mätning). En
      #    punktlista har inga punkter, så utan det här blir HELA <ul>-listan
      #    en enda "mening" — och ett "ingår inte" i EN punkt slår ut alla de
      #    andra ur nekningsfiltret.
      block = re.sub(r"</(li|p|h[1-6])>", ". ", html)
      utan_lankar = strip_taggar(re.sub(r"<a\b[^>]*>.*?</a>", " ", block))
      pastar_txt = " ".join(m for m in re.split(r"(?<=[.!?])\s+", utan_lankar)
                            if not m.rstrip().endswith("?"))
      pastar = " ".join([p["name"], p["title"], p["meta"], pastar_txt])
      pastar_utan_nekning = " ".join(
          m for m in re.split(r"(?<=[.!?])\s+", pastar)
          if not re.search(r"\b(inte|inget|ingen|nej|utan)\b", m, re.I))
      # Produktens EGNA ytor — här står bara påståenden om DEN här varan.
      egna_ytor = " ".join([p["name"], p["title"], p["meta"]]
                           + p["eg"] + p["spec"])

      # 1. ☠️ SNÖLASTEN — rundans skiljelinje.
      snorad = [r for r in p["spec"] if r.startswith("Snölast:")]
      if len(snorad) != 1:
          fal(k, "specen har %d 'Snölast:'-rader" % len(snorad))
      elif k in UTAN_SNOLAST:
          if re.search(r"\d", snorad[0]):
              fal(k, "'Snölast:'-raden bär ett tal %r — källan anger ingen"
                     % snorad[0])
          if not re.search(r"anges inte", snorad[0], re.I):
              fal(k, "'Snölast:'-raden säger inte att den saknas: %r" % snorad[0])
          if re.search(r"sn(?:ö|o)last[^.]{0,40}\d+\s*kg", pastar, re.I):
              fal(k, "påstår en snölast i kg — källan anger ingen")
      else:
          if not re.search(r"\b%d kg/m²" % SNOLAST[k], snorad[0]):
              fal(k, "'Snölast:'-raden saknar %d kg/m²: %r"
                     % (SNOLAST[k], snorad[0]))
          for annan_k, tal in SNOLAST.items():
              if tal == SNOLAST[k]:
                  continue
              if re.search(r"\b%d kg/m²" % tal, utan_lankar):
                  fal(k, "nämner %d kg/m² — det är %s:s snölast, inte den här "
                         "produktens" % (tal, annan_k))
      # ☠️ Vinterlöften fälls på ALLA åtta.
      for m in VINTER_RE.findall(allt):
          fal(k, "vinterlöfte i kundtext: %r"
                 % (m if isinstance(m, str) else m[0]))

      # 2. ☠️ FÖRANKRINGEN — fäller åt BÅDA håll.
      ingar = [r for r in p["spec"] if r.startswith("Ingår:")]
      if len(ingar) != 1:
          fal(k, "specen har %d 'Ingår:'-rader" % len(ingar))
      elif k in UTAN_FORANKRING:
          if re.search(r"markankare|jordspett|sp(?:ä|a)nnlin|gummiband|"
                       r"expanderskruv|gummisp(?:ä|a)nn", ingar[0], re.I):
              fal(k, "'Ingår:'-raden lovar förankring — källans Lieferumfang "
                     "har bara tältet och anvisningen: %r" % ingar[0])
          if re.search(r"(markankare|jordspett)[^.]{0,30}(ing(å|a)r|f(ö|o)ljer med)",
                       pastar_utan_nekning, re.I):
              fal(k, "påstår att förankring ingår")
          faqtext = " ".join(f + " " + b for f, b in p["faq"])
          if not re.search(r"markpinn|f(?:ö|o)rankr", faqtext, re.I):
              fal(k, "ingen vanlig fråga säger att förankring inte ingår")
      else:
          for del_ in FORANKRING[k]:
              if del_ not in ingar[0]:
                  fal(k, "'Ingår:'-raden saknar %r: %r" % (del_, ingar[0]))
          # ☠️ En grannes förankringsmängd får inte stå som påstående här.
          egna_tal = set(re.findall(r"\d+", " ".join(FORANKRING[k])))
          for annan_k, delar in FORANKRING.items():
              if annan_k == k:
                  continue
              for del_ in delar:
                  antal, sak = del_.split(" ", 1)
                  if antal in egna_tal:
                      continue
                  # ☠️ Både siffran OCH räkneordet. "sexton ankare" skrevs
                  #    med bokstäver och gick rakt igenom en grind som bara
                  #    läste \d+ — samma hål som `m²` var i talgrinden.
                  former = [antal] + ([RAKNEORD[antal]] if antal in RAKNEORD else [])
                  for form in former:
                      if re.search(r"\b%s \w*%s" % (form, re.escape(sak[:6])),
                                   pastar_utan_nekning, re.I):
                          fal(k, "nämner %r — det är %s:s leveransinnehåll"
                                 % (del_, annan_k))

      # 3. ☠️ FÖNSTRET — bara 95a9d7cc har ett som syns på bild.
      if k in FONSTER:
          if not re.search(r"f(?:ö|o)nster", egna_ytor, re.I):
              fal(k, "har ett fönster på bild och i ritning men nämner det inte")
      else:
          for m in re.finditer(r"\bf(?:ö|o)nster\w*", egna_ytor, re.I):
              fal(k, "påstår ett fönster på sina egna ytor: %r — ingen bild "
                     "visar ett" % m.group(0))

      # 4. ☠️ VATTENTÄTHETEN.
      for m in VATTENTAT_RE.finditer(pastar):
          if k not in VATTENTAT_TILLATEN:
              fal(k, "påstår %r — källan kallar inte den här dukens tät"
                     % m.group(0))
      if k in MASTE_VATTENAVVISANDE:
          if not re.search(r"vattenavvisande", allt, re.I):
              fal(k, "källan säger emot sig själv om tätheten — sidan måste "
                     "säga vattenavvisande")

      # 5. ☠️ TAKFORMEN.
      takrad = [r for r in p["spec"] if r.startswith("Tak:")]
      if len(takrad) != 1:
          fal(k, "specen har %d 'Tak:'-rader" % len(takrad))
      elif TAKFORM[k] not in takrad[0].lower():
          fal(k, "'Tak:'-raden säger %r men taket är %s"
                 % (takrad[0], TAKFORM[k]))
      for annan in set(TAKFORM.values()) - {TAKFORM[k]}:
          if re.search(r"\b%s" % re.escape(annan), egna_ytor, re.I):
              fal(k, "påstår takformen %r på sina egna ytor — den här har %s"
                     % (annan, TAKFORM[k]))

      # 6. ☠️ FÄRGEN.
      fargrad = [r for r in p["spec"] if r.startswith("Färg:")]
      if len(fargrad) != 1:
          fal(k, "specen har %d 'Färg:'-rader" % len(fargrad))
      elif FARG[k] not in fargrad[0].lower():
          fal(k, "'Färg:'-raden säger %r men färgen är %s"
                 % (fargrad[0], FARG[k]))
      annan_farg = "mörkgrå" if FARG[k] == "ljusgrå" else "ljusgrå"
      if re.search(r"\b%s\s+duk\b" % annan_farg, egna_ytor, re.I):
          fal(k, "påstår %r duk på sina egna ytor — den här är %s"
                 % (annan_farg, FARG[k]))

      # 7. ☠️ BYGGLOV — inte vår fråga att svara på.
      for m in BYGGLOV_RE.findall(allt):
          fal(k, "påstår något om bygglov: %r"
                 % (m if isinstance(m, str) else m[0]))

      # 8. ☠️ ABSOLUTA PÅSTÅENDEN om en duk på en stålstomme.
      for m in ABSOLUT_RE.findall(pastar):
          fal(k, "absolut påstående om ett duktält: %r"
                 % (m if isinstance(m, str) else m[0]))

      # 9. ☠️ MATERIALET — stomme och duk är två rader, inte en.
      for krav, mot in (("Stomme:", r"stål|metall"), ("Duk:", r"pe\b|polyester|g/m²")):
          rad = [r for r in p["spec"] if r.startswith(krav)]
          if len(rad) != 1:
              fal(k, "specen har %d %r-rader" % (len(rad), krav))
          elif not re.search(mot, rad[0], re.I):
              fal(k, "%r-raden säger %r" % (krav, rad[0]))
      for m in re.findall(r"\b(trä|gran|furu|plåt|aluminium|glasfiber)\b",
                          pastar_utan_nekning, re.I):
          fal(k, "påstår materialet %r — stommen är galvaniserat stål och "
                 "duken PE eller polyester" % m)

      # 10. ☠️ MÅTTET SOM SKILJER — familjen jämförs på fotavtryck.
      for var, txt in (("namnet", p["name"]), ("sluggen", p["slug"]),
                       ("titeln", p["title"])):
          if not re.search(r"\d", txt):
              fal(k, "%s bär inget mått — familjen skiljs på fotavtryck" % var)

      # 11. ☠️ INTERN JARGONG I KUNDTEXT (runda 84:s grind 5c, utökad).
      #     "publicerad" är med sedan runda 87: det säger en kund ingenting.
      for m in re.finditer(r"\brundan\b|\brundans\b|\bpolering(?:en|ar)?\b|"
                           r"\butkast(?:et|en)?\b|\bmappning(?:en|ar)?\b|"
                           r"\bpoleringsk(?:ö|o)n\b|\bpublicerad\w*\b",
                           allt, re.I):
          fal(k, "intern jargong i kundtext: %r" % m.group(0))

      # ── härledda tal ─────────────────────────────────────────────────────
      tillatna = tal_i(" ".join(p["spec"]))
      for t in sorted(tal_i(utan_lankar) - tillatna):
          fal(k, "tal som inte står i produktens egen spec: %s" % t)
      for mal, ankare in re.findall(
              r'<a\b[^>]*href="[^"]*/([^"/]+)"[^>]*>(.*?)</a>', html):
          malets = tal_i(" ".join(SYSKONTAL.get(mal, []))) | EXTERN_TAL
          for t in sorted(tal_i(strip_taggar(ankare)) - malets):
              fal(k, "tal i länk till %s som inte är mätt för DEN sidan: %s"
                     % (mal, t))
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
                   "Stomme:", "Duk:", "Tak:", "Snölast:", "Paketmått:"):
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
    print("%-9s %-40s %-32s %s" % ("id8", "slug", "SKU", "html"))
    for p in texter.PRODUKTER:
        print("%-9s %-40s %-32s %d" % (p["kort"], p["slug"], p["sku"],
                                       len(texter.bygg(p))))
    print()
    for f in FEL:
        print("FEL:", f)
    print("\n%d fel i %d produkter" % (len(FEL), len(texter.PRODUKTER)))
    raise SystemExit(1 if FEL else 0)
