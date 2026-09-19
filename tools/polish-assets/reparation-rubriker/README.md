# Rubrikreparation: spec-tabellen renderade inline på 128 sidor

## Vad som var fel

Butiken delar produkttexten i flikar genom att splitta på EXAKTA strängar.
Runbooken säger det rakt ut:

> ⚠️ strängen måste stämma ORDAGRANT (`Tekniska specifikationer` ·
> `Användning och skötsel` · `Vanliga frågor`). Skriver du `Specifikationer`
> matchar splittern inte och spec-tabellen renderas inline mitt i brödtexten —
> **det ser inte trasigt ut, bara som en rubrik till.**

Tidigare rundor hittade på sina egna etiketter (#146). Uppmätt 2026-09-07 över
2 250 publicerade sidor:

| rubrik som användes i stället | sidor |
| :-- | --: |
| `Måtten` | 59 |
| `Mått och material` | 54 |
| `Mått och vad som ingår` | 3 |
| `Mått och utrustning` | 2 |
| `Mått och funktioner` | 2 |
| `Måtten — räkna på innermåttet` m.fl. | 8 |
| **`Frågor och svar` i stället för `Vanliga frågor`** | **56** |

Alla dessa sidor är välskrivna svenska sidor från rundorna 19–33 — problemet är
inte texten utan att den hamnade i fel behållare.

## Två spärrar i bytet

1. ☠️ **En sida som redan har den rätta rubriken rörs ALDRIG.** Fanns båda vore
   bytet en gissning om vilken av två sektioner som är den riktiga spec-tabellen.
   Fyra sidor bar båda och lämnades orörda.
2. ☠️ **Rubriken måste förekomma exakt EN gång.** `t.split(rubrik).length === 2`.
   Med två förekomster vet man inte vilken som är sektionsrubriken.

## ⚠️ Timeouten var inget kvitto på att ingenting skrevs

Första körningen tog hela beståndet i ett svep och slog i verktygets 60 sekunder.
Felet såg ut som ett misslyckande — men 66 produkter var redan skrivna. Mätningen
efteråt visade det; en omkörning utan mätning hade varit ofarlig här (bytet är
idempotent) men är det inte i allmänhet.

## ⚠️ Och en verifiering som fällde 19 korrekta skrivningar

Andra tuggan rapporterade `skrivnaOchVerifierade: 16` av 35. Villkoret var
`t.includes("<h2>Tekniska specifikationer</h2>")` — men 19 av sidorna hade bara
sin FAQ-rubrik bytt och har ingen spec-sektion alls. **Kontrollen krävde något
den ändrade aldrig lovade.** Rättad till att verifiera det som FAKTISKT byttes:
den gamla rubriken borta OCH den nya på plats, per byte.

## Utfall

| | före | efter |
| :-- | --: | --: |
| Sidor med `Tekniska specifikationer` | 2 068 | **2 196** |
| Sidor med `Vanliga frågor` | 2 194 | **2 250** |
| Gammal spec-rubrik kvar | 182 | **0** |
| `Frågor och svar` kvar | 56 | **0** |

De 54 utan spec-sektion är säsongsdekorationer (uppblåsbara figurer, ljusslingor)
som aldrig haft en måttabell — inte ett fel, en produkttyp.
