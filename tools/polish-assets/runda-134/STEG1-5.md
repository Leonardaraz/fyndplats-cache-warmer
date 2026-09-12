# Runda 134 — klöstunnefamiljens sex sista utkast, Steg 1–5

Runda 133 tog den tunnformade grenen och lämnade **hybriderna** — tunna plus
pelare plus plattformar — till den här rundan. Det visade sig vara rätt
uppdelning av ett skäl ingen hade räknat med: en av de sex är inte en tunna
alls.

## Steg 1 — ÄRVT, inte omgjort

Familjesvepet gjordes i runda 133 och gick till uttömning (`cursor === null`,
57 sidor / 5 649 produkter, 3 049 utkast). Bytegrinden md5-jämförde **103
bilder över tjugo produkter** — och de tjugo inkluderar alla sex här
(`runda-133/bilder.py`). Rundans dubblettfråga är alltså redan besvarad och
behöver inte ställas om:

- **Ingen av de sex är dubblett** av varandra eller av de 43 publicerade.
- Enda delade bilden som rör rundan är `d0b80807`:s **leverantörsreklam** på
  position 5, delad med runda 133:s `a33447f9` och `e43b623c`.

⚠️ **Att ärva ett svep är bara giltigt när svepet täckte det man ärver.** Det
gör det här, mätbart: de sex artikel-id:na står i den fil bytegrinden läste.
Hade rundan plockat en produkt utanför de tjugo hade svepet behövt göras om.

## Steg 2 — laglighetsgrinden

Klösmöbler är **möbler, inte djurhållning**: SJVFS 2019:15 reglerar utrymmen
för hållna djur, och en klösmöbel är inget djurutrymme. Runda 25:s grind för
familjen (tippskydd, takspänne, maxvikt) gäller oförändrad.

⚠️ **Två av sex är höga nog att vara tippfrågor, och ingen levereras med
väggrem.** `38022bcb` är 109 cm på en 60 × 44,5 cm sockel, `668e0e0c` 81 cm på
45 × 45 cm. Leveranslistorna (`Lieferumfang`) nämner ingen rem, alltså får
ingen sådan påstås — och ingen egen säkerhetsutfästelse hittas på.

## Steg 3–4 — vad de sex faktiskt är

| id | vad bilden + måtten visar | form |
|---|---|---|
| `f6857ca0` | liggande cylinder i sjögräsrep på vagga av furu, **en** öppning | tunna |
| `09336fdf` | vattenhyacint, 2 plan, **2** öppningar, dyna på toppen | tunna |
| `d0b80807` | sisal, 2 plan, **2** öppningar, hoppplattform på stolpe | tunna + pelare |
| `f4e6159e` | 4 plan: topplatå, dubbelhåla, sidoplattform | tunna + pelare |
| `668e0e0c` | ☠️ **45 × 45 cm FYRKANT**, 2 plan, sisalpanel på sidan | **låda** |
| `38022bcb` | sisaltunna 3 plan / 3 öppningar + bädd på stolpe, 109 cm | tunna + pelare |

### ☠️ `668e0e0c` HETER "Kratztonne" och är en LÅDA

Leverantören kallar den `Kratztonne mit 2 Katzenhöhlen`. Måtten säger något
annat, och de säger det tre gånger:

```
Gesamtabmessungen:  45L x 45B x 81H cm        ← kvadratisk grundyta
Innenabmessungen:   42L x 42B x 33H cm        ← kvadratiskt inre
Türöffnungen:       22B x 26H / 22B x 29H cm  ← RAKA mått, ingen diameter
```

En tunna har EN diameter. Den här har längd och bredd, och båda är 45. Bilden
bekräftar det: fyra lodräta kanter, plan sisalpanel på sidan. **Namnet får
alltså inte innehålla "tunna"** — det är uppgift #462:s klass (leverantörens
produktnamn är ingen källa), och det här är det renaste exemplet familjen gett:
namnet påstår en GEOMETRI som måtten motsäger.

⚠️ Följden för rundans egen dubblettfråga: `668e0e0c` hör inte ihop med de fem
andra som "samma sorts vara i en annan storlek". Den ska inte korslänkas som
syskon till en tunna.

### ☠️ Steg 4 — TVÅ måttritningar bär TYSK TEXT (uppgift #401, tredje och fjärde)

`668e0e0c` bild 3 och `38022bcb` bild 3 bär en påklistrad panel längst ned:

```
Produktinformation
Rasse    ---  Britisch Kurzhaar   /   American Shorthair
Gewicht  ---  3,5 Kg              /   5 Kg
```

Måttritningen är normalt den bild man BEHÅLLER — den bär geometrin. Att slänga
den hade kostat kunden alla mått för att bli av med två tyska ord.

✅ **Metod T-B ur `bildmetoder.md`: täck textregionen med bakgrundsfärgen.** Den
är tillämplig här och bara här, därför att panelen ligger på ren vit
studiobotten, helt skild från ritningen. **Ingen pixel av varan rörs** — det är
Leonards gräns ordagrant ("bildpolering rör bakgrunden, aldrig varan").

☠️ **VITMÅLA, BESKÄR INTE.** Runbooken: *"En MÅTTRITNING måste paddas, inte
beskäras"* — etiketterna sitter per definition i kanterna och PDP:ns
centrumbeskärning tar dem först. Båda ritningarna är **2000 × 2000**, alltså
redan kvadratiska, så PDP-beskärningen är en no-op. Att kapa underkanten hade
gjort bilden icke-kvadratisk och därmed återinfört precis det felet, för att bli
av med två ord.

Panelens överkant **detekteras, den gissas inte** (`tvatt.py`: första helvita
raden underifrån): `668e0e0c` y=1517, `38022bcb` y=1513 av 2000. Kontrollerat på
resultatet: varenda måttetikett står kvar.

### ☠️ Steg 4 — och TVÅ bilder vars enda motiv är leverantörens märke

| id | bild 5 | vad det är |
|---|---|---|
| `d0b80807` | PawHut-reklam | *"Ihre Welt, ihre Regeln"* + logotyp × 2 — känd sedan runda 133 |
| `f6857ca0` | ☠️ **närbild på PawHut-PLATTAN** | metallplatta skruvad i vaggan, förstorad till full läsbarhet |

Den andra är ny och kräver ett avgörande, för Leonards regel pekar åt båda håll
vid första anblick: *"om märket sitter fysiskt på varan så gör vi inget åt det,
det är så produkten ser ut."*

**Gränsen går vid vad bilden HANDLAR om, inte vid var märket sitter.** Plattan
sitter på varan och syns i bild 1 — där lämnas den orörd, oläsbar i den
storleken, precis som regeln säger. Bild 5 är däremot inte en bild av produkten
som råkar visa märket: den är en bild AV MÄRKET, uppförstorad tills logotypen
fyller halva rutan, och den säger ingenting om varan. Att publicera den är att
publicera leverantörens varumärkesbild.

**Båda tas bort i Steg 9.** Regeln, formulerad så den går att återanvända:
*ett husmärke på varan lämnas — en bild vars MOTIV är husmärket publiceras inte.*

## Steg 5 — påståenden mot bild, måttritning och tysk text

### Det som bilden avgjorde

| id | fråga | svar | avgjord av |
|---|---|---|---|
| `f6857ca0` | ingår dynan? | **ja** | `Lieferumfang` listar den INTE, men namnet, brödtexten OCH måttritningen (37 × 27 cm, ritad separat) gör det — tre källor mot en ofullständig lista |
| `38022bcb` | tre öppningar? | **ja** | ritningen visar tre, tyskan säger tre |
| `09336fdf` | två öppningar? | **ja** | bild 1 + 2 visar två, tyskan säger två |
| `668e0e0c` | tunna? | **nej** | måtten, se ovan |

⚠️ **`f6857ca0` är uppgift #468:s spegelbild.** Där var lärdomen att
`Lieferumfang` är kontraktet och att inget får lovas som listan inte listar.
Här listar den för LITE: dynan är namngiven i produktnamnet, beskriven i
brödtexten och måttsatt i ritningen. En lista som motsägs av tre andra källor
är ofullständig, inte begränsande. **Riktningen spelar roll:** #468 skyddar mot
att lova för mycket, och den regeln står oförändrad.

### ☠️ `f4e6159e`: ingångarna är Ø14 cm och katten får väga 5 kg

Leverantörens egna tal, båda ur samma `Technische Daten`:

```
Eingänge der Katzenhöhle:  Ø14 cm
Geeignet für eine oder zwei Katzen bis 5 kg
```

Ø14 cm är den smalaste ingången i hela familjen — rundans övriga ligger på 16,5
till 18 cm, och runda 133:s på 15,5 till 18. En katt på 5 kg tar sig inte
självklart genom ett hål på fjorton centimeter.

**Det är inte en motsägelse att rätta, det är ett mått att SKRIVA UT.** Båda
talen är leverantörens, och ingen av dem går att verifiera hårdare än så.
Kunden som har en storvuxen katt behöver se hålets mått innan hen köper —
alltså står `Ø14 cm` i speclistan och i brödtexten, och inget "passar alla
katter" skrivs någonstans.

### Materialraden måste skrivas om — fem av sex är förkortningar

Ärvd regel från runda 133, och den gäller varenda produkt här:

| id | svenska spec-raden | tyskans faktiska lista |
|---|---|---|
| `09336fdf` | `Wasserhyazinthe` ← **oöversatt tyska** | stål, vattenhyacint, sammetsliknande polyester |
| `d0b80807` | `Polyester` | spånskiva, plysch (100 % polyester), sisal |
| `f4e6159e` | `Sisal` | spånskiva, PP-bomull, plysch, sisal, **papper** |
| `668e0e0c` | `Sisal` | spånskiva, kortplysch, sisal |
| `38022bcb` | `Sisal` | spånskiva, plysch (100 % polyester), sisal |
| `f6857ca0` | `Kiefernholz, Seetangseil, flanellener Polyester` ← **helt oöversatt** | furu, sjögräsrep, flanellpolyester |

☠️ Två av sex bär **tyska ord i den SVENSKA spec-raden**. `Wasserhyazinthe` och
`Kiefernholz, Seetangseil, flanellener Polyester` är inte förkortningar utan
oöversatt källtext som importen kopierat rakt av.

### Färgraden

| id | tyskan | svenska spec-raden | vad fotot visar |
|---|---|---|---|
| `09336fdf` | `Hellbraun` | `Braun` | ljus naturton, oblekt vattenhyacint |
| `d0b80807` | `Beige+Braun` | `Beige+Braun` ← **`+` är inte svenska** | beige plysch, gråbrun sisal |
| `668e0e0c` | `Dunkelgrau` | `Grau` | mörkgrå, tydligt mörkare än "grå" |
| `38022bcb` | `Weiß+Grau` | `Weiß, Grau` ← **oöversatt tyska** | gräddvit plysch, grå sisal |
| `f6857ca0` | `Khaki+Natur+Beige` | `Khaki, Natur, Beige` | sjögräs mot gräddvit plysch, furu |
| `f4e6159e` | `Beige` | `Beige` | beige |

### Vad som INTE får påstås

- **Maxlast finns bara på `f4e6159e`** (`Belastbarkeit: 10 kg`). De fem andra
  anger ingen — och då skrivs ingen.
- **`Vikt` i spec-tabellen är FRAKTVIKTEN** (uppgift #488). Ingen av de sex har
  ett `Gewicht` i tyskan att ställa mot den. Varans egen vikt är alltså **inte
  känd** och får inte påstås för någon av dem.
- **Kattens vikt är leverantörens rekommendation, inte en gräns** — 3,5 kg
  (`09336fdf`), 5 kg (`f6857ca0`, `d0b80807`, `f4e6159e`, `38022bcb`), 6 kg
  (`668e0e0c`).
- **Ingen väggrem** finns i någon leveranslista.
- ⚠️ **`d0b80807`:s tyska intro är en trasig mening i källan:** *"Die
  Katzentonne bietet mit zwei Höhlen."* Den saknar objekt. Ingenting ska
  härledas ur den — de två hålorna står i punktlistan och syns på bilden.

---

## ✅ Steg 7 — sex texter skrivna och verifierade 6 av 6

| id | slug | rev | synliga tecken | fnv1a mot filen |
|---|---|--:|--:|---|
| `f6857ca0` | `kattbadd-sjogras-43-cm` | 1→2 | 2 233 | ✅ |
| `09336fdf` | `klostunna-50-cm-vattenhyacint` | 1→2 | 1 976 | ✅ |
| `d0b80807` | `klostunna-61-cm-hoppplattform` | 1→2 | 2 063 | ✅ |
| `f4e6159e` | `klostrad-90-cm-dubbelhala` | 1→2 | 2 114 | ✅ |
| `668e0e0c` | `klostorn-81-cm-fyrkantigt` | 1→2 | 2 229 | ✅ |
| `38022bcb` | `klostrad-109-cm-tunna-badd` | 1→2 | 2 151 | ✅ |

Alla sex står kvar på `visible: false`. Steg 7 skickar `id`, `revision`,
`name`, `slug`, `plainDescription` och `seoData` och **inget mer** — ett
utelämnat `visible` rör inte synligheten, medan ett medskickat kan publicera
utkastet i förtid.

### ☠️ Grinden hittade fyra fel i mitt EGET första utkast

Det är hela skälet till att texten skrivs i en fil först (uppmätt 9 fel inline
mot 0 via fil). Inget av de fyra hade synts i ett API-svar, för svaret ekar
tillbaka exakt det man skrev.

1. ☠️ **FEM förekomster av "rundan" i KUNDTEXT** — uppgift #318 igen, och
   orsaken är mekanisk: texterna jämfördes **med varandra** medan de skrevs
   ("rundans minsta", "den enda i rundan", "rundans högsta"), så
   arbetsprocessens ord följde med ut till kunden. Rättat per ORD.
2. ☠️ **Ett SORTIMENTSSUPERLATIV**: *"den smalaste öppningen vi säljer i den
   här familjen"*. Det evaderar jargonggrinden genom att peka på BUTIKEN i
   stället för på batchen — och är värre, för de 43 publicerade klösträden har
   ingen av oss mätt. Ersatt med talet självt (Ø14 cm).
3. ☠️ **En ☠️-markör läckte in i kundtext.** Fångad av en `grep`, inte av ögon.
4. En **maxlast** som facit saknade underlag för.

### ☠️ En BYTEJÄMFÖRELSE AV `plainDescription` FALLER ALLTID

Wix normaliserar markupen vid skrivning: varje `<li>text</li>` lagras som
`<li><p>text</p></li>`. Uppmätt på `f6857ca0`: filen 2 838 tecken, Wix 3 225 —
**387 tecken som ingen av oss skrev.**

Det gör en naiv verifiering värdelös åt BÅDA håll: den rapporterar fel på en
korrekt skrivning, och den som sett den falla en gång slutar verifiera. Samma
familj som ett falsklarm som alltid fyrar.

✅ **Det som går att jämföra är den SYNLIGA texten** — det kunden läser, och
det enda vi faktiskt påstår något om. Taggarna är Wix sak. `verifiera.py` bär
facit för alla sex, och samma FNV-1a körs på båda sidor.

⚠️ Och en påminnelse om uppgift #425: PATCH-svaret bär **ingen**
`plainDescription` alls utan `?fields=PLAIN_DESCRIPTION` — det svarade
"0 tecken" på en skrivning som gick igenom.

### Kvar i rundan

Steg 8 (SKU till Wix + mappning), Steg 9 (bildordning, alt-texter, ta bort de
två leverantörsbilderna, ladda upp de två tvättade ritningarna, bygga och
ladda upp sex Fyndplats-kort), Steg 10 (kategorier), Steg 13 (publicera) och
Steg 14 (live-grind). Sidorna är osynliga utkast tills dess — ingen kund ser
något halvfärdigt.
