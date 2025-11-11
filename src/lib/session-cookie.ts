/**
 * Shared helpers for working with the Better Auth session cookie.
 * The cookie name can be overridden via env to support per-deployment prefixes.
 */
const SESSION_COOKIE_NAME_ENV = process.env.SESSION_COOKIE_NAME;
const SESSION_COOKIE_PREFIX_ENV = process.env.SESSION_COOKIE_PREFIX;

const derivePrefixFromName = (cookieName?: string | null) => {
  if (!cookieName) {
    return null;
  }

  const suffix = ".session_token";
  if (cookieName.endsWith(suffix)) {
    return cookieName.slice(0, -suffix.length);
  }

  return null;
};

const derivedPrefixFromName = derivePrefixFromName(SESSION_COOKIE_NAME_ENV);

export const SESSION_COOKIE_PREFIX =
  SESSION_COOKIE_PREFIX_ENV ||
  derivedPrefixFromName ||
  "zapdev";

export const SESSION_COOKIE_NAME =
  SESSION_COOKIE_NAME_ENV ||
  `${SESSION_COOKIE_PREFIX}.session_token`;
