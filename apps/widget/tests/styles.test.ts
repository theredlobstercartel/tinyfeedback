/**
 * Widget Styles Tests
 * ST-12: UX Polish - Animações e Acessibilidade
 */

import { describe, it, expect } from 'vitest'
import { getWidgetBaseStyles } from '../src/styles'
import { cyberNeonTheme, minimalTheme, WidgetPosition } from '../src/themes'

describe('Widget Styles', () => {
  describe('getWidgetBaseStyles', () => {
    it('generates styles for cyber-neon theme', () => {
      const styles = getWidgetBaseStyles(cyberNeonTheme, 'bottom-right')
      
      expect(styles).toContain('--tf-primary: #00e5ff')
      expect(styles).toContain('--tf-secondary: #ff4ecd')
      expect(styles).toContain('.tf-widget-container')
      expect(styles).toContain('.tf-trigger-button')
    })

    it('generates styles for minimal theme', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain('--tf-primary: #0052cc')
      expect(styles).toContain('--tf-background: #ffffff')
    })

    it('includes position styles for all positions', () => {
      const positions: WidgetPosition[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left']
      
      positions.forEach(position => {
        const styles = getWidgetBaseStyles(minimalTheme, position)
        
        switch (position) {
          case 'bottom-right':
            expect(styles).toContain('bottom: 20px; right: 20px;')
            break
          case 'bottom-left':
            expect(styles).toContain('bottom: 20px; left: 20px;')
            break
          case 'top-right':
            expect(styles).toContain('top: 20px; right: 20px;')
            break
          case 'top-left':
            expect(styles).toContain('top: 20px; left: 20px;')
            break
        }
      })
    })

    it('includes cyber-neon specific glow styles', () => {
      const styles = getWidgetBaseStyles(cyberNeonTheme, 'bottom-right')
      
      expect(styles).toContain('.tf-theme-cyber-neon .tf-trigger-button')
      expect(styles).toContain('box-shadow: 0 0 10px var(--tf-primary)')
    })

    it('includes modal styles', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain('.tf-modal-overlay')
      expect(styles).toContain('.tf-modal')
      expect(styles).toContain('.tf-modal-header')
      expect(styles).toContain('.tf-tabs')
    })

    it('includes form element styles', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain('.tf-input')
      expect(styles).toContain('.tf-textarea')
      expect(styles).toContain('.tf-button')
      expect(styles).toContain('.tf-nps-scale')
    })

    it('includes NPS scale styles', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain('.tf-nps-scale')
      expect(styles).toContain('.tf-nps-button')
      expect(styles).toContain('.tf-nps-labels')
    })

    it('includes responsive styles', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain('@media (max-width: 480px)')
    })

    it('includes animation keyframes', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain('@keyframes tf-spin')
      expect(styles).toContain('@keyframes tf-trigger-entrance')
      expect(styles).toContain('@keyframes tf-nps-entrance')
      expect(styles).toContain('@keyframes tf-content-fade')
    })

    // New accessibility tests
    it('includes reduced motion media query', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
      expect(styles).toContain('animation-duration: 0.01ms')
      expect(styles).toContain('transition-duration: 0.01ms')
    })

    it('includes high contrast mode support', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain('@media (prefers-contrast: high)')
    })

    it('includes screen reader only utility', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain('.tf-sr-only')
      expect(styles).toContain('position: absolute')
      expect(styles).toContain('width: 1px')
      expect(styles).toContain('height: 1px')
    })

    it('includes skip link styles', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain('.tf-skip-link')
      expect(styles).toContain('top: -40px')
    })

    it('includes focus visible styles', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain(':focus-visible')
      expect(styles).toContain('--tf-focus-ring')
    })

    it('includes focus ring variables', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain('--tf-focus-ring')
      expect(styles).toContain('--tf-focus-ring-offset')
    })

    it('includes smooth transition timing functions', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain('--tf-transition-fast')
      expect(styles).toContain('--tf-transition-base')
      expect(styles).toContain('--tf-transition-slow')
      expect(styles).toContain('cubic-bezier(0.4, 0, 0.2, 1)')
    })

    it('includes entrance animations', () => {
      const styles = getWidgetBaseStyles(minimalTheme, 'bottom-right')
      
      expect(styles).toContain('@keyframes tf-trigger-entrance')
      expect(styles).toContain('@keyframes tf-slide-down')
      expect(styles).toContain('@keyframes tf-slide-up')
      expect(styles).toContain('@keyframes tf-message-entrance')
    })

    it('includes cyber-neon pulse animation', () => {
      const styles = getWidgetBaseStyles(cyberNeonTheme, 'bottom-right')
      
      expect(styles).toContain('@keyframes tf-neon-pulse')
      expect(styles).toContain('animation: tf-trigger-entrance')
    })
  })
})
