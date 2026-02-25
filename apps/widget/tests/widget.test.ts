/**
 * Widget Core Tests
 * ST-12: UX Polish - Animações e Acessibilidade
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock DOM APIs
const mockShadowRoot = {
  innerHTML: '',
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  getElementById: vi.fn(),
  adoptedStyleSheets: [],
  activeElement: null,
}

const mockContainer = {
  attachShadow: vi.fn(() => mockShadowRoot),
  parentNode: {
    removeChild: vi.fn(),
  },
  setAttribute: vi.fn(),
  id: 'tinyfeedback-widget',
}

describe('TinyFeedback Widget', () => {
  beforeEach(() => {
    // Reset DOM mocks
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({ ...mockContainer })),
      body: {
        appendChild: vi.fn(),
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      readyState: 'complete',
      currentScript: null,
      activeElement: null,
    })
    
    vi.stubGlobal('window', {
      TinyFeedback: undefined,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Initialization', () => {
    it('should expose TinyFeedback to global scope', async () => {
      const index = await import('../src/index')
      
      expect(index.default).toBeDefined()
      expect(index.default.version).toBe('1.0.0')
      expect(typeof index.default.init).toBe('function')
      expect(typeof index.default.open).toBe('function')
      expect(typeof index.default.close).toBe('function')
      expect(typeof index.default.destroy).toBe('function')
      expect(typeof index.default.updateConfig).toBe('function')
    })

    it('should have themes exposed', async () => {
      const index = await import('../src/index')
      
      expect(index.default.themes).toBeDefined()
      expect(index.default.themes['cyber-neon']).toBeDefined()
      expect(index.default.themes['minimal']).toBeDefined()
      expect(index.default.themes['dark']).toBeDefined()
    })
  })

  describe('Theme Configuration', () => {
    it('should accept theme in config', async () => {
      const { defaultConfig } = await import('../src/themes')
      expect(defaultConfig.theme).toBe('cyber-neon')
    })

    it('should accept position in config', async () => {
      const { defaultConfig } = await import('../src/themes')
      expect(defaultConfig.position).toBe('bottom-right')
    })

    it('should accept custom labels', async () => {
      const { defaultConfig } = await import('../src/themes')
      expect(defaultConfig.labels.nps).toBeDefined()
      expect(defaultConfig.labels.suggestion).toBeDefined()
      expect(defaultConfig.labels.bug).toBeDefined()
    })

    it('should accept custom colors', async () => {
      const { getMergedColors } = await import('../src/themes')
      
      const customColors = { primary: '#ff0000' }
      const colors = getMergedColors('minimal', customColors)
      
      expect(colors.primary).toBe('#ff0000')
    })
  })

  describe('CSS Variables Generation', () => {
    it('should generate all required CSS variables', async () => {
      const { generateCSSVariables, cyberNeonTheme } = await import('../src/themes')
      
      const vars = generateCSSVariables(cyberNeonTheme)
      
      expect(vars['--tf-primary']).toBeDefined()
      expect(vars['--tf-secondary']).toBeDefined()
      expect(vars['--tf-background']).toBeDefined()
      expect(vars['--tf-surface']).toBeDefined()
      expect(vars['--tf-text']).toBeDefined()
      expect(vars['--tf-text-muted']).toBeDefined()
      expect(vars['--tf-border']).toBeDefined()
      expect(vars['--tf-success']).toBeDefined()
      expect(vars['--tf-error']).toBeDefined()
      expect(vars['--tf-warning']).toBeDefined()
    })
  })

  describe('Accessibility Features', () => {
    it('should export WCAG compliance checker', async () => {
      const { checkWCAGCompliance } = await import('../src/themes')
      expect(typeof checkWCAGCompliance).toBe('function')
    })

    it('should export contrast ratio calculator', async () => {
      const { getContrastRatio } = await import('../src/themes')
      expect(typeof getContrastRatio).toBe('function')
    })
  })
})
