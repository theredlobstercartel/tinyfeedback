/**
 * TinyFeedback Embeddable Widget
 * Story: ST-11 - Widget Embeddable
 * Vanilla TypeScript with Shadow DOM for style isolation
 */

interface WidgetConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor: string;
  title: string;
  apiUrl: string;
}

interface FeedbackData {
  type: 'nps' | 'suggestion' | 'bug';
  npsScore?: number;
  message: string;
  widgetKey: string;
  url: string;
  userAgent: string;
}

class TinyFeedbackWidget {
  private widgetKey: string;
  private config: WidgetConfig | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private container: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private isOpen = false;
  private selectedNps: number | null = null;

  constructor(widgetKey: string) {
    this.widgetKey = widgetKey;
  }

  /**
   * Initialize the widget - load config and mount
   */
  async init(): Promise<void> {
    await this.loadConfig();
    this.mount();
  }

  /**
   * Load configuration from API
   */
  private async loadConfig(): Promise<void> {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/widget/${this.widgetKey}/config`);
      if (!response.ok) throw new Error('Failed to load config');
      
      const data = await response.json();
      this.config = {
        position: data.position || 'bottom-right',
        primaryColor: data.primaryColor || '#00ff88',
        title: data.title || 'Feedback',
        apiUrl: data.apiUrl || baseUrl
      };
    } catch (error) {
      console.error('[TinyFeedback] Error loading config:', error);
      // Fallback config
      this.config = {
        position: 'bottom-right',
        primaryColor: '#00ff88',
        title: 'Feedback',
        apiUrl: this.getBaseUrl()
      };
    }
  }

  /**
   * Get base URL from script tag or default
   */
  private getBaseUrl(): string {
    const script = document.currentScript as HTMLScriptElement | null;
    if (script?.src) {
      const url = new URL(script.src);
      return `${url.protocol}//${url.host}`;
    }
    // Try to infer from window location
    return window.location.origin;
  }

  /**
   * Mount the widget to DOM
   */
  private mount(): void {
    // Create container with shadow DOM
    this.container = document.createElement('div');
    this.container.id = 'tinyfeedback-widget';
    this.shadowRoot = this.container.attachShadow({ mode: 'open' });

    // Inject styles
    this.injectStyles();

    // Create floating button
    const button = this.createButton();
    this.shadowRoot.appendChild(button);

    // Create modal
    this.modal = this.createModal();
    this.shadowRoot.appendChild(this.modal);

    // Append to body
    document.body.appendChild(this.container);
  }

  /**
   * Inject CSS styles into Shadow DOM
   */
  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      /* Floating Button */
      .tf-button {
        position: fixed;
        width: 56px;
        height: 56px;
        border-radius: 0;
        background: #00ff88;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0, 255, 136, 0.4);
        transition: all 0.3s ease;
        z-index: 2147483646;
      }

      .tf-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(0, 255, 136, 0.6);
      }

      .tf-button svg {
        width: 24px;
        height: 24px;
        color: #141414;
      }

      /* Positions */
      .tf-position-bottom-right { bottom: 24px; right: 24px; }
      .tf-position-bottom-left { bottom: 24px; left: 24px; }
      .tf-position-top-right { top: 24px; right: 24px; }
      .tf-position-top-left { top: 24px; left: 24px; }

      /* Modal Overlay */
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
        z-index: 2147483647;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .tf-modal-overlay.open {
        opacity: 1;
        visibility: visible;
      }

      /* Modal Container */
      .tf-modal {
        background: #141414;
        border: 1px solid #333;
        width: 90%;
        max-width: 420px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        animation: tfSlideIn 0.3s ease;
      }

      @keyframes tfSlideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Modal Header */
      .tf-modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .tf-modal-title {
        color: #ffffff;
        font-size: 18px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .tf-modal-close {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      }

      .tf-modal-close:hover {
        color: #fff;
      }

      .tf-modal-close svg {
        width: 20px;
        height: 20px;
      }

      /* Modal Body */
      .tf-modal-body {
        padding: 24px;
      }

      /* Section Title */
      .tf-section-title {
        color: #00ff88;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 12px;
        font-weight: 600;
      }

      /* NPS Section */
      .tf-nps-section {
        margin-bottom: 24px;
      }

      .tf-nps-labels {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        color: #666;
        font-size: 11px;
        text-transform: uppercase;
      }

      .tf-nps-buttons {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .tf-nps-btn {
        width: 32px;
        height: 32px;
        border: 1px solid #333;
        background: transparent;
        color: #888;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .tf-nps-btn:hover {
        border-color: #00ff88;
        color: #00ff88;
      }

      .tf-nps-btn.selected {
        background: #00ff88;
        border-color: #00ff88;
        color: #141414;
      }

      /* Feedback Type Tabs */
      .tf-tabs {
        display: flex;
        gap: 0;
        margin-bottom: 16px;
        border: 1px solid #333;
      }

      .tf-tab {
        flex: 1;
        padding: 12px;
        background: transparent;
        border: none;
        color: #666;
        cursor: pointer;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.2s;
      }

      .tf-tab:hover {
        color: #aaa;
        background: #1a1a1a;
      }

      .tf-tab.active {
        background: #00ff88;
        color: #141414;
        font-weight: 600;
      }

      /* Textarea */
      .tf-textarea {
        width: 100%;
        min-height: 120px;
        background: #0a0a0a;
        border: 1px solid #333;
        color: #fff;
        padding: 12px;
        font-size: 14px;
        resize: vertical;
        outline: none;
        transition: border-color 0.2s;
      }

      .tf-textarea:focus {
        border-color: #00ff88;
      }

      .tf-textarea::placeholder {
        color: #555;
      }

      /* Submit Button */
      .tf-submit {
        width: 100%;
        padding: 16px;
        background: #00ff88;
        border: none;
        color: #141414;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 2px;
        cursor: pointer;
        margin-top: 16px;
        transition: all 0.2s;
      }

      .tf-submit:hover {
        background: #00cc6a;
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
      }

      .tf-submit:disabled {
        background: #333;
        color: #666;
        cursor: not-allowed;
        box-shadow: none;
      }

      /* Success State */
      .tf-success {
        text-align: center;
        padding: 40px 24px;
      }

      .tf-success-icon {
        width: 64px;
        height: 64px;
        background: #00ff88;
        margin: 0 auto 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tf-success-icon svg {
        width: 32px;
        height: 32px;
        color: #141414;
      }

      .tf-success-title {
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .tf-success-message {
        color: #888;
        font-size: 14px;
      }
    `;
    this.shadowRoot!.appendChild(style);
  }

  /**
   * Create floating button element
   */
  private createButton(): HTMLElement {
    const button = document.createElement('button');
    button.className = `tf-button tf-position-${this.config?.position || 'bottom-right'}`;
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    button.addEventListener('click', () => this.openModal());
    return button;
  }

  /**
   * Create modal element
   */
  private createModal(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'tf-modal-overlay';
    
    overlay.innerHTML = `
      <div class="tf-modal">
        <div class="tf-modal-header">
          <span class="tf-modal-title">${this.config?.title || 'Feedback'}</span>
          <button class="tf-modal-close" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="tf-modal-body">
          <div class="tf-nps-section">
            <div class="tf-section-title">How likely are you to recommend us?</div>
            <div class="tf-nps-labels">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>
            <div class="tf-nps-buttons">
              ${Array.from({ length: 11 }, (_, i) => 
                `<button class="tf-nps-btn" data-score="${i}">${i}</button>`
              ).join('')}
            </div>
          </div>
          
          <div class="tf-tabs">
            <button class="tf-tab active" data-type="suggestion">Suggestion</button>
            <button class="tf-tab" data-type="bug">Bug Report</button>
          </div>
          
          <textarea class="tf-textarea" placeholder="Tell us more..."></textarea>
          
          <button class="tf-submit">Send Feedback</button>
        </div>
      </div>
    `;

    // Close button
    overlay.querySelector('.tf-modal-close')!.addEventListener('click', () => this.closeModal());
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal();
    });

    // NPS buttons
    overlay.querySelectorAll('.tf-nps-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const score = parseInt(target.dataset.score!);
        this.selectNps(score);
      });
    });

    // Tabs
    overlay.querySelectorAll('.tf-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        overlay.querySelectorAll('.tf-tab').forEach(t => t.classList.remove('active'));
        target.classList.add('active');
      });
    });

    // Submit
    overlay.querySelector('.tf-submit')!.addEventListener('click', () => this.submit());

    return overlay;
  }

  /**
   * Select NPS score
   */
  private selectNps(score: number): void {
    this.selectedNps = score;
    this.modal!.querySelectorAll('.tf-nps-btn').forEach(btn => {
      btn.classList.remove('selected');
      if ((btn as HTMLElement).dataset.score === score.toString()) {
        btn.classList.add('selected');
      }
    });
  }

  /**
   * Get selected feedback type
   */
  private getSelectedType(): 'suggestion' | 'bug' {
    const activeTab = this.modal!.querySelector('.tf-tab.active');
    return (activeTab?.getAttribute('data-type') as 'suggestion' | 'bug') || 'suggestion';
  }

  /**
   * Open modal
   */
  private openModal(): void {
    this.isOpen = true;
    this.modal?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close modal
   */
  private closeModal(): void {
    this.isOpen = false;
    this.modal?.classList.remove('open');
    document.body.style.overflow = '';
    
    // Reset form after animation
    setTimeout(() => this.resetForm(), 300);
  }

  /**
   * Reset form state
   */
  private resetForm(): void {
    this.selectedNps = null;
    this.modal!.querySelectorAll('.tf-nps-btn').forEach(btn => btn.classList.remove('selected'));
    (this.modal!.querySelector('.tf-textarea') as HTMLTextAreaElement).value = '';
    this.showForm();
  }

  /**
   * Show form (hide success)
   */
  private showForm(): void {
    const modalBody = this.modal!.querySelector('.tf-modal-body')!;
    modalBody.innerHTML = `
      <div class="tf-nps-section">
        <div class="tf-section-title">How likely are you to recommend us?</div>
        <div class="tf-nps-labels">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
        <div class="tf-nps-buttons">
          ${Array.from({ length: 11 }, (_, i) => 
            `<button class="tf-nps-btn" data-score="${i}">${i}</button>`
          ).join('')}
        </div>
      </div>
      
      <div class="tf-tabs">
        <button class="tf-tab active" data-type="suggestion">Suggestion</button>
        <button class="tf-tab" data-type="bug">Bug Report</button>
      </div>
      
      <textarea class="tf-textarea" placeholder="Tell us more..."></textarea>
      
      <button class="tf-submit">Send Feedback</button>
    `;

    // Re-attach event listeners
    this.modal!.querySelectorAll('.tf-nps-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const score = parseInt(target.dataset.score!);
        this.selectNps(score);
      });
    });

    this.modal!.querySelectorAll('.tf-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        this.modal!.querySelectorAll('.tf-tab').forEach(t => t.classList.remove('active'));
        target.classList.add('active');
      });
    });

    this.modal!.querySelector('.tf-submit')!.addEventListener('click', () => this.submit());
  }

  /**
   * Show success state
   */
  private showSuccess(): void {
    const modalBody = this.modal!.querySelector('.tf-modal-body')!;
    modalBody.innerHTML = `
      <div class="tf-success">
        <div class="tf-success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="tf-success-title">Thank You!</div>
        <div class="tf-success-message">Your feedback helps us improve.</div>
      </div>
    `;

    // Auto close after 3 seconds
    setTimeout(() => this.closeModal(), 3000);
  }

  /**
   * Submit feedback
   */
  private async submit(): Promise<void> {
    const submitBtn = this.modal!.querySelector('.tf-submit') as HTMLButtonElement;
    const textarea = this.modal!.querySelector('.tf-textarea') as HTMLTextAreaElement;
    
    const message = textarea.value.trim();
    if (!message && this.selectedNps === null) {
      textarea.style.borderColor = '#ff4444';
      setTimeout(() => textarea.style.borderColor = '', 2000);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const data: FeedbackData = {
      type: this.selectedNps !== null ? 'nps' : this.getSelectedType(),
      npsScore: this.selectedNps ?? undefined,
      message,
      widgetKey: this.widgetKey,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    try {
      const baseUrl = this.config?.apiUrl || this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Submit failed');

      this.showSuccess();
    } catch (error) {
      console.error('[TinyFeedback] Submit error:', error);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Try Again';
      submitBtn.style.background = '#ff4444';
      setTimeout(() => {
        submitBtn.style.background = '';
        submitBtn.textContent = 'Send Feedback';
      }, 2000);
    }
  }

  /**
   * Destroy widget
   */
  destroy(): void {
    this.closeModal();
    this.container?.remove();
    this.container = null;
    this.shadowRoot = null;
    this.modal = null;
  }
}

// Auto-initialize if data-widget-key is present on script tag
document.addEventListener('DOMContentLoaded', () => {
  const script = document.querySelector('script[data-widget-key]') as HTMLScriptElement | null;
  if (script) {
    const key = script.dataset.widgetKey;
    if (key) {
      const widget = new TinyFeedbackWidget(key);
      widget.init();
    }
  }
});

// Expose to global scope for manual initialization
(window as any).TinyFeedbackWidget = TinyFeedbackWidget;

export default TinyFeedbackWidget;
