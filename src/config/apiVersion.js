// The API major version this frontend is built against.
//
// Every API call goes through `/api/v1/` (see BASE in src/api/client.js), so
// this frontend speaks API major v1. This constant is the single source of
// truth for that expectation: the About page compares it against the API
// major the backend reports on `/status/` and warns when they diverge, so a
// newer frontend can detect an older backend (and vice versa). When the
// frontend migrates to `/api/v2/`, bump this to 2 in lockstep with BASE.
export const EXPECTED_API_MAJOR = 1;

/**
 * Parse a major-version integer out of an api_version string. The backend
 * reports values like "v1" (see chores-web-backend#16); this also tolerates a
 * bare "1" or "1.4.0". Returns null for anything without a leading number.
 */
export function parseApiMajor(apiVersion) {
  if (apiVersion == null) return null;
  const match = String(apiVersion).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}
