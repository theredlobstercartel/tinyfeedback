/**
 * Rate limiting utility for TinyFeedback API
 * Implements in-memory rate limiting with IP-based tracking
 * 
 * Configuration:
 * - Window: 60 seconds
 * - Max requests: 60 per IP per minute
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000; // 60 seconds
const MAX_REQUESTS = 60; // 60 requests per minute

/**
 * Get client IP from request
 * Handles various proxy scenarios
 */
export function getClientIP(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a default identifier
  // In production, this should be improved with proper IP detection
  return 'unknown';
}

/**
 * Check if request is within rate limit
 * Returns result with headers information
 */
export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  
  // Clean up expired entries periodically (simple cleanup)
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(ip);
  }
  
  const currentEntry = rateLimitStore.get(ip);
  
  if (!currentEntry) {
    // First request from this IP
    const resetTime = now + WINDOW_MS;
    rateLimitStore.set(ip, {
      count: 1,
      resetTime,
    });
    
    return {
      success: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - 1,
      resetTime,
    };
  }
  
  // Check if window has expired
  if (now > currentEntry.resetTime) {
    // Reset window
    const resetTime = now + WINDOW_MS;
    rateLimitStore.set(ip, {
      count: 1,
      resetTime,
    });
    
    return {
      success: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - 1,
      resetTime,
    };
  }
  
  // Check if limit exceeded
  if (currentEntry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((currentEntry.resetTime - now) / 1000);
    
    return {
      success: false,
      limit: MAX_REQUESTS,
      remaining: 0,
      resetTime: currentEntry.resetTime,
      retryAfter,
    };
  }
  
  // Increment count
  currentEntry.count += 1;
  
  return {
    success: true,
    limit: MAX_REQUESTS,
    remaining: MAX_REQUESTS - currentEntry.count,
    resetTime: currentEntry.resetTime,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
  };
}

/**
 * Format rate limit error message in Portuguese
 */
export function getRateLimitErrorMessage(retryAfter: number): string {
  return `Muitas tentativas. Tente novamente em ${retryAfter} segundos.`;
}

// ============================================
// Widget-specific rate limiting (ST-14)
// ============================================

interface WidgetRateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// Store for widget-specific rate limiting
const widgetRateLimitStore = new Map<string, RateLimitEntry>();

// ST-14: Rate limiting configuration
const WIDGET_IP_CONFIG: WidgetRateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 requests per minute per IP
};

const WIDGET_GLOBAL_CONFIG: WidgetRateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100, // 100 requests per hour per widget
};

/**
 * Check widget-specific rate limit (per IP)
 * ST-14: 5 requests per minute per IP
 */
export function checkWidgetIPRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const key = `widget:ip:${ip}`;
  const entry = widgetRateLimitStore.get(key);

  if (entry && now > entry.resetTime) {
    widgetRateLimitStore.delete(key);
  }

  const currentEntry = widgetRateLimitStore.get(key);

  if (!currentEntry) {
    const resetTime = now + WIDGET_IP_CONFIG.windowMs;
    widgetRateLimitStore.set(key, {
      count: 1,
      resetTime,
    });

    return {
      success: true,
      limit: WIDGET_IP_CONFIG.maxRequests,
      remaining: WIDGET_IP_CONFIG.maxRequests - 1,
      resetTime,
    };
  }

  if (now > currentEntry.resetTime) {
    const resetTime = now + WIDGET_IP_CONFIG.windowMs;
    widgetRateLimitStore.set(key, {
      count: 1,
      resetTime,
    });

    return {
      success: true,
      limit: WIDGET_IP_CONFIG.maxRequests,
      remaining: WIDGET_IP_CONFIG.maxRequests - 1,
      resetTime,
    };
  }

  if (currentEntry.count >= WIDGET_IP_CONFIG.maxRequests) {
    const retryAfter = Math.ceil((currentEntry.resetTime - now) / 1000);

    return {
      success: false,
      limit: WIDGET_IP_CONFIG.maxRequests,
      remaining: 0,
      resetTime: currentEntry.resetTime,
      retryAfter,
    };
  }

  currentEntry.count += 1;

  return {
    success: true,
    limit: WIDGET_IP_CONFIG.maxRequests,
    remaining: WIDGET_IP_CONFIG.maxRequests - currentEntry.count,
    resetTime: currentEntry.resetTime,
  };
}

/**
 * Check widget-specific rate limit (per widget ID)
 * ST-14: 100 requests per hour per widget
 */
export function checkWidgetGlobalRateLimit(widgetId: string): RateLimitResult {
  const now = Date.now();
  const key = `widget:${widgetId}`;
  const entry = widgetRateLimitStore.get(key);

  if (entry && now > entry.resetTime) {
    widgetRateLimitStore.delete(key);
  }

  const currentEntry = widgetRateLimitStore.get(key);

  if (!currentEntry) {
    const resetTime = now + WIDGET_GLOBAL_CONFIG.windowMs;
    widgetRateLimitStore.set(key, {
      count: 1,
      resetTime,
    });

    return {
      success: true,
      limit: WIDGET_GLOBAL_CONFIG.maxRequests,
      remaining: WIDGET_GLOBAL_CONFIG.maxRequests - 1,
      resetTime,
    };
  }

  if (now > currentEntry.resetTime) {
    const resetTime = now + WIDGET_GLOBAL_CONFIG.windowMs;
    widgetRateLimitStore.set(key, {
      count: 1,
      resetTime,
    });

    return {
      success: true,
      limit: WIDGET_GLOBAL_CONFIG.maxRequests,
      remaining: WIDGET_GLOBAL_CONFIG.maxRequests - 1,
      resetTime,
    };
  }

  if (currentEntry.count >= WIDGET_GLOBAL_CONFIG.maxRequests) {
    const retryAfter = Math.ceil((currentEntry.resetTime - now) / 1000);

    return {
      success: false,
      limit: WIDGET_GLOBAL_CONFIG.maxRequests,
      remaining: 0,
      resetTime: currentEntry.resetTime,
      retryAfter,
    };
  }

  currentEntry.count += 1;

  return {
    success: true,
    limit: WIDGET_GLOBAL_CONFIG.maxRequests,
    remaining: WIDGET_GLOBAL_CONFIG.maxRequests - currentEntry.count,
    resetTime: currentEntry.resetTime,
  };
}

/**
 * Generate unique ticket ID for feedback
 * ST-14: Format TF-XXXXXXXX (8 random alphanumeric chars)
 */
export function generateTicketId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TF-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export { MAX_REQUESTS, WINDOW_MS, WIDGET_IP_CONFIG, WIDGET_GLOBAL_CONFIG };
export type { RateLimitResult };
