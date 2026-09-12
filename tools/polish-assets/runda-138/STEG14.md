# Runda 138 — Steg 14: live-grinden. 7 sidor, 0 fel

```
grind.sjalvtest():     45 fall, 0 fel
grindar._sjalvtest():  78 fall, 0 fel
kontrollsida klostrad-200-cm-sex-nivaer   1 träffar som är BUTIKENS

1366a476  klostrad-200-cm-beige-halor                      HIT    0 fel
839a2ef5  klostrad-230-275-cm-gront-katthus                HIT    0 fel
68bc6c0c  klostrad-225-255-cm-fyra-plan-bomullsrep         HIT    0 fel
e5b31270  klostrad-225-255-cm-rund-bas-sammet              HIT    0 fel
fecadb3e  klostrad-240-260-cm-trafarg-katthus              HIT    0 fel
505a0dde  klospelare-220-260-cm-tva-liggytor               HIT    0 fel
7bdc47b8  klostrad-ljusgratt-240-260-cm                    HIT    0 fel

SUMMA: 7 sidor, 0 fel
```

**Recensioner hoppas över** — Aosom har inga att hämta (deras produktsidor
ligger bakom Akamai Bot Manager; rutten finns, den ger ingenting).

## Kontrollsidans enda träff är ett KÄNT fel — i butiken, inte här

```
TRE LIKA KONSONANTER ' Läs mer på bloggen: Klösträd & kattträd – så väljer
du rätt (guide 2026) …'
```

Det är uppgift #511: butikens bloggrubrik stavar `kattträd` med tre t, och
den raden renderas på varje klösmöbelsida. Subtraktionen tar bort den från
våra sju — vilket är rätt, den är inte vår — men den **försvinner inte** av
det. Den bor i `headless-site` och ligger kvar som uppgift.

⚠️ **Att kontrollsidan bara gav ETT fynd är i sig ett mått.** Kör en runda
där kontrollsidan ger tio, och tio av våra egna fel kan tystas med den. Läs
listan, kvittera inte bort den.

## Den åttonde sidan: den vi skrev på men inte äger

Den mörkgrå syskonsidan fick sin korslänk i Steg 13. Den ingår inte i
`T.SLUG` och kan därför inte gå genom `liverunda.kor` — den grindades
separat, på de tre frågor skrivningen faktiskt kunde ha brutit:

| | |
|---|---|
| cache | `HIT` (efter `?cb=`-bust) |
| korslänkens tre `/produkt/`-adresser | alla tre på sidan |
| de tre ankartexterna | alla tre på sidan |
| `<summary>`-flikar | `Tekniska specifikationer` · `Användning och skötsel` · `Vanliga frågor` · `Kontakta oss` |
| fel | **0** |

☠️ **Flikraden är hela poängen med den mätningen.** Ett block som hamnar
mellan två flikrubriker försvinner in i den föregående fliken utan att
någonting går sönder synligt — spec-tabellen bär då tre avsnitt och ingen
märker något. Kontrollen läser `<summary>`, inte texten: en grind som frågar
"står ordet på sidan?" svarar grönt även när strukturen är trasig.
