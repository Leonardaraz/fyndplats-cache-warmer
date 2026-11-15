"use client";
// Mina sidor strömmar in efter skissen (Suspense i app/konto/page.tsx). En
// adress med ankare (/konto#foretag från remsan, sidfoten eller
// företagsvägen) hittar då inget att rulla till när sidan först ritas, varken
// i webbläsaren eller i Nexts mjuka navigering. Den här rullar dit när
// innehållet väl finns.

import { useEffect } from "react";

export function TillAnkaret() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, []);
  return null;
}
