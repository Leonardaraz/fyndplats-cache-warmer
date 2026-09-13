# Runda 143 — Steg 2: laglighetsgrind före allt skrivande

Ingen produkt i batchen faller på en svensk regel. Sportredskap för vuxna har
ingen egen produktförordning på samma sätt som djurbostäder (L80) eller
barnprodukter (EN 71). Men FEM påståenden i leverantörstexterna får inte gå
vidare som de står, och ett av dem är ett verkligt säkerhetsproblem.

## ☠️ 1. Väggfästet får INTE säljas som "passar alla väggar" (`b6c4c619`)

Leverantören skriver ordagrant: *"Kann an Betonwänden, Ziegelwänden und sogar
an soliden Holzwänden montiert werden"* — betong, tegel och massivt trä. Och
det är just den uppräkningen som är varningen, inte löftet.

**Svenska innerväggar är till övervägande del regelvägg med gips.** Ett fäste
som bär 100 kg skruvat i en gipsskiva är inte underdimensionerat — det är
utryckt ur väggen vid första sparken, med en 30-kilos säck i fritt fall. Fästet
väger själv 7 kg och är 80 cm brett, alltså tre gånger så brett som ett
regelavstånd på 600 mm: det GÅR att träffa två reglar, men bara om man vet att
man måste.

**Texten ska säga vad leverantören säger och inget mer:** betong, tegel eller
massivt trä. Ordet "alla" och formuleringar som "var som helst" är förbjudna på
den sidan, och ett eget stycke ska säga att gipsvägg kräver infästning i regel
eller bärande underlag.

⚠️ Skruvarna som följer med är leverantörens, dimensionerade för deras
antaganden. Sidan ska inte påstå att medföljande skruv räcker till ett givet
underlag — det är installatörens bedömning.

## ☠️ 2. "Passar alla golv" är falskt när fästet är SUGPROPPAR

`74602345` skriver *"Die Basis wird mit Wasser oder Sand beschwert, geeignet
für jeden Boden"*, och fyra andra i grupp C säljs på 10–20 sugproppar.

En sugpropp fäster på **slät, tät och ren yta** — klinker, lackad parkett,
plastmatta. Den fäster inte alls på heltäckningsmatta, obehandlat trä,
strukturerad vinyl eller kall betong. Att skriva "alla golv" är alltså inte en
överdrift utan ett fel som kunden upptäcker först när stället vandrar.

**Sidorna skriver vilka ytor sugpropparna fäster på, och att fyllningen är det
som ger tyngden.** De två egenskaperna är oberoende: 120 kg sand står stilla
även utan sug.

## ☠️ 3. Maxlasten är SÄCKENS vikt, aldrig användarens

Fem produkter bär ett kilotal som är lätt att läsa fel:

| pid | leverantörens ord | vad talet ÄR |
|---|---|---|
| `f8d974b3` | Tragfähigkeit 60 kg | säckens vikt ställningen bär |
| `d307632a` | Maximale Belastung 60 kg | samma |
| `49d6d56f` | Belastbarkeit 25 kg | samma |
| `6f603856` | Belastbarkeit 120 kg | samma |
| `c00988e3` | Belastbarkeit 100 kg | samma |
| `b6c4c619` | Maximale Belastung 100 kg | samma |

Det är #548 ordagrant, bara i en annan familj: *"300 kg är bänkens kapacitet,
inte kundens vikt"*. Ingen av de sex sidorna får formulera talet så att det går
att läsa som en användarvikt — och ordet **säckens** ska stå i samma mening som
talet.

⚠️ `49d6d56f`:s 25 kg är dessutom LÅGT för en boxsäck, och säcken som ingår är
tom segelduk. Att skriva "hänger en tung säck" på den sidan vore fel åt exakt
det håll som kostar en retur.

## ⚠️ 4. Ingen CE-märkning får påstås

Leonard har sagt att sortimentet ska vara CE-märkt. För de HÄR produkterna är
det inte en fråga om att uppfylla kravet utan om att kravet inte finns: en
boxsäck, ett stativ och ett väggfäste omfattas inte av något direktiv som ger
CE-märkning. Att sätta märket på en produkt utan direktiv är i sig en
överträdelse.

**Sidorna nämner alltså inte CE alls**, varken som löfte eller som avsaknad.
Samma hållning som runda 52 landade i om EN 71 på sandlådorna.

## ⚠️ 5. Två produkter säger emot SIG SJÄLVA — inget av talen får skrivas

Inte en laglighetsfråga, men den hör hemma i samma grind: ett tal som finns i
två versioner är inget tal.

| pid | fältet | leverantörens två svar |
|---|---|---|
| `c00988e3` | bollens höjdlägen | ingressen "vier verschiedene Höhen" · punktlistan "5-stufig" |
| `c00988e3` | material | "Stahlrohr, Kunststoff, MDF" · spec-raden "Stahlrohr, PVC, MDF" |
| `74602345` | färg | "Schwarz+Rot" · spec-raden "Schwarz" |
| `1409d762` | material | **spec-raden säger sammet, skum och gummiträ** |

☠️ **`1409d762`:s spec-rad är inte oense — den är omöjlig.** Sammet, skum och
gummiträ är en MÖBELspec, kopierad från en annan produkt. En boxsäck av sammet
finns inte. Technische Daten säger stål, PU och HDPE, vilket är vad varan
faktiskt är. Det är #366 i en ny familj, och det avgör vilken källa som får
skrivas: **den tyska `Technische Daten`, aldrig spec-raden**, på just den sidan.

Alla fyra bärs vidare som `motsagelse`-fält i `matt.py`. Ett tal man tystar är
ett tal ingen upptäcker.

## ☠️ 6. `1409d762` bär Aosoms artikelnummer i sin egen brödtext

Leverantörens `Technische Daten` innehåller raden `Artikelnummern: …`. Det är
#470 ordagrant — och det är källan till de fyra publicerade sidor som redan
läckt numret.

Numret får inte nå produktsidan, inte spec-tabellen, inte alt-texten och **inte
det här publika repot**. `matt.py` bär därför bara flaggan
`artikelnummer_i_texten: True`, aldrig strängen. Grinden `G.ARTNR` körs över
varje fält innan något skrivs.

## Vad som INTE är ett hinder

- **Ålder.** `9119599f` nämner ungdomar i höjdresonemanget. Produkten är ändå
  ingen leksak och ska inte marknadsföras mot barn — men den behöver ingen
  åldersgräns, och EN 71 gäller den inte.
- **Vattenfyllning.** Alla fyllbara fötter tar sand eller vatten. Inget av det
  kräver en varning inomhus.
- **Import.** Aosom-varor, samma väg som resten av katalogen.
