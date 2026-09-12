# Runda 137 Steg 7 — skrivkvitto

Varje rad är MÄTT: hashen av `plainDescription` som Wix lagrade jämförd med
`wix_normalisera(källan)`, byte för byte. Ett LÄNGDTAL duger inte — en
formel kan stämma medan tecknen är fel.

| pid | slug | revision | byte för byte | produkt `visible` | variant `visible` |
|---|---|--:|---|---|---|
| `c7bd00b9` | `klostrad-takspant-ek` | 3 | **OK** | false | true |
| `a73a1a1c` | `klostrad-takspant-gratt` | 2 | **OK** | false | true |
| `f5f71f5d` | `klostrad-90-cm-cremevit` | 2 | **OK** | false | true |
| `dd3b541b` | `klostrad-90-cm-gratt` | 2 | **OK** | false | true |
| `f489937f` | `klospelare-91-morkgra` | — | väntar | — | — |
| `5616c567` | `klospelare-91-ljusbrun` | — | väntar | — | — |
| `1ae60dbc` | `kattrappa-66-cm-beige` | — | väntar | — | — |
| `819bf51c` | `kattrappa-66-cm-ljusgra` | — | väntar | — | — |

## Så vet skrivningen att den skriver rätt sträng

Wix-sandboxen kan varken läsa en lokal fil eller hämta från
`raw.githubusercontent.com`, så payloaden klistras in. Det gör klistret till
felkällan — och därför bär varje anrop TVÅ hashar ur `steg7-hashar.json`:

1. **`skickat`** kontrolleras FÖRE anropet. Stämmer den inte har klistret
   gått fel, och då skrivs INGENTING. Samma tanke som asserten i ett
   rättelseskript: det som skyddar är att skriptet dör, inte att det gissar.
2. **`lagrat`** kontrolleras EFTER, mot svarets `plainDescription`.

⚠️ De två talen är olika med flit. Wix skriver om markupen vid lagring
(`<strong>` → `<span style="font-weight: 700">`, `<li>` wrappas i `<p>`,
länkar får `target="_self"`), så en rå jämförelse mot källan ger avvikelse
på varje korrekt produkt. `grindar.wix_normalisera` gör om källan till det
Wix FAKTISKT lagrar, och det är den strängen som hashas.

☠️ **`visible` skickas aldrig.** Fältet speglas ned på varianten, och en
variant med `visible: false` betyder att sidan saknar köpbar variant den dag
den publiceras. Kvittot läser tillbaka båda: produkten står kvar `false`
(utkast), varianten `true` (köpbar).
