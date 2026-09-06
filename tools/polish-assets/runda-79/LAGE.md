# Runda 79 — läge

Åtta rullpallar och salongspallar ur samma tyska familj. Två av familjens
utkast visade sig vara dubbletter och poleras inte.

## Rundans åtta

| id8 | slug | SKU | pris | rev |
|---|---|---|--:|--:|
| `983fe163` | `rullpall-vit-oval-rygg-48-64-cm` | `FP-rullpall-vit-oval-rygg` | 799 | 5 |
| `98c1b3cb` | `rullpall-svart-oval-rygg-48-64-cm` | `FP-rullpall-svart-oval-rygg` | 799 | 5 |
| `711f7859` | `salongspall-kupad-rygg-53-73-cm` | `FP-salongspall-kupad-rygg` | 899 | 5 |
| `93b7d87b` | `salongspall-svart-hog-rygg-51-66-cm` | `FP-salongspall-svart-hog` | 919 | 5 |
| `c328a7c0` | `rullpallar-2-pack-lag-rygg-47-62-cm` | `FP-rullpallar-2-pack-lag` | 1 229 | 6 |
| `12ce97db` | `sadelpall-gra-svart-fot-45-59-cm` | `FP-sadelpall-gra-svart-fot` | 829 | 5 |
| `20782c24` | `sadelpall-hjul-49-61-cm-rosa` | `FP-sadelpall-hjul-49-61-cm` | 899 | 6 |
| `1d0ba82d` | `salongspall-vit-fotring-50-64-cm` | `FP-salongspall-vit-fotring` | 829 | 4 |

## Kvitton

| steg | utfall |
|---|---|
| **lint** | **0 fel i 8 produkter** |
| **mutationstest** | **33/33 fångade**, 0 fel på orörd text |
| **prisgrind (Steg 3–4)** | 8 gröna `las`-körningar av `polish-mapping` |
| **text (Steg 7–9)** | 8/8 skrivna, facit-grinden inne i anropet passerade på alla |
| **kort (Steg 11)** | 8/8 importerade byte-identiska, kort på **plats 3** på alla |
| **bilder (Steg 4)** | 2 borttagna (tysk text i pixlarna), 38 rena kvar |
| **kategori (Steg 10)** | 8/8 i Hem & Inredning |
| **publicering (Steg 13)** | 8/8 `visible: true`, variant `visible: true`, **priset orört** |
| **live (Steg 14)** | **8/8 `200`, cache `MISS`, texten byte-identisk med facit**, **12/12 länkmål `200`** |

## Fynd som inte fanns före rundan

### ☠️ `wix.request` tar bodyn under `body` — `data` slukas tyst

Runbooken dokumenterar det sedan 2026-09-05 och sessionen gick ändå i fällan.
Symtomen: `limit: 10` gav 100 rader och **tre olika filter gav byte-identiska
svar**. Det sista är kontrollen — ett filter som TILLÄMPAS kan inte ge samma
rader som ett annat.

Följden: Steg 1 såg sju utkast där familjen är tio.

### ☠️ Två utkast är dubbletter av publicerade sidor

`df3a97c6` mot `arbetsstol-hjul-51-67-cm-avtagbar-rygg`: sju identiska tal och
**medelavvikelse 1,0** mellan huvudbilderna — samma fotografi omkodat.

`9c6fde71` mot `arbetspall-med-hjul`: pixeltestet ger **19,2**, alltså ett annat
foto. Avgörandet ligger i måttritningen (35,5 / 48–63 / 48,5 — exakt sidans egna
spec-kort) och i den identiska stickningen, spaken och pelarkragen.

**Regeln: pixeltestet är ett POSITIVT test.** Ett lågt tal bevisar identitet;
ett högt tal bevisar ingenting och skickar dig till ritningen.

### ☠️ `c328a7c0` är ett tvåpack

*"Dieses Set aus 2 … Stühlen"*, `Lieferumfang: 2 x Hocker`. Steg 1 förde upp den
som en ensam pall.

Dess totalhöjd utelämnas: källan anger **tre** olika tal (52–72 i brödtexten,
57–72 i spec-listan, otydlig ritning). Sitthöjden 47–62 står i både spec och
ritning och är det enda höjdtal som går att belägga.

### ☠️ Tre hål i linten, alla hittade av mutationstestet

1. `HALSA_RE` hade ordgräns i SLUTET, så `hållning` matchade inte `hållningen`.
2. En spec-rad som NEKAR räknades som belägg: `Ryggstöd: nej` innehåller ordet.
3. Prosan byggdes ur den RENDERADE sidan, som innehåller spec-tabellen — så
   grinden jämförde specen med sig själv. Och en FRÅGA lästes som ett påstående.

Hål 2 och 3 tog ut varandra före lagningen: grinden fyrade aldrig på en
spec-listad post och såg därför frisk ut. Runda 78 hade ingen nekande spec-rad
och kunde inte se det.

### ☠️ Kategorins återläsning är eventually consistent

Återläsningen INNE i skrivanropet gav `harKat: false` på alla åtta — ett falskt
negativt. Ett separat anrop sekunder senare visar två kategorier på alla åtta.
**En verifiering som körs för tidigt är lika vilseledande som ingen alls.**

### ☠️ `stampla` publicerar inte

Den skriver mappningsraden i Postgres och rör inte Wix-produkten. Efter åtta
gröna stämplingar stod alla åtta kvar som `visible: false` med importens tyska
SKU. Publiceringen är Steg 13:s egen Wix-PATCH.

### ⚠️ Färgen är MÄTT, inte avskriven

`711f7859` heter `Weiß` men sitsens pixlar ger R−B = **+21** mot +1…+5 för de tre
andra vita — den är gräddvit. `12ce97db` heter `Schwarz` i brödtexten och `Grau`
i den svenska raden; medianluminansen är **75** mot 46–62 för de tre som verkligen
är svarta — grå sits, svart fot.

### ⚠️ En publicerad sida utan ett enda mått

`arbetsstol-salong-hoj-och-sankbar` är publicerad och innehåller varken sitthöjd,
maxlast eller yttermått. Den går därför inte att krockpröva mot, och en kund kan
inte avgöra om den passar. Egen åtgärd.

## Kvar ur familjen

`b9ab45db` — ingen pall utan en snurrstol med rygg och armstöd (60 × 60 × 79–91,
136 kg, 10,4 kg, EN12520). Tas i en snurrstolsrunda med de publicerade
snurrstolarna som krockunderlag.
