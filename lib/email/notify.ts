// Mejlnotiser vid köp — beroendefritt via Resends HTTP-API.
//
// Av som default: utan RESEND_API_KEY + EMAIL_FROM görs ingenting (best-effort,
// kastar aldrig). Mejltexterna byggs av rena funktioner så de kan enhetstestas
// utan att något skickas.

export interface OrderInfo {
  email: string;
  /** "audit" | "monitoring" | annat. */
  plan: string;
  amountSek?: number;
  scannedUrl?: string;
  /** Bas-URL för länkar, t.ex. https://fyndplats.com. */
  baseUrl?: string;
}

export interface Email {
  to: string;
  subject: string;
  html: string;
}

function planName(plan: string): string {
  if (plan === "audit") return "EAA-tillgänglighetsaudit";
  if (plan === "monitoring") return "löpande tillgänglighetsbevakning";
  return "din beställning";
}

/** Länk till den genererade rapporten om vi vet vilken URL som scannades. */
export function reportLink(o: OrderInfo): string | null {
  if (!o.scannedUrl || !o.baseUrl) return null;
  return `${o.baseUrl.replace(/\/$/, "")}/grade/rapport?url=${encodeURIComponent(o.scannedUrl)}`;
}

/** Bekräftelsemejl till kunden. */
export function buildCustomerEmail(o: OrderInfo): Email {
  const link = reportLink(o);
  const linkBlock = link
    ? `<p>Du kan se din preliminära rapport direkt här:<br>
       <a href="${link}">${link}</a></p>
       <p>Vi går igenom den manuellt och återkommer med en komplett åtgärdsplan inom 5 arbetsdagar.</p>`
    : `<p>Vi sätter igång med din granskning och återkommer med en komplett åtgärdsplan inom 5 arbetsdagar.</p>`;
  return {
    to: o.email,
    subject: "Tack för din beställning – EAA-tillgänglighet",
    html: `<p>Hej,</p>
      <p>Tack för att du beställt <strong>${planName(o.plan)}</strong>.</p>
      ${linkBlock}
      <p>Hör gärna av dig om du har frågor.</p>
      <p>Vänligen,<br>Fyndplats</p>`,
  };
}

/** Säljnotis till dig (ägaren). */
export function buildOwnerEmail(o: OrderInfo, ownerTo: string): Email {
  const link = reportLink(o);
  return {
    to: ownerTo,
    subject: `Ny försäljning: ${planName(o.plan)}${o.amountSek != null ? ` (${o.amountSek} kr)` : ""}`,
    html: `<p>Ny beställning via gradern.</p>
      <ul>
        <li>Kund: ${o.email}</li>
        <li>Plan: ${o.plan}</li>
        <li>Belopp: ${o.amountSek != null ? `${o.amountSek} kr` : "okänt"}</li>
        <li>Granskad sida: ${o.scannedUrl ?? "-"}</li>
        ${link ? `<li>Rapport: <a href="${link}">${link}</a></li>` : ""}
      </ul>`,
  };
}

/** Skickar ett mejl via Resend. Returnerar false om ej konfigurerat/fel (best-effort). */
export async function sendEmail(email: Email): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: email.to, subject: email.subject, html: email.html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Skickar bekräftelse till kund + notis till ägare (om EMAIL_OWNER satt). */
export async function notifyOrder(o: OrderInfo): Promise<void> {
  await sendEmail(buildCustomerEmail(o));
  const owner = process.env.EMAIL_OWNER;
  if (owner) await sendEmail(buildOwnerEmail(o, owner));
}
