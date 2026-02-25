/**
 * Bug Report Modal Component with Attachments
 * Story: ST-05 - Criar Widget Vanilla JS
 * Story: ST-06 - Widget Screenshot e Anexos
 * Story: ST-12: UX Polish - Animações e Acessibilidade
 * 
 * Features:
 * - Smooth animations with reduced motion support
 * - WCAG 2.1 AA compliance
 * - Keyboard navigation
 * - Screen reader support
 */

import { AttachmentUI, AttachmentFile } from '../components/AttachmentUI.js';

export interface BugModalOptions {
  projectId: string;
  apiKey: string;
  apiUrl: string;
  onClose?: () => void;
  onSubmit?: (title: string, description: string, severity: string, attachments: string[]) => void;
  reducedMotion?: boolean;
}

type BugSeverity = 'low' | 'medium' | 'high' | 'critical';

export class BugModal {
  private container: HTMLElement | null = null;
  private modalContent: HTMLElement | null = null;
  private options: BugModalOptions;
  private titleInput: HTMLInputElement | null = null;
  private descriptionTextarea: HTMLTextAreaElement | null = null;
  private selectedSeverity: BugSeverity = 'medium';
  private attachmentUI: AttachmentUI | null = null;
  private previouslyFocusedElement: Element | null = null;
  private isSubmitting: boolean = false;
  private severityButtons: HTMLButtonElement[] = [];

  constructor(options: BugModalOptions) {
    this.options = options;
  }

  /**
   * Open the Bug modal
   */
  public open(): void {
    this.previouslyFocusedElement = document.activeElement;
    this.createModal();
    this.attachEventListeners();
    setTimeout(() => this.titleInput?.focus(), this.options.reducedMotion ? 0 : 100);
  }

  /**
   * Close the Bug modal
   */
  public close(): void {
    if (this.container) {
      // Animate out
      if (!this.options.reducedMotion) {
        this.container.style.opacity = '0';
        this.modalContent?.style.setProperty('transform', 'scale(0.95)');
        
        setTimeout(() => {
          this.cleanup();
        }, 200);
      } else {
        this.cleanup();
      }
    } else {
      this.cleanup();
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.container?.remove();
    this.container = null;
    this.modalContent = null;
    this.severityButtons = [];
    this.attachmentUI?.destroy();
    this.attachmentUI = null;
    
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeydown);
    
    // Return focus
    if (this.previouslyFocusedElement instanceof HTMLElement) {
      setTimeout(() => this.previouslyFocusedElement?.focus(), 0);
    }
    
    this.options.onClose?.();
  }

  /**
   * Create the modal DOM structure
   */
  private createModal(): void {
    this.container = document.createElement('div');
    this.container.id = 'tf-bug-modal';
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-modal', 'true');
    this.container.setAttribute('aria-labelledby', 'tf-bug-title');
    this.container.style.cssText = this.getContainerStyles();

    this.modalContent = document.createElement('div');
    this.modalContent.id = 'tf-bug-content';
    this.modalContent.style.cssText = this.getModalStyles();

    const closeButton = document.createElement('button');
    closeButton.id = 'tf-bug-close';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Fechar modal');
    closeButton.style.cssText = this.getCloseButtonStyles();

    const header = document.createElement('div');
    header.style.cssText = this.getHeaderStyles();
    header.innerHTML = `
      <h3 id="tf-bug-title" style="${this.getTitleStyles()}">
        <span aria-hidden="true">🐛</span> Reportar Bug
      </h3>
      <p id="tf-bug-description" style="${this.getSubtitleStyles()}">
        Encontrou algo errado? Nos ajude a corrigir!
      </p>
    `;

    const formContainer = document.createElement('form');
    formContainer.id = 'tf-bug-form';
    formContainer.setAttribute('aria-describedby', 'tf-bug-description');
    formContainer.style.cssText = this.getFormStyles();
    formContainer.noValidate = true;

    // Severity selector with role="radiogroup"
    const severityGroup = document.createElement('div');
    severityGroup.style.cssText = this.getFieldGroupStyles();
    
    const severityLabel = document.createElement('label');
    severityLabel.style.cssText = this.getLabelStyles();
    severityLabel.textContent = 'Gravidade do problema';
    
    const severityContainer = document.createElement('div');
    severityContainer.id = 'tf-bug-severity-container';
    severityContainer.setAttribute('role', 'radiogroup');
    severityContainer.setAttribute('aria-label', 'Selecione a gravidade do bug');
    severityContainer.style.cssText = this.getSeverityContainerStyles();
    
    const severities: { value: BugSeverity; label: string; color: string; desc: string }[] = [
      { value: 'low', label: 'Baixa', color: '#00ff88', desc: 'Problema menor, não afeta o uso' },
      { value: 'medium', label: 'Média', color: '#ffaa00', desc: 'Problema que atrapalha mas tem workaround' },
      { value: 'high', label: 'Alta', color: '#ff6600', desc: 'Problema grave que dificulta o uso' },
      { value: 'critical', label: 'Crítica', color: '#ff4444', desc: 'Sistema inutilizável' }
    ];
    
    this.severityButtons = [];
    severities.forEach((sev, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tf-bug-severity-btn';
      btn.dataset.severity = sev.value;
      btn.textContent = sev.label;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', sev.value === this.selectedSeverity ? 'true' : 'false');
      btn.setAttribute('aria-label', `${sev.label}: ${sev.desc}`);
      btn.style.cssText = this.getSeverityButtonStyles(sev.value === this.selectedSeverity, sev.color);
      
      this.severityButtons.push(btn);
      severityContainer.appendChild(btn);
    });
    
    severityGroup.appendChild(severityLabel);
    severityGroup.appendChild(severityContainer);

    // Title field
    const titleGroup = document.createElement('div');
    titleGroup.style.cssText = this.getFieldGroupStyles();
    
    const titleLabel = document.createElement('label');
    titleLabel.htmlFor = 'tf-bug-title-input';
    titleLabel.style.cssText = this.getLabelStyles();
    titleLabel.innerHTML = 'Resumo do problema <span style="color: #ff4444;" aria-label="obrigatório">*</span>';
    
    this.titleInput = document.createElement('input');
    this.titleInput.id = 'tf-bug-title-input';
    this.titleInput.type = 'text';
    this.titleInput.placeholder = 'Ex: Botão de login não funciona';
    this.titleInput.required = true;
    this.titleInput.setAttribute('aria-required', 'true');
    this.titleInput.setAttribute('aria-describedby', 'tf-bug-title-error');
    this.titleInput.style.cssText = this.getInputStyles();
    this.titleInput.autocomplete = 'off';

    const titleError = document.createElement('span');
    titleError.id = 'tf-bug-title-error';
    titleError.className = 'visually-hidden';
    titleError.textContent = 'Resumo do problema é obrigatório';

    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(this.titleInput);
    titleGroup.appendChild(titleError);

    // Description field
    const descriptionGroup = document.createElement('div');
    descriptionGroup.style.cssText = this.getFieldGroupStyles();
    
    const descriptionLabel = document.createElement('label');
    descriptionLabel.htmlFor = 'tf-bug-description-input';
    descriptionLabel.style.cssText = this.getLabelStyles();
    descriptionLabel.textContent = 'Descrição detalhada (como reproduzir)';
    
    this.descriptionTextarea = document.createElement('textarea');
    this.descriptionTextarea.id = 'tf-bug-description-input';
    this.descriptionTextarea.placeholder = 'Descreva os passos para reproduzir o problema...';
    this.descriptionTextarea.setAttribute('aria-describedby', 'tf-bug-description-hint');
    this.descriptionTextarea.style.cssText = this.getTextareaStyles();

    const descriptionHint = document.createElement('span');
    descriptionHint.id = 'tf-bug-description-hint';
    descriptionHint.className = 'visually-hidden';
    descriptionHint.textContent = 'Inclua passos para reproduzir o problema, resultado esperado e resultado atual.';

    descriptionGroup.appendChild(descriptionLabel);
    descriptionGroup.appendChild(this.descriptionTextarea);
    descriptionGroup.appendChild(descriptionHint);

    // Attachment UI container
    const attachmentContainer = document.createElement('div');
    attachmentContainer.id = 'tf-bug-attachments';
    attachmentContainer.setAttribute('aria-label', 'Anexos');
    
    // Submit button
    const submitButton = document.createElement('button');
    submitButton.id = 'tf-bug-submit';
    submitButton.type = 'submit';
    submitButton.textContent = 'Enviar Report';
    submitButton.setAttribute('aria-live', 'polite');
    submitButton.style.cssText = this.getSubmitButtonStyles();

    // Live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.id = 'tf-bug-live';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'visually-hidden';

    formContainer.appendChild(severityGroup);
    formContainer.appendChild(titleGroup);
    formContainer.appendChild(descriptionGroup);
    formContainer.appendChild(attachmentContainer);
    formContainer.appendChild(submitButton);

    this.modalContent.appendChild(closeButton);
    this.modalContent.appendChild(header);
    this.modalContent.appendChild(formContainer);
    this.modalContent.appendChild(liveRegion);
    this.container.appendChild(this.modalContent);

    document.body.appendChild(this.container);

    // Initialize Attachment UI after modal is in DOM
    this.attachmentUI = new AttachmentUI({
      container: attachmentContainer,
      apiUrl: this.options.apiUrl,
      apiKey: this.options.apiKey,
      projectId: this.options.projectId,
      maxAttachments: 5,
      reducedMotion: this.options.reducedMotion
    });
    
    // Add accessibility styles
    this.addAccessibilityStyles();
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Severity buttons
    this.severityButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => this.selectSeverity(btn.dataset.severity as BugSeverity));
      
      // Keyboard navigation within radiogroup
      btn.addEventListener('keydown', (e) => {
        let newIndex = index;
        
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            newIndex = index < this.severityButtons.length - 1 ? index + 1 : 0;
            this.severityButtons[newIndex].focus();
            break;
            
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            newIndex = index > 0 ? index - 1 : this.severityButtons.length - 1;
            this.severityButtons[newIndex].focus();
            break;
            
          case 'Home':
            e.preventDefault();
            this.severityButtons[0].focus();
            break;
            
          case 'End':
            e.preventDefault();
            this.severityButtons[this.severityButtons.length - 1].focus();
            break;
            
          case ' ':
          case 'Enter':
            e.preventDefault();
            this.selectSeverity(btn.dataset.severity as BugSeverity);
            break;
        }
      });
    });

    // Form submission
    const form = this.container.querySelector('#tf-bug-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });

    // Close button
    const closeBtn = this.container.querySelector('#tf-bug-close');
    closeBtn?.addEventListener('click', () => this.close());

    // Close on backdrop click
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });

    // Escape key
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
   * Select severity
   */
  private selectSeverity(severity: BugSeverity): void {
    this.selectedSeverity = severity;
    
    const severities: Record<BugSeverity, string> = {
      low: '#00ff88',
      medium: '#ffaa00',
      high: '#ff6600',
      critical: '#ff4444'
    };
    
    this.severityButtons.forEach(btn => {
      const btnSeverity = btn.dataset.severity as BugSeverity;
      const color = severities[btnSeverity];
      const isSelected = btnSeverity === severity;
      btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      btn.style.cssText = this.getSeverityButtonStyles(isSelected, color);
    });
    
    this.announce(`Gravidade selecionada: ${severity}`);
  }

  /**
   * Announce message to screen readers
   */
  private announce(message: string): void {
    const liveRegion = this.container?.querySelector('#tf-bug-live');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }

  /**
   * Submit the bug report
   */
  private async submit(): Promise<void> {
    if (!this.titleInput || this.isSubmitting) return;

    const title = this.titleInput.value.trim();
    const description = this.descriptionTextarea?.value?.trim() || '';

    if (!title) {
      this.showError('O resumo do problema é obrigatório');
      this.titleInput?.focus();
      this.titleInput?.setAttribute('aria-invalid', 'true');
      return;
    }
    
    this.titleInput?.setAttribute('aria-invalid', 'false');

    this.isSubmitting = true;

    // Show loading state
    const submitBtn = this.container?.querySelector('#tf-bug-submit') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      submitBtn.setAttribute('aria-busy', 'true');
    }

    try {
      // Upload attachments first if any
      let attachmentUrls: string[] = [];
      if (this.attachmentUI && this.attachmentUI.getAttachments().length > 0) {
        const handler = this.attachmentUI.getHandler();
        const { urls, errors } = await handler.uploadAttachments();
        
        if (errors.length > 0) {
          console.warn('[TinyFeedback] Some attachments failed:', errors);
          this.announce(`${errors.length} anexo(s) falharam no envio`);
        }
        
        attachmentUrls = urls;
      }

      const response = await fetch(`${this.options.apiUrl}/api/widget/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.options.apiKey
        },
        body: JSON.stringify({
          project_id: this.options.projectId,
          type: 'bug',
          title: title,
          content: `[${this.selectedSeverity.toUpperCase()}] ${description}`,
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          screenshot_url: attachmentUrls.length > 0 ? attachmentUrls[0] : null,
          attachment_urls: attachmentUrls
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
        this.options.onSubmit?.(title, description, this.selectedSeverity, attachmentUrls);
      } else if (response.status === 429) {
        const errorData = await response.json();
        if (errorData.error === 'LIMIT_REACHED') {
          this.showLimitReached(errorData.message);
        } else {
          this.showError('Falha ao enviar report. Tente novamente.');
        }
      } else if (response.status === 403) {
        console.error('[TinyFeedback] Domain not authorized.');
        this.showError('Domínio não autorizado. Verifique as configurações do projeto.');
      } else {
        console.error('Failed to submit bug report');
        this.showError('Falha ao enviar report. Tente novamente.');
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      this.showError('Falha ao enviar report. Tente novamente.');
    } finally {
      this.isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.setAttribute('aria-busy', 'false');
      }
    }
  }

  private showWarning(title: string, detail: string): void {
    if (!this.container) return;
    this.announce(`Aviso: ${title}`);

    const modal = this.container.querySelector('#tf-bug-content');
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

  private showLimitReached(message: string): void {
    if (!this.container) return;
    this.announce(`Limite atingido: ${message}`);

    const modal = this.container.querySelector('#tf-bug-content');
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

  private showError(message: string): void {
    this.announce(`Erro: ${message}`);
    
    const existingError = this.container?.querySelector('#tf-bug-error');
    existingError?.remove();

    const errorDiv = document.createElement('div');
    errorDiv.id = 'tf-bug-error';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.style.cssText = this.getErrorStyles();
    errorDiv.textContent = message;

    const form = this.container?.querySelector('#tf-bug-form');
    form?.insertBefore(errorDiv, form.firstChild);
  }

  private showThankYou(): void {
    if (!this.container) return;
    this.announce('Obrigado! Seu report foi enviado com sucesso.');

    const modal = this.container.querySelector('#tf-bug-content');
    if (modal) {
      modal.innerHTML = `
        <div style="${this.getThankYouStyles()}" role="alert">
          <div style="font-size: 48px; margin-bottom: 16px;" aria-hidden="true">🎉</div>
          <h3 style="${this.getTitleStyles()}">Obrigado!</h3>
          <p style="${this.getSubtitleStyles()}">Seu report foi enviado com sucesso.</p>
        </div>
      `;
    }
    setTimeout(() => this.close(), 2000);
  }

  /**
   * Add accessibility styles
   */
  private addAccessibilityStyles(): void {
    const styleId = 'tf-bug-a11y-styles';
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
      
      /* Focus visible styles */
      #tf-bug-content button:focus-visible,
      #tf-bug-content input:focus-visible,
      #tf-bug-content textarea:focus-visible {
        outline: 3px solid #ff4444;
        outline-offset: 2px;
      }
      
      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        #tf-bug-modal, #tf-bug-content {
          animation: none !important;
          transition: none !important;
        }
      }
      
      /* High contrast mode */
      @media (prefers-contrast: high) {
        #tf-bug-content {
          border: 2px solid currentColor !important;
        }
        #tf-bug-content input,
        #tf-bug-content textarea,
        .tf-bug-severity-btn {
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
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 0 40px rgba(255, 68, 68, 0.1);
      transition: transform 0.2s ease;
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
      transition: color ${this.options.reducedMotion ? '0s' : '0.2s'} ease;
      outline-offset: 2px;
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

  private getFormStyles(): string {
    return `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;
  }

  private getFieldGroupStyles(): string {
    return `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
  }

  private getLabelStyles(): string {
    return `
      font-size: 14px;
      font-weight: 500;
      color: #fff;
    `;
  }

  private getSeverityContainerStyles(): string {
    return `
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    `;
  }

  private getSeverityButtonStyles(selected: boolean, color: string): string {
    return `
      flex: 1;
      min-width: 60px;
      padding: 8px 12px;
      border: 1px solid ${color};
      background: ${selected ? color : 'transparent'};
      color: ${selected ? '#000' : color};
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all ${this.options.reducedMotion ? '0s' : '0.2s'} ease;
      ${selected ? `box-shadow: 0 0 10px ${color}80;` : ''}
      outline-offset: 2px;
    `;
  }

  private getInputStyles(): string {
    return `
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #333;
      background: #111;
      color: #fff;
      font-size: 14px;
      box-sizing: border-box;
      font-family: inherit;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      outline-offset: 2px;
    `;
  }

  private getTextareaStyles(): string {
    return `
      width: 100%;
      min-height: 120px;
      padding: 12px 16px;
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
      margin-top: 8px;
      background: #ff4444;
      color: #fff;
      border: none;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all ${this.options.reducedMotion ? '0s' : '0.2s'} ease;
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
}
