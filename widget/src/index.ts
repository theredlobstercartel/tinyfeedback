/**
 * TinyFeedback Widget
 * Main entry point for the vanilla JS widget
 * ST-05: Criar Widget Vanilla JS (<20KB)
 */

import { NPSModal, NPSModalOptions } from './modals/NPSModal.js';
import { SuggestionModal, SuggestionModalOptions } from './modals/SuggestionModal.js';
import { BugModal, BugModalOptions } from './modals/BugModal.js';

interface WidgetConfig {
  projectId: string;
  apiKey: string;
  apiUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  buttonText?: string;
}

interface WidgetAppearance {
  primary_color: string;
  button_text: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

class TinyFeedbackWidget {
  private config: Required<WidgetConfig>;
  private npsModal: NPSModal | null = null;
  private suggestionModal: SuggestionModal | null = null;
  private bugModal: BugModal | null = null;
  private floatingButton: HTMLElement | null = null;
  private menuContainer: HTMLElement | null = null;
  private isMenuOpen: boolean = false;

  constructor(config: WidgetConfig) {
    this.config = {
      apiUrl: '',
      position: 'bottom-right',
      primaryColor: '#3b82f6',
      buttonText: 'Feedback',
      ...config
    };
    
    // If no apiUrl provided, infer from script src
    if (!this.config.apiUrl) {
      this.config.apiUrl = this.inferApiUrl();
    }
  }

  /**
   * Initialize the widget with floating button
   */
  public init(): void {
    this.validateDomain().then((isValid) => {
      if (isValid) {
        this.fetchAppearance().then((appearance) => {
          if (appearance) {
            this.config.primaryColor = appearance.primary_color;
            this.config.buttonText = appearance.button_text;
            this.config.position = appearance.position;
          }
          this.createFloatingButton();
        });
      } else {
        console.error('[TinyFeedback] Domain not authorized. Widget will not load.');
      }
    });
  }

  /**
   * Validate domain against API
   */
  private async validateDomain(): Promise<boolean> {
    try {
      const origin = window.location.origin;
      const response = await fetch(`${this.config.apiUrl}/api/widget/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey
        },
        body: JSON.stringify({
          projectId: this.config.projectId,
          domain: origin
        })
      });
      return response.ok;
    } catch (error) {
      // If validation fails, still allow (fail open for development)
      console.warn('[TinyFeedback] Domain validation failed:', error);
      return true;
    }
  }

  /**
   * Fetch widget appearance from API
   */
  private async fetchAppearance(): Promise<WidgetAppearance | null> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/projects/${this.config.projectId}/widget-appearance`, {
        headers: {
          'X-API-Key': this.config.apiKey
        }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('[TinyFeedback] Failed to fetch appearance:', error);
    }
    return null;
  }

  /**
   * Create the floating button
   */
  private createFloatingButton(): void {
    const button = document.createElement('button');
    button.id = 'tinyfeedback-button';
    button.innerHTML = this.config.buttonText;
    button.style.cssText = this.getButtonStyles();
    
    button.addEventListener('click', () => this.toggleMenu());
    
    document.body.appendChild(button);
    this.floatingButton = button;
  }

  /**
   * Get button styles based on position
   */
  private getButtonStyles(): string {
    const baseStyles = `
      position: fixed;
      ${this.getPositionStyles()}
      padding: 12px 20px;
      background: ${this.config.primaryColor};
      color: white;
      border: none;
      border-radius: 9999px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 2147483646;
      transition: transform 0.2s, box-shadow 0.2s;
    `;
    return baseStyles;
  }

  /**
   * Get position-specific styles
   */
  private getPositionStyles(): string {
    const positions: Record<string, string> = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;'
    };
    return positions[this.config.position] || positions['bottom-right'];
  }

  /**
   * Toggle the feedback menu
   */
  private toggleMenu(): void {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /**
   * Open the feedback menu
   */
  private openMenu(): void {
    if (!this.floatingButton) return;
    
    const menu = document.createElement('div');
    menu.id = 'tinyfeedback-menu';
    menu.style.cssText = this.getMenuStyles();
    
    menu.innerHTML = `
      <div style="padding: 8px;">
        <button class="tf-menu-item" data-type="nps" style="${this.getMenuItemStyles()}">
          <span style="font-size: 18px; margin-right: 8px;">📊</span>
          <span>Avaliação (NPS)</span>
        </button>
        <button class="tf-menu-item" data-type="suggestion" style="${this.getMenuItemStyles()}">
          <span style="font-size: 18px; margin-right: 8px;">💡</span>
          <span>Sugestão</span>
        </button>
        <button class="tf-menu-item" data-type="bug" style="${this.getMenuItemStyles()}">
          <span style="font-size: 18px; margin-right: 8px;">🐛</span>
          <span>Reportar Bug</span>
        </button>
      </div>
    `;
    
    document.body.appendChild(menu);
    this.menuContainer = menu;
    this.isMenuOpen = true;
    
    // Attach click handlers
    menu.querySelectorAll('.tf-menu-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).getAttribute('data-type');
        this.handleMenuSelection(type as 'nps' | 'suggestion' | 'bug');
      });
    });
    
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 0);
  }

  /**
   * Close the feedback menu
   */
  private closeMenu(): void {
    if (this.menuContainer) {
      this.menuContainer.remove();
      this.menuContainer = null;
    }
    this.isMenuOpen = false;
    document.removeEventListener('click', this.handleOutsideClick);
  }

  /**
   * Handle outside click to close menu
   */
  private handleOutsideClick = (e: MouseEvent): void => {
    if (this.menuContainer && !this.menuContainer.contains(e.target as Node)) {
      if (this.floatingButton && !this.floatingButton.contains(e.target as Node)) {
        this.closeMenu();
      }
    }
  };

  /**
   * Handle menu selection
   */
  private handleMenuSelection(type: 'nps' | 'suggestion' | 'bug'): void {
    this.closeMenu();
    switch (type) {
      case 'nps':
        this.openNPS();
        break;
      case 'suggestion':
        this.openSuggestion();
        break;
      case 'bug':
        this.openBug();
        break;
    }
  }

  /**
   * Get menu styles
   */
  private getMenuStyles(): string {
    const positionStyles = this.getMenuPositionStyles();
    return `
      position: fixed;
      ${positionStyles}
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 2147483647;
      min-width: 200px;
      animation: tf-menu-appear 0.2s ease-out;
    `;
  }

  /**
   * Get menu position styles
   */
  private getMenuPositionStyles(): string {
    const positions: Record<string, string> = {
      'bottom-right': 'bottom: 80px; right: 20px;',
      'bottom-left': 'bottom: 80px; left: 20px;',
      'top-right': 'top: 80px; right: 20px;',
      'top-left': 'top: 80px; left: 20px;'
    };
    return positions[this.config.position] || positions['bottom-right'];
  }

  /**
   * Get menu item styles
   */
  private getMenuItemStyles(): string {
    return `
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px 16px;
      background: none;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      font-size: 14px;
      color: #374151;
      transition: background 0.15s;
      text-align: left;
    `;
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
   * Open the Bug Report modal
   */
  public openBug(): void {
    if (this.bugModal) {
      this.bugModal.close();
    }
    
    this.bugModal = new BugModal({
      projectId: this.config.projectId,
      apiKey: this.config.apiKey,
      apiUrl: this.config.apiUrl,
      onClose: () => {
        this.bugModal = null;
      }
    });
    
    this.bugModal.open();
  }

  /**
   * Close any open modals
   */
  public close(): void {
    this.npsModal?.close();
    this.npsModal = null;
    this.suggestionModal?.close();
    this.suggestionModal = null;
    this.bugModal?.close();
    this.bugModal = null;
    this.closeMenu();
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
    return '';
  }
}

// Export for UMD build
export { TinyFeedbackWidget, NPSModal, SuggestionModal, BugModal };
export type { NPSModalOptions, SuggestionModalOptions, BugModalOptions };
export type { WidgetConfig };

// Global window interface
declare global {
  interface Window {
    TinyFeedback: typeof TinyFeedbackWidget;
    TinyFeedbackWidget: typeof TinyFeedbackWidget;
  }
}

// Auto-initialize if config is present in window
if (typeof window !== 'undefined') {
  window.TinyFeedback = TinyFeedbackWidget;
  window.TinyFeedbackWidget = TinyFeedbackWidget;
  
  // Check for auto-initialize config
  const tfConfig = (window as unknown as Record<string, unknown>).__TF_CONFIG__ as WidgetConfig | undefined;
  if (tfConfig?.projectId && tfConfig?.apiKey) {
    const widget = new TinyFeedbackWidget(tfConfig);
    widget.init();
    
    // Store instance globally
    (window as unknown as Record<string, unknown>).__TF_WIDGET__ = widget;
    
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

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes tf-menu-appear {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .tf-menu-item:hover { background: #f3f4f6 !important; }
`;
document.head?.appendChild(style);
