# Runda 121 Steg 4 — bilderna avgjorde fyra frågor och skapade två nya

Fyrtio bilder granskade, fem per produkt. **Ingen leverantörslogotyp** i något
övre vänsterhörn (uppgift #282). Måttritningarna bär bara siffror.

## ☠️ Två bilder på `75fcdcfb` bär TYSK TEXT INBRÄND I PIXLARNA

| bild | vad som står i pixlarna |
|---|---|
| 4 | **`FÜR DIE EWIGKEIT GEBAUT`** · *"Verstärkte Kunststoffkonstruktion sorgt für Langlebigkeit und trägt bis zu 70 kg"* · ett två meter högt **`70 KG`** |
| 5 | **`WARNSCHILD "NASSER BODEN"`** · *"Bei Nichtgebrauch am vorderen Haken aufhängen"* · *"Warnen Sie vor rutschigen Böden, um Unfälle zu vermeiden"* |

Båda plockas bort. Det går inte att polera bort text som ligger i pixlarna,
och en svensk kund ska inte läsa tysk marknadsföring på vår produktsida.
Produkten går från fem till tre bilder.

⚠️ Det ligger inom det uppmätta: `RENA_BILDPOSITIONER = [1,2,3,8,9]` valdes på
att position 8 var ren i 24 av 30 fall och 9 i 27 av 29. Den här produkten är
en av de sex respektive två. **Filtret gör rätt i snitt och fel i enskilda
fall — därför granskas bilderna ändå, varje runda.**

## ☠️ Fyra färgrader var ofullständiga — och bilden avgjorde varje gång

| id | leverantören säger | bilden visar |
|---|---|---|
| `75fcdcfb` | tyskt block `Schwarz+Blau`, svensk rad **`Blau`** | svart chassi, **blå** hink och säck, **gul** varningsskylt |
| `74ea10dc` | `Orange` | **blå OCH orange** hink på svart chassi |
| `9aa46e31` | `Schwarz` | svart chassi med **orange** säck |
| `45bac2cb` | `Gelb` | gul hink på **grå stålram** |

Det tyska blocket vann mot den svenska raden i det första fallet — den svenska
är importens sammanfattning, det tyska är källan. I de tre andra var båda
ofullständiga. **Färgen skrivs efter bilden, inte efter raden.**

## ✅ Tre av Steg 5:s motsägelser är avgjorda

1. **`74ea10dc` HAR två hinkar.** Brödtexten hade rätt, spec-blocket var
   ofullständigt. Bild 1, 2 och 4 visar en blå och en orange hink sida vid
   sida, plus en liten blå överkorg.
2. **`45bac2cb` / `731c8bfc` HAR två trådkorgar.** En hög vid handtaget, en låg
   vid basen. Brödtexten hade rätt; `Lieferumfang` nämnde ingen alls.
3. **Färgsyskonen är bekräftade.** Samma grå stålram, samma två korgar, samma
   press, samma mått — bara hinkens färg skiljer. Uppgift #420 håller.

## ☠️ Måttritningen gav ETT tal som inte står i spec-blocket

`75fcdcfb` bild 3 måttsätter mopphinken separat: **61 × 38 × 94 cm**. Spec-
blocket anger bara vagnens 122 × 46,5 × 101. Ritningen bekräftar dessutom
hyllplanens 76 × 46 och vagnens 46,5 cm djup — tre tal som stämmer mot
källan, vilket är vad som gör det fjärde trovärdigt.

## ⚠️ Två livsstilsbilder visar tillbehör som INTE ingår

| id | vad bilden visar | vad `Lieferumfang` säger |
|---|---|---|
| `9aa46e31` | vagnen bredvid en **gul mopphink med press** | vagn + säck + manual |
| `e526fd01` | hinken bredvid en **gul varningsskylt** | hink + manual |

Båda måste sägas rakt ut på sidan. En kund som ser en mopphink på bilden och
får en tom vagn i lådan har blivit vilseledd av OSS, inte av leverantören —
det är vår sida.

## ⚠️ Varningstexten på godset är engelsk och tysk, och den stannar

Varenda hink bär `CAUTION` tryckt i plasten, flera även `ACHTUNG`,
`ATTENTION` och `CUIDADO`. `75fcdcfb`:s varningsskylt säger `WARNING WET
FLOOR`. Det sitter **fysiskt på varan** — Leonards regel gäller: *"om märket
sitter fysiskt på varan så gör vi inget åt det, det är så produkten ser ut."*

🔒 **Men det ska STÅ på sidan att skylten är engelskspråkig.** Det är inte ett
bildfel, det är en egenskap hos varan, och en kund som köper en varningsskylt
till en svensk arbetsplats behöver veta vilket språk den talar.
