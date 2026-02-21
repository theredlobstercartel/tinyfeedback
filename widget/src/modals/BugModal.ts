/**
 * Bug Report Modal Component
 * Story: ST-05 - Criar Widget Vanilla JS
 */

export interface BugModalOptions {
  projectId: string;
  apiKey: string;
  apiUrl: string;
  onClose?: () => void;
  onSubmit?: (title: string, description: string, severity: string) => void;
}

type BugSeverity = 'low' | 'medium' | 'high' | 'critical';

export class BugModal {
  private container: HTMLElement | null = null;
  private options: BugModalOptions;
  private titleInput: HTMLInputElement | null = null;
  private descriptionTextarea: HTMLTextAreaElement | null = null;
  private selectedSeverity: BugSeverity = 'medium';

  constructor(options: BugModalOptions) {
    this.options = options;
  }

  /**
   * Open the Bug modal
   */
  public open(): void {
    this.createModal();
    this.attachEventListeners();
    setTimeout(() => this.titleInput?.focus(), 100);
  }

  /**
   * Close the Bug modal
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
    this.container = document.createElement('div');
    this.container.id = 'tf-bug-modal';
    this.container.style.cssText = this.getContainerStyles();

    const modal = document.createElement('div');
    modal.id = 'tf-bug-content';
    modal.style.cssText = this.getModalStyles();

    const closeButton = document.createElement('button');
    closeButton.id = 'tf-bug-close';
    closeButton.textContent = '×';
    closeButton.style.cssText = this.getCloseButtonStyles();

    const header = document.createElement('div');
    header.style.cssText = this.getHeaderStyles();
    header.innerHTML = `
      <h3 style="${this.getTitleStyles()}">🐛 Reportar Bug</h3>
      <p style="${this.getSubtitleStyles()}">Encontrou algo errado? Nos ajude a corrigir!</p>
    `;

    const formContainer = document.createElement('form');
    formContainer.id = 'tf-bug-form';
    formContainer.style.cssText = this.getFormStyles();

    // Severity selector
    const severityGroup = document.createElement('div');
    severityGroup.style.cssText = this.getFieldGroupStyles();
    
    const severityLabel = document.createElement('label');
    severityLabel.style.cssText = this.getLabelStyles();
    severityLabel.textContent = 'Gravidade do problema';
    
    const severityContainer = document.createElement('div');
    severityContainer.style.cssText = this.getSeverityContainerStyles();
    
    const severities: { value: BugSeverity; label: string; color: string }[] = [
      { value: 'low', label: 'Baixa', color: '#00ff88' },
      { value: 'medium', label: 'Média', color: '#ffaa00' },
      { value: 'high', label: 'Alta', color: '#ff6600' },
      { value: 'critical', label: 'Crítica', color: '#ff4444' }
    ];
    
    severities.forEach(sev => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tf-bug-severity-btn';
      btn.dataset.severity = sev.value;
      btn.textContent = sev.label;
      btn.style.cssText = this.getSeverityButtonStyles(sev.value === this.selectedSeverity, sev.color);
      severityContainer.appendChild(btn);
    });
    
    severityGroup.appendChild(severityLabel);
    severityGroup.appendChild(severityContainer);

    // Title field
    const titleGroup = document.createElement('div');
    titleGroup.style.cssText = this.getFieldGroupStyles();
    
    const titleLabel = document.createElement('label');
    titleLabel.htmlFor = 'tf-bug-title';
    titleLabel.style.cssText = this.getLabelStyles();
    titleLabel.innerHTML = 'Resumo do problema <span style="color: #ff4444;">*</span>';
    
    this.titleInput = document.createElement('input');
    this.titleInput.id = 'tf-bug-title';
    this.titleInput.type = 'text';
    this.titleInput.placeholder = 'Ex: Botão de login não funciona';
    this.titleInput.required = true;
    this.titleInput.style.cssText = this.getInputStyles();

    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(this.titleInput);

    // Description field
    const descriptionGroup = document.createElement('div');
    descriptionGroup.style.cssText = this.getFieldGroupStyles();
    
    const descriptionLabel = document.createElement('label');
    descriptionLabel.htmlFor = 'tf-bug-description';
    descriptionLabel.style.cssText = this.getLabelStyles();
    descriptionLabel.textContent = 'Descrição detalhada (como reproduzir)';
    
    this.descriptionTextarea = document.createElement('textarea');
    this.descriptionTextarea.id = 'tf-bug-description';
    this.descriptionTextarea.placeholder = 'Descreva os passos para reproduzir o problema...';
    this.descriptionTextarea.style.cssText = this.getTextareaStyles();

    descriptionGroup.appendChild(descriptionLabel);
    descriptionGroup.appendChild(this.descriptionTextarea);

    // Submit button
    const submitButton = document.createElement('button');
    submitButton.id = 'tf-bug-submit';
    submitButton.type = 'submit';
    submitButton.textContent = 'Enviar Report';
    submitButton.style.cssText = this.getSubmitButtonStyles();

    formContainer.appendChild(severityGroup);
    formContainer.appendChild(titleGroup);
    formContainer.appendChild(descriptionGroup);
    formContainer.appendChild(submitButton);

    modal.appendChild(closeButton);
    modal.appendChild(header);
    modal.appendChild(formContainer);
    this.container.appendChild(modal);

    document.body.appendChild(this.container);
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Severity buttons
    const severityBtns = this.container.querySelectorAll('.tf-bug-severity-btn');
    severityBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const severity = (e.target as HTMLButtonElement).dataset.severity as BugSeverity;
        this.selectSeverity(severity);
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

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.container) {
        this.close();
      }
    });
  }

  /**
   * Select severity
   */
  private selectSeverity(severity: BugSeverity): void {
    this.selectedSeverity = severity;
    
    const buttons = this.container?.querySelectorAll('.tf-bug-severity-btn');
    const severities: Record<BugSeverity, string> = {
      low: '#00ff88',
      medium: '#ffaa00',
      high: '#ff6600',
      critical: '#ff4444'
    };
    
    buttons?.forEach(btn => {
      const btnSeverity = (btn as HTMLButtonElement).dataset.severity as BugSeverity;
      const color = severities[btnSeverity];
      (btn as HTMLButtonElement).style.cssText = this.getSeverityButtonStyles(btnSeverity === severity, color);
    });
  }

  /**
   * Submit the bug report
   */
  private async submit(): Promise<void> {
    if (!this.titleInput) return;

    const title = this.titleInput.value.trim();
    const description = this.descriptionTextarea?.value?.trim() || '';

    if (!title) {
      this.showError('O resumo do problema é obrigatório');
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
          type: 'bug',
          title: title,
          content: `[${this.selectedSeverity.toUpperCase()}] ${description}`,
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
        this.options.onSubmit?.(title, description, this.selectedSeverity);
      } else if (response.status === 429) {
        const errorData = await response.json();
        if (errorData.error === 'LIMIT_REACHED') {
          this.showLimitReached(errorData.message);
        } else {
          this.showError('Falha ao enviar report. Tente novamente.');
        }
      } else if (response.status === 403) {
        console.error('[TinyFeedback] Domain not authorized. Check your allowed domains configuration.');
        this.showError('Domínio não autorizado. Verifique as configurações do projeto.');
      } else {
        console.error('Failed to submit bug report');
        this.showError('Falha ao enviar report. Tente novamente.');
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      this.showError('Falha ao enviar report. Tente novamente.');
    }
  }

  private showWarning(title: string, detail: string): void {
    if (!this.container) return;
    const modal = this.container.querySelector('#tf-bug-content');
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

  private showLimitReached(message: string): void {
    if (!this.container) return;
    const modal = this.container.querySelector('#tf-bug-content');
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
    setTimeout(() => this.close(), 5000);
  }

  private showError(message: string): void {
    const existingError = this.container?.querySelector('#tf-bug-error');
    existingError?.remove();

    const errorDiv = document.createElement('div');
    errorDiv.id = 'tf-bug-error';
    errorDiv.style.cssText = this.getErrorStyles();
    errorDiv.textContent = message;

    const form = this.container?.querySelector('#tf-bug-form');
    form?.insertBefore(errorDiv, form.firstChild);
  }

  private showThankYou(): void {
    if (!this.container) return;
    const modal = this.container.querySelector('#tf-bug-content');
    if (modal) {
      modal.innerHTML = `
        <div style="${this.getThankYouStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
          <h3 style="${this.getTitleStyles()}">Obrigado!</h3>
          <p style="${this.getSubtitleStyles()}">Seu report foi enviado com sucesso.</p>
        </div>
      `;
    }
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
      box-shadow: 0 0 40px rgba(255, 68, 68, 0.1);
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
      transition: all 0.2s ease;
      ${selected ? `box-shadow: 0 0 10px ${color}80;` : ''}
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
