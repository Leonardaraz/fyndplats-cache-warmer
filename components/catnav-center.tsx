"use client";
import { useEffect } from "react";

// Centrerar den aktiva kategori-pillen i swipe-raden vid laddning, så att t.ex.
// "Husdjur" hamnar mitt i synfältet i stället för att ligga gömd långt till
// höger. Justerar BARA radens egen horisontella scroll — rör inte sidans
// vertikala scrollposition (ingen page-jump).
export function CatNavCenter() {
  useEffect(() => {
    const row = document.querySelector<HTMLElement>(".catnav-main");
    const active = row?.querySelector<HTMLElement>(".catchip.active");
    if (!row || !active) return;
    const rowRect = row.getBoundingClientRect();
    const elRect = active.getBoundingClientRect();
    const target =
      row.scrollLeft + (elRect.left - rowRect.left) - (row.clientWidth - elRect.width) / 2;
    row.scrollTo({ left: Math.max(0, target), behavior: "auto" });
  }, []);
  return null;
}
