// Länken för att avregistrera sig från mejlen om nivån (lib/medlem/mejl.ts).
// Mejlen om nivån uppmanar till köp; inloggningskoder och kvitton påverkas inte.

import { Link, Text } from "@react-email/components";
import { BRAND, text } from "./_layout";

export function AvregistreraNivamejl({ href }: { href?: string }) {
  if (!href) return null;
  return (
    <Text style={{ ...text.muted, marginTop: "20px" }}>
      Du får mejl om din nivå för att du har ett medlemskonto hos Fyndplats.{" "}
      <Link href={href} style={{ color: BRAND.muted, textDecoration: "underline" }}>
        Avregistrera dig
      </Link>{" "}
      från dem. Inloggningskoder och kvitton kommer som vanligt.
    </Text>
  );
}
