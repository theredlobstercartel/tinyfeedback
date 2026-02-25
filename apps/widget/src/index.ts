/**
 * TinyFeedback Widget - Entry Point
 * ST-07: Widget - Temas e Customização
 */

import {
  init,
  destroy,
  open,
  close,
  updateConfig,
  TinyFeedbackWidget,
} from './widget'
import {
  WidgetConfig,
  WidgetTheme,
  WidgetPosition,
  WidgetColors,
  defaultConfig,
  defaultThemes,
  getMergedColors,
  generateCSSVariables,
} from './themes'

// Export types
export type {
  WidgetConfig,
  WidgetTheme,
  WidgetPosition,
  WidgetColors,
  TinyFeedbackWidget,
}

// Export theme utilities
export {
  defaultConfig,
  defaultThemes,
  getMergedColors,
  generateCSSVariables,
}

// Global TinyFeedback object
const TinyFeedback: TinyFeedbackWidget & {
  version: string
  themes: typeof defaultThemes
} = {
  version: '1.0.0',
  init,
  destroy,
  open,
  close,
  updateConfig,
  themes: defaultThemes,
}

// Expose to global scope
if (typeof window !== 'undefined') {
  ;(window as unknown as { TinyFeedback: typeof TinyFeedback }).TinyFeedback = TinyFeedback
}

// Default export
export default TinyFeedback
