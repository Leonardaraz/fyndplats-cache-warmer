# Runda 120 — läge

**Åtta barbordsset. Steg 1–7, 9 och 11 är KLARA, gröna och pushade.
Steg 8, 10, 12, 13 och 14 är blockerade av att Wix svarar 403.**

## ☠️ Blockeraren

`ExecuteWixAPI` svarar **403 på allt** sedan cirka 15:40:

| anrop | svar |
|---|---|
| `stores/v3/products/search`, naken, `limit 1` | 403, tom kropp |
| `GET /stores/v3/products/{id}` | 403, tom kropp |
| `categories/v1/categories/query` | 403, tom kropp |
| `site-media/v1/files/search` | **403 `PERMISSION_DENIED`, errorCode −100** |

Media-anropet är det som ger domen: det är en **behörighet**, inte en
strypning, och inte en felformad fråga — en naken sökning med `limit: 1` faller
likadant. Uppgift #342 noterade att samma 403 var borta sedan runda 95; den är
tillbaka.

⚠️ **Prisgrinden gick igenom ändå.** Steg 4:s grind går via
`polish-mapping.yml` mot Postgres, inte via Wix — 8 av 8 `stämmer: true`,
runs 2400–2407. Det är värt att komma ihåg vid nästa avbrott: de två vägarna
in i driften är oberoende.

## Vad som är klart

| steg | kvitto |
|---|---|
| 1 katalogsvep | 57 sidor till `cursor === null`, familjen 47 utkast + 20 publicerade |
| 1 dubblettgrind | ett par FRIAT som färgsyskon (`c88b5bbb` / `63a37524`) |
| 2 säkerhet | bordslasten 20–170 kg, fem set utan lastuppgift lämnade utanför |
| 3 mått | `matt.py`, 8 produkter, **8 regler**, 12 muterade fall 0 släppta |
| 4 bilder | 40 granskade i två pass, 3 åtgärdade, 0 tyska |
| 4 pris | 8 av 8 `stämmer: true` |
| 5 motsägelser | utomhus på MDF, färgsyskon med olika material, overifierad vikt |
| 6–7 texter | 8 texter **0 fel**, 38 självtestfall, 9 fältfall |
| 9 alt | **47 alt-texter 0 fel**, 26 självtestfall, 4 ordningsfall |
| 11 kort | **8 kort**, 0 fel, i `kort/` så Wix kan hämta dem ur grenen |

## Vad som återstår, i ordning

1. **Steg 8** — variant-SKU i Wix + mappningen (`polish-mapping.yml stampla`).
   ☠️ TRE av åtta bär samma rå-SKU `FP-bartisch-set-bartisch`; de polerade
   sluggarna löser krocken.
2. **Steg 9:s SKRIVNING** — ladda upp korten, sätt galleriordningen och
   alt-texterna. Ordningen ligger i `alt.ORDNING`.
   ☠️ `fieldMask` ska vara `["media"]` UTAN `visible` — runda 119 mätte 9/9
   orörda med den masken och 8/8 nedslagna med `["media","visible"]`.
3. **Steg 10** — kategorier. Förälder + löv, `treeReference` krävs, och
   `All Products` går inte att skriva till.
4. **Steg 12** — återläsning och ordsummekontroll.
5. **Steg 13** — publicera + stämpla mappningsraden.
6. **Steg 14** — live-grinden, **EFTER Steg 10** (uppgift #443: kategorierna
   skapar en ny grannkanal på sidan).

## Filerna

| fil | vad |
|---|---|
| `matt.py` | enda talkällan, 8 regler, `RITNING` som tredje källa |
| `texter.py` | namn, slug, titel, meta, sökord, brödtext |
| `grind.py` | textgrinden, `fargfel()` delas med `alt.py` |
| `alt.py` | 47 alt-texter + galleriordningen |
| `kort.py` | åtta kort, byggda ur `rawbilder/*-01.jpg` |
| `kort/` | de färdiga korten — SPÅRBARA, till skillnad från `jpg/` |
| `polerad/` | `c3bda64a` bild 2 beskuren, bild 3 tvättad |
| `mappningar.json` | wixVariantId, rå-SKU, pris, lager, fraktandel |
