/**
 * a0, b0, a1, b1, ... up to `limit`; when one list runs out the other fills in.
 * Used to mix regular new cards with starter-deck cards in lib/srs/queue.ts.
 */
export function mergeAlternating<T>(a: T[], b: T[], limit: number): T[] {
  const out: T[] = [];
  for (let i = 0; out.length < limit && (i < a.length || i < b.length); i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length && out.length < limit) out.push(b[i]);
  }
  return out;
}
