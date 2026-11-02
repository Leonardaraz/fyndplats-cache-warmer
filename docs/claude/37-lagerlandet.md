## Lagerlandet är en del av SKU:n — och lagret tar slut per land

AliExpress bakar in lagerlandet i själva SKU:n: "rosa garderob från Tyskland"
och "…från Spanien" är olika SKU:er med **olika saldo och olika pris**. Vid
import sparas EN av dem (`collapseShipFromAxis`, `lib/import/ship-axis.ts` —
lagret är aldrig ett kundval). Synken speglade sedan just den SKU:ns saldo till
Wix, så när vårt lager tog slut blev varan slutsåld i butiken trots att
säljaren hade dussintals kvar i ett annat EU-land (Leonards rapport 2026-08-20).

`lib/sync/warehouse-failover.ts` (steg 3.6 i `checkOne`) **pekar om mappningen**
till ett syskonlager i stället. Att bara visa syskonets saldo hade varit fel —
kundordern läggs på den sparade SKU:n, så en uppblåst siffra hade bara flyttat
felet till kassan. Körs före lagerskrivningen, så bytet slår igenom i samma
körning.

### Två landslistor, och de svarar på olika frågor

Det här är den vanligaste förväxlingen i kodbasen, och den kostade pengar tyst:

| Funktion | Frågan den svarar på | GB/NO |
|---|---|---|
| `isEuCountry` | "kommer paketet fram snabbt?" | **ingår** |
| `isEuCustomsUnion` | "kan vi köpa in därifrån utan tull?" | **ingår inte** |

**Regeln:** allt som **väljer ett lager att köpa från** använder
`isEuCustomsUnion` (`EU_CUSTOMS_UNION` i `lib/aliexpress/eu-countries.ts`). Allt
som beskriver **leveranstid för kunden** — EU-lager-ribbonen, discover-filtret,
`warehouseClass`, badgarna i tillägget — använder `isEuCountry`.

Leonard fångade förväxlingen 2026-08-21 på SucceBuy-klädstället
(1005005972133031): tilläggets "EU-först" bockade i GB-rader åt honom, och
`pickWarehouse` rankade dem lika bra som spanska. Storbritannien lämnade
tullunionen — tulldeklaration och importmoms, kostnader som aldrig syns i
marginalen. Lagerbytet vid slutsålt filtrerade redan rätt; det var **importen**
som valde fel. Nu läser alla tre lagervalen samma lista:
`ship-axis.ts → pickWarehouse`, `mapping-repair.ts → pickPreferred` /
`sortByWarehousePreference`, och `warehouse-failover.ts`.

Tillägget bär en egen kopia (`EU_TULL_CODES` i `extension/eu-countries.js` —
browser-global kan inte importera TS). Ett test i
`lib/aliexpress/eu-countries.test.ts` fäller om de glider isär, samma lärdom som
`SHIP_AXIS_RE`, som drev isär två gånger på två veckor.

I popupen **döljs** rader utanför tullunionen helt — men bara när det finns ett
alternativ inom den. Utan den brasklappen hade varenda Kina-produkt blivit
oimporterbar. Dolda rader bockas alltid av samtidigt: en dold rad som ändå följer
med i importen vore värre än en rad för mycket.

Tre spärrar, och de ska inte tas bort:

1. **Bara EU:s tullunion.** Ett USA-lager kan ha 500 i saldo, men mot en svensk
   kund betyder det tull och veckor i transit. Se tabellen ovan — `isEuCountry`
   duger inte här.
2. **Bara med känt pris.** Priset skiljer mellan lagren ($113,74 från USA mot
   $119,99 inom EU i Leonards fall). Utan det nya priset står `landedCostSek`
   kvar på det gamla och då ljuger både lönsamhetsöversikten och auktionens
   golvpris (`lib/auction/seed.ts` räknar sitt lägsta bud ur det fältet).
   Bytet räknar om `costUsd` + `landedCostSek` proportionellt.
3. **Bara om marginalen håller** (`MIN_FAILOVER_MARGIN_PCT`, netto mot netto).
   Att sälja med förlust är ett sämre utfall än att vara slutsåld en vecka.
   Avstådda byten loggas — de är ett beslut för en människa.

Besläktad, men med annan utlösare: `lib/sync/shippability.ts` byter lager när
frakt-API:t svarar NEJ för vår SKU. Den här byter när lagret är TOMT. Båda
använder `warehouseAlternativeSkuIds` och sätter `previousSupplierVariantId` +
`shipFromSwitchedAt`.

**Inte byggt:** fallback vid själva orderläggningen. AE:s felkod för slut i
lager finns inte dokumenterad någonstans i repot, och att gissa på en
sträng-matchning i `place-order.ts` riskerar dubbelbeställning. Synk-bytet
täcker det normala fallet; kvar är kapplöpningen där lagret tömts mellan
synk och order.
