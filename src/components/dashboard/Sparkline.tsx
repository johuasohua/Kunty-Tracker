/**
 * Minimal inline-SVG sparkline — a trend line with a soft area fill, drawn
 * in the category's own color. Purely presentational; no chart library.
 */
export function Sparkline({
  values,
  color,
  height = 28,
}: {
  values: number[];
  color: string;
  height?: number;
}) {
  const width = 100;
  const pad = 3; // keep the stroke off the top/bottom edges
  const n = values.length;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = n > 1 ? width / (n - 1) : 0;

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = pad + (height - 2 * pad) * (1 - (v - min) / range);
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      aria-hidden="true"
      className="block"
    >
      <path d={area} fill={color} opacity={0.12} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
