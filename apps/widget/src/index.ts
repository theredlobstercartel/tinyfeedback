/**
 * TinyFeedback Widget - Entry Point
 * ST-07: Widget - Temas e Customização
 * ST-13: Formulário de Sugestões e Bugs
 */

import {
  init,
  destroy,
  open,
  close,
  updateConfig,
  openFormMode,
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

// ST-13: Export form functionality
import {
  FeedbackFormWidget,
  FeedbackFormWidgetConfig,
  initFeedbackForm,
} from './feedback-form-widget'

import {
  FormStep,
  FeedbackType,
  FeedbackFormData,
  FeedbackMetadata,
  SubmitFeedbackResult,
  // Validation
  validateTypeStep,
  validateDetailsStep,
  validateUploadStep,
  validateStep,
  canProceed,
  // Utilities
  sanitizeFeedbackData,
  generateTicketId,
  collectMetadata,
  checkRateLimit,
  submitFeedback,
} from './form'

// Export types
export type {
  WidgetConfig,
  WidgetTheme,
  WidgetPosition,
  WidgetColors,
  TinyFeedbackWidget,
  // ST-13: Form types
  FeedbackFormWidgetConfig,
  FormStep,
  FeedbackType,
  FeedbackFormData,
  FeedbackMetadata,
  SubmitFeedbackResult,
}

// Export theme utilities
export {
  defaultConfig,
  defaultThemes,
  getMergedColors,
  generateCSSVariables,
  // ST-13: Form utilities
  FeedbackFormWidget,
  initFeedbackForm,
  // Validation functions
  validateTypeStep,
  validateDetailsStep,
  validateUploadStep,
  validateStep,
  canProceed,
  // Utilities
  sanitizeFeedbackData,
  generateTicketId,
  collectMetadata,
  checkRateLimit,
  submitFeedback,
}

// Global TinyFeedback object
const TinyFeedback: TinyFeedbackWidget & {
  version: string
  themes: typeof defaultThemes
  // ST-13: Add form mode
  form: typeof initFeedbackForm
  openFormMode: typeof openFormMode
} = {
  version: '1.0.0',
  init,
  destroy,
  open,
  close,
  updateConfig,
  themes: defaultThemes,
  form: initFeedbackForm,
  openFormMode,
}

// Expose to global scope
if (typeof window !== 'undefined') {
  ;(window as unknown as { TinyFeedback: typeof TinyFeedback }).TinyFeedback = TinyFeedback
}

// Default export
export default TinyFeedback
