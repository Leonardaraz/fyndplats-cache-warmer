# Fyndauktionen året runt: "Studion" (25 s, 1080 × 1920)

Reklamfilmen för Fyndauktionen som går att använda året runt: inget datum, ingen säsong och
inget antal fynd. Filmen är en auktionsdag i en svart studio.

- **Trappan:** varan själv, en riktig 3D-modell, snurrar in på en vridplatta överst i guldtrappan och
  kliver ett steg ned per timme. En prisskylt följer med och visar timmens pris. Ett enda huvudljus
  går som en sol bakom den från kl 07 och framåt, så att varans egen skugga sveper över trappan
  som en visare.
- **Närbilden:** "Vågar du vänta?", och SÅLD slår ned på prisskylten.
- **Visningsrummet:** dagens fynd på piedestaler, en av dem säljs, och kvällsljuset kommer.
- **Slutet:** löftena på glasskivan och kuben, och sista rutorna tonar över till första så att
  filmen loopar.
- **Kortversionen (16 s):** trappan, närbilden och kuben, för annonser.

Byggd på verktyget från Black Friday-filmen (`tools/film-black-friday/`, Pristrappan). Det nya här:

| Del | Fil |
| :-- | :-- |
| Varorna som 3D-modeller, byggda i kod med produktsidans mått | `film/modeller/` (en modul per vara, byggstenar och material i `delar.py`) |
| Varans namn, pris, mått och alla bilder ur butiken | `film/varudata.py` |
| Bilder av varje modell från fyra vinklar bredvid produktbilden | `film/modellprov.py` |
| Provrutor: en tagning byggs en gång och flera rutor renderas och sätts ihop med texterna | `film/provruta.py` |
| Dagens klocka och solens bana (riktning, höjd, färgtemperatur) | `common.klocka()`, `common.sol()` |
| Exempelvarans timpriser, räknade som auktionen räknar dem (taket läses ur motorn) | `film/prisstege.py` |
| Kortversionen: en egen ordning av rutor och ett ljud med samma klipp | `comp --rutor`, `audio --kort` |

## Det filmen påstår ska gå att belägga

- **Auktionens regler:** mekaniken är auktionens egen (`lib/auction/engine.ts`). Kl 07 startar
  varje fynd på ordinarie pris, och priset sjunker varje hel timme till kl 19. Varje fynd finns
  en gång, och nya fynd kommer varje dag.
- **Exempelvarorna:** de finns i butiken och i auktionens kö, och alla kostar under 2 000 kr
  (`pristak.ts`).
- **Priserna:** startpriserna är butikens ordinarie pris vid inspelningen. Skylten och plaketterna
  säger "Exempel", så filmen är ärlig även när varan sålts eller priset ändrats.
- **Timpriserna på skylten** (Leonard 2026-11-27: "du får ha priser med") är exempelvarans
  riktiga priser kl 07–15, räknade med auktionens egen formel och det tak som gäller i drift
  (`film/prisstege.py` läser `MAX_DISCOUNT` ur `lib/auction/engine.ts` på `origin/main`). De
  stämdes av mot varans egen stege i auktionens kö. Golvet kl 18 visas aldrig.
- **Aldrig större rabatt än auktionen ger.** Leonard ville visa ett tak på 25 % i filmen medan
  motorn har 15 %. Det gjordes inte: då visar filmen ett pris ingen kund kan få. Med dagens
  steg håller filmen även om taket höjs, eftersom kunderna då får mer än filmen visar.
  `film.prisvakt` stoppar leveransen om skyltens priser inte är auktionens.
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
./leverans.sh                            # prisvakt, ljud, 25 s och 16 s med och utan ljud, 4:5 och omslag i leverans/
```

Kortversionen för hand: `$PY -m film.audio --kort` och sedan
`$PY -m film.comp film --rutor 0-359,640-749 --ljud out/ljud-16s.wav ...`, 15,7 s. Klippet går
från mörker till kubens första bit (närbilden släcks vid 11,5 s). Före ruta 640 syns visningsrummets
sista piedestal i halvmörkret, och den hör inte hemma i kortversionen.

En ny vara får en modul i `film/modeller/` med produktsidans mått och en rad i
`film/modeller/__init__.py`. Varans framsida pekar mot −Y, och golvet är z = 0.

## Tidslinjen

| Tid | Bild | Tagning |
| :-- | :-- | :-- |
| 0–2,5 s | Kl 07: fåtöljen snurrar in på vridplattan, kameran åker in, skylten visar startpriset | A |
| 2,5–8,5 s | Kranåkning och följekamera: fåtöljen kliver 07→15, skylten byter pris vid varje kliv, solen vandrar bakom | A |
| 8,5–12 s | Närbild, "Vågar du vänta?", SÅLD slår ned på prisskylten | B |
| 12–18 s | Visningsrummet: spotljusen tänds, varorna vänder sig, SÅLD på lampans plakett i kvällsljuset | C |
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
- **Guld behöver fyra gånger så mycket ljus som ljust trä och vit sten.** Metall syns genom det
  den speglar, men en matt ljus yta kastar tillbaka nästan allt ljus. Med samma ljus som
  satsborden blev bänken laxrosa neon och sidobordet en vit lampa. Varje vara i
  visningsrummet har därför en egen nivå på spotljuset och framljuset (`SPOTNIVA` och
  `FRAMNIVA` i `film/hall.py`). Framljuset byter nivå medan kameran åker mellan varorna.
- **Rör man ljuset i en tagning, rendera om grannen som delar kameraåkningen.** Visningsrummet
  (C) och glasskivan (D) är samma åkning, så ett ljus som ändras i C ger annars ett hopp vid
  ruta 540.
- **Det ska hända något i första rutan.** Fåtöljen vred sig först bara 38° och kameran stod
  nästan still, och det är just där folk scrollar förbi. Nu snurrar den in från profilen medan
  kameran åker in, och priset syns redan i första rutan.
- **Det viktigaste hålls borta från apparnas knappar nere till höger.** SÅLD hamnade i
  högerkanten. Nu landar stämpeln mitt i bild, på prisskylten. Kameran räknades ut genom att
  projicera fåtöljen, skylten och siffrorna på bildytan innan något renderades.
- **En skylt som byter pris byter mellan två slutartider**, med `baka`-nycklar på halva rutor
  (`PRISBYTE_NYCKLAR`), på samma sätt som kuben. Annars syns två priser på samma gång.
- **Rörelseoskärpa, inte skärpedjup, gjorde skylten suddig i kranåkningen.** Kameran följer varan i
  cirka 2,4 m/s. Med en halv rutas slutare blev det runt 14 px oskärpa. Tagning A renderas därför med
  slutaren 0,3 ruta (`over["slutare"]`, som `kor.sh` och `kor_del.sh` skickar för A i slutkvalitet).
  Att flytta skärpan hjälpte inte. Mät innan du ändrar.
- **AAC-kodaren slår över på diskant.** Kubens landning gav +1,8 dBFS true peak i kortversionen, ur
  en källa som toppar på −4,8. Ett lågpass på 16 kHz före kodningen (`comp.gor_film`) gav −4,2 dBFS
  och samma ljudstyrka. Mät true peak på den färdiga filen (`ffmpeg -af ebur128=peak=true`), inte
  bara på WAV-filen.
- **Glas är dyrt att rendera.** Glasskivan (D) tog 43,5 s per ruta i slutkvalitet, inte 25, och
  delen med C 480–539 och hela D stoppades vid tvåtimmarsgränsen. Volympasset fortsatte där det
  slutade. Räkna med cirka 40 s per ruta för C och D, 55–60 s för A och B och 36 s för E, plus
  10 s per ruta för volympasset.
- **Omslagets piller ska inte ligga över varan.** Det ligger nu på det mörka sättsteget under
  fåtöljen, inom 4:5-utsnittet.
- **En stämpel tappar verkan om den upprepas.** Tre SÅLD på sju sekunder blev en; filmen har nu
  två, i närbilden och på lampan.
- **Ett typsnitt i cachen dör med scenen.** `b3d.typsnitt` laddar om ett typsnitt som en ny
  scen (`ny_scen`) har tagit bort, så att flera tagningar kan byggas i samma process.
- **Modeller i kod blir skarpa och exakta.** Mått från produktsidan, riktiga material och
  `modellprov` bredvid produktbilden räckte för att få dem lika produkterna på två omgångar.

Lärdomarna från Pristrappan gäller också. De står i `tools/film-black-friday/README.md`, till
exempel om tvåtimmarsgränsen, spökbilden vid byten mellan slutartider och kodningen för apparna.

## Typsnitt

Newsreader och Geist (SIL Open Font License, se `assets/fonts/OFL-*.txt`), samma som butiken.
