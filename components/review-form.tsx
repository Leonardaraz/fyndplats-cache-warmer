"use client";

// Omdömesformuläret. En sektion per produkt i ordern — kunden kan svara på en
// och strunta i resten.
//
// Stjärnorna är radioknappar under ytan, inte klickbara <div>:ar: en kund som
// navigerar med tangentbord eller skärmläsare ska kunna sätta betyg utan mus.

import { useState } from "react";
import { validateCustomerReview, FELTEXT } from "../lib/customer-review";
import { IMAGE_FELTEXT, MAX_IMAGES, validateUpload } from "../lib/review-image";

interface Vara {
  productId: string;
  name: string;
  imageUrl?: string;
  variant?: string;
}

type Läge =
  | { typ: "vilar" }
  // `bild` sätts medan en bild laddas upp: {nu, av} driver knappens text, så
  // tre uppladdningar på mobildata inte ser ut som att sidan hängt sig.
  | { typ: "skickar"; bild?: { nu: number; av: number } }
  // `utelamnade` = bilder kunden valde men som inte kom med. Kvitteringen
  // måste säga det: annars tror hen att fotona finns, och upptäcker först
  // veckor senare på produktsidan att de saknas.
  | { typ: "klar"; utelamnade: number }
  | { typ: "fel"; text: string };

// Ordet under betyget. Bara dekor för seendet — radioknapparna säger redan
// "n av 5 stjärnor" till skärmläsaren.
const BETYGSORD = ["", "Inte alls bra", "Mindre bra", "Helt okej", "Bra", "Mycket bra"];

function Stjärnval({
  värde,
  onChange,
  namn,
}: {
  värde: number;
  onChange: (n: number) => void;
  namn: string;
}) {
  // Att peka på fjärde stjärnan ska tända fyra, inte bara den fjärde. Ren
  // CSS-:hover tänder bara den man är på, vilket får det att kännas trasigt.
  const [hovrad, setHovrad] = useState(0);
  const visat = hovrad || värde;

  return (
    <fieldset className="rf-stars" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="rf-legend">Ditt betyg</legend>
      <div className="rf-star-row" onMouseLeave={() => setHovrad(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className={`rf-star ${n <= visat ? "rf-star-on" : ""}`}
            onMouseEnter={() => setHovrad(n)}
          >
            <input
              type="radio"
              name={namn}
              value={n}
              checked={värde === n}
              onChange={() => onChange(n)}
            />
            <span aria-hidden="true">★</span>
            <span className="rf-sr">{n} av 5 stjärnor</span>
          </label>
        ))}
      </div>
      <span className="rf-rating-word" aria-hidden="true">
        {BETYGSORD[visat] || " "}
      </span>
    </fieldset>
  );
}

function ProduktBlock({ token, vara }: { token: string; vara: Vara }) {
  const [betyg, setBetyg] = useState(0);
  const [text, setText] = useState("");
  const [namn, setNamn] = useState("");
  // Valfria kundfoton, högst MAX_IMAGES. En enda filväljare med `multiple` —
  // inte tre fält: kunden markerar en eller tre i samma dialog, så friktionen
  // ökar inte. Det spelar roll, för flaskhalsen är att få NÅGON recension alls.
  const [filer, setFiler] = useState<File[]>([]);
  const [forhandsvisningar, setForhandsvisningar] = useState<string[]>([]);
  const [läge, setLäge] = useState<Läge>({ typ: "vilar" });

  async function skicka(e: React.FormEvent) {
    e.preventDefault();

    // Samma kontroll som rutten kör, samma feltexter — importerade, inte
    // omskrivna, så de aldrig kan glida isär. Kunden slipper vänta på ett
    // serversvar för att få veta att stjärnorna saknas. Servern kontrollerar
    // ändå: det här är bekvämlighet, inte skyddet.
    const kontroll = validateCustomerReview({ rating: betyg || "", text, name: namn });
    if (!kontroll.ok) {
      setLäge({ typ: "fel", text: FELTEXT[kontroll.error] });
      return;
    }

    // Storleken kontrolleras här också, med SAMMA gräns som servern använder.
    // Poängen är inte att skydda — det gör servern — utan att kunden ska få
    // veta vilken bild som är för stor i stället för ett svar långt senare.
    for (const f of filer) {
      const felkod = validateUpload(f.size, f.type);
      if (felkod) {
        setLäge({ typ: "fel", text: `${f.name}: ${IMAGE_FELTEXT[felkod]}` });
        return;
      }
    }

    setLäge({ typ: "skickar" });
    try {
      // EN BILD PER ANROP, som multipart. Tidigare låg alla bilder base64-
      // kodade i sparningens JSON-kropp; plattformen avvisar en request över
      // 4,5 MB och base64 blåser upp med en tredjedel, så taket blev ~3,4 MB
      // för alla bilder tillsammans. Ett mobilfoto kunde gå igenom, tre aldrig.
      // Nu får varje bild sin egen budget, och multipart slipper påslaget.
      const imageUrls: string[] = [];
      for (const [i, f] of filer.entries()) {
        setLäge({ typ: "skickar", bild: { nu: i + 1, av: filer.length } });
        const fd = new FormData();
        fd.append("token", token);
        fd.append("productId", vara.productId);
        fd.append("index", String(i));
        fd.append("fil", f);
        const bildSvar = await fetch("/api/omdome/bild", { method: "POST", body: fd });
        const bildData = (await bildSvar.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
          hoppaOver?: boolean;
        };
        if (bildSvar.ok && bildData.url) {
          imageUrls.push(bildData.url);
          continue;
        }
        // En bild som inte gick upp ska inte kosta kunden hela omdömet — texten
        // och betyget är huvudsaken. Vi hoppar över den och skickar resten.
        // Ett ÄKTA fel i filen (för stor, fel typ, inte en bild) säger vi
        // däremot till om, för då kan kunden göra något åt det.
        if (bildData.hoppaOver || bildSvar.status >= 500) continue;
        setLäge({ typ: "fel", text: bildData.error || "Bilden kunde inte skickas." });
        return;
      }

      setLäge({ typ: "skickar" });
      const res = await fetch("/api/omdome", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          productId: vara.productId,
          rating: betyg,
          text,
          name: namn,
          ...(imageUrls.length > 0 ? { imageUrls } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; bilder?: number };
      if (!res.ok) {
        setLäge({ typ: "fel", text: data.error || "Något gick fel. Försök igen." });
        return;
      }
      // Servern svarar med hur många bilder som FAKTISKT sparades. Skillnaden
      // mot vad kunden valde täcker båda sätten en bild kan tappas: en
      // uppladdning som föll, och en adress servern inte godtog.
      const sparade = typeof data.bilder === "number" ? data.bilder : filer.length;
      setLäge({ typ: "klar", utelamnade: Math.max(0, filer.length - sparade) });
    } catch {
      setLäge({ typ: "fel", text: "Kunde inte skicka just nu. Försök igen om en stund." });
    }
  }

  if (läge.typ === "klar") {
    return (
      <div className="rf-card rf-done">
        <strong>Tack!</strong>
        <p style={{ margin: "6px 0 0 0" }}>
          Ditt omdöme om <em>{vara.name}</em> är mottaget. Vi läser igenom det innan det
          publiceras på produktsidan.
        </p>
        {/* Sägs bara när något faktiskt föll bort. Texten lovar ingen åtgärd
            från vår sida — kunden kan skicka formuläret igen, och eftersom
            radens id härleds ur order + produkt uppdaterar det omdömet i
            stället för att skapa en dubblett. */}
        {läge.utelamnade > 0 ? (
          <p className="rf-hint" style={{ margin: "10px 0 0 0" }}>
            {läge.utelamnade === 1
              ? "En av dina bilder kunde inte laddas upp och kom inte med."
              : `${läge.utelamnade} av dina bilder kunde inte laddas upp och kom inte med.`}{" "}
            Texten och betyget är sparade. Vill du försöka igen med bilderna kan du fylla i
            formuläret en gång till — ditt omdöme uppdateras då i stället för att dubbleras.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form className="rf-card" onSubmit={skicka}>
      <div className="rf-head">
        {vara.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="rf-img" src={vara.imageUrl} alt="" />
        ) : null}
        <div>
          <div className="rf-name">{vara.name}</div>
          {vara.variant ? <div className="rf-variant">{vara.variant}</div> : null}
        </div>
      </div>

      <Stjärnval värde={betyg} onChange={setBetyg} namn={`betyg-${vara.productId}`} />

      <label className="rf-label" htmlFor={`text-${vara.productId}`}>
        Vad tyckte du?
      </label>
      <textarea
        id={`text-${vara.productId}`}
        className="rf-textarea"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Hur fungerar den? Var den som du förväntade dig? Något andra bör veta?"
        maxLength={2000}
      />

      <label className="rf-label" htmlFor={`bild-${vara.productId}`}>
        Bilder{" "}
        <span className="rf-hint">
          (frivilligt – upp till {MAX_IMAGES} st, visa gärna varan i verkligheten)
        </span>
      </label>
      <input
        id={`bild-${vara.productId}`}
        className="rf-input"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          // Kapar vid taket i stället för att avvisa: har kunden markerat fem
          // bilder är det bättre att ta de tre första än att be hen börja om.
          const valda = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES);
          setFiler(valda);
          setForhandsvisningar((tidigare) => {
            for (const u of tidigare) URL.revokeObjectURL(u);
            return valda.map((f) => URL.createObjectURL(f));
          });
        }}
      />
      {forhandsvisningar.length > 0 ? (
        <div className="rf-preview">
          {forhandsvisningar.map((url, i) => (
            <img key={url} className="rf-preview-img" src={url} alt={`Din bild ${i + 1}`} />
          ))}
          <button
            type="button"
            className="rf-preview-remove"
            onClick={() => {
              for (const u of forhandsvisningar) URL.revokeObjectURL(u);
              setForhandsvisningar([]);
              setFiler([]);
            }}
          >
            {forhandsvisningar.length === 1 ? "Ta bort bilden" : "Ta bort bilderna"}
          </button>
        </div>
      ) : null}

      <label className="rf-label" htmlFor={`namn-${vara.productId}`}>
        Ditt namn <span className="rf-hint">(frivilligt – vi visar bara initialer)</span>
      </label>
      <input
        id={`namn-${vara.productId}`}
        className="rf-input"
        value={namn}
        onChange={(e) => setNamn(e.target.value)}
        maxLength={60}
        autoComplete="name"
      />

      {läge.typ === "fel" ? (
        <p className="rf-error" role="alert">
          {läge.text}
        </p>
      ) : null}

      <button className="rf-submit" type="submit" disabled={läge.typ === "skickar"}>
        {/* Räknaren finns för att tre bilder på mobildata tar tiotals sekunder.
            Utan den ser en stum knapp ut som att sidan hängt sig, och kunden
            laddar om mitt i uppladdningen. */}
        {läge.typ === "skickar"
          ? läge.bild
            ? `Skickar bild ${läge.bild.nu} av ${läge.bild.av} …`
            : "Skickar …"
          : "Skicka omdöme"}
      </button>
    </form>
  );
}

export function ReviewForm({ token, varor }: { token: string; varor: Vara[] }) {
  return (
    <div className="rf-list">
      {varor.map((v) => (
        <ProduktBlock key={v.productId} token={token} vara={v} />
      ))}
    </div>
  );
}
