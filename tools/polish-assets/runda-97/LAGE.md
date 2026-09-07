# Runda 97 — läge

Sex foderstationer för hund ur Aosom-familjen. Familjen valdes på mätning:
26 utkast / 0 publicerade — den enda kollisionsfria familjen i kön.

| id8 | slug | mått | status |
|---|---|---|---|
| `e8102582` | `upphojd-matskal-hund-hojdjusterbar-11-33-cm` | 40,5 × 22 × 39 | klar, opublicerad |
| `1fc55b3d` | `matskalsstall-hund-fyra-hojder-lutbart` | 48 × 26 × 36,5 | klar, opublicerad |
| `2e2b2366` | `matplats-hund-tre-hojder-kaffebrun` | 54 × 31,5 × 47 | klar, opublicerad |
| `868cc038` | `matskap-hund-34-cm-tva-dorrar` | 60 × 30 × 34 | klar, opublicerad |
| `7628983b` | `matskap-hund-42-cm-30-liter` | 60 × 30 × 42 | klar, opublicerad |
| `75556831` | `husdjursskap-82-cm-matplats-i-lada` | 61 × 35,5 × 82 | klar, opublicerad |

## Klart och verifierat mot Wix

Steg 1–7, 9, 10 och 12 är gjorda. Klart-kriteriet kördes mot Wix och gav
**0 brister** på hash, slug, galleriets antal och alt-texter, kortets plats,
korslänkar, kategori, husmärke, artikelnummer, namn- och metalängd samt
sifferstil.

* **Texterna** — alla sex hash-exakta (`facit.json`), 2 110–2 377 synliga tecken.
* **Galleriet** — 6/5/6/6/6/6 bilder, svensk alt-text på varje, Fyndplats-kortet
  på plats 3, måttritningen efter det.
* **Kategori** — `Husdjur` + `Mat & Vattenskålar` på alla sex, 2/2 per produkt
  bekräftat per kategori (inte bara `totalSuccesses`).
* **Korslänkar** — fyra sidor länkar till 868cc038, som fick ny slug.

## ☠️ KVAR: SKU + stämpling + publicering, och de hänger ihop

GitHub-kopplingen är borta i den här sessionen (ingen `mcp__github__*` finns,
kontrollerat med riktad `ToolSearch`, inte antaget). `polish-mapping.yml` är
enda vägen till mappningsraden, och `CRON_SECRET` är Sensitive i Vercel.

De tre stegen är **ett paket**, inte tre valfria:

1. **Steg 8 (SKU) är INTE gjord med flit.** Runbokens Steg 13 säger att
   mappningens `variants[].sku` ska skrivas i samma veva, *"och Aosom-prissynken
   matchar Wix-varianten på just det fältet"*. Skrivs Wix-sidan utan
   stämplingen glider de två isär och prissynken slutar hitta varianten —
   samma klass av fel som kostade en månad 2026-08-29. Wix och mappningen bär
   nu **samma** (tyska) SKU, alltså i fas. Det som väntar är att byta båda.
2. **Publiceringen väntar på stämplingen**, inte tvärtom. `needsAiPolish: false`
   är det som tar produkten ur poleringskön. En publicerad sida som
   fortfarande står som opolerad är ett halvtillstånd — och en ANNAN session
   polerar samma kö (#262/#302) och kan plocka upp dem.

**Att göra när GitHub är tillbaka**, i ordning:

```
FP-upphojd-matskal-11-33          e8102582
FP-matskalsstall-fyra-hojder      1fc55b3d
FP-matplats-tre-hojder-kaffebrun  2e2b2366
FP-matskap-34-cm-tva-dorrar       868cc038
FP-matskap-42-cm                  7628983b
FP-husdjursskap-82-cm             75556831
```

Steg 8 mot Wix (`visible` MÅSTE med i bodyn) → `polish-mapping.yml` läge
`stampla` med `needs_ai_polish=false`, `draft_status=published` och
`variant_skus` → Steg 13 `visible: true` → `livegrind.py`.

## Fynden

Se `STEG1-2.md`, `STEG4.md` och commit-meddelandena. De fyra som är värda att
minnas:

1. ☠️ **`868cc038` såldes som "skjutdörrar" — den har dörrar på GÅNGJÄRN.**
   Tre svarta gångjärnsplattor syns i produktbilden, och måttritningen visar
   båda dörrarna utslagna utåt. Felet satt i namn, slug, SEO, ingress, en
   egenskapsrad, ett helt skötselstycke om ett spår som inte finns,
   kortrubriken, alt-texten och fyra syskonsidors korslänk.
2. ☠️ **`7628983b`:s förvaring är en låda som dras ut från kortsidan.** Bild 5
   visar den utdragen, bild 1 och 2 handtaget. Texten sa bara "inuti finns
   30 liter" och lämnade kunden att gissa; alt-texten kallade bild 5 "sett
   från sidan".
3. ☠️ **Tre kortrubriker skrev spec-tabellens starkaste TAL i stället för
   fotots starkaste MOTIV.** Ingen var osann — därför var de svåra att se.
4. ☠️ **Fjorton kommalistor av tal**, varav en i meta-beskrivningen. Regeln
   fanns i runboken men inte i rundans lint; den fångades först av
   klart-kriteriet mot Wix.

⚠️ `75556831` bär husmärket FYSISKT på lådfronten. Leonards regel gäller:
märket sitter på varan, bilden rörs inte, och det nämns aldrig i text eller
alt-text.

⚠️ `868cc038` har två oförenliga mankhöjder (bild 50–60 cm, brödtext 55–65 cm).
Ingen av dem skrivs; sidan anger höjden till skålen (34 cm) i stället.

## Mätningar som är nya för huset

* ☠️ **`plainDescription` ligger inte i GET:ens standardprojektion.** Utan
  `?fields=PLAIN_DESCRIPTION` saknas fältet helt — min verifiering hashade
  tomma strängen och rapporterade `hashOK: false` på en skrivning som gått
  igenom. Samma asymmetri som `MEDIA_ITEMS_INFO`.
* ☠️ **Två fält i samma `?fields=` ger 400.** `PLAIN_DESCRIPTION,MEDIA_ITEMS_INFO`
  svarar *"Failed to parse JSON or deserialize protobuf message"*. Ett fält
  per anrop.
* ☠️ **Transkriptionshashen är BLIND för länkar.** `synlig()` strippar taggar,
  så de fyra syskonsidorna hashar identiskt före och efter att deras href
  pekats om. Länkar måste räknas separat.
* **`UploadImageToWixSite` svarar i samma ordning som anropet** — mätt, inte
  antaget: alla nio uppladdade filer är byte-identiska med den lokala fil de
  påstås vara.
