// Medlemskortet i mejlen: samma nivåfärger som på Mina sidor
// (app/konto/konto.module.css), byggt för mejlklienter. Outlook visar inte
// gradienter, så varje nivå har också en enfärgad bakgrund som reserv.

import { Section, Text } from "@react-email/components";

const KORT: Record<string, { bg: string; grad: string; ink: string; dim: string }> = {
  Brons: { bg: "#9a5a35", grad: "linear-gradient(135deg,#5c2f18 0%,#9a5a35 48%,#cf9466 100%)", ink: "#fff8f2", dim: "#f3dccb" },
  Silver: { bg: "#c3cad1", grad: "linear-gradient(135deg,#e7ebee 0%,#c3cad1 46%,#f4f6f8 70%,#aab3bc 100%)", ink: "#18222b", dim: "#3d4a55" },
  Guld: { bg: "#a87a1f", grad: "linear-gradient(135deg,#5a3d07 0%,#a87a1f 42%,#e2bb5c 78%,#f5dc95 100%)", ink: "#fffaf0", dim: "#fbeccb" },
  Platina: { bg: "#59646f", grad: "linear-gradient(135deg,#2b333b 0%,#59646f 48%,#9aa6b1 100%)", ink: "#f7fafc", dim: "#dfe5ea" },
  Diamant: { bg: "#1c5288", grad: "linear-gradient(135deg,#0b2440 0%,#1c5288 50%,#6fb7e6 100%)", ink: "#f4fbff", dim: "#cfe8f8" },
  VIP: { bg: "#18161a", grad: "linear-gradient(135deg,#070708 0%,#18161a 55%,#2e2618 100%)", ink: "#f1d384", dim: "#c9b071" },
};

export function MedlemskortMejl({ niva, rad }: { niva: string; rad?: string }) {
  const k = KORT[niva] ?? KORT.Brons;
  return (
    <Section
      style={{ backgroundColor: k.bg, backgroundImage: k.grad, borderRadius: "16px", padding: "20px 22px", margin: "20px 0" }}
    >
      <Text style={{ margin: 0, fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: k.dim }}>
        Fyndplats · Medlem
      </Text>
      <Text style={{ margin: "18px 0 4px 0", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "34px", lineHeight: "1.1", color: k.ink }}>
        {niva}
      </Text>
      {rad ? <Text style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: k.dim }}>{rad}</Text> : null}
    </Section>
  );
}
