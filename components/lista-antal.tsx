"use client";
import { useEffect, useState } from "react";
import { giltigtAntal, LISTA_ANTAL_HANDELSE } from "../lib/lista-antal";
import { productCountLabel } from "../lib/rating";

/**
 * Längden på hela listan när ShopBrowser har hämtat den, annars null.
 *
 * Sidan bär ett antal från när den byggdes, och ShopBrowser hämtar sedan hela
 * listan från /api/lista, som kan vara färskare. Varje ställe på sidan som
 * visar antalet lyssnar här, så att alla byter tal samtidigt
 * (lib/lista-antal.ts).
 */
export function useHamtatListaAntal(): number | null {
  const [antal, setAntal] = useState<number | null>(null);
  useEffect(() => {
    const ta = (e: Event) => setAntal(giltigtAntal((e as CustomEvent).detail));
    window.addEventListener(LISTA_ANTAL_HANDELSE, ta);
    return () => window.removeEventListener(LISTA_ANTAL_HANDELSE, ta);
  }, []);
  return antal;
}

/**
 * "6 829 produkter" i rubrikytan på /alla-produkter och /rea. Börjar på sidans
 * eget tal och följer listan under: annars stod rubrikytan kvar på 6 829 medan
 * kategoriväljaren och verktygsraden visade 6 834 (mätt 2026-11-18).
 */
export function ListaAntalText({ antal }: { antal: number }) {
  const hamtat = useHamtatListaAntal();
  return <>{productCountLabel(hamtat ?? antal)}</>;
}
