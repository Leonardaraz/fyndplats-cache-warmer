# -*- coding: utf-8 -*-
"""Runda 127 Steg 14 — grindar den PUBLICERADE sidan, inte utkastet.

Alla åtta publicerades. Skillnaden mot källgrinden (`grind.py`) är inte
vilka regler som gäller utan VAD de läser: källgrinden läser `T.bygg(pid)`,
den här läser HTML:en butiken faktiskt levererar — med rekommendations-
raden, grannarnas namn i två serialiseringar och React-payloaden.

☠️ SEX AV ÅTTA ÄR NÄSTAN IDENTISKA HURTSAR, och det är rundans farligaste
   egenskap. Fem nya trelådors plus den publicerade `66c9f2b5` konkurrerar
   om samma sökord, och rekommendationsraden lägger grannarnas namn i vår
   HTML. Varje negativ grind nedan MÅSTE därför köras på `egna` — grannens
   "två lådor" i en produktkarusell är inte vårt fel.

☠️ HÖJDGRINDEN ÄR NEGATIV BARA INOM BREDDGRUPPEN, precis som källgrindens.
   39 cm breda finns i 59, 60 och 67 cm höjd; 37 cm breda i 60 och 67,5.
   En grind som förbjöd varje främmande höjd hade fällt korslänkarna, som
   MED FLIT nämner syskonets mått.

☠️ TOTALLASTGRINDEN ÄR NEGATIV FÖR `521aec3c`. Källans 40 kg går inte ihop
   med 2 × 5 kg per låda (`STEG3-5.md` §2), så sidan skriver medvetet inget
   totaltal — och live-grinden ska fälla om ett dyker upp.

☠️ LÅDSPÄRREN OCH SKRIVAREN är förbjudna i BÅDA riktningarna: de ärvs från
   `GR.FORBJUDET` och gäller därför ordagrant lika på live-sidan.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import grind as GR           # noqa: E402
import texter as T           # noqa: E402

FORBJUDET = [m for m, _ in GR.FORBJUDET if m is not G.ARTNR] + [G.ARTNR]
ETIKETT = {m: e for m, e in GR.FORBJUDET}

# ☠️ TVÄTTEN BOR I `grindar.butikstvatt`, INTE HÄR (uppgift #452).
_tvatta = G.butikstvatt


def _lador(pid, egna, fel):
    """Identisk med källgrindens — positiv på rätt antal, negativ på de andra,
    med samma två undantag (delmängd respektive syskonreferens)."""
    if pid in GR.LADOR:
        n = GR.LADOR[pid]
        if not (re.search(rf"{GR._tal(n)}[^.!?]{{0,30}}\blåd", egna, re.I)
                or re.search(rf"\blådor\b[^.!?]{{0,15}}{GR._tal(n)}", egna, re.I)):
            fel.append(f"LÅDANTALET {n} står inte på den live sidan")
        DEL_EFTER = r"(?:grunda|djupa|små|stora|breda|låsbara|lika\s+djupa)\s+"
        SYSKONORD = r"\b(?:systern?|syster\w*|modellen|varianten|serien)\b"
        for fel_n in sorted(set(GR.LADOR.values())):
            if fel_n == n:
                continue
            for m in re.finditer(rf"{GR._tal(fel_n)}\s+({DEL_EFTER})?låd",
                                 egna, re.I):
                if m.group(1):
                    continue
                a = max(egna.rfind(".", 0, m.start()),
                        egna.rfind(":", 0, m.start()),
                        egna.rfind("?", 0, m.start()))
                if re.search(SYSKONORD, egna[a + 1:m.start()], re.I):
                    continue
                fel.append(f"FEL LÅDANTAL {fel_n} (rätt är {n}) — "
                           f"…{G.mening_kring(egna, m.start())}…")
    if pid in GR.FACK:
        n = GR.FACK[pid]
        if not re.search(rf"{GR._tal(n)}[^.!?]{{0,30}}\b(öppna\s+)?(kub)?fack",
                         egna, re.I):
            fel.append(f"FACKANTALET {n} står inte på den live sidan")


def _matten(pid, egna, fel):
    bredd, hojd = GR.BREDDGRUPP[pid]
    if not re.search(GR._matt(hojd), egna):
        fel.append(f"HÖJDEN {hojd} cm står inte på den live sidan")
    if not re.search(GR._matt(bredd), egna):
        fel.append(f"BREDDEN {bredd} cm står inte på den live sidan")
    for annat, (b, h) in GR.BREDDGRUPP.items():
        if annat == pid or b != bredd or h == hojd:
            continue
        for m in re.finditer(rf"{GR._matt(h)}\s*(cm|centimeter)", egna, re.I):
            fel.append(f"FRÄMMANDE HÖJD {h} cm ur samma breddgrupp "
                       f"(rätt är {hojd}) — …{G.mening_kring(egna, m.start())}…")


def _last(pid, egna, fel):
    per = GR.LAST_PER[pid]
    if not re.search(rf"{GR._matt(per)}\s*(kg|kilo)", egna, re.I):
        fel.append(f"LASTGRINDEN: {per} kg per enhet står inte på den live sidan")
    tot = GR.LAST_TOT[pid]
    if tot:
        if not re.search(rf"{GR._matt(tot)}\s*(kg|kilo)", egna, re.I):
            fel.append(f"LASTGRINDEN: totallasten {tot} kg står inte på sidan")
    else:
        for m in re.finditer(r"\b(totalt|sammanlagt|hela\s+hurtsen)\b", egna, re.I):
            fel.append(f"TOTALLASTGRINDEN: källans totaltal går inte ihop och "
                       f"sidan ska inte bära ett — …{G.mening_kring(egna, m.start())}…")


def _hjul(pid, egna, fel):
    for m in re.finditer(r"tippskydd\w*|femte\s+hjul\w*", egna, re.I):
        if pid not in GR.TIPPSKYDD:
            fel.append(f"TIPPSKYDDSGRINDEN: modellen har inget femte hjul — "
                       f"…{G.mening_kring(egna, m.start())}…")
    if pid in GR.TIPPSKYDD and not re.search(
            r"tippskydd\w*|femte\s+hjul\w*|hjul\s+under\s+arkivlådan", egna, re.I):
        fel.append("TIPPSKYDDSGRINDEN: modellen HAR ett femte hjul och sidan "
                   "säger det inte")
    for m in re.finditer(r"\bbroms\w*", egna, re.I):
        if pid not in GR.BROMS:
            fel.append(f"BROMSGRINDEN: modellen har inga bromsar i källan — "
                       f"…{G.mening_kring(egna, m.start())}…")


def _grepp_och_montering(pid, egna, fel):
    if pid in GR.ENDAST_HJUL:
        if not re.search(r"bara\s+hjulen|endast\s+hjulen|hjulen\s+som\s+ska",
                         egna, re.I):
            fel.append("MONTERINGSGRINDEN: bara hjulen ska monteras och sidan "
                       "säger det inte")
    elif not re.search(r"\bmonter\w*", egna, re.I):
        fel.append("MONTERINGSGRINDEN: modellen kräver montering och sidan "
                   "säger det inte")
    if pid in GR.GREPPFRI and not re.search(
            r"greppfri\w*|utan\s+handtag|släta\s+fronter", egna, re.I):
        fel.append("GREPPGRINDEN: den här har greppfri front och sidan säger "
                   "det inte")
    if pid in GR.INFALLT and not re.search(
            r"infällt?\s+handtag|handtag\s+infällt", egna, re.I):
        fel.append("GREPPGRINDEN: den här har infällt handtag och sidan säger "
                   "det inte")


def _rost(pid, egna, fel):
    """☠️ Läser mening + NÄSTA mening — kvalificeringen kan ligga i svaret på
    en FAQ-fråga (samma klass som uppgift #415)."""
    for m in re.finditer(r"\brost\w*", egna, re.I):
        mening = (G.mening_kring(egna, m.start()) + " "
                  + G.nasta_mening(egna, m.start()))
        if not re.search(r"lack|pulverlack|förzink|så\s+länge|hel\b|jack|bättra",
                         mening, re.I):
            fel.append(f"ROSTGRINDEN: okvalificerat rostpåstående — …{mening}…")


def granska(pid, html, slug):
    fel = G.flikfel(html)
    egna, kors = G.egna_meningar(html, slug, T.NAMN[pid], _tvatta)

    for m in FORBJUDET:
        for t in m.finditer(egna):
            fel.append(f"{ETIKETT.get(m, 'FÖRBJUDET')}: "
                       f"…{G.mening_kring(egna, t.start())}…")
    for m, e in GR.TONGRINDAR:
        for t in m.finditer(egna):
            fel.append(f"{e}: …{G.mening_kring(egna, t.start())}…")

    _lador(pid, egna, fel)
    _matten(pid, egna, fel)
    _last(pid, egna, fel)
    _hjul(pid, egna, fel)
    _grepp_och_montering(pid, egna, fel)
    _rost(pid, egna, fel)

    # ☠️ FÄRGGRINDEN, med `G.fargformer` — `vit\w*` matchar inte `vitt`.
    tillatna = (GR.FARG[pid] | GR.DELFARG.get(pid, set())
                | GR.SYSKONFARG.get(pid, set()))
    for f in G.FARGORD:
        if f in tillatna:
            continue
        for m in re.finditer(G.fargformer(f), egna, re.I):
            mening = G.mening_kring(egna, m.start())
            if re.search(r"kantlist|skena|krom|förzink", mening, re.I):
                continue
            fel.append(f"FÄRGORD {f!r} — uppmätt är "
                       f"{sorted(GR.FARG[pid] | GR.DELFARG.get(pid, set()))} "
                       f"— …{mening}…")

    # Namn, titel och meta ska stå på sidan.
    for falt, varde in (("namn", T.NAMN[pid]), ("titel", T.TITEL[pid])):
        if varde not in html:
            fel.append(f"{falt.upper()} saknas på sidan")
    if T.META[pid] not in html:
        fel.append("METAN saknas på sidan")

    # ☠️ Introt ska stå EXAKT en gång.
    intro = T.INTRO[pid][:60]
    n = egna.count(intro)
    if n != 1:
        fel.append(f"INTROT står {n} gånger, väntade 1")
    return fel


if __name__ == "__main__":
    import json
    d = json.load(open("skrivning.json"))
    totalt = 0
    # ☠️ Grinden prövar SIG SJÄLV innan den prövar sidorna (uppgift #452).
    sjalvfel, antal = G._sjalvtest()
    print(f"grindar._sjalvtest(): {antal} fall, {len(sjalvfel)} fel")
    for f in sjalvfel + G.tvillingsvep():
        print("  ☠️ GRIND:", f)
        totalt += 1
    for pid, v in d.items():
        url = f"https://www.fyndplats.se/produkt/{v['slug']}"
        try:
            html, _ = G.hamta_isr(url)
        except Exception as e:
            print(f"FEL  {pid}  hämtning: {e}")
            totalt += 1
            continue
        fel = granska(pid, html, v["slug"])
        totalt += len(fel)
        print(f"{'FEL ' if fel else 'OK  '}{pid}  {v['slug']}")
        for f in fel:
            print("      ☠️", f)
    print(f"\n{len(d)} sidor, {totalt} fel")
    sys.exit(1 if totalt else 0)
