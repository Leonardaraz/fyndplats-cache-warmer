"use client";

// "Visa fler" på översikterna /under-{200,500,1000}-kr (Leonard 2026-11-18:
// "det borde finnas visa mera knapp så man kan se alla"). Sidan bär de första
// korten; här hämtas nästa 48 åt gången från /api/pris-lista och läggs sist i
// samma rutnät. Komponenten står INNE i rutnätet: korten blir rutnätets egna
// rutor, och knappen ligger på en egen rad över hela bredden.
//
// Faller hämtningen står knappen kvar med "Försök igen". Sidans egna kort och
// länken till hela sortimentet fungerar utan den.

import { useRef, useState } from "react";
import type { ListProduct } from "../lib/products";
import { ProductCard } from "./productcard";

type Svar = { kort: ListProduct[]; kvar: number };

export function PrisFler({ pris, kvar: kvarFranBorjan }: { pris: number; kvar: number }) {
  const [kort, setKort] = useState<ListProduct[]>([]);
  const [kvar, setKvar] = useState(kvarFranBorjan);
  const [lage, setLage] = useState<"vila" | "hamtar" | "fel">("vila");
  const sida = useRef(1);
  // Samma sida hämtas en gång: förhämtningen vid beröring och trycket delar löftet.
  const lofte = useRef<{ sida: number; svar: Promise<Svar> } | null>(null);

  const hamta = (): Promise<Svar> => {
    if (lofte.current?.sida === sida.current) return lofte.current.svar;
    const svar = fetch(`/api/pris-lista?k=${pris}-${sida.current}`).then((r) => (r.ok ? (r.json() as Promise<Svar>) : Promise.reject(new Error(String(r.status)))));
    lofte.current = { sida: sida.current, svar };
    // Ett fel får inte ligga kvar som ett avvisat löfte utan lyssnare.
    svar.catch(() => {});
    return svar;
  };
  const visa = () => {
    if (lage === "hamtar") return;
    setLage("hamtar");
    hamta()
      .then((s) => {
        if (!s || !Array.isArray(s.kort)) throw new Error("oväntat svar");
        const redan = new Set(kort.map((k) => k.slug));
        setKort((forra) => [...forra, ...s.kort.filter((k) => !redan.has(k.slug))]);
        setKvar(typeof s.kvar === "number" ? s.kvar : 0);
        sida.current += 1;
        lofte.current = null;
        setLage("vila");
      })
      .catch(() => {
        lofte.current = null;
        setLage("fel");
      });
  };

  return (
    <>
      {kort.map((p) => (
        <ProductCard p={p} key={p.slug} tvaKolumner />
      ))}
      {kvar > 0 && (
        <div className="loadmore-wrap p2-fler">
          <button type="button" className="loadmore" disabled={lage === "hamtar"} onPointerEnter={() => void hamta()} onTouchStart={() => void hamta()} onClick={visa}>
            {lage === "hamtar" ? "Hämtar fler …" : lage === "fel" ? "Kunde inte hämta fler · Försök igen" : <>Visa fler <span className="loadmore-rem">({kvar.toLocaleString("sv-SE")} kvar)</span></>}
          </button>
        </div>
      )}
    </>
  );
}
