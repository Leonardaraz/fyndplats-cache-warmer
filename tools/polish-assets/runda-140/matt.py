# -*- coding: utf-8 -*-
"""Runda 140 — MATTA fakta, last ur Wix 2026-09-13 via CallWixSiteAPI.

Regel 7 (runbokens Steg 3): ett falt som inte gick att lasa ar None, ALDRIG
det tal grannen rakade ha. Regel 8: varje matt maste stamma mot RITNING.

Kallorna per produkt:
  (1) Steg 1:s katalogsvep   — den raa raden nar familjen grupperades
  (2) Steg 3:s spec-block    — tyskans "Technische Daten" (nedan)
  (3) RITNING                — mattritningen i bildgalleriet (Steg 4)

VIKT: den svenska spec-radens "Vikt" ar FRAKTVIKTEN (anmarkning #488).
Tyskans "Gewicht" ar varans vikt. Dar de skiljer star bada har.
"""

# Fullstandiga Wix-id — MATTA, aldrig skrivna ur minnet (anmarkning #536).
ID = {
    "c9ccf5a3": "c9ccf5a3-4061-465c-82e8-7e72c1e2ad21",
    "4c5d4687": "4c5d4687-9db1-43a6-9157-a36838c34733",
    "01fcdf1d": "01fcdf1d-37a9-4fed-9da7-b86cb80718da",
    "bb3cd4ed": "bb3cd4ed-f75c-4179-94a9-bb4965829642",
    "881540a6": "881540a6-6faa-4005-90a4-79b6c5a4778c",
    "68f8cae9": "68f8cae9-21af-4583-a878-cec4fba98b13",
    "ee19a8c8": "ee19a8c8-0ac5-4981-b7a2-85d823f70b3d",
    "5b8162d1": "5b8162d1-66f2-4a14-bfcb-af587b4611ab",
    "1835c144": "1835c144-8d2f-4058-96b4-c3c0396cdd41",
    "9ee2fa6e": "9ee2fa6e-2258-455d-a224-4b25b0e0af82",
    "c11948ac": "c11948ac-49b6-4129-a8e0-291aedde5d16",
    "2ba6baf0": "2ba6baf0-ef7c-4ed9-9339-af546ac63a7a",
    "22c7de56": "22c7de56-a936-4d16-8915-854613db44e9",
    "07ac9918": "07ac9918-294d-4db4-be5e-72a2b0f85bd6",
    "01ac2f63": "01ac2f63-9230-448a-811b-efd02f71a172",
    # Publicerad granne, samma modell som grupp A:
    "64f5d64b": "64f5d64b-5de6-4302-ac00-264f386f994a",
}

# Matt i cm. tot = (L, B, H). sits/dyna = (L, B, H) dar de finns.
M = {
 "c9ccf5a3": dict(tot=(90, 78, 25),       sits=(70, 63, 14),      dyna=None,
                  rygg=(15, 11),  ben=8,  vikt_de=None, vikt_frakt=10.6,
                  paket=(98, 18, 65),     hund_kg=25, hund_cm=55,  last_kg=None,
                  farg_de="Grau",
                  material="Polyester, MDF, skumstoppning, furu", pris=1249,
                  lager="IN_STOCK"),
 "4c5d4687": dict(tot=(102, 58.5, 42.5),  sits=(83.5, 49.5, 25.5), dyna=(83.5, 49.5, 5),
                  rygg=(6, 22),   ben=15, vikt_de=None, vikt_frakt=10.9,
                  paket=(88, 24.5, 52.5), hund_kg=25, hund_cm=55,  last_kg=None,
                  farg_de="Grau",
                  material="sammet (100 % polyester), skumstoppning, furu, lamelltra",
                  pris=1399, lager="IN_STOCK"),
 "01fcdf1d": dict(tot=(98, 67, 25),       sits=(86, 59, 14),      dyna=(86, 59, 4.5),
                  rygg=(7, 15.5), ben=8,  vikt_de=None, vikt_frakt=11.5,
                  paket=(78, 17.5, 65),   hund_kg=30, hund_cm=60,  last_kg=None,
                  farg_de="Grau",
                  material="polyester, MDF, skumstoppning, furu", pris=1169,
                  lager="IN_STOCK"),
 "bb3cd4ed": dict(tot=(98, 67, 25),       sits=(86, 59, 14),      dyna=(86, 59, 4.5),
                  rygg=(7, 15.5), ben=8,  vikt_de=None, vikt_frakt=11.5,
                  paket=(78, 17.5, 65),   hund_kg=30, hund_cm=60,  last_kg=None,
                  farg_de="Grun",
                  material="polyester, MDF, skumstoppning, furu", pris=1139,
                  lager="IN_STOCK"),
 "881540a6": dict(tot=(98, 67, 25),       sits=(86, 59, 14),      dyna=(86, 59, 4.5),
                  rygg=(7, 15.5), ben=8,  vikt_de=None, vikt_frakt=11.5,
                  paket=(78, 17.5, 65),   hund_kg=30, hund_cm=60,  last_kg=None,
                  farg_de="Blau",
                  material="polyester, MDF, skumstoppning, furu", pris=1059,
                  lager="IN_STOCK"),
 "68f8cae9": dict(tot=(96, 66, 24),       sits=(80, 50, 14.5),    dyna=None,
                  rygg=(12, 15.5), ben=8, vikt_de=None, vikt_frakt=10.2,
                  paket=(74, 16, 59),     hund_kg=30, hund_cm=None, last_kg=None,
                  farg_de="Dunkelblau",
                  material="polyester, MDF, skumstoppning, furu", pris=1039,
                  lager="IN_STOCK"),
 "ee19a8c8": dict(tot=(70, 47, 30),       sits=(52, 33, 14),      dyna=(52, 33, 3),
                  rygg=(6, 20),   ben=5,  vikt_de=None, vikt_frakt=5.5,
                  paket=(72, 27, 49),     hund_kg=4.5, hund_cm=35, last_kg=4.5,
                  farg_de="Cremeweiss",
                  material="plysch, skumstoppning, furu", pris=1259,
                  lager="IN_STOCK"),
 "5b8162d1": dict(tot=(64, 45, 36),       sits=(54, 40.5, 24.5),  dyna=None,
                  rygg=(None, 11.5), ben=9, vikt_de=None, vikt_frakt=7.8,
                  paket=(65, 48, 31),     hund_kg=8,  hund_cm=35,  last_kg=None,
                  farg_de="Dunkelgrau",
                  material="sammetsliknande polyester, skumstoppning, bjork",
                  pris=1039, lager="IN_STOCK"),
 "1835c144": dict(tot=(64, 45, 36),       sits=(54, 40.5, 24.5),  dyna=None,
                  rygg=(None, 11.5), ben=9, vikt_de=None, vikt_frakt=7.8,
                  paket=(65, 48, 31),     hund_kg=8,  hund_cm=35,  last_kg=None,
                  farg_de="Dunkelgrau",
                  material="sammetsliknande polyester, skumstoppning, bjork",
                  pris=1069, lager="IN_STOCK"),
 "9ee2fa6e": dict(tot=(98.5, 60.5, 35.5), sits=(86, 47, 16),      dyna=(92, 47, 4),
                  rygg=(None, 19.5), ben=None, vikt_de=None, vikt_frakt=10.7,
                  paket=(101, 62, 27.5),  hund_kg=25, hund_cm=55,  last_kg=25,
                  farg_de="Grun",
                  material="polyester, skumstoppning, bjork", pris=1519,
                  lager="IN_STOCK"),
 "c11948ac": dict(tot=(98.5, 60.5, 35.5), sits=(86, 47, 16),      dyna=(92, 47, 4),
                  rygg=(None, 19.5), ben=None, vikt_de=None, vikt_frakt=10.7,
                  paket=(101, 62, 27.5),  hund_kg=25, hund_cm=55,  last_kg=25,
                  farg_de="Dunkelgrau",
                  material="polyester, skumstoppning, bjork", pris=1649,
                  lager="OUT_OF_STOCK"),
 "2ba6baf0": dict(tot=(82, 54, 36),       sits=(72, 50, 16),      dyna=(72, 47.5, 4),
                  rygg=(4.5, 20), ben=10, vikt_de=None, vikt_frakt=9.0,
                  paket=(83.5, 55.5, 28), hund_kg=20, hund_cm=50,  last_kg=None,
                  farg_de="Hellgrau",
                  material="sammet (100 % polyester), skumstoppning, bjork",
                  pris=1099, lager="IN_STOCK"),
 "22c7de56": dict(tot=(65, 64, 37),       sits=(48, 55, 20),      dyna=(48, 48, 4),
                  rygg=None,      ben=6,  vikt_de=None, vikt_frakt=8.5,
                  paket=(66.5, 66.5, 33), hund_kg=4.5, hund_cm=30, last_kg=4.5,
                  farg_de="Grun",
                  material="skumstoppning, polyester, bjork", pris=1099,
                  lager="IN_STOCK"),
 "07ac9918": dict(tot=(76, 45, 43),       sits=(59.5, 41, 26),    dyna=(63, 43, 5),
                  rygg=None,      ben=None, vikt_de=7.0, vikt_frakt=8.4,
                  paket=(74, 48.5, 16.5), hund_kg=None, hund_cm=None, last_kg=15,
                  farg_de="Hellgrau", forvaring=(64, 37.5, 9.5),
                  material="naturtra, plysch, skumstoppning", pris=1119,
                  lager="IN_STOCK"),
 # Natbadd med soltak — ANNAN produkttyp, lagd at sidan i Steg 1.
 "01ac2f63": dict(tot=(122, 92, 108),     sits=None,              dyna=None,
                  rygg=None,      ben=None, vikt_de=None, vikt_frakt=4.4,
                  paket=(91, 23, 10),     hund_kg=50, hund_cm=80,  last_kg=None,
                  farg_de="Dunkelblau+Schwarz", bottenhojd=23.5,
                  material="stal, oxford, natvav, taft", pris=749,
                  lager="IN_STOCK"),
 # PUBLICERAD granne — samma modell som grupp A, morkgra.
 "64f5d64b": dict(tot=(98, 67, 25),       sits=(86, 59, 14),      dyna=(86, 59, 4.5),
                  rygg=None,      ben=8,  vikt_de=None, vikt_frakt=None,
                  paket=None,             hund_kg=30, hund_cm=60,  last_kg=40,
                  farg_de="morkgra + naturtra",
                  material="polyester, MDF, skumstoppning, furu", pris=1229,
                  lager="IN_STOCK", slug="hundsoffa-stor-hund-upphojd"),
}

# Leverantorens SJALVMOTSAGELSER — matta, inte gissade. Steg 5 avgor.
MOTSAGELSER = {
 "bb3cd4ed": ["NAMNET sager 'Eukolyptusholz', spec-blocket sager Kiefernholz. "
              "Syskonet 01fcdf1d har samma spec och heter Kiefernholzbeine. "
              "Namnet ar ingen kalla (anmarkning #462) -> FURU."],
 "881540a6": ["Samma 'Eukolyptusholz' i namnet som bb3cd4ed -> FURU."],
 "68f8cae9": ["Dynan uppges 90 x 60 x 8 cm men SITSEN ar 80 x 50 cm. "
              "En dyna kan inte vara storre an sitsen -> dynmattet skrivs INTE.",
              "Tyskan sager '60 cm Schulterhojd' dar alla syskon sager "
              "KROPPSLANGD. 60 cm mankhojd ar en helt annan hund -> "
              "kroppslangden skrivs INTE, bara vikten."],
 "1835c144": ["Tyska spec-blocket sager Dunkelgrau, svenska spec-raden och "
              "alt-texten sager Blau. BILDEN avgor (Steg 5 regel 16)."],
 "07ac9918": ["Tyskan 'Gewicht: 7 kg' mot svenska spec-radens 'Vikt: 8,4 kg'. "
              "Den svenska ar fraktvikten (#488) -> varans vikt ar 7 kg."],
 "ee19a8c8": ["'Kissengrosse: 52B x 33T x 3T' — sista bokstaven ar T tva "
              "ganger. Hojden ar 3 cm."],
 "4c5d4687": ["'Sitz Grosse: 83,5B x 49,5B x 25,5H' — tva B. Andra talet ar djupet."],
}
