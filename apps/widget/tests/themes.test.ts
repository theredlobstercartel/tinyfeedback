/**
 * Widget Theme Tests
 * ST-12: UX Polish - WCAG 2.1 AA Compliant Colors
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  WidgetConfig,
  WidgetTheme,
  WidgetPosition,
  defaultConfig,
  defaultThemes,
  getMergedColors,
  generateCSSVariables,
  cyberNeonTheme,
  minimalTheme,
  darkTheme,
  checkWCAGCompliance,
  getContrastRatio,
} from '../src/themes'

describe('Widget Themes', () => {
  describe('Theme Colors - WCAG AA Compliant', () => {
    it('cyber-neon theme has correct WCAG AA compliant colors', () => {
      // Updated colors for better contrast
      expect(cyberNeonTheme.primary).toBe('#00e5ff')
      expect(cyberNeonTheme.secondary).toBe('#ff4ecd')
      expect(cyberNeonTheme.background).toBe('#0a0a0a')
      expect(cyberNeonTheme.text).toBe('#ffffff')
      expect(cyberNeonTheme.textMuted).toBe('#b0b0b0')
    })

    it('minimal theme has correct WCAG AA compliant colors', () => {
      // Updated colors for better contrast
      expect(minimalTheme.primary).toBe('#0052cc')
      expect(minimalTheme.background).toBe('#ffffff')
      expect(minimalTheme.text).toBe('#1a1a1a')
      expect(minimalTheme.textMuted).toBe('#595959')
    })

    it('dark theme has correct WCAG AA compliant colors', () => {
      // Updated colors for better contrast
      expect(darkTheme.primary).toBe('#66b3ff')
      expect(darkTheme.background).toBe('#0f172a')
      expect(darkTheme.text).toBe('#f8fafc')
      expect(darkTheme.textMuted).toBe('#94a3b8')
    })

    it('all themes pass WCAG 2.1 AA compliance', () => {
      const themes = [cyberNeonTheme, minimalTheme, darkTheme]
      themes.forEach(theme => {
        const result = checkWCAGCompliance(theme)
        expect(result.passed).toBe(true)
      })
    })
  })

  describe('getMergedColors', () => {
    it('returns default theme colors when no custom colors provided', () => {
      const colors = getMergedColors('cyber-neon')
      expect(colors.primary).toBe('#00e5ff')
      expect(colors.background).toBe('#0a0a0a')
    })

    it('merges custom colors with theme defaults', () => {
      const customColors = { primary: '#ff0000' }
      const colors = getMergedColors('cyber-neon', customColors)
      expect(colors.primary).toBe('#ff0000')
      expect(colors.background).toBe('#0a0a0a') // Still from theme
    })

    it('works with all theme types', () => {
      const themes: WidgetTheme[] = ['cyber-neon', 'minimal', 'dark']
      themes.forEach(theme => {
        const colors = getMergedColors(theme)
        expect(colors.primary).toBeDefined()
        expect(colors.background).toBeDefined()
        expect(colors.text).toBeDefined()
      })
    })
  })

  describe('generateCSSVariables', () => {
    it('generates correct CSS variable names', () => {
      const colors = cyberNeonTheme
      const vars = generateCSSVariables(colors)
      
      expect(vars['--tf-primary']).toBe('#00e5ff')
      expect(vars['--tf-secondary']).toBe('#ff4ecd')
      expect(vars['--tf-background']).toBe('#0a0a0a')
      expect(vars['--tf-text']).toBe('#ffffff')
    })

    it('uses primary as fallback for secondary', () => {
      const colors = { ...minimalTheme, secondary: undefined }
      const vars = generateCSSVariables(colors as WidgetColors)
      expect(vars['--tf-secondary']).toBe(minimalTheme.primary)
    })
  })

  describe('defaultConfig', () => {
    it('has correct default values', () => {
      expect(defaultConfig.theme).toBe('cyber-neon')
      expect(defaultConfig.position).toBe('bottom-right')
      expect(defaultConfig.labels.nps).toBe('Como você avalia nosso produto?')
      expect(defaultConfig.labels.submit).toBe('Enviar')
    })

    it('has default categories', () => {
      expect(defaultConfig.categories).toContain('Feature')
      expect(defaultConfig.categories).toContain('Improvement')
      expect(defaultConfig.categories).toContain('Other')
    })
  })

  describe('WCAG Contrast Utilities', () => {
    it('calculates contrast ratio correctly', () => {
      // White on black = 21:1
      expect(getContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0)
      // Black on white = 21:1
      expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    })

    it('checkWCAGCompliance returns detailed results', () => {
      const result = checkWCAGCompliance(cyberNeonTheme)
      
      expect(result.passed).toBe(true)
      expect(result.checks['text-on-background']).toBeDefined()
      expect(result.checks['text-on-background'].ratio).toBeGreaterThanOrEqual(4.5)
      expect(result.checks['text-on-background'].passed).toBe(true)
    })
  })
})
