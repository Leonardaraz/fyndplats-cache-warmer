# Runda 99 — Steg 4 och 5: vad bilderna säger och vad leverantören inte får säga

## ☠️ Modell D:s mekanik: HELA SKIVAN LYFTS AV — det är inget lock

Den tyska texten säger *"einen Stauraum, indem man den Deckel anhebt"*. Ett
`Deckel` som `anhebt` läser man som ett gångjärnsförsett lock. Det är fel, och
två bilder avgör det:

- **`a8e376e7-2`** — skivan ligger på GOLVET bredvid den öppna lådan, med båda
  skålarna urlyfta bredvid sig. Inga gångjärn i bakkant på lådan.
- **`edd89684-5`** — samma skiva sedd uppifrån: en enda platta med två runda
  hål och en fasad framkant.

**Det är alltså en löstagbar skiva, inte ett lock som fälls upp.** Skillnaden
är köpavgörande: skivan måste ha någonstans att ta vägen när man fyller på,
och man kan inte öppna med en hand upptagen. Texten säger det rakt ut.

## ☠️ Modell D:s `Stauraum`-mått är INTE publicerbart

Leverantören anger invändigt `58L x 28B x 39H cm` (`a8e376e7`, `5d7aab1b`) och
`52L x 26B x 37H cm` (`edd89684`) i ett hölje som är `60 × 30 × 41 cm`.

Höjdledet går inte ihop. 39 cm invändigt i ett 41 cm högt hölje lämnar två
centimeter till botten OCH skiva tillsammans — och skålarna är `Ø24 × 7 cm`
och hänger NER genom skivan i just det utrymmet. Redan skålarna äter sju av
de två centimetrarna. `edd89684`:s 37 cm har exakt samma problem.

☠️ **Måttritningen är facit, och den har ingen invändig siffra.** Alla tre
ritningarna (`a8e376e7-3`, `5d7aab1b-3`, `edd89684-3`) ger `60 cm`, `30 cm`,
`41 cm` och skålen `Ø24 × 7 cm` — ingenting mer. Det finns alltså inget
oberoende stöd för invändighetstalet, och det tal som finns motsäger sig
självt.

**Inget invändigt mått skrivs ut på någon av de tre sidorna.** Det som skrivs
är det som går att mäta: yttermåttet, skålens mått och volym, sidohandtagens
mått, belastbarheten. Samma klass av beslut som paketmåttet, som huset redan
vägrar publicera (#266).

⚠️ Och notera att de tre syskonen inte är oense om PRODUKTEN utan om SIFFRAN:
allt annat i deras specar är identiskt. En sida som ärvt `58 × 28 × 39` från
sitt syskon hade sett konsekvent ut och varit lika fel.

## ☠️ Modell C: två av fyra är TVÅFÄRGADE, och leverantören namnger bara en

Uppmätt i `toppkoll.jpg`, en zoom på skivans framkant intill stommen:

| id8 | skiva | stomme | leverantören säger |
|---|---|---|---|
| `8c1d08c5` | **vit** | grå (R92 G92 B92) | `Grau` |
| `3710a0c3` | mörkbrun | mörkbrun (R60 G55 B51) | `Kaffee` |
| `5eb270ed` | svart | svart (R67 G67 B67) | `Schwarz` |
| `31d6a3df` | **grå** (R103 G103 B101) | vit (R240) | `Weiß` |

`8c1d08c5` och `31d6a3df` är alltså **spegelvända tvåtoner** — grå stomme med
vit skiva, respektive vit stomme med grå skiva. Leverantörens färgfält namnger
bara stommen. En kund som beställer "grå" och får en vit skiva har fått fel
vara beskriven för sig, och de två är dessutom lätta att förväxla med
VARANDRA i en miniatyr.

Båda sidorna skriver ut båda ytorna: `Färg: grå stomme, vit skiva` respektive
`Färg: vit stomme, grå skiva`.

☠️ **Och `8c1d08c5`:s alt-text säger `60 x 30 x 42 cm, Weiß`** — fel höjd (36)
OCH fel stommefärg. Samma defektklass som runda 98:s modell B, där alt-texten
bar ett syskons höjd. Alt-texten är aldrig en källa.

## ⚠️ `5d7aab1b`:s färg: leverantörens egna bilder är oense

| mätt yta | R | G | B |
|---|--:|--:|--:|
| `-1` front (studio) | 135,9 | 138,9 | 131,9 |
| `-1` kortsida (samma bild) | 154,2 | 146,7 | 137,4 |
| `-2` front (miljöbild) | 133,8 | 126,8 | 110,9 |
| `-3` front (ritning) | 135,4 | 138,4 | 131,4 |
| `-3` kortsida (ritning) | 130,8 | 133,7 | 126,9 |

Studiobilden och ritningen är eniga om fronten (grön dragning: G > R, B < R).
Ritningens kortsida är samma ton — alltså är den **beigea kortsidan i `-1` en
ljussättning, inte en tvåton**. Miljöbilden drar åt kaki.

⚠️ **Slutsatsen är den konservativa: `grå`, utan underton.** Grönstickets
storlek är 3–4 enheter av 136, alltså inom vad renderingar skiljer sig åt. En
sida som lovar "grågrön" och levererar neutralgrå är en felbeskrivning; en
som säger "grå" och levererar en dov salvieton är det inte. Leverantören
säger `Grau`, och bilderna gör resten.

## ☠️ Ett köpavgörande tal som bara finns i pixlarna

`5d7aab1b-3` bar en gul `HINWEIS:`-ruta som kapades bort i Steg 4. I den stod:

```
Bitte messen Sie die Schulterhöhe Ihres Haustieres vor dem Kauf.
Schulterhöhe : 40-65cm
```

Mankhöjdsspannet **40–65 cm** finns i INGEN av de tre modell D-utkastens
brödtexter, i ingen spec-rad, och på ingen av de två andra ritningarna. Det
existerar bara i den kapade rutan. Eftersom alla tre delar mått exakt gäller
det alla tre, och det står i klartext på var och en.

Samma klass som runbokens egen regel: ett köpavgörande tal kan finnas BARA i
pixlarna, och en kapning som inte lästes först hade slängt det.

## Bildarbetet

**Tre bilder plockas bort helt:**

| bild | varför |
|---|---|
| `31d6a3df-5` | gul PawHut-banner med engelsk text |
| `5d7aab1b-4` | tysk infografik, `SPEICHERFUNKTION` |
| `edd89684-4` | samma infografik på engelska |

⚠️ Skräpet är alltså engelskt lika ofta som tyskt — två av tre.

**Fem måttritningar kapade** på den tyska `HINWEIS`-rutan i underkant, andel
behållen 0,703–0,744. Kvitterat i `kapkoll.jpg`: ingen tysk text kvar, och
varje måttetikett överlevde (60 / 30 / 36 för modell C, 60 / 30 / 41 för
modell D, skål 24 / 7 cm ≈2 L).

**⚠️ PawHut-logotypen sitter FYSISKT på `31d6a3df`** — en oval dekal uppe till
vänster på lådfronten, syns i `toppkoll.jpg`. Leonards regel gäller: sitter
märket på varan gör vi ingenting åt det. Den nämns aldrig i text eller
alt-text.

**✅ `3710a0c3-5` kontrollerad och behållen.** Den såg vid första anblicken ut
att visa en annan produkt — en upphöjd matplats i svart metallram med en hund.
Zoomen visar att det brunt skåpet i bilden ÄR vår produkt, och att objektet i
förgrunden är en fristående hundbädd som rekvisita.

## ✅ Två saker bilderna BEVISAR som texten bara antyder

1. **Lådan går på metallskenor.** `5eb270ed-5` visar lådan utdragen med den
   svarta skenan synlig längs sidan. Leverantörens `Metallschienen` är alltså
   inte en översättningsartefakt.
2. **Alla fyra modell C har en förhöjd bakkant på skivan.** En uppvikt list
   bakom skålarna, tydlig i `toppkoll.jpg` på alla fyra. Den nämns inte med
   ett ord i leverantörens text — och den är precis det som hindrar en skål
   från att knuffas ut baktill.

Handtaget skiljer sig med kulören: mässingsfärgat kuphandtag på `8c1d08c5`,
`3710a0c3` och `31d6a3df`, förkromat på `5eb270ed`.

## ☠️ Steg 2: hälsopåståendena stryks, ordagrant som i runda 97 och 98

Runda 97:s grind gäller oförändrat. Den största studien (Glickman m.fl.,
JAVMA 2000, ~1 600 stora och jättestora hundar) pekar mot FÖRHÖJD risk för
magomvridning vid upphöjd skål; en senare studie fann ingen effekt.
Motstridigt läge är aldrig ett säljargument.

Tre påståenden i den här rundans råtext:

| modell | leverantörens text |
|---|---|
| C | *"Hundenäpfe mit Standfuß, um den Hals des Tieres nicht zu belasten"* |
| D | *"Erhöhtes Design, um den Körper Ihres Haustieres zu schonen"* |
| D | *"für größere und ältere Hunde, die sich nicht auf den Boden bücken können"* |

Inget om nacke, rygg, leder, hållning, matsmältning eller "skonsam" — inte
heller mjukat. Vi beskriver MEKANIKEN, och mankhöjdsspannet står i klartext
så kunden kan mäta sin egen hund.

## ⚠️ Två spec-rader som säger emot brödtexten

1. **`5d7aab1b`:s svenska materialrad säger bara `Edelstahl`.** Den tyska
   brödtexten på samma produkt säger `MDF, Edelstahl`, och syskonen har båda
   orden i den svenska raden. Stommen ÄR träfiberskiva; raden är ofullständig,
   inte en annan produkt.
2. **`3710a0c3` heter `Kaffee` i brödtexten och `Braun` i spec-raden.** Zoomen
   mäter R58 G53 B49 — en mycket mörk, varm brun. Publiceras som `mörkbrunt`.

⚠️ Alla fyra modell C-rader bär dessutom `Edelstahl/Holzwerkstoff` i ett fält
märkt svenskt. MDF skrivs som träfiberskiva, aldrig som "massivt trä" (#259).
