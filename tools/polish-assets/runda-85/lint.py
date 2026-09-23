# -*- coding: utf-8 -*-
"""Runda 85 — grinden mot rundans egna texter, före något skrivs till Wix.

☠️ RUNDANS TYNGSTA GRIND ÄR MATERIALET, OCH DET SKILJER MELLAN SYSKONEN.
   Fyra tunnor har stomme i 410 rostfritt stål, `a00882ed` har
   pulverlackerad plåt och `ec672f4d` är ABS och plast med metallskenor.
   Runda 84 hade EN materialregel för hela rundan; här finns tre, och
   felet är att kopiera fel rad mellan syskon. `MATERIAL` är därför en
   tabell per produkt, och `FEL_MATERIAL_RE` fäller när en produkt
   påstår ett material som hör till ett syskon.

☠️ `DOFTBLOCK` — bara TRE av sex har hållare, och blocken ingår aldrig.
   Grinden kräver hållarraden på de tre och FÄLLER på de andra tre om
   ordet dyker upp: en hållare som inte finns är samma fel som runda 52:s
   sandlåda, fast åt andra hållet.

☠️ `MONTERAS` — `ec672f4d` skruvas fast, de fem andra ställs bara på
   plats. Fäller åt BÅDA håll, som runda 84.

☠️ `BARNSAKER_RE` — `ec672f4d`s källa säger att skenorna glider "med lätt
   motstånd, för att hindra barn eller husdjur". Det är ett MOTSTÅND, inte
   ett lås, och runda 55 lärde vad det kostar att sälja skillnaden fel.
   Grinden fäller varje POSITIVT barnsäkerhetspåstående — men bara i
   påståenden, så FAQ-svaret som säger "Nej, den är inte barnsäker" går
   igenom.

☠️ `ABSOLUT_RE` — källan säger både *fingerabdruckSICHER* och
   *fingerabdruckRESISTENT* om samma yta. "Fingeravtryckssäker" är ett
   absolut påstående om något som inte går att uppnå; vår text säger
   "motstår fingeravtryck" och grinden fäller det starkare ordet.

☠️ `VOLYM` — familjens jämförelseaxel är volym OCH antal fack. Tre
   produkter delar 40 liter och skiljs på formen, så volymgrinden ensam
   räcker inte: `SARSKILJARE` kräver att ordet som skiljer dem står i
   namn, slug OCH titel.
"""
import os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR)); sys.path.insert(0, HAR)
import texter                                                        # noqa: E402
from grindar import (TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR,   # noqa: E402
                     LAGERFRAS)

TAL_RE = re.compile(r"(\d+(?:,\d+)?)\s*(cm|kg|%|°)")
KEDJA_RE = re.compile(r"((?:\d+(?:,\d+)?\s*(?:[×x]|–|-)\s*)+\d+(?:,\d+)?)\s*(cm|kg|%|°)")

# ☠️ Materialet per produkt — rundans skiljelinje.
#    "stal" = 410 rostfritt · "lack" = pulverlackerad plåt · "plast" = ABS
MATERIAL = {"17fb1869": "stal", "b10b80ee": "stal", "10c47f8e": "stal",
            "213be879": "stal", "a00882ed": "lack", "ec672f4d": "plast"}

# ☠️ Hållare för doftblock — bara tre av sex har någon.
DOFTBLOCK = {"17fb1869", "b10b80ee", "10c47f8e"}

# ☠️ Skruvas fast i skåpet. De fem andra ställs bara på plats.
MONTERAS = {"ec672f4d"}

# ☠️ Volym och antal fack per produkt.
VOLYM = {"17fb1869": 30, "b10b80ee": 40, "10c47f8e": 40,
         "213be879": 40, "a00882ed": 60, "ec672f4d": 31}
FACK = {"17fb1869": 2, "b10b80ee": 2, "10c47f8e": 2,
        "213be879": 2, "a00882ed": 2, "ec672f4d": 3}

# ☠️ Tre produkter delar 40 liter. Ordet som skiljer dem måste stå i
#    namn, slug OCH titel — runbokens krav, och det enda som hindrar
#    kannibalisering mellan tre sidor med samma volym och samma sökord.
SARSKILJARE = {"b10b80ee": "silver", "10c47f8e": "svart", "213be879": "smal"}

# ☠️ DEN ROSTFRIA LÖGNEN (runda 57). Locken är plast på var enda tunna.
ROSTFRI_RE = re.compile(r"(helt i rostfritt|hela tunnan (?:är |i )rostfri|"
                        r"rostfri tunna|tunna i rostfritt stål|"
                        r"gjord i rostfritt|helt i stål|helt i plåt)", re.I)

# ☠️ Ett material som hör till ett SYSKON, påstått om den här produkten.
FEL_MATERIAL_RE = {
    "stal":  re.compile(r"pulverlackerad|pulverlack\b", re.I),
    "lack":  re.compile(r"rostfri", re.I),
    "plast": re.compile(r"rostfri|pulverlackerad", re.I),
}

# ☠️ Barnsäkerhet: bara POSITIVA påståenden fälls. Källan lovar ett
#    motstånd, inte ett lås.
BARNSAKER_RE = re.compile(r"\b(barnsäker\w*|barnlås\w*|barnspärr\w*|"
                          r"säker för barn|skyddar barn)\b", re.I)

# ☠️ Absoluta påståenden om ytan. Källan säger både -sicher och -resistent.
ABSOLUT_RE = re.compile(r"(fingeravtryckssäk\w*|fingeravtrycksfri\w*|"
                        r"helt fri från fingeravtryck|repfri\w*|"
                        r"luktfri\w*|helt lukttät\w*)", re.I)

# ☠️ HUSETS DELADE TYSKA LISTA ÄR SKRIVEN FÖR MÖBELRUNDORNA. Den innehåller
#    `sessel`, `hocker`, `rückenlehne`, `sitzfläche` — och INGENTING som den
#    här familjens källtext faktiskt använder. `Mülleimer`, `Abfalleimer`,
#    `Deckel`, `Treteimer`, `Edelstahl`, `Kunststoff` och `Inneneimer` hade
#    alla passerat rakt igenom. Runda 84 upptäckte samma sak men lade listan
#    bara i `live.py`; den hör hemma i LINTEN också, som är grinden FÖRE
#    skrivningen.
#
# ☠️ LISTAN SJÄLVTESTAS mot vår egen text nedan (runda 81:s lärdom: `oxford`
#    och `khaki` stod i den tyska listan medan VÅR text innehöll dem, och
#    grinden hade fällt åtta korrekta sidor). Orden nedan är valda så att de
#    inte kan INLEDA ett svenskt ord — `filter`, `form`, `pedal`, `sensor`
#    och `silber` är därför medvetet UTELÄMNADE.
TYSKA_BANK = [
    "mülleimer", "mulleimer", "abfalleimer", "abfallbehälter",
    "abfallbehalter", "doppelmülleimer", "doppelmulleimer", "küchenmülleimer",
    "kuchenmulleimer", "treteimer", "inneneimer", "innenbehälter",
    "innenbehalter", "ausziehbehälter", "ausziehbehalter", "eimer",
    "deckel", "fußpedal", "fusspedal", "pedalöffnung", "pedaloffnung",
    "edelstahl", "kunststoff", "pulverbeschichtet", "metallgehäuse",
    "metallgehause", "metallführungen", "metallfuhrungen",
    "mülltrennung", "mulltrennung", "fächern", "fachern", "doppelfach",
    "fassungsvermögen", "fassungsvermogen", "kapazität", "kapazitat",
    "volumen", "gesamtabmessungen", "rahmenmaße", "rahmenmasse",
    "öffnungsmaße", "offnungsmasse", "herausnehmbar", "abnehmbar",
    "fingerabdrucksicher", "fingerabdruckresistent", "geruchskontrolle",
    "gerüche", "geruche", "schrauben", "befestigung", "bedienungsanleitung",
    "handbuch", "anleitung", "hinweis", "küche", "kuche", "badezimmer",
    "schlafzimmer", "büro", "buro", "haustiere", "kinder", "schwarz",
    "weiß", "weiss", "hellgrau", "praktisch", "hochwertig", "geräuschlos",
    "gerauschlos", "leise", "sanft", "mühelos", "muhelos",
]

# Tal som är LÄSTA på de länkade PUBLICERADE sidorna, inte på våra.
#   45 liter  `soptunna-med-3-fack-45-liter`         (3 × 15 liter)
#   56 liter  `soptunna-med-2-fack-56-liter`         (2 × 28 liter)
#   30 liter  `utdragbar-soptunna-koksskap-30-liter` (20 + 10 liter)
EXTERN_TAL = {"45 liter", "56 liter", "30 liter"}

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
      pastar_txt = " ".join(m for m in re.split(r"(?<=[.!?])\s+", utan_lankar)
                            if not m.rstrip().endswith("?"))
      pastar = " ".join([p["name"], p["title"], p["meta"], pastar_txt])
      spectext = " ".join(p["spec"])

      # 1. ☠️ MATERIALET — tre olika, och felet är att kopiera syskonets.
      mat = MATERIAL[k]
      for m in ROSTFRI_RE.findall(pastar):
          fal(k, "påstår att hela tunnan är rostfri (%r) — locken är plast"
                 % (m if isinstance(m, str) else m[0]))
      # ⚠️ Nekningen "inte rostfritt stål" är själva poängen på `a00882ed`
      #    och får inte fällas. Grinden granskar därför meningar UTAN "inte".
      pastar_utan_nekning = " ".join(
          m for m in re.split(r"(?<=[.!?])\s+", pastar)
          if not re.search(r"\b(inte|inget|ingen|nej)\b", m, re.I))
      for m in FEL_MATERIAL_RE[mat].findall(pastar_utan_nekning):
          fal(k, "påstår materialet %r — det hör till ett SYSKON, den här "
                 "är %s" % (m if isinstance(m, str) else m[0], mat))
      stomme = [r for r in p["spec"] if r.startswith("Stomme:")]
      if len(stomme) != 1:
          fal(k, "specen har %d 'Stomme:'-rader" % len(stomme))
      else:
          kravs = {"stal": "rostfritt", "lack": "pulverlackerad",
                   "plast": "abs"}[mat]
          if kravs not in stomme[0].lower():
              fal(k, "'Stomme:'-raden säger %r men materialet är %s"
                     % (stomme[0], mat))
      if mat != "plast" and not any(
              r.startswith("Lock") and "plast" in r.lower() for r in p["spec"]):
          fal(k, "specen saknar en 'Lock…'-rad med plast")

      # 2. ☠️ MONTERINGEN — fäller åt BÅDA håll.
      mont = [r for r in p["spec"] if r.startswith("Montering:")]
      if len(mont) != 1:
          fal(k, "specen har %d 'Montering:'-rader" % len(mont))
      elif k in MONTERAS:
          if "krävs inte" in mont[0] or "krävs" not in mont[0]:
              fal(k, "enheten skruvas fast men specen säger %r" % mont[0])
          if "skruv" not in " ".join(b for _, b in p["faq"]).lower():
              fal(k, "ingen vanlig fråga förklarar skruvmonteringen")
      else:
          if "krävs inte" not in mont[0]:
              fal(k, "tunnan ställs bara på plats men specen säger %r"
                     % mont[0])

      # 3. ☠️ DOFTBLOCKEN — bara tre har hållare, blocken ingår aldrig.
      hall = [r for r in p["spec"] if r.startswith("Doftblockshållare:")]
      if k in DOFTBLOCK:
          if not hall:
              fal(k, "specen saknar raden 'Doftblockshållare:'")
          elif "ingår inte" not in hall[0]:
              fal(k, "doftblockets rad säger inte att blocket INTE ingår")
          # ⚠️ Läs FRÅGA och SVAR, inte bara svaret: "Ingår doftblocken?"
          #    bär ordet, svaret säger "Nej, hållarna är tomma". Båda är
          #    text på sidan, och en grind som bara ser halva FAQ:n fäller
          #    en sida som gör precis rätt.
          faqtext = " ".join(f + " " + b for f, b in p["faq"]).lower()
          if "doftblock" not in faqtext:
              fal(k, "ingen vanlig fråga säger att doftblocken inte ingår")
      else:
          if hall:
              fal(k, "har en doftblocksrad — källan nämner ingen hållare "
                     "för den här tunnan")
          if re.search(r"doftblock", utan_lankar, re.I):
              fal(k, "nämner doftblock — källan ger den ingen hållare")

      # 4. ☠️ BARNSÄKERHET — bara POSITIVA påståenden fälls.
      for m in BARNSAKER_RE.findall(pastar_utan_nekning):
          fal(k, "barnsäkerhetspåstående %r — källan lovar ett MOTSTÅND, "
                 "inte ett lås" % (m if isinstance(m, str) else m[0]))

      # 5. ☠️ ABSOLUTA YTPÅSTÅENDEN.
      for m in ABSOLUT_RE.findall(pastar):
          fal(k, "absolut påstående om ytan: %r" % (m if isinstance(m, str) else m[0]))

      # 6. ☠️ VOLYM OCH ANTAL FACK — familjens jämförelseaxel.
      for var, txt in (("namnet", p["name"]), ("titeln", p["title"]),
                       ("metan", p["meta"])):
          if str(VOLYM[k]) not in txt:
              fal(k, "%s bär inte tunnans volym (%d)" % (var, VOLYM[k]))
      if not any(r.startswith("Volym:") and "%d liter totalt" % VOLYM[k] in r
                 for r in p["spec"]):
          fal(k, "specen saknar en 'Volym:'-rad med '%d liter totalt'"
                 % VOLYM[k])
      if not any(r == "Antal fack: %d" % FACK[k] for r in p["spec"]):
          fal(k, "specen saknar raden 'Antal fack: %d'" % FACK[k])
      # ☠️ Ett tal som står i produktens EGEN spec är dess eget, hur gärna
      #    det än råkar vara ett syskons totalvolym. `a00882ed` har fack på
      #    30 liter — samma tal som `17fb1869`s hela volym — och grinden
      #    fällde en helt korrekt mening om produktens egna fack.
      egna_tal = " ".join(p["spec"])
      for annan_k, annan in VOLYM.items():
          if annan_k == k or annan == VOLYM[k]:
              continue
          if re.search(r"\b%d liter\b" % annan, egna_tal):
              continue
          if re.search(r"\b%d liter\b" % annan, utan_lankar):
              fal(k, "nämner %d liter — det är %s:s volym, och den hör hemma "
                     "i en LÄNK till den sidan" % (annan, annan_k))

      # 6b. ☠️ SÄRSKILJAREN mellan de tre 40-litersmodellerna.
      sar = SARSKILJARE.get(k)
      if sar:
          for var, txt in (("namnet", p["name"]), ("sluggen", p["slug"]),
                           ("titeln", p["title"])):
              if sar not in txt.lower():
                  fal(k, "%s bär inte särskiljaren %r — tre sidor delar 40 "
                         "liter och kannibaliserar utan den" % (var, sar))

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
      for krav in ("Montering:", "Ingår:", "Vikt:", "Färg:", "Stomme:"):
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
