# Transportvagn 2-i-1 med nätsidor — vit hjältebild

**Produkt:** `bf2089e0-91b5-48ae-825c-1b1d9695561d` · `/produkt/transportvagn-2-i-1-natsidor`
**Datum:** 2026-08-24 · **Revision:** 8 → 12 · publicerad hela tiden

## Uppdraget

Leonard: *"Kan du fixa vit bakgrund hero bild till denna"*. Jag rapporterade först att
leverantören saknar en ren studiobild. Han svarade *"Du måste fixa det!"* — det är hans
beslut, och den här loggen är hur det gick till.

## Källan

Tio leverantörsbilder. Nio är livsstilsfoton eller infografik med tung grafisk ram.
Den enda på vit botten är **a8** ("PRODUCT SIZE", grön vagn) — men den bär:

| Element | Var |
|---|---|
| "46cm/18.11in" + måttlinje | tvärs över vänstra hjulet |
| "86cm/33.8in" + måttlinje | under flaket, tvärs över högra hjulet |
| Fyra pilhuvuden | fritt i vitt |

Alla tre hjulen bar text tryckt **på gummit**. a3 (också vit botten) visar vagnen som
plant flak — fel konfiguration för hjälten — och har handtaget avskuret i kanten.

## Första försöket (v1) — förkastat av Leonard

Hjultransplantation: ett rent hjul ur **a2** skalades in på studiobildens tre hjul för
att bli av med texten som är tryckt på gummit. Tekniskt lyckades det — men Leonards
omdöme var **"Såg inte bra ut. Du kanske kan låta måtten som fanns på däcken finnas kvar
så däcken inte ser konstiga ut."**

Han har rätt, och felet syns först i stor skala: de inklistrade hjulen är **för jämna och
för mjukt lysta** mot resten av fotot. Den skarpa nätsidan bredvid gör kontrasten värre —
hjulen läser som påklistrade dekaler. Retuschen var lyckad var för sig och fel i
sammanhanget.

> **Lärdomen:** en lagning bedöms mot bilden den sitter i, inte mot sig själv. Ett
> transplantat från en annan exponering bär den bildens ljussättning och skärpa med sig.
> QC:a alltid inzoomat **och** i den storlek kunden ser.

## Lösningen (v2/v3)

**Ingen retusch alls på produkten.** `hero3.py` bygger på att a8 består av **32
sammanhängande komponenter**, som kartlades en och en (`a8-komp.png`) i stället för att
gissas:

| Komponent | Innehåll | Öde |
|---|---|---|
| nr 6 (538 502 px) | vagnen + "46cm/18.11in" + "25cm/10in" + 86 cm-pilen | **behålls** |
| nr 23 + nr 21 | "86cm/33" + ".8in" | **behålls** |
| nr 1–5 | "PRODUCT SIZE"-banderollen | slängs |
| nr 7, 8, 10, 12, 15, 17 | 97cm/38.2in | slängs |
| nr 13, 14, 16, 18–20, 22 | 52cm/20.47in | slängs |
| nr 9, 11 | 23cm/9in | slängs |
| nr 25, 26, 29–31 | 50cm/19.68in | slängs |
| nr 24, 27, 28, 32 | 76cm/29.9in | slängs |

Poängen: måtten som **rör hjulen** sitter ihop med vagnen och är därför samma komponent.
De fem yttre måtten ligger fritt på vit botten. Att behålla nr 6 + 21 + 23 ger alltså
exakt "vagnen med däckmåtten kvar" — utan mask, utan målning, utan en enda rörd
produktpixel.

**Spärrarna är på komponentnivå, inte rektanglar.** Hjulen sticker in i 50 cm- och
76 cm-måttens ytor, så en rektangelkontroll där träffar vagnen i stället för måttet
(den fällde två gånger innan jag bytte). `assert set(np.unique(lab[behall])) - {0} ==
BEHALL` är exakt. Rektangel-spärrar används bara där de bevisligen ligger utanför
vagnens bbox: 97 cm-texten (x < 162), 23 cm-texten (x > 1417) och banderollen.

Sedan `hero.py`-inramningen: 2000² vit duk, husets 0.90-fyllnad, med runbookens
kvadratbeskärnings-assertion.

## Vad som INTE gick — och varför det står här

Sjutton försök. De tre reglerna som kom ur dem ligger i `docs/polish/bildmetoder.md`
(«När etiketten sitter PÅ produkten»). Kortversion:

- En biharmonisk rektangel som spänner vit botten → svart gummi ger **grå smet**, inte lagning.
- Kantregeln vid tröskel 242 räknar en siffra som produkt när den nuddar däckets **mjuka
  skugga**. Tryckt text är `L < 45` — mät tröskeln.
- En donator-mask på `mean(2) > 200` äter **kromnavet**. Maska på färg + läge, och
  assert:a att navet inte rörs.

Fler fällor som kostade försök: teal-mask åt upp nätsidorna; täthetsfilter fastnade i
ramen; rektangelmask täckte 11 % av bilden (den egna spärren stoppade den); vitmålning
bet hål i däcken eftersom grön/gul-sparren inte ser **neutralt** svart gummi.

## Skrivningen

Tresteg (produkten har `linkedMedia`):

1. PATCH `media.itemsInfo.items` — nya bilden först, alla åtta gamla kvar (9 st).
2. PATCH `options` + `variantsInfo` verbatim — galleripatchen nollställer `linkedMedia`.
3. Verifiering via separat GET `?fields=MEDIA_ITEMS_INFO` **och** live-sidans JSON-LD.

> ⚠️ **En bild som är `linkedMedia` går inte att ta bort ur galleriet.** Vid bytet från
> v1 till v3 svarade Wix **404 `PRODUCT_MEDIA_NOT_EXIST`** — *"Missing media files.
> Products must include media files linked to choices"* — med v1:s fil-id i `data.ids`.
> Felkoden låter som att bilden saknas; den betyder motsatsen: den finns kvar i en
> `linkedMedia` och får därför inte försvinna ur galleriet. Ordningen måste vara
> **koppla om först, ta bort sedan**: en PATCH som lägger in den nya bilden *och* pekar
> om valet (gamla bilden ligger kvar), och därefter en andra PATCH som tar bort den
> gamla. Båda skickar `media` + `options` + `variantsInfo` i samma anrop, annars
> nollställs `linkedMedia` av mediapatchen.

`media.main` skickades aldrig (readOnly). Filen kontrollerades för C2PA/IPTC-markör före
uppladdning — ingen, den är ett beskuret fotografi och inte generativ AI, så produkten
ligger kvar i Googles kostnadsfria listningar.

## Kvar att bestämma

- **"Gul"-variantens `linkedMedia` pekar på måttritningen `a9`** — leverantören har inget
  rent foto på den gula vagnen. Samma behandling som ovan skulle gå att köra på a9, men
  koordinaterna är handmätta per bild och måste mätas om.
- Måttritningarna (item 7 och 8) ligger kvar i galleriet. De visar de fem yttre måtten
  (97/52/23/50/76 cm) som hjältebilden inte har, och den gula varianten — men är
  engelskspråkig leverantörsgrafik.
- Hjältebilden bär kvar tre engelska mått ("46cm/18.11in", "25cm/10in", "86cm/33.8in").
  Det är Leonards uttryckliga val: alternativet är att retuschera hjulen, och det var
  precis det som såg fel ut.
