import { logApiActivity } from '@/lib/api-activity-logger';
import { NextResponse } from 'next/server';

/**
 * Catch-all API route handler that logs all API activity
 * This runs in Node.js Runtime (not Edge Runtime) so Prisma works
 */
export async function middleware(req) {
  // Log activity for all API calls
  try {
    await logApiActivity(req);
  } catch (logError) {
    console.error('Activity logging failed:', logError);
  }

  // Let the actual API route handle the request
  return NextResponse.next();
}

// Apply to all /api/* routes
export const config = {
  matcher: '/api/:path*',
};
