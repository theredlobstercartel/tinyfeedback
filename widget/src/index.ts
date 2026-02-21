/**
 * TinyFeedback Widget - Main Entry Point
 * Story: ST-05 - Criar Widget Vanilla JS (<20KB)
 * 
 * Lightweight vanilla JS widget for collecting user feedback
 * Features: Floating button, NPS modal, Suggestion modal, Bug report modal
 */

import { NPSModal, NPSModalOptions } from './modals/NPSModal.js';
import { SuggestionModal, SuggestionModalOptions } from './modals/SuggestionModal.js';
import { BugModal, BugModalOptions } from './modals/BugModal.js';
import { FloatingButton, FloatingButtonOptions, WidgetPosition } from './components/FloatingButton.js';

// Re-export types
export { NPSModal, SuggestionModal, BugModal, FloatingButton };
export type { NPSModalOptions, SuggestionModalOptions, BugModalOptions, FloatingButtonOptions, WidgetPosition };

/**
 * Widget Configuration
 */
export interface WidgetConfig {
  projectId: string;
  apiKey: string;
  apiUrl?: string;
  position?: WidgetPosition;
  color?: string;
  text?: string;
  autoMount?: boolean;
}

/**
 * Widget appearance settings from API
 */
interface WidgetAppearance {
  widget_color: string;
  widget_position: WidgetPosition;
  widget_text: string;
}

/**
 * Project data from API
 */
interface ProjectData {
  id: string;
  allowed_domains: string[];
}

/**
 * Main TinyFeedback Widget Class
 * AC-01: Script embeddável
 * AC-02: Botão flutuante
 * AC-03: Abrir modal
 * AC-04: CORS configurado
 */
export class TinyFeedbackWidget {
  private config: Required<WidgetConfig>;
  private floatingButton: FloatingButton | null = null;
  private currentModal: NPSModal | SuggestionModal | BugModal | null = null;
  private appearance: WidgetAppearance | null = null;
  private isDomainValid = true;
  private initialized = false;

  constructor(config: WidgetConfig) {
    this.config = {
      apiUrl: '',
      position: 'bottom-right',
      color: '#00ff88',
      text: 'Feedback',
      autoMount: true,
      ...config
    };

    // Infer API URL from script src if not provided
    if (!this.config.apiUrl) {
      this.config.apiUrl = this.inferApiUrl();
    }

    // Validate config
    if (!this.config.projectId || !this.config.apiKey) {
      console.error('[TinyFeedback] projectId and apiKey are required');
      return;
    }

    // Auto-mount if enabled
    if (this.config.autoMount) {
      this.init();
    }
  }

  /**
   * Initialize the widget
   * AC-04: Validate domain before mounting
   */
  public async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Validate domain
      await this.validateDomain();
      
      if (!this.isDomainValid) {
        console.error('[TinyFeedback] Domain not authorized. Widget will not be displayed.');
        return;
      }

      // Fetch appearance settings
      await this.fetchAppearance();

      // Mount floating button
      this.mountButton();

      this.initialized = true;
    } catch (error) {
      console.error('[TinyFeedback] Failed to initialize widget:', error);
    }
  }

  /**
   * Validate domain against allowed domains
   * AC-04: CORS configurado - Domain validation
   */
  private async validateDomain(): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/api/projects/${this.config.projectId}/domains`,
        {
          method: 'GET',
          headers: {
            'X-API-Key': this.config.apiKey
          }
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          console.error('[TinyFeedback] Domain not authorized');
          this.isDomainValid = false;
          return;
        }
        // If we can't validate, assume valid (fail open for better UX)
        this.isDomainValid = true;
        return;
      }

      const data = await response.json() as { data: ProjectData };
      
      // If no allowed_domains configured, allow all
      if (!data.data?.allowed_domains || data.data.allowed_domains.length === 0) {
        this.isDomainValid = true;
        return;
      }

      // Check current domain
      const currentDomain = window.location.hostname;
      const isAllowed = data.data.allowed_domains.some((domain: string) => {
        return currentDomain === domain || currentDomain.endsWith(`.${domain}`);
      });

      if (!isAllowed) {
        console.error(`[TinyFeedback] Domain "${currentDomain}" not in allowed domains:`, data.data.allowed_domains);
        this.isDomainValid = false;
      }
    } catch (error) {
      // Fail open if validation fails
      console.warn('[TinyFeedback] Could not validate domain, allowing widget:', error);
      this.isDomainValid = true;
    }
  }

  /**
   * Fetch widget appearance settings
   */
  private async fetchAppearance(): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/api/projects/${this.config.projectId}/widget-appearance`,
        {
          method: 'GET',
          headers: {
            'X-API-Key': this.config.apiKey
          }
        }
      );

      if (response.ok) {
        const data = await response.json() as { data: WidgetAppearance };
        this.appearance = data.data;
        
        // Update config with API settings
        if (this.appearance) {
          this.config.color = this.appearance.widget_color || this.config.color;
          this.config.position = this.appearance.widget_position || this.config.position;
          this.config.text = this.appearance.widget_text || this.config.text;
        }
      }
    } catch (error) {
      // Use default settings if fetch fails
      console.warn('[TinyFeedback] Could not fetch appearance settings:', error);
    }
  }

  /**
   * Mount the floating button
   * AC-02: Botão flutuante com posição e cor configuráveis
   */
  private mountButton(): void {
    this.floatingButton = new FloatingButton({
      position: this.config.position,
      color: this.config.color,
      text: this.config.text
    });

    this.floatingButton.onSelect((type) => {
      this.openModal(type);
    });

    this.floatingButton.mount();
  }

  /**
   * Open a specific modal
   * AC-03: Abrir modal com 3 opções
   */
  public openModal(type: 'nps' | 'suggestion' | 'bug'): void {
    // Close any existing modal
    this.closeCurrentModal();

    const modalOptions = {
      projectId: this.config.projectId,
      apiKey: this.config.apiKey,
      apiUrl: this.config.apiUrl,
      onClose: () => {
        this.currentModal = null;
      }
    };

    switch (type) {
      case 'nps':
        this.currentModal = new NPSModal(modalOptions);
        this.currentModal.open();
        break;
      case 'suggestion':
        this.currentModal = new SuggestionModal(modalOptions);
        this.currentModal.open();
        break;
      case 'bug':
        this.currentModal = new BugModal(modalOptions);
        this.currentModal.open();
        break;
    }
  }

  /**
   * Legacy method - Open NPS modal directly
   */
  public openNPS(): void {
    this.openModal('nps');
  }

  /**
   * Legacy method - Open Suggestion modal directly
   */
  public openSuggestion(): void {
    this.openModal('suggestion');
  }

  /**
   * Open Bug report modal directly
   */
  public openBug(): void {
    this.openModal('bug');
  }

  /**
   * Close current modal
   */
  private closeCurrentModal(): void {
    this.currentModal?.close();
    this.currentModal = null;
  }

  /**
   * Close all modals and menu
   */
  public close(): void {
    this.closeCurrentModal();
  }

  /**
   * Destroy the widget
   */
  public destroy(): void {
    this.close();
    this.floatingButton?.unmount();
    this.floatingButton = null;
    this.initialized = false;
  }

  /**
   * Update widget configuration
   */
  public update(config: Partial<WidgetConfig>): void {
    this.config = { ...this.config, ...config };
    this.floatingButton?.update({
      position: this.config.position,
      color: this.config.color,
      text: this.config.text
    });
  }

  /**
   * Infer API URL from the script src
   */
  private inferApiUrl(): string {
    const scripts = document.querySelectorAll('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src.includes('tinyfeedback')) {
        const url = new URL(src);
        return `${url.protocol}//${url.host}`;
      }
    }
    return window.location.origin;
  }

  /**
   * Get widget version
   */
  public static get version(): string {
    return '0.2.0';
  }
}

// Global window interface
declare global {
  interface Window {
    TinyFeedback: typeof TinyFeedbackWidget;
    __TF_CONFIG__?: WidgetConfig;
    __TF_INIT__?: () => void;
  }
}

// Export for UMD build
export default TinyFeedbackWidget;

// Auto-initialize if config is present in window
if (typeof window !== 'undefined') {
  window.TinyFeedback = TinyFeedbackWidget;
  
  // Check for auto-initialize config
  if (window.__TF_CONFIG__?.projectId && window.__TF_CONFIG__?.apiKey) {
    const widget = new TinyFeedbackWidget(window.__TF_CONFIG__);
    
    // Expose init function for manual initialization
    window.__TF_INIT__ = () => widget.init();
  }
}
