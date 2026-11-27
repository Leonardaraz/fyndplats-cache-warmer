# Fyndauktionen året runt: "Studion" (25 s, 1080 × 1920)

Reklamfilmen för Fyndauktionen som går att använda året runt: inget datum, ingen säsong och
inget antal fynd. Filmen är en auktionsdag i en svart studio.

- **Trappan:** varan själv, en riktig 3D-modell, står på en vridplatta överst i guldtrappan och
  kliver ett steg ned per timme. Ett enda huvudljus går som en sol bakom den från kl 07 och
  framåt, så att varans egen skugga sveper över trappan som en visare.
- **Visningsrummet:** efter "Vågar du vänta?" och SÅLD visar det dagens fynd på piedestaler,
  och kvällsljuset kommer.
- **Slutet:** löftena på glasskivan och kuben, och sista rutorna tonar över till första så att
  filmen loopar.

Byggd på verktyget från Black Friday-filmen (`tools/film-black-friday/`, Pristrappan). Det nya här:

| Del | Fil |
| :-- | :-- |
| Varorna som 3D-modeller, byggda i kod med produktsidans mått | `film/modeller/` (en modul per vara, byggstenar och material i `delar.py`) |
| Varans namn, pris, mått och alla bilder ur butiken | `film/varudata.py` |
| Bilder av varje modell från fyra vinklar bredvid produktbilden | `film/modellprov.py` |
| Provrutor: en tagning byggs en gång och flera rutor renderas och sätts ihop med texterna | `film/provruta.py` |
| Dagens klocka och solens bana (riktning, höjd, färgtemperatur) | `common.klocka()`, `common.sol()` |

## Det filmen påstår ska gå att belägga

- **Auktionens regler:** mekaniken är auktionens egen (`lib/auction/engine.ts`). Kl 07 startar
  varje fynd på ordinarie pris, och priset sjunker varje hel timme till kl 19. Varje fynd finns
  en gång, och nya fynd kommer varje dag.
- **Exempelvarorna:** de finns i butiken och i auktionens kö, och alla kostar under 2 000 kr
  (`pristak.ts`).
- **Priserna:** priset i bild är butikens ordinarie pris vid inspelningen (`film.prisvakt` vid
  leveransen). Skylten och plaketterna säger "Exempel", så filmen är ärlig även när varan sålts
  eller priset ändrats.
- **Inga lägre priser:** de visas aldrig, och auktionens golv och prisstege läses inte.
- **Inga leverantörsnamn:** leverantörens varumärken och artikelnummer förekommer inte, varken
  i bild, text eller filnamn.

## Så körs den

```bash
cd tools/film-fyndauktionen
./installera.sh                          # Blender (bpy), biblioteken och typsnitten, en gång per molnsession
PY=/opt/render-venv/bin/python

$PY -m film.varudata <slug> …            # namn, pris, mått och alla bilder för varorna
# assets/products/val.json: {"trappa": "<slug>", "hall": ["<slug>", "<slug>", "<slug>", "<slug>"]}
$PY -m film.modellprov                   # modellerna från fyra vinklar bredvid produktbilden: godkänns först
$PY -m film.texturer                     # prisskylten, plaketterna och glasraderna
node titles/rendera.js out/titlar        # texterna
$PY -m film.provruta --tagning A --rutor 0,105,240 --kvalitet utkast   # nyckelrutor att granska
./kor.sh skiss A B C D E                 # skiss av hela filmen (ca 1 s per ruta)
./kor_del.sh final A 0 120 bada          # slutkvalitet i delar: ett bakgrundsjobb stoppas efter 2 h
./leverans.sh                            # prisvakt, ljud, film med och utan ljud, 4:5 och omslag i leverans/
```

En ny vara får en modul i `film/modeller/` med produktsidans mått och en rad i
`film/modeller/__init__.py`. Varans framsida pekar mot −Y, och golvet är z = 0.

## Tidslinjen

| Tid | Bild | Tagning |
| :-- | :-- | :-- |
| 0–2,5 s | Kl 07: spotljuset, fåtöljen vrider sig på vridplattan överst i trappan | A |
| 2,5–8,5 s | Kranåkning och följekamera: fåtöljen kliver 07→15, solen vandrar bakom den | A |
| 8,5–12 s | Närbild, "Vågar du vänta?", SÅLD på sättsteget framför | B |
| 12–18 s | Visningsrummet: spotljusen tänds, varorna vänder sig, SÅLD på två plaketter i kvällsljuset | C |
| 18–21 s | Glasskivan med de tre löftena | D |
| 21–25 s | Kl 19: ljuset släcks, kuben landar, slutbilden. Sista 0,4 s tonar över till början | E |

Takten är 120 slag i minuten (`film/common.py`).

## Lärdomar från Studion (2026-11-27)

- **Djupa steg sedda ovanifrån blir en spegel.** Stegen är 1,15 m djupa för att fåtöljen ska få
  plats. I helblankt guld speglade de ljuslådan bakom och gjorde hela bilden gul. Satinborstat
  guld (strävhet 0,38) och en svagare bakre ljuslåda gav en ren bild, där varans skugga syns.
- **Skuggan syns bara om stegen får sitt ljus av solen.** Framljuset är därför ljuslänkat till
  varan, vridplattan och skylten, och kantljusen är dämpade.
- **Spotljus med radie syns i blanka golv.** Deras egen ljuskälla speglades som en ljus fläck.
  Därför har spotljusen `visible_glossy = False`.
- **Ett typsnitt i cachen dör med scenen.** `b3d.typsnitt` laddar om ett typsnitt som en ny
  scen (`ny_scen`) har tagit bort, så att flera tagningar kan byggas i samma process.
- **Modeller i kod blir skarpa och exakta.** Mått från produktsidan, riktiga material och
  `modellprov` bredvid produktbilden räckte för att få dem lika produkterna på två omgångar.

Lärdomarna från Pristrappan gäller också. De står i `tools/film-black-friday/README.md`, till
exempel om tvåtimmarsgränsen, spökbilden vid byten mellan slutartider och kodningen för apparna.

## Typsnitt

Newsreader och Geist (SIL Open Font License, se `assets/fonts/OFL-*.txt`), samma som butiken.
