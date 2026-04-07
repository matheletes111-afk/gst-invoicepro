/**
 * Pure helpers for role-based route access (used by middleware and optionally elsewhere).
 * Mirrors sidebar logic: super admin = all routes; others = /dashboard + allowed menu endpoints.
 */

/**
 * @param {string} pathname
 * @returns {string}
 */
export function normalizePathname(pathname) {
  if (!pathname || pathname === "/") return pathname || "/";
  if (pathname.endsWith("/")) {
    return pathname.slice(0, -1) || "/";
  }
  return pathname;
}

const DASHBOARD = "/dashboard";

/**
 * @param {string} pathname - request pathname (no query string)
 * @param {{ isSuperAdmin: boolean, allowedEndpoints: string[] }} access
 * @returns {boolean}
 */
export function isPathAllowedForUser(pathname, access) {
  const { isSuperAdmin, allowedEndpoints } = access;
  if (isSuperAdmin) return true;

  const p = normalizePathname(pathname);
  if (p === DASHBOARD) return true;

  const endpoints = Array.isArray(allowedEndpoints) ? allowedEndpoints : [];
  return endpoints.some((ep) => {
    if (ep == null || ep === "") return false;
    const e = normalizePathname(String(ep));
    return p === e || p.startsWith(`${e}/`);
  });
}
