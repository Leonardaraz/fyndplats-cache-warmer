"use client";
// Produktkortets andra bild (hover-bilden på dator, bild två i svepet på
// pekskärm). Den läggs in först när besökaren rört sidan (lib/forsta-rorelse.ts),
// så att den aldrig står i HTML:en som Google läser: Google Bilder tillskrev
// annars ett korts andra bild den sida kortet stod på (massagestolens foto
// under gamingstolens adress, Leonards skärmbild 2026-11-14).
//
// ☠️ Hover-bytet får aldrig tömma kortet. Huvudbilden tonas bort bara när den
// här bilden är laddad (data-klar, regeln i app/globals.css): förut fanns
// bilden redan, men nu hämtas den först efter första rörelsen.

import Image, { type ImageLoader } from "next/image";
import { useState, useSyncExternalStore } from "react";
import { SHIMMER_BLUR } from "../lib/lqip";
import { harRortSidan, harRortSidanServer, prenumereraPaRorelse } from "../lib/forsta-rorelse";

/** `loader`: produktkortet skickar sin egen (exakta bredder, components/card-gallery.tsx);
 *  fyndauktionens kort gör det inte och får den globala. */
export function KortAndraBild({ src, sizes, loader }: { src: string; sizes: string; loader?: ImageLoader }) {
  const rord = useSyncExternalStore(prenumereraPaRorelse, harRortSidan, harRortSidanServer);
  const [klar, setKlar] = useState(false);
  if (!rord) return null;
  return (
    <Image
      className="pimg-alt"
      src={src}
      loader={loader}
      // Dekorativ: länken visar redan huvudbilden med produktens namn som alt,
      // och namnet står som text. Med alt här läste skärmläsare namnet två gånger.
      alt=""
      fill
      sizes={sizes}
      placeholder="blur"
      blurDataURL={SHIMMER_BLUR}
      data-klar={klar ? "" : undefined}
      onLoad={() => setKlar(true)}
      style={{ objectFit: "cover" }}
    />
  );
}
