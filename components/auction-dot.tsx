"use client";
// Pulserande glödprick vid Fyndauktionen-länken i navet — bara under
// auktionsdagen (07–19 svensk tid). Mount-gated (klockberoende ⇒ skulle
// annars ge hydration-mismatch). Rent kosmetisk.

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
  return on ? <span className="nav-adot" aria-hidden="true" /> : null;
}
