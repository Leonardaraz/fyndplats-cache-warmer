#!/usr/bin/env python3
"""Filgrind för lagersaldot (`lager.tsv`) — urvalssteget, inte efterkontrollen.

☠️ VARFÖR DEN FINNS. Prisgrinden hittade den slutsålda cordfåtöljen `1877cf83`
AV EN SLUMP 2026-09-06: ingenting i arbetsgången frågade "går varan att köpa?"
innan en text skrevs. En sida för en vara ingen kan köpa är slöseri i båda
ändar — timmen som skriver den, och kunden som klickar sig fram till
"Slutsåld".

⚠️ EN PÅMINNELSE ÄR INGEN SPÄRR. Runbookens Klart-kriterium hade punkterna om
kategori och skötselflik, och 41 av 57 sidor föll ändå på dem: en checklista
som bara hjälper den som redan kommer ihåg punkten räknas som gjord utan att
vara det. Därför är det här en FIL som måste finnas, inte en rad i en runbook.
Saknas `lager.tsv` avbryter grinden; står en produkt på 0 fäller den.

☠️ Och saldot går inte att läsa härifrån — Wix-nycklarna bor i produktionen.
Det är hela poängen med formen: grinden kan inte hämta talet åt dig, så den
tvingar fram att NÅGON slog upp det och skrev ned det innan texten skrevs.
Talet är därmed också en daterad anteckning om vad som gällde vid urvalet.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/gate-lager.py
  ids.tsv    "kort  pris  kort beskrivning"  (facit för vilka produkter som ingår)
  lager.tsv  "kort  saldo"                   (saldot vid urvalet)
"""
import io, os, sys

# En rad som Aosom tillfälligt plockat ur feeden får saldo 0 och ska INTE
# poleras — men gränsen är medvetet lågt satt i övrigt. Ett ensiffrigt saldo är
# en varning, inte ett stopp: varan går att köpa, och feeden uppdateras tre
# gånger per dygn.
TUNT = 5


def main():
    if not os.path.exists("ids.tsv"):
        raise SystemExit("  [AVBRYT] ids.tsv saknas — kör från rundans katalog")
    if not os.path.exists("lager.tsv"):
        raise SystemExit(
            "  [AVBRYT] lager.tsv saknas.\n"
            "  Slå upp saldot per produkt i urvalssteget och skriv en rad per\n"
            "  produkt:  <kort>\\t<saldo>\n"
            "  Grinden kan inte hämta talet åt dig — Wix-nycklarna bor i\n"
            "  produktionen, och det är just därför filen krävs."
        )

    korten = [r.split("\t")[0] for r in io.open("ids.tsv", encoding="utf-8") if r.strip()]
    saldo = {}
    for rad in io.open("lager.tsv", encoding="utf-8"):
        if not rad.strip():
            continue
        delar = rad.rstrip("\n").split("\t")
        if len(delar) < 2 or not delar[1].strip().lstrip("-").isdigit():
            raise SystemExit(f"  [AVBRYT] lager.tsv: kan inte läsa raden {rad.strip()!r}")
        saldo[delar[0]] = int(delar[1])

    fynd, varningar = [], []
    for kort in korten:
        if kort not in saldo:
            fynd.append(f"  {kort}: [SALDO SAKNAS] produkten står i ids.tsv men inte i lager.tsv")
        elif saldo[kort] <= 0:
            fynd.append(f"  {kort}: [SLUTSÅLD] saldo {saldo[kort]} — polera den inte")
        elif saldo[kort] < TUNT:
            varningar.append(f"  {kort}: saldo {saldo[kort]} — tunt, men köpbart")

    for rad in varningar:
        print(rad)
    for rad in fynd:
        print(rad)
    lagsta = min((saldo[k] for k in korten if k in saldo), default=0)
    print(f"\nGRIND: {len(fynd)} fynd i {len(korten)} produkter (lägsta saldo {lagsta})")
    sys.exit(1 if fynd else 0)


main()
