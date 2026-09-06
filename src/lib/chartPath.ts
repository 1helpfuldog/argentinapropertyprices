/** Catmull-Rom → cubic Bézier. Needs 2+ points. */
export function smoothLine(pts: ReadonlyArray<readonly [number, number]>): string {
  if (pts.length < 2) return "";
  const fmt = (n: number) => n.toFixed(2);
  if (pts.length === 2) {
    return `M${fmt(pts[0][0])} ${fmt(pts[0][1])} L${fmt(pts[1][0])} ${fmt(pts[1][1])}`;
  }
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${fmt(c1x)} ${fmt(c1y)}, ${fmt(c2x)} ${fmt(c2y)}, ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return d;
}

export function areaFromLine(d: string, pts: ReadonlyArray<readonly [number, number]>, y0: number): string {
  if (!pts.length) return "";
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${d} L${last[0].toFixed(2)} ${y0} L${first[0].toFixed(2)} ${y0} Z`;
}
