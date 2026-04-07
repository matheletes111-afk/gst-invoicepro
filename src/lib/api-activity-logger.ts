import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

// Helper to get module from path
function getModuleFromPath(pathname: string): string {
  // Map common API paths to modules
  if (pathname.includes('/api/users')) return 'users';
  if (pathname.includes('/api/customers')) return 'customers';
  if (pathname.includes('/api/parties')) return 'parties';
  if (pathname.includes('/api/sales')) return 'sales';
  if (pathname.includes('/api/second-hand-sales')) return 'second-hand-sales';
  if (pathname.includes('/api/adjustments')) return 'adjustments';
  if (pathname.includes('/api/purchases')) return 'purchases';
  if (pathname.includes('/api/second-hand-purchases')) return 'second-hand-purchases';
  if (pathname.includes('/api/reports')) return 'reports';
  if (pathname.includes('/api/products')) return 'products';
  if (pathname.includes('/api/goods-catalog')) return 'goods-catalog';
  if (pathname.includes('/api/service-catalog')) return 'service-catalog';
  if (pathname.includes('/api/inventory')) return 'inventory';
  if (pathname.includes('/api/suppliers')) return 'suppliers';
  if (pathname.includes('/api/dealers')) return 'dealers';
  if (pathname.includes('/api/gst')) return 'gst';
  if (pathname.includes('/api/unit')) return 'unit';
  if (pathname.includes('/api/currencies')) return 'currencies';
  if (pathname.includes('/api/exchange-rates')) return 'exchange-rates';
  if (pathname.includes('/api/organizations')) return 'organizations';
  if (pathname.includes('/api/business-details')) return 'business-details';
  if (pathname.includes('/api/government-agency-details')) return 'government-agency-details';
  if (pathname.includes('/api/corporation-details')) return 'corporation-details';
  if (pathname.includes('/api/cso-details')) return 'cso-details';
  if (pathname.includes('/api/activity-logs')) return 'activity-logs';
  if (pathname.includes('/api/auth')) return 'auth';
  
  // Extract from URL path
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length >= 2) {
    return segments[1]; // e.g., /api/users -> 'users'
  }
  
  return 'unknown';
}

// Helper to determine if POST is UPDATE or CREATE based on URL pattern
function determineAction(method: string, pathname: string): string {
  const actionMap: Record<string, string> = {
    'GET': 'VIEW',
    'DELETE': 'DELETE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
  };
  
  // For POST methods, check if it's likely an update
  if (method === 'POST') {
    // Check if URL contains update-related patterns
    const updatePatterns = [
      '/update', '/edit', '/save', '/bulk-update',
      '/:id', // If URL has an ID parameter like /api/users/123
    ];
    
    const hasIdInPath = /\/(\d+|[a-f0-9-]{36,})$/.test(pathname); // Matches IDs at end
    const isUpdatePattern = updatePatterns.some(pattern => 
      pathname.includes(pattern.replace('/:id', '')) && hasIdInPath
    );
    
    // If POST to a path with ID, it's likely an UPDATE
    if (hasIdInPath || isUpdatePattern) {
      return 'UPDATE';
    }
    
    // Otherwise, it's CREATE
    return 'CREATE';
  }
  
  return actionMap[method] || method;
}

// Helper to extract IP and User Agent
function extractRequestInfo(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for') || 
                   req.headers.get('cf-connecting-ip') || 
                   req.ip || 
                   'unknown';
  
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

// Generate description based on action and path
function generateDescription(action: string, pathname: string): string {
  const module = getModuleFromPath(pathname);
  const moduleName = module.charAt(0).toUpperCase() + module.slice(1);
  
  switch (action) {
    case 'CREATE':
      return `${moduleName} created`;
    case 'UPDATE':
      return `${moduleName} updated`;
    case 'DELETE':
      return `${moduleName} deleted`;
    case 'VIEW':
      return `${moduleName} viewed`;
    default:
      return `${action} ${pathname}`;
  }
}

// Filter sensitive data
function filterSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password', 'token', 'refreshToken', 'accessToken',
    'creditCard', 'cvv', 'ssn', 'sin', 'dob',
    'secret', 'apiKey', 'privateKey', 'key',
    'pin', 'otp', 'verificationCode'
  ];
  
  const filtered = { ...data };
  
  sensitiveFields.forEach(field => {
    if (filtered[field] !== undefined) {
      filtered[field] = '***FILTERED***';
    }
  });
  
  return filtered;
}

// Main function to log API activity
export async function logApiActivity(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    
    // Skip if not an API route
    if (!pathname.startsWith('/api/')) {
      return;
    }
    
    // Skip activity logs themselves to prevent infinite loops
    if (pathname.includes('/api/activity-logs')) {
      return;
    }
    
    // Get user info
    const user = await getUserFromRequest(req);
    
    // If no user and not a public API, skip logging
    if (!user?.id) {
      console.log('[Activity Logger] No user found, skipping log');
      return;
    }
    
    console.log('[Activity Logger] Logging for user:', user.id, 'pathname:', pathname);
    
    // Get request details
    const { ipAddress, userAgent } = extractRequestInfo(req);
    const method = req.method;
    
    // Determine action (handles POST for updates)
    const action = determineAction(method, pathname);
    const module = getModuleFromPath(pathname);
    const description = generateDescription(action, pathname);
    
    // Prepare payload for non-GET requests
    let payload = null;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        // Clone request to read body without affecting the original
        const clonedReq = req.clone();
        const body = await clonedReq.text();
        
        if (body) {
          const parsed = JSON.parse(body);
          payload = filterSensitiveData(parsed);
        }
      } catch {
        // If can't parse as JSON, skip payload
      }
    }
    
    // Dynamically import prisma to avoid Edge Runtime issues
    const { default: prisma } = await import('@/lib/prisma');
    
    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action,
        module,
        description,
        payload,
        ipAddress,
        userAgent,
      },
    });
    
    console.log('[Activity Logger] Log created successfully for:', action, module);
    
  } catch (error) {
    // Don't throw errors - logging failures shouldn't break the app
    console.error('Activity logging error:', error?.message || error);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}