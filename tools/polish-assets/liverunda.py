# -*- coding: utf-8 -*-
"""Steg 14:s live-grind — delad av alla rundor, aldrig kopierad.

☠️ SKÄLET ÄR HUSETS VANLIGASTE BUGG, OCH DEN HAR REDAN SLAGIT TILL HÄR.
   Runda 127:s live-grind var 219 rader egna kopior av källgrindens regler —
   en TVILLING som glider isär, precis som `SHIP_AXIS_RE`, `EU_TULL_CODES`
   och `mapWithConcurrency`. Runda 128 och 129 bantade filen till en hämtare,
   men lämnade den kvar som en KOPIA per runda, och kopiorna hann redan driva:

   | runda | rader | `GR.sjalvtest()` |
   |---|--:|---|
   | 125 | 187 | — |
   | 126 | 220 | — |
   | 127 | 219 | — |
   | 128 | 106 | **körs** |
   | 129 |  59 | **tappad** |

   Runda 129 tappade alltså rundans EGEN grindsjälvtest utan att någon såg
   det — samma tysta bortfall som `kortbygge.mjuka` (död kod i nio rundor)
   och `kortrunda.kontroll`s måttrad (falsklarm i nio rundor). Reglerna bor
   i `grind.granska(pid, html, live=True)`; ORDNINGEN att köra dem bor här.

⚠️ HÄMTNINGEN MÅSTE CACHE-BUSTA. ISR-cachen ligger en timme, så en vanlig
   hämtning direkt efter publiceringen serverar UTKASTET — och det ser ut
   precis som en trasig sida. Runda 60 fällde åtta korrekta sidor på det.
   `G.hamta_isr` lägger på `?cb=`, hämtar två gånger OCH väntar ut ett
   `x-vercel-cache: STALE` (två räcker inte alltid — mätt 2026-09-11).

☠️ KORTGRINDEN (`G.kortfel`) KÖRS HÄR. Klart-kriteriet "minst ett eget
   Fyndplats-kort i galleriet" stod i runbooken men i ingen kod, och steget
   glömdes i åtta rundor i rad (~62 publicerade sidor). Leonard hittade det,
   inte en grind. Steg 14 är sista steget före "klar".

☠️ TVÄTTEN LIGGER FÖRE REGLERNA, inte inuti dem. `grindar.synlig_meningstext`
   läser `<script>`, så hela React-payloaden räknas annars som kundtext —
   runda 128 mätte 2 558 fel på nio korrekta sidor, varenda ett ur butikens
   egen chrome. Tvätten är BUTIKENS, alltså live-lägets; källgrinden ska inte
   veta hur butiken renderar. Och den bor i `grindar.butikstvatt`, aldrig som
   en egen kopia: live-grindens EGEN tvätt var runda 121:s farligaste
   tvilling — 12 fel på 8 korrekta sidor.
"""
import grindar as G

BAS = "https://www.fyndplats.se/produkt/"


def sjalvtester(GR):
    """Båda självtesterna, i en och samma utskrift.

    ☠️ Rundans EGEN (`GR.sjalvtest`) körs när den finns. Runda 128 körde den,
       129 tappade den, och ingen märkte något — därför är anropet villkorat
       på förekomst i stället för att varje runda ska minnas att skriva det.
       En runda vars grindsjälvtest bor i `mutation.py` kör det steget för sig.
    """
    fel = []
    egen = getattr(GR, "sjalvtest", None)
    if egen is not None:
        svar = egen()
        # ☠️ KONTRAKTET ÄR `(fel, antal)`. Runda 134 returnerade bara ANTALET
        #    fel och live-grinden dog på `cannot unpack non-iterable int` —
        #    ett högljutt fel, men ett som inte sa vad som var fel. En runda
        #    som i stället returnerat en tvåtupel av fel TYP hade sluppit
        #    igenom och rapporterat skräp. Kontrollen bor här, i den delade
        #    modulen, av samma skäl som reglerna gör det.
        if (not isinstance(svar, tuple) or len(svar) != 2
                or not isinstance(svar[0], (list, tuple))
                or not isinstance(svar[1], int)):
            raise SystemExit(
                "grind.sjalvtest() ska returnera (fel-lista, antal fall) — "
                "fick %r. Rundans självtest kördes ALLTSÅ INTE." % (svar,))
        rfel, rantal = svar
        print("grind.sjalvtest():     %d fall, %d fel" % (rantal, len(rfel)))
        fel += ["SJÄLVTEST(runda): " + f for f in rfel]
    else:
        print("grind.sjalvtest():     saknas — rundans grind självtestas i mutation.py")
    gfel, gantal = G._sjalvtest()
    print("grindar._sjalvtest():  %d fall, %d fel" % (gantal, len(gfel)))
    fel += ["SJÄLVTEST(delad): " + f for f in gfel]
    for f in fel:
        print("   ☠️", f)
    return fel


# ☠️ KONTROLLSIDAN. En publicerad produkt i samma familj som rundan ALDRIG
#    rört. Allt grinden hittar på den är per definition BUTIKENS text —
#    header, ribbon, prisblock, rekommendationsrad, bloggänkar, footer — och
#    får därför inte fällas på våra sidor.
#
#    Runbokens regel (Steg 12, fynd 4): runda 90:s första live-svep fällde
#    7 av 7 korrekta sidor på tre fynd som alla fanns ordagrant på en sida
#    rundan aldrig rört. Runda 134 mätte samma sak en gång till: butikens
#    bloggrubrik "Klösträd & kattträd" bär tre t i rad och fälldes av
#    rundans trekonsonantsgrind — ett ÄKTA stavfel, men i BUTIKSREPOT, inte
#    i vår text. Grinden hade rätt om ordet och fel om vems det var.
#
#    ⚠️ Subtraktionen är på EXAKT STRÄNG, aldrig en heuristik. Butikens
#       chrome är byte-identisk mellan sidor; det som skiljer är vår text.
KONTROLL = "klostrad-200-cm-sex-nivaer"


def kontrollfynd(GR, T, pid, bas=BAS, slug=KONTROLL):
    """Grindens träffar på en sida rundan aldrig rört = butikens egna.

    ☠️ TVÅ HÅL SOM BÅDA HADE GJORT SUBTRAKTIONEN FARLIGARE ÄN INGEN ALLS,
       och båda satt i den första versionen av den här funktionen:

    1. `granska(pid, …, live=True)` provar `egna + NAMN + TITEL + META +
       SOKORD` — alltså RUNDANS EGNA FÄLT, oavsett vems HTML den fick. Ett
       stavfel i vår egen titel hade därför fyrat på kontrollsidan också,
       hamnat i `butikens` och dragits bort från VÅR sida. Grinden hade
       tvättat bort vårt eget fel och kallat det butikens. Därför körs
       grinden EN GÅNG TILL på tom HTML: det som fyrar då kommer ur
       rundans fält och får aldrig ingå i subtraktionen.

    2. `kortfel` hör inte hemma här över huvud taget. Den frågar om VÅR
       sida bär ett eget Fyndplats-kort, och runda 121-128 publicerade
       ~62 sidor utan ett — så en kontrollsida ur den perioden hade fällt
       `SAKNAR EGET KORT`, subtraherat det, och tystat exakt den grind som
       byggdes för att det steget glömdes åtta rundor i rad. Kortgrinden
       körs bara på våra sidor, aldrig på kontrollen.

    ⚠️ Subtraktionen är på EXAKT STRÄNG, aldrig en heuristik. Butikens
       chrome är byte-identisk mellan sidor; det som skiljer är vår text.
    """
    try:
        html, _ = G.hamta_isr(bas + slug)
    except SystemExit as e:
        # ☠️ En ohämtad kontrollsida får INTE tyst bli en tom mängd — då
        #    rapporteras butikens chrome som våra fel igen. Hellre rött.
        raise SystemExit("kontrollsidan %s gick inte att hämta: %s" % (slug, e))
    pa_sidan = set(GR.granska(pid, html=G.butikstvatt(html), live=True))
    ur_egna_falt = set(GR.granska(pid, html="", live=True))
    return pa_sidan - ur_egna_falt


def kor(GR, T, pids=None, bas=BAS, kontroll=KONTROLL):
    """Hämtar varje publicerad sida och grindar den. Returnerar antal fel."""
    total = len(sjalvtester(GR))
    pids = pids or list(T.SLUG)
    butikens = kontrollfynd(GR, T, pids[0], bas, kontroll) if kontroll else set()
    print("kontrollsida %-28s %d träffar som är BUTIKENS"
          % (kontroll or "—", len(butikens)))
    for f in sorted(butikens):
        print("     (butikens) %s" % f)
    print()
    for pid in pids:
        slug = T.SLUG[pid]
        try:
            html, huvuden = G.hamta_isr(bas + slug)
        except SystemExit as e:
            # ☠️ En ohämtad sida räknas som FEL, aldrig som ren. Att svälja
            #    den vore samma tomma läsare som /api/tracking-events blev.
            print("%-9s %-48s HÄMTNING FÖLL: %s" % (pid, slug, e))
            total += 1
            continue
        cache = huvuden.get("x-vercel-cache", "?")
        # ☠️ KORTGRINDEN SUBTRAHERAS ALDRIG — se `kontrollfynd`.
        fel = G.kortfel(html) + [
            f for f in GR.granska(pid, html=G.butikstvatt(html), live=True)
            if f not in butikens]
        total += len(fel)
        print("%-9s %-48s %-6s %d fel" % (pid, slug, cache, len(fel)))
        for f in fel:
            print("     -", f)
    print()
    print("SUMMA: %d sidor, %d fel" % (len(pids), total))
    return total
