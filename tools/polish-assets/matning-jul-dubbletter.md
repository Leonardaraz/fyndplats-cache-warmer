# Dubblettskärm på BILDHASH över julfamiljen (2026-09-13)

Mätning, inte en runda. Den svarar på frågan runda M1 lämnade öppen — *går
granarna att polera utan att skapa interna dubbletter?* — och den provar
samtidigt den teknik #243 föreslår för den tredje dubblettklassen.

## Tekniken: noll bildnedladdningar

Wix filbeskrivare bär ett `hash`-fält. `POST /site-media/v1/files/get-files`
med `fileIds` returnerar hela beskrivningen, `hash` inkluderad, hundra filer
per anrop. En dubblettskärm på byte-identitet kostar därför **noll
bildnedladdningar** — bara produktsökningen plus ett get-files per hundra
bilder.

☠️ **Täckningen måste redovisas.** Varje mätning nedan rapporterar
`utanHash`; en fil utan hash är en produkt som inte blivit prövad, och en
skärm som tyst hoppar över dem rapporterar "inga dubbletter" om ingenting.
Alla fyra mätningarna nedan har `utanHash: 0`.

## 1. Granarna: 67 av 67 unika huvudbilder

| | |
|---|---:|
| Granar totalt | 67 |
| — utkast | 31 |
| — publicerade | 36 |
| Unika huvudbildshashar | **67** |
| Delade | **0** |

Ingen tysk granutkast delar huvudbild med någon publicerad gran.

⚠️ **Det rentvår bara den LÄTTA klassen.** Byte-identitet är tillräckligt
bevis, inte nödvändigt (#194) — två fotograferingar av samma vara passerar
skärmen utan att blinka, precis som cypresserna i L4 (80/80 unika).

## 2. ☠️ Och specen kan INTE smalna av resten — mätt, inte antaget

Nästa steg vore att para ihop på höjd, diameter och spetsantal. Det går inte,
och det är värt att skriva ned så att nästa runda inte försöker igen:

| täckning | utkast | publicerade |
|---|---:|---:|
| har höjd i specen | 31/31 | **15/36** |
| har spetsantal i specen | **10/31** | 27/36 |

Ett par behöver två samstämmiga fält för att räknas som kandidat. Med den här
täckningen kan de flesta par aldrig poängsättas alls. Skärmen gav **0
kandidatpar** — och det talet mäter skärmen, inte katalogen.

☠️ Samma sak gäller NAMNET, och där är det värre: **23 av 31 granutkast har
inget spetsantal i namnet**. En första version av mätningen körde på namnet
och fick noll par. Det var ett svar om regexen.

**Slutsats för nästa granrunda: det finns ingen billig skärm. Trettioen
utkast mot trettiosex publicerade granar måste granskas på foto, par för par.
Räkna med den kostnaden i planeringen i stället för att upptäcka den mitt i.**

## 3. Övriga juluttkast mot ALLA publicerade julsidor

Tolv utkast som inte är granar, mot 61 publicerade julsidor. 436 bilder, alla
hashar hämtade.

| | |
|---|---:|
| Delade hashar | **1** |

Och den enda träffen är ett FALSKLARM.

## 4. ☠️ Den delade bilden är leverantörens REKLAMPLANSCH, inte en dubblett

Tre utkast delar exakt en bild — sin femte — och är i övrigt helt olika varor:

| kort | pris | mått |
| :-- | --: | :-- |
| `46dd0605` | 679 kr | 125 × 95 × **243** cm |
| `d6413671` | 639 kr | 160 × 90 × **240** cm |
| `2f881d00` | 759 kr | 190 × 72 × **122** cm (släde) |

Fyra av fem bilder skiljer sig på var och en. Den femte är hämtad och
granskad: det är **HOMCOM by Aosom-planschen** med den tyska slogan
*"Bringen Sie den Zauber der Feiertage in Ihr Zuhause."* — exakt samma bild
som runda M1 tog bort för hand från `ef75aa9a` och `69331178`.

Tre olika Wix-filer, samma bytes: leverantören återanvänder en enda
marknadsföringsbild över hela sortimentet, och Wix har importerat om den en
gång per produkt.

☠️ **Det är en rättelse av tekniken i #243, inte bara en anekdot. Gruppera på
HUVUDBILDEN, inte på alla bilder.** Huvudbilden är varan på vit botten och
är därmed varuspecifik; bilderna längst bak i serien är delade
reklamplanscher. En skärm över alla bilder rapporterar falska dubbletter,
och den rapporterar dem på produkter som inte har något med varandra att
göra.

⚠️ Omvänt är planschen ett gratis FYND: varje produkt som bär hashen
`5182e1aa…` bär husmärket inbränt och ska få bilden borttagen vid
poleringen. `46dd0605`, `d6413671` och `2f881d00` gör det.

## 5. ✅ Planschen finns INTE på någon publicerad sida

| | |
|---|---:|
| Publicerade julsidor | 48 |
| Bilder | 291 |
| Hashar hämtade | **291** (utanHash 0) |
| Bär planschen `5182e1aa…` | **0** |
| Delade hashar över huvud taget | **0** |

Husmärket i bild är alltså ett UTKASTproblem, inte ett publicerat — samma
slutsats som huset redan dragit om de tyska grafikerna (2026-08-xx). De
tidigare rundorna har tagit bort planschen korrekt.

## 6. ⚠️ Två namnfilter till som gav fel svar

Samma klass som `hjul` och `Tannenholz` i runda M1 — och den ena kostade
något den här gången.

- **`Laterne` träffar `Laternenhaken`** — lykt-KROK. Två campingtält
  (`0ea12d46`, `0a04207e`) kom med i juluttkasten.
- ☠️ **Runda M1:s familjefilter MISSADE en pepparkaksgubbe.** `321bdedf`,
  *"Lebkuchenmann mit Zuckerstange, 2,45 m groß, aufblasbar"*, 899 kr, är den
  FJÄRDE i familjen. Namnet börjar på `Lebkuchenmann` och innehåller aldrig
  ordet `Weihnacht`, så M1:s urvalsregex såg den aldrig.

  M1 publicerade tre pepparkaksgubbar och kallade dem i texten "de tre". Det
  var sant om urvalet, inte om sortimentet. Ingen skada mot kund — de tre
  texterna skiljer sig åt på riktiga egenskaper — men nästa runda ska ta
  `321bdedf` och den är störst av de fyra.

**Regeln, tredje gången i två dygn: ett familjefilter är ett NAMNfilter, och
ett namnfilter mäter stavning.** Samma lärdom som #133 och #218.
