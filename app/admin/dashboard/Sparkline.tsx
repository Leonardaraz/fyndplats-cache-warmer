// Liten SVG-sparkline — ingen recharts-dependency. Server-renderbar (ingen "use client").
// Ger en mini-trendlinje för 7-dagars order/omsättning/konvertering.

export function Sparkline({
  values,
  width = 160,
  height = 36,
  color = "#C2410C",
  fill = "#fdebe0",
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: string;
}) {
  if (!values.length) return <span style={{ color: "#bbb", fontSize: 12 }}>—</span>;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pad = 3;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const step = values.length > 1 ? w / (values.length - 1) : 0;
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + h - ((v - min) / span) * h;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pad + w},${pad + h} L${pad},${pad + h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <path d={area} fill={fill} stroke="none" />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill={color} />
    </svg>
  );
}
