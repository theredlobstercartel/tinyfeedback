/**
 * Widget Accessibility Tests
 * ST-12: UX Polish - Animações e Acessibilidade
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  getContrastRatio, 
  checkWCAGCompliance, 
  cyberNeonTheme, 
  minimalTheme, 
  darkTheme,
  defaultThemes 
} from '../src/themes'

describe('Accessibility - WCAG 2.1 AA Compliance', () => {
  describe('Color Contrast Ratios', () => {
    it('should calculate contrast ratio correctly', () => {
      // White on black = 21:1
      expect(getContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0)
      // Black on white = 21:1
      expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
      // Same color = 1:1
      expect(getContrastRatio('#ffffff', '#ffffff')).toBe(1)
    })

    describe('Cyber-Neon Theme', () => {
      const result = checkWCAGCompliance(cyberNeonTheme)
      
      it('meets WCAG 2.1 AA standards', () => {
        expect(result.passed).toBe(true)
      })

      it('has sufficient text contrast on background', () => {
        expect(result.checks['text-on-background'].ratio).toBeGreaterThanOrEqual(4.5)
        expect(result.checks['text-on-background'].passed).toBe(true)
      })

      it('has sufficient text-muted contrast on background', () => {
        expect(result.checks['textMuted-on-background'].ratio).toBeGreaterThanOrEqual(4.5)
        expect(result.checks['textMuted-on-background'].passed).toBe(true)
      })

      it('has sufficient primary color contrast on background', () => {
        expect(result.checks['primary-on-background'].ratio).toBeGreaterThanOrEqual(3)
        expect(result.checks['primary-on-background'].passed).toBe(true)
      })
    })

    describe('Minimal Theme', () => {
      const result = checkWCAGCompliance(minimalTheme)
      
      it('meets WCAG 2.1 AA standards', () => {
        expect(result.passed).toBe(true)
      })

      it('has sufficient text contrast on background', () => {
        expect(result.checks['text-on-background'].ratio).toBeGreaterThanOrEqual(4.5)
      })
    })

    describe('Dark Theme', () => {
      const result = checkWCAGCompliance(darkTheme)
      
      it('meets WCAG 2.1 AA standards', () => {
        expect(result.passed).toBe(true)
      })

      it('has sufficient text contrast on background', () => {
        expect(result.checks['text-on-background'].ratio).toBeGreaterThanOrEqual(4.5)
      })
    })
  })

  describe('All Themes Compliance', () => {
    const themes = Object.keys(defaultThemes) as Array<keyof typeof defaultThemes>
    
    themes.forEach(themeName => {
      it(`${themeName} theme passes all WCAG checks`, () => {
        const theme = defaultThemes[themeName]
        const result = checkWCAGCompliance(theme)
        
        expect(result.passed).toBe(true)
        
        // Log all checks for debugging
        Object.entries(result.checks).forEach(([name, check]) => {
          if (!check.passed) {
            console.warn(`${themeName} - ${name}: ${check.ratio.toFixed(2)}:1 (required ${check.required}:1)`)
          }
        })
      })
    })
  })
})
