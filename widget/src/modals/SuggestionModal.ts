/**
 * Suggestion Modal Component
 * Story: ST-07 - Implementar Modal de Sugestão
 */

export interface SuggestionModalOptions {
  projectId: string;
  apiKey: string;
  apiUrl: string;
  onClose?: () => void;
  onSubmit?: (title: string, description?: string) => void;
}

export class SuggestionModal {
  private container: HTMLElement | null = null;
  private options: SuggestionModalOptions;
  private titleInput: HTMLInputElement | null = null;
  private descriptionTextarea: HTMLTextAreaElement | null = null;

  constructor(options: SuggestionModalOptions) {
    this.options = options;
  }

  /**
   * Open the Suggestion modal
   */
  public open(): void {
    this.createModal();
    this.attachEventListeners();
    // Focus on title input after opening
    setTimeout(() => this.titleInput?.focus(), 100);
  }

  /**
   * Close the Suggestion modal
   */
  public close(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.options.onClose?.();
  }

  /**
   * Create the modal DOM structure
   */
  private createModal(): void {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'tf-suggestion-modal';
    this.container.style.cssText = this.getContainerStyles();

    // Create modal content
    const modal = document.createElement('div');
    modal.id = 'tf-suggestion-content';
    modal.style.cssText = this.getModalStyles();

    // Close button
    const closeButton = document.createElement('button');
    closeButton.id = 'tf-suggestion-close';
    closeButton.textContent = '×';
    closeButton.style.cssText = this.getCloseButtonStyles();

    // Header
    const header = document.createElement('div');
    header.style.cssText = this.getHeaderStyles();
    header.innerHTML = `
      <h3 style="${this.getTitleStyles()}">💡 Sugestão de Feature</h3>
      <p style="${this.getSubtitleStyles()}">Tem uma ideia para melhorar nosso produto? Conta pra gente!</p>
    `;

    // Form container
    const formContainer = document.createElement('form');
    formContainer.id = 'tf-suggestion-form';
    formContainer.style.cssText = this.getFormStyles();

    // Title field (required)
    const titleGroup = document.createElement('div');
    titleGroup.style.cssText = this.getFieldGroupStyles();
    
    const titleLabel = document.createElement('label');
    titleLabel.htmlFor = 'tf-suggestion-title';
    titleLabel.style.cssText = this.getLabelStyles();
    titleLabel.innerHTML = 'Título da sugestão <span style="color: #ff4444;">*</span>';
    
    this.titleInput = document.createElement('input');
    this.titleInput.id = 'tf-suggestion-title';
    this.titleInput.type = 'text';
    this.titleInput.placeholder = 'Ex: Adicionar modo escuro';
    this.titleInput.required = true;
    this.titleInput.style.cssText = this.getInputStyles();

    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(this.titleInput);

    // Description field (optional)
    const descriptionGroup = document.createElement('div');
    descriptionGroup.style.cssText = this.getFieldGroupStyles();
    
    const descriptionLabel = document.createElement('label');
    descriptionLabel.htmlFor = 'tf-suggestion-description';
    descriptionLabel.style.cssText = this.getLabelStyles();
    descriptionLabel.textContent = 'Descrição (opcional)';
    
    this.descriptionTextarea = document.createElement('textarea');
    this.descriptionTextarea.id = 'tf-suggestion-description';
    this.descriptionTextarea.placeholder = 'Descreva sua sugestão em detalhes...';
    this.descriptionTextarea.style.cssText = this.getTextareaStyles();

    descriptionGroup.appendChild(descriptionLabel);
    descriptionGroup.appendChild(this.descriptionTextarea);

    // Submit button
    const submitButton = document.createElement('button');
    submitButton.id = 'tf-suggestion-submit';
    submitButton.type = 'submit';
    submitButton.textContent = 'Enviar Sugestão';
    submitButton.style.cssText = this.getSubmitButtonStyles();

    // Assemble form
    formContainer.appendChild(titleGroup);
    formContainer.appendChild(descriptionGroup);
    formContainer.appendChild(submitButton);

    // Assemble modal
    modal.appendChild(closeButton);
    modal.appendChild(header);
    modal.appendChild(formContainer);
    this.container.appendChild(modal);

    // Add to document
    document.body.appendChild(this.container);
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Form submission
    const form = this.container.querySelector('#tf-suggestion-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });

    // Close button
    const closeBtn = this.container.querySelector('#tf-suggestion-close');
    closeBtn?.addEventListener('click', () => this.close());

    // Close on backdrop click
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.container) {
        this.close();
      }
    });
  }

  /**
   * Submit the suggestion
   */
  private async submit(): Promise<void> {
    if (!this.titleInput) return;

    const title = this.titleInput.value.trim();
    const description = this.descriptionTextarea?.value?.trim() || '';

    // AC-01: Validate title is required
    if (!title) {
      this.showError('O título é obrigatório');
      this.titleInput?.focus();
      return;
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
          type: 'suggestion',
          title: title,
          content: description,
          page_url: window.location.href,
          user_agent: navigator.userAgent
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // AC-02: Show warning if approaching limit
        if (data.warning) {
          this.showWarning(data.warning.message, data.warning.detail);
          // Still close after showing warning briefly
          setTimeout(() => this.close(), 3000);
          return;
        }
        
        this.showThankYou();
        this.options.onSubmit?.(title, description);
      } else if (response.status === 429) {
        // AC-03: Handle limit reached
        const errorData = await response.json();
        if (errorData.error === 'LIMIT_REACHED') {
          this.showLimitReached(errorData.message);
        } else {
          this.showError('Falha ao enviar sugestão. Tente novamente.');
        }
      } else {
        console.error('Failed to submit suggestion');
        this.showError('Falha ao enviar sugestão. Tente novamente.');
      }
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      this.showError('Falha ao enviar sugestão. Tente novamente.');
    }
  }

  /**
   * Show warning message
   */
  private showWarning(title: string, detail: string): void {
    if (!this.container) return;

    const modal = this.container.querySelector('#tf-suggestion-content');
    if (modal) {
      modal.innerHTML = `
        <div style="${this.getWarningStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h3 style="${this.getTitleStyles()}">${title}</h3>
          <p style="${this.getSubtitleStyles()}">${detail}</p>
        </div>
      `;
    }
  }

  /**
   * Show limit reached message (AC-03)
   */
  private showLimitReached(message: string): void {
    if (!this.container) return;

    const modal = this.container.querySelector('#tf-suggestion-content');
    if (modal) {
      modal.innerHTML = `
        <div style="${this.getLimitReachedStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">🚫</div>
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

    // Auto close after 5 seconds
    setTimeout(() => this.close(), 5000);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    // Remove any existing error
    const existingError = this.container?.querySelector('#tf-suggestion-error');
    existingError?.remove();

    const errorDiv = document.createElement('div');
    errorDiv.id = 'tf-suggestion-error';
    errorDiv.style.cssText = this.getErrorStyles();
    errorDiv.textContent = message;

    const form = this.container?.querySelector('#tf-suggestion-form');
    form?.insertBefore(errorDiv, form.firstChild);
  }

  /**
   * Show thank you message
   */
  private showThankYou(): void {
    if (!this.container) return;

    const modal = this.container.querySelector('#tf-suggestion-content');
    if (modal) {
      modal.innerHTML = `
        <div style="${this.getThankYouStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
          <h3 style="${this.getTitleStyles()}">Obrigado!</h3>
          <p style="${this.getSubtitleStyles()}">Sua sugestão foi enviada com sucesso.</p>
        </div>
      `;
    }

    // Auto close after 2 seconds
    setTimeout(() => this.close(), 2000);
  }

  // ==================== STYLES ====================

  private getContainerStyles(): string {
    return `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
    `;
  }

  private getSubmitButtonStyles(): string {
    return `
      width: 100%;
      padding: 14px;
      margin-top: 8px;
      background: #00ff88;
      color: #000;
      border: none;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
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
    `;
  }
}
