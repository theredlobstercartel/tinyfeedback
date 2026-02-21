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
                    this.showThankYou();
                    this.options.onSubmit?.(this.selectedScore, comment);
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
     * TinyFeedback Widget
     * Main entry point for the vanilla JS widget
     */
    class TinyFeedbackWidget {
        constructor(config) {
            this.npsModal = null;
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
         * Close any open modals
         */
        close() {
            this.npsModal?.close();
            this.npsModal = null;
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
        }
    }

    exports.NPSModal = NPSModal;
    exports.TinyFeedbackWidget = TinyFeedbackWidget;

    return exports;

})({});
