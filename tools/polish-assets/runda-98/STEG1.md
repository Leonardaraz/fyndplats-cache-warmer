# Runda 98 — Steg 1: familjen, klustren och batchen

## Familjen: 16 utkast, inte 26

Runda 97:s Steg 1 räknade familjen genom att söka på foder-ord i kön. Det
svepet drog in **fågelburar, kaninhyddor, hamsterburar och sköldpaddshus** —
alla nämner `Futtertrog` eller `Futterschale`. Den här rundans sökning kräver
matbars-ord OCH `hund`/`dog` OCH utesluter burorden. Utfall: **16 utkast**,
plus en falsk träff (`ec967e62`, en `Hunde-Absperrgitter`) som sållats bort för
hand.

3 277 osynliga utkast lästes, 33 sidor.

## ☠️ Klustren är FÄRGSYSKON, inte dubbletter — #348 avgjord

Runda 97 lämnade #348 öppen med formuleringen *"tretton av 26 utkast är
måttvillingar i fyra kluster"*. Måttet var fel bevis: de tal som klustrade var
**paketmåtten**, och två olika modeller kan mycket väl packas i samma kartong.

Tre oberoende mått pekar nu åt samma håll, och det tredje är avgörande.

**1 — Beskrivningen är ordagrant densamma på nära teckennivå.**

| kluster | utkast | tecken i `plainDescription` |
|---|---|--:|
| slitsdörrar | `d362f9b3` `9a600fda` | 1 965 / **1 965** |
| 44 L luckor | `18b9ec99` `9cfc2f50` `f8594223` | 1 989 / 1 989 / 1 994 |
| låda + kupolhandtag | `8c1d08c5` `31d6a3df` `3710a0c3` `5eb270ed` | 2 011 / 2 011 / 2 013 / 2 017 |
| lyftlock | `5d7aab1b` `edd89684` `a8e376e7` | 1 831 / 1 844 / 1 836 |

Hasharna skiljer sig, längderna gör det knappt. `Grau` och `Weiß` är båda fyra
tecken; `Schwarz` är tre fler. Differenserna ovan är exakt de.

**2 — Feedens artikelnummer delar BAS och skiljer på SUFFIX.** Samma mekaniska
grind som #275 fastställde. `aosom-feed-search.yml` med `futterstation
edelstahl` gav bland annat:

```
D08-040V00GY   D08-040V00WT   D08-040V00BK      ← tre färger, en modell
D08-054V00GY   D08-054V00WT
D08-041V80CF   D08-041V01BK   D08-041V00WT   D08-041V80GY
D08-021CF      D08-021WT      D08-021V00GY
```

**3 — Bilderna avgör.** `steg1-kontaktark.jpg` visar de sexton första bilderna
bredvid varandra. Klustren är samma möbel i olika kulör, ned till handtagens
form och panelernas delning. Det är den mätning texten inte kunde göra.

☠️ **Slutsatsen är alltså motsatt den #348 antog.** Ingenting ska mappas om,
ingenting pensioneras. Det är fyra modeller sålda i tre till fyra kulörer var —
precis den katalogform runbokens syskonregel finns för.

⚠️ **Följden för poleringen:** färgsyskon poleras i SAMMA runda, mot samma
faktaunderlag, och korslänkas. Poleras de var för sig blir de fyra sidor som
säger samma sak med olika ord — den interna dubbletten Google faktiskt straffar.

## De fyra modellerna, sedda i bild

| # | modell | utkast (kulör i bild) |
|---|---|---|
| A | **matskåp med två panelluckor**, runda knoppar, pärlspontsfront | `9cfc2f50` vit · `18b9ec99` grå · `f8594223` svart |
| B | **matskåp med två slitsdörrar**, svarta gångjärn och regel | `d362f9b3` vit · `9a600fda` gråblå |
| C | **matskåp med en stor låda**, kupolhandtag i mässing, kantlist upptill | `8c1d08c5` grå · `3710a0c3` mörkbrun · `5eb270ed` svart · `31d6a3df` vit |
| D | **matlåda med lyftlock**, bygelhandtag på kortsidan, inget skåp | `a8e376e7` vit · `5d7aab1b` salviagrön · `edd89684` mörkbrun |

Och fyra singlar, alla olika konstruktion:

| utkast | vad bilden visar |
|---|---|
| `143bef7b` | grått skåp med **benformad urtagning** i bakstycket, räfflad front |
| `79ccfef4` | vit stomme, mörkgrå topp, en låda med infälld greppskåra, bärhandtag |
| `4fb98338` | mörkgrått, **öppen hylla** över en panelad låda |
| `e9309338` | **höjdjusterbart stativ** på ben, vit låda med hål |

## Rundans batch: de sex skåpen med DÖRRAR (modell A + B)

Modell A och B är båda tvådörrarsskåp, alltså samma kundfråga och samma
kategorilöv — och samma sak som runda 97:s `868cc038` (`matskap-hund-34-cm-tva-dorrar`),
som därför är den naturliga korslänken.

```
9cfc2f50   modell A, vit
18b9ec99   modell A, grå
f8594223   modell A, svart
d362f9b3   modell B, vit
9a600fda   modell B, gråblå
143bef7b   singel, benurtagning       ← sjätte, samma möbeltyp
```

Modell C och D lämnas hela till runda 99 respektive 100. Att dela ett
färgkluster mellan två rundor vore att skriva halva syskonlistan två gånger.

## ☠️ Tre SKU-krockar, samma importbugg som #272

Importens 24-teckenkapning har gett fem produkter samma SKU:

| SKU | utkast |
|---|---|
| `FP-erhohte-futterstation` | `143bef7b` `d362f9b3` `9a600fda` `18b9ec99` `f8594223` |
| `FP-futterstation-erhohte` | `8c1d08c5` `3710a0c3` `5d7aab1b` |
| `FP-futterstation-2` | `5eb270ed` `31d6a3df` `edd89684` |

**Fem av de sex i den här batchen sitter i den första krocken.** Steg 8 måste
alltså ge alla sex nya, unika SKU:er — och unikheten ska kontrolleras mot
varandra, inte bara mot katalogen.

## ✅ Varianterna är redan `visible: true`

Runda 97:s sista fälla var två varianter som stod kvar på `visible: false` och
gav en live sida vars vara inte gick att lägga i varukorgen. Alla sexton
utkast här bär `visible: true` på sin enda variant. Kontrolleras ändå om vid
Steg 13 — produktens synlighet speglar ned, så en PATCH däremellan kan flytta
den.
