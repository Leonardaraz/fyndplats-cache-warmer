# Runda 139 — Steg 14: live-grind

**10 sidor, 0 fel.** Körd EFTER kategorierna (uppgift #443).

```
grindar._sjalvtest():  78 fall, 0 fel
kontrollsida klostrad-200-cm-sex-nivaer   1 träffar som är BUTIKENS
     (butikens) TRE LIKA KONSONANTER 'ttt' — 'Läs mer på bloggen: Klösträd & kattträd …'

tio sidor, alla HIT, alla 0 fel
SUMMA: 10 sidor, 0 fel
```

## ☠️ FYND: en fyndsträng som bär ett LÄGE kan aldrig subtraheras

Första körningen gav **6 fel på 6 korrekta sidor**. Alla sex var samma sak:
butikens egen bloggrubrik *"Klösträd & kattträd"*, som bär tre t (uppgift
#511, ska rättas i `headless-site`). Kontrollsidan bar den också — men
subtraktionen bet inte.

Orsaken satt i fyndets FORM, inte i regeln:

```python
t = G.TREKONSONANT.search(allt)
fel.append("TREKONSONANT: %r" % (t,))   # ← match-OBJEKTET, med sin span
```

`%r` på ett match-objekt skriver ut `<re.Match object; span=(3647, 3650),
match='ttt'>`. Positionen skiljer mellan två sidor, så de två strängarna är
olika — och `liverunda`s subtraktion är **på exakt sträng med flit** (en
"liknar"-regel hade svalt våra egna fel). Butikens träff kunde alltså aldrig
matcha vår.

| | kontrollsidan | vår sida |
|---|---|---|
| före | `span=(4129, 4132)` | `span=(3647, 3650)` |
| efter | `'ttt' — 'Läs mer på bloggen: Klösträd & kattträd …'` | **samma sträng** |

Fyndet bär nu MENINGEN (`G.mening_kring`), som är byte-identisk mellan sidor
när den kommer ur butikens chrome — precis som runda 138 redan gjorde.

☠️ **Regeln: ett fynd som ska kunna subtraheras får bara innehålla det som
är lika på två sidor.** Läge, index och radnummer diskvalificerar det.
Samma familj som #527 (live-grindens komposition drev isär) — och den här
gången var det inte regeln som drev, utan strängen regeln skriver.

## ☠️ Och `granska` saknade live-signaturen helt

Första försöket dog på `granska() got an unexpected keyword argument 'html'`.
Rundans grind var skriven bara för källtexten. `liverunda.kor`:s kontrakt är
`granska(pid, html=None, live=False)`, och modulens egen docstring varnar för
exakt den här driften.

Fyra saker skiljer nu de två lägena, och inget annat:

| | källtext | live |
|---|---|---|
| underlag | `G.strip_taggar` | `G.livetext` (tvätten görs av `liverunda`) |
| flikarna | `<h2>` exakt en gång var, i ordning | `G.flikfel` läser `<summary>` |
| homoglyfer | körs | hoppas över — butikens chrome bär 🚚 · ⤢ → |
| strukturgrindarna | körs | hoppas över — taggarna finns inte på sidan |

**Reglerna bor på ETT ställe.** Filen `live.py` är en hämtare på tjugo rader,
inte en kopia — runda 127:s 219 egna rader var husets vanligaste bugg.

## Det starkaste kvittot är de POSITIVA villkoren

`KRAVS[pid]` kör i live-läget också: varje fras Steg 2 kräver måste stå på
den renderade sidan. **Noll `SAKNAS:` på tio sidor** betyder att sidan
butiken serverar faktiskt är vår text — inte ett cachat utkast.

Det är samma fälla runda 60 gick i (åtta korrekta sidor fällda på en cachad
sida). `G.hamta_isr` cache-bustar med `?cb=`, hämtar två gånger och väntar ut
`x-vercel-cache: STALE`.

## Kortgrinden

`G.kortfel` körs bara på VÅRA sidor, aldrig på kontrollen — en kontrollsida
ur runda 121–128 hade annars fällt `SAKNAR EGET KORT` och subtraherat bort
just den grind som byggdes för att steget glömdes åtta rundor i rad.

Noll träffar: alla tio bär sitt eget Fyndplats-kort.
