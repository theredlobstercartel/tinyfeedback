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
     * TinyFeedback Widget
     * Main entry point for the vanilla JS widget
     */
    class TinyFeedbackWidget {
        constructor(config) {
            this.npsModal = null;
            this.suggestionModal = null;
            this.config = {
                apiUrl: '', // Will use current domain
                ...config
            };
            // If no apiUrl provided, infer from script src
            if (!this.config.apiUrl) {
                this.config.apiUrl = this.inferApiUrl();
            }
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
         * ST-07: Implementar Modal de Sugestão
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
         * Close any open modals
         */
        close() {
            this.npsModal?.close();
            this.npsModal = null;
            this.suggestionModal?.close();
            this.suggestionModal = null;
        }
        /**
         * Infer API URL from the script src
         */
        inferApiUrl() {
            const scripts = document.querySelectorAll('script');
            for (let i = 0; i < scripts.length; i++) {
                const src = scripts[i].src;
                if (src.includes('tinyfeedback')) {
                    // Extract base URL from script src
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
        // Check for auto-initialize config
        const tfConfig = window.__TF_CONFIG__;
        if (tfConfig?.projectId && tfConfig?.apiKey) {
            const widget = new TinyFeedbackWidget(tfConfig);
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

    exports.NPSModal = NPSModal;
    exports.SuggestionModal = SuggestionModal;
    exports.TinyFeedbackWidget = TinyFeedbackWidget;

    return exports;

})({});
