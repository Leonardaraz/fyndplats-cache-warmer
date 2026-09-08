# Runda 103 — Steg 2 (laglighetsgrind) och Steg 5 (påståenden per produkt)

Sex utkast, två modeller. Källorna lästa i tyskt original; färgsyskonen jämförda
bit för bit mot modellens referens.

## Steg 2 — passerar, men inte av samma skäl som runda 101/102

Klassen är **"el till kroppen"**. Den passerar när tre saker gäller: inget
hälsopåstående, lågspänning, uttrycklig maxlast. Kollat i källan:

| | modell A | modell B |
|---|---|---|
| Hälsopåstående | *"wohltuende Massage"*, *"verwöhnt"* | *"steigern das Entspannungserlebnis"* |
| — dom | komfortspråk, inget medicinskt | komfortspråk, inget medicinskt |
| Maxlast | **135 kg** uttryckligt | **150 kg** uttryckligt |
| Spänning | ☠️ **bara `AC100-240V`** | `Eingang 100-240V` / **`Ausgang 12V, 1A, 12W`** |

☠️ **Modell A saknar utgångsspänning i källan.** Runda 101 och 102 kunde luta sig
mot "12 V lågspänning" som Steg 2-argument. Här står bara nätspänningen in och
`Leistung: 12 W`. Tolv watt ANTYDER en adapter, men det får inte antas — Steg 5
säger aldrig hitta på siffror. Den svenska texten skriver därför
`Ström: 100–240 V, 50–60 Hz, 12 W` och påstår **ingen** lågspänning.

Grinden fäller alltså inget, men argumentet är smalare för A än för B, och det
ska inte skrivas som om det vore samma.

## ☠️ Steg 5 — modell B:s färgsyskon motsäger varandra på TVÅ tal

`5439026e` (blå) och `505eb413` (beige) är samma modell med identisk text —
utom här:

| | blå | beige |
|---|---|---|
| Armstöd | 28B × 26T × 11H cm | **50B** × 26T × 11H cm |
| Ingångsström | 0,5 A | **1 A** |

Ett armstöd kan inte vara både 28 och 50 cm brett på samma konstruktion, och
strömmen in kan inte fördubblas av en färg. **En av varje par är fel, och
källan säger inte vilken.**

Samma klass som runda 66:s fynd (*fyra fåtöljer där leverantören anger två
olika maxlaster för samma konstruktion*). Husets regel gäller: **när källan
motsäger sig själv mellan syskon väljer man inte — man utelämnar eller
flaggar.**

Beslut:

- **Armstödsbredden skrivs inte alls.** Den är inte köpavgörande, och båda
  talen är obelagda.
- **Ingångsströmmen skrivs inte.** Utgången (`12 V, 1 A, 12 W`) är identisk i
  båda och är den uppgift som betyder något.

⚠️ **Och ett tredje talfel, i BÅDA B-sidorna:** ryggstödet anges
`64B x 93T x 27T cm` — **två T**. En av dem ska vara H, och källan säger inte
vilken. Ryggstödets mått skrivs därför inte heller.

## ⚠️ Ingen av modellerna är en ELDRIVEN recliner

Det är den fällan runda 101 redan fångat en gång, och den ligger här igen:

- **Modell A:** *"Manuell verstellbar bis zu 145 Grad"* + *"Benutzen Sie Ihre
  Fersen, um gegen die Mitte des Fußteils zu drücken"*
- **Modell B:** *"Ziehen Sie an der seitlichen Lasche, um den Sitz um 145°
  zurückzulehnen"*

Elen driver **massagen och värmen** — ryggen och fotstödet är mekaniska. Texten
får aldrig säga "elektriskt justerbar", och det gäller trots att fyra av
familjens syskonutkast heter `Relaxsessel Elektrisch`.

## Det som SKA stå, som positivt villkor med egen rubrik

| | modell A | modell B |
|---|---|---|
| Maxlast | 135 kg | 150 kg |
| Kroppslängd | — | **≤ 190 cm** (källans egen uppgift) |
| Ryggläge | till 145°, manuellt | till 145°, manuellt |
| Massage | 8 punkter, 3 lägen, 15/30/60 min | 8 punkter, **5 lägen, 2 styrkor**, 15/30/60 min |
| Värme | ländrygg | ländrygg ("Nierenbereich") |
| Klädsel | konstläder | tyg, 100 % polyester |
| Montering | krävs | ca 30 min |

`Geeignete Körpergröße ≤190 cm` är en verklig begränsning som avgör köpet för
en lång kund. Den skrivs positivt — *"Passar kroppslängd upp till 190 cm"* —
aldrig som varning.

## Färgerna (för Steg 7:s ingress och Färg-rad)

| id8 | modell | tysk färg | svensk |
|---|---|---|---|
| `c396356f` | A | Hellgrau | ljusgrå |
| `a7f029bf` | A | Dunkelbraun | mörkbrun |
| `7e84e482` | A | Cremeweiß | cremevit |
| `297d8979` | A | Schwarz | svart |
| `5439026e` | B | Blau | blå |
| `505eb413` | B | Beige | beige |

☠️ Genus: *konstläder* och *tyg* är ett-ord. `ljusgrått konstläder`,
`mörkbrunt konstläder`, `cremevitt konstläder`, `svart konstläder`,
`blått tyg`, `beige tyg`.

## Kuriosum: källan är stympad där husmärket stod

*"dieser Relaxsessel von bietet alles"* och *"Der Massagesessel von ist die
perfekte Wahl"* — `von ` följt av ingenting. Det är importens
`[BRAND NAME]`-strykning som lämnat ett hål. Påverkar oss inte (vi skriver om
allt), men det bekräftar att strykningen körts på de här raderna.
