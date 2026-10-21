#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""kap.py: vilka djurstorlekar ett terrarium eller en sköldpaddsbox klarar enligt SJVFS 2019:15 (L 80), bilaga 1:5 (ormar),
1:6 (ödlor) och 1:7 (sköldpaddor). Tabellerna är kopierade ur föreskriftstexten (Jordbruksverkets PDF, hämtad 2026-10-21).
Rad = (största längd i klassen i cm, minsta yta i m², minsta höjd i m) för ETT djur. Ormar och ödlor mäts från nosspetsen
till svansspetsen, sköldpaddor rakt från främre till bakre skalkant. Ett utrymme klarar en klass när ytan med tillräcklig
höjd är minst den minsta tillåtna ytan. Höjden mäts per delyta: ett lutande tak räknas bara där höjden räcker, och två
våningar räknas inte ihop (se runbookens avsnitt Terrarier och sköldpaddshus).

ANVÄNDNING:  python3 tools/polish-gates/kap.py        (kör exemplen från N293: sköldpaddsboxen, tvåvåningshuset och terrarierna)
              från Python: from kap import storsta, nasta, rapport, yta_med_hojd
"""

ORM_TRAD = [(35, 0.03, 0.17), (40, 0.04, 0.2), (50, 0.06, 0.25), (75, 0.12, 0.4), (100, 0.25, 0.5), (125, 0.4, 0.65), (150, 0.55, 0.75), (175, 0.75, 0.85), (999, 1.0, 1.0)]
ORM_MARK = [(30, 0.03, 0.1), (40, 0.04, 0.12), (50, 0.06, 0.15), (75, 0.12, 0.2), (100, 0.25, 0.28), (125, 0.43, 0.35), (150, 0.63, 0.45), (200, 1.0, 0.5), (300, 2.15, 0.7), (400, 4.1, 1.0)]
ODLA_TRAD = [(15, 0.06, 0.25), (20, 0.12, 0.35), (30, 0.25, 0.5), (40, 0.5, 0.7), (50, 0.81, 0.9), (75, 1.5, 1.2)]
ODLA_MARK = [(10, 0.06, 0.2), (15, 0.09, 0.2), (20, 0.16, 0.3), (30, 0.36, 0.3), (40, 0.64, 0.4), (50, 0.9, 0.5), (75, 1.8, 0.6)]
SKOLD_LAND = [(10, 0.12, 0.2), (15, 0.3, 0.25), (20, 0.5, 0.3), (30, 1.1, 0.4), (40, 2.0, 0.5), (50, 4.0, 0.6)]

TABELLER = {
    'orm_trad': ORM_TRAD, 'orm_mark': ORM_MARK, 'odla_trad': ODLA_TRAD, 'odla_mark': ODLA_MARK, 'skold_land': SKOLD_LAND,
}


def storsta(tabell, yta, hojd):
    """Största längdklass (cm) där ytan och höjden räcker, eller None."""
    ok = None
    for lang, a, h in TABELLER[tabell]:
        if yta + 1e-9 >= a and hojd + 1e-9 >= h:
            ok = lang
    return ok


def nasta(tabell, yta, hojd):
    """Första raden som inte klaras, för att se vilket mått som saknas: (längd, yta, höjd, vad som saknas)."""
    for lang, a, h in TABELLER[tabell]:
        sak = []
        if yta + 1e-9 < a:
            sak.append('yta %.2f < %.2f' % (yta, a))
        if hojd + 1e-9 < h:
            sak.append('höjd %.2f < %.2f' % (hojd, h))
        if sak:
            return lang, a, h, ', '.join(sak)
    return None


def rapport(namn, yta, hojd, tabeller=None):
    print('--- %s: yta %.3f m², höjd %.2f m' % (namn, yta, hojd))
    for t in (tabeller or TABELLER):
        print('   %-10s klarar upp till %s cm; nästa steg %s' % (t, storsta(t, yta, hojd), nasta(t, yta, hojd)))


def yta_med_hojd(bredd_cm, djup_cm, hojd_fram_cm, hojd_bak_cm, krav_cm, marginal_cm=0.0):
    """Golvyta (m²) där höjden är minst krav_cm när taket lutar rakt från hojd_fram till hojd_bak över djupet.
    marginal_cm dras från den utvändiga höjden (lock och ram)."""
    steg = hojd_bak_cm - hojd_fram_cm
    if steg == 0:
        return bredd_cm * djup_cm / 1e4 if hojd_fram_cm - marginal_cm >= krav_cm else 0.0
    y0 = max(0.0, (krav_cm + marginal_cm - hojd_fram_cm) * djup_cm / steg)
    if y0 >= djup_cm:
        return 0.0
    return bredd_cm * (djup_cm - y0) / 1e4


if __name__ == '__main__':
    # Sköldpaddsboxen: invändigt 114 x 51 cm, höjd 20 cm fram och 50 cm bak (utvändigt), 3 cm marginal för locket
    for kr in (20, 25, 30, 40):
        print('box: yta där höjden >= %d cm (3 cm marginal): %.3f m²; utan marginal %.3f m²' % (kr, yta_med_hojd(114, 51, 20, 50, kr, 3), yta_med_hojd(114, 51, 20, 50, kr, 0)))
    rapport('box, delen över 28 cm', yta_med_hojd(114, 51, 20, 50, 25, 3), 0.25, ['skold_land'])
    rapport('tvåvåningshuset, nedre delen', 1.08 * 0.61, 0.24)
    rapport('OSB-terrarium (uppskattat)', 0.50, 0.45)
    rapport('aluminiumterrarium (uppskattat)', 0.42, 0.33)
    rapport('glasterrarium 25 cm (uppskattat)', 0.13, 0.23)
    rapport('glasterrarium 35 cm (uppskattat)', 0.13, 0.33)
