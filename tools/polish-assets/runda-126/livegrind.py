# -*- coding: utf-8 -*-
"""Runda 126 Steg 14 — grindar den PUBLICERADE sidan, inte utkastet.

Alla sex publicerades. Skillnaden mot källgrinden (`grind.py`) är inte
vilka regler som gäller utan VAD de läser: källgrinden läser `T.bygg(pid)`,
den här läser HTML:en butiken faktiskt levererar — med rekommendations-
raden, grannarnas namn i två serialiseringar och React-payloaden i
`<script>`.

☠️ FÄRGGRINDEN SLÄPPER IN SYSKONETS FÄRG, precis som källgrinden gör.
   Sågbockarna och arbetsbockarna korshänvisar till varandra i klartext
   ("den orange syskonmodellen"), och det är sidans EGNA mening, inte en
   ankartext — `egna_meningar` kan alltså inte skilja ut den. En grind som
   förbjöd varje främmande färgord hade fällt två korrekta sidor.

   Den farliga riktningen är stängd på annat håll: `grind.granska` kräver
   att NAMN, TITEL och META bär exakt produktens egen färg och ingen
   annans, och namnet/titeln/metan kontrolleras nedan mot sidan ordagrant.

☠️ PARLASTGRINDEN MÅSTE FÖLJA MED HIT, och den är rundans farligaste tal.
   Leverantörens eget produktnamn säljer PARETS summa (1 160 kg) som om
   den vore per bock. Grinden kräver båda talen med rätt ord intill: `per
   bock` vid det ena, `paret`/`båda`/`tillsammans` vid det andra.

☠️ HÖJDLÄGESGRINDEN ÄR NEGATIV mot familjens andra tal. Fyra, sex och sju
   lägen i samma runda på bockar som ser likadana ut — undantagen måste
   vara identiska med källgrindens, annars fäller den korrekta sidor.
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


def _last(pid, egna, fel):
    """Parlast eller enkellast — samma två besked som källgrinden."""
    if pid in GR.PARLAST:
        per, par = GR.PARLAST[pid]
        p_per = per.replace(" ", r"\s?")
        p_par = par.replace(" ", r"\s?")
        if not re.search(rf"(?<![\d,]){p_per}\s*(kg|kilo)[^.!?]{{0,40}}\bper\s+bock"
                         rf"|\bper\s+bock[^.!?]{{0,40}}(?<![\d,]){p_per}\s*(kg|kilo)",
                         egna, re.I):
            fel.append(f"PARLASTGRINDEN: {per} kg PER BOCK står inte utskrivet")
        if not re.search(rf"(?<![\d,]){p_par}\s*(kg|kilo)[^.!?]{{0,60}}"
                         rf"\b(paret|båda|tillsammans)\b"
                         rf"|\b(paret|båda|tillsammans)\b[^.!?]{{0,60}}"
                         rf"(?<![\d,]){p_par}\s*(kg|kilo)", egna, re.I):
            fel.append(f"PARLASTGRINDEN: {par} kg är PARETS summa och sidan "
                       f"säger inte att det är det")
    elif pid in GR.ENKELLAST:
        n = GR.ENKELLAST[pid]
        if not re.search(rf"\b(tål|bär)\b[^.!?]{{0,80}}(?<![\d,]){n}\s*(kg|kilo)",
                         egna, re.I):
            fel.append(f"LASTGRINDEN: sidan säger inte att den tål {n} kg")


def _lagen(pid, egna, fel):
    """Identisk med källgrindens — positiv på rätt tal, negativ på de andra."""
    if pid not in GR.LAGEN:
        return
    n = GR.LAGEN[pid]
    if not re.search(rf"{GR._tal(n)}[^.!?]{{0,30}}\b(höjd)?läge", egna, re.I):
        fel.append(f"HÖJDLÄGESANTALET {n} står inte på den live sidan")
    for fel_n in sorted(set(GR.LAGEN.values())):
        if fel_n == n:
            continue
        for m in re.finditer(rf"{GR._tal(fel_n)}\s+(?:höjd)?läge", egna, re.I):
            fel.append(f"FEL ANTAL HÖJDLÄGEN {fel_n} (rätt är {n}) — "
                       f"…{G.mening_kring(egna, m.start())}…")


def _vikning(pid, egna, fel):
    if pid in GR.HOPFALLBAR:
        if not re.search(r"\bhopfäll|\bviks?\b|\bvik\s+ihop|\bfäll(er|s)?\s+ihop",
                         egna, re.I):
            fel.append("HOPFÄLLNINGSGRINDEN: modellen viks ihop och sidan säger "
                       "det inte")
    if pid in GR.FAST:
        for m in re.finditer(r"\bhopfällbar\w*|\bviks?\s+ihop|\bfälls?\s+ihop"
                             r"|\bhopfälld\w*", egna, re.I):
            mening = G.mening_kring(egna, m.start())
            if re.search(r"\bnej\b|\binte\b|fast\s+bänk", mening, re.I):
                continue
            fel.append(f"HOPFÄLLNINGSGRINDEN: den här viks INTE ihop — …{mening}…")


def _rost(pid, egna, fel):
    """☠️ Läser mening + NÄSTA mening — kvalificeringen kan ligga i svaret
    på en FAQ-fråga (samma klass som uppgift #415)."""
    if pid == "9e9c78b9":
        if not re.search(r"lack\w*[^.!?]{0,60}\b(hel|intakt|så\s+länge)\b"
                         r"|\b(hel|intakt|så\s+länge)\b[^.!?]{0,60}lack\w*",
                         egna, re.I):
            fel.append("ROSTGRINDEN: sidan måste säga att lacken skyddar SÅ LÄNGE "
                       "DEN ÄR HEL, inte bara undvika ordet rostfri")
    for m in re.finditer(r"\brost\w*", egna, re.I):
        mening = G.mening_kring(egna, m.start()) + " " + G.nasta_mening(egna, m.start())
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

    # ☠️ TVÅPACKSGRINDEN — sidan måste säga att man får TVÅ.
    if pid in GR.PAR:
        if not re.search(r"\b(två|2)\s+(sågbockar|arbetsbockar|stödbockar|bockar)\b"
                         r"|\bparet\b|\btvåpack\b|\bbåda\s+två\b", egna, re.I):
            fel.append("TVÅPACKSGRINDEN: sidan säger inte att man får två bockar")

    _last(pid, egna, fel)
    _lagen(pid, egna, fel)
    _vikning(pid, egna, fel)
    _rost(pid, egna, fel)

    # Monteringsgrinden, positiv åt båda hållen.
    if pid in GR.UTAN_MONTERING and not re.search(
            r"monter\w*[^.!?]{0,20}\b(krävs\s+inte|behövs\s+inte|ingen)\b"
            r"|\b(kräver|behöver)\s+ingen\s+monter\w*", egna, re.I):
        fel.append("MONTERINGSGRINDEN: den här kräver ingen montering och sidan "
                   "säger det inte")
    if pid in GR.MED_MONTERING and not re.search(
            r"\b(kräver|behöver)\s+monter\w*|monter\w*\s*:?\s*krävs", egna, re.I):
        fel.append("MONTERINGSGRINDEN: den här kräver montering och sidan säger "
                   "det inte")

    # ☠️ KAPSÅGSNOTEN, bara 4a8e7f21.
    if pid == "4a8e7f21":
        if not re.search(r"\b4\s*(cm|centimeter)[^.!?]{0,60}\b(fäll|vik)"
                         r"|\b(fäll|vik)\w*[^.!?]{0,60}\b4\s*(cm|centimeter)",
                         egna, re.I):
            fel.append("KAPSÅGSNOTEN: varningen om att dra ut rullbasen ~4 cm före "
                       "hopfällning saknas")
        if not re.search(r"ingår\s+(inte|ej)|medföljer\s+inte|\bNej\b", egna, re.I):
            fel.append("TILLBEHÖRSGRINDEN: sågen på bilderna ingår inte och sidan "
                       "säger det inte")

    # Tillbehörsgrinden på sågbocken: bilden visar såg och virke.
    if pid == "17e683e0":
        if not re.search(r"(såg\w*|virke|verktyg\w*)[^.!?]{0,90}"
                         r"(ingår\s+(inte|ej)|medföljer\s+inte|säljs\s+separat)"
                         r"|ingår[^.!?]{0,40}\bbilder\w*\s*\?\s*Nej\b", egna, re.I):
            fel.append("TILLBEHÖRSGRINDEN: bilden visar såg och virke som inte "
                       "ingår, och sidan säger det inte")

    # ☠️ FÄRGGRINDEN, med `G.fargformer` — `röd\w*` matchar inte `rött`.
    tillatna = (GR.FARG[pid] | GR.DELFARG.get(pid, set())
                | GR.SYSKONFARG.get(pid, set()))
    for f in G.FARGORD:
        if f in tillatna:
            continue
        for m in re.finditer(G.fargformer(f), egna, re.I):
            mening = G.mening_kring(egna, m.start())
            if re.search(r"slist|skena|handtag|krom|förzink", mening, re.I):
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
