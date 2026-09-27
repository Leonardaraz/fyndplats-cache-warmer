# Filterluckor: produkter som saknar uppgiften filtret bygger på

Uppmätt 2026-09-27 på katalogen (3 783 produkter), med butikens egen tolkning (`lib/spec-facets.ts` på headless-site). Listan blir inaktuell när produkter poleras; den säger var det lönar sig att börja, inte vad som gäller om en månad. Hur uppgifterna ska skrivas står i `docs/seo-polish-runbook.md`, avsnittet *Filtren på kategorisidorna läser texten*.

**Skriv bara det som stämmer.** Saknar varan lådor, klädsel eller hjul hoppar du över den. En produkt utan uppgiften försvinner bara när just det filtret används; en fel uppgift hamnar i fel filter.

Bara underkategorier räknas (inte huvudkategorierna ovanför dem), och egenskaperna (hjul, LED …) finns inte med: där betyder en saknad uppgift oftast att varan inte har egenskapen.

## 1. Filter som dyker upp om några fler produkter får uppgiften

Ett reglage visas när 60 % av kategorin har värdet, material likaså; övriga knappar vid 40 %. *Behöver* är hur många fler som ska ha uppgiften.

| Kategori | Filter | Har nu | Behöver | Skriv så här |
|---|---|--:|--:|---|
| [matbord-stolar](https://www.fyndplats.se/kategori/matbord-stolar) | Form | 40 % | 1 | `"Runt"/"Oval" i namnet, eller Mått med Ø` |
| [soffor-baddsoffor](https://www.fyndplats.se/kategori/soffor-baddsoffor) | Djup | 59 % | 1 | `Mått: 90 × 60 × 75 cm` |
| [hundvagnar](https://www.fyndplats.se/kategori/hundvagnar) | Vikt | 57 % | 1 | `Vikt: 14,5 kg` |
| [elkaminer](https://www.fyndplats.se/kategori/elkaminer) | Effekt | 57 % | 1 | `Effekt: 2000 W` |
| [tradgardsskotsel-bevattning](https://www.fyndplats.se/kategori/tradgardsskotsel-bevattning) | Bredd | 59 % | 1 | `Mått: 90 × 60 × 75 cm` |
| [vattenkokare-brodrostar](https://www.fyndplats.se/kategori/vattenkokare-brodrostar) | Volym | 55 % | 1 | `Volym: 1,7 liter` |
| [nattduksbord](https://www.fyndplats.se/kategori/nattduksbord) | Lådor | 37 % | 1 | `Antal lådor: 5` |
| [leksakskok](https://www.fyndplats.se/kategori/leksakskok) | Ålder | 53 % | 1 | `Rekommenderad ålder: 3–8 år` |
| [hantlar-hantelset](https://www.fyndplats.se/kategori/hantlar-hantelset) | Vikt | 53 % | 1 | `Vikt: 14,5 kg` |
| [varmeflaktar](https://www.fyndplats.se/kategori/varmeflaktar) | Höjd | 57 % | 1 | `Mått: 90 × 60 × 75 cm` |
| [katthus](https://www.fyndplats.se/kategori/katthus) | Våningar | 33 % | 1 | `Antal hyllplan: 4` |
| [katthus](https://www.fyndplats.se/kategori/katthus) | Material | 58 % | 1 | `Material: stål och MDF` |
| [motionscyklar](https://www.fyndplats.se/kategori/motionscyklar) | Maxlast | 58 % | 1 | `Maxlast: 120 kg` |
| [valphagar-hundhagar](https://www.fyndplats.se/kategori/valphagar-hundhagar) | Bredd | 56 % | 1 | `Mått: 90 × 60 × 75 cm` |
| [sandlador](https://www.fyndplats.se/kategori/sandlador) | Material | 50 % | 1 | `Material: stål och MDF` |
| [hudvard-ansikte](https://www.fyndplats.se/kategori/hudvard-ansikte) | Effekt | 50 % | 1 | `Effekt: 2000 W` |
| [hudvard-ansikte](https://www.fyndplats.se/kategori/hudvard-ansikte) | Material | 50 % | 1 | `Material: stål och MDF` |
| [koksmaskiner-apparater](https://www.fyndplats.se/kategori/koksmaskiner-apparater) | Volym | 57 % | 2 | `Volym: 1,7 liter` |
| [redskapsbodar-forrad](https://www.fyndplats.se/kategori/redskapsbodar-forrad) | Bredd | 54 % | 2 | `Mått: 90 × 60 × 75 cm` |
| [redskapsbodar-forrad](https://www.fyndplats.se/kategori/redskapsbodar-forrad) | Höjd | 54 % | 2 | `Mått: 90 × 60 × 75 cm` |
| [badrumsspeglar](https://www.fyndplats.se/kategori/badrumsspeglar) | Höjd | 56 % | 2 | `Mått: 90 × 60 × 75 cm` |
| [sideboards-vitrinskap](https://www.fyndplats.se/kategori/sideboards-vitrinskap) | Lådor | 33 % | 2 | `Antal lådor: 5` |
| [tvattkorgar](https://www.fyndplats.se/kategori/tvattkorgar) | Volym | 47 % | 2 | `Volym: 1,7 liter` |
| [oronlappsfatoljer](https://www.fyndplats.se/kategori/oronlappsfatoljer) | Sitthöjd | 50 % | 2 | `Sitthöjd: 45 cm` |
| [oronlappsfatoljer](https://www.fyndplats.se/kategori/oronlappsfatoljer) | Maxlast | 50 % | 2 | `Maxlast: 120 kg` |
| [motionscyklar](https://www.fyndplats.se/kategori/motionscyklar) | Vikt | 50 % | 2 | `Vikt: 14,5 kg` |
| [kropp-valbefinnande](https://www.fyndplats.se/kategori/kropp-valbefinnande) | Maxlast | 38 % | 2 | `Maxlast: 120 kg` |
| [fatoljer](https://www.fyndplats.se/kategori/fatoljer) | Sitthöjd | 59 % | 3 | `Sitthöjd: 45 cm` |
| [matbord-stolar](https://www.fyndplats.se/kategori/matbord-stolar) | Sittplatser | 38 % | 3 | `Sittplatser: 3` |
| [matbord-stolar](https://www.fyndplats.se/kategori/matbord-stolar) | Klädsel | 38 % | 3 | `Klädsel: sammet` |
| [koksmaskiner-apparater](https://www.fyndplats.se/kategori/koksmaskiner-apparater) | Effekt | 56 % | 3 | `Effekt: 2000 W` |
| [tradgardsskotsel-bevattning](https://www.fyndplats.se/kategori/tradgardsskotsel-bevattning) | Höjd | 52 % | 3 | `Mått: 90 × 60 × 75 cm` |
| [honshus-honsgardar](https://www.fyndplats.se/kategori/honshus-honsgardar) | Material | 48 % | 3 | `Material: stål och MDF` |
| [eldkorgar-eldstader](https://www.fyndplats.se/kategori/eldkorgar-eldstader) | Diameter | 44 % | 3 | `Mått: 90 × 60 × 75 cm` |
| [snurrfatoljer](https://www.fyndplats.se/kategori/snurrfatoljer) | Bredd | 46 % | 4 | `Mått: 90 × 60 × 75 cm` |
| [tradgardsskotsel-bevattning](https://www.fyndplats.se/kategori/tradgardsskotsel-bevattning) | Djup | 48 % | 4 | `Mått: 90 × 60 × 75 cm` |
| [tv-bankar](https://www.fyndplats.se/kategori/tv-bankar) | Lådor | 22 % | 4 | `Antal lådor: 5` |
| [traningsbankar](https://www.fyndplats.se/kategori/traningsbankar) | Maxlast | 38 % | 4 | `Maxlast: 120 kg` |
| [traningsbankar](https://www.fyndplats.se/kategori/traningsbankar) | Vikt | 38 % | 4 | `Vikt: 14,5 kg` |
| [solskydd-paviljonger](https://www.fyndplats.se/kategori/solskydd-paviljonger) | Bredd | 49 % | 5 | `Mått: 90 × 60 × 75 cm` |
| [baby-smabarn](https://www.fyndplats.se/kategori/baby-smabarn) | Maxlast | 52 % | 6 | `Maxlast: 120 kg` |
| [pallar](https://www.fyndplats.se/kategori/pallar) | Sitthöjd | 49 % | 6 | `Sitthöjd: 45 cm` |
| [baddfatoljer](https://www.fyndplats.se/kategori/baddfatoljer) | Sitthöjd | 39 % | 6 | `Sitthöjd: 45 cm` |
| [kalas-fest](https://www.fyndplats.se/kategori/kalas-fest) | Bredd | 53 % | 8 | `Mått: 90 × 60 × 75 cm` |
| [solskydd-paviljonger](https://www.fyndplats.se/kategori/solskydd-paviljonger) | Höjd | 42 % | 8 | `Mått: 90 × 60 × 75 cm` |
| [badrumsspeglar](https://www.fyndplats.se/kategori/badrumsspeglar) | Placering | 16 % | 8 | `Placering: vägghängd` |
| [kalas-fest](https://www.fyndplats.se/kategori/kalas-fest) | Höjd | 52 % | 9 | `Mått: 90 × 60 × 75 cm` |
| [halloweendekoration](https://www.fyndplats.se/kategori/halloweendekoration) | Bredd | 46 % | 9 | `Mått: 90 × 60 × 75 cm` |
| [badrumsskap](https://www.fyndplats.se/kategori/badrumsskap) | Placering | 28 % | 10 | `Placering: vägghängd` |
| [halloweendekoration](https://www.fyndplats.se/kategori/halloweendekoration) | Höjd | 43 % | 11 | `Mått: 90 × 60 × 75 cm` |
| [soffbord-smabord](https://www.fyndplats.se/kategori/soffbord-smabord) | Lådor | 21 % | 11 | `Antal lådor: 5` |
| [utemobler](https://www.fyndplats.se/kategori/utemobler) | Sittplatser | 27 % | 12 | `Sittplatser: 3` |
| [hushallsapparater](https://www.fyndplats.se/kategori/hushallsapparater) | Bredd | 40 % | 13 | `Mått: 90 × 60 × 75 cm` |
| [hushallsapparater](https://www.fyndplats.se/kategori/hushallsapparater) | Höjd | 40 % | 13 | `Mått: 90 × 60 × 75 cm` |
| [halloweendekoration](https://www.fyndplats.se/kategori/halloweendekoration) | Material | 40 % | 13 | `Material: stål och MDF` |
| [klostrad](https://www.fyndplats.se/kategori/klostrad) | Våningar | 26 % | 15 | `Antal hyllplan: 4` |
| [bil-cykel](https://www.fyndplats.se/kategori/bil-cykel) | Material | 40 % | 17 | `Material: stål och MDF` |
| [traning-gym](https://www.fyndplats.se/kategori/traning-gym) | Vikt | 44 % | 21 | `Vikt: 14,5 kg` |
| [friluftsliv-resa](https://www.fyndplats.se/kategori/friluftsliv-resa) | Vikt | 36 % | 21 | `Vikt: 14,5 kg` |
| [forvaring-organisering](https://www.fyndplats.se/kategori/forvaring-organisering) | Maxlast | 55 % | 22 | `Maxlast: 120 kg` |
| [klostrad](https://www.fyndplats.se/kategori/klostrad) | Maxlast | 40 % | 22 | `Maxlast: 120 kg` |
| [kalas-fest](https://www.fyndplats.se/kategori/kalas-fest) | Material | 38 % | 23 | `Material: stål och MDF` |
| [matbord-stolar](https://www.fyndplats.se/kategori/matbord-stolar) | Sitthöjd | 35 % | 32 | `Sitthöjd: 45 cm` |

## 2. Filter som syns, men där produkter faller bort

Filtret syns redan, men produkterna nedan saknar uppgiften och försvinner när kunden använder det.

| Kategori | Filter | Har nu | Saknar |
|---|---|--:|--:|
| [fatoljer](https://www.fyndplats.se/kategori/fatoljer) | Bredd | 61 % | 118 |
| [forvaring-organisering](https://www.fyndplats.se/kategori/forvaring-organisering) | Djup | 84 % | 70 |
| [forvaring-organisering](https://www.fyndplats.se/kategori/forvaring-organisering) | Höjd | 85 % | 69 |
| [leksaker-spel](https://www.fyndplats.se/kategori/leksaker-spel) | Ålder | 79 % | 67 |
| [dekoration-prydnad](https://www.fyndplats.se/kategori/dekoration-prydnad) | Bredd | 75 % | 59 |
| [fatoljer](https://www.fyndplats.se/kategori/fatoljer) | Klädsel | 81 % | 57 |
| [dekoration-prydnad](https://www.fyndplats.se/kategori/dekoration-prydnad) | Material | 77 % | 55 |
| [forvaring-organisering](https://www.fyndplats.se/kategori/forvaring-organisering) | Bredd | 88 % | 54 |
| [dekoration-prydnad](https://www.fyndplats.se/kategori/dekoration-prydnad) | Höjd | 78 % | 52 |
| [fatoljer](https://www.fyndplats.se/kategori/fatoljer) | Maxlast | 84 % | 50 |
| [forvaring-organisering](https://www.fyndplats.se/kategori/forvaring-organisering) | Material | 89 % | 49 |
| [verktyg-hemmafix](https://www.fyndplats.se/kategori/verktyg-hemmafix) | Höjd | 72 % | 44 |
| [verktyg-hemmafix](https://www.fyndplats.se/kategori/verktyg-hemmafix) | Material | 72 % | 43 |
| [kontorsstolar](https://www.fyndplats.se/kategori/kontorsstolar) | Klädsel | 75 % | 41 |
| [kontorsstolar](https://www.fyndplats.se/kategori/kontorsstolar) | Bredd | 75 % | 40 |
| [verktyg-hemmafix](https://www.fyndplats.se/kategori/verktyg-hemmafix) | Bredd | 77 % | 36 |
| [tradgardsdekor-belysning](https://www.fyndplats.se/kategori/tradgardsdekor-belysning) | Höjd | 69 % | 34 |
| [tradgardsdekor-belysning](https://www.fyndplats.se/kategori/tradgardsdekor-belysning) | Material | 69 % | 34 |
| [matbord-stolar](https://www.fyndplats.se/kategori/matbord-stolar) | Djup | 74 % | 33 |
| [leksaker-spel](https://www.fyndplats.se/kategori/leksaker-spel) | Material | 90 % | 32 |
| [speglar](https://www.fyndplats.se/kategori/speglar) | Placering | 44 % | 32 |
| [tradgardsdekor-belysning](https://www.fyndplats.se/kategori/tradgardsdekor-belysning) | Bredd | 73 % | 29 |
| [friluftsliv-resa](https://www.fyndplats.se/kategori/friluftsliv-resa) | Material | 66 % | 29 |
| [utemobler](https://www.fyndplats.se/kategori/utemobler) | Maxlast | 70 % | 28 |
| [matbord-stolar](https://www.fyndplats.se/kategori/matbord-stolar) | Höjd | 78 % | 28 |
| [matbord-stolar](https://www.fyndplats.se/kategori/matbord-stolar) | Bredd | 79 % | 27 |
| [burar-klader-tillbehor](https://www.fyndplats.se/kategori/burar-klader-tillbehor) | Material | 83 % | 26 |
| [hushallsapparater](https://www.fyndplats.se/kategori/hushallsapparater) | Effekt | 65 % | 23 |
| [utemobler](https://www.fyndplats.se/kategori/utemobler) | Bredd | 76 % | 22 |
| [soffor-baddsoffor](https://www.fyndplats.se/kategori/soffor-baddsoffor) | Bredd | 63 % | 22 |
| [speglar](https://www.fyndplats.se/kategori/speglar) | Höjd | 61 % | 22 |
| [badrum-hemtextil](https://www.fyndplats.se/kategori/badrum-hemtextil) | Höjd | 79 % | 22 |
| [soffor-baddsoffor](https://www.fyndplats.se/kategori/soffor-baddsoffor) | Sittplatser | 54 % | 21 |
| [konstvaxter](https://www.fyndplats.se/kategori/konstvaxter) | Bredd | 69 % | 21 |
| [fatoljer](https://www.fyndplats.se/kategori/fatoljer) | Material | 93 % | 21 |
| [baby-smabarn](https://www.fyndplats.se/kategori/baby-smabarn) | Ålder | 72 % | 19 |
| [soffor-baddsoffor](https://www.fyndplats.se/kategori/soffor-baddsoffor) | Material | 68 % | 19 |
| [utemobler](https://www.fyndplats.se/kategori/utemobler) | Material | 80 % | 18 |
| [pallar](https://www.fyndplats.se/kategori/pallar) | Klädsel | 65 % | 18 |
| [speglar](https://www.fyndplats.se/kategori/speglar) | Form | 67 % | 18 |
| [barnmobler](https://www.fyndplats.se/kategori/barnmobler) | Maxlast | 66 % | 17 |
| [vaxthus-odling](https://www.fyndplats.se/kategori/vaxthus-odling) | Material | 85 % | 17 |
| [burar-klader-tillbehor](https://www.fyndplats.se/kategori/burar-klader-tillbehor) | Bredd | 90 % | 16 |
| [sangar-sovrum](https://www.fyndplats.se/kategori/sangar-sovrum) | Klädsel | 47 % | 16 |
| [julgranar](https://www.fyndplats.se/kategori/julgranar) | Material | 79 % | 16 |
| [soffor-baddsoffor](https://www.fyndplats.se/kategori/soffor-baddsoffor) | Klädsel | 75 % | 15 |
| [barnmobler](https://www.fyndplats.se/kategori/barnmobler) | Ålder | 72 % | 14 |
| [traning-gym](https://www.fyndplats.se/kategori/traning-gym) | Material | 89 % | 14 |
| [verktygsvagnar-verktygslador](https://www.fyndplats.se/kategori/verktygsvagnar-verktygslador) | Lådor | 69 % | 14 |
| [juldekoration](https://www.fyndplats.se/kategori/juldekoration) | Material | 80 % | 14 |
| [redskapsbodar-forrad](https://www.fyndplats.se/kategori/redskapsbodar-forrad) | Längd | 60 % | 14 |
| [redskapsbodar-forrad](https://www.fyndplats.se/kategori/redskapsbodar-forrad) | Material | 60 % | 14 |
| [utelek-spel](https://www.fyndplats.se/kategori/utelek-spel) | Ålder | 60 % | 14 |
| [grill-utekok](https://www.fyndplats.se/kategori/grill-utekok) | Bränsle | 46 % | 14 |
| [massagestolar](https://www.fyndplats.se/kategori/massagestolar) | Klädsel | 75 % | 13 |
| [elbilar-for-barn](https://www.fyndplats.se/kategori/elbilar-for-barn) | Maxlast | 80 % | 13 |
| [pallar](https://www.fyndplats.se/kategori/pallar) | Maxlast | 75 % | 13 |
| [soptunnor](https://www.fyndplats.se/kategori/soptunnor) | Bredd | 68 % | 13 |
| [soptunnor](https://www.fyndplats.se/kategori/soptunnor) | Höjd | 68 % | 13 |
| [barnmobler](https://www.fyndplats.se/kategori/barnmobler) | Höjd | 76 % | 12 |
| [soffbord-smabord](https://www.fyndplats.se/kategori/soffbord-smabord) | Bredd | 79 % | 12 |
| [konstvaxter](https://www.fyndplats.se/kategori/konstvaxter) | Höjd | 82 % | 12 |
| [bokhyllor](https://www.fyndplats.se/kategori/bokhyllor) | Hyllplan | 52 % | 12 |
| [skrivbord](https://www.fyndplats.se/kategori/skrivbord) | Maxlast | 64 % | 12 |
| [soffbord-smabord](https://www.fyndplats.se/kategori/soffbord-smabord) | Djup | 80 % | 11 |
| [soffbord-smabord](https://www.fyndplats.se/kategori/soffbord-smabord) | Höjd | 80 % | 11 |
| [soffbord-smabord](https://www.fyndplats.se/kategori/soffbord-smabord) | Form | 80 % | 11 |
| [massage-aterhamtning](https://www.fyndplats.se/kategori/massage-aterhamtning) | Maxlast | 86 % | 11 |
| [boxningssackar](https://www.fyndplats.se/kategori/boxningssackar) | Vikt | 61 % | 11 |
| [burar-klader-tillbehor](https://www.fyndplats.se/kategori/burar-klader-tillbehor) | Längd | 93 % | 10 |
| [burar-klader-tillbehor](https://www.fyndplats.se/kategori/burar-klader-tillbehor) | Höjd | 93 % | 10 |
| [sangar-sovrum](https://www.fyndplats.se/kategori/sangar-sovrum) | Sängbredd | 58 % | 10 |
| [kontorsstolar](https://www.fyndplats.se/kategori/kontorsstolar) | Sitthöjd | 94 % | 10 |
| [kontorsstolar](https://www.fyndplats.se/kategori/kontorsstolar) | Material | 94 % | 10 |
| [juldekoration](https://www.fyndplats.se/kategori/juldekoration) | Höjd | 86 % | 10 |
| [elkaminer](https://www.fyndplats.se/kategori/elkaminer) | Placering | 64 % | 10 |
| [grill-utekok](https://www.fyndplats.se/kategori/grill-utekok) | Bredd | 74 % | 10 |
| [hundvagnar](https://www.fyndplats.se/kategori/hundvagnar) | Material | 68 % | 9 |
| [badrum-hemtextil](https://www.fyndplats.se/kategori/badrum-hemtextil) | Material | 92 % | 9 |
| [selar-koppel-transport](https://www.fyndplats.se/kategori/selar-koppel-transport) | Material | 79 % | 9 |
| [lek-tillbehor-for-husdjur](https://www.fyndplats.se/kategori/lek-tillbehor-for-husdjur) | Material | 86 % | 9 |
| [koksmaskiner-apparater](https://www.fyndplats.se/kategori/koksmaskiner-apparater) | Bredd | 87 % | 9 |
| [baby-smabarn](https://www.fyndplats.se/kategori/baby-smabarn) | Material | 88 % | 8 |
| [julgranar](https://www.fyndplats.se/kategori/julgranar) | Diameter | 89 % | 8 |
| [solskydd-paviljonger](https://www.fyndplats.se/kategori/solskydd-paviljonger) | Längd | 82 % | 8 |
| [juldekoration](https://www.fyndplats.se/kategori/juldekoration) | Bredd | 88 % | 8 |
| [vaxthus-odling](https://www.fyndplats.se/kategori/vaxthus-odling) | Bredd | 93 % | 8 |
| [snurrfatoljer](https://www.fyndplats.se/kategori/snurrfatoljer) | Sitthöjd | 71 % | 8 |
| [boxningssackar](https://www.fyndplats.se/kategori/boxningssackar) | Höjd | 71 % | 8 |
| [bokhyllor](https://www.fyndplats.se/kategori/bokhyllor) | Maxlast | 68 % | 8 |
| [mat-vattenskalar](https://www.fyndplats.se/kategori/mat-vattenskalar) | Volym | 70 % | 8 |
| [koksmaskiner-apparater](https://www.fyndplats.se/kategori/koksmaskiner-apparater) | Höjd | 89 % | 8 |
| [skrivbord](https://www.fyndplats.se/kategori/skrivbord) | Djup | 76 % | 8 |
| [klostrad](https://www.fyndplats.se/kategori/klostrad) | Bredd | 93 % | 7 |
| [badrumsspeglar](https://www.fyndplats.se/kategori/badrumsspeglar) | Form | 78 % | 7 |
| [eldkorgar-eldstader](https://www.fyndplats.se/kategori/eldkorgar-eldstader) | Höjd | 61 % | 7 |
| [grill-utekok](https://www.fyndplats.se/kategori/grill-utekok) | Höjd | 82 % | 7 |
| [grill-utekok](https://www.fyndplats.se/kategori/grill-utekok) | Material | 82 % | 7 |
| [lek-tillbehor-for-husdjur](https://www.fyndplats.se/kategori/lek-tillbehor-for-husdjur) | Djur | 89 % | 7 |
| [soffbord-smabord](https://www.fyndplats.se/kategori/soffbord-smabord) | Material | 89 % | 6 |
| [skoskap-skobankar](https://www.fyndplats.se/kategori/skoskap-skobankar) | Höjd | 84 % | 6 |
| [skoskap-skobankar](https://www.fyndplats.se/kategori/skoskap-skobankar) | Djup | 84 % | 6 |
| [odlingslador](https://www.fyndplats.se/kategori/odlingslador) | Material | 78 % | 6 |
| [miniugnar-airfryers](https://www.fyndplats.se/kategori/miniugnar-airfryers) | Effekt | 73 % | 6 |
| [tv-bankar](https://www.fyndplats.se/kategori/tv-bankar) | Bredd | 72 % | 5 |
| [tv-bankar](https://www.fyndplats.se/kategori/tv-bankar) | Djup | 72 % | 5 |
| [tv-bankar](https://www.fyndplats.se/kategori/tv-bankar) | Höjd | 72 % | 5 |
| [sittpuffar-fotpallar](https://www.fyndplats.se/kategori/sittpuffar-fotpallar) | Klädsel | 77 % | 5 |
| [solskydd-paviljonger](https://www.fyndplats.se/kategori/solskydd-paviljonger) | Material | 89 % | 5 |
| [skoskap-skobankar](https://www.fyndplats.se/kategori/skoskap-skobankar) | Bredd | 86 % | 5 |
| [vaxthus-odling](https://www.fyndplats.se/kategori/vaxthus-odling) | Höjd | 96 % | 5 |
| [snurrfatoljer](https://www.fyndplats.se/kategori/snurrfatoljer) | Maxlast | 82 % | 5 |
| [kaninburar-marsvinsburar](https://www.fyndplats.se/kategori/kaninburar-marsvinsburar) | Material | 84 % | 5 |
| [badrum-hemtextil](https://www.fyndplats.se/kategori/badrum-hemtextil) | Bredd | 95 % | 5 |
| [utelek-spel](https://www.fyndplats.se/kategori/utelek-spel) | Material | 86 % | 5 |

## 3. Produkterna, per kategori

Varje produkt står en gång per kategori, med de uppgifter den saknar. Sorterat som tabellerna ovan: först kategorierna där få produkter tänder ett nytt filter.

### matbord-stolar (128 produkter)

Filter: Form (40 %), Sittplatser (38 %), Klädsel (38 %), Sitthöjd (35 %), Djup (74 %, syns), Höjd (78 %, syns), Bredd (79 %, syns)

- [Litet matbord 60 × 60 cm med pelarfot](https://www.fyndplats.se/produkt/litet-matbord-60x60-cm-pelarfot): Form, Djup, Höjd
- [Matbord 180 × 90 cm för åtta, cremevitt](https://www.fyndplats.se/produkt/matbord-180x90-cm-atta-personer): Form, Djup, Höjd
- [Utdragbart matbord 70/140 × 80 cm — fyra vardag, sex vid gäster](https://www.fyndplats.se/produkt/utdragbart-matbord-70-140-cm): Form, Djup, Höjd
- [Matbord 180 cm för sex med svart stålstomme och fotpinne](https://www.fyndplats.se/produkt/matbord-180-cm-sex-personer): Form, Djup, Bredd
- [Matbord i massiv furu 150 × 80 cm, lantstil](https://www.fyndplats.se/produkt/matbord-massiv-furu-150x80-cm): Form, Djup, Höjd
- [Köksbord i massiv furu 120 × 75 cm, natur med vita ben](https://www.fyndplats.se/produkt/koksbord-massiv-furu-120-cm): Form, Djup
- [Barbord med två pallar 105 cm – kompakt set med fotstöd](https://www.fyndplats.se/produkt/barbord-tva-pallar-105-cm): Form, Klädsel, Sitthöjd, Djup, Höjd, Bredd
- [Runt glasbord Ø70 cm – matbord med härdat glas och kromad pelarfot, 74,5 cm högt](https://www.fyndplats.se/produkt/runt-glasbord-70-cm-kromad-pelarfot): Sittplatser
- [Fällbord med hyllor – matbord för små utrymmen, 20 cm djupt hopfällt](https://www.fyndplats.se/produkt/fallbord-med-hyllor-matbord-sma-utrymmen): Sittplatser
- [Runt matbord i glas Ø80 cm – härdat glas och svart korsfot i stål, bär 30 kg](https://www.fyndplats.se/produkt/runt-matbord-glas-80-cm-svart-korsfot): Sittplatser
- [Klaffbord 120 × 80 cm på hjul i grå betonglook – fälls ihop till 26 cm](https://www.fyndplats.se/produkt/hopfallbart-matbord-120x80-gra-hjul): Sittplatser
- [Runt matbord Ø 100 cm med gallerhylla – Z-ben i svart stål](https://www.fyndplats.se/produkt/runt-matbord-100-cm): Sittplatser
- [Runt matbord Ø 80 cm – vit skiva på korsfot i stål, bär 40 kg](https://www.fyndplats.se/produkt/runt-matbord-80-cm): Sittplatser
- [Utdragbart matbord 120–160 cm i ekton – iläggsskivan bor i bordet](https://www.fyndplats.se/produkt/utdragbart-matbord-ekton): Sittplatser
- [Barbord höj- och sänkbart 70–90 cm med snurrbar skiva Ø61](https://www.fyndplats.se/produkt/barbord-hoj-och-sankbart-70-90-cm): Sittplatser, Djup, Bredd
- [Matbord i glas 75 × 75 cm – härdad skiva på 6 mm, bär 80 kg](https://www.fyndplats.se/produkt/matbord-i-glas-75-cm): Sittplatser
- [Matbord 120 cm i svart härdat glas – 6 mm skiva, bär 80 kg](https://www.fyndplats.se/produkt/matbord-120-cm-svart-glas): Sittplatser
- [Klaffbord 120 × 80 cm på hjul – vit skiva och teakfärg, 15 cm djupt hopfällt](https://www.fyndplats.se/produkt/klaffbord-120x80-pa-hjul-vit-teakfarg): Sittplatser
- [Klaffbord med fyra hyllfack, 169 × 60 cm – ekfärg och vitt, 33 cm hopfällt](https://www.fyndplats.se/produkt/klaffbord-fyra-hyllfack-169-cm-ekfarg-vit): Sittplatser
- [Runt barbord, höj- och sänkbart 67–93 cm – svart konstläderskiva och krom](https://www.fyndplats.se/produkt/runt-barbord-hoj-och-sankbart): Sittplatser
- [Klaffbord med förvaring 120 cm – två lådor, skåp och sex hjul](https://www.fyndplats.se/produkt/klaffbord-forvaring-120-cm): Sittplatser
- [Vridbart barbord med förvaring 150 cm – glasskåp och sidomodul](https://www.fyndplats.se/produkt/vridbart-barbord-forvaring-150-cm): Sittplatser
- [Matbänk i massiv furu, 150 cm – sittbänk för tre, naturfärgad, bär 330 kg](https://www.fyndplats.se/produkt/matbank-massiv-furu-150-cm): Klädsel, Sitthöjd
- [Barstol med gaslyft, sitthöjd 55–76 cm – svart sits, vridbar 360°](https://www.fyndplats.se/produkt/barstol-gaslyft-svart-silver): Klädsel, Sitthöjd
- [Matstolar 2-pack med lammullskänsla – svarta ben, bär 120 kg](https://www.fyndplats.se/produkt/matstolar-2-pack-lammullskansla): Klädsel, Sitthöjd
- [Matgrupp 3 delar — ovalt bord 80 cm med hylla och två stolar](https://www.fyndplats.se/produkt/matgrupp-ovalt-bord-80-cm-hylla): Klädsel, Sitthöjd
- [Barbord 100 cm med två stoppade pallar – ryggstöd och grå stenlook](https://www.fyndplats.se/produkt/barbord-100-cm-stoppade-pallar-ryggstod): Klädsel
- [Barstolar 2-pack i almträ med sadelsits – sitthöjd 61–82 cm, vridbara](https://www.fyndplats.se/produkt/barstolar-2-pack-almtra-sadelsits): Klädsel, Djup, Höjd, Bredd
- [Barstolar 2-pack i svart fleece – sitthöjd 68 cm och rund sits Ø46 cm](https://www.fyndplats.se/produkt/barstolar-2-pack-fleece-rund-sits-68): Klädsel
- [Barbord 121,5 cm med vinställ och glashållare – två barpallar ingår](https://www.fyndplats.se/produkt/barbord-vinstall-tva-barpallar): Klädsel, Sitthöjd
- [Barstolar 2-pack i gummiträ – sitthöjd 60 cm, X-rygg i ek och vitt](https://www.fyndplats.se/produkt/barstolar-2-pack-gummitra-sitthojd-60): Klädsel
- [Barbord med två pallar 80 cm – grå stenlook, sitthöjd 57 cm](https://www.fyndplats.se/produkt/barbord-tva-pallar-80-cm-gra): Klädsel
- [Barstolar 2-pack i trä och svart stål – sitthöjd 66 cm, armlösa](https://www.fyndplats.se/produkt/barstolar-2-pack-tra-svart-stal-66): Klädsel
- [Barbord 100 cm med två hyllplan och två pallar – skivan tål 170 kg](https://www.fyndplats.se/produkt/barbord-100-cm-tva-hyllplan-pallar): Klädsel
- [Barstolar 2-pack i furu med korsrygg](https://www.fyndplats.se/produkt/barstolar-2-pack-furu-korsrygg): Klädsel, Djup, Höjd, Bredd
- [Matstolar i furu 2-pack – plan sits och spjälryggstöd, 90 cm](https://www.fyndplats.se/produkt/matstolar-i-furu-2-pack): Klädsel
- [Köksstolar i furu, 2-pack, vit](https://www.fyndplats.se/produkt/koksstolar-furu-2-pack-vit): Klädsel, Sitthöjd
- [Matgrupp 5 delar — furubord 118 cm och fyra stolar](https://www.fyndplats.se/produkt/matgrupp-furu-bord-118-cm): Klädsel, Sitthöjd
- [Barbord i marmoroptik 100 cm med två pallar – sitthöjd 60 cm](https://www.fyndplats.se/produkt/barbord-marmoroptik-100-cm-tva-pallar): Klädsel
- [Barstolar 2-pack i gul konstrotting](https://www.fyndplats.se/produkt/barstolar-2-pack-gul-konstrotting): Klädsel, Djup, Höjd, Bredd
- [Matgrupp 3 delar — klaffbord 70/110 cm och två stolar](https://www.fyndplats.se/produkt/matgrupp-klaffbord-110-cm): Klädsel, Sitthöjd
- [Matgrupp 3 delar — smalt bord 90 × 47 cm och två stolar](https://www.fyndplats.se/produkt/matgrupp-smalt-bord-90x47-cm): Klädsel, Sitthöjd
- [Barbord med fyra pallar 100 cm – ljus ekoptik, femdelat set](https://www.fyndplats.se/produkt/barbord-fyra-pallar-ljus-ekoptik): Klädsel
- [Barbord med fyra pallar 100 cm – rustikbrun träoptik, femdelat set](https://www.fyndplats.se/produkt/barbord-fyra-pallar-rustikbrun): Klädsel
- [Barbord med hylla och två pallar 80 cm – vit ram, skiva i ekoptik](https://www.fyndplats.se/produkt/barbord-hylla-tva-pallar-vit-ekoptik): Klädsel
- [Barbord 89 cm med två stolar med ryggstöd – sitthöjd 64 cm](https://www.fyndplats.se/produkt/barbord-89-cm-tva-stolar-ryggstod): Klädsel
- [Matgrupp 3 delar — kvadratiskt bord 60 cm och två stolar](https://www.fyndplats.se/produkt/matgrupp-kvadratiskt-bord-60-cm): Klädsel
- [Matgrupp 5 delar — bord 100 cm och fyra stolar i ek och svart](https://www.fyndplats.se/produkt/matgrupp-4-stolar-bord-100-cm): Klädsel
- [Matgrupp 5 delar – bord 100 × 63 cm och fyra stolar i trämönster](https://www.fyndplats.se/produkt/matgrupp-5-delar-bord-fyra-stolar): Klädsel, Sitthöjd
- [Matgrupp 3 delar — bord 70 × 70 cm och två stolar i ekton](https://www.fyndplats.se/produkt/matgrupp-bord-70-cm-vita-ben): Klädsel
- [Barbord med två pallar 119 cm – låda, hyllor och flaskställ](https://www.fyndplats.se/produkt/barbord-med-tva-pallar-119-cm): Klädsel, Sitthöjd
- [Barstolar med ryggstöd 2-pack – sitthöjd 60 cm, fotstöd, svart PU](https://www.fyndplats.se/produkt/barstolar-med-ryggstod-svart-2-pack): Klädsel, Djup, Höjd, Bredd
- [Matstolar 2-pack – grå plaststolar med träben och ergonomisk rygg, 120 kg](https://www.fyndplats.se/produkt/matstolar-2-pack): Klädsel
- [Sittpallar 4-pack stapelbara i mörkgrönt – rund sits, bär 120 kg](https://www.fyndplats.se/produkt/sittpallar-4-pack-stapelbara-morkgrona): Sitthöjd
- [Matstolar 2-pack i linnelook – ben i gummiträ, sitthöjd 48 cm](https://www.fyndplats.se/produkt/matstolar-2-pack-linnelook-gummitra): Sitthöjd
- [Barstolar 2-pack, höjdjusterbara 82–104 cm, svart](https://www.fyndplats.se/produkt/barstolar-2-pack-hojdjusterbara-svart): Sitthöjd
- [Smala matstolar 2-pack, 42 cm breda](https://www.fyndplats.se/produkt/matstolar-2-pack-smala-42-cm): Sitthöjd, Djup, Höjd, Bredd
- [Matstolar 2-pack i manchester med armstöd](https://www.fyndplats.se/produkt/matstolar-2-pack-manchester-armstod): Sitthöjd, Djup, Höjd, Bredd
- [Matstolar 2-pack i cremevit tyg med tjock sits](https://www.fyndplats.se/produkt/matstolar-2-pack-cremevit-tjock-sits): Sitthöjd, Djup, Höjd, Bredd
- [Matstolar 2-pack med rundad rygg, beige](https://www.fyndplats.se/produkt/matstolar-2-pack-rundad-rygg-beige): Sitthöjd, Djup, Höjd, Bredd
- [Barstolar 2-pack i konstläder – svarta, snurrbara, sitthöjd 68 cm](https://www.fyndplats.se/produkt/barstolar-konstlader-2-pack-68-cm): Sitthöjd
- [Matgrupp 3 delar — bord 80 × 60 cm och två stoppade stolar](https://www.fyndplats.se/produkt/matgrupp-bord-80-cm-stoppade-stolar): Sitthöjd
- [Stapelbara pallar 4-pack, grå sits, ben i böjträ](https://www.fyndplats.se/produkt/stapelbara-pallar-4-pack-gra-sits): Sitthöjd
- [Stapelbara pallar 4-pack, cremevit, böjträben](https://www.fyndplats.se/produkt/stapelbara-pallar-4-pack-cremevit): Sitthöjd
- [Matstolar 4-pack i grå sammet](https://www.fyndplats.se/produkt/matstolar-4-pack-gra-sammet): Sitthöjd, Djup, Höjd, Bredd
- [Två sittpallar i gräddvit plisserad sammet – förvaring i den stora, bär 120 kg](https://www.fyndplats.se/produkt/sittpallar-plisserad-sammet-2-pack): Sitthöjd
- [Matgrupp 5 delar — glasbord 120 cm och fyra stolar](https://www.fyndplats.se/produkt/matgrupp-glasbord-120-cm): Sitthöjd
- [Matstolar 2-pack med stålben, ljusgrå](https://www.fyndplats.se/produkt/matstolar-2-pack-stalben-ljusgra): Sitthöjd, Djup, Höjd, Bredd
- [Matstolar 2-pack i grå sammetslook – skalformad rygg och ben i gummiträ](https://www.fyndplats.se/produkt/matstolar-2-pack-gra-sammetslook-gummitra): Sitthöjd
- [Matstolar 2-pack med armstöd och träben, svart](https://www.fyndplats.se/produkt/matstolar-2-pack-armstod-traben-svart): Sitthöjd, Djup, Höjd, Bredd
- [Matstolar 2-pack i linnelook – tunnformad rygg, ben i gummiträ](https://www.fyndplats.se/produkt/matstolar-tunnform-linnelook-2-pack): Sitthöjd
- [Matstolar 2-pack med medaljongrygg, grå](https://www.fyndplats.se/produkt/matstolar-2-pack-medaljongrygg-gra): Sitthöjd, Djup, Höjd, Bredd
- [Matstolar 2-pack med medaljongrygg, cremevit](https://www.fyndplats.se/produkt/matstolar-2-pack-medaljongrygg-cremevit): Sitthöjd, Djup, Höjd, Bredd
- [Karmstol med medaljongrygg i kalkat trä](https://www.fyndplats.se/produkt/karmstol-medaljongrygg-kalkat-tra): Sitthöjd, Djup, Höjd, Bredd
- [Matstolar 2-pack i konstläder – böjträ och metallben, svart](https://www.fyndplats.se/produkt/matstolar-2-pack-konstlader-svart): Sitthöjd
- [Barstolar höj- och sänkbara 2-pack – svängbara 360°, ryggstöd och fotstöd](https://www.fyndplats.se/produkt/barstolar-hoj-och-sankbara-2-pack-svangbara): Sitthöjd, Djup, Höjd, Bredd
- [Barstolar 2-pack i chenille, 48 cm bred sits](https://www.fyndplats.se/produkt/barstolar-2-pack-chenille-48-cm-sits): Djup, Höjd, Bredd
- [Barstolar 2-pack med svängd rygg, 39 cm sits](https://www.fyndplats.se/produkt/barstolar-2-pack-svangd-rygg-39-cm-sits): Djup, Höjd, Bredd
- [Kvadratiskt matbord 69 × 69 cm i massivt gummiträ](https://www.fyndplats.se/produkt/kvadratiskt-matbord-69-cm-gummitra): Djup
- [Glasmatbord runt 70 cm i 8 mm härdat glas med korsade ben](https://www.fyndplats.se/produkt/glasmatbord-runt-70-cm-hardat-glas): Djup, Bredd
- [Barstolar 2-pack med skalrygg, 59 cm breda](https://www.fyndplats.se/produkt/barstolar-2-pack-skalrygg-59-cm): Djup, Höjd, Bredd
- [Barstolar 2-pack i rutstickat konstläder](https://www.fyndplats.se/produkt/barstolar-2-pack-rutstickat-konstlader): Djup, Höjd, Bredd
- [Barstolar 2-pack i linnelook med knappstoppad rygg](https://www.fyndplats.se/produkt/barstolar-2-pack-knappstoppad-rygg): Djup, Höjd, Bredd
- [Stapelbara pallar 4-pack – rund sammetssits Ø 40 cm, 46 cm hög](https://www.fyndplats.se/produkt/stapelbara-pallar-4-pack): Djup, Höjd, Bredd
- [Fällstolar 4-pack i linnelookat tyg – sitthöjd 45 cm, 120 kg](https://www.fyndplats.se/produkt/fallstolar-linnelook-4-pack): Djup, Höjd, Bredd
- [Fällstolar 4-pack i konstläder – sitthöjd 45 cm, 120 kg](https://www.fyndplats.se/produkt/fallstolar-konstlader-4-pack): Djup, Höjd, Bredd

### soffor-baddsoffor (59 produkter)

Filter: Djup (59 %), Bredd (63 %, syns), Sittplatser (54 %, syns), Material (68 %, syns), Klädsel (75 %, syns)

- [Bäddsoffa grå 188 cm – bädd 188 × 140 cm, förvaring och manchesterlook](https://www.fyndplats.se/produkt/baddsoffa-gra-188-cm-forvaring): Djup, Bredd, Sittplatser, Material
- [Bäddsoffa olivgrön 188 cm – bädd 188 × 140 cm, förvaring och manchesterlook](https://www.fyndplats.se/produkt/baddsoffa-olivgron-188-cm-forvaring): Djup, Bredd, Sittplatser, Material
- [Bäddsoffa beige 188 cm – bädd 188 × 140 cm, förvaring och manchesterlook](https://www.fyndplats.se/produkt/baddsoffa-beige-188-cm-forvaring): Djup, Bredd, Sittplatser, Material
- [Modulsoffa i U-form 369 cm – byggs om till bäddyta 248 × 187 cm](https://www.fyndplats.se/produkt/modulsoffa-u-form-369-cm-baddyta): Djup, Bredd, Sittplatser, Material, Klädsel
- [Tresitssoffa 260 cm i krämvit chenille – 40 cm sitsdyna, utan ben](https://www.fyndplats.se/produkt/tresitssoffa-260-cm-kramvit-chenille): Djup, Bredd
- [Modulsoffa 306 cm i manchesterlook – U-form med förvaring och två pallar](https://www.fyndplats.se/produkt/modulsoffa-306-cm-u-form-forvaring): Djup, Bredd, Material
- [Hörnsoffa grå 256 cm med 42 cm sittdyna – ramlös och utan montering](https://www.fyndplats.se/produkt/hornsoffa-gra-256-cm-42-cm-sittdyna): Djup, Bredd, Sittplatser, Material
- [Tresitssoffa 248 cm i mörkgrå chenille – 104 cm djup och 42 cm sits](https://www.fyndplats.se/produkt/tresitssoffa-248-cm-morkgra-chenille): Djup, Bredd
- [Bäddsoffa 167 cm med utdragbar bädd – 186 × 142 cm, justerbar rygg](https://www.fyndplats.se/produkt/baddsoffa-167-cm-utdragbar-badd): Djup, Bredd, Material, Klädsel
- [U-soffa 311 cm i manchester – två schäslonger och fickfjädrar](https://www.fyndplats.se/produkt/u-soffa-311-cm-tva-schaslonger): Djup, Bredd, Sittplatser, Material
- [Sofabädd 157 cm i manchesterlook – 190 cm lång bädd och sidofickor](https://www.fyndplats.se/produkt/sofabadd-157-cm-manchester-190-cm): Djup, Bredd, Material
- [Hörnsoffa 292 cm med fjädrande sits – L-form 224 cm och lös puff](https://www.fyndplats.se/produkt/hornsoffa-292-224-cm-fjadrande-sits): Djup, Bredd, Material, Klädsel
- [Hörnbäddsoffa mörkgrå 205 cm – bädd 178 × 123 cm och vändbar schäslong](https://www.fyndplats.se/produkt/hornbaddsoffa-morkgra-205-cm): Djup, Bredd, Sittplatser, Material
- [Hörnbäddsoffa beige 205 cm – bädd 178 × 123 cm och vändbar schäslong](https://www.fyndplats.se/produkt/hornbaddsoffa-beige-205-cm): Djup, Bredd, Sittplatser, Material
- [Hörnsoffa med bäddfunktion och förvaring – mörkgrå, bädd 173 × 101 cm](https://www.fyndplats.se/produkt/hornsoffa-baddfunktion-forvaring-morkgra): Djup, Sittplatser
- [Hörnsoffa 242 cm med vändbar schäslong – beige, bär 400 kg](https://www.fyndplats.se/produkt/hornsoffa-242-cm-vandbar-schaslong): Djup, Bredd, Sittplatser, Material, Klädsel
- [Modulsoffa i mörkgrå manchester 267 cm – bäddyta 168 × 143 cm](https://www.fyndplats.se/produkt/modulsoffa-morkgra-manchester-267-cm): Djup, Bredd, Sittplatser, Material
- [Tresitssoffa 212 cm i mörkgrå manchester – bär 450 kg](https://www.fyndplats.se/produkt/tresitssoffa-212-cm-morkgra-manchester): Djup, Bredd
- [Hörnsoffa gräddvit 241 cm i manchester – vändbar schäslong, bär 450 kg](https://www.fyndplats.se/produkt/hornsoffa-graddvit-241-cm-manchester): Djup, Bredd, Sittplatser, Material
- [Tresitssoffa 227 cm i krämvit manchester – fjäderkärna och åtta ben](https://www.fyndplats.se/produkt/tresitssoffa-227-cm-kramvit-manchester): Djup, Bredd
- [Tresitssoffa 196 cm i antracitgrå manchester – med lös puff](https://www.fyndplats.se/produkt/tresitssoffa-196-cm-antracitgra-manchester-puff): Djup, Bredd, Material
- [Bäddsoffa 4-i-1 med hjul – bädd 120 × 191 cm och rygg i tre lägen](https://www.fyndplats.se/produkt/baddsoffa-4-i-1-hjul-120x191): Djup, Material, Klädsel
- [Bäddsoffa gråbrun 141 cm – rygg i tre lägen och bädd på 191 × 141 cm](https://www.fyndplats.se/produkt/baddsoffa-grabrun-141-cm): Djup, Bredd, Material, Klädsel
- [Hörnsoffa 186 cm med lös schäslongmodul – mörkgrå linnelook](https://www.fyndplats.se/produkt/hornsoffa-186-cm-los-schaslongmodul): Djup, Bredd, Sittplatser
- [Barnsoffa i jordgubbsdesign – rosa, med två kuddar, 90 cm](https://www.fyndplats.se/produkt/barnsoffa-jordgubbsdesign-90-cm): Sittplatser, Klädsel
- [Bäddsoffa helt i skum, 203 cm — bädd 203 × 121 cm utan montering](https://www.fyndplats.se/produkt/baddsoffa-skum-203-utan-montering): Sittplatser, Klädsel
- [Hopfällbar golvfåtölj med kudde, bäddbar till soffa och madrass](https://www.fyndplats.se/produkt/hopfallbar-golvfatolj-kudde-baddbar-soffa-madrass): Sittplatser
- [Golvsoffa som bäddas ut till 180 cm – grå, ryggen i fem lägen](https://www.fyndplats.se/produkt/golvsoffa-baddbar-180-cm-gra): Sittplatser
- [Golvsoffa som bäddas ut till 180 cm – mörkgrå, ryggen i fem lägen](https://www.fyndplats.se/produkt/golvsoffa-baddbar-180-cm-morkgra): Sittplatser
- [Golvsoffa som bäddas ut till 180 cm – himmelsblå, ryggen i fem lägen](https://www.fyndplats.se/produkt/golvsoffa-baddbar-180-cm-himmelsbla): Sittplatser
- [Hörnsoffa 193 × 136 cm i linnelook med vändbar schäslong](https://www.fyndplats.se/produkt/hornsoffa-193x136-linnelook-vandbar-schaslong): Sittplatser
- [Hörnsoffa med schäslong 230 cm – vändbar, blå chenille](https://www.fyndplats.se/produkt/hornsoffa-schaslong-230-cm-vandbar-bla-chenille): Sittplatser
- [Hörnsoffa beige 216 cm med förvaring i ottomanen – manchester, bär 400 kg](https://www.fyndplats.se/produkt/hornsoffa-beige-216-cm-forvaring-ottoman): Material
- [Reclinersoffa 2-sits i grått tyg – varje sits lutas för sig, med fickfjädrar](https://www.fyndplats.se/produkt/reclinersoffa-2-sits-gra-fickfjadrar): Klädsel
- [Sidobord C-form 30 cm djupt – skjuts in under soffan, guldram](https://www.fyndplats.se/produkt/sidobord-c-form): Klädsel
- [2-sitssoffa 137 cm i sherpafleece – gräddvit, bär 220 kg](https://www.fyndplats.se/produkt/2-sitssoffa-137-cm-sherpafleece): Klädsel
- [Tvåsitssoffa 130 cm i krämvitt med gummiträben och 18 cm fri höjd](https://www.fyndplats.se/produkt/tvasitssoffa-130-kramvit-gummitraben): Klädsel
- [Bäddsoffa för två i ljusgrå mockalook – bädd 185 × 105 cm och rygg i fem vinklar](https://www.fyndplats.se/produkt/baddsoffa-for-tva-ljusgra-mockalook-185-cm): Klädsel
- [Barnsoffa 77 cm för två barn – rosa, bär 80 kg](https://www.fyndplats.se/produkt/barnsoffa-77-cm-tva-barn-rosa): Klädsel
- [Barnsoffa 77 cm för två barn – grå, bär 80 kg](https://www.fyndplats.se/produkt/barnsoffa-77-cm-tva-barn-gra): Klädsel

### hundvagnar (28 produkter)

Filter: Vikt (57 %), Material (68 %, syns)

- [Hundvagn upp till 4 kg, röd – fyra hjul, sufflett och korg](https://www.fyndplats.se/produkt/hundvagn-4-kg-rod): Vikt, Material
- [Hundvagn upp till 4 kg, grå – fyra hjul, sufflett och korg](https://www.fyndplats.se/produkt/hundvagn-4-kg-gra): Vikt, Material
- [Hundvagn upp till 4 kg, blå – fyra hjul, sufflett och korg](https://www.fyndplats.se/produkt/hundvagn-4-kg-bla): Vikt, Material
- [Hundvagn med korg upp till 10 kg, röd – tre hjul och kudde](https://www.fyndplats.se/produkt/hundvagn-med-korg-rod): Vikt
- [Hundvagn med korg upp till 10 kg, ljusgrå – tre hjul](https://www.fyndplats.se/produkt/hundvagn-med-korg-ljusgra): Vikt
- [Hundvagn med korg upp till 10 kg, dammrosa – tre hjul](https://www.fyndplats.se/produkt/hundvagn-med-korg-dammrosa): Vikt
- [Hundvagn med korg upp till 10 kg, blå – tre hjul och kudde](https://www.fyndplats.se/produkt/hundvagn-med-korg-bla): Vikt
- [Cykelvagn för hund 2-i-1 – max 20 kg och 50 cm kroppslängd](https://www.fyndplats.se/produkt/cykelvagn-hund-2-i-1-20-kg): Vikt
- [Hundvagn hopfällbar – sufflett, broms & förvaringskorg för liten hund](https://www.fyndplats.se/produkt/hundvagn-hopfallbar-liten-hund-sufflett-broms): Vikt
- [Cykelvagn för hund – hopfällbar, för små & medelstora hundar](https://www.fyndplats.se/produkt/cykelvagn-for-hund-hopfallbar): Vikt
- [Cykelvagn för hund 2-i-1 – även hundvagn, upp till 45 kg](https://www.fyndplats.se/produkt/cykelvagn-for-hund-2-i-1-hundvagn): Vikt
- [Hundvagn för liten hund – hopfällbar med justerbart handtag, max 4 kg](https://www.fyndplats.se/produkt/hundvagn-liten-hund): Vikt
- [Hundvagn för mellanstor hund upp till 25 kg – ljusgrå, 93 cm liggyta](https://www.fyndplats.se/produkt/hundvagn-mellanstor-hund-25-kg-ljusgra): Material
- [Hundvagn för mellanstor hund upp till 25 kg – mörkgrön, 93 cm liggyta](https://www.fyndplats.se/produkt/hundvagn-mellanstor-hund-25-kg-morkgron): Material
- [Hundvagn för mellanstor hund upp till 25 kg – grå, 93 cm liggyta](https://www.fyndplats.se/produkt/hundvagn-mellanstor-hund-25-kg-gra): Material
- [Hundvagn för mellanstor hund upp till 25 kg – senapsgul, 93 cm liggyta](https://www.fyndplats.se/produkt/hundvagn-mellanstor-hund-25-kg-senapsgul): Material
- [Hundvagn för mellanstor hund upp till 25 kg – svart och röd, 93 cm liggyta](https://www.fyndplats.se/produkt/hundvagn-mellanstor-hund-25-kg-svart-rod): Material
- [Hundvagn för 30 kg som fälls ihop i ett steg – 85 cm liggyta](https://www.fyndplats.se/produkt/hundvagn-30-kg-ett-stegs-hopfallning): Material

### elkaminer (28 produkter)

Filter: Effekt (57 %), Placering (64 %, syns)

- [Elektrisk väggkamin 65 × 52 cm – LED-lågor i sju färger](https://www.fyndplats.se/produkt/elektrisk-vaggkamin-65x52-cm-led-lagor): Effekt
- [Väggkamin 127 cm med 111 cm fönster – häng eller bygg in](https://www.fyndplats.se/produkt/vaggkamin-127-cm-inbyggnad): Effekt
- [Elkamin med vit omramning 96,5 cm – bara 22 cm djup](https://www.fyndplats.se/produkt/elkamin-omramning-96-cm-rak): Effekt, Placering
- [Elkamin 74 cm med glas på tre sidor – högst av dem](https://www.fyndplats.se/produkt/elkamin-74-cm-glas-tre-sidor): Effekt
- [Elkamin 74 cm med öppet vedfack under eldstaden](https://www.fyndplats.se/produkt/elkamin-74-cm-vedfack): Effekt
- [Elkamin svart med spröjsat fönster – ställbar låga och värme](https://www.fyndplats.se/produkt/elkamin-svart-sprojsat-fonster): Effekt
- [Elkamin med vit omramning 80,5 cm – öppen hylla ovanför](https://www.fyndplats.se/produkt/elkamin-omramning-80-cm-hylla): Effekt, Placering
- [Cylindrisk elkamin 64,5 cm – rund och lika från alla håll](https://www.fyndplats.se/produkt/elkamin-cylindrisk-64-cm): Effekt, Placering
- [Minielkamin 31 cm på ben – metall, härdat glas och tippskydd](https://www.fyndplats.se/produkt/minielkamin-31-cm-ben-metall): Effekt, Placering
- [Elkamin vit 45 cm med öppningsbar lucka – dimbar låga](https://www.fyndplats.se/produkt/elkamin-vit-45-cm-oppningsbar-lucka): Effekt, Placering
- [Elkamin 45 cm bred med öppningsbar lucka – dimbar låga](https://www.fyndplats.se/produkt/elkamin-45-cm-oppningsbar-lucka): Effekt, Placering
- [Elkamin i guld 59,2 cm – enda guldfärgade i sortimentet](https://www.fyndplats.se/produkt/elkamin-guld-59-cm): Effekt
- [Elkamin i konsolmodell med 9 lågfärger – vit, 1800 W](https://www.fyndplats.se/produkt/elkamin-konsol-9-lagfarger-vit): Placering
- [Elkamin brun med hylla, 80 cm – 1800 W, 3D-lågor, fjärrkontroll och timer](https://www.fyndplats.se/produkt/elkamin-brun-hylla-80-cm-fjarrkontroll): Placering
- [Elektrisk kamin med vit omramning 98 cm – 2000 W och veckotimer](https://www.fyndplats.se/produkt/elektrisk-kamin-vit-omramning-98-cm): Placering
- [Minielkamin 34 cm bred – 1200 W och låga utan värme](https://www.fyndplats.se/produkt/minielkamin-34-cm-1200-w): Placering

### tradgardsskotsel-bevattning (27 produkter)

Filter: Bredd (59 %), Höjd (52 %), Djup (48 %)

- [Trädgårdsskåp grått 182 cm med fällbart bord – krokar och markpinnar](https://www.fyndplats.se/produkt/tradgardsskap-gratt-182-cm-fallbart-bord): Bredd, Höjd, Djup
- [Trädgårdsskåp 139 cm brett med dubbeldörr – asfalttak och bord ingår](https://www.fyndplats.se/produkt/tradgardsskap-139-cm-brett-dubbeldorr): Bredd, Höjd, Djup
- [Trädgårdsskåp 191,5 cm med sadeltak – två dörrar som öppnas var för sig](https://www.fyndplats.se/produkt/tradgardsskap-191-cm-sadeltak-tva-dorrar): Bredd, Höjd, Djup
- [Trädgårdsskåp i trä 115 cm – grått med vita lister, två hyllplan](https://www.fyndplats.se/produkt/tradgardsskap-tra-115-cm-gratt): Bredd, Höjd, Djup
- [Trädgårdsskåp i trä 115 cm – naturträ, två hyllplan och öppet fack](https://www.fyndplats.se/produkt/tradgardsskap-tra-115-cm-naturtra): Bredd, Höjd, Djup
- [Trädgårdsskåp 160 cm med lamelldörrar – tre fack och 20 kg per fack](https://www.fyndplats.se/produkt/tradgardsskap-160-cm-lamelldorrar): Bredd, Höjd, Djup
- [Trädgårdsskåp 77 cm brett med fönster – tre hörnhyllor och asfalttak](https://www.fyndplats.se/produkt/tradgardsskap-77-cm-fonster-hornhyllor): Bredd, Höjd, Djup
- [Droppslang för trädgård & häck – svettslang bevattning 30/50/100 m](https://www.fyndplats.se/produkt/droppslang-svettslang-tradgard-bevattning): Bredd, Höjd, Djup
- [Gödselgrep 5 klor med glasfiberskaft – 145 cm](https://www.fyndplats.se/produkt/godselgrep-5-klor-glasfiber): Bredd, Höjd, Djup
- [Snökäppar glasfiber 30-pack, 121 cm – reflekterande plogkäppar för infart](https://www.fyndplats.se/produkt/snokappar-glasfiber): Bredd, Djup
- [Slangvagn för trädgård med hjul och vev](https://www.fyndplats.se/produkt/slangvagn-tradgard): Bredd, Höjd, Djup
- [Transportvagn 2-i-1 med nätsidor – 408 kg, 25 cm hjul](https://www.fyndplats.se/produkt/transportvagn-2-i-1-natsidor): Höjd, Djup
- [Trapetsplåt 12-pack – galvaniserad takplåt 129x45 cm för skjul och carport](https://www.fyndplats.se/produkt/trapetsplat-12-pack-galvaniserad-takplat-129x45): Höjd, Djup
- [Insynsskydd för staket – PVC-remsa 50 m × 19 cm, mörkgrå med 30 klämmor](https://www.fyndplats.se/produkt/insynsskydd-staket-pvc-remsa-morkgra): Höjd, Djup

### vattenkokare-brodrostar (20 produkter)

Filter: Volym (55 %)

- [Brödrost för två skivor med sju rostlägen – värmegaller och upptining, svart](https://www.fyndplats.se/produkt/brodrost-tva-skivor-sju-rostlagen): Volym
- [Vattenkokare i glas 1,7 l med tesil – fem temperaturlägen, varmhållning, 2200 W](https://www.fyndplats.se/produkt/vattenkokare-glas-tesil-temperaturval): Volym
- [Brödrost för fyra skivor med sju rostningslägen och smulbricka](https://www.fyndplats.se/produkt/brodrost-fyra-skivor-sju-lagen): Volym
- [Vattenkokare, brödrost och äggkokare i set, svart](https://www.fyndplats.se/produkt/vattenkokare-brodrost-aggkokare-set-svart): Volym
- [Frukostset med LED-display – vattenkokare 40–100 °C och brödrost](https://www.fyndplats.se/produkt/frukostset-led-display-gradde): Volym
- [Frukostset med varmhållning – svart vattenkokare och brödrost](https://www.fyndplats.se/produkt/frukostset-varmhallning-svart): Volym
- [Brödrost för fyra skivor med vågmönster – sju lägen och högt lyft](https://www.fyndplats.se/produkt/brodrost-fyra-skivor-gra-vagmonster): Volym
- [Rosa frukostset med bikakemönster – vattenkokare och brödrost](https://www.fyndplats.se/produkt/frukostset-rosa-bikakemonster): Volym
- [Frukostset med bikakemönster i koppar och svart – kokare och brödrost](https://www.fyndplats.se/produkt/frukostset-bikakemonster-vattenkokare): Volym

### nattduksbord (19 produkter)

Filter: Lådor (37 %)

- [Nattduksbord med rottinglåda i ljust trä – öppen hylla, 40 × 40 × 48,4 cm](https://www.fyndplats.se/produkt/nattduksbord-rotting-ljust-tra): Lådor
- [Nattduksbord med dold låda – svart, öppet fack med mellanvägg, 40 × 30 × 46 cm](https://www.fyndplats.se/produkt/nattduksbord-dold-lada-svart): Lådor
- [Nattduksbord på hjul, tre hyllor – vitt med grå betonglook, 35 × 29,5 × 65,5 cm](https://www.fyndplats.se/produkt/nattduksbord-hjul-tre-hyllor-vit-gra): Lådor
- [Nattduksbord i stål 40 cm vitt – dörr, flyttbar hylla och 15,8 cm frihöjd](https://www.fyndplats.se/produkt/nattduksbord-stal-40-cm-vitt): Lådor
- [Sängbord med eluttag och USB-C – två hyllor, fack och sidoficka, rustikt brunt](https://www.fyndplats.se/produkt/sangbord-eluttag-usb-rustikt-brun): Lådor
- [Nattduksbord med lamellerade skjutdörrar – ekfärg och svarta stålben, 48 cm](https://www.fyndplats.se/produkt/nattduksbord-lamellerade-skjutdorrar-ek): Lådor
- [Smala sängbord 2-pack – 25 cm breda, lucka utan handtag](https://www.fyndplats.se/produkt/smala-sangbord-2-pack-25-cm): Lådor
- [Sängbord med laddstation 2-pack – 2 eluttag, USB-A och USB-C](https://www.fyndplats.se/produkt/sangbord-med-laddstation-2-pack): Lådor
- [Sängbord i naturträ 45 × 35 cm – låda, öppet fack och överhyllor](https://www.fyndplats.se/produkt/sangbord-naturtra-lada-hyllor): Lådor
- [Svävande nattduksbord 2-pack 40 × 25 cm – rottinglåda och öppen hylla](https://www.fyndplats.se/produkt/svavande-nattduksbord-2-pack-40x25-cm-rotting): Lådor
- [Svävande nattduksbord 2-pack med rottingfront – 40 cm](https://www.fyndplats.se/produkt/svavande-nattduksbord-2-pack-rotting): Lådor
- [Vägghängt sängbord 2-pack – svävande nattduksbord med RGB-LED och app-styrning](https://www.fyndplats.se/produkt/vagghangt-sangbord-rgb-led-2-pack-app-styrning): Lådor

### leksakskok (15 produkter)

Filter: Ålder (53 %)

- [Leksaksdiskmaskin i trä med diskho och kran – 32 tillbehör, för barn från 3 år](https://www.fyndplats.se/produkt/leksaksdiskmaskin-tra-diskho-32-tillbehor): Ålder
- [Barnkök med ugn, diskho och ljudeffekter, vitt](https://www.fyndplats.se/produkt/barnkok-ugn-diskho-ljud-vitt): Ålder
- [Leksakskök 100,9 cm med rinnande vatten – kyl, mikro och ugn](https://www.fyndplats.se/produkt/leksakskok-rinnande-vatten-kyl-mikro-ugn): Ålder
- [Barnkök med telefon, kritavla och mikrovågsugn, vitt](https://www.fyndplats.se/produkt/barnkok-telefon-kritavla-mikro-vitt): Ålder
- [Leksakskök i hörn med 14 delar – rinnande vatten och ugn](https://www.fyndplats.se/produkt/leksakskok-i-horn-14-delar-tillbehor): Ålder
- [Leksakskök för barn med kassaapparat och 50 delar – på hjul](https://www.fyndplats.se/produkt/leksakskok-for-barn): Ålder
- [Mudkök för barn i trä – utomhus lekkök med 2 diskhoar och spishäll](https://www.fyndplats.se/produkt/mudkok-barn-tra-utomhus-lekkok): Ålder

### hantlar-hantelset (15 produkter)

Filter: Vikt (53 %)

- [Hantelset med träställ, sex hexhantlar på 1/3/5 kg — 18 kg totalt](https://www.fyndplats.se/produkt/hantelset-med-stall): Vikt
- [Justerbar hantel 2–11 kg i fem steg, en hantel med förvaringsvagga](https://www.fyndplats.se/produkt/justerbar-hantel-11-kg): Vikt
- [Hantel 20 kg, sexkantig med gummiklädsel](https://www.fyndplats.se/produkt/hantel-20-kg-sexkantig-gummi): Vikt
- [Hexhantlar 6 kg – 2-pack gummerade hantlar, 12 kg totalt, räfflat kromgrepp](https://www.fyndplats.se/produkt/hexhantlar-6-kg-2-pack-gummerade-hantlar-12-kg): Vikt
- [Hantelset med ställning 36 kg – 6 hexhantlar 2×4, 2×6 och 2×8 kg](https://www.fyndplats.se/produkt/hantelset-med-stallning-36-kg-hexhantlar): Vikt
- [Justerbara hantlar 4-i-1, 2-pack – 1/1,5/2/2,5 kg med TPR-grepp](https://www.fyndplats.se/produkt/justerbara-hantlar-4-i-1-2-pack): Vikt
- [Justerbar skivstång med viktskivor 20 kg – viktset för hemmagym](https://www.fyndplats.se/produkt/justerbar-skivstang-20-kg): Vikt

### varmeflaktar (14 produkter)

Filter: Höjd (57 %)

- [Väggvärmare 50 cm med veckotimer och fönstervakt](https://www.fyndplats.se/produkt/vaggvarmare-50-cm-veckotimer): Höjd
- [Väggvärmare vit 54,5 cm – 12 cm djup med oscillation](https://www.fyndplats.se/produkt/vaggvarmare-vit-54-cm-oscillation): Höjd
- [Väggvärmare grå 54,5 cm – 12 cm djup med oscillation](https://www.fyndplats.se/produkt/vaggvarmare-gra-54-cm-oscillation): Höjd
- [Väggvärmare svart 54,5 cm – 12 cm djup med oscillation](https://www.fyndplats.se/produkt/vaggvarmare-svart-54-cm-oscillation): Höjd
- [Väggvärmare svart 45 cm – 2000 W, IPX2 och 12-timmarstimer](https://www.fyndplats.se/produkt/vaggvarmare-svart-45-cm-ipx2): Höjd
- [Väggvärmare vit 45 cm – 2000 W, IPX2 och 12-timmarstimer](https://www.fyndplats.se/produkt/vaggvarmare-vit-45-cm-ipx2): Höjd

### katthus (12 produkter)

Filter: Våningar (33 %), Material (58 %)

- [Katthus för två katter 85 cm – på ben, med uppfällbart tak](https://www.fyndplats.se/produkt/katthus-tva-katter-85-cm): Våningar
- [Upphöjt katthus 62 cm – hopfällbart, vattenavvisande med bädd](https://www.fyndplats.se/produkt/upphojt-katthus-hopfallbart): Våningar
- [Kattstuga utomhus 77 cm i barrträ – två ingångar och fönster](https://www.fyndplats.se/produkt/kattstuga-utomhus-77-cm): Våningar, Material
- [Litet katthus utomhus 57 cm i barrträ – lucka och fönster](https://www.fyndplats.se/produkt/litet-katthus-utomhus-57-cm): Våningar, Material
- [Katthus med uppfällbart tak 87 cm – låg modell i barrträ](https://www.fyndplats.se/produkt/katthus-uppfallbart-tak-87-cm): Våningar, Material
- [Katthus utomhus 96 cm i granträ – två rum och blomlåda](https://www.fyndplats.se/produkt/katthus-utomhus-96-cm-tva-rum-blomlada): Våningar, Material
- [Katthus i TV-design med kudde – mysig kattbädd och sidobord, ek](https://www.fyndplats.se/produkt/katthus-tv-design-med-kudde): Våningar
- [Hopfällbar kattkoja med klöspelare i sisal, 3 ingångar och upphöjd bädd](https://www.fyndplats.se/produkt/hopfallbar-kattkoja): Våningar
- [Katthus i trä för utomhus – 3 våningar med asfalttak, 140 cm](https://www.fyndplats.se/produkt/katthus-utomhus-tra-3-vaningar): Material

### motionscyklar (12 produkter)

Filter: Maxlast (58 %), Vikt (50 %)

- [Pedaltränare med display – ställbart motstånd och fotremmar, för ben och armar](https://www.fyndplats.se/produkt/pedaltranare-display-ben-armar): Maxlast
- [Motionscykel med magnetmotstånd i 8 steg – Bluetooth, sadel 65–91 cm](https://www.fyndplats.se/produkt/motionscykel-magnetmotstand-8-steg): Maxlast
- [Motionscykel hopfällbar med ryggstöd – 8 motståndslägen, 120 kg](https://www.fyndplats.se/produkt/motionscykel-hopfallbar-ryggstod-8-lagen): Maxlast
- [Pedaltränare för armar och ben – träna sittande, display och steglöst motstånd](https://www.fyndplats.se/produkt/pedaltranare-armar-ben-display): Maxlast
- [Spinningcykel med filtbroms – sadel 78–93 cm, LCD och mobilhållare](https://www.fyndplats.se/produkt/spinningcykel-filtbroms-lcd): Maxlast
- [Eldriven pedaltränare – 12 hastigheter, fjärrkontroll och display](https://www.fyndplats.se/produkt/eldriven-pedaltranare-12-hastigheter): Vikt
- [Liggande motionscykel med ryggstöd – 8 motståndsnivåer och LCD-display](https://www.fyndplats.se/produkt/liggande-motionscykel-ryggstod): Vikt
- [Hopfällbar motionscykel med ryggstöd – 8 motståndsnivåer och LCD-display](https://www.fyndplats.se/produkt/hopfallbar-motionscykel-ryggstod): Vikt
- [Motionscykel med ryggstöd – 8 motståndsnivåer, LCD och 3 kg svänghjul](https://www.fyndplats.se/produkt/motionscykel-ryggstod): Vikt
- [Magnetisk motionscykel med LCD-skärm – justerbar sadel och styre, max 120 kg](https://www.fyndplats.se/produkt/magnetisk-motionscykel-lcd): Vikt
- [Motionscykel för hemmet – 8 motstånd, justerbar, 120 kg](https://www.fyndplats.se/produkt/motionscykel-hemma-justerbar-lcd): Vikt

### valphagar-hundhagar (9 produkter)

Filter: Bredd (56 %)

- [Valphage 91 cm hög – paneler 61 cm, dörr med tre reglar](https://www.fyndplats.se/produkt/valphage-91-cm-atta-paneler): Bredd
- [Valphage 8 paneler – 61 × 76 cm per panel, oktagon eller avdelare](https://www.fyndplats.se/produkt/valphage-8-paneler): Bredd
- [Hopfällbar hundhage i metall med tak – 8 paneler, 76 cm](https://www.fyndplats.se/produkt/hopfallbar-hundhage-metall-8-paneler): Bredd
- [Hopfällbar hundgård med soltak – för valp, hund och katt](https://www.fyndplats.se/produkt/hopfallbar-hundgard-med-soltak): Bredd

### sandlador (8 produkter)

Filter: Material (50 %)

- [Sandlåda med lekkök och sandtratt – 154 × 80 cm, diskho](https://www.fyndplats.se/produkt/sandlada-med-lekkok-154-cm): Material
- [Sandlåda med lekstugetak 124 × 116 cm – vimpelrad ingår](https://www.fyndplats.se/produkt/sandlada-med-lekstugetak-124-cm): Material
- [Sandlåda som piratskepp 180 × 103 cm – mast, segel och styrhjul](https://www.fyndplats.se/produkt/sandlada-piratskepp-180-cm): Material
- [Sandlåda med lekstuga 133 × 129 cm – räcke och blått tak](https://www.fyndplats.se/produkt/sandlada-med-lekstuga-133-cm): Material

### hudvard-ansikte (8 produkter)

Filter: Effekt (50 %), Material (50 %)

- [LED-ljusterapi för ansikte – PDT-lampa med 7 färger för hudvård](https://www.fyndplats.se/produkt/led-ljusterapi-ansikte-pdt-lampa-7-farger): Effekt, Material
- [Hudvårdsset ansikte 5 delar – återfuktande & uppljusande rutin med fruktextrakt](https://www.fyndplats.se/produkt/hudvardsset-ansikte-5-delar): Effekt, Material
- [Återfuktande hudvårdsset 5 delar – rengöring, toner, serum, ögonkräm och kräm](https://www.fyndplats.se/produkt/aterfuktande-hudvardsset): Effekt, Material
- [Sheetmask med snigel & kollagen – ansiktsmask 20-pack](https://www.fyndplats.se/produkt/sheetmask-snigel-kollagen-ansiktsmask-20-pack): Effekt, Material

### koksmaskiner-apparater (70 produkter)

Filter: Volym (57 %), Effekt (56 %), Bredd (87 %, syns), Höjd (89 %, syns)

- [Brödrost för två skivor med sju rostlägen – värmegaller och upptining, svart](https://www.fyndplats.se/produkt/brodrost-tva-skivor-sju-rostlagen): Volym, Effekt
- [Vattenkokare 1,5 l och brödrost i rostfritt stål – pekpaneler och 6 temperaturer](https://www.fyndplats.se/produkt/vattenkokare-och-brodrost-rostfritt-stal-set): Volym, Effekt
- [Elektrisk pizzaugn 430 °C med keramiksten och 8 program](https://www.fyndplats.se/produkt/pizzaugn-elektrisk-430-grader): Volym
- [Espressomaskin 20 bar med mjölkskummare, creme/silver](https://www.fyndplats.se/produkt/espressomaskin-20-bar-creme-silver): Volym
- [Espressomaskin 20 bar med mjölkskummare, svart](https://www.fyndplats.se/produkt/espressomaskin-20-bar-svart): Volym
- [Vattenkokare i glas 1,7 l med tesil – fem temperaturlägen, varmhållning, 2200 W](https://www.fyndplats.se/produkt/vattenkokare-glas-tesil-temperaturval): Volym
- [Brödrost för fyra skivor med sju rostningslägen och smulbricka](https://www.fyndplats.se/produkt/brodrost-fyra-skivor-sju-lagen): Volym
- [Vattenkokare, brödrost och äggkokare i set, svart](https://www.fyndplats.se/produkt/vattenkokare-brodrost-aggkokare-set-svart): Volym, Effekt
- [Köksmaskin 1400 W med 7 liters skål – sex hastigheter, degkrok och stänkskydd](https://www.fyndplats.se/produkt/koksmaskin-1400w-7-liter-svart): Volym
- [Keramikhäll och grill 2-i-1, 2 000 W med avtagbar grillplatta](https://www.fyndplats.se/produkt/keramikhall-grill-2-i-1-2000-w): Volym, Effekt
- [Frukostset med LED-display – vattenkokare 40–100 °C och brödrost](https://www.fyndplats.se/produkt/frukostset-led-display-gradde): Volym, Effekt
- [Frukostset med varmhållning – svart vattenkokare och brödrost](https://www.fyndplats.se/produkt/frukostset-varmhallning-svart): Volym, Effekt
- [Hushållsassistent 1300 W med 4,5 liters skål – sex hastigheter, beige](https://www.fyndplats.se/produkt/hushallsassistent-1300-w-beige): Volym
- [Brödrost för fyra skivor med vågmönster – sju lägen och högt lyft](https://www.fyndplats.se/produkt/brodrost-fyra-skivor-gra-vagmonster): Volym
- [Rosa frukostset med bikakemönster – vattenkokare och brödrost](https://www.fyndplats.se/produkt/frukostset-rosa-bikakemonster): Volym, Effekt
- [Frukostset med bikakemönster i koppar och svart – kokare och brödrost](https://www.fyndplats.se/produkt/frukostset-bikakemonster-vattenkokare): Volym, Effekt
- [Torkapparat med fem plan för frukt och grönsaker – 35–70 °C, 245 W](https://www.fyndplats.se/produkt/torkapparat-fem-plan-frukt-gronsaker): Volym
- [Isbitsmaskin 20 kg per dygn – 24 isbitar på 14–18 min, självrengörande](https://www.fyndplats.se/produkt/isbitsmaskin-20-kg-sjalvrengorande): Volym
- [Frukostmaskin 3-i-1 – ugn, stekplatta och kaffebryggare](https://www.fyndplats.se/produkt/frukostmaskin-3-i-1-ugn-kaffebryggare): Volym, Effekt
- [Espressomaskin HiBREW H10A – 58 mm bärare, 20 bar och ångrör](https://www.fyndplats.se/produkt/espressomaskin-hibrew-h10a-58-mm): Volym, Effekt, Bredd, Höjd
- [Kapselmaskin HiBREW H17 med touchpanel – 20 bar och 1 liters tank](https://www.fyndplats.se/produkt/kapselmaskin-hibrew-h17-touchpanel): Volym, Bredd, Höjd
- [Kapselmaskin HiBREW H3D i rostfritt stål – 4-i-1 med fyra adaptrar](https://www.fyndplats.se/produkt/kapselmaskin-hibrew-h3d-rostfri): Volym, Effekt, Bredd, Höjd
- [Kapselmaskin HiBREW H3B 3-i-1 – kapslar och malet kaffe](https://www.fyndplats.se/produkt/kapselmaskin-hibrew-h3b-3-i-1): Volym, Effekt, Bredd, Höjd
- [Espressomaskin HiBREW H5A med termometer och mjölkskummare](https://www.fyndplats.se/produkt/espressomaskin-hibrew-h5a-termometer): Volym, Bredd, Höjd
- [Elektrisk kaffekvarn HiBREW G3 – 34 lägen och konisk stålkvarn](https://www.fyndplats.se/produkt/elektrisk-kaffekvarn-hibrew-g3): Volym, Effekt, Bredd, Höjd
- [Kapselmaskin HiBREW H2C 5-i-1 – display och gradvis temperatur](https://www.fyndplats.se/produkt/kapselmaskin-hibrew-h2c-5-i-1): Volym
- [Smal espressomaskin HiBREW H11 SR – rostfritt stål och ångrör](https://www.fyndplats.se/produkt/smal-espressomaskin-hibrew-h11-sr): Volym, Effekt, Bredd
- [Portabel ismaskin 12 kg per dygn – 9 isbitar på 7 minuter, självrengörande](https://www.fyndplats.se/produkt/portabel-ismaskin-12-kg-per-dygn): Volym
- [Frukostmackamaskin – gör frukostmackor & burgare på minuter](https://www.fyndplats.se/produkt/frukostmackamaskin-frukostmacka-burgare): Volym, Effekt
- [Elektrisk multikokare – mini riskokare med non-stick & glaslock](https://www.fyndplats.se/produkt/elektrisk-multikokare-mini-riskokare-non-stick): Volym, Effekt, Bredd, Höjd
- [Bänkugn 36 liter med två kokplattor, grillspett och varmluft](https://www.fyndplats.se/produkt/bankugn-36-liter-med-kokplattor): Effekt
- [Frukostset i grått – vattenkokare 1,7 liter och brödrost för fyra skivor](https://www.fyndplats.se/produkt/frukostset-gratt-fyrskivig): Effekt
- [Frukostset i gräddvitt – vattenkokare 1,7 liter och brödrost för två skivor](https://www.fyndplats.se/produkt/frukostset-graddvitt-termometer): Effekt
- [Frukostset med termometer i svart – 1,7 liter och två rostfack](https://www.fyndplats.se/produkt/frukostset-termometer-svart): Effekt
- [Snabbkokande frukostset – 1,7 liter på 3 minuter 15 sekunder](https://www.fyndplats.se/produkt/frukostset-snabbkokande-vattenkokare-brodrost): Effekt
- [Vattenkokare med temperaturval och brödrost – sex temperaturer, 1,7 liter](https://www.fyndplats.se/produkt/frukostset-temperaturval-vattenkokare): Effekt
- [Frukostset i rostfritt – 1,7 liter och brödrost för fyra skivor](https://www.fyndplats.se/produkt/frukostset-rostfritt-fyra-skivor): Effekt
- [Frukostset i svart med vattenkokare och brödrost – 1,7 liter, sju lägen](https://www.fyndplats.se/produkt/frukostset-svart-vattenkokare-brodrost): Effekt
- [Brödrost för fyra skivor med vattenkokare – 1,7 liter, svart och stål](https://www.fyndplats.se/produkt/frukostset-fyra-skivor-brodrost): Effekt
- [Kylskåp 91 liter med frysfack – 84 cm högt, vändbar dörr](https://www.fyndplats.se/produkt/kylskap-91-liter-frysfack): Effekt
- [Miniugn 21 liter i silver med tre värmelägen och timer](https://www.fyndplats.se/produkt/miniugn-21-liter-silver): Effekt
- [Miniugn 21 liter i grått med tre värmelägen och timer](https://www.fyndplats.se/produkt/miniugn-21-liter-gra): Effekt
- [Miniugn 21 liter i gräddvitt med tre värmelägen och timer](https://www.fyndplats.se/produkt/miniugn-21-liter-gradvit): Effekt
- [Miniugn 21 liter i svart med tre värmelägen och timer](https://www.fyndplats.se/produkt/miniugn-21-liter-svart): Effekt
- [Miniugn 16 liter i guld och svart med timer och glaslucka](https://www.fyndplats.se/produkt/miniugn-16-liter): Effekt
- [Airfryer 7 liter – varmluftsfritös 1500 W, 8 program & glasfönster](https://www.fyndplats.se/produkt/airfryer-7-liter): Bredd, Höjd

### redskapsbodar-forrad (35 produkter)

Filter: Bredd (54 %), Höjd (54 %), Längd (60 %, syns), Material (60 %, syns)

- [Redskapsbod med fönster 260 × 177 cm – galvaniserat stål, 4,13 m², ljusgrå](https://www.fyndplats.se/produkt/redskapsbod-med-fonster-260-cm-ljusgra): Bredd, Höjd
- [Förrådstält 300 × 447 cm med 13,4 m² – nätfönster och 200 cm takfot](https://www.fyndplats.se/produkt/forradstalt-300x447-cm-13-kvm): Bredd, Höjd
- [Redskapsbod ljusgrå 240 cm med sadeltak – 4,1 m² och 2,28 m i nock](https://www.fyndplats.se/produkt/redskapsbod-ljusgra-240-cm-sadeltak): Bredd, Höjd, Längd, Material
- [Redskapsbod mörkgrå 240 cm med sadeltak – 4,1 m² och 2,28 m i nock](https://www.fyndplats.se/produkt/redskapsbod-morkgra-240-cm-sadeltak): Bredd, Höjd, Längd, Material
- [Trädgårdsskåp grått 182 cm med fällbart bord – krokar och markpinnar](https://www.fyndplats.se/produkt/tradgardsskap-gratt-182-cm-fallbart-bord): Bredd, Höjd, Längd
- [Trädgårdsskåp 139 cm brett med dubbeldörr – asfalttak och bord ingår](https://www.fyndplats.se/produkt/tradgardsskap-139-cm-brett-dubbeldorr): Bredd, Höjd, Längd
- [Trädgårdsskåp 191,5 cm med sadeltak – två dörrar som öppnas var för sig](https://www.fyndplats.se/produkt/tradgardsskap-191-cm-sadeltak-tva-dorrar): Bredd, Höjd, Längd
- [Trädgårdsskåp i trä 115 cm – grått med vita lister, två hyllplan](https://www.fyndplats.se/produkt/tradgardsskap-tra-115-cm-gratt): Bredd, Höjd, Längd
- [Trädgårdsskåp i trä 115 cm – naturträ, två hyllplan och öppet fack](https://www.fyndplats.se/produkt/tradgardsskap-tra-115-cm-naturtra): Bredd, Höjd, Längd
- [Trädgårdsskåp 160 cm med lamelldörrar – tre fack och 20 kg per fack](https://www.fyndplats.se/produkt/tradgardsskap-160-cm-lamelldorrar): Bredd, Höjd, Längd
- [Trädgårdsskåp 77 cm brett med fönster – tre hörnhyllor och asfalttak](https://www.fyndplats.se/produkt/tradgardsskap-77-cm-fonster-hornhyllor): Bredd, Höjd, Längd
- [Redskapsbod trälook 385 cm – 12,4 m² i galvad plåt med skjutdörrar](https://www.fyndplats.se/produkt/redskapsbod-tralook-385-cm): Bredd, Höjd, Längd, Material
- [Redskapsbod ljusgrå 385 cm – 12,4 m² i galvad plåt med skjutdörrar](https://www.fyndplats.se/produkt/redskapsbod-ljusgra-385-cm): Bredd, Höjd, Längd, Material
- [Redskapsbod mörkgrön 385 cm – 12,4 m² i galvad plåt med skjutdörrar](https://www.fyndplats.se/produkt/redskapsbod-morkgron-385-cm): Bredd, Höjd, Längd, Material
- [Redskapsbod brun 385 cm – 12,4 m² i galvad plåt med skjutdörrar](https://www.fyndplats.se/produkt/redskapsbod-brun-385-cm): Bredd, Höjd, Längd, Material
- [Redskapsbod antracit 385 cm – 12,4 m² i galvad plåt med skjutdörrar](https://www.fyndplats.se/produkt/redskapsbod-antracit-385-cm): Bredd, Höjd, Längd, Material
- [Redskapsskåp i trä med vedförråd – himmelsblått, 180 cm, tak med asfaltpapp](https://www.fyndplats.se/produkt/redskapsskap-tra-vedforvaring-himmelsbla): Material
- [Trädgårdsförråd 147 cm med sex hyllor och fyra akrylfönster](https://www.fyndplats.se/produkt/tradgardsforrad-147-cm-sex-hyllor): Material
- [Redskapsbod i gran 0,5 m² med två fönster](https://www.fyndplats.se/produkt/redskapsbod-gran-0-5-m2-tva-fonster): Material
- [Redskapsskåp 110 cm med två fack och asfalttak](https://www.fyndplats.se/produkt/redskapsskap-110-cm-tva-fack-asfalttak): Material
- [Trädgårdsskåp 74 cm med uppfällbart lock och två fack](https://www.fyndplats.se/produkt/tradgardsskap-74-cm-uppfallbart-lock): Material
- [Redskapsskåp 179 cm i ljusblått med sadeltak och tre hyllor](https://www.fyndplats.se/produkt/redskapsskap-179-cm-ljusblatt-sadeltak): Material
- [Redskapsskåp för trädgården 115 cm – granträ med asfalttak och hyllor](https://www.fyndplats.se/produkt/redskapsskap-grantra-115-cm): Material

### badrumsspeglar (32 produkter)

Filter: Höjd (56 %), Placering (16 %), Form (78 %, syns)

- [Bågformad badrumsspegel LED 60 × 90 cm, svart](https://www.fyndplats.se/produkt/bagformad-badrumsspegel-led-60x90-svart): Höjd, Placering, Form
- [Badrumsspegel LED 100 × 80 cm med Bluetooth och klocka](https://www.fyndplats.se/produkt/badrumsspegel-led-100x80-bluetooth-klocka): Höjd, Placering
- [Badrumsspegel LED 80 × 60 cm med Bluetooth och klocka](https://www.fyndplats.se/produkt/badrumsspegel-led-80x60-bluetooth-klocka): Höjd, Placering
- [Badrumsspegel LED 90 × 70 cm med Bluetooth och klocka](https://www.fyndplats.se/produkt/badrumsspegel-led-90x70-bluetooth-klocka): Höjd, Placering
- [Badrumsspegel LED 70 × 50 cm med Bluetooth och klocka](https://www.fyndplats.se/produkt/badrumsspegel-led-70x50-bluetooth-klocka): Höjd, Placering
- [Badrumsspegel LED 100 × 60 cm, dimbar](https://www.fyndplats.se/produkt/badrumsspegel-led-100x60-dimbar): Höjd, Placering
- [Bågformad badrumsspegel 50 × 70 cm, svart ram](https://www.fyndplats.se/produkt/bagformad-badrumsspegel-50x70-svart): Höjd, Placering, Form
- [Badrumsspegel LED 60 × 80 cm, stående](https://www.fyndplats.se/produkt/badrumsspegel-led-60x80-staende): Höjd, Placering
- [Badrumsspegel LED 70 × 90 cm, stående](https://www.fyndplats.se/produkt/badrumsspegel-led-70x90-staende): Höjd, Placering
- [Badrumsspegel LED 50 × 70 cm, stående](https://www.fyndplats.se/produkt/badrumsspegel-led-50x70-staende): Höjd, Placering
- [Badrumsspegel LED 80 × 60 cm med 3× förstoringsspegel](https://www.fyndplats.se/produkt/badrumsspegel-led-80x60-forstoringsspegel): Höjd, Placering
- [Rund badrumsspegel LED Ø 60 cm](https://www.fyndplats.se/produkt/rund-badrumsspegel-led-60-cm): Höjd, Placering
- [Rund spegel Ø61 cm med silverfärgad ram i aluminium – för badrum och hall](https://www.fyndplats.se/produkt/rund-spegel-61-cm-silver-aluminium): Höjd, Placering
- [Oregelbunden badrumsspegel LED 70x50 / 80x60 cm – asymmetrisk med antiimma](https://www.fyndplats.se/produkt/oregelbunden-badrumsspegel-led-antiimma): Höjd, Form
- [Rund spegel med belysning Ø70 cm – LED i tre ljusfärger, antiimma och IP44](https://www.fyndplats.se/produkt/rund-spegel-med-belysning-70-cm): Placering
- [Badrumsspegel med belysning 70 × 100 cm – antimist, tre ljusfärger och touch](https://www.fyndplats.se/produkt/badrumsspegel-med-belysning-70x100-antimist): Placering
- [Badrumsspegel med belysning och glashylla – välvd överkant, 50 × 70 cm](https://www.fyndplats.se/produkt/badrumsspegel-belysning-glashylla-valvd): Placering, Form
- [Sminkspegel LED 80 × 60 cm med antiimma](https://www.fyndplats.se/produkt/sminkspegel-led-80x60-antiimma): Placering
- [Rektangulär LED-spegel för badrum 90 × 60 cm – svart ram, antiimma och IP44](https://www.fyndplats.se/produkt/led-spegel-badrum-90x60-svart-ram): Placering
- [Spegelskåp 56 × 65 cm i brun träton – två spegeldörrar och öppen hylla](https://www.fyndplats.se/produkt/spegelskap-56x65-brun-traton-oppen-hylla): Placering
- [Rund spegel Ø70 cm med guldfärgad ram i stål – splitterskydd och två krokar](https://www.fyndplats.se/produkt/rund-spegel-70-cm-guldfargad-ram): Placering
- [Spegel 50 × 70 cm med svart ram och rundade hörn – hängs stående eller liggande](https://www.fyndplats.se/produkt/spegel-50x70-svart-ram-rundade-horn): Placering, Form
- [Asymmetrisk LED-spegel 50 × 70 cm – tre ljusfärger, antiimma och IP44](https://www.fyndplats.se/produkt/asymmetrisk-led-spegel-50x70-antiimma): Placering, Form
- [Spegelskåp i rostfritt stål 70 × 55 cm – tre spegeldörrar och fem hyllplan](https://www.fyndplats.se/produkt/spegelskap-rostfritt-stal-70x55-cm): Placering
- [LED-spegel för badrum 70 × 90 cm – tre ljusfärger, antiimma och IP44](https://www.fyndplats.se/produkt/led-spegel-badrum-70x90-antiimma): Placering
- [LED-spegel för badrum 60 × 80 cm – ljus fram och bak, dimbar och antiimma](https://www.fyndplats.se/produkt/led-spegel-badrum-60x80-dimbar): Placering
- [LED-spegel för badrum 50 × 70 cm – raka hörn, touchknapp och IP44](https://www.fyndplats.se/produkt/led-spegel-badrum-50x70-raka-horn): Placering, Form
- [Badrumsspegel LED med Bluetooth, klocka och antiimma – 70x50 / 80x60 cm](https://www.fyndplats.se/produkt/badrumsspegel-led-bluetooth-klocka-antiimma): Placering

### sideboards-vitrinskap (18 produkter)

Filter: Lådor (33 %)

- [Köksskåp svart 180 cm – mjukstängande dörrar, låda, öppna fack och hylla](https://www.fyndplats.se/produkt/koksskap-svart-180-cm-oppna-fack): Lådor
- [Sideboard svart med skiva i träton, 110 cm – låda, skåp och tre öppna fack](https://www.fyndplats.se/produkt/sideboard-svart-traton-110-cm): Lådor
- [Sideboard i metall 80 × 40 × 80 cm med skiva i träoptik](https://www.fyndplats.se/produkt/sideboard-metall-80-cm-traoptik): Lådor
- [Sideboard 180 cm i högglansvit – en låda, tre skåp och plats för 75-tums tv](https://www.fyndplats.se/produkt/sideboard-180-cm-hogglansvit-tre-skap): Lådor
- [Rottingsideboard 140 cm med fyra dörrar och soft close](https://www.fyndplats.se/produkt/rottingsideboard-140-cm-fyra-dorrar): Lådor
- [Sideboard 100 cm i lantstil – vit, skiva i träton, låda och kryddhylla i dörren](https://www.fyndplats.se/produkt/sideboard-lantstil-100-cm-kryddhylla): Lådor
- [Köksskåp i lantstil 100 cm – vitrin, öppen hylla och arbetsyta](https://www.fyndplats.se/produkt/koksskap-i-lantstil-100-cm): Lådor
- [Sideboard 120 cm i vitt med träskiva – låda, skåp och öppna fack](https://www.fyndplats.se/produkt/sideboard-120-cm-vit-med-traskiva): Lådor
- [Samlarvitrin i akryl – 1, 2 eller 3 fack, vitt](https://www.fyndplats.se/produkt/samlarvitrin-akryl-1-2-3-fack): Lådor
- [Vitrinskåp 139 cm med 4 fack – uppfällbara dörrar i akryl, vitt](https://www.fyndplats.se/produkt/vitrinskap-139-cm-4-fack): Lådor
- [Vitrinskåp vägg 80×60 cm – svart samlarskåp med 2 skjutdörrar i glas](https://www.fyndplats.se/produkt/vitrinskap-vagg-80x60-samlarskap-glasdorrar): Lådor
- [Vitrinskåp för vägg – 7 hyllplan, 2 glasdörrar och justerbara hyllor, vit](https://www.fyndplats.se/produkt/vitrinskap-vagg): Lådor

### tvattkorgar (15 produkter)

Filter: Volym (47 %)

- [Tvättskåp 70 × 38 cm med två tippbara korgar – vitt, lackerad MDF](https://www.fyndplats.se/produkt/tvattskap-tva-tippbara-korgar-70x38-cm): Volym
- [Badrumshylla med tvättkorg i bambu, 160 cm – tre hyllor och tippskydd](https://www.fyndplats.se/produkt/badrumshylla-med-tvattkorg-bambu-160-cm): Volym
- [Tvättsorterare i bambu – tvättpåse och förvaring i tre fack, 70 × 36 × 70 cm](https://www.fyndplats.se/produkt/tvattsorterare-bambu-tvattpase-tre-fack): Volym
- [Tvättkorg med strykbräda i bambu, 113 cm](https://www.fyndplats.se/produkt/tvattkorg-strykbrada-bambu-113-cm): Volym
- [Tvättkorg i bambu med lock och uttagbar tvättpåse – luftiga ribbor, 60 cm hög](https://www.fyndplats.se/produkt/tvattkorg-bambu-lock-uttagbar-pase): Volym
- [Tvättkorg i bambu med tre avtagbara tygkorgar i grått – hylla med ribbor ovanpå](https://www.fyndplats.se/produkt/tvattkorg-bambu-tre-tygkorgar): Volym
- [Tvättkorg i vide 57 cm med lock och uttagbar innerpåse](https://www.fyndplats.se/produkt/tvattkorg-vide-57-cm-uttagbar-pase): Volym
- [Högskåp badrum 60 × 171 cm med tippbar tvättkorg](https://www.fyndplats.se/produkt/hogskap-badrum-60x171-tvattkorg): Volym

### oronlappsfatoljer (12 produkter)

Filter: Sitthöjd (50 %), Maxlast (50 %)

- [Öronlappsfåtölj med fotpall i grå linnelook – 104 cm hög, bär 120 kg](https://www.fyndplats.se/produkt/oronlappsfatolj-fotpall-gra-linnelook): Sitthöjd, Maxlast
- [Öronlappsfåtölj i cremevit flanell – knappad rygg, bär 160 kg](https://www.fyndplats.se/produkt/oronlappsfatolj-cremevit-flanell): Sitthöjd, Maxlast
- [Öronlappsfåtölj i grå sammet – knappad rygg, bär 160 kg](https://www.fyndplats.se/produkt/oronlappsfatolj-gra-sammet): Sitthöjd, Maxlast
- [Öronlappsfåtölj i grått – knappad rygg, bär 160 kg](https://www.fyndplats.se/produkt/oronlappsfatolj-gra-knappad-rygg): Sitthöjd, Maxlast
- [Öronlappsfåtölj i mörkgrått – avtagbar tvättbar klädsel, bär 160 kg](https://www.fyndplats.se/produkt/oronlappsfatolj-morkgra-tvattbar): Sitthöjd, Maxlast
- [Öronlappsfåtölj i brunt – avtagbar tvättbar klädsel, bär 160 kg](https://www.fyndplats.se/produkt/oronlappsfatolj-brun-tvattbar): Sitthöjd, Maxlast

### kropp-valbefinnande (8 produkter)

Filter: Maxlast (38 %)

- [Ergonomisk sittdyna i memoryskum – urtag för svanskotan, 44 × 39 × 13 cm](https://www.fyndplats.se/produkt/ergonomisk-sittdyna-memoryskum-svanskota): Maxlast
- [Tungtrumma i stål 6/10/12/13 tum – C-dur eller D-dur, 11–15 toner](https://www.fyndplats.se/produkt/tungtrumma-stal-6-13-tum): Maxlast
- [Handpan i D-moll 55 cm – 9/10/12 toner med väska och pall](https://www.fyndplats.se/produkt/handpan-d-moll-55-cm): Maxlast
- [Hopfällbar massagebänk 3 sektioner aluminium 215 cm rosa](https://www.fyndplats.se/produkt/hopfallbar-massagebank-aluminium-3-sektioner-rosa): Maxlast
- [Ljusterapilampa 10 000 lux med 3 färgtemperaturer, 5 ljusstyrkor och timer](https://www.fyndplats.se/produkt/ljusterapilampa-15000-lux): Maxlast

### fatoljer (305 produkter)

Filter: Sitthöjd (59 %), Bredd (61 %, syns), Klädsel (81 %, syns), Maxlast (84 %, syns), Material (93 %, syns)

- [Golvfåtölj med ryggen i 13 lägen – fälls platt till 108 cm, väger 7 kg](https://www.fyndplats.se/produkt/golvfatolj-fallbar-13-lagen): Sitthöjd, Bredd, Klädsel
- [Snurrfåtölj med höjdjusterbar fotpall – chenille, båda snurrar 360°](https://www.fyndplats.se/produkt/snurrfatolj-fotpall-hojdjusterbar): Sitthöjd, Bredd
- [Bäddfåtölj med 190 cm bäddlängd och sex ryggvinklar, mörkgrön](https://www.fyndplats.se/produkt/baddfatolj-190-cm): Sitthöjd
- [Bäddfåtölj med armstöd i gummiträ, 183 cm bädd, gräddvit](https://www.fyndplats.se/produkt/baddfatolj-med-armstod): Sitthöjd
- [Kontorsfåtölj i sammetslook med vibrationsmassage och USB, grön](https://www.fyndplats.se/produkt/kontorsfatolj-sammet-massage-usb-gron): Sitthöjd, Maxlast
- [Bäddfåtölj i manchester med 90 cm bred bädd, mörkgrå](https://www.fyndplats.se/produkt/baddfatolj-manchester-90-cm-morkgra): Sitthöjd
- [Bäddfåtölj i manchester med 90 cm bred bädd, beige](https://www.fyndplats.se/produkt/baddfatolj-manchester-90-cm-beige): Sitthöjd
- [Bäddfåtölj med sidofickor och träarmstöd, 183 cm bädd](https://www.fyndplats.se/produkt/baddfatolj-sidofickor-183-cm): Sitthöjd
- [Armlös snurrfåtölj i chenille – 35 cm tjock sittdyna och 360° fot](https://www.fyndplats.se/produkt/snurrfatolj-armlos-35-cm-dyna): Sitthöjd
- [Djup fåtölj i manchesterlook – 40 cm sittdyna, bär 250 kg, färdigmonterad](https://www.fyndplats.se/produkt/djup-fatolj-250-kg-manchesterlook): Sitthöjd, Bredd
- [Golvfåtölj i chenille – fjärilsform, 36 cm tjock sits, två sidofickor](https://www.fyndplats.se/produkt/golvfatolj-chenille-fjarilsform): Sitthöjd, Maxlast
- [Tv-fåtölj i chenille med inbyggt fotstöd och gungning – grå](https://www.fyndplats.se/produkt/tv-fatolj-gra-med-inbyggt-fotstod): Sitthöjd, Bredd
- [Tv-fåtölj i chenille med inbyggt fotstöd och gungning – beige](https://www.fyndplats.se/produkt/tv-fatolj-beige-med-inbyggt-fotstod): Sitthöjd, Bredd
- [Liten fåtölj 60 cm i chenille – svarta metallben och 35 cm rygg](https://www.fyndplats.se/produkt/liten-fatolj-60-cm-chenille): Sitthöjd, Bredd
- [Bäddfåtölj 90 cm bred med OEKO-TEX-tyg och tre ryggvinklar](https://www.fyndplats.se/produkt/baddfatolj-90-cm-oeko-tex): Sitthöjd
- [Fåtölj på medar i konstläder – 22 cm sittdyna och 64 cm bred sits](https://www.fyndplats.se/produkt/fatolj-pa-medar-konstlader-22-cm): Sitthöjd, Bredd
- [Fåtölj i konstläder, extra bred och djup sits, grå](https://www.fyndplats.se/produkt/fatolj-konstlader-extra-bred-djup-sits-gra): Sitthöjd, Maxlast
- [Bäddfåtölj 186 cm med armstöd och ryggen i fem lägen, grå](https://www.fyndplats.se/produkt/baddfatolj-186-cm-armstod-gra): Sitthöjd
- [Gungfåtölj med fotpall i linnelook, grå](https://www.fyndplats.se/produkt/gungfatolj-fotpall-linnelook-gra): Sitthöjd, Bredd
- [Gungfåtölj med fotpall i linnelook, beige](https://www.fyndplats.se/produkt/gungfatolj-fotpall-linnelook-beige): Sitthöjd, Bredd
- [Gungstol i manchester med sidofickor och 11° gungvinkel](https://www.fyndplats.se/produkt/gungstol-manchester-sidofickor): Sitthöjd
- [Fåtölj med fjäderkärna, rygg till 145°, 73 cm bred – gräddvit](https://www.fyndplats.se/produkt/fjaderfatolj-graddvit-145-grader): Sitthöjd, Bredd
- [Gungstol med fällbar rygg i tre lägen och dolt fotstöd](https://www.fyndplats.se/produkt/gungstol-fallbar-rygg-dolt-fotstod): Sitthöjd
- [Bred gungstol i chenille med stålbas – 80 cm](https://www.fyndplats.se/produkt/gungstol-chenille-80-cm-bred): Sitthöjd
- [Loungefåtölj med fotpall i chenille, 360° snurrfot – ljusgrå](https://www.fyndplats.se/produkt/loungefatolj-ljusgra-med-fotpall): Sitthöjd, Bredd
- [Loungefåtölj med fotpall i chenille, 360° snurrfot – blå](https://www.fyndplats.se/produkt/loungefatolj-bla-med-fotpall): Sitthöjd, Bredd
- [Loungefåtölj i teddyfleece 77 cm, cremevit](https://www.fyndplats.se/produkt/loungefatolj-teddyfleece-77-cm): Sitthöjd, Bredd
- [Clubfåtölj i linnelook 85 cm – 360° vridfot och 70 cm djup sits](https://www.fyndplats.se/produkt/clubfatolj-linnelook-85-cm): Sitthöjd
- [Golvfåtölj med 360° vridfot i grönt – 17 cm stoppning, bär 120 kg](https://www.fyndplats.se/produkt/golvfatolj-vridfot-gron): Sitthöjd, Maxlast
- [Golvfåtölj med 360° vridfot i mörkgrått – 17 cm stoppning, bär 120 kg](https://www.fyndplats.se/produkt/golvfatolj-vridfot-morkgra): Sitthöjd, Maxlast
- [Golvfåtölj med 360° vridfot i beige – 17 cm stoppning, bär 120 kg](https://www.fyndplats.se/produkt/golvfatolj-vridfot-beige): Sitthöjd, Maxlast
- [Gungstol med massage i åtta punkter och ländvärme](https://www.fyndplats.se/produkt/gungstol-massage-landvarme): Sitthöjd
- [Loungefåtölj i sammetslook på gummiträram, cremevit](https://www.fyndplats.se/produkt/loungefatolj-gummitra-65-cm-cremevit): Sitthöjd, Bredd
- [Reclinerfåtölj med fotpall i konstläder, 130° och 360° – gräddvit](https://www.fyndplats.se/produkt/reclinerfatolj-graddvit-med-fotpall): Sitthöjd, Bredd
- [Reclinerfåtölj med fotpall i konstläder, 130° och 360° – svart](https://www.fyndplats.se/produkt/reclinerfatolj-svart-med-fotpall): Sitthöjd, Bredd
- [Loungefåtölj i björkfanér – vippande ram, 12 cm dyna och 105 cm rygg](https://www.fyndplats.se/produkt/loungefatolj-bjorkfaner-vippande): Sitthöjd, Bredd, Maxlast
- [Öronlappsfåtölj med fotpall i grå linnelook – 104 cm hög, bär 120 kg](https://www.fyndplats.se/produkt/oronlappsfatolj-fotpall-gra-linnelook): Sitthöjd, Maxlast
- [Snurrfåtölj 60 cm med knappad rygg, gul](https://www.fyndplats.se/produkt/snurrfatolj-60-cm-gul): Sitthöjd, Bredd
- [Snurrfåtölj 60 cm med knappad rygg, cremevit](https://www.fyndplats.se/produkt/snurrfatolj-60-cm-cremevit): Sitthöjd, Bredd
- [Snurrfåtölj 60 cm med knappad rygg, mörkgrå](https://www.fyndplats.se/produkt/snurrfatolj-60-cm-morkgra): Sitthöjd, Bredd
- [Snurrfåtölj 60 cm med knappad rygg, svart](https://www.fyndplats.se/produkt/snurrfatolj-60-cm-svart): Sitthöjd, Bredd
- [Gungstol med 60 cm bred sits, ländkudde och sidoficka](https://www.fyndplats.se/produkt/gungstol-60-cm-bred-sits-landkudde): Sitthöjd
- [Reclinerfåtölj med fotpall – svart konstläder, rygg till 130°](https://www.fyndplats.se/produkt/reclinerfatolj-fotpall-svart-rund-fot): Sitthöjd, Bredd
- [Reclinerfåtölj som gungar – 155° liggläge, 360° snurr och sidofickor](https://www.fyndplats.se/produkt/reclinerfatolj-gungande-chenille): Sitthöjd, Bredd
- [Reclinerfåtölj 69 cm bred – vridbar 360° och sitthöjd 58–64 cm](https://www.fyndplats.se/produkt/reclinerfatolj-69-cm-vridbar-360): Sitthöjd, Bredd, Maxlast, Material
- [Reclinerfåtölj i konstläder med snurrfot och fotstöd – stålgrå](https://www.fyndplats.se/produkt/reclinerfatolj-stalgra-konstlader): Sitthöjd
- [Reclinerfåtölj i konstläder med snurrfot och fotstöd – gräddvit](https://www.fyndplats.se/produkt/reclinerfatolj-graddvit-konstlader): Sitthöjd
- [Reclinerfåtölj i konstläder med snurrfot och fotstöd – mörkgrå](https://www.fyndplats.se/produkt/reclinerfatolj-morkgra-konstlader): Sitthöjd
- [Reclinerfåtölj i konstläder med snurrfot och fotstöd – gråbrun](https://www.fyndplats.se/produkt/reclinerfatolj-grabrun-konstlader): Sitthöjd
- [Fåtölj i grått konstläder med fotpall och vippfunktion](https://www.fyndplats.se/produkt/fatolj-gra-fotpall-vippfunktion): Sitthöjd, Bredd
- [Gungfåtölj med fotpall i konstläder, 135° – gräddvit](https://www.fyndplats.se/produkt/gungfatolj-graddvit-med-fotpall): Sitthöjd, Bredd
- [Gungfåtölj med fotpall i konstläder, 135° – svart](https://www.fyndplats.se/produkt/gungfatolj-svart-med-fotpall): Sitthöjd, Bredd
- [Reclinerfåtölj med 360° snurrfot – 130° liggläge, fotpall och 150 kg](https://www.fyndplats.se/produkt/reclinerfatolj-snurrfot-130-grader): Sitthöjd, Bredd
- [Biofåtölj med fotpall i konstläder, 130° och 360° – svart](https://www.fyndplats.se/produkt/biofatolj-svart-med-fotpall): Sitthöjd, Bredd
- [Biofåtölj med fotpall i konstläder, 130° och 360° – gråbrun](https://www.fyndplats.se/produkt/biofatolj-grabrun-med-fotpall): Sitthöjd, Bredd
- [Gungstol med fotpall i gult – bär 130 kg](https://www.fyndplats.se/produkt/gungstol-med-fotpall-gul): Sitthöjd, Klädsel
- [Vilfåtölj med fjäderkärna, rygg till 155°, bär 150 kg – grå](https://www.fyndplats.se/produkt/vilfatolj-gra-155-grader): Sitthöjd, Bredd
- [Vilfåtölj med fjäderkärna, rygg till 155°, bär 150 kg – svart](https://www.fyndplats.se/produkt/vilfatolj-svart-155-grader): Sitthöjd, Bredd
- [Vilfåtölj med fjäderkärna, rygg till 155°, bär 150 kg – beige](https://www.fyndplats.se/produkt/vilfatolj-beige-155-grader): Sitthöjd, Bredd
- [Sammetsfåtölj med fotpall – hög rygg, 33 cm stålben och ljusgrå klädsel](https://www.fyndplats.se/produkt/sammetsfatolj-fotpall-33-cm-ben): Sitthöjd, Bredd
- [Bäddfåtölj 98 cm bred bädd med armstöd i gummiträ, ljusbrun](https://www.fyndplats.se/produkt/baddfatolj-98-cm-armstod-ljusbrun): Sitthöjd
- [Bäddfåtölj med armstöd i gummiträ, 185 cm bädd, blå](https://www.fyndplats.se/produkt/baddfatolj-med-armstod-bla): Sitthöjd
- [Bäddfåtölj med armstöd i gummiträ, 183 cm bädd, taupe](https://www.fyndplats.se/produkt/baddfatolj-med-armstod-taupe): Sitthöjd
- [Bäddfåtölj med armstöd i gummiträ, 183 cm bädd, mörkgrå](https://www.fyndplats.se/produkt/baddfatolj-med-armstod-morkgra): Sitthöjd
- [Bäddfåtölj med armstöd i gummiträ, 183 cm bädd, svart](https://www.fyndplats.se/produkt/baddfatolj-med-armstod-svart): Sitthöjd
- [Bäddfåtölj med armstöd i gummiträ, 185 cm bädd, beige](https://www.fyndplats.se/produkt/baddfatolj-med-armstod-beige): Sitthöjd
- [Biofåtölj 64 cm bred med fjäderkärna, rygg till 160° – grå](https://www.fyndplats.se/produkt/biofatolj-gra-160-grader): Sitthöjd, Bredd
- [Biofåtölj 64 cm bred med fjäderkärna, rygg till 160° – gräddvit](https://www.fyndplats.se/produkt/biofatolj-graddvit-160-grader): Sitthöjd, Bredd
- [Biofåtölj 64 cm bred med fjäderkärna, rygg till 160° – svart](https://www.fyndplats.se/produkt/biofatolj-svart-160-grader): Sitthöjd, Bredd
- [Tv-fåtölj med två mugghållare – 135° liggläge och 360° snurrfot](https://www.fyndplats.se/produkt/tv-fatolj-mugghallare-135): Sitthöjd, Bredd, Klädsel
- [Fåtölj i svart konstläder med lös fotpall, 75 cm bred](https://www.fyndplats.se/produkt/stalfatolj-svart-med-fotpall): Sitthöjd, Bredd
- [Klassisk gungstol i gummiträ med löstagbar ländkudde](https://www.fyndplats.se/produkt/gungstol-gummitra-klassisk): Sitthöjd
- [Reclinerfåtölj med fotpall – rygg till 130°, 360° snurr och stålram](https://www.fyndplats.se/produkt/reclinerfatolj-fotpall-130-grader): Sitthöjd, Bredd, Klädsel, Maxlast
- [Fåtölj i skandinavisk stil – gummiträram, S-fjädrar och 68 cm bredd](https://www.fyndplats.se/produkt/fatolj-skandinavisk-stil-gummitra): Sitthöjd, Bredd
- [Fåtölj i skandinavisk stil med gummiträram, cremevit](https://www.fyndplats.se/produkt/fatolj-skandinavisk-stil-gummitra-cremevit): Sitthöjd, Bredd
- [Fåtölj i svart konstläder med fotpall och justerbart nackstöd](https://www.fyndplats.se/produkt/fatolj-svart-fotpall-nackstod): Sitthöjd, Bredd
- [Bäddfåtölj i manchester utan armstöd — bädd 193 × 82 cm, tre ryggvinklar](https://www.fyndplats.se/produkt/baddfatolj-manchester-utan-armstod-193x82): Sitthöjd
- [Hopfällbar fåtölj i bok – tre lägen, 14 cm dyna, gråblå](https://www.fyndplats.se/produkt/hopfallbar-fatolj-bok-tre-lagen-grabla): Sitthöjd, Klädsel, Maxlast, Material
- [Hopfällbar fåtölj i bok – tre lägen, 14 cm dyna, khaki](https://www.fyndplats.se/produkt/hopfallbar-fatolj-bok-tre-lagen-khaki): Sitthöjd, Klädsel, Maxlast, Material
- [Smal fåtölj 69 cm med fotstöd, rygg till 135° – ljusgrå](https://www.fyndplats.se/produkt/smalfatolj-ljusgra-135-grader): Sitthöjd, Bredd
- [Gungstol i teddyfleece med träram – bär 150 kg](https://www.fyndplats.se/produkt/gungstol-teddyfleece-traram-150-kg): Sitthöjd
- [Fåtölj i ljusgrått konstläder med fotpall på träfot](https://www.fyndplats.se/produkt/fatolj-ljusgra-fotpall-trafot): Sitthöjd, Bredd
- [Bäddfåtölj 188 cm med runda armstödskuddar och ryggen i fem lägen](https://www.fyndplats.se/produkt/baddfatolj-188-cm-runda-armstod): Sitthöjd
- [Vikbar bäddmadrass 174 cm – viks till golvfåtölj, blå](https://www.fyndplats.se/produkt/vikbar-baddmadrass-174-cm-bla): Sitthöjd, Klädsel
- [Vikbar bäddmadrass 174 cm – viks till golvfåtölj, mörkgrå](https://www.fyndplats.se/produkt/vikbar-baddmadrass-174-cm-morkgra): Sitthöjd, Klädsel
- [Vikbar bäddmadrass 174 cm – viks till golvfåtölj, kudde ingår](https://www.fyndplats.se/produkt/vikbar-baddmadrass-174-cm): Sitthöjd, Klädsel
- [Fotpall med svängd sits – ljusgrå teddyfleece och ben i bok](https://www.fyndplats.se/produkt/fotpall-svangd-sits-teddyfleece): Sitthöjd, Maxlast
- [Fåtölj med furuben i linnelook, cremevit](https://www.fyndplats.se/produkt/fatolj-furuben-linnelook-cremevit): Sitthöjd, Bredd, Material
- [TV-fåtölj med fotpall, 360° vridfot och rygg till 135° – ljusgrå](https://www.fyndplats.se/produkt/tv-fatolj-ljusgra-med-fotpall): Sitthöjd, Bredd, Klädsel
- [TV-fåtölj med fotpall, 360° vridfot och rygg till 135° – brun](https://www.fyndplats.se/produkt/tv-fatolj-brun-med-fotpall): Sitthöjd, Bredd, Klädsel
- [Öronlappsfåtölj i cremevit flanell – knappad rygg, bär 160 kg](https://www.fyndplats.se/produkt/oronlappsfatolj-cremevit-flanell): Sitthöjd, Klädsel, Maxlast
- [Öronlappsfåtölj i grå sammet – knappad rygg, bär 160 kg](https://www.fyndplats.se/produkt/oronlappsfatolj-gra-sammet): Sitthöjd, Maxlast
- [Öronlappsfåtölj i grått – knappad rygg, bär 160 kg](https://www.fyndplats.se/produkt/oronlappsfatolj-gra-knappad-rygg): Sitthöjd, Klädsel, Maxlast
- [Öronlappsfåtölj i mörkgrått – avtagbar tvättbar klädsel, bär 160 kg](https://www.fyndplats.se/produkt/oronlappsfatolj-morkgra-tvattbar): Sitthöjd, Klädsel, Maxlast
- [Öronlappsfåtölj i brunt – avtagbar tvättbar klädsel, bär 160 kg](https://www.fyndplats.se/produkt/oronlappsfatolj-brun-tvattbar): Sitthöjd, Klädsel, Maxlast
- [Vilstol i böjd björk med grå dyna och fotstöd i fem lägen](https://www.fyndplats.se/produkt/vilstol-bjork-gra-fotstod): Sitthöjd, Bredd, Klädsel
- [Vilstol i böjd björk med gråbrun dyna och fotstöd i fem lägen](https://www.fyndplats.se/produkt/vilstol-bjork-grabrun-fotstod): Sitthöjd, Bredd, Klädsel
- [Vilstol i björk med femstegs fotstöd – avtagbar dyna, väger 10,3 kg](https://www.fyndplats.se/produkt/vilstol-bjork-femstegs-fotstod): Sitthöjd, Bredd, Klädsel
- [Uppresningsfåtölj cremevit – 35 cm från vägg, USB-A och USB-C](https://www.fyndplats.se/produkt/uppresningsfatolj-cremevit-35-cm-fran-vagg): Sitthöjd, Bredd, Maxlast, Material
- [Uppresningsfåtölj ljusgrå med 155° liggläge – hög rygg och 25 cm ryggdyna](https://www.fyndplats.se/produkt/uppresningsfatolj-ljusgra-155-grader): Sitthöjd, Bredd, Maxlast, Material
- [Uppresningsfåtölj med hjul och nedfällbara armstöd – konstläder, 170°](https://www.fyndplats.se/produkt/uppresningsfatolj-hjul-nedfallbara-armstod): Sitthöjd, Bredd, Maxlast, Material
- [Uppresningsfåtölj i svart konstläder – zero-gravity och 189 cm liggläge](https://www.fyndplats.se/produkt/uppresningsfatolj-svart-konstlader-zero-gravity): Sitthöjd, Bredd, Maxlast, Material
- [Uppresningsfåtölj med massage – elektrisk fåtölj som reser dig upp](https://www.fyndplats.se/produkt/uppresningsfatolj-massage-elektrisk): Sitthöjd, Bredd, Klädsel, Maxlast, Material
- [Massagefåtölj med timer och uppresning – fem program, USB-C och 150 kg](https://www.fyndplats.se/produkt/massagefatolj-timer-fem-program): Sitthöjd, Bredd, Klädsel, Maxlast, Material
- [Uppresningsfåtölj ljusgrå med massage och ländvärme – 8 punkter, USB-C](https://www.fyndplats.se/produkt/uppresningsfatolj-ljusgra-massage-landvarme): Sitthöjd, Bredd, Maxlast, Material
- [Uppresningsfåtölj grå med massage och ländvärme – 8 punkter, USB-C](https://www.fyndplats.se/produkt/uppresningsfatolj-gra-massage-landvarme): Sitthöjd, Bredd, Maxlast, Material
- [Reclinerfåtölj ljusgrå med massage – 28 cm ryggdyna och 45 cm från vägg](https://www.fyndplats.se/produkt/reclinerfatolj-ljusgra-massage-28-cm-ryggdyna): Sitthöjd, Bredd, Klädsel, Maxlast, Material
- [Reclinerfåtölj blågrå med massage – 28 cm ryggdyna och 45 cm från vägg](https://www.fyndplats.se/produkt/reclinerfatolj-blagra-massage-28-cm-ryggdyna): Sitthöjd, Bredd, Klädsel, Maxlast, Material
- [Uppresningsfåtölj med mugghållare grå – massage, ländvärme och 60 cm sits](https://www.fyndplats.se/produkt/uppresningsfatolj-mugghallare-gra): Sitthöjd, Bredd, Maxlast, Material
- [Uppresningsfåtölj med mugghållare mörkgrå – massage, ländvärme och 60 cm sits](https://www.fyndplats.se/produkt/uppresningsfatolj-mugghallare-morkgra): Sitthöjd, Bredd, Maxlast, Material
- [Uppresningsfåtölj i blågrå sammetslook – bär 170 kg, elektriskt liggläge](https://www.fyndplats.se/produkt/uppresningsfatolj-sammetslook-blagra): Sitthöjd, Bredd, Maxlast, Material
- [Uppresningsfåtölj mörkgrå med 180° liggläge – två motorer, bär 170 kg](https://www.fyndplats.se/produkt/uppresningsfatolj-morkgra-180-grader): Sitthöjd, Bredd, Maxlast, Material
- [Massagefåtölj med uppresning – konstläder svart, mugghållare och 150 kg](https://www.fyndplats.se/produkt/massagefatolj-uppresning-konstlader-svart): Sitthöjd, Bredd, Maxlast, Material
- [Uppresningsfåtölj i grått konstläder – 160° liggläge, utan massage](https://www.fyndplats.se/produkt/uppresningsfatolj-grat-konstlader-160-grader): Sitthöjd, Bredd, Maxlast, Material
- [Reclinerfåtölj elektrisk med massage och värme – fälls till 150°](https://www.fyndplats.se/produkt/reclinerfatolj-elektrisk-massage-varme): Sitthöjd
- [Reclinerfåtölj mörkgrå 100 cm bred – åtta massageprogram och timer](https://www.fyndplats.se/produkt/reclinerfatolj-morkgra-atta-program): Sitthöjd, Bredd, Maxlast, Material
- [Barnfåtölj med fällbart ryggstöd – blå, fälls ut till 90 cm, bär 65 kg](https://www.fyndplats.se/produkt/barnfatolj-fallbart-ryggstod-bla): Sitthöjd, Maxlast
- [Barnfåtölj i manchester – rosa, 4,8 kg, bär 45 kg](https://www.fyndplats.se/produkt/barnfatolj-manchester-rosa): Sitthöjd, Maxlast
- [Barnfåtölj med pall – grå, rutmönstrad rygg, sitthöjd 25,5 cm](https://www.fyndplats.se/produkt/barnfatolj-med-pall-gra-rutmonstrad): Sitthöjd, Klädsel, Maxlast
- [Barnfåtölj med fotpall i eukalyptus – rosa sammet, från 3 år](https://www.fyndplats.se/produkt/barnfatolj-fotpall-eukalyptus-rosa): Sitthöjd, Maxlast
- [Barnfåtölj i linnelook – pastellblå, lös kudde, bär 65 kg](https://www.fyndplats.se/produkt/barnfatolj-linnelook-pastellbla): Sitthöjd, Maxlast
- [Barnfåtölj med hjärtformad rygg – rosa konstläder, torkas av](https://www.fyndplats.se/produkt/barnfatolj-hjartformad-rygg-rosa): Sitthöjd, Maxlast
- [Fåtölj med lös fotpall i björk – avtagbar nackkudde](https://www.fyndplats.se/produkt/fatolj-los-fotpall-bjork): Sitthöjd
- [Fåtölj med fotstöd i 5 lägen – björkstomme, bär 120 kg](https://www.fyndplats.se/produkt/fatolj-fotstod-5-lagen-bjork): Sitthöjd
- [Golvstol justerbar & hopfällbar – för spel, läsning och meditation](https://www.fyndplats.se/produkt/golvstol-justerbar-hopfallbar): Sitthöjd, Bredd
- [Fåtölj i konstläder med 360° vridfot, rygg till 130° – beige](https://www.fyndplats.se/produkt/vridfatolj-beige-130-grader): Bredd
- [Snurrstol grå med fast fyrfot – vippfunktion, utan hjul](https://www.fyndplats.se/produkt/snurrstol-gra-fast-fot): Bredd, Klädsel
- [Snurrstol benvit med fast fyrfot – vippfunktion, utan hjul](https://www.fyndplats.se/produkt/snurrstol-benvit-fast-fot): Bredd, Klädsel
- [Reclinerfåtölj i sammetslook med 360° snurr och gungning – beige](https://www.fyndplats.se/produkt/reclinerfatolj-beige-sammet): Bredd
- [Fåtölj i ljusgrå möbelväv 310 g/m² som gungar och vrider](https://www.fyndplats.se/produkt/fatolj-tat-vav-ljusgra-135-grader): Bredd, Klädsel
- [Läsfåtölj med inbyggt fotstöd, ryggen fälls till 160° – grå](https://www.fyndplats.se/produkt/lasfatolj-gra-160-grader): Bredd
- [Läsfåtölj med inbyggt fotstöd, ryggen fälls till 160° – ljusbeige](https://www.fyndplats.se/produkt/lasfatolj-ljusbeige-160-grader): Bredd
- [Fåtölj med lös fotpall i sammetslook, rygg till 130° – mörkgrå](https://www.fyndplats.se/produkt/sammetsfatolj-morkgra-med-fotpall): Bredd
- [Trefaldig golvmadrass 203 cm som viks till fåtölj, bär 240 kg](https://www.fyndplats.se/produkt/golvmadrass-203-cm): Bredd
- [Gungande fåtölj med fotpall, rygg till 135° – gräddvit](https://www.fyndplats.se/produkt/gungfatolj-graddvit-135-grader): Bredd
- [Gungande tv-fåtölj med två mugghållare och fotstöd – gråbrun](https://www.fyndplats.se/produkt/tv-fatolj-grabrun-gungande): Bredd
- [Fåtölj på 360° vridbar träfot med rygg till 135° – svart](https://www.fyndplats.se/produkt/trafotsfatolj-svart-135-grader): Bredd
- [Fåtölj på 360° vridbar träfot med rygg till 135° – grå](https://www.fyndplats.se/produkt/trafotsfatolj-gra-135-grader): Bredd
- [Fåtölj i konstläder med 360° vridfot, rygg till 130° – grå](https://www.fyndplats.se/produkt/vridfatolj-gra-130-grader): Bredd
- [Fåtölj i konstläder med 360° vridfot, rygg till 130° – gräddvit](https://www.fyndplats.se/produkt/vridfatolj-graddvit-130-grader): Bredd
- [Fåtölj i konstläder med 360° vridfot, rygg till 130° – svart](https://www.fyndplats.se/produkt/vridfatolj-svart-130-grader): Bredd
- [Manchesterfåtölj med fotpall i senapsgul – vingrygg 101 cm, 150 kg](https://www.fyndplats.se/produkt/fatolj-senapsgul-manchester-fotpall): Bredd
- [Manchesterfåtölj med fotpall i gul – vingrygg 101 cm, 150 kg](https://www.fyndplats.se/produkt/fatolj-gul-manchester-fotpall): Bredd
- [Manchesterfåtölj med fotpall i gråbeige – vingrygg 101 cm, 150 kg](https://www.fyndplats.se/produkt/fatolj-grabeige-manchester-fotpall): Bredd
- [Manchesterfåtölj med fotpall i ljusgrå – vingrygg 101 cm, 150 kg](https://www.fyndplats.se/produkt/fatolj-ljusgra-manchester-fotpall): Bredd
- [Manchesterfåtölj med fotpall i petrolblå – vingrygg 101 cm, 150 kg](https://www.fyndplats.se/produkt/fatolj-petrolbla-manchester-fotpall): Bredd
- [Manchesterfåtölj med fotpall i orange – vingrygg 101 cm, 150 kg](https://www.fyndplats.se/produkt/fatolj-orange-manchester-fotpall): Bredd
- [Golvfåtölj med 360° vridsockel och fem ryggvinklar – grå](https://www.fyndplats.se/produkt/golvfatolj-gra-fem-lagen): Bredd
- [Golvfåtölj med 360° vridsockel och fem ryggvinklar – petrolblå](https://www.fyndplats.se/produkt/golvfatolj-petrolbla-fem-lagen): Bredd
- [Golvfåtölj med 360° vridsockel och fem ryggvinklar – beige](https://www.fyndplats.se/produkt/golvfatolj-beige-fem-lagen): Bredd
- [Fåtölj med lös fotpall på rund stålfot, bär 150 kg – gräddvit](https://www.fyndplats.se/produkt/snurrfatolj-graddvit-stalfot): Bredd, Klädsel, Maxlast
- [Fåtölj med lös fotpall på rund stålfot, bär 150 kg – svart](https://www.fyndplats.se/produkt/snurrfatolj-svart-stalfot): Bredd, Klädsel, Maxlast
- [Fåtölj med lös fotpall på rund stålfot, bär 150 kg – grå](https://www.fyndplats.se/produkt/snurrfatolj-gra-stalfot): Bredd, Maxlast
- [Fåtölj med lös fotpall på rund stålfot, bär 150 kg – mörkgrå](https://www.fyndplats.se/produkt/snurrfatolj-morkgra-stalfot): Bredd, Maxlast
- [Reclinerfåtölj i grå linnelook med utfällbart fotstöd, 150 kg](https://www.fyndplats.se/produkt/reclinerfatolj-gra-150-kg): Bredd
- [Liten fåtölj 67 cm i linne med knappad rygg och svarvade ben](https://www.fyndplats.se/produkt/liten-fatolj-67-cm-knappad-rygg): Bredd
- [Tv-fåtölj i gräddvitt konstläder med mugghållare och sidoficka](https://www.fyndplats.se/produkt/tv-fatolj-sidoficka-graddvit): Bredd
- [Väggnära fåtölj i brun linnelook, 150° och 15 cm från väggen](https://www.fyndplats.se/produkt/vaggnara-fatolj-brun-150-grader): Bredd
- [Fåtölj med fotpall i böjd träfanér – linnelook, sitthöjd 39 cm](https://www.fyndplats.se/produkt/fatolj-fotpall-bojtra-linnelook): Bredd, Maxlast
- [Snurrfåtölj mörkgrå i linnelook – fast fot, sitthöjd 45–57 cm](https://www.fyndplats.se/produkt/snurrfatolj-morkgra-linnelook-fast-fot): Bredd
- [Snurrfåtölj svart i linnelook – fast fot, sitthöjd 45–57 cm](https://www.fyndplats.se/produkt/snurrfatolj-svart-linnelook-fast-fot): Bredd
- [Snurrfåtölj ljusgrå i linnelook – fast fot, sitthöjd 45–57 cm](https://www.fyndplats.se/produkt/snurrfatolj-ljusgra-linnelook-fast-fot): Bredd
- [Relaxfåtölj med fotpall i konstläder, bär 160 kg – gräddvit](https://www.fyndplats.se/produkt/relaxfatolj-graddvit-med-fotpall): Bredd
- [Relaxfåtölj med fotpall i konstläder, bär 160 kg – svart](https://www.fyndplats.se/produkt/relaxfatolj-svart-med-fotpall): Bredd
- [Fåtölj i konstläder med 360° vridfot, rygg till 145° – ljusgrå](https://www.fyndplats.se/produkt/konstladerfatolj-ljusgra-145-grader): Bredd
- [Fåtölj i konstläder med 360° vridfot, rygg till 145° – beige](https://www.fyndplats.se/produkt/konstladerfatolj-beige-145-grader): Bredd
- [Fåtölj i konstläder med 360° vridfot, rygg till 145° – brun](https://www.fyndplats.se/produkt/konstladerfatolj-brun-145-grader): Bredd
- [Fåtölj i konstläder med 360° vridfot, rygg till 145° – mörkgrå](https://www.fyndplats.se/produkt/konstladerfatolj-morkgra-145-grader): Bredd
- [Reclinerfåtölj i svart konstläder med fotpall – ryggen låses med vred](https://www.fyndplats.se/produkt/konstladerfatolj-med-fotpall-svart): Bredd, Maxlast
- [Snurrfåtölj i ljusgrått konstläder med fotpall – ryggen låses med vred](https://www.fyndplats.se/produkt/snurrfatolj-ljusgra-med-fotpall): Bredd
- [Vilfåtölj med fotpall och dolt förvaringsfack, 145° – gräddvit](https://www.fyndplats.se/produkt/vilfatolj-graddvit-med-fotpall): Bredd
- [Vilfåtölj med fotpall och dolt förvaringsfack, 145° – mörkgrå](https://www.fyndplats.se/produkt/vilfatolj-morkgra-med-fotpall): Bredd
- [Vilfåtölj med fotpall och dolt förvaringsfack, 145° – gråbrun](https://www.fyndplats.se/produkt/vilfatolj-grabrun-med-fotpall): Bredd
- [Bäddfåtölj 65 cm i grå väv med rygg i fem lägen och bädd på 185,5 cm](https://www.fyndplats.se/produkt/baddfatolj-65-cm-fem-lagen): Bredd, Klädsel
- [Gungstol med fickor i krämvit flanell – ram i gummiträ, 27 cm tjock sits](https://www.fyndplats.se/produkt/gungstol-med-fickor-kramvit-flanell): Klädsel
- [Uppresningsfåtölj med massage i ljusgrå mikrofiber – två mugghållare och fickor](https://www.fyndplats.se/produkt/uppresningsfatolj-med-massage-ljusgra): Klädsel
- [Elektrisk reclinerfåtölj i vitt – 150°, två minneslägen och USB-uttag](https://www.fyndplats.se/produkt/elektrisk-reclinerfatolj-vit-usb): Klädsel, Maxlast
- [Uppresningsfåtölj med massage och värme – elektrisk, 150°, beige](https://www.fyndplats.se/produkt/uppresningsfatolj-massage-varme-beige): Klädsel
- [Elektrisk massagefåtölj med uppresning – värme, fotstöd och 135 kg, gråbrun](https://www.fyndplats.se/produkt/elektrisk-massagefatolj-uppresning-grabrun): Klädsel
- [Reclinerfåtölj med massage och värme – snurrar och gungar, 150°, grå](https://www.fyndplats.se/produkt/reclinerfatolj-massage-snurr-gung-gra): Klädsel
- [Uppresningsfåtölj i grå frotté – elektrisk lyft 60° och åtta massagepunkter](https://www.fyndplats.se/produkt/uppresningsfatolj-gra-frotte-60-grader): Klädsel
- [Massagefåtölj med värme och fotstöd – fälls till 135°, beige frotté](https://www.fyndplats.se/produkt/massagefatolj-varme-frotte-beige): Klädsel
- [Massagestol med sex punkter och värme – brett ländstöd, 134 cm liggläge](https://www.fyndplats.se/produkt/massagestol-sex-punkter-varme-brett-landstod): Klädsel
- [Massagestol grå i mikrofiber – 155° ryggläge och sitthöjd 56–64 cm](https://www.fyndplats.se/produkt/massagestol-gra-mikrofiber-155-grader): Klädsel
- [Massagestol mörkgrå i mikrofiber – sex punkter med värme, 138 cm utfälld](https://www.fyndplats.se/produkt/massagestol-morkgra-sex-punkter-varme): Klädsel
- [Massagestol brun i mikrofiber – sex punkter med värme, 138 cm utfälld](https://www.fyndplats.se/produkt/massagestol-brun-sex-punkter-varme): Klädsel
- [Loungefåtölj i sherpafleece – gräddvit, rund sits med 25 cm skum](https://www.fyndplats.se/produkt/loungefatolj-sherpafleece-graddvit): Klädsel
- [Gungstol med fotpall i mörkgrått fleece – öronlappsrygg och nackkudde](https://www.fyndplats.se/produkt/gungstol-morkgra-fleece-fotpall): Klädsel
- [Gungstol med fotpall i beige fleece – öronlappsrygg och nackkudde](https://www.fyndplats.se/produkt/gungstol-beige-fleece-fotpall): Klädsel
- [Gungstol med fotpall i vitt fleece – gungar 90–130 grader](https://www.fyndplats.se/produkt/gungstol-vit-fleece-fotpall): Klädsel
- [Golvfåtölj med vridbar sits, fem ryggvinklar, mörkgrå](https://www.fyndplats.se/produkt/golvfatolj-vridbar-fem-ryggvinklar): Klädsel
- [Golvfåtölj med 360° vridfot – fem ryggvinklar och 15 cm tjock sits](https://www.fyndplats.se/produkt/golvfatolj-360-grader-fem-lagen): Klädsel
- [Öronlappsfåtölj i blått med knappad rygg – bär 160 kg, tvättbar sits](https://www.fyndplats.se/produkt/oronlappsfatolj-blatt-knappad-rygg): Klädsel
- [Vilstol i björk med fotstöd, fem lägen, cremevit](https://www.fyndplats.se/produkt/vilstol-bjork-fotstod-fem-lagen): Klädsel
- [Uppresningsfåtölj ljusgrå med mugghållare – massage, ländvärme och 60 cm sits](https://www.fyndplats.se/produkt/uppresningsfatolj-mugghallare-ljusgra): Klädsel
- [Uppresningsfåtölj brun med mugghållare – massage, ländvärme och 60 cm sits](https://www.fyndplats.se/produkt/uppresningsfatolj-mugghallare-brun): Klädsel
- [Uppresningsfåtölj mörkgrå som bär 200 kg – 163 cm liggläge, sitthöjd 50 cm](https://www.fyndplats.se/produkt/uppresningsfatolj-morkgra-200-kg): Klädsel
- [Uppresningsfåtölj grå som bär 200 kg – 163 cm liggläge, sitthöjd 50 cm](https://www.fyndplats.se/produkt/uppresningsfatolj-gra-200-kg): Klädsel
- [Uppresningsfåtölj cremevit som bär 200 kg – 163 cm liggläge, sitthöjd 50 cm](https://www.fyndplats.se/produkt/uppresningsfatolj-cremevit-200-kg): Klädsel
- [Massagefåtölj med knådande massage – elektrisk rygg, 20 cm väggavstånd](https://www.fyndplats.se/produkt/massagefatolj-gra-knadande-elektrisk-135-grader): Klädsel
- [Massagefåtölj i tyg – fotpall med förvaring som bär 100 kg](https://www.fyndplats.se/produkt/massagefatolj-tyg-fotpall-forvaring): Klädsel
- [Massagefåtölj i mörkgrått tyg – fotpall med förvaring som bär 100 kg](https://www.fyndplats.se/produkt/massagefatolj-morkgra-tyg-forvaring): Klädsel
- [Retro fåtölj med hundtandsmönster – armstöd i trä och guldfärgade ben i stål](https://www.fyndplats.se/produkt/retro-fatolj-hundtandsmonster-guldben): Maxlast
- [Bred fåtölj i krämvitt tyg – 83 cm sits, pocketfjädrar och två kuddar](https://www.fyndplats.se/produkt/bred-fatolj-kramvit-83-cm-sits): Maxlast

### honshus-honsgardar (21 produkter)

Filter: Material (48 %)

- [Hönsrede i trä med sex fack på två plan](https://www.fyndplats.se/produkt/honsrede-tra-6-fack): Material
- [Hönshage 3,9 m² att gå in i, med två reden](https://www.fyndplats.se/produkt/honshage-3-9-kvm-gangbar): Material
- [Sittpinnar för höns – aktivitetsställning i granträ med ramper och plattform](https://www.fyndplats.se/produkt/sittpinnar-hons-aktivitetsstallning): Material
- [Hönsgård 168 × 183 cm med ståhöjd – 3,07 m², två reden och delad dörr](https://www.fyndplats.se/produkt/honsgard-168x183-cm-stahojd): Material
- [Hönshus med rastgård 236,5 cm – tredelat rede och 1,9 m² för 3–4 höns](https://www.fyndplats.se/produkt/honshus-rastgard-236-cm-tredelat-rede): Material
- [Hönshus 280 cm med rastgård – du går in själv, sittpinne 137 cm](https://www.fyndplats.se/produkt/honshus-280-cm-rastgard-gaende): Material
- [Hönsgård 280 cm grå – 5,2 m² med fyra värpreden och gånghöjd](https://www.fyndplats.se/produkt/honsgard-280-cm-gra-fyra-varpreden): Material
- [Hönshus 247 cm med två utegårdar – upphöjt hus, ramp och värprede](https://www.fyndplats.se/produkt/honshus-247-cm-tva-utegardar): Material
- [Hönshus i granträ 347 cm med rasthage – två sittpinnar och utdragbar bricka](https://www.fyndplats.se/produkt/honshus-grantra-347-cm-rasthage): Material
- [Hönsgård med tak 300 cm – galvaniserad utegård för höns med UV-skydd](https://www.fyndplats.se/produkt/honsgard-med-tak-galvaniserad-utegard-for-hons): Material
- [Automatisk hönslucka med timer, ljussensor och fjärrkontroll – IP65](https://www.fyndplats.se/produkt/automatisk-honslucka-timer-ljussensor): Material

### eldkorgar-eldstader (18 produkter)

Filter: Diameter (44 %), Höjd (61 %, syns)

- [Vinkelbar eldkorg på stativ, 66 cm hög](https://www.fyndplats.se/produkt/vinkelbar-eldkorg-pa-stativ-66-cm): Diameter
- [Eldkorg som torn 87 cm – vedförvaring inbyggd i stativet](https://www.fyndplats.se/produkt/eldkorg-torn-87-cm-vedforvaring): Diameter, Höjd
- [3-i-1 eldkorg Ø60 cm – eldkorg, grill och bord](https://www.fyndplats.se/produkt/3-i-1-eldkorg-60-cm-med-bordslock): Diameter
- [Rökfri eldkorg 45 cm – dubbel förbränning och 8 cm vägg](https://www.fyndplats.se/produkt/rokfri-eldkorg-45-cm-8-cm-vagg): Diameter, Höjd
- [Rökfri eldkorg Ø45 cm i brons – två handtag och eldgaffel](https://www.fyndplats.se/produkt/rokfri-eldkorg-45-cm-brons): Diameter, Höjd
- [Rökfri eldkorg Ø38 cm med gnistskydd](https://www.fyndplats.se/produkt/rokfri-eldkorg-38-cm): Diameter
- [Eldkorg i trädstubbsdesign Ø61,5 cm – lock och kolgaller](https://www.fyndplats.se/produkt/eldkorg-tradstubbe-61-cm): Diameter, Höjd
- [Eldbord 81 cm med bordsyta runt elden – grill och gnistlock](https://www.fyndplats.se/produkt/eldbord-81-cm-grill-gnistlock): Diameter, Höjd
- [Stor eldkorg Ø75 cm med gnistkåpa och grillgaller](https://www.fyndplats.se/produkt/stor-eldkorg-75-cm-med-grillgaller): Diameter
- [Eldkorg Ø61 cm med gnistkåpa och grillgaller](https://www.fyndplats.se/produkt/eldkorg-61-cm-gnistkapa-grillgaller): Diameter
- [Rökfri eldkorg 48 × 48 cm – störst av de fyrkantiga](https://www.fyndplats.se/produkt/rokfri-eldkorg-48-cm-fyrkantig): Höjd
- [Eldkorg 45 × 45 cm med gnistlock och grillgaller](https://www.fyndplats.se/produkt/eldkorg-45-cm-gnistlock-grillgaller): Höjd

### snurrfatoljer (28 produkter)

Filter: Bredd (46 %), Sitthöjd (71 %, syns), Maxlast (82 %, syns)

- [Snurrfåtölj med höjdjusterbar fotpall – chenille, båda snurrar 360°](https://www.fyndplats.se/produkt/snurrfatolj-fotpall-hojdjusterbar): Bredd, Sitthöjd
- [Snurrfåtölj 60 cm med knappad rygg, gul](https://www.fyndplats.se/produkt/snurrfatolj-60-cm-gul): Bredd, Sitthöjd
- [Snurrfåtölj 60 cm med knappad rygg, cremevit](https://www.fyndplats.se/produkt/snurrfatolj-60-cm-cremevit): Bredd, Sitthöjd
- [Snurrfåtölj 60 cm med knappad rygg, mörkgrå](https://www.fyndplats.se/produkt/snurrfatolj-60-cm-morkgra): Bredd, Sitthöjd
- [Snurrfåtölj 60 cm med knappad rygg, svart](https://www.fyndplats.se/produkt/snurrfatolj-60-cm-svart): Bredd, Sitthöjd
- [Reclinerfåtölj 69 cm bred – vridbar 360° och sitthöjd 58–64 cm](https://www.fyndplats.se/produkt/reclinerfatolj-69-cm-vridbar-360): Bredd, Sitthöjd, Maxlast
- [Reclinerfåtölj med 360° snurrfot – 130° liggläge, fotpall och 150 kg](https://www.fyndplats.se/produkt/reclinerfatolj-snurrfot-130-grader): Bredd, Sitthöjd
- [Fåtölj med lös fotpall på rund stålfot, bär 150 kg – gräddvit](https://www.fyndplats.se/produkt/snurrfatolj-graddvit-stalfot): Bredd, Maxlast
- [Fåtölj med lös fotpall på rund stålfot, bär 150 kg – svart](https://www.fyndplats.se/produkt/snurrfatolj-svart-stalfot): Bredd, Maxlast
- [Fåtölj med lös fotpall på rund stålfot, bär 150 kg – grå](https://www.fyndplats.se/produkt/snurrfatolj-gra-stalfot): Bredd, Maxlast
- [Fåtölj med lös fotpall på rund stålfot, bär 150 kg – mörkgrå](https://www.fyndplats.se/produkt/snurrfatolj-morkgra-stalfot): Bredd, Maxlast
- [Snurrfåtölj mörkgrå i linnelook – fast fot, sitthöjd 45–57 cm](https://www.fyndplats.se/produkt/snurrfatolj-morkgra-linnelook-fast-fot): Bredd
- [Snurrfåtölj svart i linnelook – fast fot, sitthöjd 45–57 cm](https://www.fyndplats.se/produkt/snurrfatolj-svart-linnelook-fast-fot): Bredd
- [Snurrfåtölj ljusgrå i linnelook – fast fot, sitthöjd 45–57 cm](https://www.fyndplats.se/produkt/snurrfatolj-ljusgra-linnelook-fast-fot): Bredd
- [Snurrfåtölj i ljusgrått konstläder med fotpall – ryggen låses med vred](https://www.fyndplats.se/produkt/snurrfatolj-ljusgra-med-fotpall): Bredd
- [Armlös snurrfåtölj i chenille – 35 cm tjock sittdyna och 360° fot](https://www.fyndplats.se/produkt/snurrfatolj-armlos-35-cm-dyna): Sitthöjd

### tv-bankar (18 produkter)

Filter: Lådor (22 %), Bredd (72 %, syns), Djup (72 %, syns), Höjd (72 %, syns)

- [TV-bänk 160 cm med RGB-LED och glashylla](https://www.fyndplats.se/produkt/tv-bank-160-cm-rgb-led-glashylla): Lådor, Bredd, Djup, Höjd
- [TV-bänk 140 cm med metallben och eklucka](https://www.fyndplats.se/produkt/tv-bank-140-cm-metallben-eklucka): Lådor, Bredd, Djup, Höjd
- [TV-bänk i ek med glashylla, 140 cm](https://www.fyndplats.se/produkt/tv-bank-ek-glashylla-140-cm): Lådor, Bredd, Djup, Höjd
- [TV-bänk 180 cm väggmonterad – tre nedfällbara luckor, vit](https://www.fyndplats.se/produkt/tv-bank-180-cm-vaggmonterad-tre-luckor): Lådor
- [TV-bänk 140 cm i vitt – sex fack, två glashyllor och 39 cm höga sidofack](https://www.fyndplats.se/produkt/tv-bank-140-cm-vit-sex-fack): Lådor
- [TV-bänk 200 cm med två klaffluckor och soft close](https://www.fyndplats.se/produkt/tv-bank-200-cm-klaffluckor-soft-close): Lådor
- [TV-bänk 120 cm med LED och två luckor](https://www.fyndplats.se/produkt/tv-bank-120-cm-led-tva-luckor): Lådor
- [TV-bänk 160 cm i högglans vit](https://www.fyndplats.se/produkt/tv-bank-160-cm-hogglans-vit): Lådor
- [TV-bänk 160 cm högglans med ekskiva](https://www.fyndplats.se/produkt/tv-bank-160-cm-hogglans-ekskiva): Lådor
- [TV-bänk 140 cm med skåp och öppet fack – vit, för tv upp till 60 tum](https://www.fyndplats.se/produkt/tv-bank-140-cm-skap-oppet-fack): Lådor
- [TV-bänk 120 cm med två skjutdörrar – rustik brun, för tv upp till 60 tum](https://www.fyndplats.se/produkt/tv-bank-120-cm-skjutdorrar-rustik): Lådor
- [TV-bänk på hjul 80 cm, vit](https://www.fyndplats.se/produkt/tv-bank-pa-hjul-80-cm-vit): Lådor, Bredd, Djup, Höjd
- [TV-bänk på hjul 80 cm, svart](https://www.fyndplats.se/produkt/tv-bank-pa-hjul-80-cm-svart): Lådor, Bredd, Djup, Höjd
- [TV-bänk med vägghylla 153,6 cm – vit och ek, öppna fack och skåp](https://www.fyndplats.se/produkt/tv-bank-med-vagghylla-153-cm): Lådor

### traningsbankar (16 produkter)

Filter: Maxlast (38 %), Vikt (38 %)

- [Träningsbänk 115 cm med bensträckare och 7 ryggvinklar](https://www.fyndplats.se/produkt/traningsbank-115-cm-benstrackare): Maxlast, Vikt
- [Hopfällbar träningsbänk med justerbart ryggstöd, svart](https://www.fyndplats.se/produkt/traningsbank-butterfly-svart-hopfallbar): Maxlast, Vikt
- [Träningsbänk med justerbar rygg och sits, vadfäste, svart](https://www.fyndplats.se/produkt/traningsbank-justerbar-rygg-sits-vadfaste-svart): Maxlast
- [Träningsbänk hopfällbar med rygglyft och armstöd](https://www.fyndplats.se/produkt/traningsbank-hopfallbar-rygglyft-armstod): Maxlast
- [Träningsbänk med skivstångsställ, bröstpress och benpress, vit](https://www.fyndplats.se/produkt/traningsbank-180-cm-vit-med-skivstangsstall): Maxlast, Vikt
- [Träningsbänk med ställning 98–122 cm, hopfällbar](https://www.fyndplats.se/produkt/traningsbank-med-stallning-98-122-cm): Maxlast, Vikt
- [Situpbänk med träningsband och draghandtag – hopfällbar, bär 110 kg](https://www.fyndplats.se/produkt/situpbank-med-traningsband): Maxlast
- [Träningsbänk 146 cm med tre lutningar och bukträning](https://www.fyndplats.se/produkt/traningsbank-146-cm-tre-lutningar): Maxlast
- [Träningsbänk med skivstångsställ, bensträckare och bicepspulpet](https://www.fyndplats.se/produkt/traningsbank-175-cm-med-skivstangsstall): Maxlast, Vikt
- [Justerbar träningsbänk – hopfällbar multibänk i stål, 6 rygglägen, svart](https://www.fyndplats.se/produkt/justerbar-traningsbank): Maxlast
- [Träningsbänk i trä med hantelfack och 6 ryggvinklar](https://www.fyndplats.se/produkt/traningsbank-i-tra-med-hantelfack): Vikt
- [Scottbänk 2-i-1 för biceps och triceps – 25 vinklar](https://www.fyndplats.se/produkt/scottbank-2-i-1-biceps-triceps-25-vinklar): Vikt
- [Träningsbänk med benrullar och gummiband – 7 rygglägen, 350 kg](https://www.fyndplats.se/produkt/traningsbank-med-benrullar-gummiband): Vikt
- [Hopfällbar träningsbänk med justerbart ryggstöd – 300 kg, röd](https://www.fyndplats.se/produkt/hopfallbar-traningsbank-justerbart-ryggstod-rod): Vikt
- [Sissy squat-bänk 3-i-1 – justerbar magträningsbräda för squats och armhävningar](https://www.fyndplats.se/produkt/sissy-squat-bank-3-i-1): Vikt

### solskydd-paviljonger (45 produkter)

Filter: Bredd (49 %), Höjd (42 %), Längd (82 %, syns), Material (89 %, syns)

- [Paviljong 3x6 m i svart – pop up med fyra avtagbara sidoväggar](https://www.fyndplats.se/produkt/paviljong-3x6-m-svart-fyra-sidovaggar): Bredd, Höjd
- [Paviljongtak 3 × 3 m dubbeltak – gråbrun duk med mörkbrun topp, utan stomme](https://www.fyndplats.se/produkt/paviljongtak-3x3-tvafargat-dubbeltak-brun): Bredd, Höjd
- [Paviljongtak 3 × 3 m dubbeltak – grå duk med mörkgrå topp, utan stomme](https://www.fyndplats.se/produkt/paviljongtak-3x3-tvafargat-dubbeltak-gra): Bredd, Höjd
- [Pergolatak 298 × 293 cm – reservduk mörkgrå, utan stomme](https://www.fyndplats.se/produkt/pergolatak-298x293-vaggmonterat-morkgra): Bredd, Höjd
- [Pergolamarkis 2,85 × 2 m – veckad reservduk, mörkgrå, utan stomme](https://www.fyndplats.se/produkt/pergolamarkis-285x2-utdragbar-morkgra): Bredd, Höjd
- [Hardtop-paviljong 300 cm med polykarbonattak – gardiner och myggnät](https://www.fyndplats.se/produkt/hardtop-paviljong-300-cm-polykarbonattak): Bredd, Höjd, Längd, Material
- [Paviljongtak 3 × 3 m dubbeltak – mörkgrå reservduk, utan stomme](https://www.fyndplats.se/produkt/paviljongtak-3x3-dubbeltak-morkgra): Bredd, Höjd
- [Paviljongtak 3 × 3 m dubbeltak – kaffebrun reservduk, utan stomme](https://www.fyndplats.se/produkt/paviljongtak-3x3-dubbeltak-kaffebrun): Bredd, Höjd
- [Fristående markis, höjdjusterbar 220–310 cm, mörkgrå](https://www.fyndplats.se/produkt/fristaende-markis-220-310-cm): Bredd, Höjd
- [Vertikalmarkis för balkong, vindskydd, grå](https://www.fyndplats.se/produkt/vertikalmarkis-balkong-vindskydd): Bredd, Höjd, Längd
- [Paviljongtak 3 × 3 m dubbeltak – roströd reservduk, utan stomme](https://www.fyndplats.se/produkt/paviljongtak-3x3-dubbeltak-rostrod): Bredd, Höjd
- [Paviljongtak 3 × 4 m dubbeltak – roströd reservduk, utan stomme](https://www.fyndplats.se/produkt/paviljongtak-3x4-dubbeltak-rostrod): Bredd, Höjd
- [Paviljongtak 3 × 4 m dubbeltak – cremevit reservduk, utan stomme](https://www.fyndplats.se/produkt/paviljongtak-3x4-dubbeltak-cremevit): Bredd, Höjd
- [Paviljongtak 3 × 3 m dubbeltak – mörkgrön reservduk, utan stomme](https://www.fyndplats.se/produkt/paviljongtak-3x3-dubbeltak-morkgron): Bredd, Höjd
- [Paviljongtak 3 × 3 m med dubbeltak – reservduk i creme, utan stomme](https://www.fyndplats.se/produkt/paviljongtak-3x3-dubbeltak-creme): Bredd, Höjd
- [Rektangulärt parasoll 200 × 150 cm – trästång med tre lutningslägen](https://www.fyndplats.se/produkt/rektangulart-parasoll-200x150): Bredd
- [Parasoll Ø260 cm med vev – aluminium, lutbart, brunt](https://www.fyndplats.se/produkt/parasoll-260-cm-vev-aluminium-lutbart): Bredd, Längd
- [Parasoll Ø300 cm i trä – dubbeltak och 8 spröt, elfenben](https://www.fyndplats.se/produkt/parasoll-300-cm-tra-dubbeltak): Bredd, Längd
- [Parasollfot cement 12 kg – bronsfärgad rund fot, parasoll upp till 2 m](https://www.fyndplats.se/produkt/parasollfot-cement-12-kg-brons-rund): Bredd, Höjd, Längd, Material
- [Svart parasollfot 12 kg – rund fot Ø44 cm för 38/48 mm](https://www.fyndplats.se/produkt/svart-parasollfot-12-kg-38-48-mm): Bredd, Höjd, Längd, Material
- [Markis med vev 200 × 150 cm – fristående infällbar, grön](https://www.fyndplats.se/produkt/markis-med-vev-200x150): Bredd, Höjd
- [Skuggväv för pergola – 90% solskydd i HDPE med öljetter, för trädgård](https://www.fyndplats.se/produkt/skuggvav-pergola-90-solskydd-hdpe): Bredd, Höjd, Längd
- [Pop up-paviljong med myggnät, 6-sidig – 10×10 & 12×12 ft](https://www.fyndplats.se/produkt/pop-up-paviljong-myggnat-6-sidig): Bredd, Höjd, Längd
- [Paviljongtak 3 × 3 m Oxfordväv 370 g/m² – reservduk i mörkgrått, utan stomme](https://www.fyndplats.se/produkt/paviljongtak-3x3-oxfordvav-370-morkgra): Höjd
- [Paviljongtak 3 × 3 m Oxfordväv 370 g/m² – reservduk i beige, utan stomme](https://www.fyndplats.se/produkt/paviljongtak-3x3-oxfordvav-370-beige): Höjd
- [Pergolatak till indragbart tak 250 × 255 cm, brun](https://www.fyndplats.se/produkt/pergolatak-indragbart-250x255-brun): Höjd
- [Pergolatak till indragbart tak 250 × 255 cm, mörkbrun](https://www.fyndplats.se/produkt/pergolatak-indragbart-250x255-morkbrun): Höjd
- [Pergolatak till indragbart tak 250 × 255 cm, beige](https://www.fyndplats.se/produkt/pergolatak-indragbart-250x255-beige): Höjd
- [Paviljongtak 3x3 m – reservtak i polyester med ventilerad topp, utan stomme](https://www.fyndplats.se/produkt/paviljongtak-3x3-m-reservtak-polyester): Höjd
- [Pop-up-tält 6 × 3 m – sex väggar och justerbar höjd](https://www.fyndplats.se/produkt/popup-talt-6x3-m-sex-vaggar-justerbar-hojd): Material
- [Pop-up-tält 3,5 × 3,5 m – dubbeltak med UPF50+, mörkgrått](https://www.fyndplats.se/produkt/popup-talt-3-5x3-5-m-dubbeltak-upf50): Material

### baby-smabarn (67 produkter)

Filter: Maxlast (52 %), Ålder (72 %, syns), Material (88 %, syns)

- [Lekmatta 160 × 100 cm med stadsmotiv – vägar, rondeller och hus, halkskyddad](https://www.fyndplats.se/produkt/lekmatta-stadsmotiv-160x100): Maxlast, Ålder
- [Krypmatta 200 × 150 cm med djurmotiv – vikbar, 1,5 cm skum och väska](https://www.fyndplats.se/produkt/krypmatta-200x150-cm-djurmotiv-vikbar): Maxlast, Material
- [Balanscykel med tre hjul för 12–36 månader – tysta EVA-hjul, sitthöjd 26,5 cm](https://www.fyndplats.se/produkt/balanscykel-tre-hjul-12-36-manader): Maxlast
- [Babygunga 3-i-1 med ryggstöd och säkerhetsbygel – rep 120–180 cm, bär 70 kg](https://www.fyndplats.se/produkt/babygunga-3-i-1-ryggstod-sakerhetsbygel): Maxlast, Ålder
- [Gunghäst i trä med zebraränder – handtag och ryggstöd, 1–3 år](https://www.fyndplats.se/produkt/gunghast-tra-zebra-1-3-ar): Maxlast
- [Gunghäst med lejondesign i trä – handtag och ryggstöd, 2–5 år, bär 25 kg](https://www.fyndplats.se/produkt/gunghast-lejon-tra-handtag-ryggstod): Maxlast
- [Pall för barn med tre steg och handtag – ställs om till två steg, 2–5 år](https://www.fyndplats.se/produkt/pall-for-barn-tre-steg-handtag): Maxlast
- [Gåvagn 3-i-1 i trä med dubbelsidig aktivitetstavla – för barn från 1 år](https://www.fyndplats.se/produkt/gavagn-3-i-1-tra-aktivitetstavla): Maxlast, Ålder, Material
- [Gåvagn i trä med aktiviteter – formsortering, kulram och förvaring, från 1 år](https://www.fyndplats.se/produkt/gavagn-tra-aktiviteter-formsortering): Maxlast, Ålder, Material
- [Vespa GTS elscooter för barn 6 V, vit — 18–36 månader](https://www.fyndplats.se/produkt/elscooter-barn-vespa-vit): Maxlast
- [Vespa GTS elscooter för barn 6 V, mintgrön — 18–36 månader](https://www.fyndplats.se/produkt/elscooter-barn-vespa-gron): Maxlast
- [Elfyrhjuling för barn 6 V med fram- och backväxel, svart och rosa](https://www.fyndplats.se/produkt/elfyrhjuling-barn-6v): Maxlast
- [Gåvagn i trä med xylofon, kulram och formlåda – fem klossar, från 18 månader](https://www.fyndplats.se/produkt/gavagn-tra-xylofon-kulram-klossar): Maxlast, Ålder, Material
- [Gåvagn i trä med aktivitetspanel – xylofon, formsortering, från 18 månader](https://www.fyndplats.se/produkt/gavagn-tra-montessori-aktivitetspanel): Maxlast, Ålder
- [Lekmatta 196 × 176 cm, dubbelsidig och vikbar – 1,5 cm tjockt skum](https://www.fyndplats.se/produkt/lekmatta-196x176-dubbelsidig): Maxlast, Ålder, Material
- [Skumklossar 6 delar för 1–3 år – trappa, våg, slänt och mattor, 150 × 100 cm](https://www.fyndplats.se/produkt/skumklossar-6-delar-klatterbana): Maxlast, Material
- [Skumklossar 4 delar för 12–36 månader – ramp, trappa, block och matta](https://www.fyndplats.se/produkt/skumklossar-4-delar-kvartsrund-matta): Maxlast
- [Skumklossar 4 delar – ramp, trappa, tunnel och halvcylinder](https://www.fyndplats.se/produkt/skumklossar-4-delar-ramp-trappa-tunnel): Maxlast, Ålder
- [Skumklossar 12 kuber för 1–3 år – 20 cm, konstläder i sex färger](https://www.fyndplats.se/produkt/skumklossar-12-kuber-sex-farger): Maxlast
- [Trehjuling för småbarn i motorcykeldesign – orange, sitthöjd 29 cm, 18–36 mån](https://www.fyndplats.se/produkt/trehjuling-smabarn-motorcykel-orange): Maxlast, Ålder
- [Aktivitetstavla med dinosaurie för väggen – xylofon, labyrint, spegel, från 2 år](https://www.fyndplats.se/produkt/aktivitetstavla-vagg-dinosaurie): Maxlast
- [Rutschkana för småbarn formad som en giraff – basketkorg och boll, 1–3 år](https://www.fyndplats.se/produkt/rutschkana-giraff-basketkorg-smabarn): Maxlast
- [Rutschkana för småbarn i raketdesign – 1,35 m rutschbana, för 1,5–3 år](https://www.fyndplats.se/produkt/rutschkana-smabarn-raketdesign-bla): Maxlast, Ålder
- [Babygunga 3-i-1 med avtagbart ryggstöd – grön, 9–36 månader](https://www.fyndplats.se/produkt/babygunga-3-i-1-avtagbart-ryggstod-gron): Maxlast
- [Lekmatta bebis hopfällbar & vändbar – XPE-skum, 2 mönster](https://www.fyndplats.se/produkt/lekmatta-bebis-hopfallbar-vandbar): Maxlast, Ålder, Material
- [Lekhage baby XXL 200×149/200×179 cm – 50 bollhavsbollar & dragkedja](https://www.fyndplats.se/produkt/lekhage-baby-xxl-50-bollar): Maxlast
- [Uppblåsbart babybadkar för 0–3 år – hopfällbart med pump och lagningskit](https://www.fyndplats.se/produkt/uppblasbart-babybadkar): Maxlast
- [Väggmonterat skötbord – fällbart för vägg med säkerhetsbälte och krokar](https://www.fyndplats.se/produkt/vaggmonterat-skotbord): Maxlast, Ålder
- [Hopfällbart babybadkar med termometer – portabelt resebadkar för 0–36 mån](https://www.fyndplats.se/produkt/hopfallbart-babybadkar-termometer): Maxlast
- [Babybadkar med Ställning 3-i-1 Hopfällbart](https://www.fyndplats.se/produkt/babybadkar-med-stallning): Maxlast, Ålder
- [Bröstpumpsväska ryggsäck med kylfack – för bröstpump, flaskor och tillbehör](https://www.fyndplats.se/produkt/brostpumpsvaska-ryggsack-kylfack): Maxlast, Ålder
- [IMILAB Babyvakt & övervakningskamera – AI-detektering & mörkerseende](https://www.fyndplats.se/produkt/imilab-babyvakt-kamera-ai-morkerseende): Maxlast, Ålder, Material
- [Skumklossar 2 delar – klätterhus med trappa, tunnel och rutschramp, 131 cm](https://www.fyndplats.se/produkt/skumklossar-2-delar-klatterhus): Ålder
- [Skumklossar 5 delar med tunnel – bågar som passar i varandra, ramp och trappa](https://www.fyndplats.se/produkt/skumklossar-5-delar-tunnel-bagar): Ålder
- [Skumklossar 3 delar – krypbana på 141 cm med ramp, svacka och trappa](https://www.fyndplats.se/produkt/skumklossar-3-delar-krypbana): Ålder
- [Skumklossar 7 delar med båge – tvättbar sammet, halkfri undersida, gul och grå](https://www.fyndplats.se/produkt/skumklossar-7-delar-bage-sammet): Ålder

### pallar (51 produkter)

Filter: Sitthöjd (49 %), Klädsel (65 %, syns), Maxlast (75 %, syns)

- [Duschpall i bambu med hylla – bär 100 kg, 47,5 × 26 × 44,5 cm](https://www.fyndplats.se/produkt/duschpall-bambu-med-hylla): Sitthöjd, Klädsel, Maxlast
- [Sadelpall på hjul i svart konstläder – sitthöjd 55–71 cm, bär 120 kg](https://www.fyndplats.se/produkt/sadelpall-hjul-svart-konstlader): Sitthöjd, Maxlast
- [Pall för barn med tre steg och handtag – ställs om till två steg, 2–5 år](https://www.fyndplats.se/produkt/pall-for-barn-tre-steg-handtag): Sitthöjd, Klädsel, Maxlast
- [Sittpallar 4-pack stapelbara i mörkgrönt – rund sits, bär 120 kg](https://www.fyndplats.se/produkt/sittpallar-4-pack-stapelbara-morkgrona): Sitthöjd, Maxlast
- [Sminkpall i rosa teddytyg – rund pall Ø40 cm, 45 cm hög, bär 120 kg](https://www.fyndplats.se/produkt/sminkpall-rosa-teddytyg): Sitthöjd, Maxlast
- [Barpallar i svart metall, 4-pack – stapelbara, 76 cm höga och för inne och ute](https://www.fyndplats.se/produkt/barpallar-svart-metall-4-pack-stapelbara): Sitthöjd, Klädsel
- [Pianopall i sammet 45–56 cm med vit träram](https://www.fyndplats.se/produkt/pianopall-sammet): Sitthöjd
- [Vit pianopall med notförvaring 48–58 cm](https://www.fyndplats.se/produkt/pianopall-med-forvaring-vit): Sitthöjd
- [Pianopall 64 cm med svängda ben och tjock dyna](https://www.fyndplats.se/produkt/pianopall-med-svangda-ben): Sitthöjd
- [Svart pianopall med dolt förvaringsfack 46–56 cm](https://www.fyndplats.se/produkt/pianopall-med-forvaring-svart): Sitthöjd
- [Pianopall i svart högglans, höjdjusterbar 45–56 cm](https://www.fyndplats.se/produkt/pianopall-hogglans-svart): Sitthöjd
- [Verkstadspall med lådor och verktygsfack – bär 135 kg](https://www.fyndplats.se/produkt/verkstadspall-med-lador-135-kg): Sitthöjd, Klädsel
- [Pendelpall med vippande sits – 56,5–71,5 cm, för ståbord](https://www.fyndplats.se/produkt/pendelpall-vippande-sits): Sitthöjd, Klädsel
- [Fyra stapelbara pallar med stoppad sits – grått tyg, svarta stålben, 45 cm höga](https://www.fyndplats.se/produkt/fyra-stapelbara-pallar-gra-sits): Sitthöjd, Klädsel, Maxlast
- [Snurrbar pall i grå sammet med förvaring – höj- och sänkbar 49–65 cm, bär 120 kg](https://www.fyndplats.se/produkt/snurrbar-pall-gra-sammet-forvaring): Sitthöjd, Maxlast
- [Stapelbara pallar 4-pack, grå sits, ben i böjträ](https://www.fyndplats.se/produkt/stapelbara-pallar-4-pack-gra-sits): Sitthöjd
- [Stapelbara pallar 4-pack, cremevit, böjträben](https://www.fyndplats.se/produkt/stapelbara-pallar-4-pack-cremevit): Sitthöjd
- [Pall i fransk lantstil – stoppad sits i beige tyg och ram i gummiträ](https://www.fyndplats.se/produkt/pall-fransk-lantstil-beige): Sitthöjd, Klädsel, Maxlast
- [Pall med stoppad sits i mörkgrått tyg – svarta stålben, 42 × 42 × 44 cm](https://www.fyndplats.se/produkt/pall-stoppad-sits-morkgra-stalben): Sitthöjd, Klädsel, Maxlast
- [Pall i turkos sammetslook 44,5 cm med 31 cm stoppning](https://www.fyndplats.se/produkt/pall-turkos-44-cm-stalben): Sitthöjd
- [Ståpall som gungar och snurrar – ergonomisk pall 65,5–83,5 cm, bär 125 kg](https://www.fyndplats.se/produkt/stapall-vickar-snurrar-ergonomisk): Sitthöjd, Klädsel
- [Hopfällbar knäpall – vänds till sittpall, verktygsväska ingår](https://www.fyndplats.se/produkt/hopfallbar-knapall-sittpall): Sitthöjd, Klädsel
- [Duschpall höj- och sänkbar 39–51,5 cm – U-sits och stödhandtag](https://www.fyndplats.se/produkt/duschpall-hoj-och-sankbar-39-51-cm): Sitthöjd, Klädsel
- [Stegpall barn med 2 steg – pall i trä för badrum och kök, från 3 år](https://www.fyndplats.se/produkt/stegpall-barn-2-steg-badrum-kok): Sitthöjd, Klädsel
- [Trädgårdspall på hjul med vridbar sits, styre och förvaringskorg](https://www.fyndplats.se/produkt/tradgardspall-pa-hjul): Sitthöjd, Klädsel, Maxlast
- [Hopfällbar stegpall – höj- och sänkbar pall i stål, 150 kg, för barn och vuxna](https://www.fyndplats.se/produkt/hopfallbar-stegpall): Sitthöjd, Klädsel
- [Barpallar 2-pack i ekoptik – snurrbara, sitthöjd 59–80 cm, svart fot](https://www.fyndplats.se/produkt/barpallar-2-pack-ekoptik-snurrbara): Klädsel, Maxlast
- [Salongspall utan rygg – 9 cm formgjutet skum, 52–67,5 cm](https://www.fyndplats.se/produkt/salongspall-utan-rygg-9-cm-skum): Klädsel
- [Duschpall rund Ø32,5 cm – 8 höjdlägen från 34,8 cm](https://www.fyndplats.se/produkt/duschpall-rund-32-5-cm-8-hojdlagen): Klädsel
- [Duschpall 39,5–56,5 cm i aluminium – 135 kg](https://www.fyndplats.se/produkt/duschpall-39-56-cm-aluminium-135-kg): Klädsel
- [Pall till sminkbord i ljusgrå sammet – Ø35 cm, på hjul, sitthöjd 49–61 cm](https://www.fyndplats.se/produkt/pall-till-sminkbord-ljusgra-sammet-hjul): Maxlast
- [Stapelbara pallar 4-pack – rund sammetssits Ø 40 cm, 46 cm hög](https://www.fyndplats.se/produkt/stapelbara-pallar-4-pack): Maxlast

### baddfatoljer (28 produkter)

Filter: Sitthöjd (39 %)

- [Golvfåtölj i grå sammet som blir bädd – ryggstöd i tre lägen, 102 cm](https://www.fyndplats.se/produkt/golvfatolj-baddbar-gra-sammet-102-cm): Sitthöjd
- [Bäddfåtölj med 190 cm bäddlängd och sex ryggvinklar, mörkgrön](https://www.fyndplats.se/produkt/baddfatolj-190-cm): Sitthöjd
- [Bäddfåtölj med armstöd i gummiträ, 183 cm bädd, gräddvit](https://www.fyndplats.se/produkt/baddfatolj-med-armstod): Sitthöjd
- [Bäddfåtölj i manchester med 90 cm bred bädd, mörkgrå](https://www.fyndplats.se/produkt/baddfatolj-manchester-90-cm-morkgra): Sitthöjd
- [Bäddfåtölj i manchester med 90 cm bred bädd, beige](https://www.fyndplats.se/produkt/baddfatolj-manchester-90-cm-beige): Sitthöjd
- [Bäddfåtölj med sidofickor och träarmstöd, 183 cm bädd](https://www.fyndplats.se/produkt/baddfatolj-sidofickor-183-cm): Sitthöjd
- [Bäddfåtölj 90 cm bred med OEKO-TEX-tyg och tre ryggvinklar](https://www.fyndplats.se/produkt/baddfatolj-90-cm-oeko-tex): Sitthöjd
- [Bäddfåtölj 186 cm med armstöd och ryggen i fem lägen, grå](https://www.fyndplats.se/produkt/baddfatolj-186-cm-armstod-gra): Sitthöjd
- [Bäddfåtölj 98 cm bred bädd med armstöd i gummiträ, ljusbrun](https://www.fyndplats.se/produkt/baddfatolj-98-cm-armstod-ljusbrun): Sitthöjd
- [Bäddfåtölj med armstöd i gummiträ, 185 cm bädd, blå](https://www.fyndplats.se/produkt/baddfatolj-med-armstod-bla): Sitthöjd
- [Bäddfåtölj med armstöd i gummiträ, 183 cm bädd, taupe](https://www.fyndplats.se/produkt/baddfatolj-med-armstod-taupe): Sitthöjd
- [Bäddfåtölj med armstöd i gummiträ, 183 cm bädd, mörkgrå](https://www.fyndplats.se/produkt/baddfatolj-med-armstod-morkgra): Sitthöjd
- [Bäddfåtölj med armstöd i gummiträ, 183 cm bädd, svart](https://www.fyndplats.se/produkt/baddfatolj-med-armstod-svart): Sitthöjd
- [Bäddfåtölj med armstöd i gummiträ, 185 cm bädd, beige](https://www.fyndplats.se/produkt/baddfatolj-med-armstod-beige): Sitthöjd
- [Bäddfåtölj i manchester utan armstöd — bädd 193 × 82 cm, tre ryggvinklar](https://www.fyndplats.se/produkt/baddfatolj-manchester-utan-armstod-193x82): Sitthöjd
- [Bäddfåtölj 188 cm med runda armstödskuddar och ryggen i fem lägen](https://www.fyndplats.se/produkt/baddfatolj-188-cm-runda-armstod): Sitthöjd
- [Gästsäng 4-i-1 i grått tyg – säng på 188 cm, vilfåtölj, fåtölj eller pall](https://www.fyndplats.se/produkt/gastsang-4-i-1-sang-fatolj-pall): Sitthöjd

### kalas-fest (104 produkter)

Filter: Bredd (53 %), Höjd (52 %), Material (38 %)

- [Snötäckt julgran 180 cm med 200 LED och metallfot](https://www.fyndplats.se/produkt/snotackt-julgran-180-cm-med-led): Bredd
- [Animerad lieman 170 cm – roterar, rör käken och lyser rött](https://www.fyndplats.se/produkt/animerad-lieman-170-cm): Bredd, Höjd, Material
- [Halloweenflicka på gunghäst 72 cm – gungar, lyser och sjunger](https://www.fyndplats.se/produkt/halloweenflicka-gunghast-72-cm): Bredd, Höjd, Material
- [Hängande zombie 110 cm i kedjor – skriker och skakar](https://www.fyndplats.se/produkt/hangande-zombie-110-cm-kedjor): Bredd, Höjd, Material
- [Animerad bordshäxa 47 cm som rör om i kitteln](https://www.fyndplats.se/produkt/animerad-bordshaxa-47-cm): Bredd, Höjd, Material
- [Animerad cirkusclown 167 cm – huvudet vrids 180 grader](https://www.fyndplats.se/produkt/animerad-cirkusclown-167-cm): Bredd, Höjd, Material
- [Pop up-pumpaskelett 173 cm – huvudet skjuter upp i jump scare](https://www.fyndplats.se/produkt/pop-up-pumpaskelett-173-cm): Bredd, Höjd, Material
- [Halloweenspöke 100 cm med bruten rygg – svänger och skriker](https://www.fyndplats.se/produkt/halloweenspoke-100-cm-bruten-rygg): Bredd, Höjd, Material
- [Animerad lieman i kedjor 170 cm – rör huvud och händer](https://www.fyndplats.se/produkt/animerad-lieman-i-kedjor-170-cm): Bredd, Höjd, Material
- [Halloweenhäxa 180 cm med ansiktsbyte – röda LED-ögon och ljud](https://www.fyndplats.se/produkt/halloweenhaxa-180-cm-ansiktsbyte): Bredd, Höjd, Material
- [Lysande jultomte 93 cm – 97 LED med fast sken eller blink](https://www.fyndplats.se/produkt/lysande-jultomte-93-cm-97-led): Bredd, Höjd, Material
- [Lysande snögubbefamilj i tre delar – 128 LED, högsta 91,5 cm](https://www.fyndplats.se/produkt/lysande-snogubbefamilj-tre-delar-128-led): Bredd, Höjd, Material
- [Uppblåsbar jättelieman 3,7 m med nio LED](https://www.fyndplats.se/produkt/uppblasbar-jattelieman-37-m): Bredd, Höjd, Material
- [Hängande halloweenhäxa 183 cm i lila – ljudstyrd](https://www.fyndplats.se/produkt/hangande-halloweenhaxa-183-cm-lila): Bredd, Höjd, Material
- [Stående spökfigur 183 cm med kedja – rör huvud och kropp](https://www.fyndplats.se/produkt/staende-spokfigur-183-cm-kedja): Bredd, Höjd, Material
- [Animerad halloweenhäxa 150 cm med lykta – ljudstyrd](https://www.fyndplats.se/produkt/animerad-halloweenhaxa-150-cm-lykta): Bredd, Höjd, Material
- [Lysande ren med släde – 170 LED, renen 118 cm hög](https://www.fyndplats.se/produkt/lysande-ren-med-slade-170-led): Bredd, Höjd, Material
- [Hängande spöke 204 cm med grön hatt – skakar hela kroppen](https://www.fyndplats.se/produkt/hangande-spoke-204-cm-gron-hatt): Bredd, Höjd, Material
- [Skräckdocka 160 cm i svart spetsklänning – vrider huvudet](https://www.fyndplats.se/produkt/skrackdocka-160-cm-spetsklanning): Bredd, Höjd, Material
- [Enögd mumie 35 cm som kryper upp ur marken](https://www.fyndplats.se/produkt/enogd-mumie-35-cm): Bredd, Höjd, Material
- [Läskig clown 173 cm i rosa och svart – skrattar och rör sig](https://www.fyndplats.se/produkt/laskig-clown-173-cm): Bredd, Höjd, Material
- [Hängande skelett 183 cm med grönt huvud och röd bröstkorg](https://www.fyndplats.se/produkt/hangande-skelett-183-cm): Bredd, Höjd, Material
- [Uppblåsbar jultomte i skorsten 210 cm – vinkar och lyser](https://www.fyndplats.se/produkt/uppblasbar-jultomte-skorsten-210-cm): Bredd, Höjd, Material
- [Uppblåsbar lieman-port 2,85 m med lysande röda ögon](https://www.fyndplats.se/produkt/uppblasbar-lieman-port-285-m): Bredd, Höjd, Material
- [Motorsågsmördare 170 cm – skakar, lyser rött och låter](https://www.fyndplats.se/produkt/motorsagsmordare-170-cm): Bredd, Höjd, Material
- [Halloweenhäxa 183 cm med lysande hjärta och gröna löv](https://www.fyndplats.se/produkt/halloweenhaxa-183-cm-lysande-hjarta): Bredd, Höjd, Material
- [Halloweenspöke 183 cm med lysande pumpa på bröstet](https://www.fyndplats.se/produkt/halloweenspoke-183-cm-lysande-pumpa): Bredd, Höjd, Material
- [Skräckdocka 60 cm som hoppar upp – röda ögon och tjut](https://www.fyndplats.se/produkt/skrackdocka-60-cm-hoppar-upp): Bredd, Höjd, Material
- [Uppblåsbart pumpspöke 240 cm med grönt sken och tre pumpor](https://www.fyndplats.se/produkt/uppblasbart-pumpspoke-240-cm): Bredd, Höjd, Material
- [Uppblåsbart spökträd 240 cm med gravsten, zombie och pumpa](https://www.fyndplats.se/produkt/uppblasbart-spoktrad-240-cm): Bredd, Höjd, Material
- [Uppblåsbar dödskallefigur 210 cm med horn och blått sken](https://www.fyndplats.se/produkt/uppblasbar-dodskallefigur-210-cm-horn): Bredd, Höjd, Material
- [Uppblåsbar pumpa med svart katt som åker upp och ner](https://www.fyndplats.se/produkt/uppblasbar-pumpa-med-katt): Bredd, Höjd, Material
- [Uppblåsbart halloweenträd 274 cm med uggla, spöke och pumpor](https://www.fyndplats.se/produkt/uppblasbart-halloweentrad-274-cm): Bredd, Höjd, Material
- [Uppblåsbart pumpspöke 270 cm med grön kropp och sex LED](https://www.fyndplats.se/produkt/uppblasbart-pumpspoke-270-cm): Bredd, Höjd, Material
- [Uppblåsbart spöke 240 cm med blinkande ögon och lyst mage](https://www.fyndplats.se/produkt/uppblasbart-spoke-240-cm-blinkande-ogon): Bredd, Höjd, Material
- [Uppblåsbart spöke 180 cm med pumpa på huvudet](https://www.fyndplats.se/produkt/uppblasbart-spoke-180-cm-pumpa-pa-huvudet): Bredd, Höjd, Material
- [Uppblåsbart spöke 180 cm med 130 cm vingbredd](https://www.fyndplats.se/produkt/uppblasbart-spoke-180-cm-brett): Bredd, Höjd, Material
- [Uppblåsbart spökträd 240 cm med uggla och tre pumpor](https://www.fyndplats.se/produkt/uppblasbart-spoktrad-240-cm-uggla): Bredd, Höjd, Material
- [Adventskalender i trä med 24 lådor – belyst byscen, 36 cm bred](https://www.fyndplats.se/produkt/adventskalender-tra-24-lador-byscen): Bredd, Höjd, Material
- [Smal snögran 180 cm – Ø80 cm, 600 grenspetsar och gångjärn](https://www.fyndplats.se/produkt/smal-snogran-180-cm-80-cm-bred): Bredd, Höjd, Material
- [Julgran 180 cm med 4030 grenspetsar – katalogens tätaste](https://www.fyndplats.se/produkt/julgran-180-cm-4030-grenspetsar): Bredd, Material
- [Snöad julgran 180 cm med 61 kottar – Ø103 cm](https://www.fyndplats.se/produkt/snoad-julgran-180-cm-61-kottar): Bredd, Höjd, Material
- [Smal snögran 180 cm – bara 55 cm bred, 390 grenar](https://www.fyndplats.se/produkt/smal-snogran-180-cm-55-cm-bred): Bredd, Höjd, Material
- [Uppblåsbar pumpa 180 cm med tre spöken som reser sig](https://www.fyndplats.se/produkt/uppblasbar-pumpa-180-cm-tre-spoken): Bredd, Höjd, Material
- [Uppblåsbart pumpträd 240 cm med fyra pumpor i grenarna](https://www.fyndplats.se/produkt/uppblasbart-pumptrad-240-cm): Bredd, Höjd, Material
- [Tre uppblåsbara häxor runt en kittel – 180 cm hög grupp](https://www.fyndplats.se/produkt/uppblasbara-haxor-med-kittel-180-cm): Bredd, Höjd, Material
- [Rund bordsduk i vit polyester 10-pack ø305 cm för fest och bröllop](https://www.fyndplats.se/produkt/rund-bordsduk): Bredd, Höjd
- [Stretch stolsöverdrag 30-pack – elastisk stolsklädsel i spandex för fest](https://www.fyndplats.se/produkt/stretch-stolsoverdrag): Bredd, Höjd
- [Stolband med rosett 50-pack i guld – satin för fest och bröllop](https://www.fyndplats.se/produkt/stolband-med-rosett): Bredd, Höjd
- [Uppblåsbar halloweenport 3 × 3 m med fyra spöken och LED](https://www.fyndplats.se/produkt/uppblasbar-halloweenport-fyra-spoken): Höjd, Material
- [Julgranskrage i trä 65 × 65 cm – döljer granfoten, granar 1,8–2,7 m](https://www.fyndplats.se/produkt/julgranskrage-tra-65x65-cm): Höjd, Material
- [Adventskalender i MDF 34 × 34 cm – 24 stora lådor och LED-byscen](https://www.fyndplats.se/produkt/adventskalender-mdf-24-stora-lador): Höjd, Material
- [Uppblåsbar halloweenfigur 210 cm med lysande pumphuvud](https://www.fyndplats.se/produkt/uppblasbar-halloweenfigur-pumphuvud-210-cm): Material
- [Uppblåsbart krypande skelett 153 cm för halloween](https://www.fyndplats.se/produkt/uppblasbart-krypande-skelett-halloween): Material
- [Uppblåsbart jätteskelett 310 cm med blodröd tunga](https://www.fyndplats.se/produkt/uppblasbart-jatteskelett-310-cm): Material
- [Julgran 183 cm med 2380 grenspetsar – gångjärn, klar på 10 min](https://www.fyndplats.se/produkt/julgran-183-cm-2380-grenspetsar): Material
- [Julgran 180 cm med 748 grenspetsar – Ø120 cm, hopfällbar fot](https://www.fyndplats.se/produkt/julgran-180-cm-748-grenspetsar): Material
- [Julgran 150 cm med 444 grenspetsar – Ø105 cm, hopfällbar fot](https://www.fyndplats.se/produkt/julgran-150-cm-444-grenspetsar): Material
- [Talljulgran 180 cm med 1111 grenar och 59 kottar](https://www.fyndplats.se/produkt/talljulgran-180-cm-1111-grenar-59-kottar): Material
- [Talljulgran 180 cm med 724 grenar i två former](https://www.fyndplats.se/produkt/talljulgran-180-cm-724-grenar): Material
- [Julgran 120 cm med 657 grenspetsar – Ø85 cm och metallfot](https://www.fyndplats.se/produkt/julgran-120-cm-657-grenspetsar): Material
- [Julgran 180 cm med 1000 grenspetsar – Ø120 cm och metallfot](https://www.fyndplats.se/produkt/julgran-180-cm-1000-grenspetsar): Material
- [Julgran 180 cm med 200 LED och julkulor – allt ingår](https://www.fyndplats.se/produkt/julgran-180-cm-200-led-och-kulor): Material
- [Julgran 210 cm med 631 grenspetsar – Ø81 cm, väger 4,6 kg](https://www.fyndplats.se/produkt/julgran-210-cm-631-grenspetsar): Material
- [Talljulgran 180 cm med 375 grova PET-grenar, Ø90 cm](https://www.fyndplats.se/produkt/talljulgran-180-cm-375-grenar): Material
- [Talljulgran 210 cm med 505 silverkantade grenspetsar](https://www.fyndplats.se/produkt/talljulgran-210-cm-505-grenspetsar): Material
- [Pop-up-tält 6 × 3 m – sex väggar och justerbar höjd](https://www.fyndplats.se/produkt/popup-talt-6x3-m-sex-vaggar-justerbar-hojd): Material
- [Pop-up-tält 3,5 × 3,5 m – dubbeltak med UPF50+, mörkgrått](https://www.fyndplats.se/produkt/popup-talt-3-5x3-5-m-dubbeltak-upf50): Material

### halloweendekoration (65 produkter)

Filter: Bredd (46 %), Höjd (43 %), Material (40 %)

- [Animerad lieman 170 cm – roterar, rör käken och lyser rött](https://www.fyndplats.se/produkt/animerad-lieman-170-cm): Bredd, Höjd, Material
- [Halloweenflicka på gunghäst 72 cm – gungar, lyser och sjunger](https://www.fyndplats.se/produkt/halloweenflicka-gunghast-72-cm): Bredd, Höjd, Material
- [Hängande zombie 110 cm i kedjor – skriker och skakar](https://www.fyndplats.se/produkt/hangande-zombie-110-cm-kedjor): Bredd, Höjd, Material
- [Animerad bordshäxa 47 cm som rör om i kitteln](https://www.fyndplats.se/produkt/animerad-bordshaxa-47-cm): Bredd, Höjd, Material
- [Animerad cirkusclown 167 cm – huvudet vrids 180 grader](https://www.fyndplats.se/produkt/animerad-cirkusclown-167-cm): Bredd, Höjd, Material
- [Pop up-pumpaskelett 173 cm – huvudet skjuter upp i jump scare](https://www.fyndplats.se/produkt/pop-up-pumpaskelett-173-cm): Bredd, Höjd, Material
- [Halloweenspöke 100 cm med bruten rygg – svänger och skriker](https://www.fyndplats.se/produkt/halloweenspoke-100-cm-bruten-rygg): Bredd, Höjd, Material
- [Animerad lieman i kedjor 170 cm – rör huvud och händer](https://www.fyndplats.se/produkt/animerad-lieman-i-kedjor-170-cm): Bredd, Höjd, Material
- [Halloweenhäxa 180 cm med ansiktsbyte – röda LED-ögon och ljud](https://www.fyndplats.se/produkt/halloweenhaxa-180-cm-ansiktsbyte): Bredd, Höjd, Material
- [Uppblåsbar jättelieman 3,7 m med nio LED](https://www.fyndplats.se/produkt/uppblasbar-jattelieman-37-m): Bredd, Höjd, Material
- [Hängande halloweenhäxa 183 cm i lila – ljudstyrd](https://www.fyndplats.se/produkt/hangande-halloweenhaxa-183-cm-lila): Bredd, Höjd, Material
- [Stående spökfigur 183 cm med kedja – rör huvud och kropp](https://www.fyndplats.se/produkt/staende-spokfigur-183-cm-kedja): Bredd, Höjd, Material
- [Animerad halloweenhäxa 150 cm med lykta – ljudstyrd](https://www.fyndplats.se/produkt/animerad-halloweenhaxa-150-cm-lykta): Bredd, Höjd, Material
- [Hängande spöke 204 cm med grön hatt – skakar hela kroppen](https://www.fyndplats.se/produkt/hangande-spoke-204-cm-gron-hatt): Bredd, Höjd, Material
- [Skräckdocka 160 cm i svart spetsklänning – vrider huvudet](https://www.fyndplats.se/produkt/skrackdocka-160-cm-spetsklanning): Bredd, Höjd, Material
- [Enögd mumie 35 cm som kryper upp ur marken](https://www.fyndplats.se/produkt/enogd-mumie-35-cm): Bredd, Höjd, Material
- [Läskig clown 173 cm i rosa och svart – skrattar och rör sig](https://www.fyndplats.se/produkt/laskig-clown-173-cm): Bredd, Höjd, Material
- [Hängande skelett 183 cm med grönt huvud och röd bröstkorg](https://www.fyndplats.se/produkt/hangande-skelett-183-cm): Bredd, Höjd, Material
- [Uppblåsbar lieman-port 2,85 m med lysande röda ögon](https://www.fyndplats.se/produkt/uppblasbar-lieman-port-285-m): Bredd, Höjd, Material
- [Halloweenhäxa 183 cm med lysande hjärta och gröna löv](https://www.fyndplats.se/produkt/halloweenhaxa-183-cm-lysande-hjarta): Bredd, Höjd, Material
- [Halloweenspöke 183 cm med lysande pumpa på bröstet](https://www.fyndplats.se/produkt/halloweenspoke-183-cm-lysande-pumpa): Bredd, Höjd, Material
- [Skräckdocka 60 cm som hoppar upp – röda ögon och tjut](https://www.fyndplats.se/produkt/skrackdocka-60-cm-hoppar-upp): Bredd, Höjd, Material
- [Uppblåsbart pumpspöke 240 cm med grönt sken och tre pumpor](https://www.fyndplats.se/produkt/uppblasbart-pumpspoke-240-cm): Bredd, Höjd, Material
- [Uppblåsbart spökträd 240 cm med gravsten, zombie och pumpa](https://www.fyndplats.se/produkt/uppblasbart-spoktrad-240-cm): Bredd, Höjd, Material
- [Uppblåsbar dödskallefigur 210 cm med horn och blått sken](https://www.fyndplats.se/produkt/uppblasbar-dodskallefigur-210-cm-horn): Bredd, Höjd, Material
- [Uppblåsbar pumpa med svart katt som åker upp och ner](https://www.fyndplats.se/produkt/uppblasbar-pumpa-med-katt): Bredd, Höjd, Material
- [Uppblåsbart halloweenträd 274 cm med uggla, spöke och pumpor](https://www.fyndplats.se/produkt/uppblasbart-halloweentrad-274-cm): Bredd, Höjd, Material
- [Uppblåsbart pumpspöke 270 cm med grön kropp och sex LED](https://www.fyndplats.se/produkt/uppblasbart-pumpspoke-270-cm): Bredd, Höjd, Material
- [Uppblåsbart spöke 240 cm med blinkande ögon och lyst mage](https://www.fyndplats.se/produkt/uppblasbart-spoke-240-cm-blinkande-ogon): Bredd, Höjd, Material
- [Uppblåsbart spöke 180 cm med pumpa på huvudet](https://www.fyndplats.se/produkt/uppblasbart-spoke-180-cm-pumpa-pa-huvudet): Bredd, Höjd, Material
- [Uppblåsbart spöke 180 cm med 130 cm vingbredd](https://www.fyndplats.se/produkt/uppblasbart-spoke-180-cm-brett): Bredd, Höjd, Material
- [Uppblåsbart spökträd 240 cm med uggla och tre pumpor](https://www.fyndplats.se/produkt/uppblasbart-spoktrad-240-cm-uggla): Bredd, Höjd, Material
- [Uppblåsbar pumpa 180 cm med tre spöken som reser sig](https://www.fyndplats.se/produkt/uppblasbar-pumpa-180-cm-tre-spoken): Bredd, Höjd, Material
- [Uppblåsbart pumpträd 240 cm med fyra pumpor i grenarna](https://www.fyndplats.se/produkt/uppblasbart-pumptrad-240-cm): Bredd, Höjd, Material
- [Tre uppblåsbara häxor runt en kittel – 180 cm hög grupp](https://www.fyndplats.se/produkt/uppblasbara-haxor-med-kittel-180-cm): Bredd, Höjd, Material
- [Clown till halloween, 170 cm – rörelsesensor, ljud och lysande röda ögon](https://www.fyndplats.se/produkt/clown-halloween-170-cm): Höjd
- [Uppblåsbar halloweenport 3 × 3 m med fyra spöken och LED](https://www.fyndplats.se/produkt/uppblasbar-halloweenport-fyra-spoken): Höjd, Material
- [Uppblåsbar halloweenfigur 210 cm med lysande pumphuvud](https://www.fyndplats.se/produkt/uppblasbar-halloweenfigur-pumphuvud-210-cm): Material
- [Uppblåsbart krypande skelett 153 cm för halloween](https://www.fyndplats.se/produkt/uppblasbart-krypande-skelett-halloween): Material
- [Uppblåsbart jätteskelett 310 cm med blodröd tunga](https://www.fyndplats.se/produkt/uppblasbart-jatteskelett-310-cm): Material

### badrumsskap (82 produkter)

Filter: Placering (28 %)

- [Medicinskåp med kodlås – 30 × 14 × 30 cm, halvhylla och handtag, för väggen](https://www.fyndplats.se/produkt/medicinskap-kodlas-30-cm): Placering
- [Badrumsskåp i bambu – öppen hylla och skåp med lamelldörr, 33 × 36,5 × 67 cm](https://www.fyndplats.se/produkt/badrumsskap-bambu-oppen-hylla-67-cm): Placering
- [Låsbart medicinskåp i rostfritt stål – tre plan och glasdörr, 25 × 12 × 48 cm](https://www.fyndplats.se/produkt/lasbart-medicinskap-rostfritt-25-cm): Placering
- [Högt badrumsskåp, tvåtonat grått, 183 cm](https://www.fyndplats.se/produkt/badrumsskap-hogt-183-cm-tvatonat): Placering
- [Badrumsskåp 60 cm i ekfärg med svart stålram – låda, dörrar och ställbar hylla](https://www.fyndplats.se/produkt/badrumsskap-60-cm-ekfarg-svart-ram): Placering
- [Smalt badrumsskåp 30 cm i ekfärg – fyra lådor och svart stålram, 82 cm högt](https://www.fyndplats.se/produkt/smalt-badrumsskap-30-cm-fyra-lador-ek): Placering
- [Tvättställsskåp 70 cm med dörr och tre lådor – vitt, U-urtag för avloppet](https://www.fyndplats.se/produkt/tvattstallsskap-70-cm-vit): Placering
- [Smalt badrumsskåp 18 cm brett med utdragslåda och sidohyllor, 135 cm](https://www.fyndplats.se/produkt/smalt-badrumsskap-18-cm): Placering
- [Förvaring för toalettpapper – smalt vitt badrumsskåp 16 cm med utdrag och låda](https://www.fyndplats.se/produkt/forvaring-toalettpapper-smalt-skap-16-cm): Placering
- [Medicinskåp 40 cm med kodlås och sidohylla](https://www.fyndplats.se/produkt/medicinskap-40-cm-kodlas): Placering
- [Medicinskåp 60 cm med kodlås och öppen hylla](https://www.fyndplats.se/produkt/medicinskap-60-cm-kodlas-hylla): Placering
- [Medicinskåp 40 × 60 cm med sex fack och dörrfack](https://www.fyndplats.se/produkt/medicinskap-40x60-sex-fack): Placering
- [Medicinskåp 32 cm med kodlås och bärhandtag](https://www.fyndplats.se/produkt/medicinskap-32-cm-kodlas-handtag): Placering
- [Högskåp badrum 60 × 171 cm med tippbar tvättkorg](https://www.fyndplats.se/produkt/hogskap-badrum-60x171-tvattkorg): Placering
- [Badrumsskåp i vitt med räfflade dörrar – guldfärgade ben och två öppna hyllor](https://www.fyndplats.se/produkt/badrumsskap-vit-rafflade-dorrar): Placering
- [Smalt badrumsskåp med 5 lådor, vit](https://www.fyndplats.se/produkt/badrumsskap-smalt-5-lador-vit): Placering
- [Tvättställsskåp 60 cm i vitt med trädetalj – mjukstängande dörrar och tippskydd](https://www.fyndplats.se/produkt/tvattstallsskap-60-cm-vitt-tradetalj): Placering
- [Smalt badrumsskåp i vitt och trä – öppen hylla och mjukstängande dörr, 71,5 cm](https://www.fyndplats.se/produkt/smalt-badrumsskap-vitt-oppen-hylla): Placering
- [Tvättställsskåp på hjul 60 cm i ljus träton – räfflade dörrar och mjukstängning](https://www.fyndplats.se/produkt/tvattstallsskap-pa-hjul-60-cm-rafflade-dorrar): Placering
- [Smalt badrumsskåp 104 cm i ljus ekfärg – räfflad dörr, öppet fack och hylla](https://www.fyndplats.se/produkt/smalt-badrumsskap-104-cm-ljus-ek-rafflad-dorr): Placering
- [Smalt badrumsskåp i bambu – 30 × 30 × 80 cm, öppet fack och lamelldörr](https://www.fyndplats.se/produkt/badrumsskap-bambu-lamelldorr): Placering
- [Tvättställsskåp i bambu 60 cm – lamelldörrar, ställbar hylla och tippskydd](https://www.fyndplats.se/produkt/tvattstallsskap-bambu-60-cm-lamelldorrar): Placering
- [Högskåp i bambu 170 cm – tre öppna hyllor och skåp med lamelldörr](https://www.fyndplats.se/produkt/hogskap-bambu-170-cm-oppna-hyllor-lamelldorr): Placering
- [Badrumsskåp på hjul i vitt, 40 × 20 × 80 cm – tre lådor och fem öppna fack](https://www.fyndplats.se/produkt/badrumsskap-pa-hjul-vitt-tre-lador-fem-fack): Placering
- [Smalt högskåp badrum 20 × 185 cm, vitt](https://www.fyndplats.se/produkt/smalt-hogskap-badrum-20x185-vitt): Placering
- [Vägghängt tvättställsskåp 76 cm i matt svart – keramiskt tvättställ, två lådor](https://www.fyndplats.se/produkt/tvattstallsskap-76-cm-matt-svart-keramiskt-tvattstall): Placering
- [Spegelskåp 56 × 65 cm i brun träton – två spegeldörrar och öppen hylla](https://www.fyndplats.se/produkt/spegelskap-56x65-brun-traton-oppen-hylla): Placering
- [Badrumsskåp med fyra lådor, grå, 93 cm](https://www.fyndplats.se/produkt/badrumsskap-fyra-lador-gra-93-cm): Placering
- [Smalt badrumsskåp 20 cm – högskåp 180 cm, svart](https://www.fyndplats.se/produkt/smalt-badrumsskap-20-cm-hogskap-svart): Placering
- [Badrumsskåp i vit högglans 60 × 93 cm – två lådor, skåp och justerbara ben](https://www.fyndplats.se/produkt/badrumsskap-vit-hogglans-60-cm-tva-lador): Placering
- [Högskåp för badrum 180 cm i grå högglans – två skåp, två öppna fack och låda](https://www.fyndplats.se/produkt/hogskap-badrum-180-cm-gra-hogglans): Placering
- [Spegelskåp för badrummet i grått – två skåp, öppen hylla och dämpade gångjärn](https://www.fyndplats.se/produkt/spegelskap-badrum-gra-oppen-hylla): Placering
- [Medicinskåp 30 × 46 cm med nyckellås och tre plan](https://www.fyndplats.se/produkt/medicinskap-30x46-nyckellas): Placering
- [Spegelskåp 40 × 60 cm ramlöst – svart, 15 cm djupt](https://www.fyndplats.se/produkt/spegelskap-40-cm-ramlos-svart): Placering
- [Spegelskåp 46 × 58 cm med öppen hylla – svart](https://www.fyndplats.se/produkt/spegelskap-46-cm-oppen-hylla-svart): Placering
- [Spegelskåp i rostfritt stål 70 × 55 cm – tre spegeldörrar och fem hyllplan](https://www.fyndplats.se/produkt/spegelskap-rostfritt-stal-70x55-cm): Placering
- [Tvättställsskåp 60 cm i ek med rottingluckor](https://www.fyndplats.se/produkt/tvattstallsskap-60-cm-ek-rotting): Placering
- [Badrumsskåp med spegeldörrar, bambu, natur](https://www.fyndplats.se/produkt/badrumsskap-spegeldorrar-bambu): Placering
- [Smalt badrumsskåp i bambu 140 cm – tre öppna fack och två lådor](https://www.fyndplats.se/produkt/badrumsskap-bambu-140-cm-tva-lador): Placering
- [Badrumsskåp i bambu med två dörrar](https://www.fyndplats.se/produkt/badrumsskap-bambu-2-dorrar): Placering
- [Badrumsskåp i bambu 120 cm – två öppna hyllor och två lamelldörrar](https://www.fyndplats.se/produkt/badrumsskap-bambu-120-cm-hyllor): Placering
- [Badrumsskåp i bambu 92 cm – två öppna fack och lamelldörrar](https://www.fyndplats.se/produkt/badrumsskap-bambu-92-cm-lamelldorrar): Placering
- [Badrumsskåp 142,4 cm i vitt – tre lådor, två öppna hyllor och tippskydd](https://www.fyndplats.se/produkt/badrumsskap-142-cm-vitt-tre-lador): Placering
- [Smalt badrumsskåp i bambu, 120 cm](https://www.fyndplats.se/produkt/smalt-badrumsskap-bambu-120-cm): Placering
- [Smalt badrumsskåp i bambu, 70 cm – lamelldörr och flyttbar hylla](https://www.fyndplats.se/produkt/smalt-badrumsskap-bambu-70-cm): Placering
- [Badrumsskåp i bambu, tre hyllplan, låda och lamelldörr](https://www.fyndplats.se/produkt/badrumsskap-bambu-tre-hyllplan-lada-lamelldorr): Placering
- [Högskåp i bambu 173 cm – tre öppna hyllor och skåp med lamelldörr](https://www.fyndplats.se/produkt/hogskap-bambu-173-cm-lamelldorr): Placering
- [Medicinskåp 70 cm med glashyllor och fem plan](https://www.fyndplats.se/produkt/medicinskap-70-cm-glashyllor): Placering
- [Medicinskåp 40 × 60 cm med lås och tre djupa plan](https://www.fyndplats.se/produkt/medicinskap-40x60-tre-plan): Placering
- [Högskåp för badrum 170,5 cm, vitt – tre öppna fack, låda och skåp](https://www.fyndplats.se/produkt/hogskap-badrum-170-cm-vitt): Placering
- [Medicinskåp med lås 46 × 48 cm – glasdörrar, 6 fack och 2 nycklar](https://www.fyndplats.se/produkt/medicinskap-med-las-46x48): Placering
- [Spegelskåp badrum 60 cm – tre öppna hyllor i ljus ek](https://www.fyndplats.se/produkt/spegelskap-badrum-60-cm-oppna-hyllor): Placering
- [Smalt badrumsskåp 20 cm – högskåp 180 cm med låda, 4 fack och 2 skåp](https://www.fyndplats.se/produkt/smalt-badrumsskap-20-cm-hogskap): Placering
- [Badrumsskåp vitt med ladugårdsdörrar – golvskåp 60×110 cm i lantlig stil](https://www.fyndplats.se/produkt/badrumsskap-vitt-ladugardsdorrar): Placering
- [Högskåp badrum – smalt badrumsskåp med låda och hyllor, 148 cm, vit/valnöt](https://www.fyndplats.se/produkt/hogskap-badrum-smalt): Placering
- [Tvättställsskåp vit – underskåp för handfat med justerbar hylla](https://www.fyndplats.se/produkt/tvattstallsskap-vit-underskap-handfat): Placering
- [Högt badrumsskåp 182 cm – smalt högskåp med 2 dörrar och glashylla](https://www.fyndplats.se/produkt/hogt-badrumsskap-182): Placering
- [Smalt badrumsskåp med lamelldörr – 23 cm djupt med justerbar hylla](https://www.fyndplats.se/produkt/smalt-badrumsskap): Placering
- [Högt badrumsskåp med 3 luckor och 3 hyllor – smalt förvaringsskåp, 120 cm](https://www.fyndplats.se/produkt/hogt-badrumsskap-3-luckor): Placering

### soffbord-smabord (56 produkter)

Filter: Lådor (21 %), Bredd (79 %, syns), Djup (80 %, syns), Höjd (80 %, syns), Form (80 %, syns), Material (89 %, syns)

- [Satsbord 2-pack med brickbord – runda, Ø42 och Ø36,5 cm, grått och svart](https://www.fyndplats.se/produkt/satsbord-runda-med-brickkant): Lådor
- [Sidobord i glas och svart stål, 2-pack – satsbord 42 och 33 cm som skjuts ihop](https://www.fyndplats.se/produkt/sidobord-glas-2-pack-svart-stal): Lådor
- [Brickbord 2-pack i svart metall – runda satsbord Ø43 och Ø35 cm med lösa brickor](https://www.fyndplats.se/produkt/brickbord-svart-metall-2-pack-runda): Lådor
- [Smalt konsolbord 75 cm i marmorlook – vit stomme, 24 cm djupt, justerbara fötter](https://www.fyndplats.se/produkt/smalt-konsolbord-75-cm-marmorlook-vit): Lådor
- [Sidobord med skåp i industristil – trälook och svart stål, 40 × 30 × 76 cm](https://www.fyndplats.se/produkt/sidobord-med-skap-industristil): Lådor
- [Sidobord på hjul med C-form – höjd 68–78 cm, lönnlook och vit stomme](https://www.fyndplats.se/produkt/sidobord-hjul-c-form-hojdjusterbart): Lådor
- [Runt soffbord i grå marmorlook, 2-pack – satsbord Ø78,5 och Ø59 cm, svart ram](https://www.fyndplats.se/produkt/runt-soffbord-gra-marmorlook-2-pack): Lådor
- [Sidobord i C-form på hjul – skiva i valnötslook och svart stålram](https://www.fyndplats.se/produkt/sidobord-c-form-hjul-valnotslook): Lådor
- [Nattduksbord med dold låda – svart, öppet fack med mellanvägg, 40 × 30 × 46 cm](https://www.fyndplats.se/produkt/nattduksbord-dold-lada-svart): Lådor
- [Nattduksbord på hjul, tre hyllor – vitt med grå betonglook, 35 × 29,5 × 65,5 cm](https://www.fyndplats.se/produkt/nattduksbord-hjul-tre-hyllor-vit-gra): Lådor
- [Nattduksbord i stål 40 cm vitt – dörr, flyttbar hylla och 15,8 cm frihöjd](https://www.fyndplats.se/produkt/nattduksbord-stal-40-cm-vitt): Lådor
- [Runt sidobord med hylla i rökglas – ekfärgad skiva och svarta metallben, 53,5 cm](https://www.fyndplats.se/produkt/runt-sidobord-rokglas-ekfargad): Lådor
- [Lyftbart soffbord 100 cm – två skivor som lyfts var för sig](https://www.fyndplats.se/produkt/lyftbart-soffbord-100-cm): Lådor
- [Soffbord i bambu Ø 66 cm – korsfot i massiv bambu, bär 120 kg](https://www.fyndplats.se/produkt/soffbord-i-bambu-66-cm): Lådor
- [Satsbord, två stycken i träfärg – svarta U-ben, 60 × 50 och 50 × 50 cm](https://www.fyndplats.se/produkt/satsbord-tva-stycken-trafarg): Lådor
- [Sängbord med eluttag och USB-C – två hyllor, fack och sidoficka, rustikt brunt](https://www.fyndplats.se/produkt/sangbord-eluttag-usb-rustikt-brun): Lådor
- [Två runda sidobord i vit marmorlook med guldfärgad ram – kan skjutas ihop](https://www.fyndplats.se/produkt/sidobord-runda-marmorlook-guld): Lådor
- [Smalt sidobord med tre plan – 43 × 18 × 62,5 cm, svart metall och brun trälook](https://www.fyndplats.se/produkt/sidobord-smalt-tre-plan-metall): Lådor
- [Sidobord med skåp och öppet fack – rustikt brunt med svart stålram, 80 cm](https://www.fyndplats.se/produkt/sidobord-skap-oppet-fack-rustik-brun): Lådor
- [Konsolbord som blir matbord — 48 till 240 cm i fem lägen](https://www.fyndplats.se/produkt/konsolbord-utdragbart-matbord-240-cm): Lådor, Bredd, Form
- [Soffbord glas runt Ø 60 cm – två plan i härdat glas, guldfärgad ram](https://www.fyndplats.se/produkt/soffbord-glas-runt-60-cm): Lådor
- [Sidobord i svart stål med hylla – industristil, 40 × 40 × 45 cm](https://www.fyndplats.se/produkt/sidobord-svart-stal-hylla-40-cm): Lådor
- [Satsbord runt 2-pack Ø70 och Ø54 cm – svart stål med glasskiva](https://www.fyndplats.se/produkt/satsbord-runt-svart-70-54-cm): Lådor
- [Sidobord 2-pack i trådkorg, 40 och 35 cm](https://www.fyndplats.se/produkt/sidobord-2-pack-tradkorg-40-35-cm): Lådor, Bredd, Djup, Höjd
- [Satsbord i tre storlekar – skivor i trämönster och svart stålram](https://www.fyndplats.se/produkt/satsbord-tre-storlekar-stalram): Lådor
- [Sidobord i stenlook Ø 37 cm – cylinderform utan ben, bär 90 kg](https://www.fyndplats.se/produkt/sidobord-i-stenlook): Lådor, Material
- [Satsbord i glas 2-pack svart – 50 och 42 cm, skjuts in i varandra](https://www.fyndplats.se/produkt/satsbord-glas-2-pack-svart): Lådor
- [Smalt konsolbord i metall 55 cm, tre plan](https://www.fyndplats.se/produkt/smalt-konsolbord-metall-55-cm-tre-plan): Lådor, Bredd, Djup, Höjd, Form
- [Konsolbord 101 cm med tre hyllplan](https://www.fyndplats.se/produkt/konsolbord-101-cm-tre-hyllplan): Lådor, Bredd, Djup, Höjd, Form
- [Konsolbord i stål 90 cm, två plan](https://www.fyndplats.se/produkt/konsolbord-i-stal-90-cm-tva-plan): Lådor, Bredd, Djup, Höjd, Form
- [Konsolbord 100 cm i marmorlook](https://www.fyndplats.se/produkt/konsolbord-100-cm-marmorlook): Lådor, Bredd, Djup, Höjd, Form
- [Satsbord 2 st i guld med glasskiva – Ø41 och Ø36 cm, ringar och kulor i metall](https://www.fyndplats.se/produkt/satsbord-2-st-guld-glasskiva): Lådor
- [Smala sängbord 2-pack – 25 cm breda, lucka utan handtag](https://www.fyndplats.se/produkt/smala-sangbord-2-pack-25-cm): Lådor, Material
- [Lyftbart soffbord 110 cm i ekdekor – räfflad front och 2 fack](https://www.fyndplats.se/produkt/lyftbart-soffbord-110-cm-ekdekor): Lådor, Bredd, Djup, Höjd, Form
- [Sängbord med laddstation 2-pack – 2 eluttag, USB-A och USB-C](https://www.fyndplats.se/produkt/sangbord-med-laddstation-2-pack): Lådor, Material
- [Satsbord 2-pack – trekantiga vita skivor på furuben](https://www.fyndplats.se/produkt/satsbord-2-pack-trekantigt-vitt): Lådor, Form
- [Sängbord i naturträ 45 × 35 cm – låda, öppet fack och överhyllor](https://www.fyndplats.se/produkt/sangbord-naturtra-lada-hyllor): Lådor, Material
- [Svävande nattduksbord 2-pack 40 × 25 cm – rottinglåda och öppen hylla](https://www.fyndplats.se/produkt/svavande-nattduksbord-2-pack-40x25-cm-rotting): Lådor, Material
- [Svävande nattduksbord 2-pack med rottingfront – 40 cm](https://www.fyndplats.se/produkt/svavande-nattduksbord-2-pack-rotting): Lådor
- [Vägghängt sängbord 2-pack – svävande nattduksbord med RGB-LED och app-styrning](https://www.fyndplats.se/produkt/vagghangt-sangbord-rgb-led-2-pack-app-styrning): Lådor
- [Satsbord glas 2 delar – soffbord med metallram, 75 och 65 cm](https://www.fyndplats.se/produkt/satsbord-glas-soffbord-metallram-2-delar): Lådor
- [Satsbord runt 2-pack – industriella soffbord/sidobord i brunt med svart ram](https://www.fyndplats.se/produkt/satsbord-runt-2-pack-industriellt): Lådor, Bredd, Djup, Höjd
- [Bokhylla barn 3-i-1 med tidningsställ och nattduksbord i rosa MDF](https://www.fyndplats.se/produkt/bokhylla-barn-3-i-1): Lådor
- [Lyftbart soffbord med förvaring – soffbord i marmormönster med 2 fack](https://www.fyndplats.se/produkt/lyftbart-soffbord-forvaring): Lådor, Material
- [Konsolbord 110 cm med två lådor](https://www.fyndplats.se/produkt/konsolbord-110-cm-med-tva-lador): Bredd, Djup, Höjd, Form
- [Konsolbord med låda 80 cm, rustik brun](https://www.fyndplats.se/produkt/konsolbord-med-lada-80-cm-rustik-brun): Bredd, Djup, Höjd, Form
- [Konsolbord med låda 80 cm, naturträ](https://www.fyndplats.se/produkt/konsolbord-med-lada-80-cm-naturtra): Bredd, Djup, Höjd, Form
- [Industriellt konsolbord med 2 lådor och hylla – brun, 100 cm](https://www.fyndplats.se/produkt/industriellt-konsolbord-2-lador-hylla-brun): Bredd, Djup, Höjd, Form

### utemobler (92 produkter)

Filter: Sittplatser (27 %), Maxlast (70 %, syns), Bredd (76 %, syns), Material (80 %, syns)

- [Trädgårdsbänk i konstrotting 122 cm – 52 cm sittdjup, 320 kg](https://www.fyndplats.se/produkt/tradgardsbank-i-konstrotting-122-cm): Sittplatser
- [Trädgårdsbord 150 × 85 cm i säkerhetsglas – hylla under skivan](https://www.fyndplats.se/produkt/tradgardsbord-150-cm-glasskiva-med-hylla): Sittplatser
- [Loungeset i rotting 4 delar – L-form 191 cm med gråblå dynor](https://www.fyndplats.se/produkt/loungeset-rotting-4-delar-l-form-191-cm): Sittplatser, Maxlast, Bredd, Material
- [Trädgårdsbord 140 × 80 cm i WPC – teakton på pulverlackerad metallram](https://www.fyndplats.se/produkt/tradgardsbord-140-cm-wpc-teakton): Sittplatser
- [Trädgårdsbänk i akacia 112 cm – oljad, 320 kg, 92 cm hög rygg](https://www.fyndplats.se/produkt/tradgardsbank-i-akacia-112-cm): Sittplatser
- [Bistroset i stål, 3 delar, hopfällbart, mörkgrå](https://www.fyndplats.se/produkt/bistroset-stal-3-delar-hopfallbart): Sittplatser, Maxlast, Bredd
- [Trädgårdsbord 145 × 90 cm i aluminium – lamellskiva och pulverlackerad ram](https://www.fyndplats.se/produkt/tradgardsbord-145-cm-lamellskiva-aluminium): Sittplatser
- [Runt trädgårdsbord i gjutaluminium, vintagemönster, 60 cm](https://www.fyndplats.se/produkt/runt-tradgardsbord-gjutaluminium-60-cm): Sittplatser, Material
- [Trädgårdsbänk i gran 114 cm – karboniserad yta, 50 cm hög rygg](https://www.fyndplats.se/produkt/tradgardsbank-i-gran-114-cm): Sittplatser
- [Trädgårdsbänk med blommönster 127 cm – 120 cm bred rygg, 240 kg](https://www.fyndplats.se/produkt/tradgardsbank-med-blommonster-127-cm): Sittplatser
- [Trädgårdsbänk i gjutjärn 128 cm – 124 cm sittbredd, 240 kg](https://www.fyndplats.se/produkt/tradgardsbank-i-gjutjarn-128-cm): Sittplatser
- [Trädgårdsbänk i aluminium 100 cm – bronsfärgad, 11,5 kg, 240 kg](https://www.fyndplats.se/produkt/tradgardsbank-i-aluminium-100-cm): Sittplatser
- [Trädgårdsbänk i gran, vagnshjulsben](https://www.fyndplats.se/produkt/tradgardsbank-gran-vagnshjulsben): Sittplatser, Material
- [Trädgårdsbänk med vagnshjul 108 cm i gran – 2,3 cm tjock sits](https://www.fyndplats.se/produkt/tradgardsbank-med-vagnshjul-108-cm): Sittplatser
- [Trädgårdsbänk i furu 122 cm med stålram – 10,9 kg, 220 kg last](https://www.fyndplats.se/produkt/tradgardsbank-i-furu-122-cm): Sittplatser
- [Loungebord i konstrotting 85 × 50 cm – härdad glasskiva, höjd 39 cm](https://www.fyndplats.se/produkt/loungebord-konstrotting-85-cm): Sittplatser
- [Trädgårdsbord 140 × 90 cm – kompositskiva i träutseende på stålram](https://www.fyndplats.se/produkt/tradgardsbord-komposit-140-cm): Sittplatser, Material
- [Runt cafébord Ø 60 cm – svart metall med vågig glasskiva, höjd 70 cm](https://www.fyndplats.se/produkt/runt-cafebord-glas-60-cm): Sittplatser, Bredd, Material
- [Trädgårdsbord i massivt trä 110 × 60 cm – vagnshjulsben, höjd 65 cm](https://www.fyndplats.se/produkt/tradgardsbord-tra-vagnshjul-110-cm): Sittplatser, Material
- [Loungeset 4 delar med dynor – L-form 247 cm, flyttbara moduler](https://www.fyndplats.se/produkt/loungeset-4-delar-dynor-l-form-247-cm): Sittplatser
- [Utdragbart trädgårdsbord 80–160 cm – aluminium med glasskiva, svart](https://www.fyndplats.se/produkt/utdragbart-tradgardsbord-80-160-cm): Sittplatser
- [Trädgårdsbord i glas Ø80 cm – runt cafébord med parasollhål, svart](https://www.fyndplats.se/produkt/tradgardsbord-glas-parasollhal): Sittplatser
- [Loungeset i rotting 5 delar – modulär utemöbelgrupp med glasbord och dynor](https://www.fyndplats.se/produkt/loungeset-rotting-5-delar): Sittplatser
- [Runt trädgårdsbord Ø60 cm – cafébord med mosaikskiva i keramik, svart](https://www.fyndplats.se/produkt/runt-tradgardsbord-mosaik): Sittplatser
- [Hängstol med stativ och nackstöd – 120 kg, hopfällbar korg, ljusgrå](https://www.fyndplats.se/produkt/hangstol-stativ-nackstod-ljusgra): Maxlast
- [Hängsoffa 2-sits i konstrotting – kedjor och dynor, stativ ingår inte](https://www.fyndplats.se/produkt/hangsoffa-2-sits-konstrotting-kedjor): Maxlast
- [Hängstol i konstrotting med väderskydd – 150 kg, 195 cm hög](https://www.fyndplats.se/produkt/hangstol-konstrotting-med-skydd): Maxlast
- [S-formad solsäng i konstrotting med dyna](https://www.fyndplats.se/produkt/solsang-s-formad-rotting-dyna): Maxlast
- [Utedagbädd 178 cm med soltak – fyra delar som blir soffa, bord och pallar](https://www.fyndplats.se/produkt/utedagbadd-178-cm-soltak-fyra-delar): Maxlast, Bredd, Material
- [Utdragbart utemöbelset 225 cm – sex stolar och bord i antracit](https://www.fyndplats.se/produkt/utdragbart-utemobelset-225-cm-sex-stolar): Maxlast, Bredd, Material
- [Loungeset med djupa sitsar – 2-sitssoffa, två fåtöljer och bord i aluminium](https://www.fyndplats.se/produkt/loungeset-djupa-sitsar-aluminium): Maxlast, Bredd, Material
- [Trädgårdsstolar 2-pack i stål och eukalyptus, stapelbara](https://www.fyndplats.se/produkt/tradgardsstolar-2-pack-stal-eukalyptus-stapelbara): Maxlast
- [Stapelbara utemöbler 7 delar – bord 160 cm och sex stolar i träutseende](https://www.fyndplats.se/produkt/stapelbara-utemobler-160-cm-sex-stolar): Maxlast, Bredd, Material
- [Matgrupp utomhus 7 delar – bord 160 cm i träkomposit och sex stolar med dyna](https://www.fyndplats.se/produkt/matgrupp-utomhus-7-delar-160-cm): Maxlast, Bredd, Material
- [Utemöbelgrupp 7 delar för sex – aluminiumbord 175 cm och sex fåtöljer](https://www.fyndplats.se/produkt/utemobelgrupp-7-delar-175-cm): Maxlast, Bredd, Material
- [Skyddsöverdrag för utemöbler, 275 × 205 × 90 cm – oxfordtyg med PE](https://www.fyndplats.se/produkt/skyddsoverdrag-utemobler-275-cm): Maxlast
- [Gungbänk 3-sits för trädgård och balkong – svart, nätklädsel](https://www.fyndplats.se/produkt/gungbank-3-sits-tradgard-balkong): Maxlast
- [Parkbänk i stål, 2-sits, svart](https://www.fyndplats.se/produkt/parkbank-stal-2-sits-svart): Maxlast
- [Bistroset för 2 personer i gjuten aluminium, bord och 2 stolar](https://www.fyndplats.se/produkt/bistroset-2-personer-gjuten-aluminium-svart): Maxlast
- [Hängstol för två med stativ – 240 kg, mugghållare och hopfällbar korg](https://www.fyndplats.se/produkt/hangstol-tva-personer-mugghallare): Maxlast
- [Hängstol för två med stativ – 240 kg, två dynor och förvaringsfickor](https://www.fyndplats.se/produkt/hangstol-tva-personer-fickor): Maxlast
- [Hammock i furu 236 cm med soltak – fälls ner till bädd, bär 300 kg](https://www.fyndplats.se/produkt/hammock-furu-236-cm-soltak): Maxlast, Bredd, Material
- [Förvaringsbox i konstrotting 253 L – gasdämpat lock och innerfoder](https://www.fyndplats.se/produkt/forvaringsbox-konstrotting-253-l): Maxlast
- [Förvaringsbox utomhus 93 L – svart med handtag och beslag för hänglås](https://www.fyndplats.se/produkt/forvaringsbox-utomhus-93-l): Maxlast
- [Soffbord utomhus med hylla 90 × 50 cm – ljusgrå rotting, vågig glasskiva](https://www.fyndplats.se/produkt/soffbord-utomhus-hylla-90-cm): Maxlast
- [Balkongset 3 delar – två repstolar och bord Ø 50 cm](https://www.fyndplats.se/produkt/balkongset-3-delar-repstolar): Maxlast
- [Litet sidobord i två plan Ø 32 cm – vit metall, höjd 51 cm](https://www.fyndplats.se/produkt/sidobord-tva-plan-32-cm): Maxlast, Bredd
- [Skyddsöverdrag för hammock 205 cm i Oxford-tyg med dragkedjor och resår](https://www.fyndplats.se/produkt/skyddsoverdrag-hammock): Maxlast
- [Trädgårdspall på hjul med vridbar sits, styre och förvaringskorg](https://www.fyndplats.se/produkt/tradgardspall-pa-hjul): Maxlast, Bredd, Material
- [Trädgårdsbord i aluminium – matbord utomhus för 8 personer](https://www.fyndplats.se/produkt/tradgardsbord-aluminium-utomhus-8-personer): Maxlast
- [Trädgårdsstolar 2-pack i akacia och konstrotting – bär 160 kg](https://www.fyndplats.se/produkt/tradgardsstolar-akacia-rotting-2-pack): Bredd
- [Trädgårdsstolar 2-pack, hopfällbara med hög rygg – sitthöjd 44 cm](https://www.fyndplats.se/produkt/tradgardsstolar-hog-rygg-2-pack): Bredd
- [Solstolar 2-pack grå – stoppat nackstöd, rygg i fem lägen](https://www.fyndplats.se/produkt/solstolar-2-pack-gra-nackstod): Bredd
- [Solstolar 2-pack svarta – stoppat nackstöd, rygg i fem lägen](https://www.fyndplats.se/produkt/solstolar-2-pack-svarta-nackstod): Bredd
- [Fällstolar 2-pack i textilen – låg sitthöjd 37 cm, bär 110 kg](https://www.fyndplats.se/produkt/fallstolar-2-pack-lag-sits-37-cm): Bredd
- [Solsäng med dyna och huvudkudde – ryggstöd i sju lägen, 165 kg](https://www.fyndplats.se/produkt/solsang-dyna-huvudkudde-sju-lagen): Bredd
- [Solsäng grå 180 cm – ställbart ryggstöd och huvudkudde](https://www.fyndplats.se/produkt/solsang-gra-180-cm-huvudkudde): Bredd
- [Solsäng svart i textilen – sitthöjd 33 cm, bär 165 kg](https://www.fyndplats.se/produkt/solsang-svart-sitthojd-33-cm): Bredd
- [Runt sidobord i vit metall Ø 40 cm – blommönstrad skiva, höjd 50 cm](https://www.fyndplats.se/produkt/runt-sidobord-vit-metall-40-cm): Bredd
- [Runt sidobord i rotting Ø 50 cm – höjd 55 cm, tål 30 kg](https://www.fyndplats.se/produkt/runt-sidobord-rotting-50-cm): Bredd, Material
- [Hopfällbar solsäng 187 cm beige – ryggstöd i fyra lägen, tål 120 kg](https://www.fyndplats.se/produkt/hopfallbar-solsang-187-cm-beige): Material
- [Hopfällbart sidobord i rotting 40 × 40 cm – två färger, tål 30 kg](https://www.fyndplats.se/produkt/hopfallbart-sidobord-rotting-40-cm): Material
- [Adirondackstol i granträ – mugghållare i armstödet, bär 150 kg](https://www.fyndplats.se/produkt/adirondackstol-grantra-mugghallare): Material

### hushallsapparater (65 produkter)

Filter: Bredd (40 %), Höjd (40 %), Effekt (65 %, syns)

- [Minitorktumlare 5 kg vit – frånluft 1000 W med sensortork](https://www.fyndplats.se/produkt/minitorktumlare-5-kg-vit-franluft): Bredd, Höjd
- [Minitorktumlare 5 kg svart – frånluft 1000 W med sensortork](https://www.fyndplats.se/produkt/minitorktumlare-5-kg-svart-franluft): Bredd, Höjd
- [Uppvärmt torkställ 230 W – 45 till 55 grader, hopfällbart](https://www.fyndplats.se/produkt/uppvarmt-torkstall-230-w): Bredd, Höjd
- [Väggvärmare 50 cm med veckotimer och fönstervakt](https://www.fyndplats.se/produkt/vaggvarmare-50-cm-veckotimer): Bredd, Höjd, Effekt
- [Väggkamin 152 cm för inbyggnad – 1800 W och tre lågfärger](https://www.fyndplats.se/produkt/vaggkamin-152-cm-inbyggnad-1800-w): Bredd, Höjd
- [Väggkamin 127 cm med 111 cm fönster – häng eller bygg in](https://www.fyndplats.se/produkt/vaggkamin-127-cm-inbyggnad): Bredd, Höjd, Effekt
- [Väggkamin 91,4 cm för hängning eller inbyggnad – 1800 W](https://www.fyndplats.se/produkt/vaggkamin-91-cm-inbyggnad): Bredd, Höjd
- [Elkamin med vit omramning 96,5 cm – bara 22 cm djup](https://www.fyndplats.se/produkt/elkamin-omramning-96-cm-rak): Bredd, Höjd, Effekt
- [Värmetorn 73,5 cm – 2200 W, 45° oscillation och tippskydd](https://www.fyndplats.se/produkt/varmetorn-73-cm-2200-w): Bredd, Höjd
- [Elkamin 74 cm med glas på tre sidor – högst av dem](https://www.fyndplats.se/produkt/elkamin-74-cm-glas-tre-sidor): Bredd, Höjd, Effekt
- [Väggvärmare vit 54,5 cm – 12 cm djup med oscillation](https://www.fyndplats.se/produkt/vaggvarmare-vit-54-cm-oscillation): Bredd, Höjd, Effekt
- [Väggvärmare grå 54,5 cm – 12 cm djup med oscillation](https://www.fyndplats.se/produkt/vaggvarmare-gra-54-cm-oscillation): Bredd, Höjd, Effekt
- [Väggvärmare svart 54,5 cm – 12 cm djup med oscillation](https://www.fyndplats.se/produkt/vaggvarmare-svart-54-cm-oscillation): Bredd, Höjd, Effekt
- [Väggvärmare svart 45 cm – 2000 W, IPX2 och 12-timmarstimer](https://www.fyndplats.se/produkt/vaggvarmare-svart-45-cm-ipx2): Bredd, Höjd
- [Väggvärmare vit 45 cm – 2000 W, IPX2 och 12-timmarstimer](https://www.fyndplats.se/produkt/vaggvarmare-vit-45-cm-ipx2): Bredd, Höjd
- [Elkamin med glas på tre sidor – 1800 W och 27 cm frontfönster](https://www.fyndplats.se/produkt/elkamin-glas-tre-sidor-1800-w): Bredd, Höjd
- [Elkamin 45,5 cm vit – 2000 W och fönster på 21 × 20 cm](https://www.fyndplats.se/produkt/elkamin-45-cm-vit-2000-w): Bredd, Höjd
- [Elkamin 45,5 cm svart – 2000 W och fönster på 21 × 20 cm](https://www.fyndplats.se/produkt/elkamin-45-cm-svart-2000-w): Bredd, Höjd
- [Elkamin svart 56,5 cm med bågformad lucka – 2000 W](https://www.fyndplats.se/produkt/elkamin-svart-56-cm-bagformad-lucka): Bredd, Höjd
- [Elektrisk kamin med vit omramning 98 cm – 2000 W och veckotimer](https://www.fyndplats.se/produkt/elektrisk-kamin-vit-omramning-98-cm): Bredd, Höjd
- [Elkamin vit 55 cm med 27 cm fönster – 1800 W](https://www.fyndplats.se/produkt/elkamin-vit-55-cm-27-cm-fonster): Bredd, Höjd
- [Elkamin 55 cm med 27 cm fönster – 1800 W och lucka med handtag](https://www.fyndplats.se/produkt/elkamin-55-cm-27-cm-fonster): Bredd, Höjd
- [Elkamin 74 cm med öppet vedfack under eldstaden](https://www.fyndplats.se/produkt/elkamin-74-cm-vedfack): Bredd, Höjd, Effekt
- [Väggkamin 72,5 cm med bred svart ram – 2000 W](https://www.fyndplats.se/produkt/vaggkamin-72-cm-svart-ram): Bredd, Höjd
- [Elkamin vit med spröjsat fönster – termostat och 2000 W](https://www.fyndplats.se/produkt/elkamin-vit-sprojsat-fonster): Bredd, Höjd
- [Elkamin svart med spröjsat fönster – ställbar låga och värme](https://www.fyndplats.se/produkt/elkamin-svart-sprojsat-fonster): Bredd, Höjd, Effekt
- [Elkamin med vit omramning 80,5 cm – öppen hylla ovanför](https://www.fyndplats.se/produkt/elkamin-omramning-80-cm-hylla): Bredd, Höjd, Effekt
- [Cylindrisk elkamin 64,5 cm – rund och lika från alla håll](https://www.fyndplats.se/produkt/elkamin-cylindrisk-64-cm): Bredd, Höjd, Effekt
- [Minielkamin 31 cm på ben – metall, härdat glas och tippskydd](https://www.fyndplats.se/produkt/minielkamin-31-cm-ben-metall): Bredd, Höjd, Effekt
- [Elkamin vit 45 cm med öppningsbar lucka – dimbar låga](https://www.fyndplats.se/produkt/elkamin-vit-45-cm-oppningsbar-lucka): Bredd, Höjd, Effekt
- [Elkamin 45 cm bred med öppningsbar lucka – dimbar låga](https://www.fyndplats.se/produkt/elkamin-45-cm-oppningsbar-lucka): Bredd, Höjd, Effekt
- [Minielkamin 34 cm bred – 1200 W och låga utan värme](https://www.fyndplats.se/produkt/minielkamin-34-cm-1200-w): Bredd, Höjd
- [Elkamin i guld 59,2 cm – enda guldfärgade i sortimentet](https://www.fyndplats.se/produkt/elkamin-guld-59-cm): Bredd, Höjd, Effekt
- [Elektrisk cigarettmaskin – hylsor 6,5 och 8 mm, räknare eller infraröd](https://www.fyndplats.se/produkt/elektrisk-cigarettmaskin-6-5-8-mm): Bredd, Höjd, Effekt
- [Handhållen ångtvätt – ångrengörare för kök, bad, golv & bil](https://www.fyndplats.se/produkt/handhallen-angtvatt-angrengorare-kok-bad-bil): Bredd, Höjd, Effekt
- [Sladdlös handdammsugare 30000 Pa – borstlös bil- & minidammsugare](https://www.fyndplats.se/produkt/sladdlos-handdammsugare-30000pa-borstlos-bil): Bredd, Höjd, Effekt
- [Sladdlös dammsugare 23 kPa – lätt skaftdammsugare med LED och 48 min drifttid](https://www.fyndplats.se/produkt/sladdlos-dammsugare-23kpa-led-display): Bredd, Höjd, Effekt
- [Golvfläkt med vattendimma – 90W, jonisator, fjärrkontroll och timer](https://www.fyndplats.se/produkt/golvflakt-med-vattendimma): Bredd
- [Digital ultraljudstvätt 2–15 L – rostfri med värme och timer](https://www.fyndplats.se/produkt/digital-ultraljudstvatt-2-15l): Bredd, Höjd, Effekt
- [Fönsterputsrobot 5600 Pa med fjärrkontroll](https://www.fyndplats.se/produkt/fonsterputsrobot-5600-pa): Höjd, Effekt
- [Elektrisk väggkamin 65 × 52 cm – LED-lågor i sju färger](https://www.fyndplats.se/produkt/elektrisk-vaggkamin-65x52-cm-led-lagor): Effekt
- [Kylskåp 91 liter med frysfack – 84 cm högt, vändbar dörr](https://www.fyndplats.se/produkt/kylskap-91-liter-frysfack): Effekt

### klostrad (107 produkter)

Filter: Våningar (26 %), Maxlast (40 %), Bredd (93 %, syns)

- [Klöstorn 81 cm i mörkgrått – fyrkantigt, två kojor och sisalpanel](https://www.fyndplats.se/produkt/klostorn-81-cm-fyrkantigt): Våningar, Maxlast
- [Kattorn 192 cm med två hålor, två hängmattor och ramp – ljusgrå](https://www.fyndplats.se/produkt/kattorn-192-cm-tva-halor-ramp): Våningar, Maxlast
- [Kattorn 206 cm för hörnet med två hus och klösbräda – mörkgrå](https://www.fyndplats.se/produkt/kattorn-206-cm-hornet-tva-hus): Våningar
- [Klättervägg för katt 178 cm med sisalstolpe, hängmatta och tre väggdelar](https://www.fyndplats.se/produkt/klattervagg-katt): Våningar
- [Klösträd 90 cm i beige – dubbel koja, topplatå och sidoplattform](https://www.fyndplats.se/produkt/klostrad-90-cm-dubbelhala): Våningar
- [Klösträd 152 cm med bred bas – grotta, hängmatta och sisalstege](https://www.fyndplats.se/produkt/klostrad-152-cm-bred-bas): Våningar, Maxlast
- [Klöstunna 96 cm i grått – tre hålor, tvättbar bädd, max 20 kg](https://www.fyndplats.se/produkt/klostunna-96-cm-gra): Våningar
- [Klöstunna 96 cm i cremevitt – tre hålor, tvättbar bädd, max 20 kg](https://www.fyndplats.se/produkt/klostunna-96-cm-cremevit): Våningar
- [Klösträd 170 cm med två kojor, hängmatta och ramp](https://www.fyndplats.se/produkt/klostrad-170-cm-med-tva-kojor): Våningar, Maxlast
- [Klöstorn 100 cm med tre hålor – bädd på toppen och hängande bollar](https://www.fyndplats.se/produkt/klostorn-100-cm-halor): Våningar, Maxlast
- [Klöstunna 101 cm med tre hålor – sisalstam och hoppsteg upp till bädden](https://www.fyndplats.se/produkt/klostunna-101-cm-steg): Våningar, Maxlast
- [Klösträd 200 cm i beige – två hålor, hängmatta och 20 kg bärförmåga](https://www.fyndplats.se/produkt/klostrad-200-cm-beige-halor): Våningar
- [Klösträd 114 cm med koja, bädd och sisalstammar](https://www.fyndplats.se/produkt/klostrad-114-cm-med-koja): Våningar
- [Klöstunna 61 cm i sisal – två kojor och hopplattform](https://www.fyndplats.se/produkt/klostunna-61-cm-hopplattform): Våningar, Maxlast
- [Klösträd 160 cm med två kojor, bädd på toppen och sisalstolpar](https://www.fyndplats.se/produkt/klostrad-160-cm-kojor): Våningar
- [Kattorn 160 cm med två hålor, hängmatta och stege – beige](https://www.fyndplats.se/produkt/kattorn-160-cm-stege-hangmatta): Våningar
- [Kattorn 140 cm med två hålor, hängmatta och stege – beige](https://www.fyndplats.se/produkt/kattorn-140-cm-stege-hangmatta): Våningar
- [Klösträd 53 cm i trädstamsform med håla och jutestam](https://www.fyndplats.se/produkt/klostrad-53-cm-tradstam-med-hala): Våningar
- [Klösträd 79 cm i vass och sisal – korgkoja med bädd på toppen](https://www.fyndplats.se/produkt/klostrad-79-cm-korgkoja): Våningar
- [Klösträd 139 cm med bladkrona – grön koja, klösskiva och lekbollar](https://www.fyndplats.se/produkt/klostrad-139-cm-blad): Våningar
- [Klösträd 98 cm med bladkrona – grön hydda, bädd och jutestammar](https://www.fyndplats.se/produkt/klostrad-98-cm-bladkrona): Våningar, Maxlast
- [Klöstunna 60 cm i ljusgrått – två hålor, max 10 kg](https://www.fyndplats.se/produkt/klostunna-60-cm-ljusgra): Våningar
- [Klöspelare 87 cm i sisal – bollbana i sockeln och topplatta i trä](https://www.fyndplats.se/produkt/klospelare-87-cm-bollbana): Våningar
- [Klösträd 98 cm i fårdesign – liggtunnel, klösstolpar och svansleksak](https://www.fyndplats.se/produkt/klostrad-98-cm-fardesign-tunnel): Våningar, Maxlast
- [Takhögt klösträd 225–275 cm med fyra plattformar](https://www.fyndplats.se/produkt/klostrad-takhogt-225-275-cm): Våningar, Bredd
- [Klösträd 86 cm med fyra klösklot – bädd på toppen och rund platå](https://www.fyndplats.se/produkt/klostrad-86-cm-klosklot): Våningar
- [Klöspelare 87 cm med bädd på toppen och tjock sisalstam](https://www.fyndplats.se/produkt/klospelare-87-cm-med-badd): Våningar, Maxlast
- [Klösträd 61,5 cm i trä och jute – bädd och hoppyta på var sin stolpe](https://www.fyndplats.se/produkt/klostrad-lagt-tra-och-jute): Våningar, Maxlast
- [Klösträd 104 cm med liggtunnel – kantad topplatta och sisalstammar](https://www.fyndplats.se/produkt/klostrad-104-cm-tunnel): Våningar
- [Klösträd 79 cm med rund koja – bred liggyta och jutestammar](https://www.fyndplats.se/produkt/klostrad-79-cm-rund-koja): Våningar
- [Klättervägg för katt i fyra delar – sisalstolpe, hängbro, liggskål och trappa](https://www.fyndplats.se/produkt/klattervagg-katt-fyra-delar): Våningar, Maxlast
- [Klösträd 98 cm med flätad koja – korgbädd, klösramp och liggyta](https://www.fyndplats.se/produkt/klostrad-98-cm-korgbadd): Våningar
- [Klöspelare 80 cm i ekfärg och krämvitt – 76 cm sisal att sträcka sig i](https://www.fyndplats.se/produkt/klospelare-80-cm-ek-och-cremevit): Våningar, Maxlast
- [Klösträd 240–260 cm i träfärg – katthus med stege och jutelindad stam](https://www.fyndplats.se/produkt/klostrad-240-260-cm-trafarg-katthus): Våningar, Maxlast
- [Klösträd i svart stål 170 cm – tre plattformar, klösvägg och två liggkuddar](https://www.fyndplats.se/produkt/klostrad-svart-stal-170-cm): Våningar, Maxlast
- [Klöspelare 220–260 cm i gult och ljusblått – två liggytor och sisalstam](https://www.fyndplats.se/produkt/klospelare-220-260-cm-tva-liggytor): Våningar, Maxlast
- [Klöstunna 100 cm med två grottor – sisalstammar och bädd, grå](https://www.fyndplats.se/produkt/klostunna-100-cm-tva-grottor-gra): Våningar, Maxlast
- [Klöstunna 100 cm med två grottor – sisalstammar och bädd, cremevit](https://www.fyndplats.se/produkt/klostunna-100-cm-tva-grottor-cremevit): Våningar, Maxlast
- [Höjdställbart klösträd 202–242 cm med jutestolpar – grönt](https://www.fyndplats.se/produkt/klostrad-hojdstallbart-202-242-cm): Våningar, Maxlast, Bredd
- [Klösträd 150 cm med två flätade kojor – hängmatta, klösmatta och grova stammar](https://www.fyndplats.se/produkt/klostrad-150-cm-tva-flatade-kojor): Våningar, Maxlast
- [Klösträd 113 cm i ljusgrått – håla, hängmatta, bädd och ramp](https://www.fyndplats.se/produkt/klostrad-113-cm-hala-badd-ramp): Våningar
- [Klösträd 92 cm i mörkgrått – tjock sisalstam, bädd och hängande boll](https://www.fyndplats.se/produkt/klostrad-92-cm-hangande-boll): Våningar, Maxlast
- [Klösträd 101 cm i girafform med liggtunnel](https://www.fyndplats.se/produkt/klostrad-101-cm-giraff-med-tunnel): Våningar, Maxlast
- [Klösmöbel som zebra med tunnel, 93 cm](https://www.fyndplats.se/produkt/klosmobel-zebra-tunnel-93-cm): Våningar, Maxlast
- [Klöstunna 70 cm i ljusgrått med mörkgrå kanter – tre hålor](https://www.fyndplats.se/produkt/klostunna-70-cm-morkgra-kant): Våningar, Maxlast
- [Klöstunna 70 cm i ljusbrunt med gräddvita kanter – tre hålor](https://www.fyndplats.se/produkt/klostunna-70-cm-ljusbrun): Våningar, Maxlast
- [Klöstunna 70 cm i ljusgrått med grå kanter – tre hålor](https://www.fyndplats.se/produkt/klostunna-70-cm-gra-kant): Våningar, Maxlast
- [Klösträd 90 cm i cremevitt – koja, hängmatta och bädd med kattöron](https://www.fyndplats.se/produkt/klostrad-90-cm-cremevit): Våningar, Maxlast
- [Klösträd 90 cm i grått – koja, hängmatta och bädd med kattöron](https://www.fyndplats.se/produkt/klostrad-90-cm-gratt): Våningar, Maxlast
- [Klösträd i rotting 95 cm med hus och sisalstammar](https://www.fyndplats.se/produkt/klostrad-rotting-95-cm): Våningar, Maxlast
- [Klösträd 76 cm i ljusgrått – rund bädd, klösbräda och jutekudde](https://www.fyndplats.se/produkt/klostrad-76-cm-badd-och-klosbrada): Våningar, Maxlast
- [Klösträd i rotting 174 cm – flätad koja, grova sisalpelare och plysch](https://www.fyndplats.se/produkt/klostrad-rotting-174-cm-flatad-koja): Våningar, Maxlast
- [Klösträd 100 cm med flätad kupolhydda – sisalstammar och platå](https://www.fyndplats.se/produkt/klostrad-100-cm-flatad-kupol): Våningar, Maxlast
- [Klöstunna 79 cm i sjögräs och sisal – tre hålor, max 20 kg](https://www.fyndplats.se/produkt/klostunna-79-cm-sjogras): Våningar
- [Klöstunna 49 cm i sjögräs och sisal – två hålor, max 20 kg](https://www.fyndplats.se/produkt/klostunna-49-cm-sjogras): Våningar
- [Takhögt klösträd 228–260 cm med fyra plattformar – beige](https://www.fyndplats.se/produkt/klostrad-takhogt-228-260-cm-beige): Våningar, Maxlast, Bredd
- [Takhögt klösträd 228–260 cm med fyra plattformar – grå](https://www.fyndplats.se/produkt/klostrad-takhogt-228-260-cm-gra): Våningar, Maxlast, Bredd
- [Takhögt klösträd 228–260 cm med fyra plattformar – ljusbrun](https://www.fyndplats.se/produkt/klostrad-takhogt-228-260-cm-ljusbrun): Våningar, Maxlast, Bredd
- [Kattorn 148 cm med håla och rund bädd överst – beige](https://www.fyndplats.se/produkt/kattorn-148-cm-hala-badd): Våningar
- [Klöspelare 91 cm i mörkgrått – grov sisalstam och bädd med kant](https://www.fyndplats.se/produkt/klospelare-91-morkgra): Våningar
- [Klöspelare 91 cm i ljusbrunt – grov sisalstam och bädd med kant](https://www.fyndplats.se/produkt/klospelare-91-ljusbrun): Våningar
- [Takspänt klösträd 240–260 cm med två hålor och två hängmattor – mörkgrå](https://www.fyndplats.se/produkt/klostrad-takspant-240-260-cm): Våningar
- [Klösträd 240–260 cm i ljusgrått – två sovhålor och två hängmattor](https://www.fyndplats.se/produkt/klostrad-ljusgratt-240-260-cm): Våningar
- [Klösträd mörkgrå 173 cm – två grottor, tre liggplan och sisallindad stege](https://www.fyndplats.se/produkt/klostrad-morkgra-173-cm): Våningar
- [Klösträd 153 cm i krämvitt och kaffebrunt – håla, korg och hängbädd](https://www.fyndplats.se/produkt/klostrad-153-cm-hala-och-hangmatta): Våningar, Maxlast
- [Klösträd 53 cm i trädstamsform – hus, bädd och jutepelare](https://www.fyndplats.se/produkt/klostrad-53-cm-tradstamsform): Våningar, Maxlast
- [Väggklösträd 4 delar – plattformar, stege och korg](https://www.fyndplats.se/produkt/vaggklostrad-4-delar-plattformar-stege): Våningar, Maxlast
- [Klösträd golv till tak 225–255 cm – bomullsrep och tre plattformar](https://www.fyndplats.se/produkt/klostrad-golv-till-tak-225-255-cm): Våningar, Maxlast, Bredd
- [Väggklösträd 149 cm med grotta, bädd och sisalpelare](https://www.fyndplats.se/produkt/vaggklostrad-149-cm-grotta): Våningar, Maxlast
- [Klöspelare 81 cm med sisal och hängande lekboll](https://www.fyndplats.se/produkt/klospelare-81-cm-sisal): Våningar, Maxlast
- [Klösträd med tunnel 240–260 cm – två grottor, korgar och sisalpelare](https://www.fyndplats.se/produkt/klostrad-med-tunnel-240-260-cm): Våningar
- [Väggmonterat klösträd 180 cm – klöspelare med 4 plattformar](https://www.fyndplats.se/produkt/vaggmonterat-klostrad-180-cm-klospelare-4-plattformar): Våningar
- [Litet klösträd 46 cm för katt – böjd klösbräda, liggplats och lekboll](https://www.fyndplats.se/produkt/litet-klostrad-46-cm-klosbrada-liggplats): Våningar, Maxlast
- [Klösträd i naturfiber med grotta, mysbädd och stege – 100 cm för katt](https://www.fyndplats.se/produkt/klostrad-naturfiber-grotta-mysbadd-stege): Våningar, Maxlast
- [Klösträd 140 cm med flera plattformar – katträd med hängmatta och kojor](https://www.fyndplats.se/produkt/klostrad-140-cm): Våningar
- [Kloskrapa för katt i kartong – klösmöbel i sofform med kattmynta](https://www.fyndplats.se/produkt/kloskrapa-katt-soffa-kartong): Våningar, Maxlast
- [Klättervägg för katt med hängmatta – 4-delat set väggmonterade katthyllor, beige](https://www.fyndplats.se/produkt/klattervagg-for-katt-med-hangmatta): Våningar
- [Hopfällbar kattkoja med klöspelare i sisal, 3 ingångar och upphöjd bädd](https://www.fyndplats.se/produkt/hopfallbar-kattkoja): Våningar, Maxlast
- [Klösträd med koja, sisalpelare, hängmatta och bollar – 104 cm, ljusgrå](https://www.fyndplats.se/produkt/klostrad-med-koja): Våningar, Maxlast
- [Klösträd 220–240 cm i grönt och rosa – spänns mellan golv och tak](https://www.fyndplats.se/produkt/klostrad-220-240-cm-gront-och-rosa): Maxlast
- [Väggklösträd i fyra delar – molnhyllor, håla, stege och klösstolpe](https://www.fyndplats.se/produkt/vaggklostrad-moln-hala-och-stege): Maxlast
- [Klösträd 132 cm med borstpelare – filthus, bädd och klösmatta](https://www.fyndplats.se/produkt/klostrad-132-cm-borstpelare): Maxlast
- [Klösträd 225–255 cm i grått – rund bas, katthus och sammetsklädsel](https://www.fyndplats.se/produkt/klostrad-225-255-cm-rund-bas-sammet): Maxlast
- [Klöstunna 50 cm i vattenhyacint – två plan, två hålor och dyna](https://www.fyndplats.se/produkt/klostunna-50-cm-vattenhyacint): Maxlast
- [Klöstunna i vattenhyacint med tre plan, boho-design](https://www.fyndplats.se/produkt/klostunna-vattenhyacint-tre-plan-boho): Maxlast
- [Takspänt klösträd 230–250 cm i grått och cremevitt – hängmatta och tre plan](https://www.fyndplats.se/produkt/klostrad-takspant-gratt): Maxlast
- [Takspänt klösträd 230–250 cm i ek och cremevitt – hängmatta och tre plan](https://www.fyndplats.se/produkt/klostrad-takspant-ek): Maxlast
- [Väggklösträd 73 cm i beige – två hyllplan, hängmatta och tre klivsteg](https://www.fyndplats.se/produkt/vaggklostrad-73-cm-tre-klivsteg): Maxlast
- [Klösträd 109 cm med klöstunna i tre plan och bädd på toppen](https://www.fyndplats.se/produkt/klostrad-109-cm-tunna-badd): Maxlast
- [Väggmonterat klösträd 137 cm med fyra hyllor](https://www.fyndplats.se/produkt/klostrad-vaggmonterat-137-cm): Maxlast
- [Klösträd 131 cm med stege och hus i sjögräs – tak överst, beige och kaffebrunt](https://www.fyndplats.se/produkt/klostrad-med-stege-131-cm-sjograshus): Maxlast
- [Klöstunna 74 cm i beige – tre ingångar och liggplats på toppen](https://www.fyndplats.se/produkt/klostunna-74-cm-beige): Maxlast
- [Klöstunna 74 cm i mörkgrått – tre ingångar och liggplats på toppen](https://www.fyndplats.se/produkt/klostunna-74-cm-morkgra): Maxlast
- [Klösträd i fem plan 230–260 cm – sisalstam och tippskydd, grå](https://www.fyndplats.se/produkt/klostrad-fem-plan-230-260-cm-gra): Maxlast
- [Klösträd i fem plan 230–260 cm – sisalstam och tippskydd, beige](https://www.fyndplats.se/produkt/klostrad-fem-plan-230-260-cm-beige): Maxlast
- [Klösträd i fem plan 230–260 cm – sisalstam och tippskydd, mörkbrun](https://www.fyndplats.se/produkt/klostrad-fem-plan-230-260-cm-morkbrun): Maxlast
- [Klösträd med grotta och hängmatta – 130 cm, 5 nivåer, beige](https://www.fyndplats.se/produkt/klostrad-med-grotta-hangmatta-130-cm-beige): Maxlast
- [Klöstunna 70 cm med tre plan och två hålor](https://www.fyndplats.se/produkt/klostunna-70-cm-tre-plan): Bredd

### bil-cykel (85 produkter)

Filter: Material (40 %)

- [Cykelkärra för last med kapell – 40 kg, hopfällbar, 20-tumshjul, röd och svart](https://www.fyndplats.se/produkt/cykelkarra-last-kapell-hopfallbar-rod): Material
- [Spännband 4-pack med spärr – 25 mm × 4,6 m eller 40 mm × 2,4 m](https://www.fyndplats.se/produkt/spannband-4-pack-sparr): Material
- [Växelriktare ren sinus 2000 eller 2500 W – 12 V eller 24 V](https://www.fyndplats.se/produkt/vaxelriktare-ren-sinus-2000-2500w-12-24v): Material
- [LCD-display SW900 till elcykel – separat knappsats och UART](https://www.fyndplats.se/produkt/lcd-display-sw900-elcykel-knappsats): Material
- [Trådlös CarPlay-adapter 4-i-1 – Android Auto, AirPlay och Miracast](https://www.fyndplats.se/produkt/tradlos-carplay-adapter-4-i-1): Material
- [Dieselvärmare 12 V 2/5/8 kW – kupévärmare med app eller LCD-panel](https://www.fyndplats.se/produkt/dieselvarmare-12v-2-5-8-kw): Material
- [Takräcke för bil med rails – lasthållare i aluminium 120–135 cm, 90 kg](https://www.fyndplats.se/produkt/takracke-bil-rails-lasthallare-aluminium): Material
- [Cykelmekställ hopfällbart – arbetsstativ med 360° klämma och verktygsbricka](https://www.fyndplats.se/produkt/cykelmekstall-hopfallbart-arbetsstativ-cykel): Material
- [Kylbox för bil 8 L – kompressorkyl till armstödet, −20 °C och Bluetooth](https://www.fyndplats.se/produkt/kylbox-bil-8l-armstod-kompressor): Material
- [Luftdomkraft 3 eller 5 ton – bälgdomkraft med förhöjningspelare](https://www.fyndplats.se/produkt/luftdomkraft-balgdomkraft-3-5-ton): Material
- [Dieselvärmare husbil 8 kW – allt-i-ett med 5 l tank, LCD och fjärrkontroll](https://www.fyndplats.se/produkt/dieselvarmare-husbil-8kw-allt-i-ett): Material
- [Taktält med hårdskal – gasfjädrar, madrass och teleskopstege](https://www.fyndplats.se/produkt/taktalt-hardskal-gasfjadrar-teleskopstege): Material
- [Bead blaster 8 eller 9 liter – tryckluftstank för däckmontering](https://www.fyndplats.se/produkt/bead-blaster-8-9-liter-dackmontering): Material
- [Bakspoiler GT-vinge 110 cm – universal i aluminium med justerbar vinkel](https://www.fyndplats.se/produkt/bakspoiler-gt-vinge-110-cm-universal): Material
- [Tryckluftshorn 4 trumpeter med kompressor och tank 12 V](https://www.fyndplats.se/produkt/tryckluftshorn-4-trumpeter-kompressor-12v): Material
- [Parkeringsvärmare diesel 8 kW – Bluetooth-app, CO-larm och nätadapter](https://www.fyndplats.se/produkt/parkeringsvarmare-diesel-8kw-bluetooth): Material
- [Portabel elbilsladdare Typ 2 3,7 kW – Schuko, 5 m kabel, LCD & timer](https://www.fyndplats.se/produkt/portabel-elbilsladdare-typ-2-schuko): Material
- [Handvinsch för båt och trailer – 1588 kg med 2 växlar](https://www.fyndplats.se/produkt/handvinsch-bat-trailer-1588-kg): Material
- [Handvinsch för båt och trailer – 725 kg med 4:1 utväxling](https://www.fyndplats.se/produkt/handvinsch-bat-trailer): Material
- [Handvinsch för båt och trailer – 272 kg, kompakt med band](https://www.fyndplats.se/produkt/handvinsch-bat-272-kg): Material
- [Kompakt handvinsch för båt och trailer – 725 kg, nylonhölje](https://www.fyndplats.se/produkt/handvinsch-bat-nylonholje): Material
- [Handvinsch 1588 kg för båt och trailer – 2 växlar, nylonhölje](https://www.fyndplats.se/produkt/handvinsch-bat-nylon-1588-kg): Material
- [Vattenavskiljare diesel 500FG – bränslefilter för båt & lastbil](https://www.fyndplats.se/produkt/vattenavskiljare-diesel-500fg-branslefilter): Material
- [Barncykel 20 tum – 7-växlad mountainbike för barn](https://www.fyndplats.se/produkt/barncykel-20-tum-mountainbike-7-vaxlad): Material
- [Kättinglås för elsparkcykel & cykel – 8 mm härdat stål, 93 cm med väska](https://www.fyndplats.se/produkt/kattinglas-elsparkcykel-cykel-93cm): Material
- [Garagedomkraft 2,5 ton – låg profil, hydraulisk](https://www.fyndplats.se/produkt/garagedomkraft-2-5-ton-lag-profil): Material
- [MTB styrhorn för mountainbike – ergonomiska bar ends – WEST BIKING](https://www.fyndplats.se/produkt/mtb-styrhorn-mountainbike-west-biking): Material
- [Elektrisk cykelpump 150 PSI – minipump med display – WEST BIKING](https://www.fyndplats.se/produkt/elektrisk-cykelpump-150psi-west-biking): Material
- [Ergonomiska cykelhandtag med stötdämpning – WEST BIKING](https://www.fyndplats.se/produkt/ergonomiska-cykelhandtag-med-stotdampning-west-biking): Material
- [Vattentät sadelväska i 600D TPU med vredlås – WEST BIKING](https://www.fyndplats.se/produkt/vattentat-sadelvaska-600d-tpu-vredlas-west-biking): Material
- [Kolfiberpedaler för racercykel med titanaxel och 3 lager – WEST BIKING](https://www.fyndplats.se/produkt/kolfiberpedaler-racercykel-titanaxel-3-lager-west-biking): Material
- [Cykelglasögon med UV400 och polariserade linser – WEST BIKING](https://www.fyndplats.se/produkt/cykelglasogon-uv400-polariserade-west-biking): Material
- [Cykelryggsäck 10L med hydreringssystem för MTB – WEST BIKING](https://www.fyndplats.se/produkt/cykelryggsack-10l-hydreringssystem-mtb-west-biking): Material
- [Cykellås med kod – hopfällbart kombinationslås, 78 cm – WEST BIKING](https://www.fyndplats.se/produkt/cykellas-med-kod-hopfallbart-78-cm): Material
- [MTB-pedaler i aluminiumlegering med krommolybdenaxel – WEST BIKING](https://www.fyndplats.se/produkt/mtb-pedaler-aluminium-krommolybdenaxel-west-biking): Material
- [3d-printad sadel med hexagonal gitterstruktur – WEST BIKING](https://www.fyndplats.se/produkt/3d-printad-sadel-hexagonal-gitterstruktur-west-biking): Material
- [Cykelsadel WEST BIKING – bekväm stadscykelsadel 22,5 cm med stötdämpare](https://www.fyndplats.se/produkt/cykelsadel-west-biking-stadscykel-stotdampare): Material
- [Reparationsställ för cykel WEST BIKING – hopfällbart mekställ med verktygsbricka](https://www.fyndplats.se/produkt/reparationsstall-cykel-west-biking-mekstall): Material
- [Vikbart cykellås WEST BIKING – 6-delat 80 cm med fäste och 2 nycklar](https://www.fyndplats.se/produkt/vikbart-cykellas-west-biking-6-delat): Material
- [Baseus starthjälp 2000A för bil – 20000mAh powerbank, 12V bensin & diesel](https://www.fyndplats.se/produkt/baseus-starthjalp-2000a-powerbank-bil): Material
- [Baseus 1000A startbooster för bil – kompressor och powerbank, 8000 mAh](https://www.fyndplats.se/produkt/baseus-1000a-startbooster-bil-kompressor): Material
- [Baseus GoTrip VA1 bilkompressor – sladdlös däckpump 5000 mAh, 150 PSI](https://www.fyndplats.se/produkt/baseus-gotrip-va1-bilkompressor-sladdlos): Material
- [Takkorg för bil – lastkorg med väska, nät och spännband, 90 kg](https://www.fyndplats.se/produkt/takkorg-bil-lastkorg-vaska): Material
- [Portabel elbilsladdare Typ 2 – 16A, 3,68 kW, LCD och 7,5 m kabel](https://www.fyndplats.se/produkt/portabel-elbilsladdare-typ-2-16a): Material
- [Snöborste med isskrapa 4-i-1 – teleskopisk för bil, vridbart huvud](https://www.fyndplats.se/produkt/snoborste-med-isskrapa): Material
- [Barncykel 16 tum med stödhjul för barn 100–135 cm – dubbla bromsar, gul](https://www.fyndplats.se/produkt/barncykel-16-tum): Material
- [Hydraulisk handbroms för drift och rally – universal, aluminium](https://www.fyndplats.se/produkt/hydraulisk-handbroms-drift): Material
- [Cykellyft för tak upp till 60 kg – takhiss med remskivor och krok](https://www.fyndplats.se/produkt/cykellyft-tak): Material
- [Membranpump 12 V – självsugande tryckvattenpump för husbil och båt, 17 l/min](https://www.fyndplats.se/produkt/membranpump-12v-sjalvsugande-vattenpump): Material
- [Elektrisk domkraft 12V för bil – 5 ton, hydraulisk med däckpump och LED](https://www.fyndplats.se/produkt/elektrisk-domkraft-12v-bil-5-ton): Material
- [Dieselvärmare 12V/24V 8 kW – portabel allt-i-ett med fjärrkontroll och LCD](https://www.fyndplats.se/produkt/dieselvarmare-12v-8kw): Material

### traning-gym (127 produkter)

Filter: Vikt (44 %), Material (89 %, syns)

- [Punchingboll 125–145 cm med viktsäck på 15 kg och boxhandskar](https://www.fyndplats.se/produkt/punchingboll-viktsack-125-145-cm): Vikt
- [Hantelset med träställ, sex hexhantlar på 1/3/5 kg — 18 kg totalt](https://www.fyndplats.se/produkt/hantelset-med-stall): Vikt
- [Justerbar hantel 2–11 kg i fem steg, en hantel med förvaringsvagga](https://www.fyndplats.se/produkt/justerbar-hantel-11-kg): Vikt
- [Träningsbänk 115 cm med bensträckare och 7 ryggvinklar](https://www.fyndplats.se/produkt/traningsbank-115-cm-benstrackare): Vikt
- [Hopfällbar träningsbänk med justerbart ryggstöd, svart](https://www.fyndplats.se/produkt/traningsbank-butterfly-svart-hopfallbar): Vikt
- [Fristående boxningssäck 135 cm med tio sugproppar, förfylld](https://www.fyndplats.se/produkt/boxningssack-135-cm-sugproppar): Vikt
- [Kompakt gymstation 162 × 162 cm – latsdrag, butterfly och 65 kg vikter](https://www.fyndplats.se/produkt/kompakt-gymstation-162-cm-latsdrag): Vikt, Material
- [Multigym 250 cm med bänk och dipstation – över tio övningar](https://www.fyndplats.se/produkt/multigym-250-cm-bank-dipstation): Vikt, Material
- [Hemmagym med benpress 160 cm – 45 kg viktblock och bröststation](https://www.fyndplats.se/produkt/hemmagym-benpress-160-cm-45-kg): Vikt, Material
- [Punchingboll med reflexstång 160–205 cm och 12 sugproppar](https://www.fyndplats.se/produkt/punchingboll-reflexstang-160-205-cm): Vikt
- [Punchingboll 147–165 cm med fyllbar fot och sugproppar](https://www.fyndplats.se/produkt/punchingboll-147-165-cm-fyllbar-fot): Vikt
- [Punchingboll 145–180 cm svart med fyllbar fot](https://www.fyndplats.se/produkt/punchingboll-145-180-cm-svart): Vikt
- [Gymstation med träningsbänk – 65 kg viktblock och 108 cm latsstång](https://www.fyndplats.se/produkt/gymstation-traningsbank-65-kg-viktblock): Vikt, Material
- [Kraftstation 170 × 139 cm med dubbla kabeldrag – 15 lägen och chinsstång](https://www.fyndplats.se/produkt/kraftstation-dubbla-kabeldrag-170-cm): Vikt, Material
- [Träningsbänk i trä med hantelfack och 6 ryggvinklar](https://www.fyndplats.se/produkt/traningsbank-i-tra-med-hantelfack): Vikt
- [Träningsbänk med skivstångsställ, bröstpress och benpress, vit](https://www.fyndplats.se/produkt/traningsbank-180-cm-vit-med-skivstangsstall): Vikt
- [Punchingboll 133–151 cm svart med sugpropp och fjädrande stång](https://www.fyndplats.se/produkt/punchingboll-133-151-cm-svart): Vikt
- [Träningsbänk med ställning 98–122 cm, hopfällbar](https://www.fyndplats.se/produkt/traningsbank-med-stallning-98-122-cm): Vikt
- [Gymstation 207 cm med vridbara armar – 45 kg viktblock, 0–90°](https://www.fyndplats.se/produkt/gymstation-207-cm-vridbara-armar): Vikt, Material
- [Boxningsstation 160–230 cm svart med två bollar och reflexstång](https://www.fyndplats.se/produkt/boxningsstation-160-230-cm-svart): Vikt
- [Boxningssäck svart 155–205 cm med roterande arm och boll](https://www.fyndplats.se/produkt/boxningssack-svart-155-205-cm-reflexstang): Vikt
- [Boxningssäck röd 155–205 cm med roterande arm och boll](https://www.fyndplats.se/produkt/boxningssack-rod-155-205-cm-reflexstang): Vikt
- [Punchingboll 136–154 cm i fyra lägen med boxhandskar](https://www.fyndplats.se/produkt/punchingboll-136-154-cm-fyra-lagen): Vikt
- [Träningsbänk med skivstångsställ, bensträckare och bicepspulpet](https://www.fyndplats.se/produkt/traningsbank-175-cm-med-skivstangsstall): Vikt
- [Hantel 20 kg, sexkantig med gummiklädsel](https://www.fyndplats.se/produkt/hantel-20-kg-sexkantig-gummi): Vikt
- [Benmaskin för benspark och bencurl – 32 startlägen, tar 60 kg skivor](https://www.fyndplats.se/produkt/benmaskin-benspark-bencurl): Vikt
- [Träningslinne med inbyggd bh – öppen rygg och fyrkantig hals](https://www.fyndplats.se/produkt/traningslinne-med-inbyggd-bh): Vikt
- [Cykelshorts med hög midja – sömlösa med rynkad bakdel, tio färger](https://www.fyndplats.se/produkt/cykelshorts-hog-midja): Vikt
- [Träningsset med sport-bh och flares – sömlöst set i två delar](https://www.fyndplats.se/produkt/traningsset-sport-bh-flares): Vikt
- [Sport-bh med lätt stöd – vriden framsida och tunna korsade band](https://www.fyndplats.se/produkt/sport-bh-latt-stod): Vikt
- [Träningsset med långtopp och flares – sömlöst i elva färger](https://www.fyndplats.se/produkt/traningsset-langtopp-flares): Vikt
- [Yogalinne med omlott framsida – smala korsade band, 12 färger](https://www.fyndplats.se/produkt/yogalinne-omlott-framsida): Vikt
- [Utsvängda leggings med rynkad bakdel – sömlösa i nio färger](https://www.fyndplats.se/produkt/utsvangda-leggings-rynkad-bakdel): Vikt
- [Utsvängda yogabyxor med korsad midja – sömlösa i 15 färger](https://www.fyndplats.se/produkt/utsvangda-yogabyxor-korsad-midja): Vikt
- [Sömlösa leggings med låg ribbad midja – ankellånga i elva färger](https://www.fyndplats.se/produkt/somlosa-leggings-lag-ribbad-midja): Vikt
- [Halterneck-linne med rynkad framsida – höftlångt, 29 färger](https://www.fyndplats.se/produkt/halterneck-linne-rynkad-framsida): Vikt
- [Träningstopp med halterneck – öppen rygg och höftlång passform](https://www.fyndplats.se/produkt/traningstopp-halterneck): Vikt
- [Yogabyxor med raka ben och hög midja – ankellånga i 16 färger](https://www.fyndplats.se/produkt/yogabyxor-raka-ben): Vikt
- [Roddmaskin för hemmet – 12 hydrauliska nivåer, LCD, 130 kg](https://www.fyndplats.se/produkt/roddmaskin-hemmet-12-nivaer-hydraulisk): Vikt
- [Eldriven pedaltränare – 12 hastigheter, fjärrkontroll och display](https://www.fyndplats.se/produkt/eldriven-pedaltranare-12-hastigheter): Vikt
- [Fristående boxningssäck 156 cm – 12 sugproppar och fjädrande fäste](https://www.fyndplats.se/produkt/fristaende-boxningssack-156-cm): Vikt, Material
- [Boxboll med väggfäste – roterande plattform ø60 cm](https://www.fyndplats.se/produkt/boxboll-vaggfaste-plattform-60-cm): Vikt
- [Scottbänk 2-i-1 för biceps och triceps – 25 vinklar](https://www.fyndplats.se/produkt/scottbank-2-i-1-biceps-triceps-25-vinklar): Vikt
- [Tyst studsmatta 102 cm med handtag, 36 gummirep](https://www.fyndplats.se/produkt/tyst-studsmatta-102-cm-handtag): Vikt
- [Träningsbänk med benrullar och gummiband – 7 rygglägen, 350 kg](https://www.fyndplats.se/produkt/traningsbank-med-benrullar-gummiband): Vikt
- [Fristående chinsstång 176–227 cm – 12 höjdlägen, dips, max 120 kg](https://www.fyndplats.se/produkt/fristaende-chinsstang): Vikt
- [Hexhantlar 6 kg – 2-pack gummerade hantlar, 12 kg totalt, räfflat kromgrepp](https://www.fyndplats.se/produkt/hexhantlar-6-kg-2-pack-gummerade-hantlar-12-kg): Vikt
- [Hopfällbar träningsbänk med justerbart ryggstöd – 300 kg, röd](https://www.fyndplats.se/produkt/hopfallbar-traningsbank-justerbart-ryggstod-rod): Vikt
- [Stepbräda justerbar 100×38 cm – aerobic step 15/20/25 cm, max 250 kg](https://www.fyndplats.se/produkt/stepbrada-justerbar-100-cm-aerobic-step): Vikt
- [Stepbräda justerbar 12/17,5/22,5 cm – halkfri, 75×29 cm, bär 250 kg, rosa](https://www.fyndplats.se/produkt/stepbrada-justerbar-rosa-75-cm): Vikt
- [Chinsstång vägg 2 i 1 – väggmonterad chins- och dipsstation, max 200 kg](https://www.fyndplats.se/produkt/chinsstang-vagg-dipsstation-2-i-1): Vikt
- [Hantelset med ställning 36 kg – 6 hexhantlar 2×4, 2×6 och 2×8 kg](https://www.fyndplats.se/produkt/hantelset-med-stallning-36-kg-hexhantlar): Vikt
- [Pilatesbräda Reformer i trä med motståndsband – 165 cm, max 120 kg](https://www.fyndplats.se/produkt/pilatesbrada-reformer-tra-motstandsband): Vikt
- [Gymnastikbarr för barn – justerbar höjd 92–150 cm, bok & stål, 13 lägen](https://www.fyndplats.se/produkt/gymnastikbarr-barn-justerbar-hojd-92-150-cm): Vikt
- [Golvstol justerbar & hopfällbar – för spel, läsning och meditation](https://www.fyndplats.se/produkt/golvstol-justerbar-hopfallbar): Vikt
- [Väggmonterad chinsstång & dipsställning 2-i-1 – pull up bar](https://www.fyndplats.se/produkt/vaggmonterad-chinsstang-dipsstallning-pull-up-bar): Vikt, Material
- [Justerbara hantlar 4-i-1, 2-pack – 1/1,5/2/2,5 kg med TPR-grepp](https://www.fyndplats.se/produkt/justerbara-hantlar-4-i-1-2-pack): Vikt, Material
- [Fristående boxningssäck 160–230 cm – roterande arm och 2 boxningsbollar](https://www.fyndplats.se/produkt/fristaende-boxningssack-160-230-cm): Vikt
- [Balansträner halvboll 58 cm – för core, balans och rehabträning](https://www.fyndplats.se/produkt/balanstraner-halvboll-58): Vikt
- [Studsmatta för träning Ø102 cm – hopfällbar med justerbart handtag](https://www.fyndplats.se/produkt/studsmatta-traning): Vikt
- [Smart boxningsdyna väggmonterad med LED, Bluetooth och musik – handskar ingår](https://www.fyndplats.se/produkt/smart-boxningsdyna): Vikt, Material
- [Justerbar skivstång med viktskivor 20 kg – viktset för hemmagym](https://www.fyndplats.se/produkt/justerbar-skivstang-20-kg): Vikt
- [Sissy squat-bänk 3-i-1 – justerbar magträningsbräda för squats och armhävningar](https://www.fyndplats.se/produkt/sissy-squat-bank-3-i-1): Vikt
- [Liggande motionscykel med ryggstöd – 8 motståndsnivåer och LCD-display](https://www.fyndplats.se/produkt/liggande-motionscykel-ryggstod): Vikt
- [Hopfällbar motionscykel med ryggstöd – 8 motståndsnivåer och LCD-display](https://www.fyndplats.se/produkt/hopfallbar-motionscykel-ryggstod): Vikt
- [Hopfällbart gåband 1–6 km/h – elektriskt löpband med LCD och nödstopp, 90 kg](https://www.fyndplats.se/produkt/hopfallbart-gaband-lopband-1-6kmh): Vikt
- [Motionscykel med ryggstöd – 8 motståndsnivåer, LCD och 3 kg svänghjul](https://www.fyndplats.se/produkt/motionscykel-ryggstod): Vikt
- [Magnetisk motionscykel med LCD-skärm – justerbar sadel och styre, max 120 kg](https://www.fyndplats.se/produkt/magnetisk-motionscykel-lcd): Vikt
- [Motionscykel för hemmet – 8 motstånd, justerbar, 120 kg](https://www.fyndplats.se/produkt/motionscykel-hemma-justerbar-lcd): Vikt
- [Hopfällbar balansbom 210 cm för gymnastik – mockaklädd med skumkärna](https://www.fyndplats.se/produkt/hopfallbar-balansbom): Vikt
- [Justerbar stepbräda – 3 höjder, halkfri EVA-yta, bär 250 kg, grön/mörkgrå](https://www.fyndplats.se/produkt/justerbar-stepbrada): Vikt
- [Plyo box i bokträ med tre höjder, 40–60 cm](https://www.fyndplats.se/produkt/plyo-box-boktra-tre-hojder): Material
- [Kettlebell 10 kg sandfylld med brett grepp](https://www.fyndplats.se/produkt/kettlebell-10-kg-sandfylld): Material
- [Bollvagn för tennis & pickleball – hopfällbar, 175 bollar, på hjul](https://www.fyndplats.se/produkt/bollvagn-tennis-pickleball-hopfallbar): Material
- [Multifunktionell träningsbräda – för magträning, armhävningar och pilates](https://www.fyndplats.se/produkt/multifunktionell-traningsbrada-pilates): Material

### friluftsliv-resa (86 produkter)

Filter: Vikt (36 %), Material (66 %, syns)

- [Naturehike dunsovsäck kuvertmodell – 650 FP, från 570 g](https://www.fyndplats.se/produkt/naturehike-dunsovsack-kuvertmodell-650fp): Vikt, Material
- [Naturehike Long Wind vikbara vandringsstavar – 35 cm, 2-pack](https://www.fyndplats.se/produkt/naturehike-long-wind-vikbara-vandringsstavar): Vikt, Material
- [Naturehike campingstol L04 – två storlekar, tål 150 kg](https://www.fyndplats.se/produkt/naturehike-campingstol-l04-tva-storlekar): Vikt
- [Naturehike Rock 2.0 vandringsryggsäck – 30 eller 60 liter](https://www.fyndplats.se/produkt/naturehike-rock-2-0-vandringsryggsack): Vikt
- [Naturehike Star River UL tvåmanstält – 1,44 kg och två förrum](https://www.fyndplats.se/produkt/naturehike-star-river-ul-tvamanstalt): Vikt, Material
- [Naturehike Cloud Up Pro kupoltält – 1, 2 eller 3 personer](https://www.fyndplats.se/produkt/naturehike-cloud-up-pro-kupoltalt-1-3-personer): Vikt, Material
- [Naturehike vandringsstavar 2-pack – 193 g kolfiber, 62–135 cm](https://www.fyndplats.se/produkt/naturehike-vandringsstavar-2-pack-kolfiber): Vikt, Material
- [Naturehike cykeltält 1 person – 1,3 kg och 40 cm packmått](https://www.fyndplats.se/produkt/naturehike-cykeltalt-1-person): Vikt, Material
- [Naturehike Rock ryggsäck 40+5 eller 60+5 liter – regnskydd ingår](https://www.fyndplats.se/produkt/naturehike-rock-ryggsack-40-5-eller-60-5-liter): Vikt, Material
- [Naturehike Mongar Pro vandringstält – 1 eller 2 personer](https://www.fyndplats.se/produkt/naturehike-mongar-pro-vandringstalt-1-eller-2-personer): Vikt, Material
- [Naturehike Star River 2 campingtält 2 personer – två förrum](https://www.fyndplats.se/produkt/naturehike-star-river-2-campingtalt-2-personer): Vikt, Material
- [Naturehike Mujin mumiesovsäck – MJ300 +4 °C eller MJ600 −5 °C](https://www.fyndplats.se/produkt/naturehike-mujin-mumiesovsack-mj300-mj600): Vikt, Material
- [Naturehike Mongar trekkingtält – 210T, 20D eller 15D UL](https://www.fyndplats.se/produkt/naturehike-mongar-trekkingtalt-210t-20d-eller-15d-ul): Vikt, Material
- [Naturehike Cloud Up lättviktstält 2 personer – Base eller UL](https://www.fyndplats.se/produkt/naturehike-cloud-up-lattviktstalt-2-personer): Vikt, Material
- [Hopfällbar vattentank 113–400 L – vattenblåsa i PVC med kran](https://www.fyndplats.se/produkt/hopfallbar-vattentank-pvc): Vikt
- [Campingbord med förvaringsskåp 120 cm – hopfällbart, tre höjder](https://www.fyndplats.se/produkt/campingbord-med-forvaringsskap-120-cm): Vikt
- [Vattentät utrustningsväska IP67 – 10/31/49 L med skumfoder](https://www.fyndplats.se/produkt/vattentat-utrustningsvaska-ip67): Vikt
- [Campingsäng med nackstöd 187 cm – sidoficka och 150 kg bärighet](https://www.fyndplats.se/produkt/campingsang-nackstod-187-cm): Vikt
- [Campingsäng hopfällbar 193 cm svart – bärväska ingår, tål 136 kg](https://www.fyndplats.se/produkt/campingsang-hopfallbar-193-cm-svart): Vikt, Material
- [Campingsäng hopfällbar 193 cm grön – bärväska ingår, tål 136 kg](https://www.fyndplats.se/produkt/campingsang-hopfallbar-193-cm-gron): Vikt, Material
- [Campingbord hopfällbart 95 cm – hoprullbar skiva och bärväska](https://www.fyndplats.se/produkt/campingbord-hopfallbart-95-cm): Vikt
- [Campingbord med förvaringskorg 93 cm – hoprullbar skiva och bärväska](https://www.fyndplats.se/produkt/campingbord-forvaringskorg-93-cm): Vikt, Material
- [Picknickbord hopfällbart 120 cm – sidoklaff och två höjder, 5,2 kg](https://www.fyndplats.se/produkt/picknickbord-hopfallbart-120-cm): Vikt, Material
- [Runt hopfällbart bord Ø 120 cm – partybord i HDPE som tål 100 kg](https://www.fyndplats.se/produkt/runt-hopfallbart-bord-120-cm): Vikt, Material
- [Familjetält 4–6 personer 590 cm – två sovrum och förtält](https://www.fyndplats.se/produkt/familjetalt-4-6-personer-590-cm-tva-sovrum-fortalt): Vikt
- [Campingstol med fotstöd 2-pack – fyra lägen, bär 120 kg](https://www.fyndplats.se/produkt/campingstol-fotstod-2-pack-fyra-lagen): Vikt
- [Hängmatta 2 personer 400 cm – träspridare, bär 210 kg](https://www.fyndplats.se/produkt/hangmatta-2-personer-400-cm-210-kg): Vikt
- [Strandparasoll 2-i-1 Ø210 cm – sidoväggar och UV50](https://www.fyndplats.se/produkt/strandparasoll-2-i-1-210-cm-sidovaggar): Vikt
- [Tunneltält 6–8 personer 450 × 215 cm – två sovrum och bärväska](https://www.fyndplats.se/produkt/tunneltalt-6-8-personer-450x215): Vikt
- [Hybridväxelriktare för solel 5–12 kW – MPPT, 230 V och wifi](https://www.fyndplats.se/produkt/hybridvaxelriktare-solel-5-12-kw-mppt): Vikt, Material
- [Odlingslåda 3 nivåer 117×100 cm – 9 fack i granträ med fiberduk](https://www.fyndplats.se/produkt/odlingslada-3-nivaer-117x100-cm): Vikt, Material
- [Fiskrensbord hopfällbart 127 cm – diskho, kran och justerbar höjd](https://www.fyndplats.se/produkt/fiskrensbord-hopfallbart-127-cm): Vikt
- [Båtfender 4-pack – uppblåsbara fendrar med pump, rep och väska](https://www.fyndplats.se/produkt/batfender-4-pack-uppblasbar-med-pump): Vikt
- [Husvagnsöverdrag i 4 lager – med däckskydd och dragkedjedörrar](https://www.fyndplats.se/produkt/husvagnsoverdrag-4-lager-med-dackskydd): Vikt, Material
- [Taktält med hårdskal – gasfjädrar, madrass och teleskopstege](https://www.fyndplats.se/produkt/taktalt-hardskal-gasfjadrar-teleskopstege): Vikt, Material
- [Åkbar barnresväska 26 L – barnen sitter och åker, handbagage med 4 hjul](https://www.fyndplats.se/produkt/akbar-barnresvaska-26l-handbagage): Vikt, Material
- [Vändbar utomhusmatta 182 × 274 cm – vattentålig med geometriskt mönster](https://www.fyndplats.se/produkt/vandbar-utomhusmatta): Vikt, Material
- [Eldkorg med gnistskydd och grill i stål – kvadratisk 45 × 45 cm](https://www.fyndplats.se/produkt/eldkorg-gnistskydd-grill): Vikt
- [Bärbar campingvask med vattentankar och tvålpump – 83 cm](https://www.fyndplats.se/produkt/barbar-campingvask-vattentank-tvalpump): Vikt
- [Campingstol hopfällbar med armstöd – 2-pack, max 130 kg](https://www.fyndplats.se/produkt/campingstol-hopfallbar-armstod-2-pack): Vikt
- [Uppblåsbart tält för 2–3 personer – 2 rum, pump och 3000 mm vattenpelare](https://www.fyndplats.se/produkt/uppblasbart-talt): Vikt
- [Kylbox på hjul 56 L – rullande drinkvagn med flasköppnare för fest & uteplats](https://www.fyndplats.se/produkt/kylbox-pa-hjul-56l): Vikt
- [Dubbel sovsäck för 2 personer – delbar, med kuddar och förvaringsväska](https://www.fyndplats.se/produkt/dubbel-sovsack): Vikt
- [Paviljong 3x3 m – partytält med stålstomme, dräneringshål och spännlinor](https://www.fyndplats.se/produkt/paviljong-3x3): Vikt
- [Hopfällbar kolgrill – bärbar campinggrill, justerbart galler](https://www.fyndplats.se/produkt/hopfallbar-kolgrill-barbar-campinggrill): Vikt
- [Uppblåsbart campingtält 3–5 personer – lufttält med pump och kaminhål](https://www.fyndplats.se/produkt/uppblasbart-campingtalt): Vikt
- [Skuggväv för pergola – 90% solskydd i HDPE med öljetter, för trädgård](https://www.fyndplats.se/produkt/skuggvav-pergola-90-solskydd-hdpe): Vikt
- [PCP handpump för luftgevär, 4500 psi – 3-stegs högtryckspump](https://www.fyndplats.se/produkt/pcp-handpump-luftgevar-4500-psi-3-stegs): Vikt
- [Bryggestege infällbar 4/5 steg med halkskydd](https://www.fyndplats.se/produkt/bryggestege-infallbar): Vikt
- [Bogserbar ring för båt – uppblåsbar towable för 2 personer med handtag och fena](https://www.fyndplats.se/produkt/bogserbar-ring-bat): Vikt
- [Draglek för båt – uppblåsbar towable för 3–4 åkare, 22 handtag, 308 kg](https://www.fyndplats.se/produkt/draglek-bat-uppblasbar-towable): Vikt
- [Tube för båt, 2 personer – uppblåsbar towable draglek](https://www.fyndplats.se/produkt/tube-for-bat-2-personer-towable-draglek): Vikt, Material
- [Fiskespö med rulle 2,13 m – kolfiber och multirulle (7+1 kullager)](https://www.fyndplats.se/produkt/fiskespo-med-rulle-kolfiber): Vikt, Material
- [Pop up-paviljong med myggnät, 6-sidig – 10×10 & 12×12 ft](https://www.fyndplats.se/produkt/pop-up-paviljong-myggnat-6-sidig): Vikt
- [Vapenkoffert för gevär med hjul – vattentät, 3 lager skum, TSA-anpassad](https://www.fyndplats.se/produkt/vapenkoffert-gevar-vattentat-hjul): Vikt
- [Naturehike CW400 dunsovsäck – öppnas till filt eller poncho](https://www.fyndplats.se/produkt/naturehike-cw400-dunsovsack-oppnas-till-filt-eller-poncho): Material
- [Jaktstol med tyst 360°-vridsits – höj- och sänkbar, bär 158 kg](https://www.fyndplats.se/produkt/jaktstol-360-vridsits): Material
- [Solpanel hopfällbar 20 W – USB-laddare för mobil och powerbank](https://www.fyndplats.se/produkt/solpanel-hopfallbar-20w-usb): Material
- [Portabelt volleybollnät – komplett set, justerbar höjd, stolpar och boll](https://www.fyndplats.se/produkt/portabelt-volleybollnat): Material

### forvaring-organisering (451 produkter)

Filter: Maxlast (55 %), Djup (84 %, syns), Höjd (85 %, syns), Bredd (88 %, syns), Material (89 %, syns)

- [Badrumshylla i bambu och svart stål – fyra plan, 110 cm hög, med tippskydd](https://www.fyndplats.se/produkt/badrumshylla-bambu-svart-stal-fyra-plan): Maxlast
- [Förvaringsskåp med två tyglådor – rustikt brun, stålram, 45 × 40 × 70,5 cm](https://www.fyndplats.se/produkt/forvaringsskap-tva-tyglador-70-cm): Maxlast
- [Hylla i bambu med tre plan – 62 × 33 × 80 cm, för badrum och kök](https://www.fyndplats.se/produkt/hylla-bambu-tre-plan-62-cm): Maxlast
- [Låg bokhylla med åtta fack – ekdekor, 97,5 × 30 × 100 cm](https://www.fyndplats.se/produkt/lag-bokhylla-atta-fack-ek): Maxlast
- [Hopfällbar skohylla i bambu med fyra plan – 12 par, 60 × 29 × 67 cm](https://www.fyndplats.se/produkt/hopfallbar-skohylla-bambu-fyra-plan): Maxlast
- [Smalt konsolbord 75 cm i marmorlook – vit stomme, 24 cm djupt, justerbara fötter](https://www.fyndplats.se/produkt/smalt-konsolbord-75-cm-marmorlook-vit): Maxlast
- [Sidobord med skåp i industristil – trälook och svart stål, 40 × 30 × 76 cm](https://www.fyndplats.se/produkt/sidobord-med-skap-industristil): Maxlast
- [Skobänk i bambu med två hyllplan – sittyta som bär 130 kg, 50 × 28 × 45 cm](https://www.fyndplats.se/produkt/skobank-bambu-tva-hyllplan): Maxlast
- [Skobänk i bambu med två hyllplan – 70 cm bred, sittyta som bär 130 kg](https://www.fyndplats.se/produkt/skobank-bambu-70-cm-tva-hyllplan): Maxlast
- [Smal bokhylla i vitt, 30 cm bred – två lådor, skåp och öppna fack, 158 cm](https://www.fyndplats.se/produkt/smal-bokhylla-vit-lador-skap-158): Maxlast
- [Bokhylla på hjul med tre plan – vit metall, låsbara hjul, 69 × 26 × 108 cm](https://www.fyndplats.se/produkt/bokhylla-pa-hjul-tre-plan-vit): Maxlast
- [Bokhylla i trädform, 136 cm – nio plan, vit, med tippskydd](https://www.fyndplats.se/produkt/bokhylla-tradform-136-cm-nio-plan): Maxlast
- [Badrumsskåp i bambu – öppen hylla och skåp med lamelldörr, 33 × 36,5 × 67 cm](https://www.fyndplats.se/produkt/badrumsskap-bambu-oppen-hylla-67-cm): Maxlast
- [Badrumsspegel med hyllor, 60 × 48 cm – vit MDF, tre hyllplan](https://www.fyndplats.se/produkt/badrumsspegel-hyllor-60-cm-vit): Maxlast
- [Skohylla i svart metall med fyra hyllplan – blomdekor, 59,5 × 30 × 92 cm](https://www.fyndplats.se/produkt/skohylla-svart-metall-fyra-plan-blomdekor): Maxlast
- [Nattduksbord med dold låda – svart, öppet fack med mellanvägg, 40 × 30 × 46 cm](https://www.fyndplats.se/produkt/nattduksbord-dold-lada-svart): Maxlast
- [Sängbord med låda och öppet fack – hylla på ryggskivan, naturfärgad trälook](https://www.fyndplats.se/produkt/sangbord-lada-oppet-fack-hylla): Maxlast
- [Nattduksbord på hjul, tre hyllor – vitt med grå betonglook, 35 × 29,5 × 65,5 cm](https://www.fyndplats.se/produkt/nattduksbord-hjul-tre-hyllor-vit-gra): Maxlast
- [Modulgarderob i plast 111 × 183 cm – två hängfack och nio fack, svart och vit](https://www.fyndplats.se/produkt/modulgarderob-plast-111x183-cm): Maxlast
- [Kubhylla i svart metalltråd med sex kuber – trappform, 109 × 37 × 109 cm](https://www.fyndplats.se/produkt/kubhylla-metalltrad-sex-kuber-svart): Maxlast
- [Smal rullvagn med fem plan – 47 × 13 × 96,5 cm, nätkorgar och skiva i trälook](https://www.fyndplats.se/produkt/smal-rullvagn-fem-plan-13-cm): Maxlast
- [Mikrovågsugnshylla i svart metall – utdragbar 39,5–64 cm, tre krokar, bär 15 kg](https://www.fyndplats.se/produkt/mikrovagsugnshylla-utdragbar-svart-metall): Maxlast
- [Vinställ i svart metall för 16 flaskor – fyra stapelbara plan, bär 32 kg](https://www.fyndplats.se/produkt/vinstall-16-flaskor-svart-metall): Maxlast
- [Vinställ i bambu för 16 flaskor – fyra plan, bär 75 kg, 43 × 23,5 × 38 cm](https://www.fyndplats.se/produkt/vinstall-bambu-16-flaskor): Maxlast
- [Bokhylla för barn med fyra hyllor – vit med ribbor i furu, 60 × 10 × 98 cm](https://www.fyndplats.se/produkt/bokhylla-for-barn-fyra-hyllor-vit): Maxlast
- [Byrå för barnrummet i rosa och vitt – tre lådor, 60 cm hög, för barn 3–8 år](https://www.fyndplats.se/produkt/byra-barnrum-rosa-vit-tre-lador): Maxlast
- [Leksakshylla med sex tygboxar – grön, 63 × 30 × 66 cm, för barn 3–8 år](https://www.fyndplats.se/produkt/leksakshylla-sex-tygboxar-gron): Maxlast
- [Förvaringshurts för barn med tre lådor – blå, rundade kanter](https://www.fyndplats.se/produkt/forvaringshurts-barn-tre-lador-bla): Maxlast
- [Klädställning på hjul – justerbar höjd 95–170 cm och bredd 86–160 cm, bär 25 kg](https://www.fyndplats.se/produkt/kladstallning-hjul-justerbar-hojd-bredd): Maxlast
- [Byrå med 4 lådor, grifflös design, vit](https://www.fyndplats.se/produkt/byra-4-lador-grifflos-design-vit): Maxlast
- [Nattduksbord i vitt med två lådor – 48 × 39,5 × 51 cm, kullagrade skenor](https://www.fyndplats.se/produkt/nattduksbord-vitt-tva-lador): Maxlast
- [Byrå med 5 lådor, anti-tippgurt, vit](https://www.fyndplats.se/produkt/byra-5-lador-anti-tippgurt-vit): Maxlast
- [Smalt skoskåp för 12 par, klaffdörrar, ljusgrön](https://www.fyndplats.se/produkt/skoskap-smalt-12-par-klaffdorrar-ljusgron): Maxlast
- [Mediahylla 175 cm med 18 fack för cd, dvd och blu-ray](https://www.fyndplats.se/produkt/mediahylla-175-cm-18-fack): Maxlast
- [Byrå 70 cm med fem lådor – vit stomme och lådfronter i grå toner](https://www.fyndplats.se/produkt/byra-70-cm-fem-lador-gra-toner): Maxlast
- [Vedställ i svart stål, 60 × 100 cm – håller brasveden från golvet, bär 100 kg](https://www.fyndplats.se/produkt/vedstall-svart-stal-60-cm): Maxlast
- [Smalt vedställ i svart stål, 40 × 100 cm – för brasved inne och ute, bär 100 kg](https://www.fyndplats.se/produkt/vedstall-smalt-svart-stal-40-cm): Maxlast
- [Smal mediahylla i vitt med åtta fack – 360 cd-skivor, 58 × 24 × 126,3 cm](https://www.fyndplats.se/produkt/smal-mediahylla-vit-atta-fack): Maxlast
- [Smal cd- och dvd-hylla i vitt, 140 cm – rymmer 260 cd eller 120 dvd](https://www.fyndplats.se/produkt/cd-dvd-hylla-vit-140-cm): Maxlast
- [Klädställ i bambu med två krokar och skohylla – 116 × 43,5 × 160 cm](https://www.fyndplats.se/produkt/kladstall-bambu-krokar-skohylla): Maxlast
- [Vedställ 0,6 m³ med vattentätt överdrag – 200 cm långt, bär 200 kg](https://www.fyndplats.se/produkt/vedstall-overdrag-200-cm-svart): Maxlast
- [Vedställ 0,33 m³ med överdrag och bärväska – svart metall, 120 cm, bär 150 kg](https://www.fyndplats.se/produkt/vedstall-overdrag-barvaska): Maxlast
- [Vedställ i svart stål med fyra brasredskap – 75 cm, bär 100 kg](https://www.fyndplats.se/produkt/vedstall-svart-stal-brasredskap): Maxlast
- [Vinställ för väggen, sex flaskor – svart stålrör, 27 × 10 × 71 cm](https://www.fyndplats.se/produkt/vinstall-vagg-sex-flaskor-svart): Maxlast, Material
- [Smal skohylla i bambu med sex plan – hopfällbar, 30 × 29 × 108 cm](https://www.fyndplats.se/produkt/smal-skohylla-bambu-sex-plan): Maxlast
- [Vit bokhylla med åtta öppna fack – 74,3 × 24 × 80 cm, står upp eller ligger ned](https://www.fyndplats.se/produkt/vit-bokhylla-atta-fack): Maxlast
- [Vinställ för 30 flaskor – sex plan, rustik skiva och svart metallram, 88,5 cm](https://www.fyndplats.se/produkt/vinstall-30-flaskor-metall): Maxlast
- [Skobänk med förvaring 81 cm – stoppad sits och två hyllplan](https://www.fyndplats.se/produkt/skobank-med-forvaring-81-cm): Maxlast
- [Skoställ i bambu, fyra plan](https://www.fyndplats.se/produkt/skostall-bambu-fyra-plan): Maxlast
- [Hopfällbart sybord på hjul, 160 cm utfällt med 20 trådhållare](https://www.fyndplats.se/produkt/sybord-hopfallbart): Maxlast
- [Sideboard 120 cm med soft close, tre lådor och tippskydd](https://www.fyndplats.se/produkt/sideboard-120-cm-soft-close): Maxlast
- [Shoppingvagn som klättrar i trappor – vit låda på 51 liter, bär 80 kg](https://www.fyndplats.se/produkt/shoppingvagn-trappor-vit-lada-51-liter): Maxlast
- [Sensorsoptunna 55 liter i rostfritt stål](https://www.fyndplats.se/produkt/sensorsoptunna-55-liter-rostfri): Maxlast
- [Sensorsoptunna 50 liter i svart metall](https://www.fyndplats.se/produkt/sensorsoptunna-50-liter-svart-metall): Maxlast
- [Torkställ på hjul med fem nivåer – sidovingar och skohylla](https://www.fyndplats.se/produkt/torkstall-hjul-fem-nivaer-skohylla): Maxlast, Djup, Höjd, Bredd, Material
- [Torkställ 192 cm med vingar i fyra höjder – färdigmonterat](https://www.fyndplats.se/produkt/torkstall-192-cm-vingar-fyra-hojder): Maxlast, Djup, Höjd, Bredd, Material
- [Tvättsorterare i bambu – tvättpåse och förvaring i tre fack, 70 × 36 × 70 cm](https://www.fyndplats.se/produkt/tvattsorterare-bambu-tvattpase-tre-fack): Maxlast
- [Tvätthylla i bambu med två tygkorgar – två hyllplan, 44 × 34 × 96 cm](https://www.fyndplats.se/produkt/tvatthylla-bambu-tva-tygkorgar): Maxlast
- [Torkvagn grå med fyra nivåer – 60 kg och sex hjul](https://www.fyndplats.se/produkt/torkvagn-gra-fyra-nivaer): Maxlast, Djup, Höjd, Bredd, Material
- [Torkvagn blå med fyra nivåer – 60 kg och sex hjul](https://www.fyndplats.se/produkt/torkvagn-bla-fyra-nivaer): Maxlast, Djup, Höjd, Bredd, Material
- [Torkvagn svart med fyra nivåer – 60 kg och sex hjul](https://www.fyndplats.se/produkt/torkvagn-svart-fyra-nivaer): Maxlast, Djup, Höjd, Bredd, Material
- [Tvättkorg i bambu med lock och uttagbar tvättpåse – luftiga ribbor, 60 cm hög](https://www.fyndplats.se/produkt/tvattkorg-bambu-lock-uttagbar-pase): Maxlast
- [Förvaringskorgar med lock, tre storlekar – grå flätad plast, 18, 12 och 7 liter](https://www.fyndplats.se/produkt/forvaringskorgar-lock-tre-storlekar-gra): Maxlast
- [Uppvärmt torkställ 230 W – 45 till 55 grader, hopfällbart](https://www.fyndplats.se/produkt/uppvarmt-torkstall-230-w): Maxlast, Djup, Höjd, Bredd, Material
- [Tvättkorg i bambu med tre avtagbara tygkorgar i grått – hylla med ribbor ovanpå](https://www.fyndplats.se/produkt/tvattkorg-bambu-tre-tygkorgar): Maxlast
- [Stapelbara skolådor 18-pack – magnetlucka och ventilationshål](https://www.fyndplats.se/produkt/stapelbara-skolador-18-pack): Maxlast, Djup, Höjd, Bredd
- [Torktorn med åtta nivåer – 35 cm djupt och väger 4,3 kg](https://www.fyndplats.se/produkt/torktorn-atta-nivaer-35-cm-djupt): Maxlast, Djup, Höjd, Bredd, Material
- [Vingtorkställ i rostfritt – 8 cm tjockt hopfällt](https://www.fyndplats.se/produkt/vingtorkstall-rostfritt-8-cm-hopfallt): Maxlast, Djup, Höjd, Bredd, Material
- [Vedbod 235 cm med stängt redskapsfack – ved och verktyg i ett](https://www.fyndplats.se/produkt/vedbod-235-cm-redskapsfack): Maxlast, Djup, Höjd, Bredd, Material
- [Garagetält 190 × 230 cm med 220 cm i nock – gå in stående](https://www.fyndplats.se/produkt/garagetalt-190x230-cm-220-cm-hogt): Maxlast, Djup, Höjd
- [Garagetält 162 × 221,5 cm i ljusgrått – sadeltak och 10 kg/m² snölast](https://www.fyndplats.se/produkt/garagetalt-162x222-cm-ljusgra): Maxlast, Djup, Höjd
- [Garagetält 162 × 221,5 cm i mörkgrått – sadeltak och 10 kg/m² snölast](https://www.fyndplats.se/produkt/garagetalt-162x222-cm-morkgra): Maxlast, Djup, Höjd
- [Cykelgarage 245 cm brett med bågformat tak – 200 g/m² duk i ett stycke](https://www.fyndplats.se/produkt/cykelgarage-245-cm-brett-bagformat-tak): Maxlast, Djup, Höjd, Bredd
- [Garagetält 300 × 300 cm med 9 m² golvyta – förstärkt stomme och tålig duk](https://www.fyndplats.se/produkt/garagetalt-300x300-cm-9-kvm): Maxlast, Djup, Höjd
- [Plastbod med enkeldörr 182 cm – 2,89 m², pulpettak och tre fönster](https://www.fyndplats.se/produkt/plastbod-enkeldorr-182-cm): Maxlast, Djup, Höjd, Bredd, Material
- [Plastbod med dubbeldörr 182 cm – 2,89 m², pulpettak och tre fönster](https://www.fyndplats.se/produkt/plastbod-dubbeldorr-182-cm): Maxlast, Djup, Höjd, Bredd, Material
- [Redskapsbod i metall 3,5 m² med gåhöjd](https://www.fyndplats.se/produkt/redskapsbod-metall-3-5-m2-gahojd): Maxlast
- [Vedbod 213 cm i grön – 1,12 m² golvyta och lutande tak](https://www.fyndplats.se/produkt/vedbod-213-cm-gron): Maxlast, Djup, Höjd, Bredd, Material
- [Vedbod 213 cm i mörkgrå – 1,12 m² golvyta och lutande tak](https://www.fyndplats.se/produkt/vedbod-213-cm-morkgra): Maxlast, Djup, Höjd, Bredd, Material
- [Vedbod 150 cm i mörkgrå – 0,77 m² golvyta och lutande tak](https://www.fyndplats.se/produkt/vedbod-150-cm-galvat-stal): Maxlast, Djup, Höjd, Bredd, Material
- [Förrådstält 300 × 447 cm med 13,4 m² – nätfönster och 200 cm takfot](https://www.fyndplats.se/produkt/forradstalt-300x447-cm-13-kvm): Maxlast, Djup, Höjd
- [Plastbod med sadeltak 181 cm – 2,91 m² golvyta och låsbar dubbeldörr](https://www.fyndplats.se/produkt/plastbod-sadeltak-181-cm): Maxlast, Djup, Höjd, Bredd, Material
- [Plastbod 182 × 151 cm – 2,4 m² med sadeltak och 178 cm dörrhöjd](https://www.fyndplats.se/produkt/plastbod-182x151-cm-sadeltak): Maxlast, Djup, Höjd, Material
- [Plastskjul 2,38 × 1,25 m – golv ingår, låsbara dörrar och fönster](https://www.fyndplats.se/produkt/plastskjul-238-x-125-m-golv-ingar): Maxlast, Djup, Höjd, Material
- [Garagetält 120 × 179 cm i ljusgrått – sadeltak och 15 spännlinor](https://www.fyndplats.se/produkt/garagetalt-120x179-cm-ljusgra): Maxlast, Djup, Höjd
- [Garagetält 120 × 179 cm i mörkgrått – sadeltak och 15 spännlinor](https://www.fyndplats.se/produkt/garagetalt-120x179-cm-morkgra): Maxlast, Djup, Höjd
- [Trädgårdsskåp 79 cm med arbetsbänk i galvad plåt](https://www.fyndplats.se/produkt/tradgardsskap-79-cm-arbetsbank-galvad-plat): Maxlast
- [Trädgårdsskåp 83 cm med planteringsbord i galvad plåt](https://www.fyndplats.se/produkt/tradgardsskap-83-cm-planteringsbord): Maxlast
- [Redskapsbod i metall 2,81 m² med skjutdörr, vit](https://www.fyndplats.se/produkt/redskapsbod-metall-2-81-m2-skjutdorr-vit): Maxlast
- [Redskapsbod i metall 2,81 m² med skjutdörr, mörkgrå](https://www.fyndplats.se/produkt/redskapsbod-metall-2-81-m2-skjutdorr-morkgra): Maxlast
- [Plåtbod grön 345 × 280 cm – 8,9 m² med dubbla skjutdörrar](https://www.fyndplats.se/produkt/platbod-gron-345x280-cm): Maxlast, Djup, Höjd, Material
- [Plåtbod grå 345 × 280 cm – 8,9 m² med dubbla skjutdörrar](https://www.fyndplats.se/produkt/platbod-gra-345x280-cm): Maxlast, Djup, Höjd, Material
- [Kärlskåp för två sopkärl i galvaniserat stål – låsbar dubbeldörr, 179,5 cm](https://www.fyndplats.se/produkt/karlskap-tva-sopkarl-galvaniserat-stal): Maxlast
- [Redskapsbod ljusgrå 240 cm med sadeltak – 4,1 m² och 2,28 m i nock](https://www.fyndplats.se/produkt/redskapsbod-ljusgra-240-cm-sadeltak): Maxlast, Djup, Höjd, Bredd, Material
- [Redskapsbod mörkgrå 240 cm med sadeltak – 4,1 m² och 2,28 m i nock](https://www.fyndplats.se/produkt/redskapsbod-morkgra-240-cm-sadeltak): Maxlast, Djup, Höjd, Bredd, Material
- [Redskapsbod i plast 1,1 m² med golv](https://www.fyndplats.se/produkt/redskapsbod-plast-1-1-m2-med-golv): Maxlast
- [Redskapsbod i plast 1,1 m² utan golv](https://www.fyndplats.se/produkt/redskapsbod-plast-1-1-m2-utan-golv): Maxlast
- [Redskapsskåp 179 cm i ljusblått med sadeltak och tre hyllor](https://www.fyndplats.se/produkt/redskapsskap-179-cm-ljusblatt-sadeltak): Maxlast, Material
- [Redskapsbod trälook 385 cm – 12,4 m² i galvad plåt med skjutdörrar](https://www.fyndplats.se/produkt/redskapsbod-tralook-385-cm): Maxlast, Djup, Höjd, Bredd, Material
- [Redskapsbod ljusgrå 385 cm – 12,4 m² i galvad plåt med skjutdörrar](https://www.fyndplats.se/produkt/redskapsbod-ljusgra-385-cm): Maxlast, Djup, Höjd, Bredd, Material
- [Redskapsbod mörkgrön 385 cm – 12,4 m² i galvad plåt med skjutdörrar](https://www.fyndplats.se/produkt/redskapsbod-morkgron-385-cm): Maxlast, Djup, Höjd, Bredd, Material
- [Redskapsbod brun 385 cm – 12,4 m² i galvad plåt med skjutdörrar](https://www.fyndplats.se/produkt/redskapsbod-brun-385-cm): Maxlast, Djup, Höjd, Bredd, Material
- [Redskapsbod antracit 385 cm – 12,4 m² i galvad plåt med skjutdörrar](https://www.fyndplats.se/produkt/redskapsbod-antracit-385-cm): Maxlast, Djup, Höjd, Bredd, Material
- [Bred byrå 100 cm med 6 lådor – räfflade fronter och ben](https://www.fyndplats.se/produkt/bred-byra-100-cm-6-lador): Maxlast
- [Byrå med 3 lådor 60 cm – 52,8 cm breda lådor, vit](https://www.fyndplats.se/produkt/byra-med-3-lador-60-cm): Maxlast
- [Smal byrå 40 cm med 5 lådor – 85 cm hög, vit](https://www.fyndplats.se/produkt/smal-byra-40-cm-5-lador): Maxlast
- [Vägghylla i svart metall med nio fack – 87,5 × 100 cm, bär 30 kg](https://www.fyndplats.se/produkt/vagghylla-svart-metall-nio-fack): Maxlast
- [Byrå med skåp 100 cm – fyra lådor och justerbar hylla, högglans](https://www.fyndplats.se/produkt/byra-med-skap-100-cm): Maxlast
- [Sidobord med laddstation – eluttag, USB och USB-C, två tyglådor, 63 cm högt](https://www.fyndplats.se/produkt/sidobord-laddstation-tva-tyglador): Maxlast
- [TV-bänk 180 cm väggmonterad – tre nedfällbara luckor, vit](https://www.fyndplats.se/produkt/tv-bank-180-cm-vaggmonterad-tre-luckor): Maxlast
- [TV-bänk 140 cm med skåp och öppet fack – vit, för tv upp till 60 tum](https://www.fyndplats.se/produkt/tv-bank-140-cm-skap-oppet-fack): Maxlast
- [Smalt sidobord med tre plan – 43 × 18 × 62,5 cm, svart metall och brun trälook](https://www.fyndplats.se/produkt/sidobord-smalt-tre-plan-metall): Maxlast
- [Sidobord med skåp och öppet fack – rustikt brunt med svart stålram, 80 cm](https://www.fyndplats.se/produkt/sidobord-skap-oppet-fack-rustik-brun): Maxlast
- [Sideboard 100 cm i lantstil – vit, skiva i träton, låda och kryddhylla i dörren](https://www.fyndplats.se/produkt/sideboard-lantstil-100-cm-kryddhylla): Maxlast
- [Snurrbar pall i grå sammet med förvaring – höj- och sänkbar 49–65 cm, bär 120 kg](https://www.fyndplats.se/produkt/snurrbar-pall-gra-sammet-forvaring): Maxlast
- [Smalt köksskåp 40 cm – 180 cm högt med fem plan och soft close](https://www.fyndplats.se/produkt/smalt-koksskap-40-cm): Maxlast
- [Köksskåp med glasdörrar 172 cm – sex öppna hyllor och soft close](https://www.fyndplats.se/produkt/koksskap-med-glasdorrar-172-cm): Maxlast
- [Sidobord i svart stål med hylla – industristil, 40 × 40 × 45 cm](https://www.fyndplats.se/produkt/sidobord-svart-stal-hylla-40-cm): Maxlast
- [TV-bänk 120 cm med två skjutdörrar – rustik brun, för tv upp till 60 tum](https://www.fyndplats.se/produkt/tv-bank-120-cm-skjutdorrar-rustik): Maxlast
- [Tv-bänk med två tyglådor och öppen hylla – för tv upp till 47 tum, 98 cm](https://www.fyndplats.se/produkt/tv-bank-tva-tyglador-oppen-hylla): Maxlast
- [Rund pall med förvaring i gräddvit sherpa – 38 cm, bär 120 kg](https://www.fyndplats.se/produkt/rund-pall-forvaring-sherpa-38-cm): Maxlast
- [Förvaringspall i vit sherpa – 33 l och vändbart lock, Ø36,5 cm](https://www.fyndplats.se/produkt/forvaringspall-sherpa-vandbart-lock): Maxlast
- [Rund förvaringspall i beige tyg med juteyta – 19 l och lock som blir bord](https://www.fyndplats.se/produkt/rund-forvaringspall-juteyta-bordslock): Maxlast
- [Puff med förvaring i vit manchester – vändbart lock som bord, Ø35 cm](https://www.fyndplats.se/produkt/puff-med-forvaring-vit-manchester): Maxlast
- [Bambuhylla med sex hyllplan – 60 × 26 × 161 cm, hyllplan i elva lägen](https://www.fyndplats.se/produkt/bambuhylla-sex-hyllplan-161-cm): Maxlast
- [Två sittpallar i gräddvit plisserad sammet – förvaring i den stora, bär 120 kg](https://www.fyndplats.se/produkt/sittpallar-plisserad-sammet-2-pack): Maxlast
- [Greppfritt skoskåp 120 cm – tryck för att öppna, fem ben](https://www.fyndplats.se/produkt/greppfritt-skoskap-120-cm): Maxlast
- [Sittpuff i svart sammet med förvaring – Ø42 cm, guldfärgad stålram, bär 120 kg](https://www.fyndplats.se/produkt/sittpuff-svart-sammet-forvaring-guld): Maxlast
- [Sideboard 120 cm i vitt med träskiva – låda, skåp och öppna fack](https://www.fyndplats.se/produkt/sideboard-120-cm-vit-med-traskiva): Maxlast
- [Förvaringspuff i beige manchester, Ø60 cm – 97 liter under locket, bär 120 kg](https://www.fyndplats.se/produkt/forvaringspuff-beige-manchester-60-cm): Maxlast
- [Förvaringspall i plisserad sammet – gräddvit med guldben, Ø40 cm](https://www.fyndplats.se/produkt/forvaringspall-plisserad-sammet-guldben): Maxlast
- [Sittbänk med förvaring i beige sammetslook – guldfärgade ben, bär 120 kg](https://www.fyndplats.se/produkt/sittbank-forvaring-beige-sammet-guldben): Maxlast
- [Sängbänk 126 cm med förvaring, grå](https://www.fyndplats.se/produkt/sangbank-126-cm-forvaring-gra): Maxlast
- [Sängbänk 126 cm med förvaring, grön](https://www.fyndplats.se/produkt/sangbank-126-cm-forvaring-gron): Maxlast
- [Sängbänk 126 cm med förvaring, beige](https://www.fyndplats.se/produkt/sangbank-126-cm-forvaring-beige): Maxlast
- [Sideboard 105 cm med fyra lådor och skåp – vit med svarta handtag](https://www.fyndplats.se/produkt/sideboard-105-cm-fyra-lador-vit): Maxlast
- [Bambuhylla med fyra plan – för badrum, kök eller vardagsrum, 112 cm](https://www.fyndplats.se/produkt/bambuhylla-fyra-plan-badrum): Maxlast
- [Bokhylla med metallram och fem plan – industristil i rustikt brunt, 157,5 cm hög](https://www.fyndplats.se/produkt/bokhylla-metallram-fem-plan): Maxlast
- [Sittbänk med förvaring, sammet, grön](https://www.fyndplats.se/produkt/sittbank-forvaring-sammet-gron): Maxlast
- [Paraplyställ i svart metall – åtta paraplyer, fyra krokar och droppskål](https://www.fyndplats.se/produkt/paraplystall-svart-metall-droppskal): Maxlast
- [Smalt konsolbord i metall 55 cm, tre plan](https://www.fyndplats.se/produkt/smalt-konsolbord-metall-55-cm-tre-plan): Maxlast, Djup, Höjd, Bredd
- [Väggskåp för badrummet i vitt och trä – mjukstängande dörr och öppet fack, 67 cm](https://www.fyndplats.se/produkt/vaggskap-badrum-vitt-oppet-fack): Maxlast
- [Skoskåp för 20 par – fem plan, ett på 24,5 cm för kängor](https://www.fyndplats.se/produkt/skoskap-for-20-par-5-plan): Maxlast
- [Skoskåp 70 cm i sju nivåer – vitt, för upp till 21 par skor](https://www.fyndplats.se/produkt/skoskap-70-cm-sju-nivaer-21-par-skor): Maxlast
- [Skoskåp för 12 par, med öppna hyllor, vit](https://www.fyndplats.se/produkt/skoskap-12-par-oppna-hyllor-vit): Maxlast
- [Skoskåp med öppna fack 83 cm – stenmönstrat grått, 12 par](https://www.fyndplats.se/produkt/skoskap-med-oppna-fack-83-cm): Maxlast
- [Skoställ i grått och svart med låda – tre hyllor för upp till nio par skor](https://www.fyndplats.se/produkt/skostall-gra-lada-tre-hyllor): Maxlast
- [Skohylla 101 cm med avlastningsyta – bambu, 18 par och låda](https://www.fyndplats.se/produkt/skohylla-101-cm-med-lada): Maxlast
- [Smalt skoskåp 26 cm djupt – 120 cm högt med tre klaffar](https://www.fyndplats.se/produkt/smalt-skoskap-26-cm-djupt): Maxlast
- [Paraplyställ med droppskål – 21 fack och 24 krokar, svart stål](https://www.fyndplats.se/produkt/paraplystall-droppskal-24-krokar-svart): Maxlast
- [Skohylla i bambu 4 plan – 15,5 cm fritt per plan, 12 par](https://www.fyndplats.se/produkt/skohylla-i-bambu-4-plan): Maxlast
- [Klädställ med paraplyställ 174,5 cm – tolv krokar på tre höjder](https://www.fyndplats.se/produkt/kladstall-med-paraplystall): Maxlast
- [Skivställ 144 cm med tre tygfickor och bordsskiva för skivspelaren](https://www.fyndplats.se/produkt/skivstall-144-cm-tre-tygfickor): Maxlast
- [Högskåp 180 cm med tre hyllor och tre lådor – vitt](https://www.fyndplats.se/produkt/hogskap-180-cm-tre-hyllor-tre-lador): Maxlast
- [Köksskåp 170 cm i lantstil – vitt, med öppen mellanhylla](https://www.fyndplats.se/produkt/koksskap-170-cm-lantstil-vitt): Maxlast
- [Smalt badrumsskåp i vitt och trä – öppen hylla och mjukstängande dörr, 71,5 cm](https://www.fyndplats.se/produkt/smalt-badrumsskap-vitt-oppen-hylla): Maxlast
- [Smalt badrumsskåp i bambu – 30 × 30 × 80 cm, öppet fack och lamelldörr](https://www.fyndplats.se/produkt/badrumsskap-bambu-lamelldorr): Maxlast
- [Toaletthylla i bambu med tre hyllplan – 68 × 20 × 165 cm, bär 15 kg](https://www.fyndplats.se/produkt/toaletthylla-bambu-tre-hyllplan): Maxlast
- [Spegelskåp för badrummet i grått – två skåp, öppen hylla och dämpade gångjärn](https://www.fyndplats.se/produkt/spegelskap-badrum-gra-oppen-hylla): Maxlast
- [Köksbuffé 168 cm med tre lådor, tre skåp och avlastningsyta](https://www.fyndplats.se/produkt/koksbuffe-168-cm-lador): Maxlast
- [Nattduksbord 2-pack med tre lådor – greppfri front i vitt](https://www.fyndplats.se/produkt/nattduksbord-2-pack-tre-lador-greppfri): Maxlast
- [Byrå med 9 lådor i tyg, guldfärgade handtag, cremevit](https://www.fyndplats.se/produkt/byra-9-lador-tyg-guldhandtag-cremevit): Maxlast
- [Smal byrå 95 cm hög med 5 lådor – 29 cm djup, vit](https://www.fyndplats.se/produkt/smal-byra-95-cm-5-lador): Maxlast
- [Byrå med 4 lådor 47 cm – bara 29 cm djup, vit](https://www.fyndplats.se/produkt/byra-med-4-lador-47-cm): Maxlast
- [Sängbänk med förvaring, tjock stoppning, guldfärgade ben](https://www.fyndplats.se/produkt/sangbank-forvaring-tjock-stoppning-guldben): Maxlast
- [Förvaringsbänk 116 cm med två separata lock](https://www.fyndplats.se/produkt/forvaringsbank-116-cm-tva-lock): Maxlast
- [Byrå 100 cm hög med 5 lådor – greppfria fronter, vit](https://www.fyndplats.se/produkt/byra-100-cm-hog-5-lador): Maxlast
- [Byrå med mönstrade lådor 46 cm – 97,5 cm hög, fem toner](https://www.fyndplats.se/produkt/byra-med-monstrade-lador-46-cm): Maxlast
- [Vägghylla med fem kuber i vitlackat granträ – liggande eller stående, 86 cm](https://www.fyndplats.se/produkt/vagghylla-fem-kuber-vitt-tra): Maxlast, Material
- [Vinhylla med glashållare och låda – 12 flaskor och 9 glas, 148 cm hög](https://www.fyndplats.se/produkt/vinhylla-glashallare-lada-12-flaskor): Maxlast
- [Leksaksförvaring för barn med 6 lådor och bokhylla, vit](https://www.fyndplats.se/produkt/leksaksforvaring-barn-6-lador-bokhylla-vit): Maxlast
- [Förvaringsmöbel för barn med 9 lådor – 113 cm i tre blå nyanser](https://www.fyndplats.se/produkt/forvaringsmobel-barn-9-lador-113-cm): Maxlast
- [Torkvagn vit med fyra nivåer – 60 kg och sex hjul](https://www.fyndplats.se/produkt/torkvagn-vit-fyra-nivaer): Maxlast, Djup, Höjd, Bredd, Material
- [Torkvagn vit med tre nivåer – sex hjul och sockklämmor](https://www.fyndplats.se/produkt/torkvagn-vit-tre-nivaer): Maxlast, Djup, Höjd, Bredd, Material
- [Smal hurts 40 cm med fem lådor – vit med ljus träton, på hjul](https://www.fyndplats.se/produkt/smal-hurts-40-cm): Maxlast
- [Väggställ för elverktyg – 2 hyllplan, 5 fack och 4 krokar](https://www.fyndplats.se/produkt/vaggstall-for-elverktyg): Maxlast
- [Soptunneskydd för två kärl – 2 × 120 L eller 240 + 120 L](https://www.fyndplats.se/produkt/soptunneskydd-for-tva-karl-150x80-cm): Maxlast
- [Trädgårdsskåp i trä 179 cm – två fack, fyra hyllor och plåttak](https://www.fyndplats.se/produkt/tradgardsskap-tra-179-cm-tva-fack): Maxlast
- [Plåtbod 236 × 171 cm – 3,6 m² med dubbla skjutdörrar, mörkgrå](https://www.fyndplats.se/produkt/platbod-236x171-cm-skjutdorrar-morkgra): Maxlast
- [Cykeltält i silverbelagd Oxford – tre storlekar](https://www.fyndplats.se/produkt/cykeltalt-silverbelagd-oxford): Maxlast
- [Smal rullvagn i bambu, tre plan med räcke](https://www.fyndplats.se/produkt/rullvagn-bambu-tre-plan-med-racke): Maxlast
- [Samlarvitrin i akryl – 1, 2 eller 3 fack, vitt](https://www.fyndplats.se/produkt/samlarvitrin-akryl-1-2-3-fack): Maxlast, Material
- [Redskapsskåp för trädgården 115 cm – granträ med asfalttak och hyllor](https://www.fyndplats.se/produkt/redskapsskap-grantra-115-cm): Maxlast, Material
- [Förvaringsbänk 100 cm med säkerhetsgångjärn – vit med ekfärgat lock](https://www.fyndplats.se/produkt/forvaringsbank-100-cm-vit-ek): Maxlast
- [Hyllstege med 6 kuber – vit trappform 91,5 cm](https://www.fyndplats.se/produkt/hyllstege-6-kuber-vit): Maxlast
- [Plåtbod 277 × 195 cm – 4,8 m² invändigt, skjutdörrar, brun](https://www.fyndplats.se/produkt/platbod-277x195-cm-4-8-kvm-skjutdorrar-brun): Maxlast
- [Plåtbod 277 × 195 cm – 4,8 m² med glasfibertak, ljusgrå](https://www.fyndplats.se/produkt/platbod-277x195-cm-glasfibertak-ljusgra): Maxlast
- [Plåtbod 240 × 206 cm – snölast 30 kg/m², lås och 9 stödpelare](https://www.fyndplats.se/produkt/platbod-240x206-cm-snolast-30-kg-las-9-stodpelare): Maxlast
- [Plåtbod 213 × 130 cm – smal bod 2,4 m² med takfönster](https://www.fyndplats.se/produkt/platbod-213x130-cm-smal-takfonster): Maxlast
- [Klädhängare i furu 165 cm – åtta krokar, trebent fot](https://www.fyndplats.se/produkt/kladhangare-furu-165-cm-atta-krokar): Maxlast
- [Entréset 90 cm – väggpanel med spegel och krokar plus skoskåp](https://www.fyndplats.se/produkt/entreset-90-cm-spegel-krokar-skoskap): Maxlast
- [Vitrinskåp 139 cm med 4 fack – uppfällbara dörrar i akryl, vitt](https://www.fyndplats.se/produkt/vitrinskap-139-cm-4-fack): Maxlast
- [TV-bänk med vägghylla 153,6 cm – vit och ek, öppna fack och skåp](https://www.fyndplats.se/produkt/tv-bank-med-vagghylla-153-cm): Maxlast
- [Tvättkorg bambu 72 L med lock, avtagbar tvättpåse och handtag](https://www.fyndplats.se/produkt/tvattkorg-bambu-72-liter-med-lock): Maxlast, Djup, Höjd, Bredd
- [Smyckeskrin med spegel – 4 plan, 2 lådor och 8 krokar, vitt](https://www.fyndplats.se/produkt/smyckeskrin-med-spegel-vitt-4-plan-2-lador): Maxlast
- [Mediahylla för DVD, CD & böcker – torn, skåp & bredhylla i flera färger](https://www.fyndplats.se/produkt/mediahylla-dvd-cd-bocker): Maxlast, Djup, Höjd
- [Sortimentskåp för vägg – smådelsförvaring med 18, 40 eller 60 lådor](https://www.fyndplats.se/produkt/sortimentskap-vagg): Maxlast, Djup, Höjd, Bredd
- [Förvaringsbehållare för torrvaror 2×15 L – lufttät med hjul & måttkopp](https://www.fyndplats.se/produkt/forvaringsbehallare-torrvaror-2x15l): Maxlast, Djup, Höjd, Bredd
- [Stapelbar varukorg 21 L med handtag – 4-, 12- eller 20-pack](https://www.fyndplats.se/produkt/stapelbar-varukorg-21l-handtag): Maxlast
- [Utdragbar sopsorterare 30 L för kök med 2 fack under diskbänk](https://www.fyndplats.se/produkt/utdragbar-sopsorterare): Maxlast
- [Klocklåda för 24 klockor – 2 plan med glaslock, rustik brun](https://www.fyndplats.se/produkt/klocklada-24-klockor): Maxlast
- [Väggmonterade förvaringslådor – 12 stapelbara sorteringslådor, 3 metallskenor](https://www.fyndplats.se/produkt/vaggmonterade-forvaringslador-12-st): Maxlast, Djup, Höjd, Bredd
- [Svävande vägghyllor 80 cm, 2-pack – vit bakkant och hyllplan i naturträfärg](https://www.fyndplats.se/produkt/svavande-vagghyllor-80-cm-vit-natur): Djup, Höjd, Bredd
- [TV-bänk 160 cm med RGB-LED och glashylla](https://www.fyndplats.se/produkt/tv-bank-160-cm-rgb-led-glashylla): Djup, Höjd, Bredd
- [TV-bänk 140 cm med metallben och eklucka](https://www.fyndplats.se/produkt/tv-bank-140-cm-metallben-eklucka): Djup, Höjd, Bredd
- [TV-bänk i ek med glashylla, 140 cm](https://www.fyndplats.se/produkt/tv-bank-ek-glashylla-140-cm): Djup, Höjd, Bredd
- [Sidobord 2-pack i trådkorg, 40 och 35 cm](https://www.fyndplats.se/produkt/sidobord-2-pack-tradkorg-40-35-cm): Djup, Höjd, Bredd
- [Skoskåp med spegeldörrar 50 × 180 cm](https://www.fyndplats.se/produkt/skoskap-spegeldorrar-50x180): Djup, Höjd
- [Skobänk 140 cm i massivträ med dyna](https://www.fyndplats.se/produkt/skobank-140-cm-massivtra-dyna): Djup, Höjd, Bredd
- [Konsolbord 110 cm med två lådor](https://www.fyndplats.se/produkt/konsolbord-110-cm-med-tva-lador): Djup, Höjd, Bredd
- [Skoskåp 106 cm för 30 par, vit högglans](https://www.fyndplats.se/produkt/skoskap-106-cm-30-par-vit-hogglans): Djup, Höjd, Bredd
- [Skoställ med sittbänk 86 cm](https://www.fyndplats.se/produkt/skostall-med-sittbank-86-cm): Djup, Höjd, Bredd
- [Skoskåp 98 cm med fyra tippfack, rustik brun](https://www.fyndplats.se/produkt/skoskap-98-cm-fyra-tippfack-rustik): Djup, Höjd, Bredd
- [Konsolbord 101 cm med tre hyllplan](https://www.fyndplats.se/produkt/konsolbord-101-cm-tre-hyllplan): Djup, Höjd, Bredd
- [Smalt skoskåp 47 cm med tre tippfack](https://www.fyndplats.se/produkt/smalt-skoskap-47-cm-tre-tippfack): Djup, Höjd, Bredd
- [Konsolbord i stål 90 cm, två plan](https://www.fyndplats.se/produkt/konsolbord-i-stal-90-cm-tva-plan): Djup, Höjd, Bredd
- [Konsolbord 100 cm i marmorlook](https://www.fyndplats.se/produkt/konsolbord-100-cm-marmorlook): Djup, Höjd, Bredd
- [Konsolbord med låda 80 cm, rustik brun](https://www.fyndplats.se/produkt/konsolbord-med-lada-80-cm-rustik-brun): Djup, Höjd, Bredd
- [Konsolbord med låda 80 cm, naturträ](https://www.fyndplats.se/produkt/konsolbord-med-lada-80-cm-naturtra): Djup, Höjd, Bredd
- [TV-bänk på hjul 80 cm, vit](https://www.fyndplats.se/produkt/tv-bank-pa-hjul-80-cm-vit): Djup, Höjd, Bredd
- [TV-bänk på hjul 80 cm, svart](https://www.fyndplats.se/produkt/tv-bank-pa-hjul-80-cm-svart): Djup, Höjd, Bredd
- [Väggmonterad torkställning – fälls ihop platt, 126 cm torklängd](https://www.fyndplats.se/produkt/vaggmonterad-torkstallning-hopfallbar-126-cm): Djup, Höjd, Bredd
- [Barnskrivbord med stol – höj- och sänkbart, skiva som lutar 0–40°](https://www.fyndplats.se/produkt/barnskrivbord-med-stol-hojdbart): Djup, Höjd, Bredd
- [Sängram i metall 160 × 200 cm – lamellbotten och 26 cm förvaringshöjd](https://www.fyndplats.se/produkt/sangram-metall-160x200-lamellbotten): Djup
- [Sängbas med RGB-belysning – svävande design, 140 × 190 eller 160 × 200 cm](https://www.fyndplats.se/produkt/sangbas-rgb-belysning-svavande): Djup, Höjd
- [Stoppad sängram 135 × 190 cm i vitt bouclé – justerbar gavel, bär 300 kg](https://www.fyndplats.se/produkt/stoppad-sangram-135x190-boucle): Djup, Höjd
- [Barbord med två pallar 105 cm – kompakt set med fotstöd](https://www.fyndplats.se/produkt/barbord-tva-pallar-105-cm): Djup, Höjd, Bredd
- [Garagehylla i stål – justerbar förvaringshylla, 4–5 hyllplan](https://www.fyndplats.se/produkt/garagehylla-stal-justerbar): Djup, Höjd, Bredd, Material
- [Gallervägg och nätställ för exponering – dubbelsidigt, 2-pack](https://www.fyndplats.se/produkt/gallervagg-natstall-exponering-2-pack): Djup, Höjd, Bredd, Material
- [Tvättkorg i vide 57 cm med lock och uttagbar innerpåse](https://www.fyndplats.se/produkt/tvattkorg-vide-57-cm-uttagbar-pase): Material
- [Trädgårdsförråd 147 cm med sex hyllor och fyra akrylfönster](https://www.fyndplats.se/produkt/tradgardsforrad-147-cm-sex-hyllor): Material
- [Redskapsbod i gran 0,5 m² med två fönster](https://www.fyndplats.se/produkt/redskapsbod-gran-0-5-m2-tva-fonster): Material
- [Redskapsskåp 110 cm med två fack och asfalttak](https://www.fyndplats.se/produkt/redskapsskap-110-cm-tva-fack-asfalttak): Material
- [Trädgårdsskåp 74 cm med uppfällbart lock och två fack](https://www.fyndplats.se/produkt/tradgardsskap-74-cm-uppfallbart-lock): Material
- [Smala sängbord 2-pack – 25 cm breda, lucka utan handtag](https://www.fyndplats.se/produkt/smala-sangbord-2-pack-25-cm): Material
- [Sängbord med laddstation 2-pack – 2 eluttag, USB-A och USB-C](https://www.fyndplats.se/produkt/sangbord-med-laddstation-2-pack): Material
- [CD-hylla 2-pack – två torn 88,5 cm, 204 skivor](https://www.fyndplats.se/produkt/cd-hylla-2-pack-88-cm-204-skivor): Material
- [Sängbord i naturträ 45 × 35 cm – låda, öppet fack och överhyllor](https://www.fyndplats.se/produkt/sangbord-naturtra-lada-hyllor): Material
- [Förvaringsskåp 60 cm svart – två dörrar och justerbar hylla](https://www.fyndplats.se/produkt/forvaringsskap-60-cm-svart): Material
- [Skoskåp med 4 speglade luckor – 17 cm djupt, 12 par](https://www.fyndplats.se/produkt/skoskap-4-speglade-luckor-17-cm): Material
- [Skoskåp med 3 speglade luckor – 17 cm djupt, 9 par](https://www.fyndplats.se/produkt/skoskap-3-speglade-luckor-17-cm): Material
- [Svävande nattduksbord 2-pack 40 × 25 cm – rottinglåda och öppen hylla](https://www.fyndplats.se/produkt/svavande-nattduksbord-2-pack-40x25-cm-rotting): Material
- [Smalt badrumsskåp 20 cm – högskåp 180 cm med låda, 4 fack och 2 skåp](https://www.fyndplats.se/produkt/smalt-badrumsskap-20-cm-hogskap): Material

### leksaker-spel (323 produkter)

Filter: Ålder (79 %, syns), Material (90 %, syns)

- [Lekmatta 160 × 100 cm med stadsmotiv – vägar, rondeller och hus, halkskyddad](https://www.fyndplats.se/produkt/lekmatta-stadsmotiv-160x100): Ålder
- [Staffli för barn i trä – krittavla och whiteboard, höjd 70–97 cm](https://www.fyndplats.se/produkt/staffli-barn-tra-krittavla-whiteboard): Ålder
- [Balansstenar för barn, sex stycken – tre storlekar, halkskydd, stapelbara](https://www.fyndplats.se/produkt/balansstenar-barn-sex-stycken): Ålder
- [Fågelbogunga Ø110 cm – blå, två justerbara rep, bär 100 kg](https://www.fyndplats.se/produkt/fagelbogunga-110-cm-bla): Ålder
- [Elmotorcykel för barn med stödhjul, röd](https://www.fyndplats.se/produkt/elmotorcykel-barn-stodhjul-rod): Ålder
- [Leksaksbutik för barn med kassa och varuautomat, rosa och beige](https://www.fyndplats.se/produkt/leksaksbutik-barn-kassa-varuautomat-rosa): Ålder
- [Gåvagn 3-i-1 i trä med dubbelsidig aktivitetstavla – för barn från 1 år](https://www.fyndplats.se/produkt/gavagn-3-i-1-tra-aktivitetstavla): Ålder, Material
- [Barnstaffli 3-i-1 i rosa – krittavla, whiteboard, pappersrulle och två tygkorgar](https://www.fyndplats.se/produkt/barnstaffli-3-i-1-rosa-tygkorgar): Ålder
- [Gåvagn i trä med aktiviteter – formsortering, kulram och förvaring, från 1 år](https://www.fyndplats.se/produkt/gavagn-tra-aktiviteter-formsortering): Ålder, Material
- [Leksaksaffär i trä med kassa och skanner – 34 tillbehör, 92,5 cm hög, från 3 år](https://www.fyndplats.se/produkt/leksaksaffar-tra-kassa-skanner): Ålder
- [Bordtennisbord 274 × 152,5 cm, hopfällbart – inomhus, racketar och bollar ingår](https://www.fyndplats.se/produkt/bordtennisbord-274-x-152-cm-hopfallbart): Ålder
- [Fotbollsspel 121 cm med 22 spelare – två räkneverk och minibollar](https://www.fyndplats.se/produkt/fotbollsspel-121-cm-22-spelare): Ålder
- [Biljardbord 140 × 63 cm, hopfällbart – höjd 55–75 cm, köer och bollar ingår](https://www.fyndplats.se/produkt/biljardbord-140-x-63-cm-hopfallbart): Ålder
- [Fotbollsspel med 2 bollar och halkfria handtag, brun/svart](https://www.fyndplats.se/produkt/fotbollsspel-2-bollar-halkfria-handtag): Ålder
- [Gåvagn i trä med xylofon, kulram och formlåda – fem klossar, från 18 månader](https://www.fyndplats.se/produkt/gavagn-tra-xylofon-kulram-klossar): Ålder, Material
- [Gåvagn i trä med aktivitetspanel – xylofon, formsortering, från 18 månader](https://www.fyndplats.se/produkt/gavagn-tra-montessori-aktivitetspanel): Ålder
- [Skumklossar 2 delar – klätterhus med trappa, tunnel och rutschramp, 131 cm](https://www.fyndplats.se/produkt/skumklossar-2-delar-klatterhus): Ålder
- [Skumklossar 5 delar med tunnel – bågar som passar i varandra, ramp och trappa](https://www.fyndplats.se/produkt/skumklossar-5-delar-tunnel-bagar): Ålder
- [Skumklossar 3 delar – krypbana på 141 cm med ramp, svacka och trappa](https://www.fyndplats.se/produkt/skumklossar-3-delar-krypbana): Ålder
- [Skumklossar 7 delar med båge – tvättbar sammet, halkfri undersida, gul och grå](https://www.fyndplats.se/produkt/skumklossar-7-delar-bage-sammet): Ålder
- [Staffli för barn 2-i-1 i rosa – krittavla, whiteboard och två tygboxar](https://www.fyndplats.se/produkt/staffli-barn-2-i-1-tygboxar-rosa): Ålder
- [Barnstaffli 3-i-1 i grått – krittavla, whiteboard, pappersrulle och två lådor](https://www.fyndplats.se/produkt/barnstaffli-3-i-1-pappersrulle-gra): Ålder
- [Trehjuling för småbarn i motorcykeldesign – orange, sitthöjd 29 cm, 18–36 mån](https://www.fyndplats.se/produkt/trehjuling-smabarn-motorcykel-orange): Ålder
- [Elmotorcykel för barn 12 V – stödhjul, musik och 2,4–5 km/h](https://www.fyndplats.se/produkt/elmotorcykel-barn-12v-stodhjul-musik): Ålder
- [Leksaksmotor att reparera – hjullastare med 63 delar, ljus, ljud och dimeffekt](https://www.fyndplats.se/produkt/leksaksmotor-hjullastare-ljus-dimeffekt): Ålder
- [Leksaksmotor att reparera – traktor med 55 delar, ljud och dimeffekt](https://www.fyndplats.se/produkt/leksaksmotor-traktor-ljud-dimeffekt): Ålder
- [Leksaksdiskmaskin i trä med diskho och kran – 32 tillbehör, för barn från 3 år](https://www.fyndplats.se/produkt/leksaksdiskmaskin-tra-diskho-32-tillbehor): Ålder
- [Barnkök med ugn, diskho och ljudeffekter, vitt](https://www.fyndplats.se/produkt/barnkok-ugn-diskho-ljud-vitt): Ålder
- [Leksakskök 100,9 cm med rinnande vatten – kyl, mikro och ugn](https://www.fyndplats.se/produkt/leksakskok-rinnande-vatten-kyl-mikro-ugn): Ålder
- [Barnkök med telefon, kritavla och mikrovågsugn, vitt](https://www.fyndplats.se/produkt/barnkok-telefon-kritavla-mikro-vitt): Ålder
- [Leksakskök i hörn med 14 delar – rinnande vatten och ugn](https://www.fyndplats.se/produkt/leksakskok-i-horn-14-delar-tillbehor): Ålder
- [Gymnastikringar och räck för barn – hopfällbar ställning, 88–128 cm, lila](https://www.fyndplats.se/produkt/gymnastikringar-och-rack-for-barn): Ålder
- [Aktivitetstavla för barn i lastbilsform, väggmonterad](https://www.fyndplats.se/produkt/aktivitetstavla-lastbil-vaggmonterad): Ålder
- [Aktivitetstavla för väggen formad som en larv – sju lekar, 108 cm lång](https://www.fyndplats.se/produkt/aktivitetstavla-vagg-larv-sju-lekar): Ålder
- [Klätterställning 5-i-1 för barn – gunga, rutschkana och klätternät](https://www.fyndplats.se/produkt/klatterstallning-5-i-1-barn): Ålder
- [Klätterställning i trä med klätterbåge, ramp och griffeltavla](https://www.fyndplats.se/produkt/klatterstallning-tra-klatterbage-ramp): Ålder
- [Klätterställning 7-i-1 för inomhusbruk, rosa](https://www.fyndplats.se/produkt/klatterstallning-7-i-1-rosa): Ålder
- [Rutschbana 5-i-1 för barn med kikare och basketkorg](https://www.fyndplats.se/produkt/rutschbana-5-i-1-barn-kikare-basketkorg): Ålder
- [Klätterställning 3-i-1 i trä – hopfällbar med rutschkana och klättervägg](https://www.fyndplats.se/produkt/klatterstallning-3-i-1-tra-rutschkana): Ålder
- [Basketställ för barn 5-i-1 – fiskformad platta, höjd 134–152 cm](https://www.fyndplats.se/produkt/basketstall-barn-5-i-1-fisk): Ålder
- [Rutschkana för småbarn i raketdesign – 1,35 m rutschbana, för 1,5–3 år](https://www.fyndplats.se/produkt/rutschkana-smabarn-raketdesign-bla): Ålder
- [Gunghäst nallebjörn med bälte och ljud – från 18 månader](https://www.fyndplats.se/produkt/gunghast-nallebjorn-med-balte-och-ljud): Ålder
- [Pingisbord hopfällbart 152 cm – avtagbart nät, 2 racket och 3 bollar](https://www.fyndplats.se/produkt/pingisbord-hopfallbart-152-cm): Ålder
- [Elbil barn Lamborghini Aventador SVJ 12V – vingdörrar och fjärrkontroll](https://www.fyndplats.se/produkt/elbil-barn-lamborghini-aventador-svj-12v): Ålder
- [Fågelbogunga Ø100 cm – kompisgunga i Oxfordtyg, bär 100 kg](https://www.fyndplats.se/produkt/fagelbogunga-100-cm): Ålder
- [Julgranståg med ljus och musik – 89 cm spår som hängs i granen](https://www.fyndplats.se/produkt/julgranstag-med-ljus-och-musik): Ålder
- [Bilbana med drake 91,5 cm – 360°-loop, rök och lysande ögon](https://www.fyndplats.se/produkt/bilbana-med-drake-360-loop): Ålder, Material
- [Biltransport som fälls ut till 1,65 m bilbana – 6 bilar ingår](https://www.fyndplats.se/produkt/biltransport-falls-ut-till-bilbana-165-cm): Ålder
- [Basketkorg för dörr med LED och poängtavla – 3 bollar och pump](https://www.fyndplats.se/produkt/basketkorg-for-dorr-led-poangtavla): Ålder, Material
- [Bilbana med 5 banor – viks ihop till förvaringslåda, 5 bilar](https://www.fyndplats.se/produkt/bilbana-med-5-banor-vikbar): Ålder
- [Lasertag-set 2 eller 4 spelare – pistoler och västar, 40 m](https://www.fyndplats.se/produkt/lasertag-set-2-eller-4-spelare): Ålder, Material
- [Lasertag 4 spelare med USB-laddning – pistoler och västar](https://www.fyndplats.se/produkt/lasertag-4-spelare-usb-laddning): Ålder, Material
- [Elektroniksats för barn – över 150 experiment med färdiga moduler](https://www.fyndplats.se/produkt/elektroniksats-barn-150-experiment): Ålder, Material
- [Pil och båge för barn 2-pack – LED-bågar, 2 måltavlor och pistoler](https://www.fyndplats.se/produkt/pil-och-bage-barn-2-pack-led): Ålder
- [Lasertag med laddstation 4 spelare – 5 vapenlägen och 40 m](https://www.fyndplats.se/produkt/lasertag-med-laddstation-4-spelare): Ålder, Material
- [Pusselbräda 77 × 53,6 cm med lock – sex lådor, upp till 1000 bitar](https://www.fyndplats.se/produkt/pusselbrada-77x53-6-cm-sex-lador): Ålder, Material
- [Leksakskök för barn med kassaapparat och 50 delar – på hjul](https://www.fyndplats.se/produkt/leksakskok-for-barn): Ålder
- [Hopfällbart mahjongbord för 4 spelare – spelbord med mugghållare och brickfack](https://www.fyndplats.se/produkt/hopfallbart-mahjongbord): Ålder
- [Radiostyrd amfibiebil 2,4 GHz för land och vatten – 12 km/h stuntbil med USB](https://www.fyndplats.se/produkt/radiostyrd-amfibiebil-land-vatten-stuntbil): Ålder
- [Radiostyrd grävmaskin 1:20 med ljud och lampor – för barn](https://www.fyndplats.se/produkt/radiostyrd-gravmaskin-1-20): Ålder
- [Mudkök för barn i trä – utomhus lekkök med 2 diskhoar och spishäll](https://www.fyndplats.se/produkt/mudkok-barn-tra-utomhus-lekkok): Ålder, Material
- [Mjuka klätterblock för barn – 5-delars skumset för krypa, klättra och leka](https://www.fyndplats.se/produkt/mjuka-klatterblock-barn): Ålder
- [Radiostyrd terrängbil 1:24 – 4WD offroad RC-bil med lampor, från 14 år](https://www.fyndplats.se/produkt/radiostyrd-terrangbil-1-24-4wd-rc-bil): Ålder, Material
- [Glassvagn leksak med ljud, ljus och 27 delar – rollek för barn](https://www.fyndplats.se/produkt/glassvagn-leksak-27-delar): Ålder
- [Trädgårdsgolf för familjen – portabelt hinkgolf-spel för 3/6/9 hål, utomhus](https://www.fyndplats.se/produkt/tradgardsgolf-barn-hinkgolf-utomhus): Ålder
- [Balansstenar för barn – 6 sköldpaddor, sensorisk motorikleksak med spelkort](https://www.fyndplats.se/produkt/balansstenar-barn-6-st-sensorisk): Ålder
- [Rittillbehör för barn – 24 kritor, 6 whiteboardpennor & 2 pappersrullar](https://www.fyndplats.se/produkt/rittillbehor-for-barn-32-delar): Ålder, Material
- [Elgokart för barn 24 V med driftfunktion, 13 km/h — vit](https://www.fyndplats.se/produkt/elgokart-barn-vit): Material
- [Elgokart för barn 24 V med driftfunktion, 13 km/h — röd](https://www.fyndplats.se/produkt/elgokart-barn-rod): Material
- [Elgokart för barn 24 V med driftfunktion, 13 km/h — rosa](https://www.fyndplats.se/produkt/elgokart-barn-rosa): Material
- [Skumklossar 5 delar i manchester – bana på 177 cm med båge och rulle, 3–6 år](https://www.fyndplats.se/produkt/skumklossar-5-delar-manchester-bage-rulle): Material
- [Skumklossar 12 delar i pastell – manchester med tvättbar klädsel, 3–6 år](https://www.fyndplats.se/produkt/skumklossar-12-delar-pastell-manchester): Material
- [Skumklossar 7 delar i manchester – bågar som blir en rund sittring, 3–6 år](https://www.fyndplats.se/produkt/skumklossar-7-delar-sittring-manchester): Material
- [Skumklossar 6 delar för 1–3 år – trappa, våg, slänt och mattor, 150 × 100 cm](https://www.fyndplats.se/produkt/skumklossar-6-delar-klatterbana): Material
- [Sandlåda med lekkök och sandtratt – 154 × 80 cm, diskho](https://www.fyndplats.se/produkt/sandlada-med-lekkok-154-cm): Material
- [Sandlåda med lekstugetak 124 × 116 cm – vimpelrad ingår](https://www.fyndplats.se/produkt/sandlada-med-lekstugetak-124-cm): Material
- [Sandlåda som piratskepp 180 × 103 cm – mast, segel och styrhjul](https://www.fyndplats.se/produkt/sandlada-piratskepp-180-cm): Material
- [Sandlåda med lekstuga 133 × 129 cm – räcke och blått tak](https://www.fyndplats.se/produkt/sandlada-med-lekstuga-133-cm): Material
- [Gunghäst 74 cm i plysch på medar av poppel — sitthöjd 40 cm](https://www.fyndplats.se/produkt/gunghast-74-cm-plysch-poppel): Material
- [Formelratt byggsats över 800 delar – mobilhållare och ställ](https://www.fyndplats.se/produkt/formelratt-byggsats-800-delar): Material
- [Uppblåsbar hoppborg med två rutschkanor och pool – 330 × 265 cm](https://www.fyndplats.se/produkt/uppblasbar-hoppborg-rutschkanor-pool): Material
- [Lasertag-set med projektor – 2 pistoler och mål på väggen](https://www.fyndplats.se/produkt/lasertag-set-projektor-2-pistoler): Material
- [Skumklossar för barn 1–3 år – 7 mjuka byggklossar för klättring och lek](https://www.fyndplats.se/produkt/skumklossar-barn): Material
- [Trumset för barn – 3 delar med pall, cymbal och trumpinnar, 14 tum](https://www.fyndplats.se/produkt/trumset-barn-3-delar-pall-cymbal): Material
- [Rittavla för barn – dubbelsidig staffli med whiteboard, svart tavla och magnet](https://www.fyndplats.se/produkt/rittavla-barn-dubbelsidig-staffli): Material
- [Kulbana byggsats 106 delar med självlysande kulor – för barn från 3 år](https://www.fyndplats.se/produkt/kulbana-byggsats-110-delar): Material

### dekoration-prydnad (240 produkter)

Filter: Bredd (75 %, syns), Material (77 %, syns), Höjd (78 %, syns)

- [Konstgjord ficus benjamina 150 cm – täta gröna blad och kruka i betong](https://www.fyndplats.se/produkt/konstgjord-ficus-benjamina-150-cm): Bredd
- [Konstgjort buxbomsträd 90 cm – tre klot på tvinnade stammar, cementfylld kruka](https://www.fyndplats.se/produkt/konstgjort-buxbomstrad-90-cm-tre-klot): Bredd, Höjd
- [Konstgjord bananväxt 150 cm med 18 blad – i kruka med cement](https://www.fyndplats.se/produkt/konstgjord-bananvaxt-150-cm-18-blad): Bredd, Höjd
- [Konstgjord palm 100 cm med 27 blad – fem stammar och kruka med cement](https://www.fyndplats.se/produkt/konstgjord-palm-100-cm-27-blad): Bredd
- [Konstgjord växt 95 cm med 33 blad – kruka med cementbotten, inne och ute](https://www.fyndplats.se/produkt/konstgjord-vaxt-95-cm-33-blad): Bredd
- [Stor konstväxt: dieffenbachia 120 cm med gulrandiga blad och kruka med cement](https://www.fyndplats.se/produkt/stor-konstvaxt-dieffenbachia-120-cm): Bredd
- [Konstgjord dieffenbachia 95 cm – gulrandiga blad och kruka med cement](https://www.fyndplats.se/produkt/konstgjord-dieffenbachia-95-cm-cementkruka): Bredd, Höjd
- [Uppblåsbar ren 180 cm med LED och rött täcke](https://www.fyndplats.se/produkt/uppblasbar-ren-180-cm-med-led): Bredd, Material, Höjd
- [Uppblåsbar tomte i släde med ren och hund 190 cm, 8 LED](https://www.fyndplats.se/produkt/uppblasbar-tomte-i-slade-med-ren-och-hund-190-cm): Bredd, Höjd
- [Snötäckt julgran 180 cm med 200 LED och metallfot](https://www.fyndplats.se/produkt/snotackt-julgran-180-cm-med-led): Bredd
- [Lysande jultomte 93 cm – 97 LED med fast sken eller blink](https://www.fyndplats.se/produkt/lysande-jultomte-93-cm-97-led): Bredd, Material, Höjd
- [Lysande snögubbefamilj i tre delar – 128 LED, högsta 91,5 cm](https://www.fyndplats.se/produkt/lysande-snogubbefamilj-tre-delar-128-led): Bredd, Material, Höjd
- [Tre växtpiedestaler i svart stål med skiva i träimitation – 50, 70 och 90 cm](https://www.fyndplats.se/produkt/vaxtpiedestaler-tre-svart-stal): Bredd, Höjd
- [Lysande ren med släde – 170 LED, renen 118 cm hög](https://www.fyndplats.se/produkt/lysande-ren-med-slade-170-led): Bredd, Material, Höjd
- [Uppblåsbar pepparkaksgubbe 245 cm med polkagriskäpp och tre paket](https://www.fyndplats.se/produkt/uppblasbar-pepparkaksgubbe-245-cm-med-polkagriskapp): Bredd, Höjd
- [Uppblåsbar jultomte i skorsten 210 cm – vinkar och lyser](https://www.fyndplats.se/produkt/uppblasbar-jultomte-skorsten-210-cm): Bredd, Material, Höjd
- [Konstgjort blåregn 165 cm med vita blomklasar – böjbara grenar](https://www.fyndplats.se/produkt/konstgjort-blaregn-165-cm-vita-blomklasar): Bredd
- [Konstgjort bambuträd 180 cm i svart kruka](https://www.fyndplats.se/produkt/konstgjort-bambutrad-180-cm-svart-kruka): Bredd, Höjd
- [Adventskalender i trä med 24 lådor – belyst byscen, 36 cm bred](https://www.fyndplats.se/produkt/adventskalender-tra-24-lador-byscen): Bredd, Material, Höjd
- [Tät julgran 150 cm med snö – 1162 grenspetsar](https://www.fyndplats.se/produkt/tat-julgran-150-cm-1162-grenspetsar): Bredd
- [Konstgjorda cypresser 2-pack 90 cm – gråa dekorkrukor ingår](https://www.fyndplats.se/produkt/konstgjorda-cypresser-2-pack-90-cm-dekorkruka): Bredd, Höjd
- [Konstgjort olivträd 180 cm – sidenliknande blad och oliver](https://www.fyndplats.se/produkt/konstgjort-olivtrad-180-cm-sidenliknande-blad): Bredd
- [Smal snögran 180 cm – Ø80 cm, 600 grenspetsar och gångjärn](https://www.fyndplats.se/produkt/smal-snogran-180-cm-80-cm-bred): Bredd, Material, Höjd
- [Konstgjord ficus 180 cm i PEVA – betongkruka och metallstomme](https://www.fyndplats.se/produkt/konstgjord-ficus-180-cm-peva-betongkruka): Bredd
- [Konstgjord buxbom 2-pack 90 cm – tre klot per träd, cementfylld kruka](https://www.fyndplats.se/produkt/konstgjord-buxbom-2-pack-90-cm-tre-klot): Bredd
- [Konstgjord buxbom 115 cm med tre klot](https://www.fyndplats.se/produkt/konstgjord-buxbom-115-cm-tre-klot): Bredd
- [Julgran 180 cm med 4030 grenspetsar – katalogens tätaste](https://www.fyndplats.se/produkt/julgran-180-cm-4030-grenspetsar): Bredd, Material
- [Pelarjulgran 210 cm med snö – bara 54 cm bred](https://www.fyndplats.se/produkt/pelarjulgran-210-cm-54-cm-bred): Bredd
- [Pelarjulgran 180 cm med snö – bara 46 cm bred](https://www.fyndplats.se/produkt/pelarjulgran-180-cm-46-cm-bred): Bredd
- [Bred julgran 180 cm med snö – 105 cm diameter](https://www.fyndplats.se/produkt/bred-julgran-180-cm-105-cm-diameter): Bredd
- [Konstgjord monstera 110 cm med elva blad och kruka](https://www.fyndplats.se/produkt/konstgjord-monstera-110-cm): Bredd
- [Snöad julgran 180 cm med 61 kottar – Ø103 cm](https://www.fyndplats.se/produkt/snoad-julgran-180-cm-61-kottar): Bredd, Material, Höjd
- [Smal snögran 180 cm – bara 55 cm bred, 390 grenar](https://www.fyndplats.se/produkt/smal-snogran-180-cm-55-cm-bred): Bredd, Material, Höjd
- [Väggkamin 127 cm med 111 cm fönster – häng eller bygg in](https://www.fyndplats.se/produkt/vaggkamin-127-cm-inbyggnad): Bredd, Material, Höjd
- [Väggkamin 91,4 cm för hängning eller inbyggnad – 1800 W](https://www.fyndplats.se/produkt/vaggkamin-91-cm-inbyggnad): Bredd, Material, Höjd
- [Elkamin med vit omramning 96,5 cm – bara 22 cm djup](https://www.fyndplats.se/produkt/elkamin-omramning-96-cm-rak): Bredd, Material, Höjd
- [Elkamin 74 cm med glas på tre sidor – högst av dem](https://www.fyndplats.se/produkt/elkamin-74-cm-glas-tre-sidor): Bredd, Material, Höjd
- [Elkamin med glas på tre sidor – 1800 W och 27 cm frontfönster](https://www.fyndplats.se/produkt/elkamin-glas-tre-sidor-1800-w): Bredd, Material, Höjd
- [Elkamin 45,5 cm vit – 2000 W och fönster på 21 × 20 cm](https://www.fyndplats.se/produkt/elkamin-45-cm-vit-2000-w): Bredd, Material, Höjd
- [Elkamin 45,5 cm svart – 2000 W och fönster på 21 × 20 cm](https://www.fyndplats.se/produkt/elkamin-45-cm-svart-2000-w): Bredd, Material, Höjd
- [Elkamin svart 56,5 cm med bågformad lucka – 2000 W](https://www.fyndplats.se/produkt/elkamin-svart-56-cm-bagformad-lucka): Bredd, Material, Höjd
- [Elkamin vit 55 cm med 27 cm fönster – 1800 W](https://www.fyndplats.se/produkt/elkamin-vit-55-cm-27-cm-fonster): Bredd, Material, Höjd
- [Elkamin 55 cm med 27 cm fönster – 1800 W och lucka med handtag](https://www.fyndplats.se/produkt/elkamin-55-cm-27-cm-fonster): Bredd, Material, Höjd
- [Elkamin 74 cm med öppet vedfack under eldstaden](https://www.fyndplats.se/produkt/elkamin-74-cm-vedfack): Bredd, Material, Höjd
- [Väggkamin 72,5 cm med bred svart ram – 2000 W](https://www.fyndplats.se/produkt/vaggkamin-72-cm-svart-ram): Bredd, Material, Höjd
- [Elkamin vit med spröjsat fönster – termostat och 2000 W](https://www.fyndplats.se/produkt/elkamin-vit-sprojsat-fonster): Bredd, Material, Höjd
- [Elkamin svart med spröjsat fönster – ställbar låga och värme](https://www.fyndplats.se/produkt/elkamin-svart-sprojsat-fonster): Bredd, Material, Höjd
- [Elkamin med vit omramning 80,5 cm – öppen hylla ovanför](https://www.fyndplats.se/produkt/elkamin-omramning-80-cm-hylla): Bredd, Material, Höjd
- [Cylindrisk elkamin 64,5 cm – rund och lika från alla håll](https://www.fyndplats.se/produkt/elkamin-cylindrisk-64-cm): Bredd, Material, Höjd
- [Minielkamin 31 cm på ben – metall, härdat glas och tippskydd](https://www.fyndplats.se/produkt/minielkamin-31-cm-ben-metall): Bredd, Material, Höjd
- [Elkamin vit 45 cm med öppningsbar lucka – dimbar låga](https://www.fyndplats.se/produkt/elkamin-vit-45-cm-oppningsbar-lucka): Bredd, Material, Höjd
- [Elkamin 45 cm bred med öppningsbar lucka – dimbar låga](https://www.fyndplats.se/produkt/elkamin-45-cm-oppningsbar-lucka): Bredd, Material, Höjd
- [Minielkamin 34 cm bred – 1200 W och låga utan värme](https://www.fyndplats.se/produkt/minielkamin-34-cm-1200-w): Bredd, Material, Höjd
- [Elkamin i guld 59,2 cm – enda guldfärgade i sortimentet](https://www.fyndplats.se/produkt/elkamin-guld-59-cm): Bredd, Material, Höjd
- [Konstgjord arecapalm 190 cm – tre stammar, inne eller ute](https://www.fyndplats.se/produkt/konstgjord-arecapalm-190-cm): Bredd, Material
- [Konstgjort träd, formklippt ceder 91 cm för inne och ute](https://www.fyndplats.se/produkt/konstgjort-trad): Bredd
- [Konstgjord bananväxt 150 cm med kruka och 18 blad – underhållsfri konstväxt](https://www.fyndplats.se/produkt/konstgjord-bananvaxt): Bredd
- [Konstgjord julgran med snö – brandsäkra grenar, stålfot, flera höjder](https://www.fyndplats.se/produkt/konstgjord-julgran-med-sno): Bredd, Höjd
- [Konstgjort olivträd – realistisk konstväxt i PE, 1,2–1,8 m för inredning](https://www.fyndplats.se/produkt/konstgjort-olivtrad): Bredd, Höjd
- [Julby i trä med 20 LED – vinterlandskap med hus, barn och lyktor, 45 cm](https://www.fyndplats.se/produkt/julby-tra-20-led-vinterlandskap): Material
- [Julgranar 2-pack 57 cm med LED och jordspjut](https://www.fyndplats.se/produkt/julgranar-2-pack-57-cm-med-led-och-jordspjut): Material
- [Uppblåsbar pepparkaksgubbe 250 cm med presentask och LED](https://www.fyndplats.se/produkt/uppblasbar-pepparkaksgubbe-250-cm-med-presentask): Material
- [Lysande snögubbe 51 cm med 30 LED – batteridriven](https://www.fyndplats.se/produkt/snogubbe-51-cm-med-30-led-batteridriven): Material
- [Uppblåsbar juldekoration 213 cm med tomte som åker upp och ner](https://www.fyndplats.se/produkt/uppblasbar-juldekoration-med-rorlig-tomte): Material
- [Uppblåsbara julgranar 3-pack, 239 cm med färgskiftande LED](https://www.fyndplats.se/produkt/uppblasbara-julgranar-3-pack-239-cm): Material
- [Julgranskrage i trä 65 × 65 cm – döljer granfoten, granar 1,8–2,7 m](https://www.fyndplats.se/produkt/julgranskrage-tra-65x65-cm): Material, Höjd
- [Julgran 183 cm med 2380 grenspetsar – gångjärn, klar på 10 min](https://www.fyndplats.se/produkt/julgran-183-cm-2380-grenspetsar): Material
- [Adventskalender i MDF 34 × 34 cm – 24 stora lådor och LED-byscen](https://www.fyndplats.se/produkt/adventskalender-mdf-24-stora-lador): Material, Höjd
- [Julgran 180 cm med 748 grenspetsar – Ø120 cm, hopfällbar fot](https://www.fyndplats.se/produkt/julgran-180-cm-748-grenspetsar): Material
- [Julgran 150 cm med 444 grenspetsar – Ø105 cm, hopfällbar fot](https://www.fyndplats.se/produkt/julgran-150-cm-444-grenspetsar): Material
- [Talljulgran 180 cm med 1111 grenar och 59 kottar](https://www.fyndplats.se/produkt/talljulgran-180-cm-1111-grenar-59-kottar): Material
- [Talljulgran 180 cm med 724 grenar i två former](https://www.fyndplats.se/produkt/talljulgran-180-cm-724-grenar): Material
- [Julgran 120 cm med 657 grenspetsar – Ø85 cm och metallfot](https://www.fyndplats.se/produkt/julgran-120-cm-657-grenspetsar): Material
- [Julgran 180 cm med 1000 grenspetsar – Ø120 cm och metallfot](https://www.fyndplats.se/produkt/julgran-180-cm-1000-grenspetsar): Material
- [Julgran 180 cm med 200 LED och julkulor – allt ingår](https://www.fyndplats.se/produkt/julgran-180-cm-200-led-och-kulor): Material
- [Julgran 210 cm med 631 grenspetsar – Ø81 cm, väger 4,6 kg](https://www.fyndplats.se/produkt/julgran-210-cm-631-grenspetsar): Material
- [Talljulgran 180 cm med 375 grova PET-grenar, Ø90 cm](https://www.fyndplats.se/produkt/talljulgran-180-cm-375-grenar): Material
- [Talljulgran 210 cm med 505 silverkantade grenspetsar](https://www.fyndplats.se/produkt/talljulgran-210-cm-505-grenspetsar): Material
- [Snögran 180 cm – smal pelargran, 479 grentoppar](https://www.fyndplats.se/produkt/snogran-180-cm-smal-pelargran): Material
- [Snögran 180 cm med 150 LED – smal och förtänd](https://www.fyndplats.se/produkt/snogran-180-cm-150-led-fortand): Material
- [Julgran 210 cm med pynt – 1036 grenar och 54 dekorationer](https://www.fyndplats.se/produkt/julgran-210-cm-med-pynt): Material
- [Trädgårdsfontän 72 cm med LED – fem skålar i resin](https://www.fyndplats.se/produkt/tradgardsfontan-72-cm-led-fem-skalar): Material
- [Helkroppsspegel med bågform i svart – golvspegel i aluminium, 161,5 × 50 cm](https://www.fyndplats.se/produkt/helkroppsspegel-bagform-svart): Höjd
- [Hallspegel 60 × 80 cm med vit ram – hängs stående eller liggande](https://www.fyndplats.se/produkt/hallspegel-60x80-vit-ram): Höjd
- [Väggspegel 40 × 60 cm med svart ram – hängs stående eller liggande](https://www.fyndplats.se/produkt/vaggspegel-40x60-svart-ram): Höjd
- [Väggdekor i metall, två tavlor – blad i svart och natur, 40 × 46 cm](https://www.fyndplats.se/produkt/vaggdekor-metall-blad-svart-natur-tva): Höjd
- [Konstgjorda lavendelklot 2-pack Ø42 cm – 225 blommor](https://www.fyndplats.se/produkt/konstgjorda-lavendelklot-2-pack-42-cm): Höjd
- [Konstgjorda lavendelträd 2-pack 70 cm – vita blommor](https://www.fyndplats.se/produkt/konstgjorda-lavendeltrad-2-pack-70-cm): Höjd
- [Konstgjorda eukalyptusklot 2-pack Ø52 cm – UV-beständiga](https://www.fyndplats.se/produkt/konstgjorda-eukalyptusklot-2-pack-52-cm): Höjd
- [Väggspegel 50 × 70 cm med svart ram – hängs stående eller liggande](https://www.fyndplats.se/produkt/vaggspegel-50-x-70-cm-svart-ram): Höjd
- [Fönsterspegel svart 76x149 cm – 3 delar, väggspegel med metallram](https://www.fyndplats.se/produkt/fonsterspegel-svart-76x149-cm-3-delar-vaggspegel): Höjd
- [Konstgjord julgirlang 2 m – grön grangirlang med böjbar metalltråd](https://www.fyndplats.se/produkt/konstgjord-julgirlang): Höjd

### verktyg-hemmafix (156 produkter)

Filter: Höjd (72 %, syns), Material (72 %, syns), Bredd (77 %, syns)

- [Takplåt 12-pack i trälook – trapetsprofil 129 × 45 cm, 0,25 mm](https://www.fyndplats.se/produkt/takplat-12-pack-tralook-trapetsprofil): Höjd
- [Bordsben i stål 2-pack, ram 72 × 60 cm](https://www.fyndplats.se/produkt/bordsben-stal-2-pack-ram-72-60-cm): Höjd
- [Entrétak i glas 150 × 90 cm – 12 mm härdat glas och fästen i rostfritt stål](https://www.fyndplats.se/produkt/entretak-glas-150-x-90-cm-rostfritt): Höjd
- [Hydraulisk presstång för kabelskor 4–70 mm² med väska](https://www.fyndplats.se/produkt/hydraulisk-presstang-kabelskor-4-70-mm2): Höjd, Material, Bredd
- [Kabelskalare för borrmaskin och handvev – 6 hål, 3–17 mm](https://www.fyndplats.se/produkt/kabelskalare-borrmaskin-handvev): Höjd, Material, Bredd
- [Manuell kakelskärare med laser – 80/90/100/120 cm kaplängd](https://www.fyndplats.se/produkt/manuell-kakelskarare-laser): Höjd, Bredd
- [Bead blaster 8 eller 9 liter – tryckluftstank för däckmontering](https://www.fyndplats.se/produkt/bead-blaster-8-9-liter-dackmontering): Höjd, Material, Bredd
- [Skjutdörrsbeslag trädörr 183 cm – skensats med hjulvagnar, 100 kg](https://www.fyndplats.se/produkt/skjutdorrsbeslag-tradorr-183-cm): Höjd, Bredd
- [Entrétak 195 cm – brett skärmtak i polykarbonat för dubbeldörr och fönster](https://www.fyndplats.se/produkt/entretak-195-cm-polykarbonat-dubbeldorr-fonster): Höjd, Material, Bredd
- [Entrétak ytterdörr 122x89 cm – skärmtak i polykarbonat med svart konsol](https://www.fyndplats.se/produkt/entretak-ytterdorr-polykarbonat-122x89-cm): Höjd, Material
- [Slangvinda tryckluft 20 m – automatisk slangupprullare med väggfäste](https://www.fyndplats.se/produkt/slangvinda-tryckluft-20m-automatisk): Höjd, Material, Bredd
- [Verktygslåda för lastbil i stål – låsbar flaklåda för montering under flak](https://www.fyndplats.se/produkt/verktygslada-lastbil-stal): Höjd, Bredd
- [Garagehylla i stål – justerbar förvaringshylla, 4–5 hyllplan](https://www.fyndplats.se/produkt/garagehylla-stal-justerbar): Höjd, Material, Bredd
- [Sortimentskåp för vägg – smådelsförvaring med 18, 40 eller 60 lådor](https://www.fyndplats.se/produkt/sortimentskap-vagg): Höjd, Bredd
- [Tröskelramp i aluminium – halkfri rullstolsramp med justerbar höjd](https://www.fyndplats.se/produkt/troskelramp-aluminium-rullstol): Höjd, Material, Bredd
- [Tröskelramp i aluminium – lätt halkfri ramp för rullstol och scooter](https://www.fyndplats.se/produkt/troskelramp-aluminium-latt): Höjd, Material
- [Låsbart fönsterhandtag med nyckel – barnsäkert, vit](https://www.fyndplats.se/produkt/lasbart-fonsterhandtag-med-nyckel): Höjd, Material, Bredd
- [Trappstege i aluminium – hopfällbar hushållsstege 2/3/4 steg, 150 kg](https://www.fyndplats.se/produkt/trappstege-aluminium-hopfallbar-hushallsstege): Höjd, Material, Bredd
- [Magnetisk hylshållare 3-pack – 1/4, 3/8 & 1/2 tum, rymmer 75 hylsor](https://www.fyndplats.se/produkt/magnetisk-hylshallare-3-pack): Höjd
- [Rörskruvstäd på stativ 1/8–5″ – kätting i kolstål, hopfällbart](https://www.fyndplats.se/produkt/rorskruvstad-stativ-katting-1-8-5): Höjd, Material, Bredd
- [Flyttfiltar för möbler 6/12-pack – vadderade packfiltar med resårband](https://www.fyndplats.se/produkt/flyttfiltar-mobler-6-12-pack): Höjd, Material
- [Säcksymaskin med batteri – handhållen påsförslutare för säckar och väv, gul](https://www.fyndplats.se/produkt/sacksymaskin-batteri): Höjd, Material, Bredd
- [Badrumsfläkt med fjärrkontroll – tyst till- och frånluftsfläkt 100 mm, vit](https://www.fyndplats.se/produkt/badrumsflakt-fjarrkontroll): Höjd, Material, Bredd
- [Krukvagn med hjul och griparm – flyttar tunga krukor upp till 65 kg](https://www.fyndplats.se/produkt/krukvagn-med-hjul-griparm): Höjd, Bredd
- [Kabelsax med spärr – för koppar- och aluminiumkabel, blad i fjäderstål](https://www.fyndplats.se/produkt/kabelsax-med-sparr): Höjd, Material
- [Teleskopstege aluminium 3,3 m – multifunktion A-stege med 3 vinklar](https://www.fyndplats.se/produkt/teleskopstege-aluminium): Höjd, Material, Bredd
- [Väggfräs 4800W med lasersikte – spårfräs för betong, marmor och granit](https://www.fyndplats.se/produkt/vaggfras-4800w): Höjd, Bredd
- [Väggfräs 4000W med 5 blad – spårfräs för betong, tegel och sten](https://www.fyndplats.se/produkt/vaggfras-4000w): Höjd
- [Skjutdörrsbeslag med skena för skjutdörr – upp till 150 kg, en eller två dörrar](https://www.fyndplats.se/produkt/skjutdorrsbeslag-skena): Höjd, Material, Bredd
- [Digital momentmejsel 1/4 tum – med LCD, 12 bits och väska, 0,3–8 Nm](https://www.fyndplats.se/produkt/digital-momentmejsel-1-4-tum-bits): Höjd, Material, Bredd
- [Frekvensomriktare 1-fas till 3-fas för Motorstyrning](https://www.fyndplats.se/produkt/frekvensomriktare-1-fas-3-fas): Höjd, Material, Bredd
- [Airless färgspruta 3000 PSI – elektrisk målarspruta 750W/950W för vägg och tak](https://www.fyndplats.se/produkt/airless-fargspruta): Höjd, Bredd
- [Slangvagn för trädgård med hjul och vev](https://www.fyndplats.se/produkt/slangvagn-tradgard): Höjd, Bredd
- [Lådskenor med kullager – 2-pack låsbara teleskopskenor, fullt utdrag, 113 kg](https://www.fyndplats.se/produkt/ladskenor-kullager-teleskop-2-pack): Höjd
- [Verktygsväska för elektriker med 33 fack – 1680D polyester](https://www.fyndplats.se/produkt/verktygsvaska-elektriker-33-fack): Höjd, Bredd
- [Hopfällbar dragvagn 36 L – trappklättrande shoppingvagn, bär upp till 50 kg](https://www.fyndplats.se/produkt/hopfallbar-dragvagn-trappvagn-36l): Höjd, Material, Bredd
- [Flätat polyesterrep 36,5 m – dubbelflätat allroundrep i 3/8 och 1/2 tum](https://www.fyndplats.se/produkt/flatat-polyesterrep-allroundrep): Höjd, Bredd
- [Pocket hole-jigg (fickhålsjigg) i aluminium – justerbart djup och 2-stegsborr](https://www.fyndplats.se/produkt/pocket-hole-jigg-fickhalsjigg): Höjd, Bredd
- [Lutbart fräsbord i gjutjärn – vinkelbord med T-spår för fräsmaskin](https://www.fyndplats.se/produkt/lutbart-frasbord-gjutjarn): Höjd, Bredd
- [Inspektionskamera borescope 5 tum – ledad 2-vägs sond, 8 LED, 4500 mAh](https://www.fyndplats.se/produkt/inspektionskamera-borescope-5-tum-ledad-sond): Höjd, Material, Bredd
- [MIG-svets multifunktion 4-i-1 – gas/gasfri MIG, MMA och Lift TIG](https://www.fyndplats.se/produkt/mig-svets-multifunktion-4-i-1): Höjd, Material, Bredd
- [Destillationssats i labbglas 32 delar – borosilikat med 24/40-slipningar](https://www.fyndplats.se/produkt/destillationssats-labbglas): Höjd, Material, Bredd
- [Destillationsapparat i rostfritt stål 12–50 L med thumper och termometer](https://www.fyndplats.se/produkt/destillationsapparat-rostfri): Höjd, Bredd
- [Kryssbord för fräs och borrmaskin – kompakt korsbord 185 × 100 mm i gjutjärn](https://www.fyndplats.se/produkt/kryssbord-fras-borrmaskin-185x100): Höjd, Material
- [Skena för skjutdörr, 183 cm – komplett beslag för en dörr, bär 200 kg](https://www.fyndplats.se/produkt/skena-skjutdorr-183-cm): Material
- [Skjutdörrsbeslag 122 cm för vikdörr i ladudörrsstil – svart stål, bär 90 kg](https://www.fyndplats.se/produkt/skjutdorrsbeslag-122-cm-vikdorr-svart): Material
- [Skjutdörrsbeslag i svart kolstål – skena 200 cm, bär 90 kg](https://www.fyndplats.se/produkt/skjutdorrsbeslag-svart-skena-200-cm): Material
- [Verkstadsbänk på hjul med hålplank – viks ihop till 9 cm bredd](https://www.fyndplats.se/produkt/verkstadsbank-pa-hjul-hopfallbar): Material
- [Röd verktygsvagn 113 cm med 16 lådor – överkista och underskåp](https://www.fyndplats.se/produkt/verktygsvagn-rod-16-lador): Material
- [Blå verktygsvagn 113 cm med 16 lådor – överkista och underskåp](https://www.fyndplats.se/produkt/verktygsvagn-bla-16-lador): Material
- [Skjutdörrsbeslag för möbler 200 cm – svart kolstål, max 20 kg](https://www.fyndplats.se/produkt/skjutdorrsbeslag-mobler-200-cm): Material
- [Hopfällbar arbetsplattform i aluminium 110×32×50 cm – klarar 150 kg](https://www.fyndplats.se/produkt/arbetsplattform-hopfallbar-aluminium): Material
- [Handvinsch för båt och trailer – 1588 kg med 2 växlar](https://www.fyndplats.se/produkt/handvinsch-bat-trailer-1588-kg): Material
- [Handvinsch för båt och trailer – 725 kg med 4:1 utväxling](https://www.fyndplats.se/produkt/handvinsch-bat-trailer): Material
- [Handvinsch för båt och trailer – 272 kg, kompakt med band](https://www.fyndplats.se/produkt/handvinsch-bat-272-kg): Material
- [Kompakt handvinsch för båt och trailer – 725 kg, nylonhölje](https://www.fyndplats.se/produkt/handvinsch-bat-nylonholje): Material
- [Handvinsch 1588 kg för båt och trailer – 2 växlar, nylonhölje](https://www.fyndplats.se/produkt/handvinsch-bat-nylon-1588-kg): Material
- [Verktygssats 198 delar – verktygslåda med hylsnyckelset för hem & bil](https://www.fyndplats.se/produkt/verktygssats-198-delar-verktygslada-hylsnyckelset): Material
- [CNC-fräs 3-axlig, GRBL – gravyrmaskin för trä & akryl](https://www.fyndplats.se/produkt/cnc-fras-3-axlig-grbl-gravyrmaskin): Material
- [Maskinskruvstäd 125 mm för fräs och CNC – låsbart, 24 kN, gjutjärn](https://www.fyndplats.se/produkt/maskinskruvstad-125mm-fras-cnc): Material
- [Nyckelinkast genom dörren – deponeringsbox i stål med kodlås](https://www.fyndplats.se/produkt/nyckelinkast-genom-dorren): Material
- [Svarvstål i HSS – 12-delars set med träförvaringslåda](https://www.fyndplats.se/produkt/svarvstal-hss-12-delars-set-med-tralada): Material
- [Injektortestare 600 bar – provbänk för dieselinjektorer, dubbel skala](https://www.fyndplats.se/produkt/injektortestare-600-bar-diesel): Bredd
- [Nivåutjämnare för stege – trappor & sluttningar, 172 kg](https://www.fyndplats.se/produkt/nivautjamnare-stege-trappa-sluttning): Bredd
- [Möbelben hairpin i metall – 4-pack svarta bordsben](https://www.fyndplats.se/produkt/mobelben-hairpin-metall-bordsben-4-pack): Bredd

### kontorsstolar (161 produkter)

Filter: Klädsel (75 %, syns), Bredd (75 %, syns), Sitthöjd (94 %, syns), Material (94 %, syns)

- [Kontorsstol med uppblåsbart svankstöd – bär 180 kg, fickfjädrar i sitsen](https://www.fyndplats.se/produkt/kontorsstol-uppblasbart-svankstod-180-kg): Klädsel
- [Ritstol med uppfällbara armstöd – 53–78 cm sitthöjd och fotring](https://www.fyndplats.se/produkt/ritstol-uppfallbara-armstod): Klädsel, Bredd, Material
- [Kontorsstol i beige flanellook – skålad rygg med integrerade armstöd](https://www.fyndplats.se/produkt/kontorsstol-beige-flanellook-skalad-rygg): Klädsel
- [Kontorsstol med framfällbar rygg – går in under bordet](https://www.fyndplats.se/produkt/kontorsstol-framfallbar-rygg-under-bordet): Klädsel
- [Kontorsstol med fotstöd, brun – rygg i tre lägen, 152 cm nedfälld](https://www.fyndplats.se/produkt/kontorsstol-brun-fotstod): Klädsel, Bredd
- [Kontorsstol med fotstöd, gräddvit – rygg i tre lägen, 152 cm nedfälld](https://www.fyndplats.se/produkt/kontorsstol-graddvit-fotstod): Klädsel, Bredd
- [Chefsstol mörkgrå i snöflanell – fotstöd och rygg i tre lägen](https://www.fyndplats.se/produkt/chefsstol-morkgra-snoflanell-fotstod): Klädsel
- [Kontorsstol mörkgrå med 71 cm hög rygg – nackstöd och vippfunktion](https://www.fyndplats.se/produkt/kontorsstol-morkgra-71-cm-hog-rygg): Klädsel
- [Kontorsstol grå med massage och fotstöd – ryggen fälls till 135°](https://www.fyndplats.se/produkt/kontorsstol-massage-gra-135-grader-fotstod): Klädsel
- [Kontorsstol i lammullslook, gräddvit – 14 cm sits, bär 135 kg](https://www.fyndplats.se/produkt/kontorsstol-lammullslook-graddvit-135-kg): Klädsel
- [Knästol med gungfunktion, sex lägen](https://www.fyndplats.se/produkt/knastol-gungfunktion-sex-lagen): Klädsel, Sitthöjd
- [Kontorsstol ljusgrå som bär 200 kg – sitthöjd 53–61 cm](https://www.fyndplats.se/produkt/kontorsstol-ljusgra-200-kg): Klädsel
- [Kontorsstol grå som bär 200 kg – 19 cm sitsdyna och 22 cm ryggdyna](https://www.fyndplats.se/produkt/kontorsstol-gra-200-kg): Klädsel
- [Kontorsstol svart som bär 200 kg – 58 cm sits och 70 cm hög rygg](https://www.fyndplats.se/produkt/kontorsstol-svart-200-kg): Klädsel
- [Chefsstol ljusgrå med fotstöd – fälls till 148 cm](https://www.fyndplats.se/produkt/chefsstol-ljusgra-fotstod): Klädsel, Bredd
- [Chefsstol grå med fotstöd – fälls till 148 cm](https://www.fyndplats.se/produkt/chefsstol-gra-fotstod): Klädsel, Bredd
- [Pendelpall med vippande sits – 56,5–71,5 cm, för ståbord](https://www.fyndplats.se/produkt/pendelpall-vippande-sits): Klädsel, Bredd, Sitthöjd, Material
- [Kontorsstol rosa i plysch – armlös, 8 kg, sitthöjd 41–51 cm](https://www.fyndplats.se/produkt/kontorsstol-rosa-teddy-8-kg): Klädsel
- [Kontorsstol ljusgrå med massage och värme – fälls till 155°](https://www.fyndplats.se/produkt/kontorsstol-massage-ljusgra-varme-fotstod): Klädsel
- [Kontorsstol med massage och ländvärme – svart mikrofiber, låg sits](https://www.fyndplats.se/produkt/kontorsstol-massage-svart-mikrofiber-lag-sitthojd): Klädsel
- [Kontorsstol mörkgrå med massage och värme – sitthöjd 56–64 cm](https://www.fyndplats.se/produkt/kontorsstol-massage-morkgra-varme-fotstod): Klädsel
- [Kontorsstol i brun mikrofiber med 155° ryggläge](https://www.fyndplats.se/produkt/kontorsstol-brun-mikrofiber-155-grader): Klädsel
- [Ritstol utan armstöd – 50–70 cm sitthöjd och fotring Ø45 cm](https://www.fyndplats.se/produkt/ritstol-utan-armstod): Klädsel, Bredd, Material
- [Ritstol 95–115 cm med armstöd – sitthöjd 52–72 cm och fotring](https://www.fyndplats.se/produkt/ritstol-95-115-cm): Klädsel, Bredd, Material
- [Ritstol med sitthöjd upp till 87 cm – för höga bänkar och ståbord](https://www.fyndplats.se/produkt/ritstol-sitthojd-87-cm): Klädsel, Bredd, Material
- [Kontorsstol cognac i mikrofiber – rutstickad rygg, svart ram](https://www.fyndplats.se/produkt/kontorsstol-cognac-mikrofiber-rutstickad): Klädsel
- [Knästol björk kräm – 10 cm dynor på sits och knädynor](https://www.fyndplats.se/produkt/knastol-bjork-kram): Klädsel, Bredd
- [Knästol björk mörkgrå – framåtlutande sits, 120 kg maxlast](https://www.fyndplats.se/produkt/knastol-bjork-morkgra): Klädsel, Bredd
- [Knästol björk blå – 51 cm bred, smalare än en kontorsstol](https://www.fyndplats.se/produkt/knastol-bjork-bla): Klädsel, Bredd
- [Knästol björk svart – två knädynor, sittyta 39 × 30 cm](https://www.fyndplats.se/produkt/knastol-bjork-svart): Klädsel
- [Knästol björk ljusgrå – 7,7 kg, lätt att flytta undan](https://www.fyndplats.se/produkt/knastol-bjork-ljusgra): Klädsel, Bredd
- [Kontorsstol grön med vit stomme – svängt svankstöd, 12,9 kg](https://www.fyndplats.se/produkt/kontorsstol-gron-vit-svankstod): Klädsel
- [Kontorsstol grå 78 cm djup – 57 cm bred sits och tjock stoppning](https://www.fyndplats.se/produkt/kontorsstol-gra-78-cm-djup-tjock-stoppning): Klädsel
- [Kontorsstol ljusgrå i mikrofiber – 46 cm rygg, sitthöjd 49–59 cm](https://www.fyndplats.se/produkt/kontorsstol-ljusgra-mikrofiber-46-cm-rygg): Klädsel
- [Kontorsstol mörkgrå i mikrofiber – 46 cm rygg, sitthöjd 49–59 cm](https://www.fyndplats.se/produkt/kontorsstol-morkgra-mikrofiber-46-cm-rygg): Klädsel
- [Kontorsstol beige i mikrofiber – 72 cm rygg och sitthöjd 44–52 cm](https://www.fyndplats.se/produkt/kontorsstol-beige-mikrofiber-72-cm-rygg): Klädsel
- [Kontorsstol svart med nackkudde – fotstöd och rygg som fälls 155°](https://www.fyndplats.se/produkt/kontorsstol-svart-nackkudde-fotstod-155-grader): Klädsel
- [Kontorsstol som fälls till 173 cm – avtagbar nack- och ryggkudde](https://www.fyndplats.se/produkt/kontorsstol-160-grader-nack-och-ryggkudde): Klädsel
- [Kontorsstol grå med massage och värme – 62 cm bred, fälls till 135°](https://www.fyndplats.se/produkt/kontorsstol-massage-gra-varme-62-cm): Klädsel
- [Kontorsstol svart, 74 cm hög rygg – flyttbart nackstöd](https://www.fyndplats.se/produkt/kontorsstol-svart-hog-rygg-74-cm-nackstod): Klädsel
- [Chefsstol grå som bär 135 kg – 80 cm djup med utfällbart fotstöd](https://www.fyndplats.se/produkt/chefsstol-gra-135-kg-80-cm-djup): Klädsel
- [Kontorsstol i bouclé, benvit – nackstöd och 120 kg maxlast](https://www.fyndplats.se/produkt/kontorsstol-benvit-boucle): Bredd
- [Kontorsstol i bouclé, ljusgrå – nackstöd och 120 kg maxlast](https://www.fyndplats.se/produkt/kontorsstol-ljusgra-boucle): Bredd
- [Kontorsstol i bouclé, ljusbrun – nackstöd och 120 kg maxlast](https://www.fyndplats.se/produkt/kontorsstol-ljusbrun-boucle): Bredd
- [Kontorsstol gräddvit i bouclé – vippfunktion och 10 cm stoppning](https://www.fyndplats.se/produkt/kontorsstol-graddvit-boucle-vippfunktion): Bredd
- [Kontorsstol big and tall – 56 cm bred sits, 69 cm rygg, bär 150 kg](https://www.fyndplats.se/produkt/kontorsstol-big-and-tall-150-kg): Bredd
- [Skrivbordsstol vit med hjärtformad rygg – 44–54 cm sitthöjd](https://www.fyndplats.se/produkt/skrivbordsstol-vit-hjartrygg): Bredd
- [Skrivbordsstol rosa med hjärtformad rygg – 44–54 cm sitthöjd](https://www.fyndplats.se/produkt/skrivbordsstol-rosa-hjartrygg): Bredd
- [Rullpall vit med oval rygg och fotring – sitthöjd 48–64 cm](https://www.fyndplats.se/produkt/rullpall-vit-oval-rygg-48-64-cm): Bredd
- [Rullpall svart med oval rygg och fotring – sitthöjd 48–64 cm](https://www.fyndplats.se/produkt/rullpall-svart-oval-rygg-48-64-cm): Bredd
- [Kontorsstol svart i linnelook – dubbel stoppning, sitthöjd 50–60 cm](https://www.fyndplats.se/produkt/kontorsstol-svart-linne-dubbelstoppad): Bredd
- [Gungande knästol ljusgrå – vaggar på böjda medar, 120 kg](https://www.fyndplats.se/produkt/gungande-knastol-ljusgra): Bredd
- [Gungande knästol grå – bred knädyna 48 cm för smalbenen](https://www.fyndplats.se/produkt/gungande-knastol-gra): Bredd
- [Gungande knästol i kräm – 7,5 cm dynor, ljus plywoodram](https://www.fyndplats.se/produkt/gungande-knastol-kram): Bredd
- [Skrivbordsstol turkos med nätrygg – 55 cm bred, väger 8,5 kg](https://www.fyndplats.se/produkt/skrivbordsstol-turkos-natrygg): Bredd, Material
- [Skrivbordsstol rosa med nätrygg – 55 cm bred, väger 8,5 kg](https://www.fyndplats.se/produkt/skrivbordsstol-rosa-natrygg): Bredd, Material
- [Skrivbordsstol ljusgrå med nätrygg – 55 cm bred, väger 8,5 kg](https://www.fyndplats.se/produkt/skrivbordsstol-ljusgra-natrygg): Bredd, Material
- [Ritstol med svankstöd – 53 cm bred sits och uppfällbara armstöd](https://www.fyndplats.se/produkt/ritstol-med-svankstod): Bredd, Material
- [Skrivbordsstol rosa med hel hjärtrygg – sitthöjd 43–53 cm](https://www.fyndplats.se/produkt/skrivbordsstol-rosa-hel-hjartrygg): Bredd
- [Rullpall svart med rygg – sitthöjd 43–55 cm, bär 136 kg](https://www.fyndplats.se/produkt/rullpall-svart-rygg-43-55-cm): Bredd
- [Arbetspall med rygg och fotring – sitthöjd 49–65 cm](https://www.fyndplats.se/produkt/arbetspall-rygg-och-fotring): Bredd
- [Rullpall beige med rygg – sitthöjd 43–55 cm, bär 136 kg](https://www.fyndplats.se/produkt/rullpall-beige-rygg-43-55-cm): Bredd
- [Sadelpall grå med svart fot – sitthöjd 45–59 cm, utan ryggstöd](https://www.fyndplats.se/produkt/sadelpall-gra-svart-fot-45-59-cm): Bredd
- [Sadelpall på hjul 49–61 cm – rosa, utan ryggstöd](https://www.fyndplats.se/produkt/sadelpall-hjul-49-61-cm-rosa): Bredd
- [Rullpallar 2-pack – sitthöjd 48–63 cm, rutstickad sits](https://www.fyndplats.se/produkt/rullpallar-2-pack-48-63-cm): Bredd
- [Rullpallar 2-pack med låg rygg – sitthöjd 47–62 cm, 120 kg per pall](https://www.fyndplats.se/produkt/rullpallar-2-pack-lag-rygg-47-62-cm): Bredd
- [Arbetsstol med hjul och rygg – höjd 50–64 cm, 360° snurr, max 120 kg](https://www.fyndplats.se/produkt/arbetsstol-med-hjul-och-rygg): Bredd
- [Arbetspall med hjul – höjdjusterbar rullpall i konstläder, 360° vridbar](https://www.fyndplats.se/produkt/arbetspall-med-hjul): Bredd
- [Sadelpall på hjul i svart konstläder – sitthöjd 55–71 cm, bär 120 kg](https://www.fyndplats.se/produkt/sadelpall-hjul-svart-konstlader): Sitthöjd
- [Kontorsstol med utdragbart fotstöd, 140°](https://www.fyndplats.se/produkt/kontorsstol-utdragbart-fotstod-140-grader): Sitthöjd
- [Kontorsstol svart nätrygg – uppfällbara armstöd, vridbart nackstöd](https://www.fyndplats.se/produkt/kontorsstol-svart-mesh-uppfallbara-armstod): Sitthöjd
- [Kontorsstol vit ram, grå nätrygg – uppfällbara armstöd](https://www.fyndplats.se/produkt/kontorsstol-vit-ram-gra-mesh-uppfallbara-armstod): Sitthöjd
- [Knästol på hjul, svart konstläder](https://www.fyndplats.se/produkt/knastol-pa-hjul-svart-konstlader): Sitthöjd
- [Ergonomisk knästol i björk med vaggfunktion, grå](https://www.fyndplats.se/produkt/ergonomisk-knastol-bjork-vaggfunktion-gra): Sitthöjd
- [Höjdjusterbar skrivbordsstol i konstläder, vit](https://www.fyndplats.se/produkt/skrivbordsstol-vit-hojdjusterbar): Sitthöjd
- [Kontorsstol vit i konstläder – ergonomisk, höj- och sänkbar med armstöd](https://www.fyndplats.se/produkt/kontorsstol-vit-konstlader): Sitthöjd
- [Knästol med ryggstöd i manchester – vaggande, kräm eller grå](https://www.fyndplats.se/produkt/knastol-ryggstod-manchester): Material

### tradgardsdekor-belysning (108 produkter)

Filter: Höjd (69 %, syns), Material (69 %, syns), Bredd (73 %, syns)

- [Ljusslinga 18 m med 50 LED-lampor – varmt retroljus, IP44, för ute och inne](https://www.fyndplats.se/produkt/ljusslinga-18-m-50-led-lampor-ip44): Höjd
- [Uppblåsbar ren 180 cm med LED och rött täcke](https://www.fyndplats.se/produkt/uppblasbar-ren-180-cm-med-led): Höjd, Material, Bredd
- [Uppblåsbar tomte i släde med ren och hund 190 cm, 8 LED](https://www.fyndplats.se/produkt/uppblasbar-tomte-i-slade-med-ren-och-hund-190-cm): Höjd, Bredd
- [Konstgjorda lavendelklot 2-pack Ø42 cm – 225 blommor](https://www.fyndplats.se/produkt/konstgjorda-lavendelklot-2-pack-42-cm): Höjd
- [Konstgjorda lavendelträd 2-pack 70 cm – vita blommor](https://www.fyndplats.se/produkt/konstgjorda-lavendeltrad-2-pack-70-cm): Höjd
- [Solcellslyktor 2-pack i konstrotting – 45 och 35 cm, ljus nedåt](https://www.fyndplats.se/produkt/solcellslyktor-2-pack-45-och-35-cm-konstrotting): Höjd, Bredd
- [Lysande jultomte 93 cm – 97 LED med fast sken eller blink](https://www.fyndplats.se/produkt/lysande-jultomte-93-cm-97-led): Höjd, Material, Bredd
- [Lysande snögubbefamilj i tre delar – 128 LED, högsta 91,5 cm](https://www.fyndplats.se/produkt/lysande-snogubbefamilj-tre-delar-128-led): Höjd, Material, Bredd
- [Uppblåsbar jättelieman 3,7 m med nio LED](https://www.fyndplats.se/produkt/uppblasbar-jattelieman-37-m): Höjd, Material, Bredd
- [Lysande ren med släde – 170 LED, renen 118 cm hög](https://www.fyndplats.se/produkt/lysande-ren-med-slade-170-led): Höjd, Material, Bredd
- [Uppblåsbar pepparkaksgubbe 245 cm med polkagriskäpp och tre paket](https://www.fyndplats.se/produkt/uppblasbar-pepparkaksgubbe-245-cm-med-polkagriskapp): Höjd, Bredd
- [Uppblåsbar halloweenport 3 × 3 m med fyra spöken och LED](https://www.fyndplats.se/produkt/uppblasbar-halloweenport-fyra-spoken): Höjd, Material
- [Uppblåsbar jultomte i skorsten 210 cm – vinkar och lyser](https://www.fyndplats.se/produkt/uppblasbar-jultomte-skorsten-210-cm): Höjd, Material, Bredd
- [Uppblåsbar lieman-port 2,85 m med lysande röda ögon](https://www.fyndplats.se/produkt/uppblasbar-lieman-port-285-m): Höjd, Material, Bredd
- [Uppblåsbart pumpspöke 240 cm med grönt sken och tre pumpor](https://www.fyndplats.se/produkt/uppblasbart-pumpspoke-240-cm): Höjd, Material, Bredd
- [Uppblåsbart spökträd 240 cm med gravsten, zombie och pumpa](https://www.fyndplats.se/produkt/uppblasbart-spoktrad-240-cm): Höjd, Material, Bredd
- [Uppblåsbar dödskallefigur 210 cm med horn och blått sken](https://www.fyndplats.se/produkt/uppblasbar-dodskallefigur-210-cm-horn): Höjd, Material, Bredd
- [Uppblåsbar pumpa med svart katt som åker upp och ner](https://www.fyndplats.se/produkt/uppblasbar-pumpa-med-katt): Höjd, Material, Bredd
- [Uppblåsbart halloweenträd 274 cm med uggla, spöke och pumpor](https://www.fyndplats.se/produkt/uppblasbart-halloweentrad-274-cm): Höjd, Material, Bredd
- [Uppblåsbart pumpspöke 270 cm med grön kropp och sex LED](https://www.fyndplats.se/produkt/uppblasbart-pumpspoke-270-cm): Höjd, Material, Bredd
- [Uppblåsbart spöke 240 cm med blinkande ögon och lyst mage](https://www.fyndplats.se/produkt/uppblasbart-spoke-240-cm-blinkande-ogon): Höjd, Material, Bredd
- [Uppblåsbart spöke 180 cm med pumpa på huvudet](https://www.fyndplats.se/produkt/uppblasbart-spoke-180-cm-pumpa-pa-huvudet): Höjd, Material, Bredd
- [Konstgjord häck på rulle 300 × 150 cm – UV-beständigt insynsskydd](https://www.fyndplats.se/produkt/konstgjord-hack-rulle-300x150-cm-insynsskydd): Höjd
- [Konstgjord häck på rulle 300 × 100 cm med lönnliknande blad](https://www.fyndplats.se/produkt/konstgjord-hack-pa-rulle-300x100-cm): Höjd
- [Uppblåsbart spöke 180 cm med 130 cm vingbredd](https://www.fyndplats.se/produkt/uppblasbart-spoke-180-cm-brett): Höjd, Material, Bredd
- [Uppblåsbart spökträd 240 cm med uggla och tre pumpor](https://www.fyndplats.se/produkt/uppblasbart-spoktrad-240-cm-uggla): Höjd, Material, Bredd
- [Konstgjorda eukalyptusklot 2-pack Ø52 cm – UV-beständiga](https://www.fyndplats.se/produkt/konstgjorda-eukalyptusklot-2-pack-52-cm): Höjd
- [Konstgjorda cypresser 2-pack 90 cm – gråa dekorkrukor ingår](https://www.fyndplats.se/produkt/konstgjorda-cypresser-2-pack-90-cm-dekorkruka): Höjd, Bredd
- [Uppblåsbar pumpa 180 cm med tre spöken som reser sig](https://www.fyndplats.se/produkt/uppblasbar-pumpa-180-cm-tre-spoken): Höjd, Material, Bredd
- [Uppblåsbart pumpträd 240 cm med fyra pumpor i grenarna](https://www.fyndplats.se/produkt/uppblasbart-pumptrad-240-cm): Höjd, Material, Bredd
- [Tre uppblåsbara häxor runt en kittel – 180 cm hög grupp](https://www.fyndplats.se/produkt/uppblasbara-haxor-med-kittel-180-cm): Höjd, Material, Bredd
- [Fågelmatare med kamera 2K HD, AI-igenkänning och soldriven](https://www.fyndplats.se/produkt/fagelmatare-med-kamera): Höjd, Material, Bredd
- [Trädgårdsfontän med pump – 2 plan vattenfall i trä, rustik design](https://www.fyndplats.se/produkt/tradgardsfontan-med-pump): Höjd, Bredd
- [Vägglampa utomhus i retro-stil – E27, IP45, svart](https://www.fyndplats.se/produkt/vagglampa-utomhus-retro-e27-ip45): Höjd
- [Uppblåsbar pepparkaksgubbe 240 cm med polkagris och halsduk – fem LED och fläkt](https://www.fyndplats.se/produkt/uppblasbar-pepparkaksgubbe-240-cm-polkagris): Material
- [Uppblåsbar tomte med solglasögon på motorcykel, 165 cm – varmvita LED](https://www.fyndplats.se/produkt/uppblasbar-tomte-solglasogon-motorcykel-165): Material
- [Julgranar 2-pack 57 cm med LED och jordspjut](https://www.fyndplats.se/produkt/julgranar-2-pack-57-cm-med-led-och-jordspjut): Material
- [Uppblåsbar pepparkaksgubbe 250 cm med presentask och LED](https://www.fyndplats.se/produkt/uppblasbar-pepparkaksgubbe-250-cm-med-presentask): Material
- [Uppblåsbar halloweenfigur 210 cm med lysande pumphuvud](https://www.fyndplats.se/produkt/uppblasbar-halloweenfigur-pumphuvud-210-cm): Material
- [Uppblåsbart krypande skelett 153 cm för halloween](https://www.fyndplats.se/produkt/uppblasbart-krypande-skelett-halloween): Material
- [Uppblåsbart jätteskelett 310 cm med blodröd tunga](https://www.fyndplats.se/produkt/uppblasbart-jatteskelett-310-cm): Material
- [Plantetagerie med spaljé, tvåstegs, 166 cm](https://www.fyndplats.se/produkt/plantetagerie-spalje-tvastegs): Material
- [Förvaringslåda med spaljé och 4 hyllor, massiv gran](https://www.fyndplats.se/produkt/forvaringslada-spalje-4-hyllor-massiv-gran): Material
- [Trallplattor i akacia 10-pack – 31 × 31 cm, täcker 0,91 m²](https://www.fyndplats.se/produkt/trallplattor-akacia-10-pack): Material
- [Trädgårdsfontän 72 cm med LED – fem skålar i resin](https://www.fyndplats.se/produkt/tradgardsfontan-72-cm-led-fem-skalar): Material
- [Trädgårdsfontän 60 cm i resin – fyra skålar och pump](https://www.fyndplats.se/produkt/tradgardsfontan-60-cm-fyra-skalar): Material
- [Konstgjort blåregn 165 cm med vita blomklasar – böjbara grenar](https://www.fyndplats.se/produkt/konstgjort-blaregn-165-cm-vita-blomklasar): Bredd
- [Konstgjord buxbom 2-pack 90 cm – tre klot per träd, cementfylld kruka](https://www.fyndplats.se/produkt/konstgjord-buxbom-2-pack-90-cm-tre-klot): Bredd
- [Konstgjort träd, formklippt ceder 91 cm för inne och ute](https://www.fyndplats.se/produkt/konstgjort-trad): Bredd

### speglar (57 produkter)

Filter: Placering (44 %, syns), Höjd (61 %, syns), Form (67 %, syns)

- [Rund spegel med belysning Ø70 cm – LED i tre ljusfärger, antiimma och IP44](https://www.fyndplats.se/produkt/rund-spegel-med-belysning-70-cm): Placering
- [Hallspegel 60 × 80 cm med vit ram – hängs stående eller liggande](https://www.fyndplats.se/produkt/hallspegel-60x80-vit-ram): Placering, Höjd
- [Smyckesskåp med spegel och LED – 120 cm, för dörr eller vägg, låsbart](https://www.fyndplats.se/produkt/smyckesskap-dorr-spegel-120-cm-led): Placering
- [Badrumsspegel med belysning 70 × 100 cm – antimist, tre ljusfärger och touch](https://www.fyndplats.se/produkt/badrumsspegel-med-belysning-70x100-antimist): Placering
- [Helkroppsspegel med belysning 40 × 120 cm – ramlös, dimbar LED och touch](https://www.fyndplats.se/produkt/helkroppsspegel-med-belysning-40x120-ramlos): Placering
- [Badrumsspegel med belysning och glashylla – välvd överkant, 50 × 70 cm](https://www.fyndplats.se/produkt/badrumsspegel-belysning-glashylla-valvd): Placering, Form
- [Asymmetrisk spegel i två storlekar – väggspeglar som kiselstenar, svart ram](https://www.fyndplats.se/produkt/asymmetrisk-spegel-tva-vaggspeglar): Placering, Form
- [Sminkspegel LED 80 × 60 cm med antiimma](https://www.fyndplats.se/produkt/sminkspegel-led-80x60-antiimma): Placering
- [Bågformad badrumsspegel LED 60 × 90 cm, svart](https://www.fyndplats.se/produkt/bagformad-badrumsspegel-led-60x90-svart): Placering, Höjd, Form
- [Rektangulär LED-spegel för badrum 90 × 60 cm – svart ram, antiimma och IP44](https://www.fyndplats.se/produkt/led-spegel-badrum-90x60-svart-ram): Placering
- [Badrumsspegel LED 100 × 80 cm med Bluetooth och klocka](https://www.fyndplats.se/produkt/badrumsspegel-led-100x80-bluetooth-klocka): Placering, Höjd
- [Badrumsspegel LED 80 × 60 cm med Bluetooth och klocka](https://www.fyndplats.se/produkt/badrumsspegel-led-80x60-bluetooth-klocka): Placering, Höjd
- [Badrumsspegel LED 90 × 70 cm med Bluetooth och klocka](https://www.fyndplats.se/produkt/badrumsspegel-led-90x70-bluetooth-klocka): Placering, Höjd
- [Badrumsspegel LED 70 × 50 cm med Bluetooth och klocka](https://www.fyndplats.se/produkt/badrumsspegel-led-70x50-bluetooth-klocka): Placering, Höjd
- [Badrumsspegel LED 100 × 60 cm, dimbar](https://www.fyndplats.se/produkt/badrumsspegel-led-100x60-dimbar): Placering, Höjd
- [Rund spegel Ø70 cm med guldfärgad ram i stål – splitterskydd och två krokar](https://www.fyndplats.se/produkt/rund-spegel-70-cm-guldfargad-ram): Placering
- [Bågformad badrumsspegel 50 × 70 cm, svart ram](https://www.fyndplats.se/produkt/bagformad-badrumsspegel-50x70-svart): Placering, Höjd, Form
- [Spegel 50 × 70 cm med svart ram och rundade hörn – hängs stående eller liggande](https://www.fyndplats.se/produkt/spegel-50x70-svart-ram-rundade-horn): Placering, Form
- [Asymmetrisk LED-spegel 50 × 70 cm – tre ljusfärger, antiimma och IP44](https://www.fyndplats.se/produkt/asymmetrisk-led-spegel-50x70-antiimma): Placering, Form
- [Badrumsspegel LED 60 × 80 cm, stående](https://www.fyndplats.se/produkt/badrumsspegel-led-60x80-staende): Placering, Höjd
- [Badrumsspegel LED 70 × 90 cm, stående](https://www.fyndplats.se/produkt/badrumsspegel-led-70x90-staende): Placering, Höjd
- [Badrumsspegel LED 50 × 70 cm, stående](https://www.fyndplats.se/produkt/badrumsspegel-led-50x70-staende): Placering, Höjd
- [Badrumsspegel LED 80 × 60 cm med 3× förstoringsspegel](https://www.fyndplats.se/produkt/badrumsspegel-led-80x60-forstoringsspegel): Placering, Höjd
- [Rund badrumsspegel LED Ø 60 cm](https://www.fyndplats.se/produkt/rund-badrumsspegel-led-60-cm): Placering, Höjd
- [LED-spegel för badrum 70 × 90 cm – tre ljusfärger, antiimma och IP44](https://www.fyndplats.se/produkt/led-spegel-badrum-70x90-antiimma): Placering
- [LED-spegel för badrum 60 × 80 cm – ljus fram och bak, dimbar och antiimma](https://www.fyndplats.se/produkt/led-spegel-badrum-60x80-dimbar): Placering
- [LED-spegel för badrum 50 × 70 cm – raka hörn, touchknapp och IP44](https://www.fyndplats.se/produkt/led-spegel-badrum-50x70-raka-horn): Placering, Form
- [Hollywoodspegel med belysning, 80 × 60 cm – 12 dimbara LED-lampor och touch](https://www.fyndplats.se/produkt/hollywoodspegel-med-belysning-80x60-cm): Placering, Form
- [Spegel med guldram i barockstil – 60 × 87 cm, avtagbara ornament](https://www.fyndplats.se/produkt/spegel-guldram-barock): Placering
- [Rund spegel Ø61 cm med silverfärgad ram i aluminium – för badrum och hall](https://www.fyndplats.se/produkt/rund-spegel-61-cm-silver-aluminium): Placering, Höjd
- [Väggdekoration med fyra runda speglar i guld – 107 × 56 cm i metall](https://www.fyndplats.se/produkt/vaggdekoration-fyra-runda-speglar-guld): Placering
- [Badrumsspegel LED med Bluetooth, klocka och antiimma – 70x50 / 80x60 cm](https://www.fyndplats.se/produkt/badrumsspegel-led-bluetooth-klocka-antiimma): Placering
- [Helkroppsspegel med bågform i svart – golvspegel i aluminium, 161,5 × 50 cm](https://www.fyndplats.se/produkt/helkroppsspegel-bagform-svart): Höjd, Form
- [Väggspegel 40 × 60 cm med svart ram – hängs stående eller liggande](https://www.fyndplats.se/produkt/vaggspegel-40x60-svart-ram): Höjd
- [Väggspegel 70 × 90 cm med svart ram – hängs stående eller liggande](https://www.fyndplats.se/produkt/vaggspegel-70x90-svart-ram): Höjd
- [Väggspegel 50 × 70 cm med svart ram – hängs stående eller liggande](https://www.fyndplats.se/produkt/vaggspegel-50-x-70-cm-svart-ram): Höjd
- [Fönsterspegel i guld 70 × 50 cm med valvbåge – spröjsad väggspegel i metall](https://www.fyndplats.se/produkt/fonsterspegel-guld-70x50-valvbage): Höjd, Form
- [Oregelbunden badrumsspegel LED 70x50 / 80x60 cm – asymmetrisk med antiimma](https://www.fyndplats.se/produkt/oregelbunden-badrumsspegel-led-antiimma): Höjd, Form
- [Fönsterspegel svart 76x149 cm – 3 delar, väggspegel med metallram](https://www.fyndplats.se/produkt/fonsterspegel-svart-76x149-cm-3-delar-vaggspegel): Höjd, Form
- [Dekorativ väggspegel svart – oregelbunden & bågformad, 116 cm](https://www.fyndplats.se/produkt/dekorativ-vaggspegel-svart-oregelbunden): Höjd, Form
- [Väggspegel med hylla – svart metallram med rundade övre hörn, 70 × 50 cm](https://www.fyndplats.se/produkt/vaggspegel-hylla-svart-metallram-70-cm): Form
- [Väggspegel i organisk form med ram i furufaner – 91,5 × 45 cm, färdig att hänga](https://www.fyndplats.se/produkt/vaggspegel-organisk-form-furufaner): Form
- [Helkroppsspegel i bågform, guld, 150 cm](https://www.fyndplats.se/produkt/helkroppsspegel-bagform-guld-150cm): Form
- [Organisk väggspegel 80 × 60 cm med ram i furu – hängs liggande eller stående](https://www.fyndplats.se/produkt/organisk-vaggspegel-80x60-furu): Form
- [Fönsterspegel svart 65 × 110 cm med valvbåge – väggspegel med spröjs i aluminium](https://www.fyndplats.se/produkt/fonsterspegel-svart-65x110-valvbage): Form

### burar-klader-tillbehor (153 produkter)

Filter: Material (83 %, syns), Bredd (90 %, syns), Längd (93 %, syns), Höjd (93 %, syns)

- [Hönsrede i trä med sex fack på två plan](https://www.fyndplats.se/produkt/honsrede-tra-6-fack): Material
- [Hönshage 3,9 m² att gå in i, med två reden](https://www.fyndplats.se/produkt/honshage-3-9-kvm-gangbar): Material
- [Hamsterbur i trä med förvaringshylla, 84 × 53 × 110 cm](https://www.fyndplats.se/produkt/hamsterbur-med-forvaringshylla): Material
- [Hönsgård 168 × 183 cm med ståhöjd – 3,07 m², två reden och delad dörr](https://www.fyndplats.se/produkt/honsgard-168x183-cm-stahojd): Material
- [Hönshus med rastgård 236,5 cm – tredelat rede och 1,9 m² för 3–4 höns](https://www.fyndplats.se/produkt/honshus-rastgard-236-cm-tredelat-rede): Material
- [Smådjursbur 150 cm med fem plan – hängmatta, ramper och hjul](https://www.fyndplats.se/produkt/smadjursbur-fem-plan-150-cm): Material, Bredd, Längd, Höjd
- [Hönshus 280 cm med rastgård – du går in själv, sittpinne 137 cm](https://www.fyndplats.se/produkt/honshus-280-cm-rastgard-gaende): Material, Bredd, Längd, Höjd
- [Hönsgård 280 cm grå – 5,2 m² med fyra värpreden och gånghöjd](https://www.fyndplats.se/produkt/honsgard-280-cm-gra-fyra-varpreden): Material, Bredd, Längd, Höjd
- [Hönshus 247 cm med två utegårdar – upphöjt hus, ramp och värprede](https://www.fyndplats.se/produkt/honshus-247-cm-tva-utegardar): Material
- [Kaninhus 144 cm i två plan med bitumentak](https://www.fyndplats.se/produkt/kaninhus-144-cm-tva-plan-bitumentak): Material
- [Hönshus i granträ 347 cm med rasthage – två sittpinnar och utdragbar bricka](https://www.fyndplats.se/produkt/honshus-grantra-347-cm-rasthage): Material, Bredd, Längd, Höjd
- [Rasthage för smådjur 220 × 103 cm med tak och markspett](https://www.fyndplats.se/produkt/rasthage-smadjur-220-103-cm-tak): Material
- [Sköldpaddshus 91 cm utan botten med nätlock och sidoluckor, gråbrunt](https://www.fyndplats.se/produkt/skoldpaddshus-91-grabrun): Material
- [Sköldpaddshus 91 cm utan botten med nätlock och sidoluckor, blått](https://www.fyndplats.se/produkt/skoldpaddshus-91-bla): Material
- [Sköldpaddshus 91 cm utan botten med nätlock och sidoluckor, grått](https://www.fyndplats.se/produkt/skoldpaddshus-91-gra): Material
- [Kattgård utomhus 191 cm – hus, rastgård och tre plattformar](https://www.fyndplats.se/produkt/kattgard-utomhus-191-cm): Material
- [Kattstuga utomhus 77 cm i barrträ – två ingångar och fönster](https://www.fyndplats.se/produkt/kattstuga-utomhus-77-cm): Material
- [Litet katthus utomhus 57 cm i barrträ – lucka och fönster](https://www.fyndplats.se/produkt/litet-katthus-utomhus-57-cm): Material
- [Katthus med uppfällbart tak 87 cm – låg modell i barrträ](https://www.fyndplats.se/produkt/katthus-uppfallbart-tak-87-cm): Material
- [Katthåla 50 cm i flätat rep – krämvit kudde och 38 cm öppning](https://www.fyndplats.se/produkt/katthala-50-cm-flatat-rep): Material
- [Hopfällbar hage för hund och katt – nätfönster, dörrar och topplucka, 94 × 74 cm](https://www.fyndplats.se/produkt/hopfallbar-hage-hund-katt-natfonster): Material
- [Hundbur i metall med topplucka – uttagbar bottenbricka och hjul, 94 cm](https://www.fyndplats.se/produkt/hundbur-i-metall-med-topplucka): Material
- [Upphöjd hundbädd med kantkudde – 90 × 65 eller 110 × 75 cm, nätbotten](https://www.fyndplats.se/produkt/upphojd-hundbadd-kantkudde-natbotten): Material
- [Valphage 8 paneler – 61 × 76 cm per panel, oktagon eller avdelare](https://www.fyndplats.se/produkt/valphage-8-paneler): Material, Bredd, Höjd
- [Marsvinsbur inomhus i trä 90 × 53 × 59 cm – ramp, hydda och hjul](https://www.fyndplats.se/produkt/marsvinsbur-inomhus-tra-90x53x59): Material
- [Hönsgård med tak 300 cm – galvaniserad utegård för höns med UV-skydd](https://www.fyndplats.se/produkt/honsgard-med-tak-galvaniserad-utegard-for-hons): Material
- [Hundgrind utan borrning, 76–107 cm – klämmontage, dörr och svart stål](https://www.fyndplats.se/produkt/hundgrind-utan-borrning-76-107-cm-svart): Bredd, Längd
- [Dörrgrind 74,5–111,5 cm med skruvmontage](https://www.fyndplats.se/produkt/dorrgrind-74-111-cm-skruvmontage): Bredd, Längd
- [Dörrgrind 75–85 cm med kattlucka](https://www.fyndplats.se/produkt/dorrgrind-75-85-cm-med-kattlucka): Bredd, Längd
- [Dörrgrind för hund med klämmontage – 75–95 cm, dörr som öppnas åt båda hållen](https://www.fyndplats.se/produkt/dorrgrind-hund-klammontage-75-95-cm): Bredd, Höjd
- [Hundgrind 180 cm i metall med gånggrind](https://www.fyndplats.se/produkt/hundgrind-180-cm-metall-med-ganggrind): Bredd, Längd, Höjd
- [Hundgrind i furu, 113–166 cm bred](https://www.fyndplats.se/produkt/hundgrind-furu-113-166-cm-bred): Bredd
- [Valphage 91 cm hög – paneler 61 cm, dörr med tre reglar](https://www.fyndplats.se/produkt/valphage-91-cm-atta-paneler): Bredd, Höjd
- [Upphöjd hundbädd 76 cm med nätpanel](https://www.fyndplats.se/produkt/upphojd-hundbadd-76-cm-natpanel): Bredd, Höjd
- [Hundgrind 72–107 cm – 76 cm hög, kläms fast utan borrning](https://www.fyndplats.se/produkt/hundgrind-72-107-cm): Bredd
- [Hopfällbar hundhage i metall med tak – 8 paneler, 76 cm](https://www.fyndplats.se/produkt/hopfallbar-hundhage-metall-8-paneler): Bredd, Längd
- [Hopfällbar hundgård med soltak – för valp, hund och katt](https://www.fyndplats.se/produkt/hopfallbar-hundgard-med-soltak): Bredd, Längd, Höjd

### badrum-hemtextil (107 produkter)

Filter: Höjd (79 %, syns), Material (92 %, syns), Bredd (95 %, syns)

- [Tvättmaskinshylla 67 × 162 cm med torkstång](https://www.fyndplats.se/produkt/tvattmaskinshylla-67x162-torkstang): Höjd
- [Vardagsrumsmatta 160 × 230 cm – grå med abstrakt mönster, halkfri baksida](https://www.fyndplats.se/produkt/vardagsrumsmatta-160x230-gra): Höjd
- [Hängskåp badrum 80 × 30 cm med uppfällbar lucka](https://www.fyndplats.se/produkt/hangskap-badrum-80x30-uppfallbar): Höjd
- [Högskåp badrum 60 × 171 cm med tippbar tvättkorg](https://www.fyndplats.se/produkt/hogskap-badrum-60x171-tvattkorg): Höjd
- [Bågformad badrumsspegel LED 60 × 90 cm, svart](https://www.fyndplats.se/produkt/bagformad-badrumsspegel-led-60x90-svart): Höjd
- [Badrumsspegel LED 100 × 80 cm med Bluetooth och klocka](https://www.fyndplats.se/produkt/badrumsspegel-led-100x80-bluetooth-klocka): Höjd, Material
- [Badrumsspegel LED 80 × 60 cm med Bluetooth och klocka](https://www.fyndplats.se/produkt/badrumsspegel-led-80x60-bluetooth-klocka): Höjd
- [Badrumsspegel LED 90 × 70 cm med Bluetooth och klocka](https://www.fyndplats.se/produkt/badrumsspegel-led-90x70-bluetooth-klocka): Höjd
- [Badrumsspegel LED 70 × 50 cm med Bluetooth och klocka](https://www.fyndplats.se/produkt/badrumsspegel-led-70x50-bluetooth-klocka): Höjd
- [Smalt högskåp badrum 20 × 185 cm, vitt](https://www.fyndplats.se/produkt/smalt-hogskap-badrum-20x185-vitt): Höjd
- [Badrumsspegel LED 100 × 60 cm, dimbar](https://www.fyndplats.se/produkt/badrumsspegel-led-100x60-dimbar): Höjd
- [Bågformad badrumsspegel 50 × 70 cm, svart ram](https://www.fyndplats.se/produkt/bagformad-badrumsspegel-50x70-svart): Höjd
- [Badrumsspegel LED 60 × 80 cm, stående](https://www.fyndplats.se/produkt/badrumsspegel-led-60x80-staende): Höjd
- [Badrumsspegel LED 70 × 90 cm, stående](https://www.fyndplats.se/produkt/badrumsspegel-led-70x90-staende): Höjd
- [Badrumsspegel LED 50 × 70 cm, stående](https://www.fyndplats.se/produkt/badrumsspegel-led-50x70-staende): Höjd
- [Badrumsspegel LED 80 × 60 cm med 3× förstoringsspegel](https://www.fyndplats.se/produkt/badrumsspegel-led-80x60-forstoringsspegel): Höjd
- [Rund badrumsspegel LED Ø 60 cm](https://www.fyndplats.se/produkt/rund-badrumsspegel-led-60-cm): Höjd
- [Nischvagn badrum 16 cm på hjul](https://www.fyndplats.se/produkt/nischvagn-badrum-16-cm-hjul): Höjd, Bredd
- [Tvättställsskåp 60 cm i ek med rottingluckor](https://www.fyndplats.se/produkt/tvattstallsskap-60-cm-ek-rotting): Höjd, Bredd
- [Oregelbunden badrumsspegel LED 70x50 / 80x60 cm – asymmetrisk med antiimma](https://www.fyndplats.se/produkt/oregelbunden-badrumsspegel-led-antiimma): Höjd
- [Ställbar kilkudde för säng – ortopedisk med nackrulle i minnesskum](https://www.fyndplats.se/produkt/stallbar-kilkudde-sang-minnesskum): Höjd, Material, Bredd
- [Toalettförhöjning med armstöd – höjer sitthöjden 9 cm, för rund toalett](https://www.fyndplats.se/produkt/toalettforhojning-med-armstod-9-cm): Höjd, Bredd
- [Rektangulär LED-spegel för badrum 90 × 60 cm – svart ram, antiimma och IP44](https://www.fyndplats.se/produkt/led-spegel-badrum-90x60-svart-ram): Material
- [Asymmetrisk LED-spegel 50 × 70 cm – tre ljusfärger, antiimma och IP44](https://www.fyndplats.se/produkt/asymmetrisk-led-spegel-50x70-antiimma): Material
- [Ergonomisk nackkudde i minnesskum med axelurtag](https://www.fyndplats.se/produkt/ergonomisk-nackkudde-minnesskum-axelurtag): Material
- [Väggskåp för badrum 60 cm – ladugårdsdörrar och öppen hylla](https://www.fyndplats.se/produkt/vaggskap-badrum-60-cm-ladugardsdorrar): Material
- [Spegelskåp badrum 60 cm – tre öppna hyllor i ljus ek](https://www.fyndplats.se/produkt/spegelskap-badrum-60-cm-oppna-hyllor): Material
- [Smalt badrumsskåp 20 cm – högskåp 180 cm med låda, 4 fack och 2 skåp](https://www.fyndplats.se/produkt/smalt-badrumsskap-20-cm-hogskap): Material
- [Duschmatta i trä 91×51 cm – halkfri badrumsmatta i akaciaträ med dränering](https://www.fyndplats.se/produkt/duschmatta-tra-akacia-91x51): Material
- [Duschstol med ryggstöd och armstöd – höj- och sänkbar, halkfri, max 158 kg](https://www.fyndplats.se/produkt/duschstol-med-ryggstod): Bredd

### konstvaxter (68 produkter)

Filter: Bredd (69 %, syns), Höjd (82 %, syns)

- [Konstgjord ficus benjamina 150 cm – täta gröna blad och kruka i betong](https://www.fyndplats.se/produkt/konstgjord-ficus-benjamina-150-cm): Bredd
- [Konstgjort buxbomsträd 90 cm – tre klot på tvinnade stammar, cementfylld kruka](https://www.fyndplats.se/produkt/konstgjort-buxbomstrad-90-cm-tre-klot): Bredd, Höjd
- [Konstgjord bananväxt 150 cm med 18 blad – i kruka med cement](https://www.fyndplats.se/produkt/konstgjord-bananvaxt-150-cm-18-blad): Bredd, Höjd
- [Konstgjord palm 160 cm med 36 blad – böjbara grenar och kruka med cement](https://www.fyndplats.se/produkt/konstgjord-palm-160-cm): Bredd
- [Konstgjord palm 100 cm med 27 blad – fem stammar och kruka med cement](https://www.fyndplats.se/produkt/konstgjord-palm-100-cm-27-blad): Bredd
- [Konstgjord växt 95 cm med 33 blad – kruka med cementbotten, inne och ute](https://www.fyndplats.se/produkt/konstgjord-vaxt-95-cm-33-blad): Bredd
- [Stor konstväxt: dieffenbachia 120 cm med gulrandiga blad och kruka med cement](https://www.fyndplats.se/produkt/stor-konstvaxt-dieffenbachia-120-cm): Bredd
- [Konstgjord dieffenbachia 95 cm – gulrandiga blad och kruka med cement](https://www.fyndplats.se/produkt/konstgjord-dieffenbachia-95-cm-cementkruka): Bredd, Höjd
- [Konstgjort blåregn 165 cm med vita blomklasar – böjbara grenar](https://www.fyndplats.se/produkt/konstgjort-blaregn-165-cm-vita-blomklasar): Bredd
- [Konstgjort bambuträd 180 cm i svart kruka](https://www.fyndplats.se/produkt/konstgjort-bambutrad-180-cm-svart-kruka): Bredd, Höjd
- [Konstgjorda cypresser 2-pack 90 cm – gråa dekorkrukor ingår](https://www.fyndplats.se/produkt/konstgjorda-cypresser-2-pack-90-cm-dekorkruka): Bredd, Höjd
- [Konstgjort olivträd 180 cm – sidenliknande blad och oliver](https://www.fyndplats.se/produkt/konstgjort-olivtrad-180-cm-sidenliknande-blad): Bredd
- [Konstgjord ficus 180 cm i PEVA – betongkruka och metallstomme](https://www.fyndplats.se/produkt/konstgjord-ficus-180-cm-peva-betongkruka): Bredd
- [Konstgjord buxbom 2-pack 90 cm – tre klot per träd, cementfylld kruka](https://www.fyndplats.se/produkt/konstgjord-buxbom-2-pack-90-cm-tre-klot): Bredd
- [Konstgjord buxbom 115 cm med tre klot](https://www.fyndplats.se/produkt/konstgjord-buxbom-115-cm-tre-klot): Bredd
- [Konstgjort träd 135 cm – ficus med 756 blad i kruka med cement](https://www.fyndplats.se/produkt/konstgjort-trad-ficus-135-cm): Bredd, Höjd
- [Konstgjord monstera 110 cm med elva blad och kruka](https://www.fyndplats.se/produkt/konstgjord-monstera-110-cm): Bredd
- [Konstgjord arecapalm 190 cm – tre stammar, inne eller ute](https://www.fyndplats.se/produkt/konstgjord-arecapalm-190-cm): Bredd
- [Konstgjort träd, formklippt ceder 91 cm för inne och ute](https://www.fyndplats.se/produkt/konstgjort-trad): Bredd
- [Konstgjord bananväxt 150 cm med kruka och 18 blad – underhållsfri konstväxt](https://www.fyndplats.se/produkt/konstgjord-bananvaxt): Bredd
- [Konstgjort olivträd – realistisk konstväxt i PE, 1,2–1,8 m för inredning](https://www.fyndplats.se/produkt/konstgjort-olivtrad): Bredd, Höjd
- [Konstgjorda lavendelklot 2-pack Ø42 cm – 225 blommor](https://www.fyndplats.se/produkt/konstgjorda-lavendelklot-2-pack-42-cm): Höjd
- [Konstgjorda lavendelträd 2-pack 70 cm – vita blommor](https://www.fyndplats.se/produkt/konstgjorda-lavendeltrad-2-pack-70-cm): Höjd
- [Konstgjord häck på rulle 300 × 150 cm – UV-beständigt insynsskydd](https://www.fyndplats.se/produkt/konstgjord-hack-rulle-300x150-cm-insynsskydd): Höjd
- [Konstgjord häck på rulle 300 × 100 cm med lönnliknande blad](https://www.fyndplats.se/produkt/konstgjord-hack-pa-rulle-300x100-cm): Höjd
- [Konstgjorda eukalyptusklot 2-pack Ø52 cm – UV-beständiga](https://www.fyndplats.se/produkt/konstgjorda-eukalyptusklot-2-pack-52-cm): Höjd

### barnmobler (50 produkter)

Filter: Maxlast (66 %, syns), Ålder (72 %, syns), Höjd (76 %, syns)

- [Pall för barn med tre steg och handtag – ställs om till två steg, 2–5 år](https://www.fyndplats.se/produkt/pall-for-barn-tre-steg-handtag): Maxlast
- [Barnsoffa i jordgubbsdesign – rosa, med två kuddar, 90 cm](https://www.fyndplats.se/produkt/barnsoffa-jordgubbsdesign-90-cm): Maxlast, Ålder
- [Barnpallar i björkplywood, fyra stapelbara – röd, grön, gul och blå, 30 cm höga](https://www.fyndplats.se/produkt/barnpallar-bjorkplywood-fyra-farger): Maxlast, Ålder
- [Barnfåtölj med fällbart ryggstöd – blå, fälls ut till 90 cm, bär 65 kg](https://www.fyndplats.se/produkt/barnfatolj-fallbart-ryggstod-bla): Maxlast, Ålder
- [Barnsoffa 77 cm för två barn – rosa, bär 80 kg](https://www.fyndplats.se/produkt/barnsoffa-77-cm-tva-barn-rosa): Maxlast, Ålder
- [Barnsoffa 77 cm för två barn – grå, bär 80 kg](https://www.fyndplats.se/produkt/barnsoffa-77-cm-tva-barn-gra): Maxlast, Ålder
- [Barnfåtölj i manchester – rosa, 4,8 kg, bär 45 kg](https://www.fyndplats.se/produkt/barnfatolj-manchester-rosa): Maxlast, Ålder
- [Barnfåtölj med pall – grå, rutmönstrad rygg, sitthöjd 25,5 cm](https://www.fyndplats.se/produkt/barnfatolj-med-pall-gra-rutmonstrad): Maxlast, Ålder
- [Barnfåtölj med fotpall i eukalyptus – rosa sammet, från 3 år](https://www.fyndplats.se/produkt/barnfatolj-fotpall-eukalyptus-rosa): Maxlast, Ålder
- [Barnfåtölj i linnelook – pastellblå, lös kudde, bär 65 kg](https://www.fyndplats.se/produkt/barnfatolj-linnelook-pastellbla): Maxlast, Ålder
- [Barnfåtölj med hjärtformad rygg – rosa konstläder, torkas av](https://www.fyndplats.se/produkt/barnfatolj-hjartformad-rygg-rosa): Maxlast, Ålder
- [Sminkbord barn 2-i-1 – avtagbar spegel, blir skrivbord, 79,5 cm](https://www.fyndplats.se/produkt/sminkbord-barn-2-i-1-avtagbar-spegel): Maxlast
- [Sminkbord barn med stol – rund spegel, två öppna fack, 3–8 år](https://www.fyndplats.se/produkt/sminkbord-barn-med-stol-rund-spegel): Maxlast
- [Utklädningsgarderob för barn med spegel – rosa barngarderob, 85 × 113 cm](https://www.fyndplats.se/produkt/utkladningsgarderob-barn-spegel-rosa): Maxlast, Ålder
- [Klädställning för barn i trä med spegel – Montessori utklädningsgarderob, 120 cm](https://www.fyndplats.se/produkt/kladstallning-barn-tra-spegel-montessori): Maxlast, Ålder
- [Barngarderob i trä med spegel, bokhylla & lådor – Montessori, 98 cm](https://www.fyndplats.se/produkt/barngarderob-tra-spegel-bokhylla-lador): Maxlast, Ålder
- [Utklädningsgarderob för barn med spegel och lådor – rosa, 60 cm](https://www.fyndplats.se/produkt/utkladningsgarderob-barn-spegel-lador-rosa): Maxlast, Ålder
- [Sminkbord för barn med hjärtvingar och pall – avtagbar spegel, rosa, från 3 år](https://www.fyndplats.se/produkt/sminkbord-barn-hjartvingar-pall): Höjd
- [Sminkbord för barn i rosa med pall – avtagbar spegel, blir skrivbord, 3–6 år](https://www.fyndplats.se/produkt/sminkbord-barn-rosa-avtagbar-spegel): Höjd
- [Sminkbord för barn med björnspegel och stol – rosa och vitt, stor låda, 3–8 år](https://www.fyndplats.se/produkt/sminkbord-barn-bjornspegel-rosa): Höjd
- [Runt barnbord med två molnstolar – vitt, nätpåse för leksaker i mitten, 3–6 år](https://www.fyndplats.se/produkt/runt-barnbord-molnstolar-vit): Höjd
- [Barnbord med två stolar i grått och vitt – furu, 56 × 52 cm, för 3–8 år](https://www.fyndplats.se/produkt/barnbord-tva-stolar-gra-vit): Höjd
- [Barnbord i blomform med två stolar och två pallar – förvaring i mitten, 3–8 år](https://www.fyndplats.se/produkt/barnbord-blomform-stolar-pallar): Höjd
- [Barnbord och fyra stolar i trä – runt bord 60 cm, sitsar i pastellfärger, 3–8 år](https://www.fyndplats.se/produkt/barnbord-fyra-stolar-runt-tra): Höjd
- [Barnskrivbord med björnstol – vitt med trädekor, stor låda, 80 cm, för 3–8 år](https://www.fyndplats.se/produkt/barnskrivbord-bjornstol-stor-lada): Höjd
- [Barnskrivbord med stol – vitt med trädekor, tre fack överst, 60 cm, för 3–8 år](https://www.fyndplats.se/produkt/barnskrivbord-med-stol-tre-fack): Höjd
- [Barnbord med två björnstolar – platta och förvaring i skivan, 60 × 60 cm, 3–6 år](https://www.fyndplats.se/produkt/barnbord-bjornstolar-forvaring-i-skivan): Höjd
- [Sminkbord för barn med tredelad spegel och pall – vit, 85 cm, för 3–6 år](https://www.fyndplats.se/produkt/sminkbord-barn-tredelad-spegel-pall): Höjd
- [Sminkbord barn – leksakssminkbord med spegel, ljus, ljud och pall, 31 delar](https://www.fyndplats.se/produkt/sminkbord-barn-leksakssminkbord-spegel-pall): Höjd

### vaxthus-odling (112 produkter)

Filter: Material (85 %, syns), Bredd (93 %, syns), Höjd (96 %, syns)

- [Odlingsbord med avtagbar drivbänk – 108,5 cm och underhylla](https://www.fyndplats.se/produkt/odlingsbord-med-drivbank-108-cm): Material
- [Stapelbar odlingslåda i tre plan – 120 × 80 cm, verktygsfri](https://www.fyndplats.se/produkt/stapelbar-odlingslada-tre-plan): Material
- [Odlingslåda med spaljé 122 cm – bränt trä och hängande tak](https://www.fyndplats.se/produkt/odlingslada-med-spalje-122-cm): Material
- [Växthusskåp i trä 178 cm med fyra plan och låsbara dörrar](https://www.fyndplats.se/produkt/vaxthusskap-tra-178-cm): Material
- [Odlingsskåp i trä 120 cm med tre uttagbara hyllplan](https://www.fyndplats.se/produkt/odlingsskap-tra-120-cm): Material
- [Minidrivhus i trä 90 cm med uppfällbart lock på stötta](https://www.fyndplats.se/produkt/minidrivhus-tra-90-cm): Material
- [Minidrivhus i trä, 90×52×49,5 cm](https://www.fyndplats.se/produkt/minidrivhus-i-tra-90x52-cm): Material
- [Blomtrappa i trä med tre plan – 71 × 61 cm, A-formad ram](https://www.fyndplats.se/produkt/blomtrappa-tra-tre-plan): Material
- [Blomsterhylla i trä med sex plan – karboniserad gran, 95 × 28 × 96,5 cm](https://www.fyndplats.se/produkt/blomsterhylla-tra-sex-plan-96-cm): Material
- [Drivbänksskåp i trä med tre hyllplan, 70,5x42x132 cm](https://www.fyndplats.se/produkt/drivbanksskap-tra-hyllplan-70x42x132-cm): Material
- [Upphöjt odlingsbord i tre nivåer, 120 × 120 cm](https://www.fyndplats.se/produkt/odlingsbord-tre-nivaer-120-cm): Material
- [Drivbänk i trä och polykarbonat, orange, 90x46x40 cm](https://www.fyndplats.se/produkt/drivbank-tra-polykarbonat-orange-90x46x40-cm): Material
- [Drivbänk i trä 100 × 50 cm med två uppfällbara lock](https://www.fyndplats.se/produkt/drivbank-tra-100-cm): Material, Bredd
- [Växthusskåp i trä med två hyllplan, 58×44×78 cm](https://www.fyndplats.se/produkt/vaxthusskap-i-tra-58x44-cm): Material
- [Växthus i aluminium 3,65 m² med takfönster och skjutdörr](https://www.fyndplats.se/produkt/vaxthus-aluminium-365-kvm): Material
- [Tomatstöd i metall 4/6-pack – stapelbart växtstöd 122/160 cm](https://www.fyndplats.se/produkt/tomatstod-metall-6-pack): Material, Bredd
- [Odlingslåda med spaljé – 3 plan i granträ för grönsaker, brun](https://www.fyndplats.se/produkt/odlingslada-med-spalje-3-plan-grantra): Material
- [Väggväxthus 200 cm med rulldörr och två nätfönster](https://www.fyndplats.se/produkt/vaggvaxthus-200-cm): Bredd
- [Odlingslådor 2-pack i metall – 120 × 60 cm och 60 cm djupa](https://www.fyndplats.se/produkt/odlingslador-2-pack-60-cm-djup): Bredd, Höjd
- [Upphöjda odlingslådor 2-pack – 46,5 cm höga med vattenmagasin](https://www.fyndplats.se/produkt/upphojda-odlingslador-2-pack): Bredd, Höjd
- [Väggväxthus 200 × 76 cm – lutande tak, dragkedjedörr och jordankare](https://www.fyndplats.se/produkt/vaggvaxthus-200x76-cm): Bredd, Höjd
- [Litet växthus med 4 hyllor, rullhjul och dragkedja](https://www.fyndplats.se/produkt/litet-vaxthus-4-hyllor-rullhjul): Bredd, Höjd
- [Spaljé i metall för klätterväxter och rosor – 152×38 cm, rosttålig](https://www.fyndplats.se/produkt/spalje-klattervaxter): Bredd, Höjd

### sangar-sovrum (38 produkter)

Filter: Klädsel (47 %, syns), Sängbredd (58 %, syns)

- [Järnsäng 90 × 200 cm i svart stål – gavel med hjärtmönster, 31 cm fritt under](https://www.fyndplats.se/produkt/jarnsang-90x200-svart-hjartgavel): Klädsel
- [Sängram i furu, vit, 90x200 cm](https://www.fyndplats.se/produkt/sangram-furu-vit-90x200-cm): Klädsel
- [Sängram med gavel 90x200 – 14 ribbor, bär 250 kg](https://www.fyndplats.se/produkt/sangram-med-gavel-90x200): Klädsel
- [Sängram 140x200 svart metall – nio ben, bär 272 kg](https://www.fyndplats.se/produkt/sangram-140x200-svart): Klädsel
- [Sängram 90x200 svart metall – utan gavel, 31,6 cm fritt under](https://www.fyndplats.se/produkt/sangram-90x200-svart): Klädsel
- [Sängram med lådor 90x200 – massiv furu, två lådor på hjul](https://www.fyndplats.se/produkt/sangram-med-lador-90x200): Klädsel
- [Enkelsäng i svart metall, 90 × 200 cm – bågade gavlar och 32 cm fritt under](https://www.fyndplats.se/produkt/enkelsang-svart-metall-90x200): Klädsel
- [Sängram i furu 90x200 – huvudgavel med spjälor, 23 cm fritt under](https://www.fyndplats.se/produkt/sangram-i-furu-90x200): Klädsel
- [Extrasäng 80 × 200 cm med 10 cm madrass – hopfällbar på hjul, bär 150 kg](https://www.fyndplats.se/produkt/extrasang-80-x-200-cm-hopfallbar): Klädsel
- [Gästsäng 4-i-1 i grått tyg – säng på 188 cm, vilfåtölj, fåtölj eller pall](https://www.fyndplats.se/produkt/gastsang-4-i-1-sang-fatolj-pall): Klädsel, Sängbredd
- [Sängram i furu 135 × 190 cm vit – gavel och 23 cm förvaringshöjd](https://www.fyndplats.se/produkt/sangram-furu-135x190-vit): Klädsel
- [Sängram i metall 90 × 190 cm – smidesdekor och 31 cm förvaringshöjd](https://www.fyndplats.se/produkt/sangram-metall-90x190-smidesdekor): Klädsel
- [Sängram i metall 160 × 200 cm – lamellbotten och 26 cm förvaringshöjd](https://www.fyndplats.se/produkt/sangram-metall-160x200-lamellbotten): Klädsel
- [Sängram i metall 135 × 190 cm – svart med 31 cm förvaringshöjd](https://www.fyndplats.se/produkt/sangram-metall-135x190-svart): Klädsel
- [Stoppad dubbelsäng 135 × 190 cm – gavel med två kuddar, bär 300 kg](https://www.fyndplats.se/produkt/stoppad-dubbelsang-135x190-gavelkuddar): Klädsel
- [Sängram i metall 90 × 190 cm – svart med gavlar och 31 cm förvaringshöjd](https://www.fyndplats.se/produkt/sangram-metall-90x190-svart): Klädsel
- [Sängbänk 105 cm teddysammet med förvaring](https://www.fyndplats.se/produkt/sangbank-105-cm-teddysammet): Sängbredd
- [Sängbänk 126 cm med förvaring, grå](https://www.fyndplats.se/produkt/sangbank-126-cm-forvaring-gra): Sängbredd
- [Sängbänk 126 cm med förvaring, grön](https://www.fyndplats.se/produkt/sangbank-126-cm-forvaring-gron): Sängbredd
- [Sängbänk 126 cm med förvaring, beige](https://www.fyndplats.se/produkt/sangbank-126-cm-forvaring-beige): Sängbredd
- [Sängbänk 115 cm chenille med rullkuddar](https://www.fyndplats.se/produkt/sangbank-115-cm-chenille-rullkuddar): Sängbredd
- [Sängbänk 116 cm i teddyfleece med förvaring – gräddvit](https://www.fyndplats.se/produkt/sangbank-116-cm-teddyfleece-forvaring): Sängbredd
- [Sängbänk med förvaring 120 cm – halvrund, grå sammet och mjukstängande lock](https://www.fyndplats.se/produkt/sangbank-forvaring-halvrund-gra-sammet): Sängbredd
- [Sängbänk 117 cm i mörkblå sammet – knappstoppad, bär 120 kg](https://www.fyndplats.se/produkt/sangbank-117-cm-morkbla-sammet): Sängbredd
- [Stoppad sängbänk 80 cm – sittbänk i linnelook med knappdekor, ljusgrå](https://www.fyndplats.se/produkt/stoppad-sangbank-80-cm): Sängbredd

### julgranar (76 produkter)

Filter: Material (79 %, syns), Diameter (89 %, syns)

- [Julgranar 2-pack 57 cm med LED och jordspjut](https://www.fyndplats.se/produkt/julgranar-2-pack-57-cm-med-led-och-jordspjut): Material
- [Julgranskrage i trä 65 × 65 cm – döljer granfoten, granar 1,8–2,7 m](https://www.fyndplats.se/produkt/julgranskrage-tra-65x65-cm): Material
- [Julgran 183 cm med 2380 grenspetsar – gångjärn, klar på 10 min](https://www.fyndplats.se/produkt/julgran-183-cm-2380-grenspetsar): Material
- [Julgran 180 cm med 4030 grenspetsar – katalogens tätaste](https://www.fyndplats.se/produkt/julgran-180-cm-4030-grenspetsar): Material, Diameter
- [Snöad julgran 180 cm med 61 kottar – Ø103 cm](https://www.fyndplats.se/produkt/snoad-julgran-180-cm-61-kottar): Material, Diameter
- [Julgran 180 cm med 748 grenspetsar – Ø120 cm, hopfällbar fot](https://www.fyndplats.se/produkt/julgran-180-cm-748-grenspetsar): Material
- [Julgran 150 cm med 444 grenspetsar – Ø105 cm, hopfällbar fot](https://www.fyndplats.se/produkt/julgran-150-cm-444-grenspetsar): Material
- [Talljulgran 180 cm med 1111 grenar och 59 kottar](https://www.fyndplats.se/produkt/talljulgran-180-cm-1111-grenar-59-kottar): Material
- [Talljulgran 180 cm med 724 grenar i två former](https://www.fyndplats.se/produkt/talljulgran-180-cm-724-grenar): Material
- [Julgran 120 cm med 657 grenspetsar – Ø85 cm och metallfot](https://www.fyndplats.se/produkt/julgran-120-cm-657-grenspetsar): Material
- [Julgran 180 cm med 1000 grenspetsar – Ø120 cm och metallfot](https://www.fyndplats.se/produkt/julgran-180-cm-1000-grenspetsar): Material
- [Julgran 180 cm med 200 LED och julkulor – allt ingår](https://www.fyndplats.se/produkt/julgran-180-cm-200-led-och-kulor): Material
- [Julgran 210 cm med 631 grenspetsar – Ø81 cm, väger 4,6 kg](https://www.fyndplats.se/produkt/julgran-210-cm-631-grenspetsar): Material
- [Talljulgran 180 cm med 375 grova PET-grenar, Ø90 cm](https://www.fyndplats.se/produkt/talljulgran-180-cm-375-grenar): Material
- [Talljulgran 210 cm med 505 silverkantade grenspetsar](https://www.fyndplats.se/produkt/talljulgran-210-cm-505-grenspetsar): Material
- [Julgran 210 cm med pynt – 1036 grenar och 54 dekorationer](https://www.fyndplats.se/produkt/julgran-210-cm-med-pynt): Material
- [Snötäckt julgran 180 cm med 200 LED och metallfot](https://www.fyndplats.se/produkt/snotackt-julgran-180-cm-med-led): Diameter
- [Tät julgran 150 cm med snö – 1162 grenspetsar](https://www.fyndplats.se/produkt/tat-julgran-150-cm-1162-grenspetsar): Diameter
- [Pelarjulgran 210 cm med snö – bara 54 cm bred](https://www.fyndplats.se/produkt/pelarjulgran-210-cm-54-cm-bred): Diameter
- [Pelarjulgran 180 cm med snö – bara 46 cm bred](https://www.fyndplats.se/produkt/pelarjulgran-180-cm-46-cm-bred): Diameter
- [Bred julgran 180 cm med snö – 105 cm diameter](https://www.fyndplats.se/produkt/bred-julgran-180-cm-105-cm-diameter): Diameter
- [Konstgjord julgran med snö – brandsäkra grenar, stålfot, flera höjder](https://www.fyndplats.se/produkt/konstgjord-julgran-med-sno): Diameter

### verktygsvagnar-verktygslador (45 produkter)

Filter: Lådor (69 %, syns)

- [Verktygsskåp 180 cm med tre låszoner – låda och två skåpdelar](https://www.fyndplats.se/produkt/verktygsskap-180-cm-tre-laszoner): Lådor
- [Verktygsvagn i tre plan med hålskivor, 95 cm](https://www.fyndplats.se/produkt/verktygsvagn-tre-plan-halskivor): Lådor
- [Verkstadsvagn i stål med låsbar låda, tre plan och hålskivor](https://www.fyndplats.se/produkt/verkstadsvagn-stal-lasbar-lada): Lådor
- [Verkstadsvagn i metall 70,5 cm med tre plan och sidohållare](https://www.fyndplats.se/produkt/verkstadsvagn-metall-70-cm-tre-plan): Lådor
- [Verktygsvagn 81 cm med tre släta hyllplan – svart och röd](https://www.fyndplats.se/produkt/verktygsvagn-81-cm-tre-slata-plan): Lådor
- [Hopfällbar verktygsvagn med tre plan – fälls till 18,5 cm](https://www.fyndplats.se/produkt/verktygsvagn-hopfallbar-18-cm): Lådor
- [Verktygsvagn 83 cm med tre hyllplan och verktygshål – svart och röd](https://www.fyndplats.se/produkt/verktygsvagn-83-cm-tre-plan-verktygshal): Lådor
- [Verktygsvagn i stål 83 cm med tre plan och höga kanter](https://www.fyndplats.se/produkt/verktygsvagn-stal-83-cm-hoga-kanter): Lådor
- [Verkstadsvagn i stål med två djupa plan – 84,5 cm på fyra hjul](https://www.fyndplats.se/produkt/verkstadsvagn-stal-tva-djupa-plan): Lådor
- [Verktygslåda 56 cm som fälls upp i fem fack – röd, tål 25 kg](https://www.fyndplats.se/produkt/verktygslada-56-cm-uppfallbar-fem-fack): Lådor
- [Verktygsvagn 3 hyllplan – avlastningsvagn med hålskivor, krokar och hink](https://www.fyndplats.se/produkt/verktygsvagn-3-hyllplan-halskiva): Lådor
- [Verktygslåda för lastbil i stål – låsbar flaklåda för montering under flak](https://www.fyndplats.se/produkt/verktygslada-lastbil-stal): Lådor
- [Verktygsskåp för vägg i stål 76×31×76 cm – låsbart, bär 163 kg](https://www.fyndplats.se/produkt/vaggskap-stal-lasbart-verktygsskap-garage-verkstad): Lådor
- [Verktygsväska för elektriker med 33 fack – 1680D polyester](https://www.fyndplats.se/produkt/verktygsvaska-elektriker-33-fack): Lådor

### juldekoration (69 produkter)

Filter: Material (80 %, syns), Höjd (86 %, syns), Bredd (88 %, syns)

- [Julby i trä med 20 LED – vinterlandskap med hus, barn och lyktor, 45 cm](https://www.fyndplats.se/produkt/julby-tra-20-led-vinterlandskap): Material
- [Uppblåsbar pepparkaksgubbe 240 cm med polkagris och halsduk – fem LED och fläkt](https://www.fyndplats.se/produkt/uppblasbar-pepparkaksgubbe-240-cm-polkagris): Material
- [Uppblåsbar tomte med solglasögon på motorcykel, 165 cm – varmvita LED](https://www.fyndplats.se/produkt/uppblasbar-tomte-solglasogon-motorcykel-165): Material
- [Julgranar 2-pack 57 cm med LED och jordspjut](https://www.fyndplats.se/produkt/julgranar-2-pack-57-cm-med-led-och-jordspjut): Material
- [Uppblåsbar pepparkaksgubbe 250 cm med presentask och LED](https://www.fyndplats.se/produkt/uppblasbar-pepparkaksgubbe-250-cm-med-presentask): Material
- [Uppblåsbar ren 180 cm med LED och rött täcke](https://www.fyndplats.se/produkt/uppblasbar-ren-180-cm-med-led): Material, Höjd, Bredd
- [Lysande snögubbe 51 cm med 30 LED – batteridriven](https://www.fyndplats.se/produkt/snogubbe-51-cm-med-30-led-batteridriven): Material
- [Lysande jultomte 93 cm – 97 LED med fast sken eller blink](https://www.fyndplats.se/produkt/lysande-jultomte-93-cm-97-led): Material, Höjd, Bredd
- [Lysande snögubbefamilj i tre delar – 128 LED, högsta 91,5 cm](https://www.fyndplats.se/produkt/lysande-snogubbefamilj-tre-delar-128-led): Material, Höjd, Bredd
- [Uppblåsbar juldekoration 213 cm med tomte som åker upp och ner](https://www.fyndplats.se/produkt/uppblasbar-juldekoration-med-rorlig-tomte): Material
- [Lysande ren med släde – 170 LED, renen 118 cm hög](https://www.fyndplats.se/produkt/lysande-ren-med-slade-170-led): Material, Höjd, Bredd
- [Uppblåsbar jultomte i skorsten 210 cm – vinkar och lyser](https://www.fyndplats.se/produkt/uppblasbar-jultomte-skorsten-210-cm): Material, Höjd, Bredd
- [Adventskalender i trä med 24 lådor – belyst byscen, 36 cm bred](https://www.fyndplats.se/produkt/adventskalender-tra-24-lador-byscen): Material, Höjd, Bredd
- [Adventskalender i MDF 34 × 34 cm – 24 stora lådor och LED-byscen](https://www.fyndplats.se/produkt/adventskalender-mdf-24-stora-lador): Material, Höjd
- [Uppblåsbar tomte i släde med ren och hund 190 cm, 8 LED](https://www.fyndplats.se/produkt/uppblasbar-tomte-i-slade-med-ren-och-hund-190-cm): Höjd, Bredd
- [Uppblåsbar pepparkaksgubbe 245 cm med polkagriskäpp och tre paket](https://www.fyndplats.se/produkt/uppblasbar-pepparkaksgubbe-245-cm-med-polkagriskapp): Höjd, Bredd
- [Konstgjord julgirlang 2 m – grön grangirlang med böjbar metalltråd](https://www.fyndplats.se/produkt/konstgjord-julgirlang): Höjd

### utelek-spel (35 produkter)

Filter: Ålder (60 %, syns), Material (86 %, syns)

- [Babygunga 3-i-1 med ryggstöd och säkerhetsbygel – rep 120–180 cm, bär 70 kg](https://www.fyndplats.se/produkt/babygunga-3-i-1-ryggstod-sakerhetsbygel): Ålder
- [Fågelbogunga Ø110 cm – blå, två justerbara rep, bär 100 kg](https://www.fyndplats.se/produkt/fagelbogunga-110-cm-bla): Ålder
- [Kantskydd till studsmatta Ø305 cm – grönt, 15 mm stoppning, tål sol och väder](https://www.fyndplats.se/produkt/kantskydd-studsmatta-305-cm-gront): Ålder
- [Badminton- och volleybollnät 400 cm med bärväska](https://www.fyndplats.se/produkt/badminton-och-volleybollnat-400-cm-med-vaska): Ålder
- [Returnät för fotboll 128 cm med ställbar vinkel](https://www.fyndplats.se/produkt/returnat-fotboll-128-cm-stallbar): Ålder
- [Basketkorg för vägg 110 × 70 cm – genomskinlig skiva och fjädrande ring Ø45 cm](https://www.fyndplats.se/produkt/basketkorg-vagg-genomskinlig-110x70-cm): Ålder
- [Basketkorg för väggmontering 110 × 75 cm – fjädrande ring Ø45 cm](https://www.fyndplats.se/produkt/basketkorg-vaggmontering-110-cm-fjadrande): Ålder
- [Basketkorg för väggmontering, 113 × 73 cm](https://www.fyndplats.se/produkt/basketkorg-vaggmontering-113-cm): Ålder
- [Basketkorg för väggmontering, transparent med röd kant, 113 × 73 cm](https://www.fyndplats.se/produkt/basketkorg-vaggmontering-transparent-rod-kant): Ålder
- [Basketställ flyttbart, korghöjd 156–210 cm](https://www.fyndplats.se/produkt/basketstall-flyttbart-156-210-cm): Ålder
- [Gungställning 280 cm med två gungor och glidgunga för två](https://www.fyndplats.se/produkt/gungstallning-280-cm-tva-gungor-glidgunga): Ålder
- [Hjullastare för barn med rörlig skopa, tramp-drift, gul](https://www.fyndplats.se/produkt/hjullastare-barn-rorlig-skopa-trampdrift-gul): Ålder
- [Mudkök för barn i trä – utomhus lekkök med 2 diskhoar och spishäll](https://www.fyndplats.se/produkt/mudkok-barn-tra-utomhus-lekkok): Ålder, Material
- [Trädgårdsgolf för familjen – portabelt hinkgolf-spel för 3/6/9 hål, utomhus](https://www.fyndplats.se/produkt/tradgardsgolf-barn-hinkgolf-utomhus): Ålder
- [Sandlåda med lekkök och sandtratt – 154 × 80 cm, diskho](https://www.fyndplats.se/produkt/sandlada-med-lekkok-154-cm): Material
- [Sandlåda med lekstugetak 124 × 116 cm – vimpelrad ingår](https://www.fyndplats.se/produkt/sandlada-med-lekstugetak-124-cm): Material
- [Sandlåda som piratskepp 180 × 103 cm – mast, segel och styrhjul](https://www.fyndplats.se/produkt/sandlada-piratskepp-180-cm): Material
- [Sandlåda med lekstuga 133 × 129 cm – räcke och blått tak](https://www.fyndplats.se/produkt/sandlada-med-lekstuga-133-cm): Material

### grill-utekok (39 produkter)

Filter: Bränsle (46 %, syns), Bredd (74 %, syns), Höjd (82 %, syns), Material (82 %, syns)

- [Eldstad med grill och gnistskydd, 76 × 76 cm – svart stål med skifferkant](https://www.fyndplats.se/produkt/eldstad-med-grill-och-gnistskydd): Bränsle
- [Vinkelbar eldkorg på stativ, 66 cm hög](https://www.fyndplats.se/produkt/vinkelbar-eldkorg-pa-stativ-66-cm): Bränsle, Bredd
- [3-i-1 eldkorg Ø60 cm – eldkorg, grill och bord](https://www.fyndplats.se/produkt/3-i-1-eldkorg-60-cm-med-bordslock): Bränsle, Bredd
- [Rökfri eldkorg 45 cm – dubbel förbränning och 8 cm vägg](https://www.fyndplats.se/produkt/rokfri-eldkorg-45-cm-8-cm-vagg): Bränsle, Bredd, Höjd, Material
- [Rökfri eldkorg Ø45 cm i brons – två handtag och eldgaffel](https://www.fyndplats.se/produkt/rokfri-eldkorg-45-cm-brons): Bränsle, Bredd, Höjd, Material
- [Rökfri eldkorg 48 × 48 cm – störst av de fyrkantiga](https://www.fyndplats.se/produkt/rokfri-eldkorg-48-cm-fyrkantig): Bränsle, Höjd, Material
- [Rökfri eldkorg Ø38 cm med gnistskydd](https://www.fyndplats.se/produkt/rokfri-eldkorg-38-cm): Bränsle, Bredd
- [Eldkorg i trädstubbsdesign Ø61,5 cm – lock och kolgaller](https://www.fyndplats.se/produkt/eldkorg-tradstubbe-61-cm): Bränsle, Bredd, Höjd, Material
- [Eldkorg 45 × 45 cm med gnistlock och grillgaller](https://www.fyndplats.se/produkt/eldkorg-45-cm-gnistlock-grillgaller): Bränsle, Höjd, Material
- [Eldbord 81 cm med bordsyta runt elden – grill och gnistlock](https://www.fyndplats.se/produkt/eldbord-81-cm-grill-gnistlock): Bränsle, Bredd, Höjd, Material
- [Eldkorg Ø61 cm med gnistkåpa och grillgaller](https://www.fyndplats.se/produkt/eldkorg-61-cm-gnistkapa-grillgaller): Bränsle, Bredd
- [Grillvagn utomhus 86 cm med rostfri skiva – skåp och sex krokar](https://www.fyndplats.se/produkt/grillvagn-utomhus-86-cm-rostfri-skiva): Bränsle
- [Eldstadsverktyg 5 delar – eldgaffel, tång, skyffel och borste på ställ](https://www.fyndplats.se/produkt/eldstadsverktyg-5-delar-stall): Bränsle
- [Grilltält 245 × 152 cm – två sidohyllor, fem krokar och stålstomme](https://www.fyndplats.se/produkt/grilltalt-245x152-cm-sidohyllor-krokar-stalstomme): Bränsle
- [Eldkorg som torn 87 cm – vedförvaring inbyggd i stativet](https://www.fyndplats.se/produkt/eldkorg-torn-87-cm-vedforvaring): Bredd, Höjd, Material
- [Stor eldkorg Ø75 cm med gnistkåpa och grillgaller](https://www.fyndplats.se/produkt/stor-eldkorg-75-cm-med-grillgaller): Bredd

### massagestolar (53 produkter)

Filter: Klädsel (75 %, syns)

- [Uppresningsfåtölj med massage i ljusgrå mikrofiber – två mugghållare och fickor](https://www.fyndplats.se/produkt/uppresningsfatolj-med-massage-ljusgra): Klädsel
- [Uppresningsfåtölj med massage och värme – elektrisk, 150°, beige](https://www.fyndplats.se/produkt/uppresningsfatolj-massage-varme-beige): Klädsel
- [Elektrisk massagefåtölj med uppresning – värme, fotstöd och 135 kg, gråbrun](https://www.fyndplats.se/produkt/elektrisk-massagefatolj-uppresning-grabrun): Klädsel
- [Reclinerfåtölj med massage och värme – snurrar och gungar, 150°, grå](https://www.fyndplats.se/produkt/reclinerfatolj-massage-snurr-gung-gra): Klädsel
- [Massagefåtölj med värme och fotstöd – fälls till 135°, beige frotté](https://www.fyndplats.se/produkt/massagefatolj-varme-frotte-beige): Klädsel
- [Massagestol med sex punkter och värme – brett ländstöd, 134 cm liggläge](https://www.fyndplats.se/produkt/massagestol-sex-punkter-varme-brett-landstod): Klädsel
- [Massagestol grå i mikrofiber – 155° ryggläge och sitthöjd 56–64 cm](https://www.fyndplats.se/produkt/massagestol-gra-mikrofiber-155-grader): Klädsel
- [Massagestol mörkgrå i mikrofiber – sex punkter med värme, 138 cm utfälld](https://www.fyndplats.se/produkt/massagestol-morkgra-sex-punkter-varme): Klädsel
- [Massagestol brun i mikrofiber – sex punkter med värme, 138 cm utfälld](https://www.fyndplats.se/produkt/massagestol-brun-sex-punkter-varme): Klädsel
- [Massagefåtölj med timer och uppresning – fem program, USB-C och 150 kg](https://www.fyndplats.se/produkt/massagefatolj-timer-fem-program): Klädsel
- [Massagefåtölj med knådande massage – elektrisk rygg, 20 cm väggavstånd](https://www.fyndplats.se/produkt/massagefatolj-gra-knadande-elektrisk-135-grader): Klädsel
- [Massagefåtölj i tyg – fotpall med förvaring som bär 100 kg](https://www.fyndplats.se/produkt/massagefatolj-tyg-fotpall-forvaring): Klädsel
- [Massagefåtölj i mörkgrått tyg – fotpall med förvaring som bär 100 kg](https://www.fyndplats.se/produkt/massagefatolj-morkgra-tyg-forvaring): Klädsel

### elbilar-for-barn (65 produkter)

Filter: Maxlast (80 %, syns)

- [Elmotorcykel för barn med stödhjul, röd](https://www.fyndplats.se/produkt/elmotorcykel-barn-stodhjul-rod): Maxlast
- [Elektrisk fyrhjuling för barn 18–36 månader – 6 V, 2,5 km/h, framåt och bakåt](https://www.fyndplats.se/produkt/elektrisk-fyrhjuling-barn-bla): Maxlast
- [Vespa GTS elscooter för barn 6 V, vit — 18–36 månader](https://www.fyndplats.se/produkt/elscooter-barn-vespa-vit): Maxlast
- [Vespa GTS elscooter för barn 6 V, mintgrön — 18–36 månader](https://www.fyndplats.se/produkt/elscooter-barn-vespa-gron): Maxlast
- [Elgokart för barn 24 V med driftfunktion, 13 km/h — vit](https://www.fyndplats.se/produkt/elgokart-barn-vit): Maxlast
- [Elgokart för barn 24 V med driftfunktion, 13 km/h — röd](https://www.fyndplats.se/produkt/elgokart-barn-rod): Maxlast
- [Elgokart för barn 24 V med driftfunktion, 13 km/h — rosa](https://www.fyndplats.se/produkt/elgokart-barn-rosa): Maxlast
- [Elfyrhjuling för barn 6 V med fram- och backväxel, svart och rosa](https://www.fyndplats.se/produkt/elfyrhjuling-barn-6v): Maxlast
- [Elmotorcykel för barn 12 V – stödhjul, musik och 2,4–5 km/h](https://www.fyndplats.se/produkt/elmotorcykel-barn-12v-stodhjul-musik): Maxlast
- [Elscooter för barn 3–5 år – 6 V, tre hjul, ljus och musik](https://www.fyndplats.se/produkt/elscooter-barn-3-5-ar-6-volt): Maxlast
- [Eltraktor barn 12V med släp – grön eller röd](https://www.fyndplats.se/produkt/eltraktor-barn-12v-slap-gron-rod): Maxlast
- [Elbil barn Mercedes-Benz AMG GT R 12V – vit, 2 motorer och fjärrkontroll](https://www.fyndplats.se/produkt/elbil-barn-mercedes-amg-gtr-12v-vit): Maxlast
- [Elbil för barn Mercedes-Benz SLC 300 – 12V med fjärrkontroll, LED & musik](https://www.fyndplats.se/produkt/elbil-barn-mercedes-benz-slc-300-12v): Maxlast

### soptunnor (41 produkter)

Filter: Bredd (68 %, syns), Höjd (68 %, syns)

- [Utdragbar soptunna med 3 fack 31 liter – för köksskåp](https://www.fyndplats.se/produkt/utdragbar-soptunna-3-fack-31-liter): Bredd, Höjd
- [Soptunna med sensor 60 liter – kolfilter mot lukt](https://www.fyndplats.se/produkt/soptunna-sensor-60-liter-kolfilter): Bredd, Höjd
- [Soptunna med sensor 55 liter – fjärilslock som öppnas från mitten](https://www.fyndplats.se/produkt/soptunna-sensor-55-liter-fjarilslock): Bredd, Höjd
- [Soptunna med sensor 45 liter – uttagbar innerhink](https://www.fyndplats.se/produkt/soptunna-sensor-45-liter-innerhink): Bredd, Höjd
- [Soptunna med sensor 42 liter – rund, påshållare ingår](https://www.fyndplats.se/produkt/soptunna-sensor-42-liter-rund): Bredd, Höjd
- [Soptunna med 2 fack 40 liter – smal, 40 cm bred](https://www.fyndplats.se/produkt/soptunna-med-2-fack-40-liter-smal): Bredd, Höjd
- [Soptunna med 2 fack 60 liter – vit, pulverlackerad](https://www.fyndplats.se/produkt/soptunna-med-2-fack-60-liter): Bredd, Höjd
- [Soptunna med 2 fack 40 liter – silver, 51,6 cm hög](https://www.fyndplats.se/produkt/soptunna-med-2-fack-40-liter-silver): Bredd, Höjd
- [Soptunna med 2 fack 40 liter – svart, 51,6 cm hög](https://www.fyndplats.se/produkt/soptunna-med-2-fack-40-liter-svart): Bredd, Höjd
- [Soptunna med 2 fack 30 liter – 43 cm hög, svart](https://www.fyndplats.se/produkt/soptunna-med-2-fack-30-liter): Bredd, Höjd
- [Soptunna med sensor 48 liter – oval, utan innerhink](https://www.fyndplats.se/produkt/soptunna-sensor-48-liter-oval): Bredd, Höjd
- [Soptunna med sensor 58 liter – oval, utan innerhink](https://www.fyndplats.se/produkt/soptunna-sensor-58-liter-oval): Bredd, Höjd
- [Soptunna med sensor 20 liter – innerhink, 42,5 cm hög](https://www.fyndplats.se/produkt/soptunna-sensor-20-liter-innerhink): Bredd, Höjd

### bokhyllor (25 produkter)

Filter: Hyllplan (52 %, syns), Maxlast (68 %, syns)

- [Smal bokhylla i vitt, 30 cm bred – två lådor, skåp och öppna fack, 158 cm](https://www.fyndplats.se/produkt/smal-bokhylla-vit-lador-skap-158): Hyllplan, Maxlast
- [Kubhylla i svart metalltråd med sex kuber – trappform, 109 × 37 × 109 cm](https://www.fyndplats.se/produkt/kubhylla-metalltrad-sex-kuber-svart): Hyllplan, Maxlast
- [Vit bokhylla med åtta öppna fack – 74,3 × 24 × 80 cm, står upp eller ligger ned](https://www.fyndplats.se/produkt/vit-bokhylla-atta-fack): Hyllplan, Maxlast
- [Kubhylla på hjul 111 cm – tre öppna fack åt olika håll, vit](https://www.fyndplats.se/produkt/kubhylla-pa-hjul-tre-fack): Hyllplan
- [Bokhylla med sits 105 cm, 6 fack och stoppad dyna](https://www.fyndplats.se/produkt/bokhylla-med-sits-105-cm-6-fack): Hyllplan
- [Bokhylla 158 cm med 9 fack och låda, vit](https://www.fyndplats.se/produkt/bokhylla-9-fack-med-lada-158-cm): Hyllplan
- [Bokhylla i molnform – tre fristående delar, tippskydd ingår](https://www.fyndplats.se/produkt/bokhylla-i-molnform): Hyllplan
- [Bokhylla i husform 91,5 cm – bokdisplay, två tyglådor, tippskydd](https://www.fyndplats.se/produkt/bokhylla-i-husform): Hyllplan
- [Barnbokhylla på hjul med griffeltavla – 7 fack i barnhöjd, 86,5 cm](https://www.fyndplats.se/produkt/barnbokhylla-pa-hjul-griffeltavla): Hyllplan
- [Kubhylla för barn 91,5 cm – sex fack, tre tyglådor, tippskydd](https://www.fyndplats.se/produkt/kubhylla-for-barn): Hyllplan
- [Kubhylla 140 cm med 10 fack – vit med ben i furu](https://www.fyndplats.se/produkt/kubhylla-140-cm-10-fack): Hyllplan
- [Bokhylla barn 3-i-1 med tidningsställ och nattduksbord i rosa MDF](https://www.fyndplats.se/produkt/bokhylla-barn-3-i-1): Hyllplan
- [Öppen bokhylla med fyra plan, 141 cm – svart stålram och bruna hyllplan](https://www.fyndplats.se/produkt/oppen-bokhylla-fyra-plan-141-cm): Maxlast
- [Låg bokhylla med åtta fack – ekdekor, 97,5 × 30 × 100 cm](https://www.fyndplats.se/produkt/lag-bokhylla-atta-fack-ek): Maxlast
- [Bokhylla på hjul med tre plan – vit metall, låsbara hjul, 69 × 26 × 108 cm](https://www.fyndplats.se/produkt/bokhylla-pa-hjul-tre-plan-vit): Maxlast
- [Bokhylla i trädform, 136 cm – nio plan, vit, med tippskydd](https://www.fyndplats.se/produkt/bokhylla-tradform-136-cm-nio-plan): Maxlast
- [Bokhylla för barn med fyra hyllor – vit med ribbor i furu, 60 × 10 × 98 cm](https://www.fyndplats.se/produkt/bokhylla-for-barn-fyra-hyllor-vit): Maxlast

### skrivbord (33 produkter)

Filter: Maxlast (64 %, syns), Djup (76 %, syns)

- [Fällbord med hyllor – matbord för små utrymmen, 20 cm djupt hopfällt](https://www.fyndplats.se/produkt/fallbord-med-hyllor-matbord-sma-utrymmen): Maxlast
- [Datorbord i svart, 80 cm – utdragbar tangentbordshylla och fack för datorn](https://www.fyndplats.se/produkt/datorbord-svart-tangentbordshylla-80-cm): Maxlast
- [Skrivbord med hylla, 84 × 45 cm – vit metallram, ekfärgad skiva och kabelhål](https://www.fyndplats.se/produkt/skrivbord-hylla-84-cm-vit-ek): Maxlast
- [Skrivbord med stålram, 120x60 cm, svart/rustik brun](https://www.fyndplats.se/produkt/skrivbord-stalram-120x60-svart-rustik-brun): Maxlast
- [Fällbart väggskrivbord med skrivtavla, svart](https://www.fyndplats.se/produkt/vaggskrivbord-fallbart-skrivtavla-svart): Maxlast
- [Litet datorbord på hjul med låda och två hyllor – svart, 56 × 51 × 79 cm](https://www.fyndplats.se/produkt/litet-datorbord-pa-hjul-svart): Maxlast
- [Skrivbord 200 × 60 cm – rustik brun skiva på svart stålstativ](https://www.fyndplats.se/produkt/skrivbord-200-cm-rustik-brun-stalstativ): Maxlast
- [Ståbord för laptop på hjul – höj- och sänkbart 68–108 cm, skiva 65 × 48 cm](https://www.fyndplats.se/produkt/stabord-for-laptop-pa-hjul): Maxlast
- [Skrivbord 120×60 cm med Z-format metallstativ, industristil](https://www.fyndplats.se/produkt/skrivbord-120x60-z-format-metallstativ-industristil): Maxlast
- [Hopfällbart skrivbord i vitt med avtagbar skärmhylla – 100 cm, 5,5 cm hopfällt](https://www.fyndplats.se/produkt/hopfallbart-skrivbord-vit-skarmhylla): Maxlast
- [Höj- och sänkbart skrivbord på hjul – två skivor, 70,5–120 cm, lutbar framskiva](https://www.fyndplats.se/produkt/hoj-och-sankbart-skrivbord-pa-hjul): Maxlast
- [Skrivbord i högglans vitt med två lådor, 100 x 50 cm](https://www.fyndplats.se/produkt/skrivbord-hogglans-vit-100x50cm): Maxlast
- [Elektriskt skrivbord 140 × 70 cm i ek och vitt, 72–116 cm](https://www.fyndplats.se/produkt/elektriskt-skrivbord-140x70-ek-vitt): Djup
- [Elektriskt skrivbord 140 × 60 cm med minnesfunktion och barnlås](https://www.fyndplats.se/produkt/elektriskt-skrivbord-140-cm-minnesfunktion): Djup
- [Rullbart ståbord 75–114 cm med lutbar skiva](https://www.fyndplats.se/produkt/rullbart-stabord-lutbar-skiva): Djup
- [Rullbart sitt- och ståbord 71–107 cm med tangentbordshylla](https://www.fyndplats.se/produkt/rullbart-sitt-och-stabord-tangentbordshylla): Djup
- [Elektriskt skrivbordsstativ 70–118 cm med dubbelmotor, utan skiva](https://www.fyndplats.se/produkt/elektriskt-skrivbordsstativ-dubbelmotor): Djup
- [Elektriskt skrivbord 140 × 70 cm svart med fyra minneshöjder](https://www.fyndplats.se/produkt/elektriskt-skrivbord-140x70-svart): Djup
- [Elektriskt skrivbord 120 × 60 cm höj- och sänkbart 72–116 cm](https://www.fyndplats.se/produkt/elektriskt-skrivbord-120x60): Djup
- [Barnskrivbord med stol – höj- och sänkbart, skiva som lutar 0–40°](https://www.fyndplats.se/produkt/barnskrivbord-med-stol-hojdbart): Djup

### massage-aterhamtning (80 produkter)

Filter: Maxlast (86 %, syns)

- [Uppresningsfåtölj cremevit – 35 cm från vägg, USB-A och USB-C](https://www.fyndplats.se/produkt/uppresningsfatolj-cremevit-35-cm-fran-vagg): Maxlast
- [Uppresningsfåtölj ljusgrå med 155° liggläge – hög rygg och 25 cm ryggdyna](https://www.fyndplats.se/produkt/uppresningsfatolj-ljusgra-155-grader): Maxlast
- [Fot- och vadmassage med luftkompression och värme – fälls ihop till pall](https://www.fyndplats.se/produkt/massageapparat-fotter-vader-luftkompression): Maxlast
- [Benmassager med luftkompression och värme – hela benet, 3 program och 3 styrkor](https://www.fyndplats.se/produkt/benmassager-luftkompression-varme): Maxlast
- [Reclinerfåtölj mörkgrå 100 cm bred – åtta massageprogram och timer](https://www.fyndplats.se/produkt/reclinerfatolj-morkgra-atta-program): Maxlast
- [Massagebänk 2 zoner svart – 186 × 60 cm bädd, 13 kg](https://www.fyndplats.se/produkt/massagebank-svart-2-zoner): Maxlast
- [Muskelmassageapparat med 16 huvuden – 99 nivåer, rödljus och timer](https://www.fyndplats.se/produkt/muskelmassageapparat-16-huvuden): Maxlast
- [Hopfällbar massagebänk 2 sektioner trä 185 cm rosa](https://www.fyndplats.se/produkt/hopfallbar-massagebank-tra-185-cm-rosa): Maxlast
- [Hopfällbar massagebänk 3 sektioner aluminium 215 cm rosa](https://www.fyndplats.se/produkt/hopfallbar-massagebank-aluminium-3-sektioner-rosa): Maxlast
- [Elektrisk vakuumterapi för bröstförstoring och rumplyft – 24 koppar](https://www.fyndplats.se/produkt/elektrisk-vakuumterapi): Maxlast
- [Hopfällbar massagebänk i trä med nackstöd, 186 cm](https://www.fyndplats.se/produkt/hopfallbar-massagebank-tra-186cm): Maxlast

### boxningssackar (28 produkter)

Filter: Vikt (61 %, syns), Höjd (71 %, syns)

- [Punchingboll 125–145 cm med viktsäck på 15 kg och boxhandskar](https://www.fyndplats.se/produkt/punchingboll-viktsack-125-145-cm): Vikt
- [Fristående boxningssäck 135 cm med tio sugproppar, förfylld](https://www.fyndplats.se/produkt/boxningssack-135-cm-sugproppar): Vikt
- [Punchingboll med reflexstång 160–205 cm och 12 sugproppar](https://www.fyndplats.se/produkt/punchingboll-reflexstang-160-205-cm): Vikt
- [Punchingboll 147–165 cm med fyllbar fot och sugproppar](https://www.fyndplats.se/produkt/punchingboll-147-165-cm-fyllbar-fot): Vikt
- [Punchingboll 145–180 cm svart med fyllbar fot](https://www.fyndplats.se/produkt/punchingboll-145-180-cm-svart): Vikt
- [Punchingboll 133–151 cm svart med sugpropp och fjädrande stång](https://www.fyndplats.se/produkt/punchingboll-133-151-cm-svart): Vikt
- [Boxningssäck svart 155–205 cm med roterande arm och boll](https://www.fyndplats.se/produkt/boxningssack-svart-155-205-cm-reflexstang): Vikt
- [Boxningssäck röd 155–205 cm med roterande arm och boll](https://www.fyndplats.se/produkt/boxningssack-rod-155-205-cm-reflexstang): Vikt
- [Punchingboll 136–154 cm i fyra lägen med boxhandskar](https://www.fyndplats.se/produkt/punchingboll-136-154-cm-fyra-lagen): Vikt
- [Fristående boxningssäck 156 cm – 12 sugproppar och fjädrande fäste](https://www.fyndplats.se/produkt/fristaende-boxningssack-156-cm): Vikt
- [Fristående boxningssäck 160–230 cm – roterande arm och 2 boxningsbollar](https://www.fyndplats.se/produkt/fristaende-boxningssack-160-230-cm): Vikt
- [Boxsäcksställ 185–231 cm med säck i segelduk och viktstänger](https://www.fyndplats.se/produkt/boxsacksstall-185-231-cm-med-sack): Höjd
- [Boxsäcksställ 175–220 cm med speedball och sex strävor](https://www.fyndplats.se/produkt/boxsacksstall-175-220-cm-speedball): Höjd
- [Boxsäcksställ hopfällbart 182–225 cm med tio höjdlägen](https://www.fyndplats.se/produkt/boxsacksstall-182-225-cm-hopfallbart): Höjd
- [Boxställ 140–205 cm med två speedballs och kickdyna, rött](https://www.fyndplats.se/produkt/boxstall-rott-140-205-cm): Höjd
- [Boxställ 140–205 cm med två speedballs och kickdyna, blått](https://www.fyndplats.se/produkt/boxstall-blatt-140-205-cm): Höjd
- [Boxställ 140–205 cm med två speedballs och kickdyna, svart](https://www.fyndplats.se/produkt/boxstall-svart-140-205-cm): Höjd
- [Boxställ 163–205 cm med reflexstång, slagdyna och speedball](https://www.fyndplats.se/produkt/boxstall-163-205-cm-reflexstang): Höjd
- [Boxningssäck 158–186 cm i konstläder, brun och svart](https://www.fyndplats.se/produkt/boxningssack-158-186-cm-konstlader): Höjd

### selar-koppel-transport (42 produkter)

Filter: Material (79 %, syns)

- [Hundvagn för mellanstor hund upp till 25 kg – ljusgrå, 93 cm liggyta](https://www.fyndplats.se/produkt/hundvagn-mellanstor-hund-25-kg-ljusgra): Material
- [Hundvagn för mellanstor hund upp till 25 kg – mörkgrön, 93 cm liggyta](https://www.fyndplats.se/produkt/hundvagn-mellanstor-hund-25-kg-morkgron): Material
- [Hundvagn för mellanstor hund upp till 25 kg – grå, 93 cm liggyta](https://www.fyndplats.se/produkt/hundvagn-mellanstor-hund-25-kg-gra): Material
- [Hundvagn för mellanstor hund upp till 25 kg – senapsgul, 93 cm liggyta](https://www.fyndplats.se/produkt/hundvagn-mellanstor-hund-25-kg-senapsgul): Material
- [Hundvagn för mellanstor hund upp till 25 kg – svart och röd, 93 cm liggyta](https://www.fyndplats.se/produkt/hundvagn-mellanstor-hund-25-kg-svart-rod): Material
- [Hundvagn för 30 kg som fälls ihop i ett steg – 85 cm liggyta](https://www.fyndplats.se/produkt/hundvagn-30-kg-ett-stegs-hopfallning): Material
- [Hundvagn upp till 4 kg, röd – fyra hjul, sufflett och korg](https://www.fyndplats.se/produkt/hundvagn-4-kg-rod): Material
- [Hundvagn upp till 4 kg, grå – fyra hjul, sufflett och korg](https://www.fyndplats.se/produkt/hundvagn-4-kg-gra): Material
- [Hundvagn upp till 4 kg, blå – fyra hjul, sufflett och korg](https://www.fyndplats.se/produkt/hundvagn-4-kg-bla): Material

### lek-tillbehor-for-husdjur (64 produkter)

Filter: Material (86 %, syns), Djur (89 %, syns)

- [Sittpuff i vattenhyacint med kattgömma – trälock, tål 80 kg](https://www.fyndplats.se/produkt/sittpuff-vattenhyacint-katt): Material
- [Agilityhinder i trä 3 delar – hundbro, vilplattform och hundtrappa, 40 kg](https://www.fyndplats.se/produkt/agilityhinder-tra-hundbro-vilplattform-trappa): Material
- [Balansbräda för hund 2-i-1 med hundtrappa, 80 cm i trä – upp till 15 kg](https://www.fyndplats.se/produkt/balansbrada-hund-2-i-1-trappa): Material
- [A-hinder för hund i trä – justerbar höjd 66–90 cm, hopfällbart, 40 kg](https://www.fyndplats.se/produkt/a-hinder-hund-tra-justerbar-hojd): Material
- [Balansbom för hund 335 cm i trä – agilityhinder med 28° ramper och bygel](https://www.fyndplats.se/produkt/balansbom-hund-335-cm-agility): Material
- [Husdjurstrappa i skum med avtagbart steg – 39 cm, max 15 kg](https://www.fyndplats.se/produkt/husdjurstrappa-skum-avtagbart-steg): Material, Djur
- [Husdjurssoffa 76 cm med förvaring under sitsen – plysch och trä](https://www.fyndplats.se/produkt/husdjurssoffa-med-forvaring): Material, Djur
- [Hundvippa 180 cm i trä för agility – halkfri gångyta, bärighet 30 kg](https://www.fyndplats.se/produkt/hundvippa-agility-180-cm): Material
- [Hundtrappa med förvaring 3 steg – mattklädd trappa för hund och katt](https://www.fyndplats.se/produkt/hundtrappa-med-forvaring): Material
- [Husdjurstrappa 4 steg med sisalstolpar – 59 cm, max 50 kg](https://www.fyndplats.se/produkt/husdjurstrappa-4-steg-sisal): Djur
- [Hopfällbar husdjurstrappa 2 steg i grått konstläder](https://www.fyndplats.se/produkt/husdjurstrappa-gra-2-steg): Djur
- [Hopfällbar husdjurstrappa 2 steg i mörkt konstläder](https://www.fyndplats.se/produkt/husdjurstrappa-mork-2-steg): Djur
- [Husdjurssoffa 70 cm i krämvitt – plysch och massiv fururam](https://www.fyndplats.se/produkt/husdjurssoffa-70-cm-krem): Djur
- [Rund husdjurssoffa 65 cm i mörkgrönt – rygg runt utom ingången](https://www.fyndplats.se/produkt/husdjurssoffa-rund-gron): Djur

### mat-vattenskalar (27 produkter)

Filter: Volym (70 %, syns)

- [Upphöjd matskål för hund – höjdjusterbar 11–33 cm, två skålar 900 ml](https://www.fyndplats.se/produkt/upphojd-matskal-hund-hojdjusterbar-11-33-cm): Volym
- [Husdjursskåp 82 cm – matplats i utfällbar låda, hyllfack och krokar](https://www.fyndplats.se/produkt/husdjursskap-82-cm-matplats-i-lada): Volym
- [Matstation för hund 60 × 30 × 41 cm i vitt – löstagbar skiva och förvaring](https://www.fyndplats.se/produkt/matstation-hund-41-cm-lyftbar-skiva-vitt): Volym
- [Matstation för hund 60 × 30 × 41 cm i grått – löstagbar skiva och förvaring](https://www.fyndplats.se/produkt/matstation-hund-41-cm-lyftbar-skiva-gratt): Volym
- [Matstation för hund 60 × 30 × 41 cm i mörkbrunt – löstagbar skiva](https://www.fyndplats.se/produkt/matstation-hund-41-cm-lyftbar-skiva-brunt): Volym
- [Hundväska 38 cm med två foderbehållare – skål och axelrem ingår](https://www.fyndplats.se/produkt/hundvaska-tva-foderbehallare): Volym
- [Upphöjt hundmatställ i ek med slow feeder, 2 rostfria skålar och förvaring](https://www.fyndplats.se/produkt/upphojt-hundmatstall-slow-feeder): Volym
- [Upphöjt hundmatställ med förvaring – 2 matskålar i rostfritt stål, grå](https://www.fyndplats.se/produkt/upphojt-hundmatstall-med-forvaring): Volym

### skoskap-skobankar (37 produkter)

Filter: Höjd (84 %, syns), Djup (84 %, syns), Bredd (86 %, syns)

- [Skoskåp med spegeldörrar 50 × 180 cm](https://www.fyndplats.se/produkt/skoskap-spegeldorrar-50x180): Höjd, Djup
- [Skobänk 140 cm i massivträ med dyna](https://www.fyndplats.se/produkt/skobank-140-cm-massivtra-dyna): Höjd, Djup, Bredd
- [Skoskåp 106 cm för 30 par, vit högglans](https://www.fyndplats.se/produkt/skoskap-106-cm-30-par-vit-hogglans): Höjd, Djup, Bredd
- [Skoställ med sittbänk 86 cm](https://www.fyndplats.se/produkt/skostall-med-sittbank-86-cm): Höjd, Djup, Bredd
- [Skoskåp 98 cm med fyra tippfack, rustik brun](https://www.fyndplats.se/produkt/skoskap-98-cm-fyra-tippfack-rustik): Höjd, Djup, Bredd
- [Smalt skoskåp 47 cm med tre tippfack](https://www.fyndplats.se/produkt/smalt-skoskap-47-cm-tre-tippfack): Höjd, Djup, Bredd

### odlingslador (27 produkter)

Filter: Material (78 %, syns)

- [Odlingsbord med avtagbar drivbänk – 108,5 cm och underhylla](https://www.fyndplats.se/produkt/odlingsbord-med-drivbank-108-cm): Material
- [Stapelbar odlingslåda i tre plan – 120 × 80 cm, verktygsfri](https://www.fyndplats.se/produkt/stapelbar-odlingslada-tre-plan): Material
- [Odlingslåda med spaljé 122 cm – bränt trä och hängande tak](https://www.fyndplats.se/produkt/odlingslada-med-spalje-122-cm): Material
- [Upphöjt odlingsbord i tre nivåer, 120 × 120 cm](https://www.fyndplats.se/produkt/odlingsbord-tre-nivaer-120-cm): Material
- [Odlingslåda 3 nivåer 117×100 cm – 9 fack i granträ med fiberduk](https://www.fyndplats.se/produkt/odlingslada-3-nivaer-117x100-cm): Material
- [Odlingslåda med spaljé – 3 plan i granträ för grönsaker, brun](https://www.fyndplats.se/produkt/odlingslada-med-spalje-3-plan-grantra): Material

### miniugnar-airfryers (22 produkter)

Filter: Effekt (73 %, syns)

- [Bänkugn 36 liter med två kokplattor, grillspett och varmluft](https://www.fyndplats.se/produkt/bankugn-36-liter-med-kokplattor): Effekt
- [Miniugn 21 liter i silver med tre värmelägen och timer](https://www.fyndplats.se/produkt/miniugn-21-liter-silver): Effekt
- [Miniugn 21 liter i grått med tre värmelägen och timer](https://www.fyndplats.se/produkt/miniugn-21-liter-gra): Effekt
- [Miniugn 21 liter i gräddvitt med tre värmelägen och timer](https://www.fyndplats.se/produkt/miniugn-21-liter-gradvit): Effekt
- [Miniugn 21 liter i svart med tre värmelägen och timer](https://www.fyndplats.se/produkt/miniugn-21-liter-svart): Effekt
- [Miniugn 16 liter i guld och svart med timer och glaslucka](https://www.fyndplats.se/produkt/miniugn-16-liter): Effekt

### sittpuffar-fotpallar (22 produkter)

Filter: Klädsel (77 %, syns)

- [Sittpuff i vattenhyacint med kattgömma – trälock, tål 80 kg](https://www.fyndplats.se/produkt/sittpuff-vattenhyacint-katt): Klädsel
- [Rund pall med förvaring i gräddvit sherpa – 38 cm, bär 120 kg](https://www.fyndplats.se/produkt/rund-pall-forvaring-sherpa-38-cm): Klädsel
- [Förvaringspall i vit sherpa – 33 l och vändbart lock, Ø36,5 cm](https://www.fyndplats.se/produkt/forvaringspall-sherpa-vandbart-lock): Klädsel
- [Rund förvaringspall i beige tyg med juteyta – 19 l och lock som blir bord](https://www.fyndplats.se/produkt/rund-forvaringspall-juteyta-bordslock): Klädsel
- [Djurpall i koform med förvaring – avtagbart lock, bär 120 kg](https://www.fyndplats.se/produkt/djurpall-koform-med-forvaring): Klädsel

### kaninburar-marsvinsburar (31 produkter)

Filter: Material (84 %, syns)

- [Kaninbur 90 cm på hjul med ramp, grå](https://www.fyndplats.se/produkt/kaninbur-90-cm-hjul-ramp-gra): Material
- [Kaninbur 90 cm på hjul med ramp, gul](https://www.fyndplats.se/produkt/kaninbur-90-cm-hjul-ramp-gul): Material
- [Kaninhus 144 cm i två plan med bitumentak](https://www.fyndplats.se/produkt/kaninhus-144-cm-tva-plan-bitumentak): Material
- [Rasthage för smådjur 220 × 103 cm med tak och markspett](https://www.fyndplats.se/produkt/rasthage-smadjur-220-103-cm-tak): Material
- [Marsvinsbur inomhus i trä 90 × 53 × 59 cm – ramp, hydda och hjul](https://www.fyndplats.se/produkt/marsvinsbur-inomhus-tra-90x53x59): Material

