# Runda 142 — Steg 10: kategorierna, och en grind jag gjorde om

**11 av 11 bevisade** i **Sport & Fritid → Träning & Gym**
(`de100f8d…` + `56dcc575…`).

## Lövet är MÄTT, inte valt

| var | kategorier |
|---|---|
| `fristaende-boxningssack-156-cm` | Sport & Fritid · Träning & Gym |
| `fristaende-boxningssack-160-230-cm` | Sport & Fritid · Träning & Gym |
| `smart-boxningsdyna` | Sport & Fritid · Träning & Gym |
| runda 141:s sju hantelbänkar | Sport & Fritid · Träning & Gym |

Familjens tre publicerade sidor ligger alla i samma löv, och rundan följer dem.
Det är svaret på #444: en familj som splittras över två löv gör det för att
någon valde kategori ur produkttypen i stället för ur syskonen.

## ☠️ Jag GJORDE OM #390 — och det var KONTROLLPRODUKTEN som fångade det

Första läsningen plockade `r.categoryIds` ur svaret. Fältet heter
**`directCategoryIds`**. Resultatet: elva produkter OCH tre publicerade
syskonsidor rapporterade **noll kategorier**, utan ett enda fel.

☠️ **Och för rundans elva var nollan SANN.** De bar bara `All Products`. Ett
tomt svar som råkar stämma är det farligaste utfallet av alla — det bekräftar
mätaren i stället för att avslöja den. Det som tog fel var samma läsning på de
tre PUBLICERADE sidorna, som visst har kategorier; hade jag litat på den hade
rundan "bevisat" att familjen är okategoriserad och lagt de elva någon
annanstans.

**Det som avslöjade den var en KONTROLLPRODUKT**, inte eftertanke: runda 141:s
hantelbänkar, som jag själv kategoriserade förra rundan och alltså VET ligger i
trädet. De svarade noll på samma läsning. En mätare som säger noll om ett känt
positivt fall är trasig, och det går att se på en sekund.

Det är samma mekanik som live-grindens kontrollsida (Steg 12/14), en nivå upp:
**en läsning ska mätas mot ett känt utfall innan dess svar får betyda något.**
Råsvaret skrevs dessutom ut ordagrant — `rasvar_nycklar` — precis som runda 108
lärde, för det var enda sättet att se att `categoriesForItems` fanns medan
`categoryIds` inte gjorde det.

## Kvittot är ett OMVÄNT bevis, inte `totalSuccesses`

Två kategorier skickas per produkt, och `totalSuccesses: 2` säger bara HUR
MÅNGA som gick igenom — aldrig VILKA. Skrivningen körs därför **två gånger**,
och andra gången måste varje kategori svara `ALREADY_EXISTS` på sitt eget
`originalIndex`:

```
forsta:  {"totalSuccesses":2,"totalFailures":0,"undetailedFailures":0}
bevis:   {"foralder":"ALREADY_EXISTS","lov":"ALREADY_EXISTS"}
```

11 av 11 med den formen. Det går inte att missförstå åt något håll: ett
`ALREADY_EXISTS` på ett index är ett positivt påstående om just den kategorin.

☠️ **`All Products` skickas ALDRIG med.** Den ägs av Stores-appen och svarar
`MANAGED_CATEGORY_OPERATION_NOT_ALLOWED` — produkter hamnar där av sig själva.
Den syns i läsningen, och det är rätt; den skrivs inte.

⚠️ **Ingen GET användes som kvitto.** `directCategoriesInfo` släpar efter en
skrivning, och en grind byggd på den säger "inte klar" om ett korrekt utfall.

## Steg 11 är en no-op

Alla elva är `variantCount: 1` utan optioner — en Aosom-rad är en artikel.
Ingen `linkedMedia` att sätta, ingen axel att sanera.
