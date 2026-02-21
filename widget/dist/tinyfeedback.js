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
     * Floating Button Component
     * Story: ST-05 - Criar Widget Vanilla JS
     * AC-02: Botão flutuante
     */
    class FloatingButton {
        constructor(options = {}) {
            this.button = null;
            this.menuContainer = null;
            this.isMenuOpen = false;
            /**
             * Handle clicks outside the menu
             */
            this.handleOutsideClick = (e) => {
                if (this.menuContainer &&
                    !this.menuContainer.contains(e.target) &&
                    !this.button?.contains(e.target)) {
                    this.closeMenu();
                }
            };
            this.options = {
                position: options.position || 'bottom-right',
                color: options.color || '#00ff88',
                text: options.text || 'Feedback',
                onClick: options.onClick || (() => { })
            };
        }
        /**
         * Mount the floating button to the DOM
         */
        mount() {
            if (this.button)
                return; // Already mounted
            this.button = document.createElement('button');
            this.button.id = 'tf-floating-btn';
            this.button.innerHTML = this.getButtonIcon();
            this.button.style.cssText = this.getButtonStyles();
            this.button.setAttribute('aria-label', 'Abrir feedback');
            // Add click handler
            this.button.addEventListener('click', () => this.toggleMenu());
            document.body.appendChild(this.button);
        }
        /**
         * Unmount the button from the DOM
         */
        unmount() {
            this.closeMenu();
            if (this.button) {
                this.button.remove();
                this.button = null;
            }
        }
        /**
         * Update button options
         */
        update(options) {
            this.options = { ...this.options, ...options };
            if (this.button) {
                this.button.style.cssText = this.getButtonStyles();
            }
        }
        /**
         * Set callback for menu selection
         */
        onSelect(callback) {
            this.onSelectCallback = callback;
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
         * Open the feedback type menu
         */
        openMenu() {
            if (!this.button || this.isMenuOpen)
                return;
            this.isMenuOpen = true;
            // Create menu container
            this.menuContainer = document.createElement('div');
            this.menuContainer.id = 'tf-menu-container';
            this.menuContainer.style.cssText = this.getMenuContainerStyles();
            // Menu items
            const menuItems = [
                { type: 'nps', icon: '📊', label: 'Avaliação', color: '#00ff88' },
                { type: 'suggestion', icon: '💡', label: 'Sugestão', color: '#ffaa00' },
                { type: 'bug', icon: '🐛', label: 'Reportar Bug', color: '#ff4444' }
            ];
            menuItems.forEach((item, index) => {
                const menuItem = document.createElement('button');
                menuItem.className = 'tf-menu-item';
                menuItem.style.cssText = this.getMenuItemStyles(item.color, index);
                menuItem.innerHTML = `
        <span style="font-size: 20px;">${item.icon}</span>
        <span style="font-size: 14px; font-weight: 500;">${item.label}</span>
      `;
                menuItem.addEventListener('click', () => {
                    this.closeMenu();
                    this.onSelectCallback?.(item.type);
                });
                this.menuContainer?.appendChild(menuItem);
            });
            document.body.appendChild(this.menuContainer);
            // Animate items in
            requestAnimationFrame(() => {
                const items = this.menuContainer?.querySelectorAll('.tf-menu-item');
                items?.forEach((item, i) => {
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, i * 50);
                });
            });
            // Close menu when clicking outside
            document.addEventListener('click', this.handleOutsideClick);
        }
        /**
         * Close the menu
         */
        closeMenu() {
            if (!this.menuContainer)
                return;
            this.isMenuOpen = false;
            this.menuContainer.remove();
            this.menuContainer = null;
            document.removeEventListener('click', this.handleOutsideClick);
        }
        /**
         * Get button SVG icon
         */
        getButtonIcon() {
            return `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" 
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
        }
        /**
         * Get button position styles
         */
        getPositionStyles() {
            const positions = {
                'bottom-right': 'bottom: 24px; right: 24px;',
                'bottom-left': 'bottom: 24px; left: 24px;',
                'top-right': 'top: 24px; right: 24px;',
                'top-left': 'top: 24px; left: 24px;'
            };
            return positions[this.options.position];
        }
        /**
         * Get button styles
         */
        getButtonStyles() {
            const positionStyles = this.getPositionStyles();
            return `
      position: fixed;
      ${positionStyles}
      width: 56px;
      height: 56px;
      border-radius: 0;
      background: ${this.options.color};
      color: #000;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px ${this.options.color}40;
      z-index: 999998;
      transition: all 0.3s ease;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
        }
        /**
         * Get menu container styles
         */
        getMenuContainerStyles() {
            const positionStyles = this.getMenuPositionStyles();
            return `
      position: fixed;
      ${positionStyles}
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 999997;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
        }
        /**
         * Get menu position based on button position
         */
        getMenuPositionStyles() {
            const positions = {
                'bottom-right': 'bottom: 88px; right: 24px;',
                'bottom-left': 'bottom: 88px; left: 24px;',
                'top-right': 'top: 88px; right: 24px;',
                'top-left': 'top: 88px; left: 24px;'
            };
            return positions[this.options.position];
        }
        /**
         * Get menu item styles
         */
        getMenuItemStyles(color, index) {
            return `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #111;
      border: 1px solid ${color}40;
      color: #fff;
      cursor: pointer;
      min-width: 160px;
      transition: all 0.2s ease;
      opacity: 0;
      transform: translateY(10px);
    `;
        }
    }

    /**
     * TinyFeedback Widget - Main Entry Point
     * Story: ST-05 - Criar Widget Vanilla JS (<20KB)
     *
     * Lightweight vanilla JS widget for collecting user feedback
     * Features: Floating button, NPS modal, Suggestion modal, Bug report modal
     */
    /**
     * Main TinyFeedback Widget Class
     * AC-01: Script embeddável
     * AC-02: Botão flutuante
     * AC-03: Abrir modal
     * AC-04: CORS configurado
     */
    class TinyFeedbackWidget {
        constructor(config) {
            this.floatingButton = null;
            this.currentModal = null;
            this.appearance = null;
            this.isDomainValid = true;
            this.initialized = false;
            this.config = {
                apiUrl: '',
                position: 'bottom-right',
                color: '#00ff88',
                text: 'Feedback',
                autoMount: true,
                ...config
            };
            // Infer API URL from script src if not provided
            if (!this.config.apiUrl) {
                this.config.apiUrl = this.inferApiUrl();
            }
            // Validate config
            if (!this.config.projectId || !this.config.apiKey) {
                console.error('[TinyFeedback] projectId and apiKey are required');
                return;
            }
            // Auto-mount if enabled
            if (this.config.autoMount) {
                this.init();
            }
        }
        /**
         * Initialize the widget
         * AC-04: Validate domain before mounting
         */
        async init() {
            if (this.initialized)
                return;
            try {
                // Validate domain
                await this.validateDomain();
                if (!this.isDomainValid) {
                    console.error('[TinyFeedback] Domain not authorized. Widget will not be displayed.');
                    return;
                }
                // Fetch appearance settings
                await this.fetchAppearance();
                // Mount floating button
                this.mountButton();
                this.initialized = true;
            }
            catch (error) {
                console.error('[TinyFeedback] Failed to initialize widget:', error);
            }
        }
        /**
         * Validate domain against allowed domains
         * AC-04: CORS configurado - Domain validation
         */
        async validateDomain() {
            try {
                const response = await fetch(`${this.config.apiUrl}/api/projects/${this.config.projectId}/domains`, {
                    method: 'GET',
                    headers: {
                        'X-API-Key': this.config.apiKey
                    }
                });
                if (!response.ok) {
                    if (response.status === 403) {
                        console.error('[TinyFeedback] Domain not authorized');
                        this.isDomainValid = false;
                        return;
                    }
                    // If we can't validate, assume valid (fail open for better UX)
                    this.isDomainValid = true;
                    return;
                }
                const data = await response.json();
                // If no allowed_domains configured, allow all
                if (!data.data?.allowed_domains || data.data.allowed_domains.length === 0) {
                    this.isDomainValid = true;
                    return;
                }
                // Check current domain
                const currentDomain = window.location.hostname;
                const isAllowed = data.data.allowed_domains.some((domain) => {
                    return currentDomain === domain || currentDomain.endsWith(`.${domain}`);
                });
                if (!isAllowed) {
                    console.error(`[TinyFeedback] Domain "${currentDomain}" not in allowed domains:`, data.data.allowed_domains);
                    this.isDomainValid = false;
                }
            }
            catch (error) {
                // Fail open if validation fails
                console.warn('[TinyFeedback] Could not validate domain, allowing widget:', error);
                this.isDomainValid = true;
            }
        }
        /**
         * Fetch widget appearance settings
         */
        async fetchAppearance() {
            try {
                const response = await fetch(`${this.config.apiUrl}/api/projects/${this.config.projectId}/widget-appearance`, {
                    method: 'GET',
                    headers: {
                        'X-API-Key': this.config.apiKey
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    this.appearance = data.data;
                    // Update config with API settings
                    if (this.appearance) {
                        this.config.color = this.appearance.widget_color || this.config.color;
                        this.config.position = this.appearance.widget_position || this.config.position;
                        this.config.text = this.appearance.widget_text || this.config.text;
                    }
                }
            }
            catch (error) {
                // Use default settings if fetch fails
                console.warn('[TinyFeedback] Could not fetch appearance settings:', error);
            }
        }
        /**
         * Mount the floating button
         * AC-02: Botão flutuante com posição e cor configuráveis
         */
        mountButton() {
            this.floatingButton = new FloatingButton({
                position: this.config.position,
                color: this.config.color,
                text: this.config.text
            });
            this.floatingButton.onSelect((type) => {
                this.openModal(type);
            });
            this.floatingButton.mount();
        }
        /**
         * Open a specific modal
         * AC-03: Abrir modal com 3 opções
         */
        openModal(type) {
            // Close any existing modal
            this.closeCurrentModal();
            const modalOptions = {
                projectId: this.config.projectId,
                apiKey: this.config.apiKey,
                apiUrl: this.config.apiUrl,
                onClose: () => {
                    this.currentModal = null;
                }
            };
            switch (type) {
                case 'nps':
                    this.currentModal = new NPSModal(modalOptions);
                    this.currentModal.open();
                    break;
                case 'suggestion':
                    this.currentModal = new SuggestionModal(modalOptions);
                    this.currentModal.open();
                    break;
                case 'bug':
                    this.currentModal = new BugModal(modalOptions);
                    this.currentModal.open();
                    break;
            }
        }
        /**
         * Legacy method - Open NPS modal directly
         */
        openNPS() {
            this.openModal('nps');
        }
        /**
         * Legacy method - Open Suggestion modal directly
         */
        openSuggestion() {
            this.openModal('suggestion');
        }
        /**
         * Open Bug report modal directly
         */
        openBug() {
            this.openModal('bug');
        }
        /**
         * Close current modal
         */
        closeCurrentModal() {
            this.currentModal?.close();
            this.currentModal = null;
        }
        /**
         * Close all modals and menu
         */
        close() {
            this.closeCurrentModal();
        }
        /**
         * Destroy the widget
         */
        destroy() {
            this.close();
            this.floatingButton?.unmount();
            this.floatingButton = null;
            this.initialized = false;
        }
        /**
         * Update widget configuration
         */
        update(config) {
            this.config = { ...this.config, ...config };
            this.floatingButton?.update({
                position: this.config.position,
                color: this.config.color,
                text: this.config.text
            });
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
            return window.location.origin;
        }
        /**
         * Get widget version
         */
        static get version() {
            return '0.2.0';
        }
    }
    // Auto-initialize if config is present in window
    if (typeof window !== 'undefined') {
        window.TinyFeedback = TinyFeedbackWidget;
        // Check for auto-initialize config
        if (window.__TF_CONFIG__?.projectId && window.__TF_CONFIG__?.apiKey) {
            const widget = new TinyFeedbackWidget(window.__TF_CONFIG__);
            // Expose init function for manual initialization
            window.__TF_INIT__ = () => widget.init();
        }
    }

    exports.BugModal = BugModal;
    exports.FloatingButton = FloatingButton;
    exports.NPSModal = NPSModal;
    exports.SuggestionModal = SuggestionModal;
    exports.TinyFeedbackWidget = TinyFeedbackWidget;
    exports.default = TinyFeedbackWidget;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
