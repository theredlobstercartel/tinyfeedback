/**
 * TinyFeedback Widget
 * Vanilla JS widget for collecting user feedback
 */

import { BugReportModal } from './modals/bug-report';

// Types
export interface WidgetConfig {
  projectId: string;
  apiKey: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  apiUrl?: string;
}

export interface FeedbackData {
  type: 'nps' | 'suggestion' | 'bug';
  content: string;
  nps_score?: number;
  title?: string;
  screenshot_url?: string;
  user_email?: string;
  page_url?: string;
  user_agent?: string;
}

// Default configuration
const DEFAULT_CONFIG: Partial<WidgetConfig> = {
  position: 'bottom-right',
  primaryColor: '#00ff88',
  apiUrl: '',
};

class TinyFeedbackWidget {
  private config: WidgetConfig;
  private container: HTMLElement | null = null;
  private currentModal: HTMLElement | null = null;

  constructor(config: WidgetConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.init();
  }

  private init(): void {
    this.createStyles();
    this.createTriggerButton();
  }

  private createStyles(): void {
    const styles = document.createElement('style');
    styles.textContent = `
      .tf-widget {
        font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .tf-trigger {
        position: fixed;
        ${this.getPositionStyles()}
        width: 56px;
        height: 56px;
        border-radius: 0;
        background: ${this.config.primaryColor};
        color: #000;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
        transition: all 0.2s ease;
        z-index: 9999;
      }
      
      .tf-trigger:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0, 255, 136, 0.4);
      }
      
      .tf-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      }
      
      .tf-modal {
        background: #0a0a0a;
        border: 1px solid #222;
        border-radius: 0;
        width: 90%;
        max-width: 480px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 0 40px rgba(0, 255, 136, 0.1);
      }
      
      .tf-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px;
        border-bottom: 1px solid #222;
      }
      
      .tf-modal-title {
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }
      
      .tf-modal-close {
        background: none;
        border: none;
        color: #888;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      }
      
      .tf-modal-close:hover {
        color: #fff;
      }
      
      .tf-modal-body {
        padding: 20px;
      }
      
      .tf-form-group {
        margin-bottom: 16px;
      }
      
      .tf-label {
        display: block;
        color: #888;
        font-size: 14px;
        margin-bottom: 8px;
        font-weight: 500;
      }
      
      .tf-input,
      .tf-textarea {
        width: 100%;
        padding: 12px;
        background: #000;
        border: 1px solid #333;
        border-radius: 0;
        color: #fff;
        font-size: 14px;
        font-family: inherit;
        box-sizing: border-box;
        transition: border-color 0.2s;
      }
      
      .tf-input:focus,
      .tf-textarea:focus {
        outline: none;
        border-color: ${this.config.primaryColor};
      }
      
      .tf-textarea {
        min-height: 120px;
        resize: vertical;
      }
      
      .tf-input::placeholder,
      .tf-textarea::placeholder {
        color: #555;
      }
      
      .tf-button {
        width: 100%;
        padding: 14px;
        background: ${this.config.primaryColor};
        color: #000;
        border: none;
        border-radius: 0;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      
      .tf-button:hover:not(:disabled) {
        filter: brightness(1.1);
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
      }
      
      .tf-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .tf-button-secondary {
        background: transparent;
        color: ${this.config.primaryColor};
        border: 1px solid ${this.config.primaryColor};
      }
      
      .tf-button-secondary:hover:not(:disabled) {
        background: rgba(0, 255, 136, 0.1);
      }
      
      .tf-type-selector {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 20px;
      }
      
      .tf-type-button {
        padding: 12px;
        background: #000;
        border: 1px solid #333;
        border-radius: 0;
        color: #888;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      
      .tf-type-button:hover {
        border-color: #555;
        color: #fff;
      }
      
      .tf-type-button.active {
        border-color: ${this.config.primaryColor};
        color: ${this.config.primaryColor};
        background: rgba(0, 255, 136, 0.05);
      }
      
      .tf-error {
        color: #ff4444;
        font-size: 13px;
        margin-top: 8px;
      }
      
      .tf-success {
        text-align: center;
        padding: 40px 20px;
      }
      
      .tf-success-icon {
        width: 64px;
        height: 64px;
        background: ${this.config.primaryColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        color: #000;
        font-size: 32px;
      }
      
      .tf-success-title {
        color: #fff;
        font-size: 20px;
        margin-bottom: 8px;
      }
      
      .tf-success-message {
        color: #888;
        font-size: 14px;
      }
    `;
    document.head.appendChild(styles);
  }

  private getPositionStyles(): string {
    const positions = {
      'bottom-right': 'bottom: 24px; right: 24px;',
      'bottom-left': 'bottom: 24px; left: 24px;',
      'top-right': 'top: 24px; right: 24px;',
      'top-left': 'top: 24px; left: 24px;',
    };
    return positions[this.config.position || 'bottom-right'];
  }

  private createTriggerButton(): void {
    const button = document.createElement('button');
    button.className = 'tf-trigger';
    button.innerHTML = '💬';
    button.setAttribute('aria-label', 'Open feedback');
    button.onclick = () => this.openTypeSelector();
    document.body.appendChild(button);
    this.container = button;
  }

  private openTypeSelector(): void {
    const overlay = document.createElement('div');
    overlay.className = 'tf-modal-overlay';
    overlay.onclick = (e) => {
      if (e.target === overlay) this.closeModal();
    };

    const modal = document.createElement('div');
    modal.className = 'tf-modal';
    modal.innerHTML = `
      <div class="tf-modal-header">
        <h3 class="tf-modal-title">Send Feedback</h3>
        <button class="tf-modal-close" aria-label="Close">×</button>
      </div>
      <div class="tf-modal-body">
        <div class="tf-type-selector">
          <button class="tf-type-button" data-type="nps">NPS Score</button>
          <button class="tf-type-button" data-type="suggestion">Suggestion</button>
          <button class="tf-type-button" data-type="bug">Bug Report</button>
        </div>
      </div>
    `;

    const closeBtn = modal.querySelector('.tf-modal-close');
    closeBtn?.addEventListener('click', () => this.closeModal());

    const typeButtons = modal.querySelectorAll('.tf-type-button');
    typeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type') as 'nps' | 'suggestion' | 'bug';
        this.openFeedbackModal(type);
      });
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this.currentModal = overlay;
  }

  private openFeedbackModal(type: 'nps' | 'suggestion' | 'bug'): void {
    this.closeModal();

    if (type === 'bug') {
      const bugModal = new BugReportModal({
        config: this.config,
        onClose: () => this.closeModal(),
        onSubmit: (data) => this.submitFeedback(data),
      });
      this.currentModal = bugModal.render();
      document.body.appendChild(this.currentModal);
    } else {
      // For now, other types just show a placeholder
      this.showPlaceholderModal(type);
    }
  }

  private showPlaceholderModal(type: string): void {
    const overlay = document.createElement('div');
    overlay.className = 'tf-modal-overlay';
    overlay.onclick = (e) => {
      if (e.target === overlay) this.closeModal();
    };

    const modal = document.createElement('div');
    modal.className = 'tf-modal';
    modal.innerHTML = `
      <div class="tf-modal-header">
        <h3 class="tf-modal-title">${type.charAt(0).toUpperCase() + type.slice(1)}</h3>
        <button class="tf-modal-close" aria-label="Close">×</button>
      </div>
      <div class="tf-modal-body">
        <p style="color: #888; text-align: center; padding: 40px 20px;">
          This feedback type will be implemented in a future story.
        </p>
        <button class="tf-button tf-button-secondary" id="tf-back-btn">Go Back</button>
      </div>
    `;

    modal.querySelector('.tf-modal-close')?.addEventListener('click', () => this.closeModal());
    modal.querySelector('#tf-back-btn')?.addEventListener('click', () => {
      this.closeModal();
      this.openTypeSelector();
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this.currentModal = overlay;
  }

  private async submitFeedback(data: FeedbackData): Promise<void> {
    try {
      const apiUrl = this.config.apiUrl || window.location.origin;
      const response = await fetch(`${apiUrl}/api/widget/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify({
          ...data,
          project_id: this.config.projectId,
          page_url: window.location.href,
          user_agent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit feedback');
      }

      this.showSuccessMessage();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  }

  private showSuccessMessage(): void {
    this.closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'tf-modal-overlay';
    overlay.onclick = (e) => {
      if (e.target === overlay) this.closeModal();
    };

    const modal = document.createElement('div');
    modal.className = 'tf-modal';
    modal.innerHTML = `
      <div class="tf-success">
        <div class="tf-success-icon">✓</div>
        <h3 class="tf-success-title">Thank you!</h3>
        <p class="tf-success-message">Your feedback has been submitted successfully.</p>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this.currentModal = overlay;

    // Auto-close after 3 seconds
    setTimeout(() => this.closeModal(), 3000);
  }

  private closeModal(): void {
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
  }

  public destroy(): void {
    this.closeModal();
    this.container?.remove();
    this.container = null;
  }
}

// Export for use as a module
export { TinyFeedbackWidget };

// Global declaration for UMD build
declare global {
  interface Window {
    TinyFeedbackWidget: typeof TinyFeedbackWidget;
  }
}

// Auto-initialize if config is present in window
if (typeof window !== 'undefined' && (window as unknown as { tinyFeedbackConfig?: WidgetConfig }).tinyFeedbackConfig) {
  const config = (window as unknown as { tinyFeedbackConfig: WidgetConfig }).tinyFeedbackConfig;
  new TinyFeedbackWidget(config);
}
