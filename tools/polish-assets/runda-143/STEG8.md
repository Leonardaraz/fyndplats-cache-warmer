# Runda 143 — Steg 8: båda halvorna, 17 av 17

## Wix-halvan (variantsInfo-PATCH)

| | |
|---|---:|
| Produkter | 17 |
| SKU-strängen exakt rätt vid återläsning | **17** |
| `produkt.visible` efteråt | `false` × 17 |
| `variant.visible` efteråt | `true` × 17 |

☠️ **Matchat på `wixVariantId`, aldrig på position.** Alla sjutton id:n mättes
mot Wix FÖRE skrivningen och stämde — men kontrollen är inte en formalitet:
två fält heter `sku` och betyder olika saker, och positionsmatchning återinför
exakt den förväxling som gjorde att prissynken skrev till ingenting i en månad.

☠️ **`visible` skickades explicit i BÅDA leden** (`false` på produkten, `true`
på varianten). En `variantsInfo`-PATCH publicerar annars ett utkast, och
produktens `false` speglas ned på varianten.

**Kvittot är STRÄNGEN, inte förekomsten.** Runda 108 gick igenom
mappningsstämplingen med grönt på alla sex sidor och bar ändå kvar
leverantörens tyska SKU i Wix. En kontroll som bara räknat "finns en SKU" hade
sagt grönt här också.

### ☠️ Importens SKU-krock, mätt en gång till

De gamla SKU:erna bevisar #272 — **krocken skapas av importen, inte av
poleringen**:

| tysk SKU | satt på |
|---|--:|
| `FP-boxsackstander` | **3 produkter** (`f8d974b3`, `d307632a`, `6f603856`) |
| `FP-boxstand-zwei-speedballs` | **3 produkter** (`86f2cb63`, `57986794`, `438295ae`) |

Sex av rundans sjutton delade alltså två strängar. Efter Steg 8 har var och en
sin egen, härledd ur den polerade sluggen — **räknad av `G.sku_bas`, aldrig
skriven för hand** (#483: fyra handskrivna SKU:er stod ett token för korta).

☠️ Och krocken syntes inte i sluggen (#473): `boxstall-140-205-cm-blatt` och
`-svart` är olika slugar som båda kapas till `FP-boxstall-140-205-cm`. Lösningen
var att flytta färgen FRAMÅT i sluggen, inte att skriva SKU:n för hand.

## Mappnings-halvan (`polish-mapping.yml`, läge `stampla`)

17 körningar, **17 `success`** (run 3010–3026). Bara `variant_skus` skickades —
`needs_ai_polish` och `draft_status` lämnades TOMMA, för GitHub ersätter ett
tomt input med dess `default` och en default på `published` hade publicerat
sjutton tyska utkast. Stämplingen av poleringsflaggan hör till Steg 13.
