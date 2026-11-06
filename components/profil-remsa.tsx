"use client";
// "Du handlar som företag" i remsan överst (E3). Specen: vilken profil som är
// aktiv ska synas hela tiden. Valet står i tecknet `fp_medlem_inne=f`; det är
// bara en ledtråd till sidan, priset kommer alltid från servern.
//
// Remsan byter text i stället för att lägga till en rad, så att sidan inte
// hoppar när tecknet läses efter hydreringen. Servern och första renderingen
// visar alltid butikens vanliga text.

import { useSyncExternalStore, type ReactNode } from "react";
import { foretagstecken } from "./medlemspris";

const prenumerera = () => () => {};

export function ProfilRemsa({ children }: { children: ReactNode }) {
  const foretag = useSyncExternalStore(prenumerera, foretagstecken, () => false);
  if (!foretag) return <>{children}</>;
  return (
    <span className="promotext">
      <a className="promo-foretag" href="/konto#foretag">
        Du handlar som företag
      </a>{" "}
      · priserna visas exkl. moms
    </span>
  );
}
