# Runda 136 — Steg 2 och 5

## Steg 2 — laglighetsgrinden fäller ingenting, och det är ett svar

Klösmöbler är **ingen stoppklass**. SJVFS 2019:15 (L80) sätter minimimått för
burar, hus och inhägnader — inte för möbler ett djur rör sig fritt runt.
EN 71 gäller barnleksaker, inte husdjursmöbler. Grinden är alltså körd och
grön, inte överhoppad.

Det som däremot gäller är runda 25:s tre klösträdsregler: **tippskydd,
takspänne och maxvikt**. Alla tre gav utslag.

## ☠️ Fynd 1 — tippskyddet står i PROSAN men inte i LEVERANSLISTAN

| produkt | vad prosan lovar | vad Lieferumfang listar |
|---|---|---|
| `05136778` | *"Verdickte Basis und **Anti-Kipp-Gurt**"* | 1 × Katzenbaum, 1 × Gebrauchsanleitung |
| `f8528666` | *"**Eingebautes** Anti-Kipp-Gerät"* | 1 × Kratzbaum, 1 × Handbuch |

**Lieferumfang är kontraktet** (uppgift #468). En rem som säljtexten lovar men
leveranslistan inte nämner är exakt det fabricerade leveranslöfte uppgift #423
byggdes för att stoppa.

`f8528666`:s formulering är den svårare: *eingebaut* betyder inbyggt, alltså
ingen separat del — men vad den inbyggda anordningen ÄR går inte att läsa ur
källan, och på ett fristående 98 cm-träd med 60 × 40 sockel är ett
"inbyggt tippskydd" inget man kan beskriva för en kund utan att gissa.

**Beslut: ingen av de åtta får bära ett tippskyddslöfte.** Samma regel som
runda 135, men av ett annat skäl — där fanns ingen rem alls, här finns två
obelagda.

## ☠️ Fynd 2 — `860b6eb9` marknadsförs för TRE katter utan att ange totallast

| | |
|---|---|
| prosan | *"private Plätze für **bis zu drei** glückliche Katzen"* |
| tekniska data | *"Empfohlenes Haustiergewicht: **≤6 kg**"* |
| maxlast | **anges inte alls** |

Tre katter à 6 kg är 18 kg på en möbel vars bärförmåga leverantören aldrig
skriver ut. De sju andra anger en totallast; den här gör det inte.

**Sidan får därför inte påstå "tre katter".** Den enda siffra källan belägger
är kattens vikt, ≤6 kg — den skrivs, antalet skrivs inte.

## ☠️ Fynd 3 — `4a5acc7d` saknar VARJE viktuppgift

Ingen maxlast, ingen rekommenderad kattvikt, ingenting. Prosan säger bara
*"private Räume für **mehrere Katzen**"*.

Sidan får alltså ingen bärförmågerad över huvud taget — och den får inte
heller säga hur många katter den rymmer. Det är en tom ruta i spec-tabellen,
inte ett tal att härleda.

## ☠️ Fynd 4 — `860b6eb9` är en KLÖSTUNNA, inte ett klösträd

Leverantörens namn säger *"101 cm Katzenturm"*, men källan säger något annat
tre gånger:

```
Katzentonnen-Größe:  Ø36 x 101H cm
"Diese 101 cm hohe Struktur der Kratztonne …"
Lieferumfang:  1 x Katzenfass
```

`Gesamtabmessungen: 50L x 36B x 101H` är SOCKELN (`Basisgröße: 50L x 36B`),
inte tunnan. Varan är en Ø36 cm klöstunna på en bred fot.

Uppgift #462 igen: **leverantörens produktnamn är ingen källa.** Sidan måste
heta klöstunna, och den måste skiljas från de publicerade klöstunnorna —
närmast är `klostunna-96-cm-gra` (Ø38 × 96), alltså annan diameter och annan
höjd.

## ☠️ Fynd 5 — `4a5acc7d` bär ett SYSKONS spec-rad

Samma produkt beskriver sin översta liggyta som *"die oberste Liegefläche mit
erhöhten Rändern **der Katzentonne**"* — men dess egna mått är fyrkantiga:
sockel 41 × 41, inre skikt 39,5 × 39,5, dörröppning 18 × 18. Ingenting är runt.

Raden är kopierad från tunnsyskonet ovan. Samma klass som uppgift #366, där ett
spec-block visade sig komma från en annan modell. **Ordet "tunna" får inte
följa med in i den svenska texten.**

## ⚠️ Fynd 6 — `ae1c848f` anger "30 % Nitril" i ett tyg

`Kaschmir-Imitat (70% Polyester, 30% Nitril)`. Nitril är ett gummi, inte en
textilfiber; det är nästan säkert en felöversättning av en akrylfiber.

**Skrivs inte ut.** Materialraden anger polyesterblandning — det som går att
belägga — inte en fiber vars namn källan sannolikt har fel om.

## ⚠️ Fynd 7 — `ae1c848f`:s "Katzenhöhle" är 17,5 × 17 cm

Samma produkt listar både `Katzenhaus: Ø36 x 24H cm` och
`Katzenhöhle: 17,5L x 17H cm`. En håla på 17,5 × 17 cm rymmer ingen katt —
det är husets **ingång**, inte ett andra utrymme.

Sidan beskriver alltså ETT hus med en ingång på 17,5 × 17 cm, inte två
viloplatser. Leverantörens egen rubrik ("1 Katzenhöhle, 1 Liegefläche") är
rätt; det är spec-raden som är feletiketterad.

## Sammanfattning: vad varje sida FÅR säga om vikt

| pid | kattvikt | maxlast | antal katter |
|---|---|---|---|
| `4a5acc7d` | — | — | **får inte anges** |
| `860b6eb9` | ≤6 kg | — | **får inte anges** |
| `05136778` | under 5 kg | 15 kg | 1–3 |
| `105c685a` | upp till 5 kg | 10 kg | 1–2 |
| `7f8e495b` | upp till 5 kg | 10 kg | 1–2 |
| `ae1c848f` | upp till 8 kg | 15 kg | — |
| `f8528666` | under 6 kg | 20 kg totalt, 10 kg per plan | — |
| `63a586da` | under 5 kg | under 5 kg | **en** katt |

☠️ Talen i kolumnerna är leverantörens EGNA och står oförändrade. Där rutan är
tom får sidan inte fylla den — ett härlett tal är ett påhittat tal.
