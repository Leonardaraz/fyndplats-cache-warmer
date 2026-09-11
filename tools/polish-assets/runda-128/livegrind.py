# -*- coding: utf-8 -*-
"""Runda 128 Steg 14 — grindar den PUBLICERADE sidan, inte utkastet.

☠️ DEN HÄR FILEN ÄR AVSIKTLIGT TUNN. Runda 127:s live-grind var 219 rader
   med egna kopior av `_lador`, `_matten`, `_last`, `_hjul` och `_rost` —
   alltså en TVILLING till källgrinden. Husets vanligaste bugg är just att
   tvillingar glider isär: `SHIP_AXIS_RE` två gånger på två veckor,
   `EU_TULL_CODES`, `mapWithConcurrency`, och live-grindens egen TVÄTT som
   gav 12 fel på 8 korrekta sidor i runda 121.

   Reglerna bor därför i `grind.granska(pid, html, live=True)`. Den här filen
   hämtar HTML:en och skickar in den. Skillnaden mellan käll- och live-läget
   är två rader i grind.py, inte 219 här.

⚠️ HÄMTNINGEN MÅSTE CACHE-BUSTA. ISR-cachen ligger en timme, så en vanlig
   hämtning direkt efter publiceringen serverar UTKASTET — och det ser ut
   precis som en trasig sida. Runda 60 fällde åtta korrekta sidor på det.
   `G.hamta_isr` lägger på `?cb=`.

⚠️ GRANNSTRYKNINGEN GÖRS I `grind.granska` via `G.egna_meningar`. Sidan bär
   rekommendationsraden med grannarnas namn i två serialiseringar plus
   React-payloaden; utan strykningen blir grannens "16 lådor" vårt fel.
   Sex av rundans nio är verktygsvagnar som konkurrerar om samma sökord.

☠️ KORTGRINDEN (`G.kortfel`) KÖRS HÄR, och det är hela poängen med att den
   finns. Klart-kriteriet "minst ett eget Fyndplats-kort i galleriet" stod i
   runbooken men i ingen kod, och steget glömdes i ÅTTA rundor i rad — runda
   121-128, ~62 publicerade sidor. Leonard hittade det, inte en grind.
   Steg 14 är sista steget före "klar", alltså rätt ställe att fälla på.
"""
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import grind as GR           # noqa: E402
import texter as T           # noqa: E402

BAS = "https://www.fyndplats.se/produkt/"


def granska_live(pid, html):
    """☠️ TVÄTTEN LIGGER HÄR, FÖRE reglerna — inte inuti dem.

    `grindar.synlig_meningstext` läser `<script>` (uppgift #413), så hela
    React-payloaden räknas som synlig kundtext. Otvättat gav rundans nio
    sidor **2 558 fel**, varenda ett ur butikens egen chrome: `★★★★★` i
    betygsraden och `Visa produkt →` i rekommendationskorten.

    Tvätten är butikens, alltså live-grindens — reglerna i `grind.granska`
    ska inte veta något om hur butiken renderar. Och den bor i
    `grindar.butikstvatt`, aldrig som en egen kopia här: live-grindens EGEN
    tvätt var runda 121:s farligaste tvilling (12 fel på 8 korrekta sidor).
    """
    return GR.granska(pid, html=G.butikstvatt(html), live=True)


if __name__ == "__main__":
    # Grindens egna grindar körs först — en grind utan självtest är ingen grind.
    sjalvfel, antal = GR.sjalvtest()
    print(f"grind.sjalvtest(): {antal} fall, {len(sjalvfel)} fel")
    for f in sjalvfel:
        print("  ☠️", f)
    gfel, gantal = G._sjalvtest()
    print(f"grindar._sjalvtest(): {gantal} fall, {len(gfel)} fel")
    for f in gfel:
        print("  ☠️", f)

    totalt = len(sjalvfel) + len(gfel)
    hamtade = 0
    for pid in T.NAMN:
        slug = T.SLUG[pid]
        try:
            # ☠️ `hamta_isr` returnerar (html, headers) — en TUPEL. Första
            #    utkastet gjorde `html = G.hamta_isr(...)` och sedan
            #    `len(html)`, vilket blev 2 utan att något kastade. Nio
            #    korrekta sidor rapporterades som trasiga. Packa upp den.
            html, huvuden = G.hamta_isr(BAS + slug)
        except Exception as e:                                  # noqa: BLE001
            print(f"HÄMTFEL {pid}  {slug}: {e}")
            totalt += 1
            continue
        hamtade += 1
        cache = huvuden.get("x-vercel-cache", "?")
        alder = huvuden.get("age", "?")
        # ☠️ En tom eller 404-sida ser ut som en grön sida för varje NEGATIV
        #    grind. Kräv att produktens eget namn faktiskt står i HTML:en.
        if T.NAMN[pid].split("–")[0].strip()[:25] not in html:
            print(f"FEL {pid}  {slug}")
            print(f"      ☠️ SIDAN BÄR INTE PRODUKTENS NAMN — hämtade "
                  f"{len(html)} tecken, trolig 404 eller cachad gammal sida")
            totalt += 1
            continue
        # ☠️ KORTGRINDEN LÄSER RÅ HTML, före `butikstvatt` — tvätten stryker
        #    bildattributen, och alt-texten ÄR det kortgrinden granskar. Kördes
        #    den efter tvätten vore den en tom läsare som alltid ser grön ut.
        fel = G.kortfel(html) + granska_live(pid, html)
        print(("FEL " if fel else "OK  ")
              + f"{pid}  {slug:38} {len(html):7d} tecken  "
              + f"{cache} age={alder}")
        for f in fel:
            print("      ☠️", f)
        totalt += len(fel)

    print(f"\n{hamtade} sidor hämtade, {totalt} fel totalt")
    sys.exit(1 if totalt else 0)
