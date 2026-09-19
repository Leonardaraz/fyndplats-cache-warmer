# Runda 77, Steg 1 — svepet, sökordskrocken och dubblettgrinden

## Svepet gick klart: `AVHUGGEN=false`

| | |
|---|---:|
| Produkter i katalogen | **5 502** |
| Publicerade | **2 040** |
| Rader i kontorsstolsfamiljen | 194 |
| Utkast, massage/gaming undantagna | **138** |
| Massage-/gamingutkast (egen grind, egen runda) | 52 |

Två etapper om ≤30 sidor med markören vidareskickad. Kända publicerade sidor
(`kontorsstol-med-fotstod`, `chefsstol-ljusgra-fotstod`) syntes i svepet, alltså
är ett "noll krockar" läsbart och inte tomt.

## ☠️ Etapp 2 bar rundans viktigaste fynd — och etapp 1 hade sagt tvärtom

Sökordet var självklart: familjen har **fem `Zeichenstuhl`-utkast**, och
*ritstol* är ett eget svenskt sökord med hög köpintention. Etapp 1 (sidorna
1–30) visade **ingen** publicerad ritstol. Etapp 2 visade fyra:

```
ritstol-fotring-natrygg-55-76-cm
arbetsstol-hjul-51-67-cm-avtagbar-rygg
arbetsstol-med-hjul-och-rygg
arbetsstol-salong-hoj-och-sankbar
```

**Hade svepet stannat vid trettio sidor hade fem nya ritstolssidor publicerats
ovanpå en levande.** Det är precis den kannibalisering runbokens `avhuggen`-krav
finns för, och det är första gången i den här sessionen som kravet faktiskt
räddar en runda — tidigare rundor har kvitterat `false` utan att det ändrade
något.

⚠️ Lärdomen är inte "kör svepet klart" — den regeln fanns redan. Den är att
**ett svep som stannar tidigt ser exakt likadant ut som ett som tog slut**, och
att den publicerade konkurrenten kan ligga var som helst i katalogen. Det finns
ingen sorteringsordning som gör en delmängd säker.

## Dubblettgrinden mot den publicerade ritstolen

Publicerad: `ritstol-fotring-natrygg-55-76-cm` — **58 × 63 × 105–126 cm,
sits 50 × 51, sitthöjd 55–76**.

| id8 | B × T × H | sits | sitthöjd | pris | mot publicerad |
|---|---|---|---|--:|---|
| d739872f | 60 × 60 × 108–132 | 48 × 50 | 53–78 | 1 399 | alla fyra skiljer |
| 795c5ee2 | 59 × 61 × 93–113 | 46 × 44 | 50–70 | 1 199 | alla fyra skiljer |
| 3033003c | 59 × 65 × 102–122 | 53 × 50 | 52–72 | 1 649 | **närmast** — se nedan |
| 83fd57c9 | 59 × 59 × 95–115 | 48 × 45 | 52–72 | 1 199 | alla fyra skiljer |
| f1f861ea | 60 × 56 × 110–132 | 48 × 49 | 65,5–87 | 1 519 | alla fyra skiljer |

`3033003c` ligger inom ±2 cm på bredd och djup — runbokens varning om att en
måttmatchning är ett SÅLL och inte en dom. Domen: totalhöjden skiljer 3–4 cm,
sitsen 3 cm på bredden, och **sitthöjden 52–72 mot 55–76** — den publicerade
sidans egen rubriksiffra. Ingen dubblett. Bilderna (Steg 4) visar dessutom
svankstöd, som den publicerade saknar.

**Ingen av de fem är heller dubblett av en annan** — varje par skiljer sig på
minst två av fyra tal.

## ☠️ Hjärtryggsparet är måtttvillingar på FEM tal

`cc0ec7ba` och `df0d351f`: **45 × 56 × 78–88, sits 46 × 39, sitthöjd 44–54,
rygg 45 × 38, 120 kg** — identiska. Olika pris (1 099 mot 959).

Källan avgör: `Farbe: Rosa` mot `Farbe: Weiß`, och bilderna visar samma stol i
två kulörer. **Färgsyskon, inte dubblett** — båda får egna korslänkade sidor
enligt husregeln.

## Sökorden

Den publicerade ritstolen äger `ritstol`. De fem nya får varsin kvalificerare
som står i namn, slug OCH titel — och alla sex korslänkas i löptexten, så att
kunden hittar rätt modell i stället för att välja mellan sex nästan lika sidor.

| id8 | kvalificerare | slug |
|---|---|---|
| 795c5ee2 | utan armstöd | `ritstol-utan-armstod` |
| 83fd57c9 | lägsta modellen, 95–115 cm | `ritstol-95-115-cm` |
| 3033003c | svankstöd | `ritstol-med-svankstod` |
| d739872f | uppfällbara armstöd | `ritstol-uppfallbara-armstod` |
| f1f861ea | högsta sitthöjden, 87 cm | `ritstol-sitthojd-87-cm` |
| df0d351f | hjärtformad rygg, vit | `skrivbordsstol-vit-hjartrygg` |
| cc0ec7ba | hjärtformad rygg, rosa | `skrivbordsstol-rosa-hjartrygg` |

☠️ **Färgen står FÖRE kvalificeraren i hjärtryggsparets slug, med flit.**
`sku_bas` kapar vid 24 tecken på hel ordgräns: `skrivbordsstol-hjartrygg-vit`
hade gett `FP-skrivbordsstol-hjartrygg` för BÅDA syskonen — exakt runda 58:s
krock. Med färgen först blir det `FP-skrivbordsstol-vit` och
`FP-skrivbordsstol-rosa`.
