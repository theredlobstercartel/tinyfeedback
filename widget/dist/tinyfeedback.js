var TinyFeedback = (function (exports) {
    'use strict';

    /**
     * NPS Modal Component
     * Story: ST-06 - Implementar Modal de NPS
     */
    class NPSModal {
        constructor(options) {
            this.container = null;
            this.selectedScore = null;
            this.options = options;
        }
        /**
         * Open the NPS modal
         */
        open() {
            this.createModal();
            this.attachEventListeners();
        }
        /**
         * Close the NPS modal
         */
        close() {
            if (this.container) {
                this.container.remove();
                this.container = null;
            }
            this.options.onClose?.();
        }
        /**
         * Create the modal DOM structure
         */
        createModal() {
            // Create container
            this.container = document.createElement('div');
            this.container.id = 'tf-nps-modal';
            this.container.style.cssText = this.getContainerStyles();
            // Create modal content
            const modal = document.createElement('div');
            modal.id = 'tf-nps-content';
            modal.style.cssText = this.getModalStyles();
            // Header
            const header = document.createElement('div');
            header.style.cssText = this.getHeaderStyles();
            header.innerHTML = `
      <h3 style="${this.getTitleStyles()}">How likely are you to recommend us?</h3>
      <p style="${this.getSubtitleStyles()}">Rate from 0 (not likely) to 10 (very likely)</p>
    `;
            // Scale container
            const scaleContainer = document.createElement('div');
            scaleContainer.id = 'tf-nps-scale';
            scaleContainer.style.cssText = this.getScaleContainerStyles();
            // Create rating buttons 0-10
            for (let i = 0; i <= 10; i++) {
                const button = this.createRatingButton(i);
                scaleContainer.appendChild(button);
            }
            // Comment section (hidden initially)
            const commentSection = document.createElement('div');
            commentSection.id = 'tf-nps-comment-section';
            commentSection.style.cssText = this.getCommentSectionStyles();
            commentSection.style.display = 'none';
            commentSection.innerHTML = `
      <textarea 
        id="tf-nps-comment" 
        placeholder="Tell us more about your experience (optional)"
        style="${this.getTextareaStyles()}"
      ></textarea>
    `;
            // Submit button
            const submitButton = document.createElement('button');
            submitButton.id = 'tf-nps-submit';
            submitButton.textContent = 'Send Feedback';
            submitButton.style.cssText = this.getSubmitButtonStyles();
            submitButton.style.display = 'none';
            // Close button
            const closeButton = document.createElement('button');
            closeButton.id = 'tf-nps-close';
            closeButton.textContent = '×';
            closeButton.style.cssText = this.getCloseButtonStyles();
            // Assemble modal
            modal.appendChild(closeButton);
            modal.appendChild(header);
            modal.appendChild(scaleContainer);
            modal.appendChild(commentSection);
            modal.appendChild(submitButton);
            this.container.appendChild(modal);
            // Add to document
            document.body.appendChild(this.container);
        }
        /**
         * Create a rating button
         */
        createRatingButton(score) {
            const button = document.createElement('button');
            button.className = 'tf-nps-rating-btn';
            button.dataset.score = score.toString();
            button.textContent = score.toString();
            button.style.cssText = this.getRatingButtonStyles(score);
            return button;
        }
        /**
         * Attach event listeners
         */
        attachEventListeners() {
            if (!this.container)
                return;
            // Rating buttons
            const ratingButtons = this.container.querySelectorAll('.tf-nps-rating-btn');
            ratingButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const score = parseInt(e.target.dataset.score || '0');
                    this.selectScore(score);
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
        }
        /**
         * Select a score
         */
        selectScore(score) {
            this.selectedScore = score;
            // Update button styles
            const buttons = this.container?.querySelectorAll('.tf-nps-rating-btn');
            buttons?.forEach(btn => {
                const btnScore = parseInt(btn.dataset.score || '0');
                if (btnScore === score) {
                    btn.style.cssText = this.getSelectedRatingButtonStyles(score);
                }
                else {
                    btn.style.cssText = this.getRatingButtonStyles(btnScore);
                }
            });
            // Show comment section and submit button
            const commentSection = this.container?.querySelector('#tf-nps-comment-section');
            const submitButton = this.container?.querySelector('#tf-nps-submit');
            if (commentSection)
                commentSection.style.display = 'block';
            if (submitButton)
                submitButton.style.display = 'block';
        }
        /**
         * Submit the NPS feedback
         */
        async submit() {
            if (this.selectedScore === null)
                return;
            const commentTextarea = this.container?.querySelector('#tf-nps-comment');
            const comment = commentTextarea?.value?.trim();
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
                    // AC-02: Show warning if approaching limit
                    if (data.warning) {
                        this.showWarning(data.warning.message, data.warning.detail);
                        // Still close after showing warning briefly
                        setTimeout(() => this.close(), 3000);
                        return;
                    }
                    this.showThankYou();
                    this.options.onSubmit?.(this.selectedScore, comment);
                }
                else if (response.status === 429) {
                    // AC-03: Handle limit reached
                    const errorData = await response.json();
                    if (errorData.error === 'LIMIT_REACHED') {
                        this.showLimitReached(errorData.message);
                    }
                    else {
                        alert('Failed to submit feedback. Please try again.');
                    }
                }
                else {
                    console.error('Failed to submit NPS feedback');
                    alert('Failed to submit feedback. Please try again.');
                }
            }
            catch (error) {
                console.error('Error submitting NPS:', error);
                alert('Failed to submit feedback. Please try again.');
            }
        }
        /**
         * Show warning message
         */
        showWarning(title, detail) {
            if (!this.container)
                return;
            const modal = this.container.querySelector('#tf-nps-content');
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
        showLimitReached(message) {
            if (!this.container)
                return;
            const modal = this.container.querySelector('#tf-nps-content');
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
        getWarningStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ffaa00;
      background: rgba(255, 170, 0, 0.1);
    `;
        }
        getLimitReachedStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ff4444;
      background: rgba(255, 68, 68, 0.1);
    `;
        }
        getUpgradeButtonStyles() {
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
        /**
         * Show thank you message
         */
        showThankYou() {
            if (!this.container)
                return;
            const modal = this.container.querySelector('#tf-nps-content');
            if (modal) {
                modal.innerHTML = `
        <div style="${this.getThankYouStyles()}">
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
          <h3 style="${this.getTitleStyles()}">Thank you!</h3>
          <p style="${this.getSubtitleStyles()}">Your feedback helps us improve.</p>
        </div>
      `;
            }
            // Auto close after 2 seconds
            setTimeout(() => this.close(), 2000);
        }
        // ==================== STYLES ====================
        getContainerStyles() {
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
        getModalStyles() {
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
        getHeaderStyles() {
            return `
      text-align: center;
      margin-bottom: 24px;
    `;
        }
        getTitleStyles() {
            return `
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #fff;
    `;
        }
        getSubtitleStyles() {
            return `
      margin: 0;
      font-size: 14px;
      color: #888;
    `;
        }
        getScaleContainerStyles() {
            return `
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    `;
        }
        getRatingButtonStyles(score) {
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
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
        }
        getSelectedRatingButtonStyles(score) {
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
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px ${color}80;
    `;
        }
        getScoreColor(score) {
            // AC-03: Color coding - 0-6 red, 7-8 yellow, 9-10 green
            if (score <= 6)
                return '#ff4444'; // Red for detractors
            if (score <= 8)
                return '#ffaa00'; // Yellow for passives
            return '#00ff88'; // Green for promoters
        }
        getCommentSectionStyles() {
            return `
      margin-bottom: 20px;
    `;
        }
        getTextareaStyles() {
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
    `;
        }
        getSubmitButtonStyles() {
            return `
      width: 100%;
      padding: 14px;
      background: #00ff88;
      color: #000;
      border: none;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
        }
        getCloseButtonStyles() {
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
        getThankYouStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
    `;
        }
    }

    /**
     * Suggestion Modal Component
     * Story: ST-07 - Implementar Modal de Sugestão
     */
    class SuggestionModal {
        constructor(options) {
            this.container = null;
            this.titleInput = null;
            this.descriptionTextarea = null;
            this.options = options;
        }
        /**
         * Open the Suggestion modal
         */
        open() {
            this.createModal();
            this.attachEventListeners();
            // Focus on title input after opening
            setTimeout(() => this.titleInput?.focus(), 100);
        }
        /**
         * Close the Suggestion modal
         */
        close() {
            if (this.container) {
                this.container.remove();
                this.container = null;
            }
            this.options.onClose?.();
        }
        /**
         * Create the modal DOM structure
         */
        createModal() {
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
        attachEventListeners() {
            if (!this.container)
                return;
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
        async submit() {
            if (!this.titleInput)
                return;
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
                }
                else if (response.status === 429) {
                    // AC-03: Handle limit reached
                    const errorData = await response.json();
                    if (errorData.error === 'LIMIT_REACHED') {
                        this.showLimitReached(errorData.message);
                    }
                    else {
                        this.showError('Falha ao enviar sugestão. Tente novamente.');
                    }
                }
                else {
                    console.error('Failed to submit suggestion');
                    this.showError('Falha ao enviar sugestão. Tente novamente.');
                }
            }
            catch (error) {
                console.error('Error submitting suggestion:', error);
                this.showError('Falha ao enviar sugestão. Tente novamente.');
            }
        }
        /**
         * Show warning message
         */
        showWarning(title, detail) {
            if (!this.container)
                return;
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
        showLimitReached(message) {
            if (!this.container)
                return;
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
        showError(message) {
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
        showThankYou() {
            if (!this.container)
                return;
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
        getContainerStyles() {
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
        getModalStyles() {
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
        getCloseButtonStyles() {
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
        getHeaderStyles() {
            return `
      text-align: center;
      margin-bottom: 24px;
    `;
        }
        getTitleStyles() {
            return `
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #fff;
    `;
        }
        getSubtitleStyles() {
            return `
      margin: 0;
      font-size: 14px;
      color: #888;
    `;
        }
        getFormStyles() {
            return `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;
        }
        getFieldGroupStyles() {
            return `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
        }
        getLabelStyles() {
            return `
      font-size: 14px;
      font-weight: 500;
      color: #fff;
    `;
        }
        getInputStyles() {
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
        getTextareaStyles() {
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
        getSubmitButtonStyles() {
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
        getErrorStyles() {
            return `
      padding: 12px 16px;
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid #ff4444;
      color: #ff4444;
      font-size: 14px;
      margin-bottom: 16px;
    `;
        }
        getThankYouStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
    `;
        }
        getWarningStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ffaa00;
      background: rgba(255, 170, 0, 0.1);
    `;
        }
        getLimitReachedStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ff4444;
      background: rgba(255, 68, 68, 0.1);
    `;
        }
        getUpgradeButtonStyles() {
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

    /**
     * Bug Report Modal Component
     * Story: ST-05 - Criar Widget Vanilla JS
     */
    class BugModal {
        constructor(options) {
            this.container = null;
            this.titleInput = null;
            this.descriptionTextarea = null;
            this.selectedSeverity = 'medium';
            this.options = options;
        }
        /**
         * Open the Bug modal
         */
        open() {
            this.createModal();
            this.attachEventListeners();
            setTimeout(() => this.titleInput?.focus(), 100);
        }
        /**
         * Close the Bug modal
         */
        close() {
            if (this.container) {
                this.container.remove();
                this.container = null;
            }
            this.options.onClose?.();
        }
        /**
         * Create the modal DOM structure
         */
        createModal() {
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
            const severities = [
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
        attachEventListeners() {
            if (!this.container)
                return;
            // Severity buttons
            const severityBtns = this.container.querySelectorAll('.tf-bug-severity-btn');
            severityBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const severity = e.target.dataset.severity;
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
        selectSeverity(severity) {
            this.selectedSeverity = severity;
            const buttons = this.container?.querySelectorAll('.tf-bug-severity-btn');
            const severities = {
                low: '#00ff88',
                medium: '#ffaa00',
                high: '#ff6600',
                critical: '#ff4444'
            };
            buttons?.forEach(btn => {
                const btnSeverity = btn.dataset.severity;
                const color = severities[btnSeverity];
                btn.style.cssText = this.getSeverityButtonStyles(btnSeverity === severity, color);
            });
        }
        /**
         * Submit the bug report
         */
        async submit() {
            if (!this.titleInput)
                return;
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
                }
                else if (response.status === 429) {
                    const errorData = await response.json();
                    if (errorData.error === 'LIMIT_REACHED') {
                        this.showLimitReached(errorData.message);
                    }
                    else {
                        this.showError('Falha ao enviar report. Tente novamente.');
                    }
                }
                else if (response.status === 403) {
                    console.error('[TinyFeedback] Domain not authorized. Check your allowed domains configuration.');
                    this.showError('Domínio não autorizado. Verifique as configurações do projeto.');
                }
                else {
                    console.error('Failed to submit bug report');
                    this.showError('Falha ao enviar report. Tente novamente.');
                }
            }
            catch (error) {
                console.error('Error submitting bug report:', error);
                this.showError('Falha ao enviar report. Tente novamente.');
            }
        }
        showWarning(title, detail) {
            if (!this.container)
                return;
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
        showLimitReached(message) {
            if (!this.container)
                return;
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
        showError(message) {
            const existingError = this.container?.querySelector('#tf-bug-error');
            existingError?.remove();
            const errorDiv = document.createElement('div');
            errorDiv.id = 'tf-bug-error';
            errorDiv.style.cssText = this.getErrorStyles();
            errorDiv.textContent = message;
            const form = this.container?.querySelector('#tf-bug-form');
            form?.insertBefore(errorDiv, form.firstChild);
        }
        showThankYou() {
            if (!this.container)
                return;
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
        getContainerStyles() {
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
        getModalStyles() {
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
        getCloseButtonStyles() {
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
        getHeaderStyles() {
            return `
      text-align: center;
      margin-bottom: 24px;
    `;
        }
        getTitleStyles() {
            return `
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #fff;
    `;
        }
        getSubtitleStyles() {
            return `
      margin: 0;
      font-size: 14px;
      color: #888;
    `;
        }
        getFormStyles() {
            return `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;
        }
        getFieldGroupStyles() {
            return `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
        }
        getLabelStyles() {
            return `
      font-size: 14px;
      font-weight: 500;
      color: #fff;
    `;
        }
        getSeverityContainerStyles() {
            return `
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    `;
        }
        getSeverityButtonStyles(selected, color) {
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
        getInputStyles() {
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
        getTextareaStyles() {
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
        getSubmitButtonStyles() {
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
        getErrorStyles() {
            return `
      padding: 12px 16px;
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid #ff4444;
      color: #ff4444;
      font-size: 14px;
      margin-bottom: 16px;
    `;
        }
        getThankYouStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
    `;
        }
        getWarningStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ffaa00;
      background: rgba(255, 170, 0, 0.1);
    `;
        }
        getLimitReachedStyles() {
            return `
      text-align: center;
      padding: 40px 20px;
      border: 1px solid #ff4444;
      background: rgba(255, 68, 68, 0.1);
    `;
        }
        getUpgradeButtonStyles() {
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

    /**
     * TinyFeedback Widget
     * Main entry point for the vanilla JS widget
     * ST-05: Criar Widget Vanilla JS (<20KB)
     */
    class TinyFeedbackWidget {
        constructor(config) {
            this.npsModal = null;
            this.suggestionModal = null;
            this.bugModal = null;
            this.floatingButton = null;
            this.menuContainer = null;
            this.isMenuOpen = false;
            /**
             * Handle outside click to close menu
             */
            this.handleOutsideClick = (e) => {
                if (this.menuContainer && !this.menuContainer.contains(e.target)) {
                    if (this.floatingButton && !this.floatingButton.contains(e.target)) {
                        this.closeMenu();
                    }
                }
            };
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
        init() {
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
                }
                else {
                    console.error('[TinyFeedback] Domain not authorized. Widget will not load.');
                }
            });
        }
        /**
         * Validate domain against API
         */
        async validateDomain() {
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
            }
            catch (error) {
                // If validation fails, still allow (fail open for development)
                console.warn('[TinyFeedback] Domain validation failed:', error);
                return true;
            }
        }
        /**
         * Fetch widget appearance from API
         */
        async fetchAppearance() {
            try {
                const response = await fetch(`${this.config.apiUrl}/api/projects/${this.config.projectId}/widget-appearance`, {
                    headers: {
                        'X-API-Key': this.config.apiKey
                    }
                });
                if (response.ok) {
                    return await response.json();
                }
            }
            catch (error) {
                console.warn('[TinyFeedback] Failed to fetch appearance:', error);
            }
            return null;
        }
        /**
         * Create the floating button
         */
        createFloatingButton() {
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
        getButtonStyles() {
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
        getPositionStyles() {
            const positions = {
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
        toggleMenu() {
            if (this.isMenuOpen) {
                this.closeMenu();
            }
            else {
                this.openMenu();
            }
        }
        /**
         * Open the feedback menu
         */
        openMenu() {
            if (!this.floatingButton)
                return;
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
                    const type = e.currentTarget.getAttribute('data-type');
                    this.handleMenuSelection(type);
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
        closeMenu() {
            if (this.menuContainer) {
                this.menuContainer.remove();
                this.menuContainer = null;
            }
            this.isMenuOpen = false;
            document.removeEventListener('click', this.handleOutsideClick);
        }
        /**
         * Handle menu selection
         */
        handleMenuSelection(type) {
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
        getMenuStyles() {
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
        getMenuPositionStyles() {
            const positions = {
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
        getMenuItemStyles() {
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
        openNPS() {
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
        openSuggestion() {
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
        openBug() {
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
        close() {
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
        inferApiUrl() {
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
    // Auto-initialize if config is present in window
    if (typeof window !== 'undefined') {
        window.TinyFeedback = TinyFeedbackWidget;
        window.TinyFeedbackWidget = TinyFeedbackWidget;
        // Check for auto-initialize config
        const tfConfig = window.__TF_CONFIG__;
        if (tfConfig?.projectId && tfConfig?.apiKey) {
            const widget = new TinyFeedbackWidget(tfConfig);
            widget.init();
            // Store instance globally
            window.__TF_WIDGET__ = widget;
            // Auto-open NPS if triggered
            if (window.__TF_OPEN_NPS__) {
                widget.openNPS();
            }
            // Auto-open Suggestion if triggered
            if (window.__TF_OPEN_SUGGESTION__) {
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

    exports.BugModal = BugModal;
    exports.NPSModal = NPSModal;
    exports.SuggestionModal = SuggestionModal;
    exports.TinyFeedbackWidget = TinyFeedbackWidget;

    return exports;

})({});
