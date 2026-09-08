# Runda 104 Steg 2 + 4 + 5 — elva utkast granskade var för sig

Varje utkast lästes av en egen agent som hämtade källtexten OCH laddade ner
och tittade på alla fem bilderna. Måttritningen lästes av tal för tal och
ställdes mot spec-blocket, enligt runda 103:s regel.

## Fyra modeller, klustrade på MÅTTRADEN

| modell | mått (L × B × H) | medlemmar | färg i källan |
|---|---|---|---|
| **A** terrängfordon | 100 × 64 × 56 | `ed84746c` · `60ab2042` · `3b992525` | Grau+Schwarz · Blau+Schwarz · Gelb+Schwarz |
| **B** elbil | 96 × 61 × 56 | `f15febb2` · `3d9dff8a` · `2f6ff71c` | Rosa · Orange · Blau |
| **C** motorcykel | 106,5 × 56 × 80 | `5e9cc2d2` · `1e27f7e0` | Weiß · Gelb |
| **D** polisbil | 96 × 60 × 45 | `9308a7dc` | Mehrfarbig |
| **E** sportbil | 98 × 59 × 43 | `c0abfddd` | Grau |
| **F** quad | 100 × 65 × 73 | `883db249` | Orange |

✅ **Ingen kopierad spec-block-fälla den här gången.** Modell A:s tre syskon och
modell B:s tre syskon har identiska tal på både ritning och i text, och
ritningarna bekräftar dem. Det är motsatsen till runda 103.

## ☠️ SEX av elva bär ett FORDONSVARUMÄRKE

| utkast | märke | var det sitter |
|---|---|---|
| `ed84746c` `60ab2042` `3b992525` | **Kawasaki Teryx KRX 1000** | i texten OCH fysiskt på fordonet i alla fem bilder |
| `5e9cc2d2` `1e27f7e0` | **Aprilia RX 125** | i texten OCH på framskärm/styrkåpa i bild |
| `c0abfddd` | **Maserati GranTurismo Folgore** | i texten OCH treudden på grill, huv, nav och nackstöd |

☠️ **`c0abfddd` är en Maserati** — det syntes inte i Steg 1, där texten bara sa
"lizenzierte … von [BRAND NAME]". Agenten hittade "Maserati Gran Turismo
Folgore-Design" i brödtexten och treudden i pixlarna.

Licenspåståendena ordagrant: *"Kawasaki-lizenziert"*, *"Das von Aprilia
autorisierte Elektromotorrad"*, *"Dieses konzipierte, lizenzierte
Kinder-Elektroauto"*.

**Fem utkast är helt märkesfria:** modell B:s tre, polisbilen och quaden.
(Quaden bär tillverkarens egen beteckning `QLS-ATV` / `BIGHORN 2.0` i
pixlarna — en modellbeteckning, inte ett licensierat fordonsmärke.)

## ☠️ Två färgangivelser är FEL mot bilden

| utkast | källan säger | bilden visar |
|---|---|---|
| `3b992525` | `Gelb` (gul) | **beige/sand** — pixelmätt `#d6b69d`, nyans 29–30°, mättnad 20–34 %. Gult ligger runt 50–60° med hög mättnad. |
| `1e27f7e0` | `Gelb` (gul) | **svart motorcykel** med gula och röda dekaler |

Att skriva "gul" på någon av dem vore ett direkt fel mot kunden. Färgen ska
läsas ur bilden, inte ur källans färgord.

## ☠️ Åldern motsäger sig själv på modell A

Spec-blocket och måttritningen säger båda `3-5 Jahre`. **Bildernas alt-text —
alltså feedens ursprungstitel — säger `3-8 Jahren`.** Ritningen och specen är
eniga; alt-texten är den som avviker. **Skriv 3–5 år, aldrig 3–8.**

Det är samma familj av fel som runda 103, men åt andra hållet: där ljög
spec-blocket och ritningen hade rätt, här ljuger TITELN och de två andra har
rätt. Regeln står sig: ritningen är facit.

## Tal som INTE går att skriva

| utkast | vad som inte går att avgöra |
|---|---|
| modell A (tre st) | **ingen batterikapacitet alls** i källan — bara "12V" i namnet. Ingen motoreffekt. |
| `9308a7dc` | spec säger `Motor: 25W` (singular), säljpunkten säger `Zwei Motoren`. 2 × 25 W eller 25 W totalt går inte att avgöra. |
| `5e9cc2d2` `1e27f7e0` | spec säger `Motor: 12V 25W` (singular), brödtexten säger `zwei 12V Motoren` två gånger. Samma oklarhet. |
| `883db249` | **motoreffekt anges inte alls** |

Husets regel gäller: när källan motsäger sig själv väljer man inte, man
utelämnar.

## ⚠️ `883db249` har INGEN måttritning

Fem bilder, ingen av dem en måttritning. Måtten `100 × 65 × 73` går alltså inte
att verifiera mot något oberoende. Efter runda 103 är det ett skäl att lägga
den sist, inte att lita på texten.

## ☠️ Importen lämnar TYSKA FÄRGVÄRDEN i den SVENSKA spec-tabellen

Uppmätt på sju av elva: raden har svensk etikett och tyskt värde.

`Färg: Grau` · `Färg: Blau` · `Färg: Gelb` · `Färg: Weiß` · `Färg: Pink` ·
`Färg: Multifarben` · `Material: Kunststoff`

Det är ett IMPORT-fel, inte ett poleringsfel — men det når kunden om ingen
rättar det. Samma klass som `[BRAND NAME]`-platshållaren.

## ⚠️ Tysk text i pixlarna på NIO av elva

Måttritningarna bär `Empfohlenes Alter: 3-5 Jahre` och `Gewichtsgrenze: 30KG`
inbränt. Position 3 är normalt en av de rena positionerna (23/30 enligt husets
mätning), men här är den tysk på nästan hela familjen.

Bara `5e9cc2d2` och `1e27f7e0` (motorcyklarna) är fria från tysk text i bild.

## Vad som går att polera NU

**Modell B — de tre elbilarna.** Märkesfria, fullständiga specar (batteri
12V 4,5 Ah, motor 2 × 12V 25W, laddtid 8–12 h, körtid 45 min), ritning och text
överens på varje tal, och tre distinkta färger.

| id8 | färg | pris |
|---|---|--:|
| `f15febb2` | rosa | 2 229 |
| `3d9dff8a` | orange | 2 069 |
| `2f6ff71c` | blå | 2 159 |

De sex märkesbärande väntar på den juridiska genomgången.

-----

## c0abfddd — Maserati GranTurismo Folgore, grå (Steg 2/4/5)

Måttritningen (bild 3) bekräftar HELA spec-blocket: 98 × 59 × 43 cm, sits
32 × 19 cm, maxlast 25 kg, ålder 3–5 år. Ingen avvikelse — till skillnad från
runda 103:s `a0760ed1`, där ritningen fällde texten.

**Varumärket sitter FYSISKT på varan.** Maseratis treudd i grillen och på
huven, Folgore-emblemet på framskärmen. Leonards regel gäller: *"om märket
sitter fysiskt på varan så gör vi inget åt det"* — och han har uttryckligen
sagt att licenserna är äkta. Sidan skriver därför *"i Maserati GranTurismo
Folgore-design"*, vilket är exakt vad källan säger (`Folgore-Design`).

**Färgen stämmer med bilden** — grå kaross, svarta fälgar. Det gjorde den inte
för `3b992525` ("Gelb" är beige) eller `1e27f7e0` ("Gelb" är svart).

### Fyra saker källan säger som INTE fick skrivas rakt av

1. ☠️ **Ingen laddare i `Lieferumfang`.** Listan är bil, fjärrkontroll och
   bruksanvisning — punkt. Samma sak på polisbilen `9308a7dc`. En 12 V-bil med
   8–12 timmars laddtid är obrukbar utan laddare, så det är sannolikt en lucka
   i leverantörens lista snarare än verkligheten — men vi kan inte veta det.
   Sidan listar därför exakt de tre posterna och **påstår ingenting** om en
   laddare. En grindregel fäller varje formulering som lovar en.
   ⚠️ **Fråga att ställa till Aosom.** Om bilen faktiskt skickas utan laddare
   måste det stå på sidan, inte upptäckas på julafton.
2. ⚠️ **Materialet motsäger sig självt.** Det tyska spec-blocket säger
   `Kunststoff, Metall`; importens svenska rad säger bara `Kunststoff`. Sidan
   följer det utförligare blocket ("Plast och metall"). Skillnaden är liten men
   den är en gissning, inte en mätning.
3. **2 × AAA till fjärrkontrollen ingår inte** — det står i källan och har fått
   en egen `Ingår inte`-rad plus en FAQ-fråga. Ett batteri som saknas när
   paketet öppnas är exakt den sortens sak som blir ett supportärende.
4. **Montering krävs.** Står i källan, saknas i importens svenska tabell.

### Talen som skiljer den från rundans övriga

Värt att notera för nästa grind: den här bilen är LÅNGSAMMARE och bär MINDRE
än modell B. Sådana skillnader är precis vad som slinker igenom om grinden
bär grannmodellens siffror.

| | modell B (publicerad) | `c0abfddd` |
|---|---|---|
| Hastighet | 3–7 km/h | **3–5 km/h** |
| Maxvikt | 30 kg | **25 kg** |
| Körtid | 45 min | **50 min** |
| Hjul | Ø 24 cm | **Ø 19 cm** |
| Sitthöjd | — | **14 cm** |

### Grinden

Egen grind med den här modellens tal (`grind_c0.py`), självtestad genom att
återinföra tre farliga fel: grannmodellens maxlast, ett laddarlöfte och ett
CE-påstående. **Alla tre fälls av rätt regel.**

☠️ **Och grindens första version gav 22 falsklarm.** Regeln "stycke utan
punkt" träffade varenda `<li><p>`-rad i spec-tabellen, som med flit saknar
punkt. En grind som skriker på en korrekt text lär läsaren att sluta läsa —
samma regel som mot ett rött synk-jobb vid varje svep. Kontrollen gäller nu
bara brödtext.

Efter skrivningen kördes grindens regler om mot **Wix egen kopia** i stället
för mot filen: 5 347 tecken, 15 obligatoriska tal på plats, 19 främmande tal
frånvarande, noll otillåtna mönster. Det är kvittot — inte PATCH-svaret.

-----

## Kawasaki-trion (Steg 2/4/5) — ☠️ TVÅ AV TRE FÄRGNAMN ÄR FEL I KÄLLAN

Måttritningen bekräftar hela spec-blocket: 100 × 64 × 56 cm, sits 31 × 19 cm,
maxlast 30 kg, ålder 3–5 år. Färgerna gör det inte.

| id8 | källan säger | bilden visar | pris |
|---|---|---|--:|
| `ed84746c` | `Grau+Schwarz` | ☠️ **VIT** störtbåge och frontbygel, gröna dekaler | 2 099 |
| `60ab2042` | `Blau+Schwarz` | turkosblå — rimligt, men *turkos* är precisare | 1 999 |
| `3b992525` | `Gelb+Schwarz` | ☠️ **BEIGE**, en sandton. Inte gul. | 2 019 |

☠️ **Och felet sitter djupare än i texten.** `3b992525`:s artikelnummer slutar
på **`YL`** och leverantörens egen produkt-URL slutar på `…-gelb`. Leverantören
tror alltså själv att bilen är gul, hela vägen ner i sitt eget sortimentssystem.
En polering som litet på källan hade sålt en färg vi inte kan skicka — exakt
`#330`, som kostade en publicerad sida.

**Bilden är facit.** Sidorna säger vit, turkosblå och beige. Grinden förbjuder
dessutom ordet *gul* överallt, även i en negation: en text som skriver "inte
gul" får läsaren att tänka på gult på en sida som aldrig påstått det.

### ☠️ Källan saknar tre tal som rundans ANDRA modeller har

Ingen batterikapacitet, ingen laddtid, ingen räckvidd för fjärrkontrollen. De
talen står på polisbilen och Maseratin, och det är precis så ett främmande tal
vandrar in i en text. Grinden förbjuder dem uttryckligen (`4,5 Ah`,
`8–12 timmar`, `15 m`), och självtestet bekräftar att den fäller om de smyger
in.

### Tre andra saker som inte fick skrivas rakt av

1. ☠️ **`Lieferumfang` listar bara UTV och handbok — ingen fjärrkontroll.**
   Tredje produkten i rad med en trasig innehållsförteckning. Här är den
   bevisligen ofullständig: produkten HETER "mit Fernbedienung" och en
   säljpunkt beskriver föräldrafjärrkontrollen. Sidan listar därför bil,
   fjärrkontroll och bruksanvisning — men säger fortfarande ingenting om
   laddare.
2. ⚠️ **Källan säger `Hinterradaufhängung`, bilden visar en fjäder vid
   FRAMhjulet.** Texten säger bara "fjädring" och namnger ingen axel.
3. ⚠️ **Leverantörens URL säger `3-8 jahren`, spec-blocket och ritningen säger
   3–5 år.** Ritningen är facit, som i runda 103.

### ☠️ Wix takar `product.name` på 80 TECKEN — uppmätt

Det första namnförslaget var 84 tecken för turkosen och avvisades med
`400 … name has size 84, expected 80 or less`. **De två kortare syskonen hade
då redan skrivits** — en halvskriven familj där den tredje saknade allt.

Gränsen står inte i något vi läst; den kom ut ur ett felmeddelande. Namnen är
kortade till 69/71/75 tecken så hela familjen ryms med marginal.

### ☠️ Och grindens egen NBSP-kontroll var ett falsklarm som alltid fyrade

Regeln letade efter osynliga tecken skrivna som LITERALER i källkoden. Heredocen
som skrev grinden normaliserade U+00A0 till ett vanligt mellanslag, så
kontrollen jämförde ett vanligt mellanslag mot varje text — och fällde alla tre
sidorna trots att ingen av dem bar tecknet.

**Regeln: ett osynligt tecken får aldrig skrivas som en literal i en grind.**
Explicita `\uXXXX`-escapes är det enda som överlever transporten. Båda
grindarna är lagade, och `c0abfddd` står kvar grön med en kontroll som nu
faktiskt kontrollerar något.

### ⚠️ `60ab2042` är polerad men PUBLICERAS INTE

`OUT_OF_STOCK` (mätt 2026-09-08). Texten är skriven, grindad och skriven till
Wix — bara `visible` står kvar på `false`. En kund som landar på en sida hen
inte kan köpa är ett sämre utfall än en sida som ännu inte finns.

⚠️ Den kan publiceras direkt när synken fyller på. Då måste de två publicerade
syskonens länklistor uppdateras — de säger i dag "två färger", inte "tre".
Samma sak som `#295`.

⚠️ `3b992525` har **1 i lager**.
