/**
 * NPS Modal Component
 * Story: ST-06 - Implementar Modal de NPS
 * Story: ST-12: UX Polish - Animações e Acessibilidade
 * 
 * Features:
 * - Smooth animations with reduced motion support
 * - WCAG 2.1 AA compliance
 * - Keyboard navigation
 * - Screen reader support
 */

export interface NPSModalOptions {
  projectId: string;
  apiKey: string;
  apiUrl: string;
  onClose?: () => void;
  onSubmit?: (score: number, comment?: string) => void;
  reducedMotion?: boolean;
}

export class NPSModal {
  private container: HTMLElement | null = null;
  private modalContent: HTMLElement | null = null;
  private selectedScore: number | null = null;
  private options: NPSModalOptions;
  private ratingButtons: HTMLButtonElement[] = [];
  private previouslyFocusedElement: Element | null = null;
  private isSubmitting: boolean = false;

  constructor(options: NPSModalOptions) {
    this.options = options;
  }

  /**
   * Open the NPS modal
   */
  public open(): void {
    this.previouslyFocusedElement = document.activeElement;
    this.createModal();
    this.attachEventListeners();
    
    // Focus management: focus first focusable element or modal itself
    setTimeout(() => {
      if (this.modalContent) {
        const focusable = this.getFirstFocusable();
        if (focusable) {
          focusable.focus();
        } else {
          this.modalContent.setAttribute('tabindex', '-1');
          this.modalContent.focus();
        }
      }
    }, this.options.reducedMotion ? 0 : 100);
  }

  /**
   * Close the NPS modal
   */
  public close(): void {
    if (this.container) {
      // Animate out
      if (!this.options.reducedMotion) {
        this.container.style.opacity = '0';
        this.modalContent?.style.setProperty('transform', 'scale(0.95)');
        
        setTimeout(() => {
          this.container?.remove();
          this.container = null;
          this.modalContent = null;
          this.ratingButtons = [];
        }, 200);
      } else {
        this.container.remove();
        this.container = null;
        this.modalContent = null;
        this.ratingButtons = [];
      }
    }
    
    // Return focus to previously focused element
    if (this.previouslyFocusedElement instanceof HTMLElement) {
      setTimeout(() => this.previouslyFocusedElement?.focus(), 0);
    }
    
    this.options.onClose?.();
  }

  /**
   * Create the modal DOM structure
   */
  private createModal(): void {
    // Create container (backdrop)
    this.container = document.createElement('div');
    this.container.id = 'tf-nps-modal';
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-modal', 'true');
    this.container.setAttribute('aria-labelledby', 'tf-nps-title');
    this.container.style.cssText = this.getContainerStyles();

    // Create modal content
    this.modalContent = document.createElement('div');
    this.modalContent.id = 'tf-nps-content';
    this.modalContent.style.cssText = this.getModalStyles();

    // Close button
    const closeButton = document.createElement('button');
    closeButton.id = 'tf-nps-close';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Fechar modal');
    closeButton.style.cssText = this.getCloseButtonStyles();

    // Header
    const header = document.createElement('div');
    header.style.cssText = this.getHeaderStyles();
    header.innerHTML = `
      <h3 id="tf-nps-title" style="${this.getTitleStyles()}">
        How likely are you to recommend us?
      </h3>
      <p id="tf-nps-description" style="${this.getSubtitleStyles()}">
        Rate from 0 (not likely) to 10 (very likely)
      </p>
    `;

    // Scale container with role="radiogroup"
    const scaleContainer = document.createElement('div');
    scaleContainer.id = 'tf-nps-scale';
    scaleContainer.setAttribute('role', 'radiogroup');
    scaleContainer.setAttribute('aria-label', 'NPS Score, 0 a 10');
    scaleContainer.style.cssText = this.getScaleContainerStyles();

    // Create rating buttons 0-10
    this.ratingButtons = [];
    for (let i = 0; i <= 10; i++) {
      const button = this.createRatingButton(i);
      this.ratingButtons.push(button);
      scaleContainer.appendChild(button);
    }

    // Comment section (hidden initially)
    const commentSection = document.createElement('div');
    commentSection.id = 'tf-nps-comment-section';
    commentSection.setAttribute('role', 'region');
    commentSection.setAttribute('aria-label', 'Comentário adicional');
    commentSection.style.cssText = this.getCommentSectionStyles();
    commentSection.style.display = 'none';
    
    const commentLabel = document.createElement('label');
    commentLabel.htmlFor = 'tf-nps-comment';
    commentLabel.style.cssText = this.getCommentLabelStyles();
    commentLabel.textContent = 'Tell us more about your experience (optional)';
    
    const textarea = document.createElement('textarea');
    textarea.id = 'tf-nps-comment';
    textarea.setAttribute('aria-describedby', 'tf-nps-comment-hint');
    textarea.placeholder = 'Your feedback helps us improve...';
    textarea.style.cssText = this.getTextareaStyles();
    
    const commentHint = document.createElement('span');
    commentHint.id = 'tf-nps-comment-hint';
    commentHint.className = 'visually-hidden';
    commentHint.textContent = 'Pressione Tab para navegar para o botão enviar';
    
    commentSection.appendChild(commentLabel);
    commentSection.appendChild(textarea);
    commentSection.appendChild(commentHint);

    // Submit button
    const submitButton = document.createElement('button');
    submitButton.id = 'tf-nps-submit';
    submitButton.textContent = 'Send Feedback';
    submitButton.setAttribute('aria-live', 'polite');
    submitButton.style.cssText = this.getSubmitButtonStyles();
    submitButton.style.display = 'none';

    // Live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.id = 'tf-nps-live';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'visually-hidden';

    // Assemble modal
    this.modalContent.appendChild(closeButton);
    this.modalContent.appendChild(header);
    this.modalContent.appendChild(scaleContainer);
    this.modalContent.appendChild(commentSection);
    this.modalContent.appendChild(submitButton);
    this.modalContent.appendChild(liveRegion);
    this.container.appendChild(this.modalContent);

    // Add to document
    document.body.appendChild(this.container);
    
    // Add visually-hidden styles if not present
    this.addAccessibilityStyles();
  }

  /**
   * Create a rating button
   */
  private createRatingButton(score: number): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'tf-nps-rating-btn';
    button.dataset.score = score.toString();
    button.textContent = score.toString();
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');
    button.setAttribute('aria-label', `Nota ${score}`);
    button.style.cssText = this.getRatingButtonStyles(score);
    
    // Add descriptive labels for extremes
    if (score === 0) {
      button.setAttribute('aria-label', 'Nota 0, Nada provável');
    } else if (score === 10) {
      button.setAttribute('aria-label', 'Nota 10, Muito provável');
    }
    
    return button;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Rating buttons
    this.ratingButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => this.selectScore(index));
      
      // Keyboard navigation within radiogroup
      btn.addEventListener('keydown', (e) => {
        let newIndex = index;
        
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            newIndex = index < 10 ? index + 1 : 0;
            this.ratingButtons[newIndex].focus();
            break;
            
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            newIndex = index > 0 ? index - 1 : 10;
            this.ratingButtons[newIndex].focus();
            break;
            
          case 'Home':
            e.preventDefault();
            this.ratingButtons[0].focus();
            break;
            
          case 'End':
            e.preventDefault();
            this.ratingButtons[10].focus();
            break;
            
          case ' ':
          case 'Enter':
            e.preventDefault();
            this.selectScore(index);
            break;
        }
      });
    });

    // Submit button
    const submitBtn = this.container.querySelector('#tf-nps-submit');
    submitBtn?.addEventListener('click', () => this.submit());

    // Close button
    const closeBtn = this.container.querySelector('#tf-nps-close');
    closeBtn?.addEventListener('click', () => this.close());

    // Close on backdrop click
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', this.handleKeydown);
    
    // Focus trap
    this.container.addEventListener('keydown', this.handleFocusTrap);
  }

  /**
   * Handle global keydown events
   */
  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.container) {
      e.preventDefault();
      this.close();
    }
  };

  /**
   * Handle focus trap within modal
   */
  private handleFocusTrap = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab' || !this.container) return;
    
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  /**
   * Get all focusable elements within the modal
   */
  private getFocusableElements(): HTMLElement[] {
    if (!this.container) return [];
    
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    
    return Array.from(this.container.querySelectorAll(selector));
  }

  /**
   * Get first focusable element
   */
  private getFirstFocusable(): HTMLElement | null {
    const elements = this.getFocusableElements();
    return elements[0] || null;
  }

  /**
   * Select a score
   */
  private selectScore(score: number): void {
    this.selectedScore = score;

    // Update ARIA and styles
    this.ratingButtons.forEach((btn, index) => {
      const isSelected = index === score;
      btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      
      if (isSelected) {
        btn.style.cssText = this.getSelectedRatingButtonStyles(score);
      } else {
        btn.style.cssText = this.getRatingButtonStyles(index);
      }
    });

    // Show comment section and submit button with animation
    const commentSection = this.container?.querySelector('#tf-nps-comment-section') as HTMLElement | null;
    const submitButton = this.container?.querySelector('#tf-nps-submit') as HTMLElement | null;
    
    if (commentSection) {
      commentSection.style.display = 'block';
      if (!this.options.reducedMotion) {
        commentSection.style.animation = 'tf-fade-in 0.3s ease-out';
      }
    }
    
    if (submitButton) {
      submitButton.style.display = 'block';
      if (!this.options.reducedMotion) {
        submitButton.style.animation = 'tf-fade-in 0.3s ease-out';
      }
    }
    
    // Announce selection to screen readers
    this.announce(`Nota ${score} selecionada`);
    
    // Focus the textarea after selection
    setTimeout(() => {
      const textarea = this.container?.querySelector('#tf-nps-comment') as HTMLTextAreaElement;
      textarea?.focus();
    }, this.options.reducedMotion ? 0 : 200);
  }

  /**
   * Announce message to screen readers
   */
  private announce(message: string): void {
    const liveRegion = this.container?.querySelector('#tf-nps-live');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }

  /**
   * Submit the NPS feedback
   */
  private async submit(): Promise<void> {
    if (this.selectedScore === null || this.isSubmitting) return;

    this.isSubmitting = true;
    const commentTextarea = this.container?.querySelector('#tf-nps-comment') as HTMLTextAreaElement;
    const comment = commentTextarea?.value?.trim();

    // Show loading state
    const submitBtn = this.container?.querySelector('#tf-nps-submit') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      submitBtn.setAttribute('aria-busy', 'true');
    }

    try {
      const response = await fetch(`${this.options.apiUrl}/api/widget/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.options.apiKey
        },
        body: JSON.stringify({
          project_id: this.options.projectId,
          type: 'nps',
          nps_score: this.selectedScore,
          content: comment || '',
          page_url: window.location.href,
          user_agent: navigator.userAgent
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.warning) {
          this.showWarning(data.warning.message, data.warning.detail);
          setTimeout(() => this.close(), 3000);
          return;
        }
        
        this.showThankYou();
        this.options.onSubmit?.(this.selectedScore, comment);
      } else if (response.status === 429) {
        const errorData = await response.json();
        if (errorData.error === 'LIMIT_REACHED') {
          this.showLimitReached(errorData.message);
        } else {
          this.showError('Failed to submit feedback. Please try again.');
        }
      } else {
        console.error('Failed to submit NPS feedback');
        this.showError('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting NPS:', error);
      this.showError('Failed to submit feedback. Please try again.');
    } finally {
      this.isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.setAttribute('aria-busy', 'false');
      }
    }
  }

  /**
   * Show warning message
   */
  private showWarning(title: string, detail: string): void {
    if (!this.container) return;
    this.announce(`Aviso: ${title}`);

    const modal = this.container.querySelector('#tf-nps-content');
    if (modal) {
      modal.innerHTML = `
        <div style="${this.getWarningStyles()}" role="alert">
          <div style="font-size: 48px; margin-bottom: 16px;" aria-hidden="true">⚠️</div>
          <h3 style="${this.getTitleStyles()}">${title}</h3>
          <p style="${this.getSubtitleStyles()}">${detail}</p>
        </div>
      `;
    }
  }

  /**
   * Show limit reached message
   */
  private showLimitReached(message: string): void {
    if (!this.container) return;
    this.announce(`Limite atingido: ${message}`);

    const modal = this.container.querySelector('#tf-nps-content');
    if (modal) {
      modal.innerHTML = `
        <div style="${this.getLimitReachedStyles()}" role="alert">
          <div style="font-size: 48px; margin-bottom: 16px;" aria-hidden="true">🚫</div>
          <h3 style="${this.getTitleStyles()}">Limite Atingido</h3>
          <p style="${this.getSubtitleStyles()}">${message}</p>
          <button 
            onclick="window.open('/billing', '_blank')"
            style="${this.getUpgradeButtonStyles()}"
          >
            Fazer Upgrade
          </button>
        </div>
      `;
    }

    setTimeout(() => this.close(), 5000);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.announce(`Erro: ${message}`);
    
    const existingError = this.container?.querySelector('#tf-nps-error');
    existingError?.remove();

    const errorDiv = document.createElement('div');
    errorDiv.id = 'tf-nps-error';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.style.cssText = this.getErrorStyles();
    errorDiv.textContent = message;

    const modal = this.container?.querySelector('#tf-nps-content');
    modal?.insertBefore(errorDiv, modal.firstChild);
  }

  /**
   * Show thank you message
   */
  private showThankYou(): void {
    if (!this.container) return;
    this.announce('Obrigado! Seu feedback foi enviado com sucesso.');

    const modal = this.container.querySelector('#tf-nps-content');
    if (modal) {
      modal.innerHTML = `
        <div style="${this.getThankYouStyles()}" role="alert">
          <div style="font-size: 48px; margin-bottom: 16px;" aria-hidden="true">🎉</div>
          <h3 style="${this.getTitleStyles()}">Thank you!</h3>
          <p style="${this.getSubtitleStyles()}">Your feedback helps us improve.</p>
        </div>
      `;
    }

    setTimeout(() => this.close(), 2000);
  }

  /**
   * Add accessibility styles
   */
  private addAccessibilityStyles(): void {
    const styleId = 'tf-nps-a11y-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      @keyframes tf-fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes tf-modal-appear {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      
      /* Focus visible styles */
      #tf-nps-content button:focus-visible,
      #tf-nps-content input:focus-visible,
      #tf-nps-content textarea:focus-visible {
        outline: 3px solid #00ff88;
        outline-offset: 2px;
      }
      
      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        #tf-nps-modal, #tf-nps-content {
          animation: none !important;
          transition: none !important;
        }
      }
      
      /* High contrast mode */
      @media (prefers-contrast: high) {
        .tf-nps-rating-btn {
          border: 2px solid currentColor !important;
        }
      }
    `;
    document.head?.appendChild(style);
  }

  // ==================== STYLES ====================

  private getContainerStyles(): string {
    const animation = this.options.reducedMotion 
      ? '' 
      : 'animation: tf-modal-appear 0.2s ease-out;';
    
    return `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: opacity 0.2s ease;
      ${animation}
    `;
  }

  private getModalStyles(): string {
    return `
      background: #000;
      border: 1px solid #333;
      padding: 32px;
      max-width: 500px;
      width: 90%;
      position: relative;
      box-shadow: 0 0 40px rgba(0, 255, 136, 0.1);
      transition: transform 0.2s ease;
    `;
  }

  private getHeaderStyles(): string {
    return `
      text-align: center;
      margin-bottom: 24px;
    `;
  }

  private getTitleStyles(): string {
    return `
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #fff;
    `;
  }

  private getSubtitleStyles(): string {
    return `
      margin: 0;
      font-size: 14px;
      color: #888;
    `;
  }

  private getScaleContainerStyles(): string {
    return `
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    `;
  }

  private getRatingButtonStyles(score: number): string {
    const color = this.getScoreColor(score);
    return `
      width: 36px;
      height: 36px;
      border: 1px solid ${color};
      background: transparent;
      color: ${color};
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all ${this.options.reducedMotion ? '0s' : '0.2s'} ease;
      display: flex;
      align-items: center;
      justify-content: center;
      outline-offset: 2px;
    `;
  }

  private getSelectedRatingButtonStyles(score: number): string {
    const color = this.getScoreColor(score);
    return `
      width: 36px;
      height: 36px;
      border: 1px solid ${color};
      background: ${color};
      color: #000;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all ${this.options.reducedMotion ? '0s' : '0.2s'} ease;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px ${color}80;
      outline-offset: 2px;
    `;
  }

  private getScoreColor(score: number): string {
    if (score <= 6) return '#ff4444';
    if (score <= 8) return '#ffaa00';
    return '#00ff88';
  }

  private getCommentSectionStyles(): string {
    return `
      margin-bottom: 20px;
    `;
  }
  
  private getCommentLabelStyles(): string {
    return `
      display: block;
      font-size: 14px;
      color: #fff;
      margin-bottom: 8px;
      font-weight: 500;
    `;
  }

  private getTextareaStyles(): string {
    return `
      width: 100%;
      min-height: 80px;
      padding: 12px;
      border: 1px solid #333;
      background: #111;
      color: #fff;
      font-size: 14px;
      resize: vertical;
      box-sizing: border-box;
      font-family: inherit;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      outline-offset: 2px;
    `;
  }

  private getSubmitButtonStyles(): string {
    return `
      width: 100%;
      padding: 14px;
      background: #00ff88;
      color: #000;
      border: none;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all ${this.options.reducedMotion ? '0s' : '0.2s'} ease;
      outline-offset: 2px;
    `;
  }

  private getCloseButtonStyles(): string {
    return `
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      background: transparent;
      border: none;
      color: #888;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s ease;
      outline-offset: 2px;
    `;
  }

  private getThankYouStyles(): string {
    return `
      text-align: center;
      padding: 40px 20px;
    `;
  }
  
  private getWarningStyles(): string {
    return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ffaa00;
      background: rgba(255, 170, 0, 0.1);
    `;
  }

  private getLimitReachedStyles(): string {
    return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ff4444;
      background: rgba(255, 68, 68, 0.1);
    `;
  }

  private getUpgradeButtonStyles(): string {
    return `
      margin-top: 20px;
      padding: 12px 24px;
      background: #ffd700;
      color: #000;
      border: none;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      outline-offset: 2px;
    `;
  }

  private getErrorStyles(): string {
    return `
      padding: 12px 16px;
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid #ff4444;
      color: #ff4444;
      font-size: 14px;
      margin-bottom: 16px;
    `;
  }
}
