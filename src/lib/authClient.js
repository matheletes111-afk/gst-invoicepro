/**
 * Client-side auth helper functions
 * Note: These functions work on the client side and should not expose sensitive data
 */

/**
 * Get user from JWT token stored in cookies (client-side)
 * @returns {{id: number, email: string, organizationId: number} | null}
 */
export function getUserFromTokenClient() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    // Get token from cookie
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith("token="));
    
    if (!tokenCookie) {
      return null;
    }

    const token = tokenCookie.split("=")[1];
    
    if (!token) {
      return null;
    }

    // Decode JWT (client-side only, don't verify signature)
    const payload = JSON.parse(atob(token.split(".")[1]));
    
    return {
      id: payload.id,
      email: payload.email,
      organizationId: payload.organizationId,
    };
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
}

/**
 * Check if current user is super admin (client-side)
 * Compares user email with SUPER_ADMIN_EMAIL from API
 * @returns {Promise<boolean>}
 */
export async function isSuperAdminClient() {
  try {
    const res = await fetch("/api/auth/check-admin");
    const data = await res.json();
    return data.isAdmin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

