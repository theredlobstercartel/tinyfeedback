/*!
 * TinyFeedback Widget v1.0.0
 * Lightweight feedback widget for websites
 */
(function () {
  'use strict';

  // Types
  type FeedbackType = 'nps' | 'suggestion' | 'bug';
  
  interface WidgetConfig {
    apiKey: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    primaryColor?: string;
    textColor?: string;
    apiUrl?: string;
  }

  interface FeedbackData {
    type: FeedbackType;
    rating?: number;
    message: string;
    email?: string;
    url: string;
    userAgent: string;
    timestamp: number;
  }

  // Default configuration
  const DEFAULT_CONFIG: Partial<WidgetConfig> = {
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    textColor: '#ffffff',
    apiUrl: 'https://api.tinyfeedback.io/v1'
  };

  // CSS Styles - Inline minified
  const STYLES = `
.tfw-widget{--tfw-primary:#3b82f6;--tfw-text:#fff;--tfw-bg:#fff;--tfw-shadow:0 4px 20px rgba(0,0,0,0.15);--tfw-radius:12px;position:fixed;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.tfw-btn{position:fixed;width:56px;height:56px;border-radius:50%;background:var(--tfw-primary);color:var(--tfw-text);border:none;cursor:pointer;box-shadow:var(--tfw-shadow);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;font-size:24px;padding:0}
.tfw-btn:hover{transform:scale(1.05);box-shadow:0 6px 24px rgba(0,0,0,0.2)}
.tfw-btn:active{transform:scale(.95)}
.tfw-btn-br{bottom:20px;right:20px}
.tfw-btn-bl{bottom:20px;left:20px}
.tfw-btn-tr{top:20px;right:20px}
.tfw-btn-tl{top:20px;left:20px}
.tfw-modal{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:none;align-items:center;justify-content:center;z-index:100000;padding:16px;backdrop-filter:blur(4px)}
.tfw-modal.open{display:flex;animation:tfwFadeIn .2s ease}
@keyframes tfwFadeIn{from{opacity:0}to{opacity:1}}
.tfw-container{background:var(--tfw-bg);border-radius:var(--tfw-radius);width:100%;max-width:420px;max-height:90vh;overflow:auto;box-shadow:var(--tfw-shadow);animation:tfwSlideUp .3s ease}
@keyframes tfwSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.tfw-header{padding:20px 20px 0;display:flex;justify-content:space-between;align-items:center}
.tfw-title{font-size:18px;font-weight:600;color:#111;margin:0}
.tfw-close{width:32px;height:32px;border:none;background:transparent;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#666;transition:background .2s;font-size:20px}
.tfw-close:hover{background:#f3f4f6;color:#111}
.tfw-body{padding:20px}
.tfw-options{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
.tfw-option{padding:16px 12px;border:2px solid #e5e7eb;border-radius:var(--tfw-radius);cursor:pointer;text-align:center;transition:all .2s;background:#fff}
.tfw-option:hover{border-color:var(--tfw-primary);background:#f8fafc}
.tfw-option.selected{border-color:var(--tfw-primary);background:#eff6ff}
.tfw-option-icon{font-size:28px;margin-bottom:8px;display:block}
.tfw-option-label{font-size:13px;font-weight:500;color:#374151;display:block}
.tfw-form{display:none}
.tfw-form.open{display:block}
.tfw-label{display:block;font-size:14px;font-weight:500;color:#374151;margin-bottom:6px}
.tfw-input,.tfw-textarea{width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;font-family:inherit;box-sizing:border-box;transition:border-color .2s}
.tfw-input:focus,.tfw-textarea:focus{outline:none;border-color:var(--tfw-primary)}
.tfw-textarea{min-height:120px;resize:vertical}
.tfw-field{margin-bottom:16px}
.tfw-nps{display:flex;gap:8px;justify-content:center;margin-bottom:16px;flex-wrap:wrap}
.tfw-nps-btn{width:40px;height:40px;border:2px solid #e5e7eb;border-radius:8px;background:#fff;cursor:pointer;font-size:14px;font-weight:600;color:#374151;transition:all .2s;padding:0}
.tfw-nps-btn:hover{border-color:var(--tfw-primary)}
.tfw-nps-btn.selected{background:var(--tfw-primary);color:var(--tfw-text);border-color:var(--tfw-primary)}
.tfw-actions{display:flex;gap:12px;justify-content:flex-end;margin-top:20px}
.tfw-btn-primary{padding:10px 20px;background:var(--tfw-primary);color:var(--tfw-text);border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;transition:opacity .2s}
.tfw-btn-primary:hover{opacity:.9}
.tfw-btn-primary:disabled{opacity:.5;cursor:not-allowed}
.tfw-btn-secondary{padding:10px 20px;background:transparent;color:#666;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s}
.tfw-btn-secondary:hover{border-color:#d1d5db;color:#111}
.tfw-error{color:#dc2626;font-size:13px;margin-top:8px;padding:8px 12px;background:#fef2f2;border-radius:6px;display:none}
.tfw-error.show{display:block}
.tfw-success{text-align:center;padding:40px 20px}
.tfw-success-icon{font-size:48px;margin-bottom:16px}
.tfw-success-title{font-size:18px;font-weight:600;color:#111;margin:0 0 8px}
.tfw-success-text{font-size:14px;color:#6b7280;margin:0}
.tfw-back{margin-top:16px;padding:8px 16px;background:transparent;border:none;color:var(--tfw-primary);cursor:pointer;font-size:14px;font-weight:500}
.tfw-back:hover{text-decoration:underline}
@media (max-width:480px){.tfw-container{margin:0;max-height:100vh;border-radius:0}.tfw-modal{padding:0}.tfw-btn{width:48px;height:48px;font-size:20px}}
`;

  // SVG Icons
  const ICONS = {
    feedback: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    nps: '😊',
    suggestion: '💡',
    bug: '🐛',
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    check: '✅'
  };

  // Widget Class
  class TinyFeedbackWidget {
    private config: WidgetConfig;
    private container: HTMLDivElement | null = null;
    private modal: HTMLDivElement | null = null;
    private selectedType: FeedbackType | null = null;
    private selectedRating: number | null = null;
    private isSubmitting = false;

    constructor(config: WidgetConfig) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.validateConfig();
      this.injectStyles();
      this.render();
      this.attachEventListeners();
    }

    private validateConfig(): void {
      if (!this.config.apiKey) {
        throw new Error('TinyFeedback: API key is required');
      }
    }

    private injectStyles(): void {
      if (document.getElementById('tfw-styles')) return;
      const style = document.createElement('style');
      style.id = 'tfw-styles';
      style.textContent = STYLES.replace(/var\(--tfw-primary\)/g, this.config.primaryColor!)
                                .replace(/var\(--tfw-text\)/g, this.config.textColor!);
      document.head.appendChild(style);
    }

    private render(): void {
      // Container
      this.container = document.createElement('div');
      this.container.className = 'tfw-widget';

      // Floating Button
      const btn = document.createElement('button');
      btn.className = `tfw-btn tfw-btn-${this.getPositionClass()}`;
      btn.innerHTML = ICONS.feedback;
      btn.setAttribute('aria-label', 'Open feedback');
      btn.onclick = () => this.openModal();
      this.container.appendChild(btn);

      // Modal
      this.modal = document.createElement('div');
      this.modal.className = 'tfw-modal';
      this.modal.innerHTML = this.getModalHTML();
      this.container.appendChild(this.modal);

      document.body.appendChild(this.container);
    }

    private getPositionClass(): string {
      const pos = this.config.position || 'bottom-right';
      return pos.replace('-', '');
    }

    private getModalHTML(): string {
      return `
        <div class="tfw-container">
          <div class="tfw-header">
            <h3 class="tfw-title">Send Feedback</h3>
            <button class="tfw-close" aria-label="Close">${ICONS.close}</button>
          </div>
          <div class="tfw-body">
            <div class="tfw-step-1">
              <div class="tfw-options">
                <button class="tfw-option" data-type="nps">
                  <span class="tfw-option-icon">${ICONS.nps}</span>
                  <span class="tfw-option-label">Rate Us</span>
                </button>
                <button class="tfw-option" data-type="suggestion">
                  <span class="tfw-option-icon">${ICONS.suggestion}</span>
                  <span class="tfw-option-label">Suggestion</span>
                </button>
                <button class="tfw-option" data-type="bug">
                  <span class="tfw-option-icon">${ICONS.bug}</span>
                  <span class="tfw-option-label">Report Bug</span>
                </button>
              </div>
            </div>
            <div class="tfw-form" id="tfw-form">
              <div class="tfw-field" id="tfw-nps-container" style="display:none">
                <label class="tfw-label">How likely are you to recommend us?</label>
                <div class="tfw-nps">
                  ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => 
                    `<button class="tfw-nps-btn" data-rating="${n}">${n}</button>`
                  ).join('')}
                </div>
              </div>
              <div class="tfw-field">
                <label class="tfw-label" for="tfw-message">Your feedback</label>
                <textarea id="tfw-message" class="tfw-textarea" placeholder="Tell us what you think..." required></textarea>
              </div>
              <div class="tfw-field">
                <label class="tfw-label" for="tfw-email">Email (optional)</label>
                <input type="email" id="tfw-email" class="tfw-input" placeholder="your@email.com">
              </div>
              <div class="tfw-error" id="tfw-error"></div>
              <div class="tfw-actions">
                <button class="tfw-btn-secondary" id="tfw-back">Back</button>
                <button class="tfw-btn-primary" id="tfw-submit">Send Feedback</button>
              </div>
            </div>
            <div class="tfw-success" id="tfw-success" style="display:none">
              <div class="tfw-success-icon">${ICONS.check}</div>
              <h4 class="tfw-success-title">Thank you!</h4>
              <p class="tfw-success-text">Your feedback helps us improve.</p>
              <button class="tfw-back" id="tfw-close-success">Close</button>
            </div>
          </div>
        </div>
      `;
    }

    private attachEventListeners(): void {
      if (!this.modal) return;

      // Close modal on backdrop click
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });

      // Close button
      const closeBtn = this.modal.querySelector('.tfw-close');
      closeBtn?.addEventListener('click', () => this.closeModal());

      // Option selection
      const options = this.modal.querySelectorAll('.tfw-option');
      options.forEach(opt => {
        opt.addEventListener('click', () => {
          const type = opt.getAttribute('data-type') as FeedbackType;
          this.selectType(type);
        });
      });

      // NPS rating
      const npsBtns = this.modal.querySelectorAll('.tfw-nps-btn');
      npsBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const rating = parseInt(btn.getAttribute('data-rating') || '0');
          this.selectRating(rating);
        });
      });

      // Back button
      const backBtn = this.modal.querySelector('#tfw-back');
      backBtn?.addEventListener('click', () => this.showOptions());

      // Submit button
      const submitBtn = this.modal.querySelector('#tfw-submit');
      submitBtn?.addEventListener('click', () => this.submit());

      // Close success button
      const closeSuccessBtn = this.modal.querySelector('#tfw-close-success');
      closeSuccessBtn?.addEventListener('click', () => this.closeModal());

      // Enter key on textarea
      const messageEl = this.modal.querySelector('#tfw-message') as HTMLTextAreaElement;
      messageEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          this.submit();
        }
      });
    }

    private openModal(): void {
      if (!this.modal) return;
      this.modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      this.showOptions();
    }

    private closeModal(): void {
      if (!this.modal) return;
      this.modal.classList.remove('open');
      document.body.style.overflow = '';
      // Reset after animation
      setTimeout(() => this.resetForm(), 300);
    }

    private showOptions(): void {
      const step1 = this.modal?.querySelector('.tfw-step-1');
      const form = this.modal?.querySelector('#tfw-form');
      step1?.setAttribute('style', 'display:block');
      form?.classList.remove('open');
      this.selectedType = null;
      this.selectedRating = null;
    }

    private selectType(type: FeedbackType): void {
      this.selectedType = type;
      const step1 = this.modal?.querySelector('.tfw-step-1');
      const form = this.modal?.querySelector('#tfw-form');
      const npsContainer = this.modal?.querySelector('#tfw-nps-container');
      
      step1?.setAttribute('style', 'display:none');
      form?.classList.add('open');
      
      // Show NPS for rating type
      if (npsContainer) {
        npsContainer.setAttribute('style', type === 'nps' ? 'display:block' : 'display:none');
      }

      // Update title
      const titles: Record<FeedbackType, string> = {
        nps: 'Rate Your Experience',
        suggestion: 'Share Your Suggestion',
        bug: 'Report a Bug'
      };
      const titleEl = this.modal?.querySelector('.tfw-title');
      if (titleEl) titleEl.textContent = titles[type];

      // Focus message
      setTimeout(() => {
        const messageEl = this.modal?.querySelector('#tfw-message') as HTMLTextAreaElement;
        messageEl?.focus();
      }, 100);
    }

    private selectRating(rating: number): void {
      this.selectedRating = rating;
      const btns = this.modal?.querySelectorAll('.tfw-nps-btn');
      btns?.forEach(btn => {
        btn.classList.toggle('selected', 
          parseInt(btn.getAttribute('data-rating') || '0') === rating);
      });
    }

    private showError(msg: string): void {
      const errorEl = this.modal?.querySelector('#tfw-error');
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.classList.add('show');
      }
    }

    private hideError(): void {
      const errorEl = this.modal?.querySelector('#tfw-error');
      errorEl?.classList.remove('show');
    }

    private async submit(): Promise<void> {
      if (this.isSubmitting) return;

      const messageEl = this.modal?.querySelector('#tfw-message') as HTMLTextAreaElement;
      const emailEl = this.modal?.querySelector('#tfw-email') as HTMLInputElement;
      
      const message = messageEl?.value.trim();
      const email = emailEl?.value.trim();

      this.hideError();

      // Validation
      if (this.selectedType === 'nps' && this.selectedRating === null) {
        this.showError('Please select a rating from 0 to 10');
        return;
      }

      if (!message) {
        this.showError('Please enter your feedback');
        messageEl?.focus();
        return;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.showError('Please enter a valid email address');
        emailEl?.focus();
        return;
      }

      this.isSubmitting = true;
      const submitBtn = this.modal?.querySelector('#tfw-submit') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      try {
        const data: FeedbackData = {
          type: this.selectedType!,
          rating: this.selectedRating || undefined,
          message,
          email: email || undefined,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        };

        await this.sendFeedback(data);
        this.showSuccess();
      } catch (err) {
        console.error('[TinyFeedback] Error:', err);
        this.showError(err instanceof Error ? err.message : 'Failed to send feedback. Please try again.');
      } finally {
        this.isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Feedback';
        }
      }
    }

    private async sendFeedback(data: FeedbackData): Promise<void> {
      const apiUrl = this.config.apiUrl || DEFAULT_CONFIG.apiUrl!;
      const origin = window.location.origin;

      const response = await fetch(`${apiUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
          'Origin': origin
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Domain not authorized. Please check your API key configuration.');
        }
        if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        }
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Request failed (${response.status})`);
      }
    }

    private showSuccess(): void {
      const form = this.modal?.querySelector('#tfw-form');
      const success = this.modal?.querySelector('#tfw-success');
      form?.setAttribute('style', 'display:none');
      success?.setAttribute('style', 'display:block');
      
      // Auto close after 3 seconds
      setTimeout(() => {
        if (this.modal?.classList.contains('open')) {
          this.closeModal();
        }
      }, 3000);
    }

    private resetForm(): void {
      const messageEl = this.modal?.querySelector('#tfw-message') as HTMLTextAreaElement;
      const emailEl = this.modal?.querySelector('#tfw-email') as HTMLInputElement;
      const form = this.modal?.querySelector('#tfw-form');
      const success = this.modal?.querySelector('#tfw-success');
      
      if (messageEl) messageEl.value = '';
      if (emailEl) emailEl.value = '';
      
      form?.setAttribute('style', '');
      form?.classList.remove('open');
      success?.setAttribute('style', 'display:none');
      
      this.selectedType = null;
      this.selectedRating = null;
      this.hideError();
      
      // Reset NPS buttons
      const npsBtns = this.modal?.querySelectorAll('.tfw-nps-btn');
      npsBtns?.forEach(btn => btn.classList.remove('selected'));
      
      // Reset options
      const options = this.modal?.querySelectorAll('.tfw-option');
      options?.forEach(opt => opt.classList.remove('selected'));
      
      // Reset title
      const titleEl = this.modal?.querySelector('.tfw-title');
      if (titleEl) titleEl.textContent = 'Send Feedback';
    }

    public destroy(): void {
      const styles = document.getElementById('tfw-styles');
      styles?.remove();
      this.container?.remove();
      this.container = null;
      this.modal = null;
    }
  }

  // Global API
  let widgetInstance: TinyFeedbackWidget | null = null;

  // Initialize from data attributes
  function autoInit(): void {
    const script = document.currentScript as HTMLScriptElement;
    if (!script) return;

    const apiKey = script.getAttribute('data-api-key');
    if (!apiKey) {
      console.error('[TinyFeedback] API key required. Add data-api-key attribute to script tag.');
      return;
    }

    const config: WidgetConfig = {
      apiKey,
      position: (script.getAttribute('data-position') as WidgetConfig['position']) || 'bottom-right',
      primaryColor: script.getAttribute('data-color') || '#3b82f6',
      textColor: script.getAttribute('data-text-color') || '#ffffff',
      apiUrl: script.getAttribute('data-api-url') || undefined
    };

    widgetInstance = new TinyFeedbackWidget(config);
  }

  // Expose global API
  (window as any).TinyFeedback = {
    init: (config: WidgetConfig) => {
      widgetInstance?.destroy();
      widgetInstance = new TinyFeedbackWidget(config);
      return widgetInstance;
    },
    destroy: () => {
      widgetInstance?.destroy();
      widgetInstance = null;
    },
    open: () => widgetInstance?.openModal(),
    close: () => widgetInstance?.closeModal()
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();
