import jwt from "jsonwebtoken";
import { jwtVerify } from "jose";

/**
 * Extract user context (id, email, organizationId) from JWT token in request
 * @param {Request} req - Next.js request object
 * @returns {Promise<{id: number, email: string, organizationId: number} | null>}
 */
export async function getUserFromRequest(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return null;
    }

    // Verify token and decode
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.id,
      email: payload.email,
      organizationId: payload.organizationId,
    };
  } catch (error) {
    console.error("Error extracting user from request:", error);
    return null;
  }
}

/**
 * Extract organizationId from JWT token in request
 * @param {Request} req - Next.js request object
 * @returns {Promise<number | null>}
 */
export async function getOrganizationIdFromRequest(req) {
  const user = await getUserFromRequest(req);
  return user?.organizationId || null;
}

/**
 * Verify that the user has access to the specified organization
 * @param {Request} req - Next.js request object
 * @param {number} organizationId - Organization ID to verify access to
 * @returns {Promise<boolean>}
 */
export async function verifyOrganizationAccess(req, organizationId) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return false;
  }
  return user.organizationId === organizationId;
}

/**
 * Get user context synchronously from JWT token string (for use outside request context)
 * @param {string} token - JWT token string
 * @returns {{id: number, email: string, organizationId: number} | null}
 */
export function getUserFromToken(token) {
  try {
    if (!token || !process.env.JWT_SECRET) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      id: decoded.id,
      email: decoded.email,
      organizationId: decoded.organizationId,
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

/**
 * Check if a user is a super admin based on email
 * Super admin email is configured via SUPER_ADMIN_EMAIL environment variable
 * @param {string} email - User email
 * @returns {boolean}
 */
export function isSuperAdmin(email) {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superAdminEmail) {
    return false;
  }
  return email === superAdminEmail;
}

/**
 * Check if the user from request is a super admin
 * @param {Request} req - Next.js request object
 * @returns {Promise<boolean>}
 */
export async function isSuperAdminFromRequest(req) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return false;
  }
  return isSuperAdmin(user.email);
}

