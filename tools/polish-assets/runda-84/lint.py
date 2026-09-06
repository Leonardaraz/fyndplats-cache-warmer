# -*- coding: utf-8 -*-
"""Runda 84 — grinden mot rundans egna texter, före något skrivs till Wix.

☠️ RUNDANS TYNGSTA GRIND ÄR MATERIALET. Varenda tunna har stomme i stål och
   lock i PLAST, men den maskinsatta svenska fliken skriver "Edelstahl" rakt
   av på flera. Runda 57 kallade det den ROSTFRIA LÖGNEN. `ROSTFRI_RE` fäller
   varje formulering som gör hela tunnan rostfri, och varje produkt måste ha
   BÅDE en `Stomme:`-rad med rostfritt och en `Lock:`-rad med plast.

☠️ `MONTERING` — två tunnor levereras som lösa paneler (`4ef74d40`,
   `96beca79`), fem gör det inte. Uppgiften står bara i källans punktlista,
   aldrig i spec-blocket som importen speglar, så den är lätt att tappa.
   Grinden kräver rätt rad på alla sju och fäller åt BÅDA håll.

☠️ `BATTERI` — fem tunnor tar 4 × AA, två tar 4 × D. Grinden kräver rätt typ
   i specen och fäller om FEL typ nämns i produktens egen text. D-celler
   kostar mer och finns inte i varje butik; det är en riktig skillnad mellan
   två annars snarlika tunnor och får inte kopieras från syskonet.

☠️ `DOFTBLOCK` — `96beca79` har aktivt kolfiber som INGÅR och en hållare för
   ett doftblock som INTE ingår. Att slå ihop dem till "luktfilter" vore
   runda 52:s sandlådefel. Grinden kräver att båda raderna finns och att
   "ingår inte" står vid blocket.

☠️ `VOLYM` — volymen är familjens enda jämförelseaxel och det enda en
   dubblett syns på. Varje sida måste bära SIN volym i namn, titel och spec,
   och får inte nämna en annan tunnas volym utanför en länk.

⚠️ `466e799a`:s "59 cm" är utelämnat med flit — se STEG1.md.
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
# Tal som är LÄSTA på de länkade PUBLICERADE sidorna, inte på våra.
#   30 liter  `soptunna-med-sensor`          (33 × 25 × 58 cm)
#   68 liter  `soptunna-med-sensor-68-liter` (40,5 × 29,5 × 78 cm)
EXTERN_TAL = {"30 liter", "68 liter"}

# ☠️ DEN ROSTFRIA LÖGNEN (runda 57). Locket är plast på var enda tunna.
ROSTFRI_RE = re.compile(r"(helt i rostfritt|hela tunnan (?:är |i )rostfri|"
                        r"rostfri tunna|tunna i rostfritt stål|"
                        r"gjord i rostfritt|helt i stål)", re.I)

# ☠️ Volym per produkt — familjens enda jämförelseaxel.
VOLYM = {"466e799a": 20, "7846d05f": 42, "aabcd677": 45, "0cc5c634": 48,
         "4ef74d40": 55, "dcd756bd": 58, "96beca79": 60}

# ☠️ Batteritypen skiljer och kostar pengar. None = källan anger ingen.
BATTERI = {"466e799a": "AA", "7846d05f": "AA", "aabcd677": None,
           "0cc5c634": "D", "4ef74d40": "AA", "dcd756bd": "D",
           "96beca79": "AA"}

# ☠️ Två tunnor levereras som lösa paneler. Källan säger det bara i
#    punktlistan, aldrig i spec-blocket importen speglar.
MONTERAS = {"4ef74d40", "96beca79"}

# ☠️ Tal som är UTELÄMNADE MED FLIT, per produkt.
UTELAMNAT = {
    # Ett lockmått på 59 cm är omöjligt som linjärt mått på en 42,5 cm hög
    # tunna, och källan säger inte om det är en vinkel eller öppen höjd.
    "466e799a": ["59 cm"],
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
      spectext = " ".join(p["spec"])

      # 1. ☠️ DEN ROSTFRIA LÖGNEN. Locket är plast på var enda tunna.
      for m in ROSTFRI_RE.findall(pastar):
          fal(k, "påstår att hela tunnan är rostfri (%r) — locket är plast"
                 % (m if isinstance(m, str) else m[0]))
      if not any(r.startswith("Stomme:") and "rostfritt" in r.lower()
                 for r in p["spec"]):
          fal(k, "specen saknar en 'Stomme:'-rad med rostfritt stål")
      if not any(r.startswith("Lock:") and ("plast" in r.lower())
                 for r in p["spec"]):
          fal(k, "specen saknar en 'Lock:'-rad med plast")

      # 2. ☠️ MONTERINGEN — fäller åt BÅDA håll.
      mont = [r for r in p["spec"] if r.startswith("Montering:")]
      if len(mont) != 1:
          fal(k, "specen har %d 'Montering:'-rader" % len(mont))
      elif k in MONTERAS:
          if "krävs inte" in mont[0] or "krävs, verktygsfri" not in mont[0]:
              fal(k, "tunnan levereras som lösa paneler men specen säger %r"
                     % mont[0])
          if "monter" not in " ".join(b for _, b in p["faq"]).lower():
              fal(k, "ingen vanlig fråga förklarar monteringen")
      else:
          if "krävs inte" not in mont[0]:
              fal(k, "tunnan är hel men specen säger %r" % mont[0])

      # 3. ☠️ BATTERITYPEN — rätt typ krävs, FEL typ förbjuds.
      typ = BATTERI.get(k)
      batterirad = [r for r in p["spec"] if r.startswith("Batterier:")]
      if typ:
          if not batterirad:
              fal(k, "specen saknar 'Batterier:'-raden")
          elif "4 × %s" % typ not in batterirad[0]:
              fal(k, "batteriraden säger %r men källan säger 4 × %s"
                     % (batterirad[0], typ))
          elif "ingår inte" not in batterirad[0]:
              fal(k, "batteriraden säger inte att batterierna INTE ingår")
          fel_typ = "D" if typ == "AA" else "AA"
          if re.search(r"\b(4 × %s|%s-batteri)" % (fel_typ, fel_typ),
                       utan_lankar):
              fal(k, "nämner %s-batterier i sin EGEN text — den tar %s"
                     % (fel_typ, typ))
      else:
          if batterirad:
              fal(k, "har en 'Batterier:'-rad trots att källan inte anger "
                     "batteristorlek för den här tunnan")

      # 4. ☠️ DOFTBLOCKET INGÅR INTE (runda 52:s sandlådefel).
      if "Luktfilter:" in spectext or "doftblock" in spectext.lower():
          if not any(r.startswith("Luktfilter:") and "ingår" in r
                     for r in p["spec"]):
              fal(k, "nämner luktfilter men saknar raden 'Luktfilter: … ingår'")
          hall = [r for r in p["spec"] if r.startswith("Hållare för doftblock:")]
          if not hall:
              fal(k, "nämner doftblock men saknar hållarraden")
          elif "ingår inte" not in hall[0]:
              fal(k, "doftblockets rad säger inte att blocket INTE ingår")

      # 5. ☠️ VOLYMEN — familjens enda jämförelseaxel.
      egen = "%d liter" % VOLYM[k]
      for var, txt in (("namnet", p["name"]), ("titeln", p["title"]),
                       ("metan", p["meta"])):
          if str(VOLYM[k]) not in txt:
              fal(k, "%s bär inte tunnans volym (%d)" % (var, VOLYM[k]))
      if not any(r == "Volym: " + egen for r in p["spec"]):
          fal(k, "specen saknar raden 'Volym: %s'" % egen)
      for annan_k, annan in VOLYM.items():
          if annan_k == k:
              continue
          if re.search(r"\b%d liter\b" % annan, utan_lankar):
              fal(k, "nämner %d liter — det är %s:s volym, och den hör hemma "
                     "i en LÄNK till den sidan" % (annan, annan_k))

      # 5b. ☠️ ENHETSLÖSA JÄMFÖRELSETAL. `TAL_RE` kräver en enhet, så
      #     "7,8 kg mot 3–5" smiter förbi hela den härledda talgrinden —
      #     uppmätt i den här rundan, i en ingress linten annars godkände.
      #     Ett intervall direkt efter ordet "mot" är alltid en jämförelse
      #     med ANDRA produkter, och deras tal hör hemma i en länk.
      for m in re.findall(r"mot\s+(\d+(?:,\d+)?\s*(?:–|-|till)\s*\d+(?:,\d+)?)"
                          r"(?!\s*(?:cm|kg|liter|%|°))", utan_lankar):
          fal(k, "enhetslöst jämförelsetal %r — andra produkters siffror hör "
                 "hemma i en LÄNK till de sidorna" % m)

      # 6. ☠️ Tal som är utelämnade MED FLIT.
      for t in UTELAMNAT.get(k, []):
          if t in tal_i(utan_lankar) | tal_i(spectext) | tal_i(p["meta"]) \
                  | tal_i(p["title"]) | tal_i(p["name"]):
              fal(k, "talet %s är utelämnat med flit — källan motsäger sig "
                     "själv om det (se STEG1.md)" % t)

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
      # ☠️ Innerhinken är rundans skiljelinje: tre tunnor har en, två säger
      #    uttryckligen att de INTE har det. En prosa som lovar en hink där
      #    specen säger nej är samma fel som runda 52:s sandlåda.
      NEKANDE = ("nej", "ingen", "inget", "inga", "saknas", "-")
      belagg = [r for r in p["spec"]
                if r.split(":", 1)[-1].strip().lower().split(",")[0] not in NEKANDE]
      pastatt = " ".join(belagg).lower()
      prosa_falt = ([p["ingress"]] + list(p["eg"]) + list(p["villkor"][1])
                    + list(p["skotsel"]) + [b for _, b in p["faq"]])
      prosa = strip_taggar(re.sub(r"<a\b[^>]*>.*?</a>", " ",
                                  " ".join(prosa_falt))).lower()
      prosa = " ".join(m for m in re.split(r"(?<=[.!?])\s+", prosa)
                       if not m.rstrip().endswith("?"))
      # Bara PÅSTÅENDEN räknas — "ingen innerhink" är en nekning.
      for ord_, nyckel in (("påshållare", "påshållare"),
                           ("kolfiber", "luktfilter"),
                           ("fjärilslock", "locktyp")):
          if ord_ in prosa and nyckel not in pastatt:
              fal(k, "påstår %s som inte står i specen" % ord_)
      if re.search(r"(?<!ingen )(?<!utan )innerhink", prosa) \
              and "innerhink" not in pastatt:
          fal(k, "påstår innerhink som inte står i specen")

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
