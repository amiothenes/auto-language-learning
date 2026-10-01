// Shared "what day is it" helper for SRS daily caps — used both server-side
// (queue budgets, downgrade caps) and client-side (session cache staleness),
// so the two never drift apart on what counts as "today".
export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
