# Vad fotona sa INNAN texten skrevs — runda M4

Kontaktarket byggdes före brödtexten (regeln från J1). 39 bilder över åtta
granar. Rundan gav fem fynd, och fyra av dem kunde ingen textgrind ha sett.

## ☠️ `86fdd9af` är en VIT gran — källan säger `Farbe: Grün`

Källtexten beskriver den två gånger, och båda gångerna underdrivet:

```
Der schlanke, beflockte Baum passt in jede Ecke
✔ Mit künstlichem Schnee besprüht für eine winterliche Atmosphäre
✔ Farbe: Grün
```

Läst som text är det samma produkt som M3:s `d09b1b4c` — en grön gran med
vitt konstsnö på, där kontrasten är hela poängen. Fotot visar något annat:
beflockningen är så tät att granen läser som **vit**. Närbilderna (4 och 5)
är helt snötäckta grenar med knappt en grön fläck; helbilden är en nästan
vit pelare.

☠️ **Och `Farbe: Grün` är därmed en färguppgift som passerar varje grind och
beskriver fel sak** — exakt samma klass som den röda bilen som skeppades i
färgen "Nät". Ett ord kan vara invändningsfri svenska, hämtat rakt ur
källan, och ändå vara fel om produkten.

Texten skriver därför **vit** och låter specraden bära källans ord.

## ☠️ Fyra olika fotstativ är rundans verkliga skiljelinje

Sex av åtta är 180 cm höga. Höjden skiljer dem alltså inte, och grenantalet
(889–2 419) säger inget en kund kan se. Det som SYNS direkt på bild 1 är
foten, och den har fyra former i den här rundan:

| fot | granar |
| :-- | :-- |
| svart metallkryss | `3523deaa` · `17392493` · `86fdd9af` |
| **fyra barkade stockbitar** i kryss | `03658e32` |
| plan trebent träkors i ljus furu | `fc68547e` · `5f646ce6` · `03ca6978` |
| X-kors i varmare, rödare trä | `5814c7e1` |

☠️ **`03658e32`:s fot står inte i källan.** Den säger bara *"ein stabiler
Ständer aus massivem Tannenholz"* respektive *"Ein Massiver
Tannenholzständer"* — alltså "massiv granträfot", vilket läses som ett
svarvat eller hyvlat stativ. Bilden visar **fyra runda stockbitar med bark
kvar**, lagda som ett kryss, som småved. Det är produktens mest
särskiljande drag och det står ingenstans i texten.

## ☠️ TVÅ av åtta måttritningar motsäger specen

Måttritningen är normalt det mest pålitliga i en Aosom-produkt. I den här
familjen är den det inte:

| kort | ritningen säger | källan säger | vad som gäller |
| :-- | :-- | :-- | :-- |
| `17392493` | höjd **180 cm** | `Gesamtabmessung: Ø122 x 183H`, `Baumhöhe: 183 cm` och svenska specraden `Ø122 x 183H` — **tre gånger 183** | 183 |
| `5f646ce6` | bredd **180 cm** | `Ø115 x 180H`, svenska specraden `115 x 115 x 180` | 115 |

`5f646ce6` är den enkla: ritningen har fått höjdmåttet dubblerat till
breddfältet, och en gran som är lika bred som hög syns direkt på fotot att
den inte är. `17392493` är den svåra — 180 mot 183 är tre centimeter, båda
talen är kundsynliga, och ingen av dem är orimlig.

Brytregeln är M2:s (`032b728d`, 240 mot 243): **specraden kunden faktiskt
ser vinner**. Alltså 183. ⚠️ Alt-texten för ritningen skriver därför inget
tal alls — att upprepa ritningens 180 hade satt två höjder på samma sida.

## ☠️ `5814c7e1` har fyra bildplatser men bara TRE bilder

Bild 1 och bild 4 är **byte-identiska** (md5 `20de9acd…`), alltså samma
foto uppladdat två gånger som två olika Wix-filer. Produkten har därmed
produktbild, miljöbild och måttritning — och en kopia.

⚠️ Det är en ny variant av dubblettklassen: inte samma bild på TVÅ
produkter (M2:s plansch, M3:s husmärke) utan samma bild två gånger på
SAMMA produkt. Hash-svepet fångade den, men rapporterade den som "delad i
rundan", vilket läses som ett fynd mellan produkter. Kandidat för
bildreparation eller ett eget spec-kort.

## ⚠️ `fc68547e` och `03ca6978` är rundans närmaste par

Båda 180 cm, båda glesa med tydligt skilda våningar, båda på plana
trebenta träkors i ljus furu. Det som skiljer dem är mätbart men inte
iögonfallande: 115 mot 120 cm bredd, 961 mot 988 grenspetsar, fot Ø50 × 17
mot Ø66 × 15 — och 140 kr i pris.

Bildhasharna är olika (39 unika av 39 filer, 8 av 8 unika huvudbilder), så
de är inte samma vara. Men texterna måste säga vad som skiljer dem, annars
konkurrerar de med varandra på vår egen sajt.

## Rent i övrigt

Noll reklamplanscher, noll tyska instruktionsgrafiker, noll inbränd text —
alla 39 bilderna är produktfotografi. Det är första julgransrundan utan en
enda bild att ta bort.
