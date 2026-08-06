# FAQPage-JSON-LD på produktsidan — överlämning till `fyndplats-headless`

**Status:** parsern är byggd, testad och verifierad mot hela livekatalogen i det här
repot. Det som återstår är fyra rader i storefronten, som ligger i ett annat repo.

## Varför den ligger här och inte i storefronten

`lib/import/tabs.ts` **skriver** FAQ-sektionen i produktbeskrivningen. Parsern som
**läser** den ligger bredvid (`lib/seo/faq-jsonld.ts`) så att HTML-formen bara är
definierad på ett ställe — ändras generatorn fångar golden-testet det direkt
(`buildTabSections` matas in i parsern i `faq-jsonld.test.ts`).

## Två HTML-former i produktion

Generatorn skriver `<p><strong>F</strong><br/>S</p>`, men Wix Ricos normaliserar
om HTML:en vid sparning, så det som faktiskt ligger i katalogen är
`<p><span style="font-weight: 700">F</span></p><p>S</p>`. Parsern hanterar båda.

## Verifierat mot livedata 2026-08-06

| Mått | Värde |
| --- | --- |
| Publicerade produkter | 510 |
| Gav giltigt schema | **510 (100 %)** |
| Gav inget | 0 |
| Fråga/svar-par totalt | 2 311 |
| Par per produkt | min 3 · median 5 · max 7 |
| Frågor utan frågetecken | 0 |

## Det som ska klistras in i storefronten

Kopiera `lib/seo/faq-jsonld.ts` (den har inga beroenden) och lägg på produktsidan:

```tsx
import { faqPageJsonLdScript } from "@/lib/seo/faq-jsonld";

const faqLd = faqPageJsonLdScript(product.description);   // "" när FAQ saknas

{faqLd && (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqLd }} />
)}
```

## Två fällor som redan är lösta i modulen — bygg inte om dem

1. **Använd `faqPageJsonLdScript`, inte `JSON.stringify(faqPageJsonLd(...))`.**
   Ett svar som innehåller texten `</script>` stänger annars script-taggen i
   förtid och spiller ut resten som synlig sidtext. Hjälparen escapar `<` som
   `<`, vilket JSON-parsern läser identiskt men HTML-parsern inte ser som en
   tagg. Testet `faqPageJsonLdScript kan inte bryta ut ur script-taggen` låser det.
2. **Skriv ingen script-tagg när schemat är tomt.** En tom eller ofullständig
   `FAQPage` flaggas av Google som strukturfel. `faqPageJsonLd` returnerar `null`
   och `faqPageJsonLdScript` tom sträng — låt taggen utebli helt.

## Efter driftsättning

Kör en produktsida genom Googles Rich Results Test och kontrollera att FAQ-blocket
listas utan varningar. `Product`-schemat genereras redan av storefronten och ska
ligga kvar — de två schemana samexisterar på samma sida utan konflikt.
