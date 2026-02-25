/**
 * Widget Themes Configuration
 * ST-12: UX Polish - WCAG 2.1 AA Color Contrast Compliance
 */

export type WidgetTheme = 'cyber-neon' | 'minimal' | 'dark'
export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

export interface WidgetColors {
  primary: string
  secondary?: string
  background: string
  surface: string
  text: string
  textMuted: string
  border: string
  success: string
  error: string
  warning: string
}

export interface WidgetConfig {
  theme: WidgetTheme
  position: WidgetPosition
  colors: Partial<WidgetColors>
  labels: {
    nps: string
    suggestion: string
    bug: string
    submit: string
    cancel: string
    close: string
  }
  categories: string[]
}

// Tema Cyber-Neon (padrão) - WCAG AA Compliant
// Primary #00e5ff (cyan) on #0a0a0a = 11.8:1 ✓
// Text #ffffff on #0a0a0a = 19.5:1 ✓
// TextMuted #b0b0b0 on #0a0a0a = 9.3:1 ✓
export const cyberNeonTheme: WidgetColors = {
  primary: '#00e5ff',      // Cyan ajustado para melhor contraste
  secondary: '#ff4ecd',    // Magenta ajustado para melhor contraste
  background: '#0a0a0a',   // Dark background
  surface: '#141414',      // Slightly lighter
  text: '#ffffff',         // White
  textMuted: '#b0b0b0',    // Light gray (9.3:1 contrast)
  border: '#00e5ff33',     // Cyan with opacity
  success: '#00d084',      // Green ajustado
  error: '#ff5252',        // Red ajustado
  warning: '#ffb347',      // Orange ajustado
}

// Tema Minimal/Clean - WCAG AA Compliant
// Primary #0052cc on white = 6.1:1 ✓
// Text #1a1a1a on white = 16.1:1 ✓
// TextMuted #595959 on white = 7:1 ✓
// Success #006600 on white = 7:1 ✓
// Error #cc0000 on white = 5.7:1 ✓
export const minimalTheme: WidgetColors = {
  primary: '#0052cc',      // Blue escuro para contraste (6.1:1)
  secondary: '#403294',    // Indigo escuro
  background: '#ffffff',
  surface: '#f5f5f5',      // Light gray
  text: '#1a1a1a',         // Near black
  textMuted: '#595959',    // Dark gray (7:1 contrast)
  border: '#d0d0d0',
  success: '#006600',      // Green escuro (7:1)
  error: '#cc0000',        // Red escuro (5.7:1)
  warning: '#b35900',      // Orange escuro (5.1:1)
}

// Tema Dark Mode - WCAG AA Compliant
// Primary #66b3ff on #0f172a = 7.2:1 ✓
// Text #f8fafc on #0f172a = 15.8:1 ✓
// TextMuted #94a3b8 on #0f172a = 6.1:1 ✓
export const darkTheme: WidgetColors = {
  primary: '#66b3ff',      // Light blue mais claro
  secondary: '#a5b4fc',    // Light indigo
  background: '#0f172a',   // Slate 900
  surface: '#1e293b',      // Slate 800
  text: '#f8fafc',         // Very light
  textMuted: '#94a3b8',    // Slate 400 (6.1:1 contrast)
  border: '#475569',
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
}

export const defaultThemes: Record<WidgetTheme, WidgetColors> = {
  'cyber-neon': cyberNeonTheme,
  'minimal': minimalTheme,
  'dark': darkTheme,
}

export const defaultConfig: WidgetConfig = {
  theme: 'cyber-neon',
  position: 'bottom-right',
  colors: {},
  labels: {
    nps: 'Como você avalia nosso produto?',
    suggestion: 'Sugestão',
    bug: 'Reportar um problema',
    submit: 'Enviar',
    cancel: 'Cancelar',
    close: 'Fechar',
  },
  categories: ['Feature', 'Improvement', 'Other'],
}

// Merge custom colors with theme defaults
export function getMergedColors(theme: WidgetTheme, customColors: Partial<WidgetColors> = {}): WidgetColors {
  return {
    ...defaultThemes[theme],
    ...customColors,
  }
}

// Generate CSS variables from colors
export function generateCSSVariables(colors: WidgetColors): Record<string, string> {
  return {
    '--tf-primary': colors.primary,
    '--tf-secondary': colors.secondary || colors.primary,
    '--tf-background': colors.background,
    '--tf-surface': colors.surface,
    '--tf-text': colors.text,
    '--tf-text-muted': colors.textMuted,
    '--tf-border': colors.border,
    '--tf-success': colors.success,
    '--tf-error': colors.error,
    '--tf-warning': colors.warning,
  }
}

/**
 * WCAG 2.1 AA Contrast Checker
 * Returns contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Handle hex with or without #
  const cleanHex = hex.replace('#', '')
  
  // Handle 3-digit hex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16)
    const g = parseInt(cleanHex[1] + cleanHex[1], 16)
    const b = parseInt(cleanHex[2] + cleanHex[2], 16)
    return { r, g, b }
  }
  
  // Handle 6-digit hex
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)
    return { r, g, b }
  }
  
  return null
}

/**
 * Check if a theme meets WCAG 2.1 AA standards
 * - Normal text: 4.5:1 minimum
 * - Large text: 3:1 minimum
 * - UI components: 3:1 minimum
 */
export function checkWCAGCompliance(theme: WidgetColors): {
  passed: boolean
  checks: Record<string, { ratio: number; passed: boolean; required: number }>
} {
  const checks = {
    'text-on-background': {
      ratio: getContrastRatio(theme.text, theme.background),
      passed: getContrastRatio(theme.text, theme.background) >= 4.5,
      required: 4.5,
    },
    'textMuted-on-background': {
      ratio: getContrastRatio(theme.textMuted, theme.background),
      passed: getContrastRatio(theme.textMuted, theme.background) >= 4.5,
      required: 4.5,
    },
    'primary-on-background': {
      ratio: getContrastRatio(theme.primary, theme.background),
      passed: getContrastRatio(theme.primary, theme.background) >= 3,
      required: 3,
    },
    'text-on-surface': {
      ratio: getContrastRatio(theme.text, theme.surface),
      passed: getContrastRatio(theme.text, theme.surface) >= 4.5,
      required: 4.5,
    },
    'success-on-background': {
      ratio: getContrastRatio(theme.success, theme.background),
      passed: getContrastRatio(theme.success, theme.background) >= 4.5,
      required: 4.5,
    },
    'error-on-background': {
      ratio: getContrastRatio(theme.error, theme.background),
      passed: getContrastRatio(theme.error, theme.background) >= 4.5,
      required: 4.5,
    },
  }

  return {
    passed: Object.values(checks).every(check => check.passed),
    checks,
  }
}
