# -*- coding: utf-8 -*-
"""Runda 121 Steg 9: bildordning och alt-texter.

☠️ VARJE alt-text beskriver en bild jag FAKTISKT sett. Fem bilder granskades i
   ett eget ark just för att de inte fanns med i de första — en alt-text som
   gissar innehållet är en osann uppgift om sidan, och den är dessutom osynlig
   för den som läser sidan visuellt.

☠️ `75fcdcfb` går från fem bilder till TRE. Bild 4 och 5 bär tysk text inbränd
   i pixlarna ("FÜR DIE EWIGKEIT GEBAUT", "WARNSCHILD NASSER BODEN"). Det går
   inte att polera bort text som ligger i pixlarna.

🔒 Skickas som `id`, ALDRIG som `url`: en wixstatic-adress som skickas som
   `url` får Wix att importera om filen till en ny kopia (CLAUDE.md 2026-08-28).
"""
BEHALL = {"75fcdcfb": [1, 2, 3]}          # övriga behåller alla fem

ALT = {
 "45bac2cb": [
  "Gul mopphink på grå stålram med grå press och två trådkorgar, sedd snett framifrån mot vit botten.",
  "Gul mopphink står i en korridor medan en person i blå arbetskläder moppar det ljusa golvet.",
  "Måttritning av mopphinken med 73 cm längd, 45 cm bredd och 95 cm höjd.",
  "Närbild på den övre trådkorgen med en sprayflaska och en trave vikta trasor.",
  "Närbild på den nedre trådkorgen med tre flaskor, bredvid den gula hinken.",
 ],
 "731c8bfc": [
  "Blå mopphink på grå stålram med grå press och två trådkorgar, sedd snett framifrån mot vit botten.",
  "Blå mopphink står på ett grått golv i ett rum med krukväxter och en trälucka.",
  "Måttritning av mopphinken med 73 cm längd, 45 cm bredd och 95 cm höjd.",
  "Blå mopphink sedd på avstånd med den övre korgen fylld med flaskor och trasor.",
  "Närbild snett uppifrån på den grå pressen som sitter i den blå hinken.",
 ],
 "74ea10dc": [
  "Mopphink med två hinkar i blått och orange på svart chassi, med orange sidopress och en liten blå korg överst.",
  "Mopphinken med två hinkar står på ett grått golv framför en grön krukväxt.",
  "Måttritning av mopphinken med 78 cm längd, 45 cm bredd och 95 cm höjd.",
  "En person drar mopphinken med två hinkar genom en ljus korridor.",
  "Närbild på sidopressen där en grå mopp trycks ur över den orange hinken.",
 ],
 "e526fd01": [
  "Orange rullhink med svart press och fyra hjul, sedd snett framifrån mot vit botten.",
  "Orange rullhink står på ett grått trägolv bredvid en gul varningsskylt som inte ingår.",
  "Måttritning av rullhinken med 54 cm längd, 41,5 cm bredd och 91,5 cm höjd.",
  "Närbild underifrån på ett av de fyra hjulen under den orange hinken.",
  "Rullhinken sedd uppifrån med den svarta innerhinken på plats i den orange hinken.",
 ],
 "da0f30b2": [
  "Gul moppvagn med grå press på grå ram, med blå förvaringslåda vid basen och en trådkorg vid handtaget.",
  "Gul moppvagn står i en korridor medan en person i blå arbetskläder moppar golvet.",
  "Måttritning av moppvagnen med 72 cm längd, 49,5 cm bredd och 95 cm höjd.",
  "Närbild på trådkorgen vid handtaget med en sprayflaska och vikta trasor.",
  "Närbild på den blå förvaringslådan med flaskor, bredvid den gula hinken.",
 ],
 "d8ebb279": [
  "Blå moppvagn med grå press på grå ram, med blå förvaringslåda vid basen och en trådkorg vid handtaget.",
  "Blå moppvagn står på ett grått golv medan en person moppar bredvid den.",
  "Måttritning av moppvagnen med 72 cm längd, 49,5 cm bredd och 95 cm höjd, och hinken på 37,5 × 35 × 31,5 cm.",
  "Närbild på pressen som sitter i den blå hinken.",
  "Närbild på den tomma trådkorgen ovanför den blå hinken.",
 ],
 "9aa46e31": [
  "Städvagn med svart stomme, tre hyllplan och orange sopsäck med lock, sedd snett framifrån mot vit botten.",
  "Städvagnen står i en hall med moppar och borstar i clipsen; mopphinken bredvid ingår inte.",
  "Måttritning av städvagnen med 121 cm längd, 50,5 cm bredd och 100 cm höjd samt maxlasten 10 kg.",
  "Städvagnen står på en stenlagd uteplats medan en person sopar; mopphinken bredvid ingår inte.",
  "Städvagnen står i en ljus korridor medan en person moppar golvet.",
 ],
 "75fcdcfb": [
  "Städvagn med svart stomme, blå mopphink med press, blå sopsäck och gul varningsskylt, sedd snett framifrån mot vit botten.",
  "Städvagnen står i en butiksgalleria medan en person i mörkblå arbetskläder lägger trasor på den övre hyllan.",
  "Måttritning av städvagnen med 122 cm längd, 46,5 cm bredd och 101 cm höjd, och mopphinken på 61 × 38 × 94 cm.",
 ],
}
