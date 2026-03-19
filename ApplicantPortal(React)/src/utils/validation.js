/**
 * Validation utilities shared across pages/components.
 */

const MAX_EMAIL_LENGTH = 254;

/**
 * PUBLIC_INTERFACE
 * Validate that an input is a plausible email address without using complex regex.
 *
 * Rationale:
 * Sonar hotspot rule javascript:S5852 flags regexes for potential catastrophic backtracking.
 * This implementation is intentionally simple and linear-time.
 *
 * Contract:
 * - Input: email (any)
 * - Output: boolean (true when plausibly valid)
 * - Invariants:
 *   - Bounded input length (<= 254) to reduce risk from pathological inputs.
 * - Errors: never throws
 */
export function isValidEmail(email) {
  const value = String(email ?? "").trim();

  if (!value) return false;
  if (value.length > MAX_EMAIL_LENGTH) return false;

  const atIndex = value.indexOf("@");
  if (atIndex <= 0) return false;
  if (value.indexOf("@", atIndex + 1) !== -1) return false; // only one "@"

  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);

  // Must have domain with at least one dot, not at ends.
  const dotIndex = domain.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === domain.length - 1) return false;

  // Reject spaces anywhere.
  if (value.includes(" ")) return false;

  // Minimal local/domain presence.
  if (!local || !domain) return false;

  return true;
}

/**
 * PUBLIC_INTERFACE
 * Return an error message for an email field (empty string when OK).
 *
 * Contract:
 * - Inputs: email (any), touched (boolean)
 * - Output: string
 */
export function getEmailError(email, touched) {
  if (!touched) return "";
  return isValidEmail(email) ? "" : "Enter a valid email address.";
}
