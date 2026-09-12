# Runda 137 Steg 9 — bilder, alt-texter och Faktakort

## Galleriets ordning

Råimporten lägger måttritningen på **plats 3 på alla åtta** (uppgift #371),
alltså mellan verklighetsbilden och detaljerna. Ordningen blir därför
`[1, 2, kort, 4, 5, 3]` för varje produkt: hjälte, verklighet, vårt eget
Faktakort, två detaljer, måttritning sist. En grind i `bilder.py` fäller om
ritningen inte ligger sist eller om kortet hamnar på plats 1.

**Inga strykningar.** Steg 4 granskade alla fyrtio bilderna: noll tysk text i
pixlarna, noll leverantörslogotyp, noll artikelnummer.

## ☠️ Alt-texten passerar ingen av steg-grindarna — så den fick sina egna

`grind.granska` läser `html`, `namn`, `titel` och `meta` ur `texter.py`.
Alt-texten finns inte där; den skrivs rakt in i Wix media. `bilder.altfel()`
kör därför rundans EGNA listor mot varje alt-text: samma `FORBJUDET`, samma
talgrind, samma typordslista, samma `ARTNR`, plus rundans
`FORBJUDNA_PASTAENDEN`. Det var precis en nivå under den här runda 106:s
kaninlöfte slank igenom.

Två egna regler utöver runda 136:s:

1. **Huvudordet krävs bara på hjältebilden och kortet.** En detaljbild namnger
   detaljen, inte hela möbeln — kravet på varje bild fällde elva korrekta
   närbilder i runda 136.
2. ☠️ **Färgsyskon får inte dela alt-text på en miljöbild.** Två av våra egna
   URL:er med samma foto OCH samma text är den dubblett Google straffar, och
   den uppstår av OSS. Kortet undantas med flit: samma modell, samma
   faktarader, bara en annan färg.

### ☠️ Talgrinden fällde siluetten — och hade rätt

Fem måttritningar bär en människa på **180 cm** som skalreferens. Talet är
AVLÄST ur bilden och ändå fel att skriva: det är inget mått på varan, och att
lägga in det i facit hade öppnat 180 för brödtexten också. Grinden fällde alla
fem; siluetten ströks ur texterna. Runbokens egen regel, en nivå ned:
**beskriv varan, inte stajlingen.**

## ☠️ KORTET HITTADE ETT FEL I REDAN SKRIVEN TEXT: tre plan, inte två

Kortets rad `Plan: 2 st` lästes bredvid hjältebilden i kontaktarket — och min
egen alt-text sa `tre`. Två av mina egna texter sa olika saker om samma möbel.

Hjältebilden räknad rad för rad på vit botten (`< 238` i gråskala, bredaste
sammanhängande löpa per rad):

| y | bredd | vad |
|---|--:|---|
| 16–43 | 89 px | takplattan, mot taket |
| 362–392 | **201 px** | plan 1 |
| 634–724 | 236 px | hängmattan, 90 px djup |
| 932–982 | **207 px** | plan 2 |
| 1224–1255 | **212 px** | plan 3 |
| 1507–1584 | 315 px | sockeln |

**Tre plan**, alla lika breda inom perspektivets marginal. Leverantörens
måttritning sätter `34 cm` på två av dem och lämnar den tredje omärkt — och
jag räknade ETIKETTERNA i stället för OBJEKTET. Samma klass som uppgift #462:
leverantörens egen text räknade fel på tre av elva.

Rättat i fyra fält per produkt (namn, meta, punktlista, spec-rad) plus
ingressen, och skrivet till Wix på båda: `c7bd00b9` rev 5 och `a73a1a1c`
rev 4, byte för byte OK, pris orört, produkt `false`, variant `true`.

### ☠️ Och talgrinden KUNDE inte se det

`TAL_FRIA = {1, 2, 3, 4}`, alltså är både 2 och 3 fria tal. En grind som
vaktar att varje tal står i facit kan per konstruktion aldrig fälla ett fel
ANTAL. En delräkning är inte ett mått — den är en uppräkning, och den har
ingen plats i talfacit.

`_antalsgrind` i `grind.py` jämför därför prosans räkneord mot SPEC-radens
antal. Två undantag, båda mätta på rundans egen text:

- `<a href`-stycken bär syskonens tal (`klösträd i fem plan 230–260 cm` är en
  korslänk till en ANNAN produkt). Samma undantag som `_talgrind`.
- `ett`/`en` är obestämd artikel i svenskan, inte räkneord: *"plats att ligga
  på ett plan"* räknar ingenting.

Utan undantagen fyrade grinden fyra gånger på korrekt text.

**Mutationstestad:** med `sitter två runda plan` återinfört fäller grinden
exakt en gång, med rätt meddelande, och ingen annan grind fäller. På den
rättade texten är alla åtta tysta — och korslänkens `fem plan` och artikelns
`ett plan` står kvar i texten utan att ge utslag.

## ☠️ Hashfilen var en tvilling som glidit isär

`steg7-hashar.json` är klistergrindens facit — den hash ett Wix-anrop
kontrollerar FÖRE det skriver. Den skrevs av ett eget skript, så när texten
rättades uppdaterades bara `steg7.json`. Facit blev en runda gammalt utan att
något sa till, och en grind med föråldrat facit är värre än ingen grind: den
svarar med auktoritet på fel fråga.

`steg7.py` skriver nu båda filerna i samma körning. Kontrollerat: bara de två
rättade produkternas hashar ändrades, de sex andra står still.

## Faktakorten

Åtta kort, alla under 215 kB-taket, granskade i kontaktark före uppladdning.

☠️ **Kickern bär FÄRGEN**, och det är inte kosmetik: rundan är fyra modeller i
två färger var, alltså fyra par som delar varje mått och varje last. Det enda
som skiljer syskonen på en kategorisida är färgen, och `kortrunda.kontroll`
fäller två kort som delar kicker.

⚠️ **Rubriken är däremot densamma inom ett par**, med flit. Den säger vad man
SER i bild 1, och syskonen är samma möbel i en annan färg — en påhittad
skillnad hade varit en liten lögn på en sida vi själva skrivit.

| pid | kicker | rubrik (bärs av bild 1) |
|---|---|---|
| `c7bd00b9` | Takspänt klösträd, ek | Hängmatta mitt på stolpen |
| `a73a1a1c` | Takspänt klösträd, grått | Hängmatta mitt på stolpen |
| `f5f71f5d` | Klösträd 90 cm, cremevitt | Koja nedtill, bädd överst |
| `dd3b541b` | Klösträd 90 cm, grått | Koja nedtill, bädd överst |
| `f489937f` | Klöspelare 91 cm, mörkgrå | En grov stam bär hela pelaren |
| `5616c567` | Klöspelare 91 cm, ljusbrun | En grov stam bär hela pelaren |
| `1ae60dbc` | Kattrappa 66 cm, beige | Kojan är inbyggd i trappan |
| `819bf51c` | Kattrappa 66 cm, ljusgrå | Kojan är inbyggd i trappan |

☠️ **Ingen lastrad på sex av åtta.** Bara klöspelarna anger `Bärförmåga` i
källan; de sex andra bär `Rekommenderad kattvikt` eller `Takspänne` på den
platsen. Kortet får inte fylla en ruta som källan lämnar tom.
