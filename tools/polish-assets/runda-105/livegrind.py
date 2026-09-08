# -*- coding: utf-8 -*-
"""Runda 105 Steg 14 — läs de sex publicerade sidorna som kunden ser dem.

☠️ `?cb=` BUSTAR INTE ISR-cachen. Next.js nycklar på RUTTEN, inte på query.
   `grindar.hamta_isr` hämtar därför TVÅ gånger: den första beställer
   ombyggnaden, den andra är mätningen. Runda 104 rapporterade "0 av 6" på sex
   korrekta sidor för att den grinden saknade det.

☠️ KONTROLLMÄTNING: hjältebildens media-id MÅSTE hittas i HTML:en. Utan den vet
   man inte om ett "noll fel" betyder ren sida eller tom hämtning.
"""
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import grindar as G                                              # noqa: E402

BAS = "https://www.fyndplats.se/produkt/"
SIDOR = {
 "skoldpaddshus-120-oppet":  ("1f6de209", "b379ce_5e8e4166df29488f862b50f8a74b3e4d~mv2",
                              "b379ce_9dbbe96ff783437a8c0f1b24ed278039~mv2", "0,53 m²", []),
 "skoldpaddshus-81-cm":      ("609bec0f", "b379ce_3fe0d4a4981844399a21ba2464a65b46~mv2",
                              "b379ce_3408b75698564fc393c4479a13bfb4e8~mv2", "0,33 m²",
                              ["b379ce_ae69eadd55e9451698fa2e6d33ad15ec~mv2"]),
 "skoldpaddshus-104-orange": ("f55d9635", "b379ce_d8cad8a0d120467bbd92b4075f993743~mv2",
                              "b379ce_ceb14e565c3141c0af2b7d27459b1910~mv2", "0,46 m²", []),
 "skoldpaddshus-91-grabrun": ("a0bb5be8", "b379ce_22e44493019845d293ca5c81d6adfcb4~mv2",
                              "b379ce_b06f303e34644d2eaf719c74571ccb4f~mv2", "0,48 m²", []),
 "skoldpaddshus-91-bla":     ("4b089c02", "b379ce_592b972856804ccf8a36755c0b26a207~mv2",
                              "b379ce_43d4c0a134ba4231b945adde757cac47~mv2", "0,48 m²",
                              ["b379ce_db918a4b8f8746ddb0fe83cfa9664309~mv2"]),
 "skoldpaddshus-91-gra":     ("27aa4c23", "b379ce_d591542d1e2a4c5e82921cd3c420edef~mv2",
                              "b379ce_ee63434b4bfa4004aaee32dcd6e87c09~mv2", "0,48 m²", []),
}
FORBJUDET = [
  ("tyskt ord", re.compile(r"\b(Schildkr|Gehege|Kleintier|Tannenholz|Lampenhalter|Deckel|"
                           r"Abmessungen|Lieferumfang|Geeignet f)", re.I)),
  ("husmärke", re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b", re.I)),
  ("lagerland", re.compile(r"Skickas fr[åa]n\s+(Tyskland|Polen|Spanien|Kina)", re.I)),
  ("artikelnummer", G.ARTNR),
  ("trasig relativ länk", re.compile(r"https:/produkt")),
  ("leverantörsattribution", re.compile(r"\bleverant[öo]ren?s?\b", re.I)),
]

if __name__ == "__main__":
    gronа = 0
    for slug, (k, hjalte, kort, yta, borttagna) in SIDOR.items():
        html, hdr = G.hamta_isr(BAS + slug)
        fel = []
        if hjalte not in html:
            fel.append("KONTROLLMÄTNINGEN FALLER — hjältebilden finns inte i HTML:en")
        if kort not in html:
            fel.append("vårt eget kort saknas i galleriet")
        if yta not in html:
            fel.append(f"golvytan {yta} står inte på sidan")
        if "L80" not in html:
            fel.append("L80-stycket saknas")
        for b in borttagna:
            if b in html:
                fel.append(f"bild med tysk text ligger kvar: {b[:20]}…")
        for etikett, monster in FORBJUDET:
            m = monster.search(html)
            if m:
                fel.append(f"{etikett}: {m.group(0)!r}")
        status = "OK " if not fel else "FEL"
        if not fel:
            gronа += 1
        print(f"{status} {slug:<26} {len(html):>7} tecken  cache={hdr.get('x-vercel-cache')}"
              f" age={hdr.get('age')}")
        for f in fel:
            print("      ✗", f)
    print(f"\n{gronа} av {len(SIDOR)} sidor gröna")
    sys.exit(0 if gronа == len(SIDOR) else 1)
