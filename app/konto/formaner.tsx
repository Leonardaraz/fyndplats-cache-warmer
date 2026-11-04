// Inloggningens högerspalt: tre medlemskort i solfjäder och förmånerna.
// Samma kort visas före öppningen (läget "av").

import { Medlemskort } from "./medlemskort";
import s from "./konto.module.css";

/** Tre kort i solfjäder: nivåerna som bild, på inloggningen och före öppningen. */
export function Kortfacka() {
  return (
    <div className={s.kortfacka} aria-hidden="true">
      <div className={s.fackaKort}>
        <Medlemskort niva="Silver" liten id="mk-f1" />
      </div>
      <div className={s.fackaKort}>
        <Medlemskort niva="Guld" liten id="mk-f2" />
      </div>
      <div className={s.fackaKort}>
        <Medlemskort niva="VIP" liten id="mk-f3" />
      </div>
    </div>
  );
}

export function Formaner() {
  return (
    <ul className={s.formanLista}>
      <li>
        <strong>Din nivå och dina köp</strong> på ett ställe, uppdaterat varje dag.
      </li>
      <li>
        <strong>Alla paket spårade</strong> direkt från ordern.
      </li>
      <li>
        <strong>Köp från det senaste året räknas</strong> direkt när du skapar kontot.
      </li>
      <li>
        <strong>Medlemspriser i kassan</strong> kommer snart, och de högre nivåerna får mer.
      </li>
    </ul>
  );
}
