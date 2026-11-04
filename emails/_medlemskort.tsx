// Medlemskortet i mejlen: samma nivåfärger som på Mina sidor
// (app/konto/konto.module.css), byggt för mejlklienter. Outlook visar inte
// gradienter, så varje nivå har också en enfärgad bakgrund som reserv.
//
// Kontrasten är räknad för radens lilla text (13 px) mot både gradienten och
// reserven: minst 4,5 (granskningen 2026-11-04, mätt om i webbläsaren samma
// kväll: lägst 5,0). Guld, silver och platina är ljusa metaller med mörk text,
// som på Mina sidor och i rutan med medlemspriset. Platina är jade (Leonard
// 2026-11-04 kväll).

import { Section, Text } from "@react-email/components";

const KORT: Record<string, { bg: string; grad: string; ink: string; dim: string }> = {
  Brons: { bg: "#8f5230", grad: "linear-gradient(135deg,#5c2f18 0%,#8f5230 55%,#c98d5f 100%)", ink: "#fff8f2", dim: "#fff1e6" },
  Silver: { bg: "#c3cad1", grad: "linear-gradient(135deg,#e7ebee 0%,#c3cad1 46%,#f4f6f8 70%,#aab3bc 100%)", ink: "#18222b", dim: "#3d4a55" },
  Guld: { bg: "#eccb6e", grad: "linear-gradient(135deg,#f8e8b4 0%,#eccb6e 50%,#dcb04a 100%)", ink: "#2b1d02", dim: "#4a3507" },
  Platina: { bg: "#4fd6bb", grad: "linear-gradient(135deg,#b4f2e4 0%,#4fd6bb 50%,#2cbf9f 100%)", ink: "#02261e", dim: "#063a2f" },
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
