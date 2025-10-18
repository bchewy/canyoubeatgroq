export function normalizeAnswer(raw: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/[\.\!\?]+$/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}


