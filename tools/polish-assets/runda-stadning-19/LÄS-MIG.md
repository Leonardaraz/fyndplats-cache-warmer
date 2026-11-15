# runda-stadning-19 — hundgrinden: väggfästena och ingen spärr

En publicerad sida, den indragbara hundgrinden `dab49bb1` (sammanslagen, grå och vit). Leonard sa ja
2026-11-14 till två rättelser efter en kundfråga och en genomläsning av monteringsanvisningen:

1. **Det som ingår.** Sidan sa "två pluggar och fyra små skruvar" och talade om *haken* i singular.
   Anvisningen visar höljet på två skruvar på ena sidan och **två väggfästen**, ett upptill och ett
   nedtill, på den andra, där nätets handtag hakas fast. Pluggar och skruvar finns för både vägg och trä,
   så antalet skrivs inte ut: "Pluggar, skruvar och två väggfästen ingår".
2. **Ingen spärr.** Grinden har ingen spärr som låser nätet i utdraget läge. Det står nu i avsnittet
   *Avsedd för husdjur*, i en ny fråga under *Vanliga frågor* och i *Produktsäkerhet*.

*Haken* heter nu *fästena* överallt, och "släpper hakan" i första avsnittet är rättat till att haka loss
handtaget. Före och efter står ordagrant i `handrattelser.tsv` (11 rader, bara `html`).

Ögonblicksbilden i `fore/` är hämtad direkt ur Wix 2026-11-14 10:42 UTC (revision 24). Namn, adress,
SEO-titel, metabeskrivning, alla tolv bilder med alt-text och ordning, kategorierna och de två varianterna
är **samma som i Wix**: kontrollerat fält för fält mot svaret innan planen byggdes.

## Bildordningen står kvar

`bygg-media.py` lägger måttbilden sist. På den här sidan är måttbilden tredje av de grå bilderna, och de
vita ligger sist; mediasteget skickar alltid hela listan, så en texträttelse hade flyttat måttbilden in
bland de vita. `behall-bildordning.tsv` (nytt i `bygg-media.py` samma dag, med prov i
`tools/polish-gates/bygg-media-ordning.test.ts`) håller sidans bilder i den ordning de hämtades ur Wix.

## Så kontrollerades det

- `python3 ../../polish-gates/diffgrind.py`: REN, 0 nya fynd och 0 i målklasserna.
- `bygg-skrivplan.py`: alla grindar rena utom `bygg-axelfacit.py`, som saknar en tysk måttrad i källan
  (kvitterat i `grind-undantag.txt`; måtten rörs inte).
- `kallor.json` är sidans publicerade text plus en rad om vad anvisningen visar. Lagret 131 (64 grå,
  67 vita) är läst ur `inventory-items/query` samma förmiddag.

## Så körs den

Workflowen **"Polering — skriv en runda till Wix"** med `ref` satt till grenen som bär rundan:

- `runda`: `runda-stadning-19`
- `plan_sha256`: `4c47c1511286611c1b5c2a2f8c0cd20e0b624d476e560649611cce83dc39cc04`
- lägen i ordning: `torr` → `skriv` (verifierar och stämplar själv), utanför Aosoms synkfönster.
