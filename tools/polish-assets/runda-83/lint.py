# -*- coding: utf-8 -*-
"""Runda 83 — grinden mot rundans egna texter, före något skrivs till Wix.

☠️ RUNDANS TUNGSTA GRIND ÄR MEDICINSK. En massagebänk är ingen medicinteknisk
   produkt. `VARD_RE` fäller på behandling, terapi, rehabilitering, lindring,
   smärta, besvär och läkning — utöver husets vanliga `HALSA_RE`. Ordet
   massage får beskriva MÖBELN, aldrig ett resultat.

☠️ `UTELAMNAT` bär rundans andra fynd: `d7eca2ba` får varken höjdrad eller
   hopfälld tjocklek. Dess tyska text är ordagrant syskonets medan dess EGEN
   måttritning säger något annat. Grinden fäller om talen smyger tillbaka.

☠️ `NORM_RE` fäller varje påstådd standard eller certifiering. Leverantören
   citerar ingen för någon av de åtta, och en uppfunnen EN-norm på en möbel
   någon ligger på är den farligaste sortens påhitt.

☠️ HÄRLEDDA TAL. Åtta bänkar med nästan samma mått är precis den situation
   där ett syskons siffra glider in i fel text: 185 mot 186 cm liggyta,
   60 mot 70 cm bredd, 91 mot 93 cm hopfälld.

☠️ `REKOMMENDERAD_KRAV` — de två bänkar där källan säger *rekommenderad*
   maxlast måste bära ordet i specen. Att jämna ut det till "maxlast" vore
   att skärpa ett tal leverantören själv mjukat upp.
"""
import os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR)); sys.path.insert(0, HAR)
import texter                                                        # noqa: E402
from grindar import (TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR,   # noqa: E402
                     LAGERFRAS, sku_bas)

TAL_RE = re.compile(r"(\d+(?:,\d+)?)\s*(cm|kg|%|°)")
KEDJA_RE = re.compile(r"((?:\d+(?:,\d+)?\s*(?:[×x]|–|-)\s*)+\d+(?:,\d+)?)\s*(cm|kg|%|°)")

ERGONOMI_RE = re.compile(r"ergonomisk\w*", re.I)
KONTORSSTOL_RE = re.compile(r"\b(kontorsstol\w*|arbetsstol\w*|skrivbordsstol\w*)\b", re.I)
GASLYFT_RE = re.compile(r"\b(gaslyft\w*|gasfjäder\w*|höjdreglering\w*)", re.I)
HALSA_RE = re.compile(r"\b(muskelvärk\w*|spänning\w*|hållning\w*|kroppshållning\w*|"
                      r"ryggrad\w*|hälsosam\w*|avlastar rygg\w*|lindrar|förebygger)", re.I)

# Tal som är LÄSTA på de länkade PUBLICERADE sidorna, inte på våra.
#   91 cm   `campingstol-fotstod-2-pack-fyra-lagen` (hopfälld 91 × 20 × 18)
#   159 kg  `hopfallbar-campingstol` (max belastning 159 kg)
#   130 kg  `campingstol-hopfallbar-armstod-2-pack` (130 kg per stol)
EXTERN_TAL = set()          # rundan länkar bara internt

# ☠️ Medicinsk grind. Ordet massage beskriver MÖBELN, aldrig ett resultat.
VARD_RE = re.compile(r"\b(behandl\w*|terapi\w*|rehab\w*|lindr\w*|smärt\w*|"
                     r"besvär\w*|läker|läkande|botar|helande|medicinsk\w*|"
                     r"kliniskt|patient\w*)", re.I)
# ☠️ Ingen norm är angiven för någon av de åtta.
NORM_RE = re.compile(r"\b(EN\s?\d{3,}|ISO\s?\d+|CE-märk\w*|CE\s?märk\w*|"
                     r"certifierad|certifiering|typgodkänd|provad enligt)", re.I)

# ☠️ Tal som är UTELÄMNADE MED FLIT, per produkt.
UTELAMNAT = {
    "d7eca2ba": ["58 cm", "81 cm", "61 cm", "87 cm", "13 cm", "17 cm"],
    # ☠️ Texten säger 58–82, den EGNA ritningen 62–83. Fyra centimeter i
    #    botten på det mått en bänk väljs på. Sju LÄGEN står i båda.
    "ed7a86fd": ["58 cm", "82 cm", "62 cm", "83 cm"],
}
# ☠️ Källan säger REKOMMENDERAD maxlast om dessa två — ordet får inte tappas.
REKOMMENDERAD_KRAV = {"2cfd373a", "d7eca2ba"}

# ☠️ MÅTTRADERNA ÄR LÅSTA VID EXAKT STRÄNG. Grinden kom till för att
#    mutationstestet visade att ingenting höll fast bäddens BREDD: en spec
#    som säger "185 × 81 cm" passerade, eftersom 81 cm står i produktens egen
#    spec — som TOTALBREDD ÖVER ARMHYLLORNA. Att ett tal finns någonstans på
#    sidan är inget bevis för att det står på RÄTT axel, och "81 cm bred" om
#    en 60 cm bädd är just det mått en köpare jämför på.
#
# ⚠️ ETT FÖRSTA UTKAST AV DEN HÄR GRINDEN HADE FEL FACIT, och det är värt att
#    stå kvar som varning. Alla åtta måttritningarna lästes, texterna såg ut
#    att avvika på två produkter, och grinden byggdes på att RITNINGEN vinner.
#    Sedan lästes den tyska källtexten — och den sa:
#      * `251f0429`: "Liegefläche: 185L x 70B cm". De 185 centimetrarna som
#        såg ut att vara min egen subtraktion är ALLTSÅ ANGIVNA. Grinden hade
#        strukit en riktig uppgift ur specen.
#      * `ed7a86fd`: "Gesamtmaße: 185L x 70B x 58-82H cm" och "Faltbare Größe:
#        92,5L x 70B x 18H cm" — en fullständig, produktspecifik spec. Ingen
#        slarvig avskrift; en ÄKTA konflikt mot ritningens 186 × 71 × 62–83.
#    Läs alltså källan INNAN en avvikelse döms som ett fel. Två sekundärkällor
#    som är eniga med varandra (ritningen och mina egna Steg 1-anteckningar)
#    bevisar ingenting om primärkällan.
#
#    Regeln som blev kvar, och som gäller båda de omtvistade produkterna:
#    skiljer sig texten och ritningen med HÖGST en centimeter följer vi
#    texten; skiljer de sig MATERIELLT utelämnas talet (`UTELAMNAT`).
#    `ed7a86fd`:s höjd är 58–82 mot 62–83 — fyra centimeter i botten på det
#    mått en bänk väljs på — och står därför inte på sidan alls. Det som står
#    är "sju steg", som BÅDA källorna säger.
#
#    Formen är (radprefix, exakt värde). Saknas raden, finns den två gånger,
#    eller slutar den på något annat — grinden fäller.
MATTRADER = {
    "a353ea02": [("Totallängd med ansiktsstöd:", "215 cm"),
                 ("Liggyta (L × B):", "185 × 60 cm"),
                 ("Totalbredd med armhyllor:", "81 cm"),
                 ("Höjd:", "61–84 cm")],
    "5078bedf": [("Totallängd med ansiktsstöd:", "215 cm"),
                 ("Totalbredd med armhyllor:", "81 cm"),
                 ("Höjd:", "61–84 cm")],
    "a9555a7d": [("Totallängd med ansiktsstöd:", "210 cm"),
                 ("Liggyta (L × B):", "185 × 60 cm"),
                 ("Totalbredd med armhyllor:", "81 cm"),
                 ("Höjd:", "67–92 cm")],
    "754a4749": [("Totallängd med ansiktsstöd:", "210 cm"),
                 ("Liggyta (L × B):", "185 × 60 cm"),
                 ("Totalbredd med armhyllor:", "81 cm"),
                 ("Höjd:", "67–92 cm")],
    "251f0429": [("Totallängd med ansiktsstöd:", "215 cm"),
                 ("Liggyta (L × B):", "185 × 70 cm"),
                 ("Höjd:", "61–86 cm")],
    # ☠️ Ingen "Höjd:"-rad här — spannet är omtvistat och utelämnat med flit.
    "ed7a86fd": [("Totalmått (L × B):", "185 × 70 cm"),
                 ("Höjdlägen:", "7"),
                 ("Hopfälld (L × B × H):", "92,5 × 70 × 18 cm")],
    "2cfd373a": [("Totalmått (L × B × H):", "186 × 60 × 61–87 cm")],
    "d7eca2ba": [("Liggyta (L × B):", "186 × 60 cm")],
}


NEKAD_RE = re.compile(r"(?:saknar|utan|ingen|inget|inga|inte)(?:\s+\w+){0,3}\s+"
                      r"(?:fotstöd|nackstöd|mugghållare|kylficka|armstöd|fottass\w*)", re.I)

# ☠️ ANTALSORD, uppdelade på vad de PÅSTÅR. Ett ord i vänsterkolumnen säger
#    "det är flera lösa stolar"; ett i högerkolumnen säger "det är en möbel
#    med två sitsar". Ingen produkt får bära båda sorterna.
FLERA_RE = re.compile(r"(\d-pack|två stolar|fyra stolar|båda stolarna|per stol|"
                      r"tvåpack|fyrpack|stolarna)", re.I)
EN_MOBEL_RE = re.compile(r"(dubbel\w*stol\w*|två sitsar|båda sitsarna|"
                         r"en stol med två)", re.I)

SYSKONTAL = {}
for _p in texter.PRODUKTER:
    SYSKONTAL[_p["slug"]] = _p["spec"]

FEL = []
PRODUKTER = texter.PRODUKTER


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
      # Länkar beskriver ANDRA sidor och undantas från varje påståendegrind.
      utan_lankar = strip_taggar(re.sub(r"<a\b[^>]*>.*?</a>", " ", html))

      # ── förbjudna ord ────────────────────────────────────────────────────
      for o in TYSKA + HUSMARKEN + ATTRIBUTION:
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
      if ERGONOMI_RE.search(allt):
          fal(k, "ordet 'ergonomisk' — ingen av stolarna bär certifiering")
      if HALSA_RE.search(allt):
          fal(k, "hälsopåstående utan underlag")
      if GASLYFT_RE.search(allt):
          fal(k, "påstår gaslyft — ingen av rundans stolar har någon")
      for m in KONTORSSTOL_RE.findall(" ".join([p["name"], p["title"],
                                                p["meta"], utan_lankar])):
          fal(k, "säljs som kontorsstol: %r" % m)

      # ── ☠️ RUNDANS EGNA GRINDAR ────────────────────────────────────────
      # En FRÅGA är inget påstående, och en NEKNING är det inte heller.
      pastar_txt = " ".join(m for m in re.split(r"(?<=[.!?])\s+", utan_lankar)
                            if not m.rstrip().endswith("?"))
      pastar = " ".join([p["name"], p["title"], p["meta"], pastar_txt])

      # 1. Medicinsk grind — massage beskriver MÖBELN, aldrig ett resultat.
      for m in VARD_RE.findall(pastar):
          fal(k, "vård-/behandlingspåstående: %r — en massagebänk är ingen "
                 "medicinteknisk produkt" % m)
      # 2. Ingen norm är angiven för någon av de åtta.
      for m in NORM_RE.findall(pastar):
          fal(k, "påstår en standard eller certifiering (%r) — ingen är "
                 "angiven för någon bänk i rundan" % m)
      # 3. Tal som är utelämnade MED FLIT.
      for t in UTELAMNAT.get(k, []):
          if t in tal_i(utan_lankar) | tal_i(" ".join(p["spec"])) \
                  | tal_i(p["meta"]) | tal_i(p["title"]) | tal_i(p["name"]):
              fal(k, "talet %s är utelämnat med flit — källan motsäger sig "
                     "själv om det (se STEG1.md)" % t)
      # 4. "Rekommenderad" får inte tappas där källan säger det.
      spectext = " ".join(p["spec"])
      if k in REKOMMENDERAD_KRAV:
          if not any(r.startswith("Rekommenderad maxlast:") for r in p["spec"]):
              fal(k, "specen saknar raden 'Rekommenderad maxlast:' — källan "
                     "säger uttryckligen REKOMMENDERAD om den här bänken")
          if any(r.startswith("Maxlast:") for r in p["spec"]):
              fal(k, "specen säger 'Maxlast:' rakt av på en bänk där källan "
                     "säger rekommenderad")
      else:
          if not any(r.startswith("Maxlast:") for r in p["spec"]):
              fal(k, "specen saknar raden 'Maxlast:'")
      # 4b. ☠️ Måtten låsta mot produktens EGEN måttritning. Se MATTRADER.
      for prefix, vantat in MATTRADER.get(k, []):
          rader = [r for r in p["spec"] if r.startswith(prefix)]
          if not rader:
              fal(k, "specen saknar måttraden %r" % prefix)
          elif len(rader) > 1:
              fal(k, "specen har %d rader som börjar med %r" % (len(rader), prefix))
          elif rader[0] != "%s %s" % (prefix, vantat):
              fal(k, "%r säger %r — facit säger %r"
                     % (prefix, rader[0][len(prefix):].strip(), vantat))
      # 5. Ansiktsöppningen är en säkerhetsdetalj och ska stå i villkorsblocket.
      if "ansiktsöppning" not in " ".join(p["villkor"][1]).lower():
          fal(k, "villkorsblocket nämner inte ansiktsöppningen")

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
      for krav in ("Montering:", "Ingår:", "Vikt:"):
          if not any(r.startswith(krav) for r in p["spec"]):
              fal(k, "spec-tabellen saknar raden %r" % krav)

      # ── utrustningsgrind: bara det som står i SPECEN får påstås ────────
      NEKANDE_SPEC = ("nej", "ingen", "inget", "inga", "saknas", "-")
      belagg = [r for r in p["spec"]
                if r.split(":", 1)[-1].strip().lower() not in NEKANDE_SPEC]
      pastatt = " ".join(belagg).lower()
      prosa_falt = ([p["ingress"]] + list(p["eg"]) + list(p["villkor"][1])
                    + list(p["skotsel"]) + [b for _, b in p["faq"]])
      prosa = strip_taggar(re.sub(r"<a\b[^>]*>.*?</a>", " ",
                                  " ".join(prosa_falt))).lower()
      prosa = " ".join(m for m in re.split(r"(?<=[.!?])\s+", prosa)
                       if not m.rstrip().endswith("?"))
      for ord_, nyckel in (("bärväska", "bärväska"), ("handbräd", "handbräda"),
                           ("armstöd", "armstöd"), ("ansiktsstöd", "ansiktsstöd")):
          if ord_ in prosa and nyckel not in pastatt:
              fal(k, "påstår %s som inte står i specen" % ord_)

      # ── sökordet i namn, slug OCH titel ─────────────────────────────────
      def vik(t):
          return (t.lower().replace("å", "a").replace("ä", "a")
                           .replace("ö", "o").replace("é", "e"))
      huvud = p["slug"].split("-")[0]
      for var, txt in (("namn", p["name"]), ("titel", p["title"])):
          if huvud[:8] not in vik(txt):
              fal(k, "sökordet %r saknas i %s" % (huvud, var))

      sluggar.setdefault(p["slug"], []).append(k)
      skuer.setdefault("FP-" + sku_bas(p["slug"]), []).append(k)

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
        print("%-9s %-36s %-30s %d" % (p["kort"], p["slug"],
              "FP-" + sku_bas(p["slug"]), len(texter.bygg(p))))
    print()
    for f in FEL:
        print("FEL:", f)
    print("\n%d fel i %d produkter" % (len(FEL), len(texter.PRODUKTER)))
    raise SystemExit(1 if FEL else 0)
