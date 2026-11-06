// Offertens vy (E3-10): raderna, summorna och kassaknappen. Ingen läsning
// här; sidan (page.tsx) hämtar offerten och prövar att den är kontots egen.

import { aktuellStatus, kanBetalas, offertStatusText, offertSummor, type Offert } from "@/lib/medlem/offert";
import { exklMoms } from "@/lib/medlem/pris";
import { kronorText } from "@/lib/medlem/kronor";
import { OffertKassaKnapp } from "./kassa-knapp";
import s from "../../konto/konto.module.css";

const MOMS = 25;
const DAG = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Stockholm" });

export function OffertVy({ o, nu }: { o: Offert; nu: number }) {
  const status = aktuellStatus(o, nu);
  const summor = offertSummor(o);
  const prissatt = summor.offertOre !== null && status !== "skickad" && status !== "avbojd";
  const totalEx = prissatt ? exklMoms(summor.offertOre as number, MOMS) : null;

  return (
    <section className="sec">
      <div className={`container ${s.ram}`}>
        <div className={s.portal}>
          <div className={s.huvud}>
            <div>
              <p className={s.ogonbryn}>Offert</p>
              <h1 className={s.rubrik}>{o.foretagNamn || "Offert"}</h1>
              <p className={s.vem}>
                Begärd {o.skapad ? DAG.format(new Date(o.skapad)) : "–"} · {offertStatusText(o, nu)}
              </p>
            </div>
          </div>

          <div className={s.kort}>
            <table className={s.offertTabell}>
              <thead>
                <tr>
                  <th scope="col">Vara</th>
                  <th scope="col">Antal</th>
                  <th scope="col">{prissatt ? "Styckpris exkl. moms" : "Listpris exkl. moms"}</th>
                  <th scope="col">Summa exkl. moms</th>
                </tr>
              </thead>
              <tbody>
                {o.rader.map((r, i) => {
                  const styck = prissatt && typeof r.offertOre === "number" ? r.offertOre : r.aOre;
                  return (
                    <tr key={`${r.produktId}-${r.variantId ?? ""}-${i}`}>
                      <td>{r.namn}</td>
                      <td>{r.antal}</td>
                      <td>{kronorText(exklMoms(styck, MOMS))}</td>
                      <td>{kronorText(exklMoms(styck * r.antal, MOMS))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {prissatt && totalEx !== null ? (
              <dl className={s.offertSumma}>
                <div>
                  <dt>Varor exkl. moms</dt>
                  <dd>{kronorText(totalEx)}</dd>
                </div>
                <div>
                  <dt>Moms 25 %</dt>
                  <dd>{kronorText((summor.offertOre as number) - totalEx)}</dd>
                </div>
                <div>
                  <dt>Totalt inkl. moms</dt>
                  <dd>
                    <strong>{kronorText(summor.offertOre as number)}</strong>
                  </dd>
                </div>
              </dl>
            ) : (
              <p className={s.info}>Priserna ovan är listpriser. Vi skickar ett mejl när offerten är prissatt.</p>
            )}
            {kanBetalas(o, nu) ? (
              <>
                <p className={s.liten}>Frakten följer det som gäller för alla kunder. Kassan visar priserna inklusive moms.</p>
                <OffertKassaKnapp id={o.id} klass={`btn btn-primary ${s.knapp}`} />
              </>
            ) : null}
          </div>
          <p className={s.hjalp}>
            Frågor om offerten? Mejla <a href="mailto:info@fyndplats.com">info@fyndplats.com</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
