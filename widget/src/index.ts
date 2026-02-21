/**
 * TinyFeedback Widget
 * Main entry point for the vanilla JS widget
 */

import { NPSModal, NPSModalOptions } from './modals/NPSModal.js';
import { SuggestionModal, SuggestionModalOptions } from './modals/SuggestionModal.js';

interface WidgetConfig {
  projectId: string;
  apiKey: string;
  apiUrl?: string;
}

class TinyFeedbackWidget {
  private config: Required<WidgetConfig>;
  private npsModal: NPSModal | null = null;
  private suggestionModal: SuggestionModal | null = null;

  constructor(config: WidgetConfig) {
    this.config = {
      apiUrl: '', // Will use current domain
      ...config
    };
    
    // If no apiUrl provided, infer from script src
    if (!this.config.apiUrl) {
      this.config.apiUrl = this.inferApiUrl();
    }
  }

  /**
   * Open the NPS feedback modal
   */
  public openNPS(): void {
    if (this.npsModal) {
      this.npsModal.close();
    }
    
    this.npsModal = new NPSModal({
      projectId: this.config.projectId,
      apiKey: this.config.apiKey,
      apiUrl: this.config.apiUrl,
      onClose: () => {
        this.npsModal = null;
      }
    });
    
    this.npsModal.open();
  }

  /**
   * Open the Suggestion modal
   * ST-07: Implementar Modal de Sugestão
   */
  public openSuggestion(): void {
    if (this.suggestionModal) {
      this.suggestionModal.close();
    }
    
    this.suggestionModal = new SuggestionModal({
      projectId: this.config.projectId,
      apiKey: this.config.apiKey,
      apiUrl: this.config.apiUrl,
      onClose: () => {
        this.suggestionModal = null;
      }
    });
    
    this.suggestionModal.open();
  }

  /**
   * Close any open modals
   */
  public close(): void {
    this.npsModal?.close();
    this.npsModal = null;
    this.suggestionModal?.close();
    this.suggestionModal = null;
  }

  /**
   * Infer API URL from the script src
   */
  private inferApiUrl(): string {
    const scripts = document.querySelectorAll('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src.includes('tinyfeedback')) {
        // Extract base URL from script src
        const url = new URL(src);
        return `${url.protocol}//${url.host}`;
      }
    }
    return '';
  }
}

// Export for UMD build
export { TinyFeedbackWidget, NPSModal, SuggestionModal };
export type { NPSModalOptions, SuggestionModalOptions };
export type { WidgetConfig };

// Global window interface
declare global {
  interface Window {
    TinyFeedback: typeof TinyFeedbackWidget;
  }
}

// Auto-initialize if config is present in window
if (typeof window !== 'undefined') {
  window.TinyFeedback = TinyFeedbackWidget;
  
  // Check for auto-initialize config
  const tfConfig = (window as unknown as Record<string, unknown>).__TF_CONFIG__ as WidgetConfig | undefined;
  if (tfConfig?.projectId && tfConfig?.apiKey) {
    const widget = new TinyFeedbackWidget(tfConfig);
    
    // Auto-open NPS if triggered
    if ((window as unknown as Record<string, unknown>).__TF_OPEN_NPS__) {
      widget.openNPS();
    }
    
    // Auto-open Suggestion if triggered
    if ((window as unknown as Record<string, unknown>).__TF_OPEN_SUGGESTION__) {
      widget.openSuggestion();
    }
  }
}
