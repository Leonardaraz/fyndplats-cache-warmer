"use client";
// Pulserande glödprick vid Fyndauktionen-länken i navet — bara under
// auktionsdagen (07–19 svensk tid). Klockan läses först efter monteringen
// (annars hydration-mismatch). Rent kosmetisk.
//
// Platsen hålls alltid och bara synligheten byter (data-av = av). Förut
// monterades pricken först efter hydreringen: länken blev 13 px bredare och
// menyraden (space-between) flyttade alla länkar 3–12 px, CLS 0,0002 på
// datorn (2026-11-08).

import { useEffect, useState } from "react";

function stockholmHour(): number {
  return Number(
    new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm", hour: "numeric", hour12: false }).format(new Date()),
  );
}

export function AuctionDot() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const check = () => {
      const h = stockholmHour();
      setOn(h >= 7 && h < 19);
    };
    check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, []);
  return <span className="nav-adot" data-av={on ? undefined : ""} aria-hidden="true" />;
}
