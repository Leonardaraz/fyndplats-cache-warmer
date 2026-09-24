# Runda N10: bildbeslut

Kontaktarken byggdes FÖRE brödtexten. Det kostar ingenting extra — bilderna
ska ändå hämtas för alt-texterna — och det flyttar granskningen till innan
felet är skrivet i stället för efter att det står i Wix.

| kort | behålls | bort | anmärkning |
| :-- | --: | --: | :-- |
| `05e65736` | 5 | 0 | rena |
| `34f22c58` | 5 | 0 | rena |
| `61008b48` | 4 | 1 | position 3 **beskärs**, se nedan |
| `6b8aa5a3` | 3 | 2 | två tyska grafiker |
| `72491f25` | 5 | 0 | rena |
| `231202df` | 4 | 1 | tysk grafik |
| `3ee7a87a` | 4 | 1 | tysk grafik |

## ☠️ Hundgrindens måttritning beskärs i stället för att kastas

Position 3 bär TVÅ saker i samma fil: en ren måttritning överst (71 cm,
66 cm, 41,5 cm, 113–166 cm, 36 cm — bara siffror) och ett tyskt HINWEIS-block
underst (*"Bitte messen Sie die Schulterhöhe Ihres Haustieres vor dem Kauf"*).

Den övre delen är den enda måttritningen produkten har. Att kasta hela filen
hade kostat måtten; att behålla den hel hade publicerat tysk text. Den beskärs
till den övre delen och laddas upp som en egen fil, samma väg som korten.

## ⚠️ Två påståenden som källan gör och FOTONA MOTSÄGER

### 1. `3ee7a87a` sägs ha gungfunktion — ramen är styv och står på hjul

Källan: *"Dank der Schaukelfunktion bleiben Konzentration und Energie
erhalten"*.

Fotona visar en **Z-ram i rakt virke på fyra hjul**, inte de böjda medar som
gungmodellen har. Jämför med `231202df` i samma runda, som verkligen har
krökta medar och där gungningen är äkta.

**Gungfunktionen skrivs INTE.** Texten beskriver det som finns: en Z-ram på
fyra hjul, två låsbara och två fritt löpande.

Samma klass som golvlampan `13a53d52` i runda J1: båda talen stod i källan, så
siffergrinden var ren — felet var en riktig utsaga om en produkt som inte
finns.

### 2. `72491f25` sägs utnyttja hörn — möbeln är en rak rektangel

Källan: *"nutzt Eckbereiche optimal aus"*. Fotona visar en helt rak, smal
pelare utan hörnvinkel. Den är smal (32,9 × 29,9 cm) och passar därför i ett
hörn, men den är inte konstruerad som en hörnmöbel.

**Texten säger smal, inte hörnanpassad.**

## Kontroller som gick RENA

- **Husmärke inbränt i bild:** `6b8aa5a3` bär ett gjutet Outsunny-märke på
  luckan i flera foton. Det är tryckt PÅ produkten och rörs därför inte
  (Leonards regel 2026-08-06) — men det får inte stå i texten.
- **Artikelnummer i bild:** noll träffar i alla 35 bilder.
- **Siffror som bara finns i grafik:** hundgrindens 66 cm (dörrhöjd) finns
  bara i måttritningen, inte i den tyska brödtexten. Den är därför en
  bildkälla, inte en påhittad siffra — men den skrivs bara om ritningen
  behålls, och det gör den.
