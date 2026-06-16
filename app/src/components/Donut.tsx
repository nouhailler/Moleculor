/* Macro donut — multi-stop conic-gradient with a white hole, ported from the
   prototype's donut(segs, size). */

export interface DonutSeg {
  color: string;
  pct: number;
}

export function Donut({ segs, size }: { segs: DonutSeg[]; size: number }) {
  const th = Math.round(size * 0.17);
  let acc = 0;
  const stops = segs
    .map((s) => {
      const a = acc;
      acc += s.pct;
      return `${s.color} ${a.toFixed(2)}% ${acc.toFixed(2)}%`;
    })
    .join(', ');
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(${stops})`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: th,
          left: th,
          right: th,
          bottom: th,
          borderRadius: '50%',
          background: '#fff',
        }}
      />
    </div>
  );
}
