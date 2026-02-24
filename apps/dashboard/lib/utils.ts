import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateAnonymousId(): string {
  return `anon_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`
}

export function getTechnicalContext() {
  if (typeof window === 'undefined') {
    return null
  }

  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    timestamp: new Date().toISOString(),
    referrer: document.referrer || undefined,
  }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim()
}
