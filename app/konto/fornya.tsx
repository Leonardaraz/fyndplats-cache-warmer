"use client";

// Förlänger sessionen vid besöket (90 dagar rullande). Ett anrop per
// sidvisning; rutten skriver bara om kakan när den är äldre än ett dygn.

import { useEffect } from "react";

export function FornyaSession() {
  useEffect(() => {
    fetch("/api/konto/forny", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
