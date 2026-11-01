// components/tidigare-pris.tsx
//
// Det tidigare priset vid en prissänkning, alltid med Konsumentverkets uttryck
// direkt framför det överstrukna beloppet. Varje yta som visar ett nedsatt pris
// går genom den här komponenten, så att orden inte kan glida isär mellan
// produktsidan, korten och auktionen (lib/tidigare-pris.test.ts fäller ett
// överstruket pris som renderas utan den).
//
// Uttrycket och beloppet står som vanlig text, så en skärmläsare läser
// "30-dagarspris 1 299 kr" i ett svep. Ingen klientkod: komponenten fungerar
// både i server- och klientkomponenter.

import { UTTRYCK_KORT, UTTRYCK_LANG } from "../lib/tidigare-pris";

type Props = {
  /** Det formaterade beloppet, t.ex. "1 299 kr". */
  belopp: string;
  /** Det korta uttrycket ("30-dagarspris") där platsen är liten. */
  kort?: boolean;
  /** Ytans egen klass för placering och storlek. */
  className?: string;
};

export function TidigarePris({ belopp, kort = false, className }: Props) {
  return (
    <span className={className ? `tidigare-pris ${className}` : "tidigare-pris"}>
      <span className="tidigare-pris-uttryck">{kort ? UTTRYCK_KORT : `${UTTRYCK_LANG}:`}</span>{" "}
      <s>{belopp}</s>
    </span>
  );
}
