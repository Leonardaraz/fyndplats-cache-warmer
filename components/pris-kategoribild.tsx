"use client";

// Miniatyren framför en kategori i registret på /under-{200,500,1000}-kr
// (Leonard 2026-11-18: "kategorierna borde ha miniatyr bilder som menyn har").
// Samma bilder och samma hämtning som menyn (components/use-meny-bilder.tsx):
// en hämtning per sidvisning, delad med sidhuvudet. Rutan har fast storlek, så
// inget flyttar sig när bilden kommer; saknas en bild står rutan tom.

import { useEffect } from "react";
import { hamtaMenyBilder, MenyBild, useMenyBilder } from "./use-meny-bilder";

export function PrisKategoriBild({ slug }: { slug: string }) {
  const bilder = useMenyBilder();
  useEffect(() => {
    void hamtaMenyBilder();
  }, []);
  return <MenyBild src={bilder?.bilder[slug]} klass="mn-bild p2-bild" />;
}
