"use client";
// "Du handlar som företag" i remsan överst (E3). Specen: vilken profil som är
// aktiv ska synas hela tiden. Valet står i tecknet `fp_medlem_inne=f`; det är
// bara en ledtråd till sidan, priset kommer alltid från servern.
//
// Remsan byter text i stället för att lägga till en rad, så att sidan inte
// hoppar när tecknet läses efter hydreringen. Servern och första renderingen
// visar alltid butikens vanliga text.

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { foretagstecken } from "./medlemspris";

// Tecknet ändras utan omladdning när kunden byter profil på Mina sidor
// (app/konto/foretag.tsx säger till med händelsen `fp-konto-andrat`).
const prenumerera = (andrat: () => void) => {
  window.addEventListener("fp-konto-andrat", andrat);
  return () => window.removeEventListener("fp-konto-andrat", andrat);
};

export function ProfilRemsa({ children }: { children: ReactNode }) {
  const foretag = useSyncExternalStore(prenumerera, foretagstecken, () => false);
  if (!foretag) return <>{children}</>;
  return (
    <span className="promotext">
      <Link prefetch={false} className="promo-foretag" href="/konto#foretag">
        Du handlar som företag
      </Link>{" "}
      · priserna visas exkl. moms
    </span>
  );
}
