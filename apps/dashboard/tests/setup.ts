import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock window.location and navigator
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com/page',
    pathname: '/page',
  },
  writable: true,
})

Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test)',
  },
})

Object.defineProperty(window, 'innerWidth', {
  value: 1024,
  writable: true,
})

Object.defineProperty(window, 'innerHeight', {
  value: 768,
  writable: true,
})

// Mock document.referrer
Object.defineProperty(document, 'referrer', {
  value: 'https://google.com',
})

// Clean up after each test
import { cleanup } from '@testing-library/react'
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
