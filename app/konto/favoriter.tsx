"use client";
// Mina favoriter på Mina sidor: samma rader som i favoriternas låda
// (components/favoriter-rader.tsx), i ett rutnät. Listan är kontots: den som
// är inloggad har den på medlemsraden (lib/favoriter.ts), och sektionen
// stämmer av mot kontot när den visas, så att en vara som lagts till på en
// annan enhet står här.

import { useEffect } from "react";
import { Favoritrader, useFavoritrader } from "@/components/favoriter-rader";
import { useWishlist } from "@/components/wishlist";
import { SYNK_LADA_MS } from "@/lib/favoriter";
import s from "./konto.module.css";

export function MinaFavoriter() {
  const { count, synka } = useWishlist();
  const rader = useFavoritrader(true);
  useEffect(() => {
    synka(SYNK_LADA_MS);
  }, [synka]);

  return (
    <section id="favoriter" className={s.favoriter} aria-labelledby="favoriter-rubrik">
      <h2 id="favoriter-rubrik" className={s.underrubrik}>
        Mina favoriter
      </h2>
      {count > 0 ? (
        <>
          <p className={s.orderNot}>Sparade på ditt konto. De följer med till alla enheter där du är inloggad.</p>
          <div className="fav-sida">
            <Favoritrader rader={rader} />
          </div>
        </>
      ) : (
        <p className={s.orderNot}>Tryck på hjärtat på en vara du gillar, så sparas den här och följer med till alla dina enheter.</p>
      )}
    </section>
  );
}
