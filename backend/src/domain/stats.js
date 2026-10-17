// Pure statistics helpers. No I/O, so they are trivially unit-testable.

/** Linear-interpolated percentile (p in 0..100) of an ascending-sorted array. */
export function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0];
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}

const round = (n) => (n === null ? null : Math.round(n));

/** Summarise a list of numbers. Returns zeros/nulls for an empty list. */
export function summarize(values) {
  if (values.length === 0) {
    return { headcount: 0, total: 0, min: null, p10: null, median: null, avg: null, p90: null, max: null };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((s, v) => s + v, 0);
  return {
    headcount: sorted.length,
    total: round(total),
    min: round(sorted[0]),
    p10: round(percentile(sorted, 10)),
    median: round(percentile(sorted, 50)),
    avg: round(total / sorted.length),
    p90: round(percentile(sorted, 90)),
    max: round(sorted[sorted.length - 1]),
  };
}

/** Equal-width histogram. Returns [{from, to, count}] with `bins` buckets. */
export function histogram(values, bins = 10) {
  if (values.length === 0 || bins < 1) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) return [{ from: min, to: max, count: values.length }];
  const width = (max - min) / bins;
  const out = Array.from({ length: bins }, (_, i) => ({
    from: Math.round(min + i * width),
    to: Math.round(min + (i + 1) * width),
    count: 0,
  }));
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor((v - min) / width)); // max lands in last bucket
    out[idx].count += 1;
  }
  return out;
}