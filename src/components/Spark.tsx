export function Spark({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 26 - ((v - min) / span) * 22;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const last = values[values.length - 1];
  const first = values[0];
  const up = last >= first;
  return (
    <div className="spark-block">
      <div className="spark-meta">
        <span>{label}</span>
        <b className={up ? "up" : "down"}>
          {up ? "+" : ""}
          {(((last - first) / (first || 1)) * 100).toFixed(1)}%
        </b>
      </div>
      <svg viewBox="0 0 100 30" className="spark" aria-hidden>
        <path d={d} />
      </svg>
    </div>
  );
}
