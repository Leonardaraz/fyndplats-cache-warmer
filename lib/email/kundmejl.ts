// Omslaget för mejl som går till KUNDER — inte till Leonard.
//
// Förlagan är butikens eget omslag (`emails/_layout.tsx` på grenen
// `headless-site`, `EmailShell`), som orderbekräftelsen, leveransmejlet och
// kundvagnsmejlen redan använder. Ett kundmejl härifrån ska se ut som de: mörk
// rubrikrad med loggan, orange rand, innehållet, och butikens sidfot med
// kundservice. Koden delas inte mellan projekten (separata Vercel-projekt), så
// talen står här — ändras butikens omslag ska det här följa med.
//
// ☠️ LOGGAN ÄR RITAD FÖR DEN MÖRKA RADEN. `/email-logo` är en PNG med vit text på
// samma mörka botten som rubrikraden (#222018). Driftmejlens omslag lade den på
// vit botten, och då såg den ut som en svart skylt (Leonard 2026-09-30:
// "utseendet på logan såg inte helt rätt ut").
//
// ☠️ SIDFOTEN ÄR SKRIVEN FÖR KUNDEN. Driftmejlens rad "skickades automatiskt av
// Fyndplats sync-cron. Klicka inte på okända länkar" hamnade i restock-mejlet
// till kunderna. Här står det kunden behöver: vart man vänder sig.

import { escapeHtml } from "./html";

export const KUND_BRAND = {
  orange: "#F47A35",
  orange2: "#E5681F",
  cta: "#C2410C",
  char: "#222018",
  warm: "#FFF6EF",
  ink: "#1a1a1a",
  line: "#e7e2da",
  muted: "#6b6b6b",
  // Kanonisk adress med www — en omdirigering är ett hopp som inte alla
  // mejlklienters bildproxy följer.
  logoUrl: "https://www.fyndplats.se/email-logo",
  siteUrl: "https://www.fyndplats.se",
  supportEmail: "info@fyndplats.com",
  supportPhone: "+46 73 663 09 90",
  instagram: "https://www.instagram.com/fyndplats/",
  facebook: "https://www.facebook.com/profile.php?id=100089607278056",
} as const;

/** Loggans PNG är 600 × 140. Visas 44 px hög, som i butikens mejl. */
const LOGO_HOJD = 44;
const LOGO_BREDD = Math.round((600 / 140) * LOGO_HOJD);

/** Samma avsändare och svarsadress som butikens kundmejl. */
export function kundAvsandare(): string {
  return process.env.RESEND_KUND_FROM || "Fyndplats <orders@fyndplats.se>";
}
export const KUND_SVARSADRESS = KUND_BRAND.supportEmail;

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/**
 * Lägger kundmejlets ram runt innehållet.
 *
 * `forhandstext` är raden som syns efter ämnesraden i inkorgen. Den ligger i en
 * dold div överst; utan den plockar mejlklienten första synliga text i mejlet,
 * alltså loggans alt-text.
 */
export function wrapInKundShell(bodyHtml: string, forhandstext: string): string {
  const b = KUND_BRAND;
  const footerText = `margin:4px 0;font-size:13px;line-height:1.5;color:${b.muted};`;
  const footerLink = `color:${b.orange2};text-decoration:none;font-weight:600;`;
  return `<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fyndplats</title>
</head>
<body style="margin:0;padding:0;background:${b.warm};font-family:${FONT};color:${b.ink};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${b.warm};opacity:0;">${escapeHtml(forhandstext)}${"&#847;&zwnj;&nbsp;".repeat(40)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${b.warm};">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px -16px rgba(28,28,28,0.18);">
          <tr>
            <td align="center" style="background:${b.char};padding:20px 28px;">
              <a href="${b.siteUrl}" style="text-decoration:none;">
                <img src="${b.logoUrl}" alt="Fyndplats" width="${LOGO_BREDD}" height="${LOGO_HOJD}" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;width:${LOGO_BREDD}px;height:${LOGO_HOJD}px;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="height:6px;line-height:6px;font-size:0;background:${b.orange};">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 28px 8px 28px;font-family:${FONT};color:${b.ink};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#fafafa;padding:28px 28px 32px 28px;border-top:1px solid ${b.line};font-family:${FONT};">
              <p style="${footerText}font-weight:700;color:${b.ink};margin-bottom:8px;">Behöver du hjälp?</p>
              <p style="${footerText}">Mejla <a href="mailto:${b.supportEmail}" style="${footerLink}">${b.supportEmail}</a> eller ring <a href="tel:${b.supportPhone.replace(/\s+/g, "")}" style="${footerLink}white-space:nowrap;">${b.supportPhone}</a></p>
              <p style="margin:12px 0 8px 0;font-size:13px;">
                <a href="${b.instagram}" style="${footerLink}margin-right:16px;">Instagram</a>
                <a href="${b.facebook}" style="${footerLink}">Facebook</a>
              </p>
              <hr style="border:0;border-top:1px solid ${b.line};margin:18px 0 14px 0;" />
              <p style="${footerText}font-size:12px;">Fyndplats · <a href="${b.siteUrl}" style="${footerLink}">www.fyndplats.se</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Sidfoten i klartextversionen, samma uppgifter som i HTML-omslaget. */
export function kundSidfotText(): string {
  const b = KUND_BRAND;
  return [
    `Behöver du hjälp? Mejla ${b.supportEmail} eller ring ${b.supportPhone}.`,
    "Fyndplats · www.fyndplats.se",
  ].join("\n");
}
