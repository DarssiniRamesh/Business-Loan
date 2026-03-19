/**
 * Small string utilities shared across the applicant portal.
 */

/**
 * PUBLIC_INTERFACE
 * Remove trailing occurrences of a character without using RegExp.
 *
 * Contract:
 * - Inputs: value (any), char (single character string)
 * - Output: string with trailing `char` removed (0..n times)
 * - Errors: never throws
 */
export function trimTrailingChar(value, char = "/") {
  const s = String(value ?? "");
  if (!s) return "";
  if (!char || typeof char !== "string") return s;

  let end = s.length;
  while (end > 0 && s[end - 1] === char) end -= 1;
  return end === s.length ? s : s.slice(0, end);
}

/**
 * PUBLIC_INTERFACE
 * Normalize a potentially "Bearer ..." token to its raw value.
 *
 * Contract:
 * - Input: tokenLike (any)
 * - Output: raw token string or null
 * - Errors: never throws
 */
export function stripBearerPrefix(tokenLike) {
  const t = String(tokenLike ?? "").trim();
  if (!t || t === "null" || t === "undefined") return null;

  const lower = t.toLowerCase();
  if (lower.startsWith("bearer ")) {
    const raw = t.slice("bearer ".length).trim();
    return raw || null;
  }
  return t;
}
