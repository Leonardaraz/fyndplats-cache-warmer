# -*- coding: utf-8 -*-
"""Runda 81 — grinden mot rundans egna texter, före något skrivs till Wix.

☠️ RUNDANS EGEN GRIND: `ANTAL`. Fem av åtta produkter ser ut som tvåpack i
   källans titel. Tre av dem är EN dubbelstol (`Lieferumfang: 1 x`). Grinden
   läser fältet `antal` och fäller varje text som säger fel sak om det —
   "2-pack" på en ensam stol, "två sitsar" på ett tvåpack. Det är den enda
   grind i rundan som skyddar mot rundans egen anledning att finnas.

☠️ HÄRLEDDA TAL. Varje tal i brödtexten måste stå i PRODUKTENS EGEN spec.
   Risken är stor här: åtta stolar med snarlika sitthöjder (37, 42, 44, 44,
   45, 46) och tre maxlaster som ligger nära varandra.

☠️ KORSLÄNKSUNDANTAGET GÄLLER BARA INUTI `<a>`, och bara mot tal som är
   LÄSTA på den länkade sidan. Ett tal som råkar stå i VÅR spec är inget
   belägg för någon annans sida.

☠️ INGEN AV DE ÅTTA HAR GASLYFT. Ordet är förbjudet — runda 80:s villkorstext
   bar det, och en kopierad formulering hade tagit med sig påståendet.
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
EXTERN_TAL = {"91 cm", "159 kg", "130 kg"}

NEKAD_RE = re.compile(r"(?:saknar|utan|ingen|inget|inga|inte)(?:\s+\w+){0,3}\s+"
                      r"(?:fotstöd|nackstöd|mugghållare|kylficka|armstöd|fottass\w*)", re.I)

# ☠️ ANTALSORD, uppdelade på vad de PÅSTÅR. Ett ord i vänsterkolumnen säger
#    "det är flera lösa stolar"; ett i högerkolumnen säger "det är en möbel
#    med två sitsar". Ingen produkt får bära båda sorterna.
FLERA_RE = re.compile(r"(2-pack|två stolar|båda stolarna|per stol|2 stolar|"
                      r"tvåpack|var sin stol)", re.I)
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

      # ── ☠️ RUNDANS EGEN GRIND: antalet ──────────────────────────────────
      # En FRÅGA är inget påstående, och en NEKNING är det inte heller.
      pastar_txt = " ".join(m for m in re.split(r"(?<=[.!?])\s+", utan_lankar)
                            if not m.rstrip().endswith("?"))
      pastar = " ".join([p["name"], p["title"], p["meta"], pastar_txt])
      pastar = re.sub(r"(?:inte|inga|inget|inga)(?:\s+\w+){0,3}\s+"
                      r"(?:två lösa stolar|två stolar)", " ", pastar, flags=re.I)
      if p["antal"] == 1:
          for m in FLERA_RE.findall(pastar):
              fal(k, "säger %r om en ENSAM stol (antal=1)" % m)
          if not any(r.startswith("Antal sitsar:") for r in p["spec"]):
              fal(k, "spec-tabellen saknar raden 'Antal sitsar:'")
      else:
          for m in EN_MOBEL_RE.findall(pastar):
              fal(k, "säger %r om ett tvåpack (antal=2)" % m)
          if not any(r.startswith("Antal:") for r in p["spec"]):
              fal(k, "spec-tabellen saknar raden 'Antal:'")
          if not re.search(r"^Antal: %d stolar$" % p["antal"],
                           "\n".join(p["spec"]), re.M):
              fal(k, "spec-raden 'Antal:' säger inte %d stolar" % p["antal"])

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
      for krav in ("Maxlast:", "Montering:", "Ingår:", "Vikt:"):
          if not any(r.startswith(krav) for r in p["spec"]):
              fal(k, "spec-tabellen saknar raden %r" % krav)

      # ── utrustningsgrindar, lästa ur SPECEN och inte ur prosan ───────────
      NEKANDE_SPEC = ("nej", "ingen", "inget", "inga", "saknas", "-")
      belagg = [r for r in p["spec"]
                if r.split(":", 1)[-1].strip().lower() not in NEKANDE_SPEC]
      pastatt = " ".join(belagg).lower()
      prosa_falt = ([p["ingress"]] + list(p["eg"]) + list(p["villkor"][1])
                    + list(p["skotsel"]) + [b for _, b in p["faq"]])
      prosa_txt = strip_taggar(re.sub(r"<a\b[^>]*>.*?</a>", " ",
                                      " ".join(prosa_falt)))
      prosa_txt = " ".join(m for m in re.split(r"(?<=[.!?])\s+", prosa_txt)
                           if not m.rstrip().endswith("?"))
      prosa = NEKAD_RE.sub(" ", prosa_txt.lower())
      for ord_, nyckel in (("fotstöd", "fotstöd"), ("nackstöd", "nackstöd"),
                           ("mugghållare", "mugghållare"), ("kylficka", "kylficka"),
                           ("fottass", "fottass")):
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
    print("%-9s %-42s %-30s %-3s %s" % ("id8", "slug", "SKU", "st", "html"))
    for p in texter.PRODUKTER:
        print("%-9s %-42s %-30s %-3d %d" % (p["kort"], p["slug"],
              "FP-" + sku_bas(p["slug"]), p["antal"], len(texter.bygg(p))))
    print()
    for f in FEL:
        print("FEL:", f)
    print("\n%d fel i %d produkter" % (len(FEL), len(texter.PRODUKTER)))
    raise SystemExit(1 if FEL else 0)
