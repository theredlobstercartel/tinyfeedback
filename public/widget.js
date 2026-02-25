/**
 * TinyFeedback Widget - Vanilla JavaScript
 * Embeddable feedback widget for SaaS products
 */
(function() {
  'use strict';

  // Widget configuration
  const CONFIG = {
    apiUrl: 'https://tinyfeedback.vercel.app',
    defaultPosition: 'bottom-right',
    defaultColor: '#00ff88',
  };

  // Current widget instance
  let widgetInstance = null;

  /**
   * TinyFeedback Widget Class
   */
  class TinyFeedbackWidget {
    constructor(config) {
      this.config = {
        widgetKey: config.widgetKey,
        position: config.position || CONFIG.defaultPosition,
        primaryColor: config.primaryColor || CONFIG.defaultColor,
        title: config.title || 'Queremos seu feedback!',
        subtitle: config.subtitle || '',
        thankYouMessage: config.thankYouMessage || 'Obrigado pelo feedback!',
        enableNps: config.enableNps !== false,
        enableSuggestions: config.enableSuggestions !== false,
        enableBugs: config.enableBugs !== false,
      };
      
      this.isOpen = false;
      this.currentStep = 1;
      this.selectedNps = null;
      this.feedbackType = null;
      
      this.init();
    }

    /**
     * Initialize the widget
     */
    init() {
      this.createShadowDOM();
      this.injectStyles();
      this.createButton();
      this.createModal();
    }

    /**
     * Create Shadow DOM for style isolation
     */
    createShadowDOM() {
      this.host = document.createElement('div');
      this.host.id = 'tinyfeedback-widget-host';
      this.shadow = this.host.attachShadow({ mode: 'open' });
      document.body.appendChild(this.host);
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
      const styles = `
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        .tf-widget-button {
          position: fixed;
          ${this.getPositionStyles()}
          width: 56px;
          height: 56px;
          border-radius: 0;
          background: ${this.config.primaryColor};
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 20px ${this.config.primaryColor}40;
          transition: all 0.2s ease;
          z-index: 999999;
        }
        
        .tf-widget-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.5), 0 0 30px ${this.config.primaryColor}60;
        }
        
        .tf-widget-button svg {
          width: 24px;
          height: 24px;
          color: #0a0a0a;
        }
        
        .tf-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 9999999;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .tf-modal-overlay.active {
          display: flex;
          opacity: 1;
        }
        
        .tf-modal {
          background: #141414;
          border: 1px solid #333;
          border-radius: 0;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
          transform: scale(0.95);
          transition: transform 0.2s ease;
        }
        
        .tf-modal-overlay.active .tf-modal {
          transform: scale(1);
        }
        
        .tf-modal-header {
          padding: 24px 24px 16px;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .tf-modal-title {
          color: #fff;
          font-size: 20px;
          font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          margin: 0;
        }
        
        .tf-modal-subtitle {
          color: #a0a0a0;
          font-size: 14px;
          font-family: Inter, system-ui, sans-serif;
          margin-top: 4px;
        }
        
        .tf-close-btn {
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
        
        .tf-close-btn:hover {
          color: #fff;
        }
        
        .tf-modal-body {
          padding: 24px;
        }
        
        .tf-nps-scale {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin: 16px 0;
        }
        
        .tf-nps-btn {
          width: 36px;
          height: 36px;
          border: 1px solid #333;
          background: #0a0a0a;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .tf-nps-btn:hover {
          border-color: ${this.config.primaryColor};
          background: #1a1a1a;
        }
        
        .tf-nps-btn.selected {
          background: ${this.config.primaryColor};
          border-color: ${this.config.primaryColor};
          color: #0a0a0a;
        }
        
        .tf-nps-labels {
          display: flex;
          justify-content: space-between;
          color: #666;
          font-size: 12px;
          font-family: Inter, system-ui, sans-serif;
        }
        
        .tf-type-buttons {
          display: flex;
          gap: 12px;
          margin: 16px 0;
        }
        
        .tf-type-btn {
          flex: 1;
          padding: 12px;
          border: 1px solid #333;
          background: #0a0a0a;
          color: #fff;
          cursor: pointer;
          font-family: Inter, system-ui, sans-serif;
          font-size: 14px;
          transition: all 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .tf-type-btn:hover {
          border-color: ${this.config.primaryColor};
          background: #1a1a1a;
        }
        
        .tf-type-btn.selected {
          background: ${this.config.primaryColor};
          border-color: ${this.config.primaryColor};
          color: #0a0a0a;
        }
        
        .tf-textarea {
          width: 100%;
          min-height: 120px;
          padding: 12px;
          border: 1px solid #333;
          background: #0a0a0a;
          color: #fff;
          font-family: Inter, system-ui, sans-serif;
          font-size: 14px;
          resize: vertical;
          margin: 16px 0;
        }
        
        .tf-textarea:focus {
          outline: none;
          border-color: ${this.config.primaryColor};
        }
        
        .tf-textarea::placeholder {
          color: #666;
        }
        
        .tf-submit-btn {
          width: 100%;
          padding: 14px;
          background: ${this.config.primaryColor};
          border: none;
          color: #0a0a0a;
          font-size: 16px;
          font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .tf-submit-btn:hover {
          filter: brightness(1.1);
          box-shadow: 0 0 20px ${this.config.primaryColor}40;
        }
        
        .tf-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .tf-success {
          text-align: center;
          padding: 48px 24px;
        }
        
        .tf-success-icon {
          width: 64px;
          height: 64px;
          color: ${this.config.primaryColor};
          margin: 0 auto 16px;
        }
        
        .tf-success-title {
          color: #fff;
          font-size: 24px;
          font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          margin-bottom: 8px;
        }
        
        .tf-success-message {
          color: #a0a0a0;
          font-size: 16px;
          font-family: Inter, system-ui, sans-serif;
        }
        
        .tf-hidden {
          display: none !important;
        }
      `;
      
      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      this.shadow.appendChild(styleEl);
    }

    /**
     * Get position styles for button
     */
    getPositionStyles() {
      const positions = {
        'bottom-right': 'bottom: 24px; right: 24px;',
        'bottom-left': 'bottom: 24px; left: 24px;',
        'top-right': 'top: 24px; right: 24px;',
        'top-left': 'top: 24px; left: 24px;',
      };
      return positions[this.config.position] || positions['bottom-right'];
    }

    /**
     * Create floating button
     */
    createButton() {
      this.button = document.createElement('button');
      this.button.className = 'tf-widget-button';
      this.button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      `;
      this.button.addEventListener('click', () => this.openModal());
      this.shadow.appendChild(this.button);
    }

    /**
     * Create modal
     */
    createModal() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'tf-modal-overlay';
      
      this.modal = document.createElement('div');
      this.modal.className = 'tf-modal';
      
      this.modal.innerHTML = `
        <div class="tf-modal-header">
          <div>
            <h3 class="tf-modal-title">${this.escapeHtml(this.config.title)}</h3>
            ${this.config.subtitle ? `<p class="tf-modal-subtitle">${this.escapeHtml(this.config.subtitle)}</p>` : ''}
          </div>
          <button class="tf-close-btn" id="tf-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="tf-modal-body">
          <!-- Step 1: NPS -->
          <div id="tf-step-1" class="tf-step">
            <p style="color: #a0a0a0; font-family: Inter, sans-serif; font-size: 14px; margin-bottom: 16px;">
              Como você avalia sua experiência?
            </p>
            <div class="tf-nps-scale">
              ${[0,1,2,3,4,5,6,7,8,9,10].map(n => `
                <button class="tf-nps-btn" data-nps="${n}">${n}</button>
              `).join('')}
            </div>
            <div class="tf-nps-labels">
              <span>Ruim</span>
              <span>Excelente</span>
            </div>
            <button class="tf-submit-btn" id="tf-next-1" style="margin-top: 24px;" disabled>Próximo</button>
          </div>
          
          <!-- Step 2: Feedback Type -->
          <div id="tf-step-2" class="tf-step tf-hidden">
            <p style="color: #a0a0a0; font-family: Inter, sans-serif; font-size: 14px; margin-bottom: 16px;">
              Que tipo de feedback você quer compartilhar?
            </p>
            <div class="tf-type-buttons">
              ${this.config.enableSuggestions ? `
                <button class="tf-type-btn" data-type="suggestion">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                  Sugestão
                </button>
              ` : ''}
              ${this.config.enableBugs ? `
                <button class="tf-type-btn" data-type="bug">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="8" y="6" width="8" height="12" rx="2"/>
                    <line x1="12" y1="12" x2="12" y2="12.01"/>
                    <path d="M8 8h.01"/>
                    <path d="M16 8h.01"/>
                    <path d="M8 16h.01"/>
                    <path d="M16 16h.01"/>
                  </svg>
                  Bug
                </button>
              ` : ''}
            </div>
            <button class="tf-submit-btn" id="tf-next-2" disabled>Próximo</button>
          </div>
          
          <!-- Step 3: Feedback Text -->
          <div id="tf-step-3" class="tf-step tf-hidden">
            <p style="color: #a0a0a0; font-family: Inter, sans-serif; font-size: 14px; margin-bottom: 16px;">
              Conte-nos mais detalhes:
            </p>
            <textarea class="tf-textarea" id="tf-feedback-text" placeholder="Descreva sua experiência..."></textarea>
            <button class="tf-submit-btn" id="tf-submit">Enviar Feedback</button>
          </div>
          
          <!-- Success -->
          <div id="tf-success" class="tf-success tf-hidden">
            <svg class="tf-success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h3 class="tf-success-title">Obrigado!</h3>
            <p class="tf-success-message">${this.escapeHtml(this.config.thankYouMessage)}</p>
          </div>
        </div>
      `;
      
      this.overlay.appendChild(this.modal);
      this.shadow.appendChild(this.overlay);
      
      // Bind events
      this.bindEvents();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
      // Close button
      this.shadow.getElementById('tf-close').addEventListener('click', () => this.closeModal());
      
      // Click outside to close
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.closeModal();
      });
      
      // NPS buttons
      this.shadow.querySelectorAll('.tf-nps-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.selectedNps = parseInt(e.target.dataset.nps);
          this.shadow.querySelectorAll('.tf-nps-btn').forEach(b => b.classList.remove('selected'));
          e.target.classList.add('selected');
          this.shadow.getElementById('tf-next-1').disabled = false;
        });
      });
      
      // Next buttons
      this.shadow.getElementById('tf-next-1').addEventListener('click', () => {
        if (!this.config.enableSuggestions && !this.config.enableBugs) {
          this.goToStep(3);
        } else {
          this.goToStep(2);
        }
      });
      
      this.shadow.getElementById('tf-next-2').addEventListener('click', () => this.goToStep(3));
      
      // Type buttons
      this.shadow.querySelectorAll('.tf-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.feedbackType = e.currentTarget.dataset.type;
          this.shadow.querySelectorAll('.tf-type-btn').forEach(b => b.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
          this.shadow.getElementById('tf-next-2').disabled = false;
        });
      });
      
      // Submit
      this.shadow.getElementById('tf-submit').addEventListener('click', () => this.submitFeedback());
    }

    /**
     * Open modal
     */
    openModal() {
      this.isOpen = true;
      this.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    /**
     * Close modal
     */
    closeModal() {
      this.isOpen = false;
      this.overlay.classList.remove('active');
      document.body.style.overflow = '';
      
      // Reset after animation
      setTimeout(() => {
        this.resetForm();
      }, 200);
    }

    /**
     * Go to specific step
     */
    goToStep(step) {
      this.shadow.querySelectorAll('.tf-step').forEach(el => el.classList.add('tf-hidden'));
      this.shadow.getElementById(`tf-step-${step}`).classList.remove('tf-hidden');
    }

    /**
     * Reset form
     */
    resetForm() {
      this.currentStep = 1;
      this.selectedNps = null;
      this.feedbackType = null;
      
      this.shadow.querySelectorAll('.tf-step').forEach(el => el.classList.add('tf-hidden'));
      this.shadow.getElementById('tf-step-1').classList.remove('tf-hidden');
      this.shadow.getElementById('tf-success').classList.add('tf-hidden');
      
      this.shadow.querySelectorAll('.tf-nps-btn').forEach(b => b.classList.remove('selected'));
      this.shadow.querySelectorAll('.tf-type-btn').forEach(b => b.classList.remove('selected'));
      this.shadow.getElementById('tf-feedback-text').value = '';
      
      this.shadow.getElementById('tf-next-1').disabled = true;
      this.shadow.getElementById('tf-next-2').disabled = true;
    }

    /**
     * Submit feedback
     */
    async submitFeedback() {
      const text = this.shadow.getElementById('tf-feedback-text').value.trim();
      const submitBtn = this.shadow.getElementById('tf-submit');
      
      if (!text) {
        this.shadow.getElementById('tf-feedback-text').focus();
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      
      try {
        const response = await fetch(`${CONFIG.apiUrl}/api/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            widget_key: this.config.widgetKey,
            type: this.feedbackType || 'suggestion',
            nps_score: this.selectedNps,
            content: text,
            page_url: window.location.href,
            user_agent: navigator.userAgent,
          }),
        });
        
        if (response.ok) {
          this.shadow.querySelectorAll('.tf-step').forEach(el => el.classList.add('tf-hidden'));
          this.shadow.getElementById('tf-success').classList.remove('tf-hidden');
          
          setTimeout(() => this.closeModal(), 3000);
        } else {
          throw new Error('Failed to submit');
        }
      } catch (error) {
        console.error('TinyFeedback:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Feedback';
        alert('Erro ao enviar feedback. Tente novamente.');
      }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  /**
   * Initialize widget from data attributes
   */
  function initWidget() {
    const scripts = document.querySelectorAll('script[data-widget-key]');
    
    scripts.forEach(script => {
      const widgetKey = script.dataset.widgetKey;
      if (!widgetKey) return;
      
      // Prevent duplicate initialization
      if (script.dataset.initialized) return;
      script.dataset.initialized = 'true';
      
      // Load config from API
      fetch(`${CONFIG.apiUrl}/api/widget/${widgetKey}/config`)
        .then(res => res.json())
        .then(config => {
          widgetInstance = new TinyFeedbackWidget({
            widgetKey,
            ...config,
          });
        })
        .catch(err => {
          console.error('TinyFeedback: Failed to load config', err);
        });
    });
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  // Expose to global scope for manual initialization
  window.TinyFeedback = {
    init: initWidget,
    Widget: TinyFeedbackWidget,
  };

})();
