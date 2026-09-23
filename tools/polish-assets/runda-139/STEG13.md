# Runda 139 — Steg 13: stämpla och publicera

**Tio sidor LIVE.** Mappningsraderna stämplade, produkterna och deras varianter
satta synliga, och varje skrivning verifierad med en separat läsning.

| | |
|---|---:|
| Mappningsrader stämplade | **10/10** (`needs_ai_polish=false`, `draft_status=published`) |
| Produkter `visible:true` | **10/10** |
| Varianter `visible:true` | **10/10** (1/1 per produkt) |
| SKU oförändrad | 10/10 |
| **Pris oförändrat** | **10/10** |
| Bildantal oförändrat | 10/10 |

## ☠️ variantsInfo-PATCHen BEHÖVDES här — och mätningen vände mitt beslut

Öppen uppgift #535 säger att runbokens `variantsInfo`-PATCH *"ofta är onödig
OCH farlig"*, och jag gick in i steget med antagandet att varianterna redan var
synliga från Steg 8. **Det var fel, och läsningen visade det:**

```
vVisibleTyp: ["boolean:false"]     ← inte saknat falt, utan uttryckligen false
vMedia:      [0]                   ← varianten bar ingen media alls
```

Fältet är alltså satt till `false`, inte utelämnat ur projektionen — skillnaden
avgör saken. Produktens `visible:false` speglas NED på varianten, och en
publicering utan variant-PATCH hade lagt ut sidan med en vara som **inte går
att lägga i varukorgen**. Det syns inte i produktvyn.

Och #501:s fara — att varje `variantsInfo`-PATCH raderar variantens media —
kostar ingenting här, av samma mätning: `vMedia: 0` på alla tio. Det finns
ingen variantmedia att förlora.

**Så #535 är varken bekräftad eller motbevisad; den är preciserad:** frågan går
inte att svara på i förväg. `visible` på varianten måste LÄSAS, och här var
svaret att PATCHen var både nödvändig och ofarlig.

## Bara `visible` muterades — allt annat ekades tillbaka

Varianten lästes i sin helhet och skrevs tillbaka med `{...v, visible: true}`.
Priset rörs alltså inte ens teoretiskt: samma objekt går in som kom ut.
Kvittot är mätt, inte antaget — `prisOforandrat: true` jämför variantens
`price` före mot efter på varje produkt.

Revisionen lästes färskt direkt före varje PATCH. En annan session rör samma
katalog, och spannet syns i talen: `3addfbf8` stod på revision **8** medan
`1467588a` och `27b607dc` stod på **4**.

## Bildantalet stämmer mot Steg 9

| produkt | bilder | galleri.json |
|---|--:|---|
| `8d074911` | 4 | `[1,2,4]` + kort |
| `3addfbf8` · `90573e36` | 5 | `[1,2,4,5]` / `[1,4,5,3]` + kort |
| övriga sju | 6 | `[1,2,4,5,3]` + kort |

Före = efter på alla tio. PATCHen rörde inte produktens galleri.

## ☠️ Och jag skrev av fyra id ur minnet IGEN

Första variant-läsningen fick fyra `404 NOT_FOUND`: `27b607dc`, `3addfbf8`,
`8d074911` och `b813d037`. Anropet var en ren LÄSNING, så ingenting skrevs —
men det är andra gången i den här rundan, och `ids.json` bär regeln ordagrant:

> *Fullstandiga id far ALDRIG skrivas av ur minnet (oppen anmarkning #536).*

☠️ **En 404 är tur, inte en grind.** Ett felskrivet men EXISTERANDE id hade
svarat 200 och skrivit till fel produkt. Att fyra av tio råkade bli ogiltiga
UUID är slumpen, inte ett skydd.

Textskrivningen i Steg 12 var immun mot just det här: den hashade varje sträng
i sandboxen mot filens hash och vägrade PATCHa vid avvikelse. **Den grinden
saknas för id.** Uppgift #536 står kvar och är nu dubbelt belagd i en enda runda.

## Flikrubrikerna kontrollerade FÖRE publiceringen

Butikens `splitFlikar` känner exakt fyra mönster, och allt som ska ligga i
brödtexten måste stå FÖRE den första flikrubriken. Mätt offline på alla tio:

```
h2=7 pa varje sida, flikarna pa index [4, 5, 6] - alltsa de tre sista, i ordning
flikgrind (offline): 10/10 ok
```

Korslänkarna (`Passar inte den här?`) ligger på index 3, alltså före första
fliken. `<summary>`-kontrollen på den renderade sidan görs i Steg 14.

## Kvar i rundan

Steg 14, live-grinden — den körs EFTER kategorierna (uppgift #443), och
kategorierna skrevs i Steg 10.
