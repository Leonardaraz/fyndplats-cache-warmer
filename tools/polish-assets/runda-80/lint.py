# -*- coding: utf-8 -*-
"""Runda 80 — grinden mot rundans egna texter, före något skrivs till Wix.

☠️ HÄRLEDDA TAL. Varje tal i brödtexten måste stå i PRODUKTENS EGEN spec. Det
   är den grind som fångar när ett syskons mått halkar in i fel text — och i
   den här rundan är risken stor: åtta pallar med snarlika höjdintervall.

☠️ KORSLÄNKSUNDANTAGET GÄLLER BARA INUTI `<a>`. Runda 77 mätte upp att ett
   undantag som gällde hela sidan släppte igenom `40 × 44` för att 44 stod i
   ett SYSKONS sits-spec. Här gäller det bara ankartexten, och bara mot tal som
   är LÄSTA på den länkade sidan (`EXTERN_TAL`).

☠️ TVÅ FÖRBUD ÄR SCOPADE PÅ SAMMA SÄTT. `arbetsstol` är förbjudet i vår text —
   ingen av de åtta är en arbetsstol — men det står med flit i ankartexten till
   den PUBLICERADE arbetsstolen. Ett förbud som inte skiljer på de två hade
   antingen fällt en korrekt länk eller släppt igenom ett felaktigt påstående.
"""
import os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR)); sys.path.insert(0, HAR)
import texter                                                        # noqa: E402
from grindar import (TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR,   # noqa: E402
                     LAGERFRAS, sku_bas)

TAL_RE = re.compile(r"(\d+(?:,\d+)?)\s*(cm|kg|%|°)")
# Ett kedjat mått (\"50 × 54 × 66–78 cm\") bär enheten EN gång men flera tal.
KEDJA_RE = re.compile(r"((?:\d+(?:,\d+)?\s*(?:[×x]|–|-)\s*)+\d+(?:,\d+)?)\s*(cm|kg|%|°)")

ERGONOMI_RE = re.compile(r"ergonomisk\w*", re.I)
# ☠️ `arbetspall` är TILLÅTET, `arbetsstol` är det inte. Ordgränsen i slutet
#    är därför nödvändig — utan den fäller mönstret på vår egen produkttyp.
KONTORSSTOL_RE = re.compile(r"\b(kontorsstol\w*|arbetsstol\w*|heldagsarbete)\b", re.I)
# ☠️ ORDGRÄNSEN I SLUTET VAR ETT HÅL. `hållning` matchade inte `hållningen`,
#    och det är den böjda formen man faktiskt skriver ("hållningen blir
#    rakare"). Runda 79:s mutationstest fällde den. Alla stammar har `\w*` nu.
HALSA_RE = re.compile(r"\b(hållning\w*|kroppshållning\w*|ryggrad\w*|koncentration\w*|"
                      r"hälsosam\w*|avlastar rygg\w*|förebygger)", re.I)
# Tal som är LÄSTA på den länkade PUBLICERADE sidan, inte på vår.
#   150 kg  `reclinerfatolj-svart-med-fotpall` (publicerad, mätt i Steg 1)
# ⚠️ Övriga länkar i rundan bär medvetet INGA tal i ankartexten — då finns
#    ingenting att belägga, och grinden kan inte luras av ett tal som råkar
#    stå i vår egen spec.
EXTERN_TAL = {"150 kg"}
# En nekad förekomst är inget påstående om utrustning.
# ⚠️ Upp till tre ord får stå emellan: "det INTE finns något RYGGSTÖD" är
#    lika nekande som "saknar ryggstöd", och en grind som bara klarar det
#    andra fäller korrekt text — vilket den gjorde i första körningen.
NEKAD_RE = re.compile(r"(?:saknar|utan|ingen|inget|inga|inte)(?:\s+\w+){0,3}\s+"
                      r"(?:ryggstöd|rygg|fotring|broms\w*)", re.I)
# ☠️ Ett tal i en ankartext mot ett SYSKON i rundan ska slås upp i syskonets
#    egen spec, inte i vår. Runda 77:s grind kände bara till EXTERN_TAL och
#    hade fällt en korrekt länk ("salongspallen med 9 cm skum") där 9 cm står
#    i den länkade produktens spec-tabell. Slugg → tillåtna tal byggs därför
#    ur PRODUKTER, mekaniskt.
SYSKONTAL = {}


def strip_taggar(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def tal_i(text):
    ut = set("%s %s" % (a, e) for a, e in TAL_RE.findall(text))
    for kedja, enhet in KEDJA_RE.findall(text):
        for d in re.findall(r"\d+(?:,\d+)?", kedja):
            ut.add("%s %s" % (d, enhet))
    return ut


for _p in texter.PRODUKTER:
    SYSKONTAL[_p["slug"]] = _p["spec"]

FEL = []
PRODUKTER = texter.PRODUKTER


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
          fal(k, "ordet 'ergonomisk' — ingen av pallarna bär certifiering")
      if HALSA_RE.search(allt):
          fal(k, "hälsopåstående utan underlag")

      # ☠️ `arbetsstol` bara UTANFÖR länkar — se modulens docstring.
      utan_lankar = strip_taggar(re.sub(r"<a\b[^>]*>.*?</a>", " ", html))
      # ☠️ HALVA RUNDAN ÄR KONTORSSTOLAR OCH HALVA ÄR DET INTE. Runda 78 och 79
      #    förbjöd ordet rakt av, för där var varenda produkt en pall. Här är
      #    fyra av åtta riktiga kontorsstolar på hjul — och de fyra andra
      #    (snurrfåtöljerna och reclinern) är det INTE, trots att källan kallar
      #    en av dem `Arbeitshocker`. Förbudet gäller därför per produkt, avgjort
      #    på sluggen: den som heter kontorsstol eller skrivbordsstol får säga
      #    det, ingen annan.
      ar_kontorsstol = ("kontorsstol" in p["slug"] or "skrivbordsstol" in p["slug"])
      if not ar_kontorsstol:
          # ☠️ EN FRÅGA ÄR INGET PÅSTÅENDE OCH EN NEKNING ÄR DET INTE HELLER.
          #    Utrustningsgrinden tio rader ner har hanterat båda sedan runda 79;
          #    den här hade ingendera och fällde två KORREKTA meningar:
          #    "varken är en kontorsstol eller en vanlig fåtölj" och frågan
          #    "Bär den mer än en vanlig kontorsstol?". Två grindar som ställer
          #    samma sorts fråga ska sålla bort samma sorts text — annars är den
          #    ena dekoration och den andra en fälla.
          pastar = " ".join(m for m in re.split(r"(?<=[.!?])\s+", utan_lankar)
                            if not m.rstrip().endswith("?"))
          pastar = re.sub(r"(?:varken|inte|ingen|inget|aldrig)(?:\s+\w+){0,3}\s+"
                          r"(?:kontorsstol|arbetsstol)\w*", " ", pastar, flags=re.I)
          for m in KONTORSSTOL_RE.findall(" ".join([p["name"], p["title"], p["meta"], pastar])):
              fal(k, "säljs som kontorsstol/arbetsstol: %r" % m)

      # ── härledda tal ─────────────────────────────────────────────────────
      tillatna = tal_i(" ".join(p["spec"]))
      for t in sorted(tal_i(utan_lankar) - tillatna):
          fal(k, "tal som inte står i produktens egen spec: %s" % t)
      for mal, ankare in re.findall(r'<a\b[^>]*href="[^"]*/([^"/]+)"[^>]*>(.*?)</a>', html):
          # ☠️ `tillatna` (VÅR spec) får INTE ingå. Ankartexten beskriver den
          #    länkade sidan, så ett tal som råkar stå i vår egen spec är inget
          #    belägg för den andra. Mutationstestet fann hålet: "rullpallarna
          #    i 2-pack med 9 cm skum" passerade för att 9 cm står i VÅR spec.
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
      # Alla åtta kräver montering, och alla åtta ska säga vad som ingår.
      for krav in ("Montering:", "Ingår:", "Maxlast:"):
          if not any(r.startswith(krav) for r in p["spec"]):
              fal(k, "spec-tabellen saknar raden %r" % krav)

      # ── utrustningsgrindar, lästa ur SPECEN och inte ur prosan ───────────
      # ☠️ Grinden frågar "påstår texten utrustning varan saknar?". Två sorters
      #    förekomst är därför INGA påståenden och måste undantas, annars fäller
      #    den korrekta sidor: ordet i en KORSLÄNK (det beskriver den andra
      #    produkten) och ordet i en NEKANDE mening ("saknar ryggstöd").
      # ☠️ Bara SPECEN duger som belägg. Låg `eg` på den tillåtande sidan
      #    kunde en säljpunkt ensam "bevisa" utrustning som inte står i
      #    tabellen — och en mutation av punktlistan gjorde sig själv sann.
      # ☠️ EN SPEC-RAD SOM NEKAR ÄR INGET BELÄGG. `Ryggstöd: nej` innehåller
      #    ordet "ryggstöd" och lät därför ett påstående om ryggstöd passera —
      #    på just de produkter som SAKNAR ett, alltså där grinden behövs mest.
      #    Runda 78 hade ingen sådan rad och kunde inte se hålet; runda 79 har
      #    tre. Nekande rader stryks ur beläggen innan uppslaget görs.
      NEKANDE_SPEC = ("nej", "ingen", "inget", "inga", "saknas", "-")
      belagg = [r for r in p["spec"]
                if r.split(":", 1)[-1].strip().lower() not in NEKANDE_SPEC]
      pastatt = " ".join(belagg).lower()
      # ☠️ PROSAN FICK INTE INNEHÅLLA SPEC-TABELLEN. `utan_lankar` byggs ur den
      #    RENDERADE sidan, och där ingår specen — så grinden jämförde specen
      #    med sig själv. Före lagningen ovan tog de två sidorna ut varandra
      #    och grinden fyrade aldrig på en spec-listad post; efteråt fyrade den
      #    på tre korrekta texter. Båda felen är samma fel. Prosan byggs nu ur
      #    PROSA-FÄLTEN, aldrig ur den renderade helheten.
      # ☠️ OCH EN FRÅGA ÄR INGET PÅSTÅENDE. "Går det att sätta på ett
      #    ryggstöd?" följt av "Nej" är motsatsen till ett påstående om
      #    utrustning. Meningar som slutar på frågetecken stryks.
      prosa_falt = ([p["ingress"]] + list(p["eg"]) + list(p["villkor"][1])
                    + list(p["skotsel"]) + [b for _, b in p["faq"]])
      prosa_txt = strip_taggar(re.sub(r"<a\b[^>]*>.*?</a>", " ",
                                      " ".join(prosa_falt)))
      prosa_txt = " ".join(m for m in re.split(r"(?<=[.!?])\s+", prosa_txt)
                           if not m.rstrip().endswith("?"))
      prosa = NEKAD_RE.sub(" ", prosa_txt.lower())
      for ord_, nyckel in (("ryggstöd", "rygg"), ("fotring", "fotring"),
                           ("broms", "broms"), ("nackstöd", "nackstöd")):
          if ord_ in prosa and nyckel not in pastatt:
              fal(k, "påstår %s som inte står i specen" % ord_)

      # ☠️ FYRA AV ÅTTA HAR INGA HJUL. De står på en rund fot, och källan
      #    kallar en av dem `Arbeitshocker` — alltså precis den sortens stol
      #    man ANTAR rullar. Ett påstått hjul på en stol utan hjul är ett
      #    faktafel kunden upptäcker vid uppackning. Nekade och länkade
      #    förekomster undantas som vanligt.
      if any(r.startswith("Fot:") and "inga hjul" in r for r in p["spec"]):
          utan_nekad = re.sub(r"(?:utan|inga|inget|ingen|inte)(?:\s+\w+){0,3}\s+hjul",
                              " ", prosa)
          if re.search(r"\bhjul", utan_nekad):
              fal(k, "påstår hjul på en stol som står på fast fot")

      # ── sökordet i namn, slug OCH titel ─────────────────────────────────
      # ☠️ SLUGGEN ÄR ASCII, NAMNET ÄR DET INTE. Grinden jämförde `snurrfat`
      #    (ur `snurrfatolj-...`) mot "Snurrfåtölj" och hittade det aldrig —
      #    å:et bryter matchningen. Runda 78 och 79 hade inga å/ä/ö i
      #    huvudordet och kunde därför inte se hålet; här fällde den tre
      #    korrekta sidor. Texten viks nu på samma sätt som sluggen.
      def vik(t):
          return (t.lower().replace("å", "a").replace("ä", "a")
                           .replace("ö", "o").replace("é", "e"))
      huvud = p["slug"].split("-")[0]
      for var, txt in (("namn", p["name"]), ("titel", p["title"])):
          if huvud[:8] not in vik(txt):
              fal(k, "sökordet %r saknas i %s" % (huvud, var))

      sluggar.setdefault(p["slug"], []).append(k)
      skuer.setdefault("FP-" + sku_bas(p["slug"]), []).append(k)

  # ☠️ EN rad PER inblandad produkt. Rapporterat bara på den första blir
  #    krocken osynlig för den som granskar den andra sidan.
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
    print("%-9s %-32s %-28s %s" % ("id8", "slug", "SKU", "html"))
    for p in texter.PRODUKTER:
        print("%-9s %-32s %-28s %d" % (p["kort"], p["slug"],
                                       "FP-" + sku_bas(p["slug"]), len(texter.bygg(p))))
    print()
    for f in FEL:
        print("FEL:", f)
    print("\n%d fel i %d produkter" % (len(FEL), len(texter.PRODUKTER)))
    raise SystemExit(1 if FEL else 0)
